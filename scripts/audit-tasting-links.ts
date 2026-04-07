import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries, tastingExperiences } from "../src/db/schema";
import { eq, isNotNull, isNull } from "drizzle-orm";
import { writeFileSync } from "fs";

// --- CLI args ---
const writeMode = process.argv.includes("--write");
const useTurso = process.argv.includes("--turso");

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
  console.log("Using Turso production database\n");
} else {
  dbUrl = process.env.DATABASE_URL || "file:./data/winery.db";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  console.log("Using local database\n");
}

if (!writeMode) {
  console.log("🔍 DRY RUN — no database writes (use --write to apply fixes)\n");
}

const client = createClient({ url: dbUrl, authToken: dbAuthToken });
const db = drizzle(client);

const DELAY_MS = 300;
const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Visit page URL patterns
const VISIT_PATTERNS =
  /\/(visit|tasting|tastings|reservation|reservations|book|booking|experiences|plan-your-visit|plan-a-visit|taste|tours?)(\/|$|\?)/i;

async function checkUrl(url: string): Promise<{ status: number; finalUrl: string; ok: boolean }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });
    clearTimeout(timeout);
    return { status: res.status, finalUrl: res.url, ok: res.ok };
  } catch {
    // Some servers reject HEAD, try GET
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT },
        redirect: "follow",
      });
      clearTimeout(timeout);
      return { status: res.status, finalUrl: res.url, ok: res.ok };
    } catch {
      return { status: 0, finalUrl: url, ok: false };
    }
  }
}

function extractVisitLinks(html: string, baseUrl: string): string[] {
  const linkRegex = /href=["']([^"'#]*)/gi;
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
    const href = match[1].trim();
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) continue;

    try {
      const resolved = new URL(href, baseUrl).href;
      if (!resolved.startsWith(baseOrigin)) continue;
      if (!VISIT_PATTERNS.test(resolved)) continue;
      if (/\.(jpg|jpeg|png|gif|svg|pdf|css|js|webp|avif|mp4)(\?|$)/i.test(resolved)) continue;
      const normalized = resolved.split("?")[0].split("#")[0].replace(/\/$/, "");
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      links.push(normalized);
    } catch {
      continue;
    }
  }

  return links;
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

interface BrokenLink {
  tastingId: number;
  tastingName: string;
  wineryName: string;
  sourceUrl: string;
  status: number;
  finalUrl: string;
}

interface MissingLink {
  wineryId: number;
  wineryName: string;
  websiteUrl: string;
  tastingCount: number;
  suggestedVisitUrl: string | null;
  allVisitLinks: string[];
}

interface FixedLink {
  type: "tasting_sourceUrl" | "winery_visitUrl";
  id: number;
  name: string;
  oldUrl: string | null;
  newUrl: string;
}

