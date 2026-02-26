/**
 * Main scraping pipeline. Orchestrates crawling, extraction, validation, and ingestion
 * for one or all wineries.
 *
 * Usage:
 *   npx tsx src/scraper/pipeline.ts                          # All wineries
 *   npx tsx src/scraper/pipeline.ts --winery <slug>          # Single winery
 *   npx tsx src/scraper/pipeline.ts --limit 15               # First N wineries (pilot)
 *   npx tsx src/scraper/pipeline.ts --dry-run                # Extract without DB write
 *   npx tsx src/scraper/pipeline.ts --force                  # Re-scrape even if unchanged
 *   npx tsx src/scraper/pipeline.ts --only-unscraped         # Only wineries not yet scraped
 *   npx tsx src/scraper/pipeline.ts --status                 # Show scrape status
 */

import { readFileSync, existsSync } from "fs";
import pLimit from "p-limit";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries } from "../db/schema";
import { config } from "./config";
import type {
  WineryTarget,
  WineryUrls,
  WineryExtractionResult,
  ExtractedWine,
  ExtractedTasting,
  PipelineOptions,
} from "./types";
import { getBrowser, closeBrowser } from "./extraction/browser";
import { crawlPage } from "./extraction/crawl";
import { extractWines } from "./extraction/extract-wines";
import { extractTastings } from "./extraction/extract-tastings";
import { extractWineryInfo } from "./extraction/extract-info";
import { getLLMCostSummary } from "./extraction/llm-client";
import { validateExtraction } from "./ingestion/validate";
import { upsertWinery, removeNonTargetWineries } from "./ingestion/writer";

function parseArgs(): PipelineOptions & { status?: boolean; onlyUnscraped?: boolean } {
  const args = process.argv.slice(2);
  return {
    winery: args.includes("--winery")
      ? args[args.indexOf("--winery") + 1]
      : undefined,
    limit: args.includes("--limit")
      ? parseInt(args[args.indexOf("--limit") + 1])
      : undefined,
    dryRun: args.includes("--dry-run"),
    force: args.includes("--force"),
    batchSize: args.includes("--batch-size")
      ? parseInt(args[args.indexOf("--batch-size") + 1])
      : 25,
    status: args.includes("--status"),
    onlyUnscraped: args.includes("--only-unscraped"),
  };
}

