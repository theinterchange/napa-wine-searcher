import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries } from "../src/db/schema";
import { eq, or, and, isNotNull } from "drizzle-orm";

// --- Configuration ---
const DELAY_MS = 500;
const MAX_SUB_PAGES = 5;
const FETCH_TIMEOUT_MS = 8000;
const MIN_SCORE = 2;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)";

// --- CLI args ---
const useTurso = process.argv.includes("--turso");
const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");
const winerySlugIdx = process.argv.indexOf("--winery");
const winerySlug = winerySlugIdx !== -1 ? process.argv[winerySlugIdx + 1] : null;

// --- DB setup ---
let dbUrl: string;
let dbAuthToken: string | undefined;

if (useTurso) {
  dbUrl = "libsql://napa-winery-search-theinterchange.aws-us-west-2.turso.io";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  if (!dbAuthToken) {
    console.log("No DATABASE_AUTH_TOKEN in env, generating via Turso CLI...");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { execSync } = require("child_process") as typeof import("child_process");
    dbAuthToken = execSync(
      `${process.env.HOME}/.turso/turso db tokens create napa-winery-search`,
      { encoding: "utf-8" }
    ).trim();
  }
  console.log("Using Turso production database");
} else {
  dbUrl = process.env.DATABASE_URL || "file:./data/winery.db";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  console.log("Using local database");
}

if (dryRun) console.log("DRY RUN — no DB writes");
if (force) console.log("FORCE — re-scraping even if source already populated");
if (winerySlug) console.log(`Single winery: ${winerySlug}`);
console.log();

const client = createClient({ url: dbUrl, authToken: dbAuthToken });
const db = drizzle(client);

// --- Keyword scoring ---
const DOG_KEYWORDS = ["dog", "pet", "canine", "puppy", "leash", "four-legged", "furry friend"];
const DOG_PHRASES = [
  "dogs welcome",
  "dog friendly",
  "dog-friendly",
  "pets allowed",
  "pets welcome",
  "pet friendly",
  "pet-friendly",
  "leashed dogs",
  "dogs on leash",
  "well-behaved dogs",
  "four-legged friends",
  "furry friends welcome",
];

const KID_KEYWORDS = [
  "kid",
  "child",
  "children",
  "family",
  "families",
  "minor",
  "infant",
  "baby",
  "stroller",
  "youth",
];
const KID_PHRASES = [
  "kid friendly",
  "kid-friendly",
  "children welcome",
  "children are welcome",
  "child friendly",
  "child-friendly",
  "family friendly",
  "family-friendly",
  "all ages",
  "families welcome",
  "families are welcome",
  "minors welcome",
  "minors must be accompanied",
  "kids welcome",
  "kids are welcome",
  "strollers welcome",
];

function scoreText(text: string, keywords: string[], phrases: string[]): number {
  const lower = text.toLowerCase();
  let score = 0;

  for (const kw of keywords) {
    const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    const matches = lower.match(regex);
    if (matches) score += matches.length;
  }

  for (const phrase of phrases) {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const matches = lower.match(regex);
    if (matches) score += matches.length * 3;
  }

  return score;
}

// --- Helpers (from scrape-kid-friendly.ts) ---
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractLinks(html: string, baseUrl: string): string[] {
  const linkRegex = /href=["']([^"'#]*)/gi;
  const visitPatterns =
    /visit|plan|faq|polic|book|reserv|experience|tasting|about|contact|tour|group|private|family|kid|child|pet|dog|animal|ameniti|outdoor|welcome|guest/i;

  let baseOrigin: string;
  try {
    baseOrigin = new URL(baseUrl).origin;
  } catch {
    return [];
  }

  const seen = new Set<string>();
  const links: string[] = [];
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1].trim();
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) continue;

    try {
      const resolved = new URL(href, baseUrl).href;
      if (!resolved.startsWith(baseOrigin)) continue;
      if (!visitPatterns.test(resolved)) continue;
      if (/\.(jpg|jpeg|png|gif|svg|pdf|css|js|webp|avif|mp4|mp3)(\?|$)/i.test(resolved))
        continue;
      const normalized = resolved.split("?")[0].split("#")[0].replace(/\/$/, "");
      if (seen.has(normalized) || normalized === baseUrl.replace(/\/$/, "")) continue;
      seen.add(normalized);
      links.push(resolved);
    } catch {
      continue;
    }
  }

  return links.slice(0, MAX_SUB_PAGES);
}

// --- Main ---
interface PageScore {
  url: string;
  dogScore: number;
  kidScore: number;
}