async function main() {
  // --- Step 1: Validate existing sourceUrls ---
  console.log("=== Step 1: Validating existing tasting sourceUrls ===\n");

  const tastingsWithUrl = await db
    .select({
      id: tastingExperiences.id,
      name: tastingExperiences.name,
      sourceUrl: tastingExperiences.sourceUrl,
      wineryId: tastingExperiences.wineryId,
      wineryName: wineries.name,
    })
    .from(tastingExperiences)
    .innerJoin(wineries, eq(tastingExperiences.wineryId, wineries.id))
    .where(isNotNull(tastingExperiences.sourceUrl));

  console.log(`Checking ${tastingsWithUrl.length} tasting URLs...\n`);

  const broken: BrokenLink[] = [];
  const redirectedToHome: BrokenLink[] = [];

  // Deduplicate URLs to avoid hitting the same URL hundreds of times
  const urlToTastings = new Map<string, typeof tastingsWithUrl>();
  for (const t of tastingsWithUrl) {
    const url = t.sourceUrl!;
    if (!urlToTastings.has(url)) urlToTastings.set(url, []);
    urlToTastings.get(url)!.push(t);
  }

  console.log(`${urlToTastings.size} unique URLs to check\n`);

  let checked = 0;
  for (const [url, tastings] of urlToTastings) {
    checked++;
    if (checked % 50 === 0) {
      console.log(`  Checked ${checked}/${urlToTastings.size}...`);
    }

    const result = await checkUrl(url);

    if (!result.ok) {
      for (const t of tastings) {
        broken.push({
          tastingId: t.id,
          tastingName: t.name,
          wineryName: t.wineryName!,
          sourceUrl: url,
          status: result.status,
          finalUrl: result.finalUrl,
        });
      }
    } else {
      // Check if redirected to homepage (lost the specific page)
      try {
        const originalPath = new URL(url).pathname.replace(/\/$/, "");
        const finalPath = new URL(result.finalUrl).pathname.replace(/\/$/, "");
        if (originalPath !== finalPath && (finalPath === "" || finalPath === "/")) {
          for (const t of tastings) {
            redirectedToHome.push({
              tastingId: t.id,
              tastingName: t.name,
              wineryName: t.wineryName!,
              sourceUrl: url,
              status: result.status,
              finalUrl: result.finalUrl,
            });
          }
        }
      } catch {
        // URL parsing failed, skip redirect check
      }
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n  Broken (404/error): ${broken.length} tastings`);
  console.log(`  Redirected to homepage: ${redirectedToHome.length} tastings`);

  if (broken.length > 0) {
    console.log("\n  Broken URLs:");
    for (const b of broken.slice(0, 20)) {
      console.log(`    [${b.status}] ${b.wineryName} — ${b.sourceUrl}`);
    }
    if (broken.length > 20) console.log(`    ... and ${broken.length - 20} more`);
  }

  if (redirectedToHome.length > 0) {
    console.log("\n  Redirected to homepage:");
    for (const r of redirectedToHome.slice(0, 20)) {
      console.log(`    ${r.wineryName} — ${r.sourceUrl} → ${r.finalUrl}`);
    }
    if (redirectedToHome.length > 20) console.log(`    ... and ${redirectedToHome.length - 20} more`);
  }

  // --- Step 2: Find visit pages for tastings missing sourceUrl ---
  console.log("\n=== Step 2: Finding visit pages for tastings without sourceUrl ===\n");

  const tastingsWithoutUrl = await db
    .select({
      wineryId: tastingExperiences.wineryId,
      wineryName: wineries.name,
      websiteUrl: wineries.websiteUrl,
    })
    .from(tastingExperiences)
    .innerJoin(wineries, eq(tastingExperiences.wineryId, wineries.id))
    .where(isNull(tastingExperiences.sourceUrl));

  // Group by winery
  const wineriesNeedingVisitUrl = new Map<number, { name: string; websiteUrl: string; count: number }>();
  for (const t of tastingsWithoutUrl) {
    if (!t.websiteUrl) continue;
    if (!wineriesNeedingVisitUrl.has(t.wineryId)) {
      wineriesNeedingVisitUrl.set(t.wineryId, { name: t.wineryName!, websiteUrl: t.websiteUrl, count: 0 });
    }
    wineriesNeedingVisitUrl.get(t.wineryId)!.count++;
  }

  console.log(`${wineriesNeedingVisitUrl.size} wineries with tastings missing sourceUrl\n`);

  const missing: MissingLink[] = [];
  const fixes: FixedLink[] = [];

  let scanned = 0;
  for (const [wineryId, winery] of wineriesNeedingVisitUrl) {
    scanned++;
    console.log(`[${scanned}/${wineriesNeedingVisitUrl.size}] ${winery.name}`);

    const html = await fetchPage(winery.websiteUrl);
    if (!html) {
      console.log("  Failed to fetch homepage");
      missing.push({
        wineryId,
        wineryName: winery.name,
        websiteUrl: winery.websiteUrl,
        tastingCount: winery.count,
        suggestedVisitUrl: null,
        allVisitLinks: [],
      });
      await sleep(DELAY_MS);
      continue;
    }

    const visitLinks = extractVisitLinks(html, winery.websiteUrl);
    const bestLink = visitLinks[0] || null;

    missing.push({
      wineryId,
      wineryName: winery.name,
      websiteUrl: winery.websiteUrl,
      tastingCount: winery.count,
      suggestedVisitUrl: bestLink,
      allVisitLinks: visitLinks,
    });

    if (bestLink) {
      console.log(`  ✓ Found: ${bestLink}`);
      fixes.push({
        type: "winery_visitUrl",
        id: wineryId,
        name: winery.name,
        oldUrl: null,
        newUrl: bestLink,
      });
    } else {
      console.log("  No visit page found");
    }

    await sleep(DELAY_MS);
  }

  // --- Step 3: Also scan ALL wineries for visitUrl ---
  console.log("\n=== Step 3: Finding visit pages for all wineries (populate visitUrl) ===\n");

  const allWineries = await db
    .select({
      id: wineries.id,
      name: wineries.name,
      websiteUrl: wineries.websiteUrl,
      visitUrl: wineries.visitUrl,
    })
    .from(wineries)
    .where(isNotNull(wineries.websiteUrl));

  const wineriesWithoutVisitUrl = allWineries.filter(
    (w) => !w.visitUrl && !wineriesNeedingVisitUrl.has(w.id)
  );

  console.log(`${wineriesWithoutVisitUrl.length} additional wineries to scan for visit pages\n`);

  for (let i = 0; i < wineriesWithoutVisitUrl.length; i++) {
    const winery = wineriesWithoutVisitUrl[i];
    if (i % 20 === 0 && i > 0) {
      console.log(`  Scanned ${i}/${wineriesWithoutVisitUrl.length}...`);
    }

    const html = await fetchPage(winery.websiteUrl!);
    if (!html) {
      await sleep(DELAY_MS);
      continue;
    }

    const visitLinks = extractVisitLinks(html, winery.websiteUrl!);
    if (visitLinks.length > 0) {
      fixes.push({
        type: "winery_visitUrl",
        id: winery.id,
        name: winery.name,
        oldUrl: null,
        newUrl: visitLinks[0],
      });
    }

    await sleep(DELAY_MS);
  }

  // --- Apply fixes ---
  if (writeMode && fixes.length > 0) {
    console.log(`\n=== Applying ${fixes.length} fixes ===\n`);
    for (const fix of fixes) {
      if (fix.type === "winery_visitUrl") {
        await db
          .update(wineries)
          .set({ visitUrl: fix.newUrl })
          .where(eq(wineries.id, fix.id));
        console.log(`  Updated visitUrl for ${fix.name}`);
      }
    }
  }

  // --- Summary ---
  const fixableMissing = missing.filter((m) => m.suggestedVisitUrl);

  console.log(`\n${"=".repeat(60)}`);
  console.log("AUDIT SUMMARY");
  console.log(`${"=".repeat(60)}`);
  console.log(`  Total tasting URLs checked:     ${tastingsWithUrl.length}`);
  console.log(`  Broken (404/error):             ${broken.length}`);
  console.log(`  Redirected to homepage:         ${redirectedToHome.length}`);
  console.log(`  Tastings missing sourceUrl:     ${tastingsWithoutUrl.length}`);
  console.log(`  Wineries with missing tastings: ${wineriesNeedingVisitUrl.size}`);
  console.log(`  Visit pages found (fixable):    ${fixableMissing.length}`);
  console.log(`  Total visitUrl fixes:           ${fixes.length}`);
  if (!writeMode) {
    console.log(`  Mode:                           DRY RUN`);
  }
  console.log(`${"=".repeat(60)}`);

  // Write report
  const report = {
    broken,
    redirectedToHome,
    missing,
    fixes,
    summary: {
      totalChecked: tastingsWithUrl.length,
      broken: broken.length,
      redirectedToHome: redirectedToHome.length,
      missingSourceUrl: tastingsWithoutUrl.length,
      fixableWithVisitPage: fixableMissing.length,
      totalVisitUrlFixes: fixes.length,
    },
  };

  writeFileSync("data/tasting-links-audit.json", JSON.stringify(report, null, 2));
  console.log(`\nFull report written to data/tasting-links-audit.json`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
