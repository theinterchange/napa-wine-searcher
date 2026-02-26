/**
 * Spot-check scraped winery data by re-crawling and re-extracting a few wineries,
 * then comparing the fresh results against what's in the DB.
 *
 * Usage:
 *   npm run scrape:spot-check                    # Check ~5 diverse wineries
 *   npm run scrape:spot-check -- --winery <slug> # Check a specific winery
 */

import { readFileSync, existsSync } from "fs";
import { eq, and, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import {
  wineries,
  wines,
  wineTypes,
  tastingExperiences,
  subRegions,
} from "../db/schema";
import { config } from "./config";
import type { WineryUrls } from "./types";
import { getBrowser, closeBrowser } from "./extraction/browser";
import { crawlPage } from "./extraction/crawl";
import { extractWines } from "./extraction/extract-wines";
import { extractTastings } from "./extraction/extract-tastings";
import { extractWineryInfo } from "./extraction/extract-info";
import { getLLMCostSummary } from "./extraction/llm-client";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const db = drizzle(client);

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    winery: args.includes("--winery")
      ? args[args.indexOf("--winery") + 1]
      : undefined,
  };
}

/** Pick ~5 diverse already-scraped wineries with varying wine/tasting counts */
async function pickDiverseWineries(count: number): Promise<string[]> {
  // Get scraped wineries with their wine/tasting counts
  const scraped = await db
    .select({
      slug: wineries.slug,
      name: wineries.name,
      wineCount: sql<number>`(SELECT COUNT(*) FROM wines WHERE winery_id = ${wineries.id})`,
      tastingCount: sql<number>`(SELECT COUNT(*) FROM tasting_experiences WHERE winery_id = ${wineries.id})`,
    })
    .from(wineries)
    .where(eq(wineries.dataSource, "scraped"));

  if (scraped.length === 0) {
    console.error("No scraped wineries found in DB.");
    process.exit(1);
  }

  // Sort into buckets by wine count to get diversity
  const highWines = scraped.filter((w) => w.wineCount >= 10).sort(() => Math.random() - 0.5);
  const midWines = scraped.filter((w) => w.wineCount >= 3 && w.wineCount < 10).sort(() => Math.random() - 0.5);
  const lowWines = scraped.filter((w) => w.wineCount >= 1 && w.wineCount < 3).sort(() => Math.random() - 0.5);
  const noWines = scraped.filter((w) => w.wineCount === 0).sort(() => Math.random() - 0.5);

  const picks: string[] = [];
  const buckets = [highWines, midWines, lowWines, noWines];

  // Round-robin pick from each bucket
  let bucketIdx = 0;
  while (picks.length < count && buckets.some((b) => b.length > 0)) {
    const bucket = buckets[bucketIdx % buckets.length];
    if (bucket.length > 0) {
      picks.push(bucket.shift()!.slug);
    }
    bucketIdx++;
  }

  return picks;
}

function formatPrice(price: number | null | undefined): string {
  return price != null ? `$${price}` : "N/A";
}

function diffIndicator(a: string, b: string): string {
  return a === b ? "  " : "!=";
}

