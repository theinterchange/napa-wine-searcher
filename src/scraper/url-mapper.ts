/**
 * Discover wine, tasting, and about page URLs for each winery.
 * Uses Playwright to extract navigation links and match against known patterns.
 *
 * Usage: npx tsx src/scraper/url-mapper.ts [--winery <slug>] [--limit <n>]
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { chromium, type Browser } from "playwright";
import { config } from "./config";
import type { WineryTarget, WineryUrls } from "./types";
import { rateLimiter } from "./utils/rate-limiter";
import { withRetry } from "./utils/retry";
import pLimit from "p-limit";

// URL patterns for matching navigation links
const URL_PATTERNS: Record<string, { textPatterns: RegExp[]; pathPatterns: RegExp[] }> = {
  wines: {
    textPatterns: [
      /\bwines?\b/i,
      /\bshop\b/i,
      /\bour wines\b/i,
      /\bcollection\b/i,
      /\bcurrent releases?\b/i,
      /\bportfolio\b/i,
    ],
    pathPatterns: [
      /\/wines?\b/i,
      /\/shop\b/i,
      /\/our-wines?\b/i,
      /\/current-releases?\b/i,
      /\/collection\b/i,
      /\/portfolio\b/i,
    ],
  },
  tastings: {
    textPatterns: [
      /\bvisit\b/i,
      /\btasting/i,
      /\bexperiences?\b/i,
      /\breserv/i,
      /\bhospitality\b/i,
      /\btours?\b/i,
    ],
    pathPatterns: [
      /\/visit/i,
      /\/tasting/i,
      /\/experience/i,
      /\/reserv/i,
      /\/hospitality/i,
      /\/tour/i,
      /\/book/i,
    ],
  },
  about: {
    textPatterns: [
      /\babout\b/i,
      /\bstory\b/i,
      /\bour story\b/i,
      /\bestate\b/i,
      /\bhistory\b/i,
      /\bwinemaker\b/i,
    ],
    pathPatterns: [
      /\/about/i,
      /\/story/i,
      /\/our-story/i,
      /\/estate/i,
      /\/history/i,
      /\/winemaker/i,
    ],
  },
};

// Common probe paths to try if nav link extraction fails
const PROBE_PATHS: Record<string, string[]> = {
  wines: ["/wines", "/shop", "/our-wines", "/current-releases", "/collection"],
  tastings: ["/visit", "/tastings", "/experiences", "/reservations", "/hospitality"],
  about: ["/about", "/story", "/our-story", "/estate", "/about-us"],
};

interface NavLink {
  text: string;
  href: string;
}

async function extractNavLinks(
  browser: Browser,
  url: string
): Promise<NavLink[]> {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    // Wait a bit for JS-rendered nav menus
    await page.waitForTimeout(2000);

    const links = await page.evaluate(() => {
      const navLinks: Array<{ text: string; href: string }> = [];
      // Look in nav elements, header, and top-level links
      const selectors = [
        "nav a",
        "header a",
        '[role="navigation"] a',
        ".nav a",
        ".menu a",
        ".navbar a",
        "#menu a",
      ];

      const seen = new Set<string>();
      for (const selector of selectors) {
        document.querySelectorAll(selector).forEach((el) => {
          const a = el as HTMLAnchorElement;
          const href = a.href;
          const text = (a.textContent || "").trim();
          if (href && text && !seen.has(href)) {
            seen.add(href);
            navLinks.push({ text, href });
          }
        });
      }

      // Also get all top-level links if nav-specific selectors found nothing
      if (navLinks.length === 0) {
        document.querySelectorAll("a[href]").forEach((el) => {
          const a = el as HTMLAnchorElement;
          const href = a.href;
          const text = (a.textContent || "").trim();
          if (
            href &&
            text &&
            text.length < 50 &&
            !seen.has(href) &&
            href.startsWith(window.location.origin)
          ) {
            seen.add(href);
            navLinks.push({ text, href });
          }
        });
      }

      return navLinks;
    });

    return links;
  } finally {
    await page.close();
  }
}

function matchLinks(
  links: NavLink[],
  baseUrl: string
): { wines: string | null; tastings: string | null; about: string | null } {
  const result: Record<string, string | null> = {
    wines: null,
    tastings: null,
    about: null,
  };

  let baseOrigin: string;
  try {
    baseOrigin = new URL(baseUrl).origin;
  } catch {
    return result as typeof result & {
      wines: string | null;
      tastings: string | null;
      about: string | null;
    };
  }

  for (const [category, patterns] of Object.entries(URL_PATTERNS)) {
    if (result[category]) continue;

    for (const link of links) {
      // Only consider same-origin links
      try {
        if (!link.href.startsWith(baseOrigin)) continue;
      } catch {
        continue;
      }

      // Check text patterns
      const textMatch = patterns.textPatterns.some((p) => p.test(link.text));
      // Check path patterns
      const pathMatch = patterns.pathPatterns.some((p) => p.test(link.href));

      if (textMatch || pathMatch) {
        // Avoid matching the homepage itself
        try {
          const linkPath = new URL(link.href).pathname;
          if (linkPath === "/" || linkPath === "") continue;
        } catch {
          continue;
        }

        result[category] = link.href;
        break;
      }
    }
  }

  return result as { wines: string | null; tastings: string | null; about: string | null };
}

async function probeUrls(
  baseUrl: string,
  category: string
): Promise<string | null> {
  const paths = PROBE_PATHS[category] || [];
  let origin: string;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    return null;
  }

  for (const path of paths) {
    const url = `${origin}${path}`;
    try {
      const resp = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
      });
      if (resp.ok) {
        return url;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

async function mapWineryUrls(
  browser: Browser,
  winery: WineryTarget
): Promise<WineryUrls> {
  if (!winery.websiteUrl) {
    return {
      websiteUrl: "",
      winesUrl: null,
      tastingsUrl: null,
      aboutUrl: null,
      status: "needs-manual-review",
    };
  }

  console.log(`  Mapping: ${winery.name} (${winery.websiteUrl})`);

  try {
    await rateLimiter.acquire(winery.websiteUrl);

    // Extract nav links
    const links = await withRetry(
      () => extractNavLinks(browser, winery.websiteUrl!),
      `nav links for ${winery.name}`
    );

    // Match against patterns
    const matched = matchLinks(links, winery.websiteUrl);

    // Probe for missing URLs
    for (const category of ["wines", "tastings", "about"] as const) {
      if (!matched[category]) {
        matched[category] = await probeUrls(winery.websiteUrl, category);
      }
    }

    rateLimiter.release(winery.websiteUrl);

    const hasAnyUrl = matched.wines || matched.tastings || matched.about;

    return {
      websiteUrl: winery.websiteUrl,
      winesUrl: matched.wines,
      tastingsUrl: matched.tastings,
      aboutUrl: matched.about,
      status: hasAnyUrl ? "mapped" : "needs-manual-review",
    };
  } catch (err) {
    rateLimiter.release(winery.websiteUrl);
    console.error(`  Error mapping ${winery.name}:`, err);
    return {
      websiteUrl: winery.websiteUrl,
      winesUrl: null,
      tastingsUrl: null,
      aboutUrl: null,
      status: "needs-manual-review",
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const winerySlug = args.includes("--winery")
    ? args[args.indexOf("--winery") + 1]
    : null;
  const limit = args.includes("--limit")
    ? parseInt(args[args.indexOf("--limit") + 1])
    : undefined;

  // Load winery targets
  if (!existsSync(config.paths.wineryTargets)) {
    console.error(
      `Missing ${config.paths.wineryTargets}. Run build-winery-list.ts first.`
    );
    process.exit(1);
  }

  const targets: WineryTarget[] = JSON.parse(
    readFileSync(config.paths.wineryTargets, "utf-8")
  );

  // Load existing URL map (for incremental runs)
  let urlMap: Record<string, WineryUrls> = {};
  if (existsSync(config.paths.wineryUrls)) {
    urlMap = JSON.parse(readFileSync(config.paths.wineryUrls, "utf-8"));
  }

  // Filter targets
  let toProcess = targets;
  if (winerySlug) {
    toProcess = targets.filter((t) => t.slug === winerySlug);
    if (toProcess.length === 0) {
      console.error(`Winery "${winerySlug}" not found in targets.`);
      process.exit(1);
    }
  } else {
    // Skip already-mapped wineries unless they need review
    toProcess = targets.filter((t) => {
      const existing = urlMap[t.slug];
      return !existing || existing.status === "needs-manual-review";
    });
  }
  if (limit) {
    toProcess = toProcess.slice(0, limit);
  }

  console.log(`Mapping URLs for ${toProcess.length} wineries...\n`);

  const browser = await chromium.launch({ headless: true });
  const concurrencyLimit = pLimit(config.rateLimiting.maxConcurrentBrowsers);

  try {
    const results = await Promise.all(
      toProcess.map((winery) =>
        concurrencyLimit(async () => {
          const urls = await mapWineryUrls(browser, winery);
          urlMap[winery.slug] = urls;
          return { slug: winery.slug, ...urls };
        })
      )
    );

    // Write output
    writeFileSync(config.paths.wineryUrls, JSON.stringify(urlMap, null, 2));

    // Summary
    const mapped = results.filter((r) => r.status === "mapped").length;
    const needsReview = results.filter(
      (r) => r.status === "needs-manual-review"
    ).length;

    console.log(`\nURL mapping complete:`);
    console.log(`  Mapped: ${mapped}/${results.length}`);
    console.log(`  Needs manual review: ${needsReview}/${results.length}`);
    console.log(`\nOutput: ${config.paths.wineryUrls}`);

    if (needsReview > 0) {
      console.log(`\nWineries needing manual URL review:`);
      results
        .filter((r) => r.status === "needs-manual-review")
        .forEach((r) => console.log(`  - ${r.slug}: ${r.websiteUrl}`));
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