async function extractWinery(
  target: WineryTarget,
  urls: WineryUrls
): Promise<WineryExtractionResult> {
  const errors: string[] = [];
  const browser = await getBrowser();

  console.log(`\n--- Extracting: ${target.name} (${target.slug}) ---`);

  // Crawl wine page
  let winesText = "";
  let winesUrl: string | null = null;
  if (urls.winesUrl) {
    console.log(`  Crawling wines: ${urls.winesUrl}`);
    const crawl = await crawlPage(browser, urls.winesUrl);
    if (crawl.success) {
      winesText = crawl.text;
      winesUrl = urls.winesUrl;
    } else {
      errors.push(`Failed to crawl wines page: ${crawl.error}`);
    }
  } else {
    // Fall back to homepage for wine info
    if (urls.websiteUrl) {
      console.log(`  No wines URL, crawling homepage: ${urls.websiteUrl}`);
      const crawl = await crawlPage(browser, urls.websiteUrl);
      if (crawl.success) {
        winesText = crawl.text;
        winesUrl = urls.websiteUrl;
      }
    }
  }

  // Crawl tastings page
  let tastingsText = "";
  let tastingsUrl: string | null = null;
  if (urls.tastingsUrl) {
    console.log(`  Crawling tastings: ${urls.tastingsUrl}`);
    const crawl = await crawlPage(browser, urls.tastingsUrl);
    if (crawl.success) {
      tastingsText = crawl.text;
      tastingsUrl = urls.tastingsUrl;
    } else {
      errors.push(`Failed to crawl tastings page: ${crawl.error}`);
    }
  }

  // Crawl about page (combine with homepage for winery info)
  let infoText = "";
  let aboutUrl: string | null = null;
  if (urls.aboutUrl) {
    console.log(`  Crawling about: ${urls.aboutUrl}`);
    const crawl = await crawlPage(browser, urls.aboutUrl);
    if (crawl.success) {
      infoText = crawl.text;
      aboutUrl = urls.aboutUrl;
    }
  }
  // Also add homepage content for info extraction
  if (urls.websiteUrl && urls.websiteUrl !== urls.aboutUrl) {
    const homeCrawl = await crawlPage(browser, urls.websiteUrl);
    if (homeCrawl.success) {
      infoText = infoText
        ? `${infoText}\n\n---\n\n${homeCrawl.text}`
        : homeCrawl.text;
    }
  }

  // LLM extraction
  console.log(`  Extracting wines via LLM...`);
  let extractedWines: ExtractedWine[] = [];
  try {
    extractedWines = await extractWines(target.name, winesText);
    console.log(`    Found ${extractedWines.length} wines`);
  } catch (err) {
    errors.push(
      `Wine extraction failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  console.log(`  Extracting tastings via LLM...`);
  let extractedTastings: ExtractedTasting[] = [];
  try {
    extractedTastings = await extractTastings(target.name, tastingsText);
    console.log(`    Found ${extractedTastings.length} tastings`);
  } catch (err) {
    errors.push(
      `Tasting extraction failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  console.log(`  Extracting winery info via LLM...`);
  let info;
  try {
    info = await extractWineryInfo(target.name, infoText);
  } catch (err) {
    info = {
      description: null,
      shortDescription: null,
      hours: null,
      phone: null,
      email: null,
      reservationRequired: false,
      dogFriendly: false,
      picnicFriendly: false,
    };
    errors.push(
      `Info extraction failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const status =
    extractedWines.length > 0 || extractedTastings.length > 0
      ? errors.length > 0
        ? "partial"
        : "success"
      : "failed";

  return {
    slug: target.slug,
    wines: extractedWines,
    tastings: extractedTastings,
    info,
    sourceUrls: {
      wines: winesUrl,
      tastings: tastingsUrl,
      about: aboutUrl,
    },
    status: status as "success" | "partial" | "failed",
    errors,
  };
}

async function showStatus() {
  const targetsPath = config.paths.wineryTargets;
  const urlsPath = config.paths.wineryUrls;

  console.log("=== Scraper Status ===\n");

  if (existsSync(targetsPath)) {
    const targets: WineryTarget[] = JSON.parse(
      readFileSync(targetsPath, "utf-8")
    );
    console.log(`Winery targets: ${targets.length}`);
    console.log(
      `  Top 5: ${targets
        .slice(0, 5)
        .map((t) => t.name)
        .join(", ")}`
    );
  } else {
    console.log("Winery targets: NOT BUILT (run scrape:list first)");
  }

  if (existsSync(urlsPath)) {
    const urls: Record<string, WineryUrls> = JSON.parse(
      readFileSync(urlsPath, "utf-8")
    );
    const entries = Object.values(urls);
    const mapped = entries.filter((u) => u.status === "mapped").length;
    const needsReview = entries.filter(
      (u) => u.status === "needs-manual-review"
    ).length;
    console.log(`\nURL mapping: ${entries.length} total`);
    console.log(`  Mapped: ${mapped}`);
    console.log(`  Needs review: ${needsReview}`);
  } else {
    console.log("\nURL mapping: NOT DONE (run scrape:map-urls first)");
  }

  const cost = getLLMCostSummary();
  console.log(`\nLLM cost this session: $${cost.estimatedCostUSD}`);
}

async function main() {
  const opts = parseArgs();

  if (opts.status) {
    await showStatus();
    return;
  }

  // Load targets
  if (!existsSync(config.paths.wineryTargets)) {
    console.error(
      `Missing ${config.paths.wineryTargets}. Run 'npm run scrape:list' first.`
    );
    process.exit(1);
  }
  const targets: WineryTarget[] = JSON.parse(
    readFileSync(config.paths.wineryTargets, "utf-8")
  );

  // Load URL map
  if (!existsSync(config.paths.wineryUrls)) {
    console.error(
      `Missing ${config.paths.wineryUrls}. Run 'npm run scrape:map-urls' first.`
    );
    process.exit(1);
  }
  const urlMap: Record<string, WineryUrls> = JSON.parse(
    readFileSync(config.paths.wineryUrls, "utf-8")
  );

  // Filter targets
  let toProcess = targets;
  if (opts.winery) {
    toProcess = targets.filter((t) => t.slug === opts.winery);
    if (toProcess.length === 0) {
      console.error(`Winery "${opts.winery}" not found.`);
      process.exit(1);
    }
  }
  if (opts.limit) {
    toProcess = toProcess.slice(0, opts.limit);
  }

  // Only process wineries that have URL mappings
  toProcess = toProcess.filter((t) => urlMap[t.slug]);

  // Filter to only unscraped wineries if requested
  if (opts.onlyUnscraped) {
    const dbClient = createClient({
      url: process.env.DATABASE_URL || "file:./data/winery.db",
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
    const pipelineDb = drizzle(dbClient);
    const scrapedRows = await pipelineDb
      .select({ slug: wineries.slug })
      .from(wineries)
      .where(eq(wineries.dataSource, "scraped"));
    const scrapedSlugs = new Set(scrapedRows.map((r) => r.slug));
    const before = toProcess.length;
    toProcess = toProcess.filter((t) => !scrapedSlugs.has(t.slug));
    console.log(`--only-unscraped: filtered ${before} → ${toProcess.length} (skipped ${before - toProcess.length} already-scraped)\n`);
  }

  console.log(
    `Processing ${toProcess.length} wineries${opts.dryRun ? " (DRY RUN)" : ""}...\n`
  );

  // Process in batches
  const batchSize = opts.batchSize || 25;
  const results: Array<{
    slug: string;
    status: string;
    wines: number;
    tastings: number;
    errors: string[];
  }> = [];

  for (let i = 0; i < toProcess.length; i += batchSize) {
    const batch = toProcess.slice(i, i + batchSize);
    console.log(
      `\n=== Batch ${Math.floor(i / batchSize) + 1} (${batch.length} wineries) ===`
    );

    const concurrency = pLimit(config.rateLimiting.maxConcurrentBrowsers);

    const batchResults = await Promise.all(
      batch.map((target) =>
        concurrency(async () => {
          const urls = urlMap[target.slug];
          const extraction = await extractWinery(target, urls);

          // Validate
          const validation = validateExtraction(extraction);

          if (validation.warnings.length > 0) {
            console.log(`  Warnings for ${target.name}:`);
            validation.warnings.forEach((w) => console.log(`    - ${w}`));
          }

          // Write to DB (unless dry run)
          if (!opts.dryRun && validation.valid) {
            try {
              const writeResult = await upsertWinery(
                target,
                extraction,
                validation
              );
              console.log(`  DB: ${writeResult.status}`);
            } catch (err) {
              console.error(
                `  DB write failed for ${target.name}:`,
                err instanceof Error ? err.message : err
              );
              extraction.errors.push(
                `DB write failed: ${err instanceof Error ? err.message : String(err)}`
              );
            }
          } else if (opts.dryRun) {
            console.log(
              `  [DRY RUN] Would write: ${validation.cleanedWines.length} wines, ${validation.cleanedTastings.length} tastings`
            );
          }

          return {
            slug: target.slug,
            status: extraction.status,
            wines: validation.cleanedWines.length,
            tastings: validation.cleanedTastings.length,
            errors: extraction.errors,
          };
        })
      )
    );

    results.push(...batchResults);
  }

  // Close browser
  await closeBrowser();

  // Summary
  console.log("\n=== Pipeline Summary ===");
  const success = results.filter((r) => r.status === "success").length;
  const partial = results.filter((r) => r.status === "partial").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const totalWines = results.reduce((sum, r) => sum + r.wines, 0);
  const totalTastings = results.reduce((sum, r) => sum + r.tastings, 0);

  console.log(`Total processed: ${results.length}`);
  console.log(`  Success: ${success}`);
  console.log(`  Partial: ${partial}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total wines: ${totalWines}`);
  console.log(`  Total tastings: ${totalTastings}`);

  const cost = getLLMCostSummary();
  console.log(
    `\nLLM usage: ${cost.inputTokens} in / ${cost.outputTokens} out — $${cost.estimatedCostUSD}`
  );

  if (failed > 0) {
    console.log("\nFailed wineries:");
    results
      .filter((r) => r.status === "failed")
      .forEach((r) => {
        console.log(`  ${r.slug}: ${r.errors.join(", ")}`);
      });
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  closeBrowser().finally(() => process.exit(1));
});