async function main() {
  // Query wineries that are dog-friendly or kid-friendly with a website
  let query = db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      websiteUrl: wineries.websiteUrl,
      dogFriendly: wineries.dogFriendly,
      kidFriendly: wineries.kidFriendly,
      dogFriendlySource: wineries.dogFriendlySource,
      kidFriendlySource: wineries.kidFriendlySource,
    })
    .from(wineries)
    .where(
      and(
        isNotNull(wineries.websiteUrl),
        or(eq(wineries.dogFriendly, true), eq(wineries.kidFriendly, true))
      )
    );

  let allWineries = await query;

  if (winerySlug) {
    allWineries = allWineries.filter((w) => w.slug === winerySlug);
    if (allWineries.length === 0) {
      console.error(`No matching winery found for slug: ${winerySlug}`);
      process.exit(1);
    }
  }

  console.log(`Found ${allWineries.length} wineries to process\n`);

  let dogUpdated = 0;
  let kidUpdated = 0;
  let skipped = 0;
  let fetchErrors = 0;
  let dogFallbacks = 0;
  let kidFallbacks = 0;

  for (let i = 0; i < allWineries.length; i++) {
    const winery = allWineries[i];
    const url = winery.websiteUrl!;
    const needsDog = winery.dogFriendly && (force || !winery.dogFriendlySource);
    const needsKid = winery.kidFriendly && (force || !winery.kidFriendlySource);

    if (!needsDog && !needsKid) {
      skipped++;
      continue;
    }

    console.log(
      `[${i + 1}/${allWineries.length}] ${winery.name}` +
        (needsDog ? " [dog]" : "") +
        (needsKid ? " [kid]" : "")
    );

    // Step 1: Fetch homepage
    const homepageHtml = await fetchPage(url);
    if (!homepageHtml) {
      console.log("  Failed to fetch homepage");
      fetchErrors++;
      await sleep(DELAY_MS);
      continue;
    }

    const homepageText = htmlToText(homepageHtml);

    // Score homepage
    const pageScores: PageScore[] = [
      {
        url: url,
        dogScore: needsDog ? scoreText(homepageText, DOG_KEYWORDS, DOG_PHRASES) : 0,
        kidScore: needsKid ? scoreText(homepageText, KID_KEYWORDS, KID_PHRASES) : 0,
      },
    ];

    // Step 2: Discover and fetch sub-pages
    const subPageUrls = extractLinks(homepageHtml, url);

    if (subPageUrls.length > 0) {
      console.log(`  Found ${subPageUrls.length} sub-pages to check`);
      for (const subUrl of subPageUrls) {
        const subHtml = await fetchPage(subUrl);
        if (subHtml) {
          const subText = htmlToText(subHtml);
          pageScores.push({
            url: subUrl,
            dogScore: needsDog ? scoreText(subText, DOG_KEYWORDS, DOG_PHRASES) : 0,
            kidScore: needsKid ? scoreText(subText, KID_KEYWORDS, KID_PHRASES) : 0,
          });
        }
        await sleep(200);
      }
    }

    // Step 3: Pick best page for each category
    const updates: Record<string, string> = {};

    if (needsDog) {
      const bestDog = pageScores.reduce((a, b) => (b.dogScore > a.dogScore ? b : a));
      if (bestDog.dogScore >= MIN_SCORE) {
        updates.dogFriendlySource = bestDog.url;
        console.log(`  Dog source: ${bestDog.url} (score: ${bestDog.dogScore})`);
      } else {
        updates.dogFriendlySource = url;
        dogFallbacks++;
        console.log(`  Dog source: ${url} (fallback, best score: ${bestDog.dogScore})`);
      }
    }

    if (needsKid) {
      const bestKid = pageScores.reduce((a, b) => (b.kidScore > a.kidScore ? b : a));
      if (bestKid.kidScore >= MIN_SCORE) {
        updates.kidFriendlySource = bestKid.url;
        console.log(`  Kid source: ${bestKid.url} (score: ${bestKid.kidScore})`);
      } else {
        updates.kidFriendlySource = url;
        kidFallbacks++;
        console.log(`  Kid source: ${url} (fallback, best score: ${bestKid.kidScore})`);
      }
    }

    // Step 4: Write to DB
    if (!dryRun && Object.keys(updates).length > 0) {
      const setClause: Record<string, string> = {};
      if (updates.dogFriendlySource) setClause.dog_friendly_source = updates.dogFriendlySource;
      if (updates.kidFriendlySource) setClause.kid_friendly_source = updates.kidFriendlySource;

      await db
        .update(wineries)
        .set({
          ...(updates.dogFriendlySource && { dogFriendlySource: updates.dogFriendlySource }),
          ...(updates.kidFriendlySource && { kidFriendlySource: updates.kidFriendlySource }),
        })
        .where(eq(wineries.id, winery.id));
    }

    if (updates.dogFriendlySource) dogUpdated++;
    if (updates.kidFriendlySource) kidUpdated++;

    await sleep(DELAY_MS);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("Results:");
  console.log(`  Total wineries:        ${allWineries.length}`);
  console.log(`  Skipped (has source):  ${skipped}`);
  console.log(`  Dog sources updated:   ${dogUpdated} (${dogFallbacks} fallbacks)`);
  console.log(`  Kid sources updated:   ${kidUpdated} (${kidFallbacks} fallbacks)`);
  console.log(`  Fetch errors:          ${fetchErrors}`);
  if (dryRun) console.log("\n  (DRY RUN — no changes written)");
  console.log(`${"=".repeat(60)}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
