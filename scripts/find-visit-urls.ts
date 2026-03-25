/**
 * Crawl winery websites to find their visit/tasting/booking page URL.
 *
 * For each winery, fetches the homepage, extracts all links, and scores
 * them to find the best visit/booking URL.
 *
 * Usage:
 *   npx tsx scripts/find-visit-urls.ts --turso
 *   npx tsx scripts/find-visit-urls.ts --turso --dry-run
 *   npx tsx scripts/find-visit-urls.ts --turso --winery=opus-one
 *   npx tsx scripts/find-visit-urls.ts --turso --force
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries } from "../src/db/schema";
import { eq, isNotNull, isNull } from "drizzle-orm";

// --- CLI args ---
const useTurso = process.argv.includes("--turso");
const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");
const winerySlugArg = process.argv
  .find((a) => a.startsWith("--winery="))
  ?.split("=")[1];

// --- DB setup ---
let dbUrl: string;
let dbAuthToken: string | undefined;

if (useTurso) {
  dbUrl = "libsql://napa-winery-search-theinterchange.aws-us-west-2.turso.io";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  if (!dbAuthToken) {
    const { execSync } =
      require("child_process") as typeof import("child_process");
    dbAuthToken = execSync(`turso db tokens create napa-winery-search`, {
      encoding: "utf-8",
    }).trim();
  }
  console.log("Using Turso production database");
} else {
  dbUrl = process.env.DATABASE_URL || "file:./data/winery.db";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  console.log("Using local database");
}

const client = createClient({ url: dbUrl, authToken: dbAuthToken });
const db = drizzle(client);

const DELAY_MS = 300;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Score a URL path for visit/booking relevance. Higher = better. */
function scoreUrl(href: string): number {
  const lower = href.toLowerCase();
  let score = 0;

  // Exact visit pages — highest
  if (/\/(plan-your-visit|plan-a-visit|plan-visit)/.test(lower)) score += 100;
  if (/\/visit(ing)?([/?#]|$)/.test(lower)) score += 90;

  // Tasting/experience pages — high
  if (/\/tasting-room/.test(lower)) score += 85;
  if (/\/tastings?([/?#]|$)/.test(lower)) score += 80;
  if (/\/experiences?([/?#]|$)/.test(lower)) score += 80;

  // Booking pages — high
  if (/\/book(ing)?([/?#]|$)/.test(lower)) score += 75;
  if (/\/reserv(e|ations?)([/?#]|$)/.test(lower)) score += 75;

  // External booking platforms — high
  if (/exploretock\.com|tock\.co/.test(lower)) score += 70;
  if (/rfrk\.com|cellarpass\.com/.test(lower)) score += 70;

  // Penalize non-page links
  if (/\.(pdf|jpg|png|gif|svg|css|js)(\?|$)/i.test(lower)) score = 0;
  if (/mailto:|tel:|javascript:/.test(lower)) score = 0;
  if (/#$/.test(lower)) score = 0;

  return score;
}

/** Extract all href links from HTML */
function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const regex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    let href = match[1];
    // Resolve relative URLs
    try {
      if (href.startsWith("/")) {
        href = new URL(href, baseUrl).toString();
      } else if (!href.startsWith("http")) {
        href = new URL(href, baseUrl).toString();
      }
      links.push(href);
    } catch {
      // Skip invalid URLs
    }
  }
  return [...new Set(links)];
}

async function findVisitUrl(
  websiteUrl: string
): Promise<string | null> {
  try {
    const res = await fetch(websiteUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NapaSonomaGuide/1.0; +https://www.napasonomaguide.com)",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const html = await res.text();
    const finalUrl = res.url; // After redirects
    const links = extractLinks(html, finalUrl);

    // Score all links
    const scored = links
      .map((href) => ({ href, score: scoreUrl(href) }))
      .filter((l) => l.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored[0]?.href || null;
  } catch (err) {
    return null;
  }
}

async function main() {
  console.log(
    `Flags: ${force ? "--force " : ""}${dryRun ? "--dry-run " : ""}${winerySlugArg ? `--winery=${winerySlugArg} ` : ""}\n`
  );

  // Get wineries to process
  const allWineries = await db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      websiteUrl: wineries.websiteUrl,
      visitUrl: wineries.visitUrl,
    })
    .from(wineries)
    .where(isNotNull(wineries.websiteUrl));

  let toProcess = allWineries;

  if (winerySlugArg) {
    toProcess = toProcess.filter((w) => w.slug === winerySlugArg);
    if (toProcess.length === 0) {
      console.error(`No winery found with slug "${winerySlugArg}"`);
      process.exit(1);
    }
  } else if (!force) {
    toProcess = toProcess.filter((w) => !w.visitUrl);
  }

  console.log(`${toProcess.length} wineries to crawl\n`);

  if (toProcess.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  let found = 0;
  let notFound = 0;
  let errors = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const w = toProcess[i];
    const progress = `[${i + 1}/${toProcess.length}]`;

    if (dryRun) {
      console.log(`${progress} ${w.name} — ${w.websiteUrl} (dry run)`);
      continue;
    }

    const visitUrl = await findVisitUrl(w.websiteUrl!);

    if (visitUrl) {
      console.log(`${progress} ${w.name} → ${visitUrl}`);
      await db
        .update(wineries)
        .set({ visitUrl })
        .where(eq(wineries.id, w.id));
      found++;
    } else {
      console.log(`${progress} ${w.name} — no visit URL found`);
      notFound++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n=== Summary ===`);
  console.log(`Found: ${found}`);
  console.log(`Not found: ${notFound}`);
  console.log(`Errors: ${errors}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