async function spotCheckWinery(slug: string, urlMap: Record<string, WineryUrls>) {
  const urls = urlMap[slug];
  if (!urls) {
    console.log(`\n  SKIP: No URL mapping for "${slug}"`);
    return;
  }

  // Get DB data
  const [dbWinery] = await db
    .select()
    .from(wineries)
    .where(eq(wineries.slug, slug))
    .limit(1);

  if (!dbWinery) {
    console.log(`\n  SKIP: Winery "${slug}" not found in DB`);
    return;
  }

  const dbWines = await db
    .select({
      name: wines.name,
      price: wines.price,
      vintage: wines.vintage,
      wineType: wineTypes.name,
    })
    .from(wines)
    .leftJoin(wineTypes, eq(wines.wineTypeId, wineTypes.id))
    .where(eq(wines.wineryId, dbWinery.id));

  const dbTastings = await db
    .select({
      name: tastingExperiences.name,
      price: tastingExperiences.price,
      durationMinutes: tastingExperiences.durationMinutes,
      reservationRequired: tastingExperiences.reservationRequired,
    })
    .from(tastingExperiences)
    .where(eq(tastingExperiences.wineryId, dbWinery.id));

  // Re-crawl and re-extract
  console.log(`\n  Re-crawling ${dbWinery.name}...`);
  const browser = await getBrowser();

  let winesText = "";
  if (urls.winesUrl) {
    const crawl = await crawlPage(browser, urls.winesUrl);
    if (crawl.success) winesText = crawl.text;
  } else if (urls.websiteUrl) {
    const crawl = await crawlPage(browser, urls.websiteUrl);
    if (crawl.success) winesText = crawl.text;
  }

  let tastingsText = "";
  if (urls.tastingsUrl) {
    const crawl = await crawlPage(browser, urls.tastingsUrl);
    if (crawl.success) tastingsText = crawl.text;
  }

  let infoText = "";
  if (urls.aboutUrl) {
    const crawl = await crawlPage(browser, urls.aboutUrl);
    if (crawl.success) infoText = crawl.text;
  }
  if (urls.websiteUrl && urls.websiteUrl !== urls.aboutUrl) {
    const crawl = await crawlPage(browser, urls.websiteUrl);
    if (crawl.success) {
      infoText = infoText ? `${infoText}\n\n---\n\n${crawl.text}` : crawl.text;
    }
  }

  console.log(`  Re-extracting via LLM...`);
  const freshWines = await extractWines(dbWinery.name, winesText);
  const freshTastings = await extractTastings(dbWinery.name, tastingsText);
  const freshInfo = await extractWineryInfo(dbWinery.name, infoText);

  // Print comparison
  console.log(`\n${"=".repeat(70)}`);
  console.log(`  ${dbWinery.name} (${slug})`);
  console.log(`${"=".repeat(70)}`);

  // Wines comparison
  const wineCountMatch = dbWines.length === freshWines.length ? "MATCH" : "DIFF";
  console.log(`\n  WINES: DB=${dbWines.length}  Fresh=${freshWines.length}  [${wineCountMatch}]`);
  console.log(`  ${"—".repeat(60)}`);

  if (dbWines.length > 0 || freshWines.length > 0) {
    console.log(`  ${"DB".padEnd(35)} | ${"Fresh".padEnd(35)}`);
    const maxLen = Math.max(dbWines.length, freshWines.length);
    for (let i = 0; i < maxLen; i++) {
      const dbW = dbWines[i];
      const fW = freshWines[i];
      const dbStr = dbW
        ? `${dbW.name.slice(0, 22).padEnd(22)} ${formatPrice(dbW.price).padStart(7)} ${(dbW.wineType || "").slice(0, 4)}`
        : "(none)".padEnd(35);
      const fStr = fW
        ? `${fW.name.slice(0, 22).padEnd(22)} ${formatPrice(fW.price).padStart(7)} ${fW.wineType.slice(0, 4)}`
        : "(none)".padEnd(35);
      console.log(`  ${dbStr} | ${fStr}`);
    }
  }

  // Tastings comparison
  const tastingCountMatch = dbTastings.length === freshTastings.length ? "MATCH" : "DIFF";
  console.log(`\n  TASTINGS: DB=${dbTastings.length}  Fresh=${freshTastings.length}  [${tastingCountMatch}]`);
  console.log(`  ${"—".repeat(60)}`);

  if (dbTastings.length > 0 || freshTastings.length > 0) {
    console.log(`  ${"DB".padEnd(35)} | ${"Fresh".padEnd(35)}`);
    const maxLen = Math.max(dbTastings.length, freshTastings.length);
    for (let i = 0; i < maxLen; i++) {
      const dbT = dbTastings[i];
      const fT = freshTastings[i];
      const dbStr = dbT
        ? `${dbT.name.slice(0, 25).padEnd(25)} ${formatPrice(dbT.price).padStart(7)}`
        : "(none)".padEnd(35);
      const fStr = fT
        ? `${fT.name.slice(0, 25).padEnd(25)} ${formatPrice(fT.price).padStart(7)}`
        : "(none)".padEnd(35);
      console.log(`  ${dbStr} | ${fStr}`);
    }
  }

  // Info comparison
  console.log(`\n  INFO:`);
  console.log(`  ${"—".repeat(60)}`);

  const dbHours = dbWinery.hoursJson ? JSON.parse(dbWinery.hoursJson) : null;
  const dbHoursStr = dbHours ? Object.values(dbHours).filter(Boolean).join(", ").slice(0, 40) : "N/A";
  const freshHoursStr = freshInfo.hours ? Object.values(freshInfo.hours).filter(Boolean).join(", ").slice(0, 40) : "N/A";

  console.log(`  Phone:        DB=${dbWinery.phone || "N/A"}  Fresh=${freshInfo.phone || "N/A"}`);
  console.log(`  Reservation:  DB=${dbWinery.reservationRequired}  Fresh=${freshInfo.reservationRequired}`);
  console.log(`  Dog-friendly: DB=${dbWinery.dogFriendly}  Fresh=${freshInfo.dogFriendly}`);
  console.log(`  Hours:        DB=${dbHoursStr}`);
  console.log(`                Fresh=${freshHoursStr}`);

  const hasDesc = dbWinery.description ? "yes" : "no";
  const freshDesc = freshInfo.description ? "yes" : "no";
  console.log(`  Description:  DB=${hasDesc}  Fresh=${freshDesc}`);
}

async function main() {
  const opts = parseArgs();

  if (!existsSync(config.paths.wineryUrls)) {
    console.error(`Missing ${config.paths.wineryUrls}. Run 'npm run scrape:map-urls' first.`);
    process.exit(1);
  }
  const urlMap: Record<string, WineryUrls> = JSON.parse(
    readFileSync(config.paths.wineryUrls, "utf-8")
  );

  let slugs: string[];
  if (opts.winery) {
    slugs = [opts.winery];
  } else {
    slugs = await pickDiverseWineries(5);
  }

  console.log(`\nSpot-checking ${slugs.length} wineries: ${slugs.join(", ")}\n`);

  for (const slug of slugs) {
    try {
      await spotCheckWinery(slug, urlMap);
    } catch (err) {
      console.error(`\n  ERROR checking ${slug}:`, err instanceof Error ? err.message : err);
    }
  }

  await closeBrowser();

  const cost = getLLMCostSummary();
  console.log(`\n\nLLM cost: ${cost.inputTokens} in / ${cost.outputTokens} out — $${cost.estimatedCostUSD}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  closeBrowser().finally(() => process.exit(1));
});
