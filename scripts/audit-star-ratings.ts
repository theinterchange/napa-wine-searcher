/**
 * Star Rating Audit — Scrape TripAdvisor for hotel star class + AI fallback.
 *
 * Two-pass approach:
 *   1. TripAdvisor scrape: search for each hotel, extract "Hotel class" from detail page
 *   2. AI fallback: for misses, GPT-4o-mini classifies from description + Google reviews
 *
 * Also reclassifies price_tier (1-4) since 91% of current data is tier 3 (broken).
 *
 * Usage:
 *   npx tsx scripts/audit-star-ratings.ts                    # all 127
 *   npx tsx scripts/audit-star-ratings.ts --slugs=meadowood  # test one
 *   npx tsx scripts/audit-star-ratings.ts --ai-only          # skip TripAdvisor
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { writeFileSync, readFileSync, existsSync } from "fs";
import { createClient } from "@libsql/client";
import OpenAI from "openai";
import { chromium, type Browser, type Page } from "playwright";

// --- CLI ---
const slugsArg = process.argv.find((a) => a.startsWith("--slugs="))?.split("=")[1];
const slugFilter = slugsArg ? slugsArg.split(",") : null;
const aiOnly = process.argv.includes("--ai-only");

// --- DB (production Turso) ---
const dbUrl = "libsql://napa-winery-search-theinterchange.aws-us-west-2.turso.io";
let dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
if (!dbAuthToken) {
  const { execSync } = require("child_process");
  dbAuthToken = execSync("turso db tokens create napa-winery-search", {
    encoding: "utf-8",
  }).trim();
}
const client = createClient({ url: dbUrl, authToken: dbAuthToken });

// --- OpenAI ---
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- Constants ---
const OUTPUT_JSON = "star-rating-audit.json";
const OUTPUT_MD = "star-rating-audit.md";
const DELAY_BETWEEN_PAGES_MS = 2500;
const PAGE_TIMEOUT_MS = 15000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- Types ---
interface Accommodation {
  slug: string;
  name: string;
  type: string;
  city: string | null;
  valley: string;
  description: string | null;
  short_description: string | null;
  price_tier: number | null;
  google_rating: number | null;
  google_review_count: number | null;
}

interface AuditEntry {
  slug: string;
  name: string;
  type: string;
  source: "tripadvisor" | "ai_fallback" | "not_found";
  star_rating: number | null;
  star_reasoning: string;
  new_price_tier: number | null;
  price_reasoning: string;
  current_price_tier: number | null;
  tripadvisor_url: string | null;
  confidence: "high" | "medium" | "low";
}

// --- Load existing results for resume ---
function loadExisting(): Record<string, AuditEntry> {
  if (!existsSync(OUTPUT_JSON)) return {};
  try {
    const data = JSON.parse(readFileSync(OUTPUT_JSON, "utf-8"));
    const map: Record<string, AuditEntry> = {};
    for (const entry of data) map[entry.slug] = entry;
    return map;
  } catch {
    return {};
  }
}

// --- TripAdvisor scraping ---
async function searchTripAdvisor(
  page: Page,
  name: string,
  city: string | null
): Promise<string | null> {
  const query = `${name} ${city || ""} California`;
  const searchUrl = `https://www.tripadvisor.com/Search?q=${encodeURIComponent(query)}`;

  try {
    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: PAGE_TIMEOUT_MS,
    });
    await page.waitForTimeout(3000);

    // Look for hotel result links
    const hotelLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/Hotel_Review"]'));
      if (links.length > 0) {
        return (links[0] as HTMLAnchorElement).href;
      }
      // Also check for general result links that go to hotel pages
      const allLinks = Array.from(document.querySelectorAll("a[href]"));
      for (const link of allLinks) {
        const href = (link as HTMLAnchorElement).href;
        if (href.includes("/Hotel_Review") || href.includes("/Inn_Review")) {
          return href;
        }
      }
      return null;
    });

    return hotelLink;
  } catch (err) {
    console.error(`  TripAdvisor search failed for ${name}:`, (err as Error).message);
    return null;
  }
}

async function extractStarClass(page: Page, url: string): Promise<{ stars: number | null; reasoning: string }> {
  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: PAGE_TIMEOUT_MS,
    });
    await page.waitForTimeout(2000);

    const result = await page.evaluate(() => {
      // Method 1: JSON-LD structured data
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent || "");
          // Handle arrays
          const items = Array.isArray(data) ? data : [data];
          for (const item of items) {
            if (item["@type"] === "Hotel" || item["@type"] === "LodgingBusiness") {
              if (item.starRating) {
                const val = typeof item.starRating === "object"
                  ? item.starRating.ratingValue
                  : item.starRating;
                if (val) return { stars: Number(val), method: "json-ld" };
              }
            }
          }
        } catch { /* ignore parse errors */ }
      }

      // Method 2: Look for "Hotel class" text in page
      const bodyText = document.body?.innerText || "";
      const classMatch = bodyText.match(/Hotel class[:\s]*(\d(?:\.\d)?)\s*(?:of|out of)\s*5/i);
      if (classMatch) return { stars: Math.round(Number(classMatch[1])), method: "hotel-class-text" };

      // Method 3: Look for star rating SVGs or visual indicators
      const starElements = document.querySelectorAll('[class*="star"], [class*="Star"], [aria-label*="star"]');
      for (const el of starElements) {
        const label = el.getAttribute("aria-label") || "";
        const starMatch = label.match(/(\d(?:\.\d)?)\s*(?:star|of 5)/i);
        if (starMatch) return { stars: Math.round(Number(starMatch[1])), method: "aria-label" };
      }

      // Method 4: Check for property type header that includes class
      const headers = Array.from(document.querySelectorAll("h1, h2, h3, [data-testid]"));
      for (const h of headers) {
        const text = h.textContent || "";
        const m = text.match(/(\d)-star/i);
        if (m) return { stars: Number(m[1]), method: "header-text" };
      }

      return { stars: null, method: "not_found" };
    });

    return {
      stars: result.stars,
      reasoning: result.stars
        ? `TripAdvisor Hotel Class: ${result.stars}/5 (via ${result.method})`
        : "Star class not found on TripAdvisor page",
    };
  } catch (err) {
    return { stars: null, reasoning: `Error: ${(err as Error).message}` };
  }
}

// --- AI fallback ---
async function classifyWithAI(acc: Accommodation): Promise<{
  star_rating: number;
  star_reasoning: string;
  new_price_tier: number;
  price_reasoning: string;
}> {
  const desc = (acc.description || acc.short_description || "").slice(0, 800);

  const prompt = `You are classifying a lodging property in Napa/Sonoma wine country, California.

Property details:
- Name: ${acc.name}
- Type: ${acc.type}
- City: ${acc.city || "unknown"}
- Valley: ${acc.valley}
- Description: ${desc}
- Google rating: ${acc.google_rating ?? "unknown"}/5 (${acc.google_review_count ?? "?"} reviews)
- Current price tier: ${acc.price_tier}/4

Task 1: Classify the HOTEL STAR RATING on a 1-5 scale.
This is the hotel-industry quality/service classification (like Forbes or AAA ratings):
- 5-star: Ultra-luxury destination properties with world-class service, Michelin-level dining, extensive grounds. Examples: Meadowood, Auberge du Soleil, Solage, Alila.
- 4-star: Upscale full-service with premium amenities, concierge, high-end finishes. Examples: Meritage Resort, Villagio Inn.
- 3-star: Comfortable mid-range with solid amenities, clean modern rooms. Examples: Best Western Plus, Marriott, nice standalone inns.
- 2-star: Budget/economy with basic amenities, functional rooms. Examples: Motel 6, Super 8, basic roadside motels.
- 1-star: Minimal service, very basic. (Unlikely in this dataset.)

Task 2: Classify the PRICE TIER on a 1-4 scale.
This is the nightly rate / budget level:
- 4 ($$$$): $500+/night — luxury properties
- 3 ($$$): $200-500/night — upscale
- 2 ($$): $100-200/night — mid-range
- 1 ($): Under $100/night — budget

Respond with ONLY a JSON object (no markdown):
{"star_rating": N, "star_reasoning": "one sentence", "price_tier": N, "price_reasoning": "one sentence"}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(text);
    return {
      star_rating: parsed.star_rating ?? 3,
      star_reasoning: parsed.star_reasoning || "AI classification",
      new_price_tier: parsed.price_tier ?? acc.price_tier ?? 3,
      price_reasoning: parsed.price_reasoning || "AI classification",
    };
  } catch {
    return {
      star_rating: 3,
      star_reasoning: "AI parse error — defaulted to 3",
      new_price_tier: acc.price_tier ?? 3,
      price_reasoning: "AI parse error — kept current",
    };
  }
}

// --- Main ---
(async () => {
  console.log("Fetching accommodations from Turso...");
  const rs = await client.execute(`
    SELECT slug, name, type, city, valley, description, short_description,
      price_tier, google_rating, google_review_count
    FROM accommodations ORDER BY slug
  `);
  let accs = rs.rows as unknown as Accommodation[];
  console.log(`  Found ${accs.length} accommodations`);

  if (slugFilter) {
    accs = accs.filter((a) => slugFilter.includes(a.slug));
    console.log(`  Filtered to ${accs.length} by slug`);
  }

  const existing = loadExisting();
  const results: AuditEntry[] = Object.values(existing);
  const existingSlugs = new Set(Object.keys(existing));

  let browser: Browser | null = null;
  let browserPage: Page | null = null;

  if (!aiOnly) {
    console.log("Launching Playwright...");
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    browserPage = await context.newPage();
  }

  let processed = 0;
  for (const acc of accs) {
    if (existingSlugs.has(acc.slug)) {
      console.log(`  [skip] ${acc.slug} (already in results)`);
      continue;
    }

    processed++;
    console.log(`\n[${processed}/${accs.length - existingSlugs.size}] ${acc.name}`);

    let entry: AuditEntry = {
      slug: acc.slug,
      name: acc.name,
      type: acc.type,
      source: "not_found",
      star_rating: null,
      star_reasoning: "",
      new_price_tier: acc.price_tier,
      price_reasoning: "unchanged",
      current_price_tier: acc.price_tier,
      tripadvisor_url: null,
      confidence: "low",
    };

    try {
      // Pass 1: TripAdvisor
      if (!aiOnly && browserPage) {
        console.log("  Searching TripAdvisor...");
        const hotelUrl = await searchTripAdvisor(browserPage, acc.name, acc.city);

        if (hotelUrl) {
          console.log(`  Found: ${hotelUrl.slice(0, 80)}...`);
          entry.tripadvisor_url = hotelUrl;

          const { stars, reasoning } = await extractStarClass(browserPage, hotelUrl);
          if (stars != null) {
            entry.star_rating = stars;
            entry.star_reasoning = reasoning;
            entry.source = "tripadvisor";
            entry.confidence = "high";
            console.log(`  ★ Star class: ${stars}/5 (${reasoning})`);
          } else {
            console.log(`  Star class not found on page: ${reasoning}`);
          }
        } else {
          console.log("  Not found on TripAdvisor");
        }

        await sleep(DELAY_BETWEEN_PAGES_MS);
      }

      // Pass 2: AI fallback (if TripAdvisor didn't find star class)
      if (entry.star_rating == null) {
        console.log("  AI fallback classification...");
        const ai = await classifyWithAI(acc);
        entry.star_rating = ai.star_rating;
        entry.star_reasoning = ai.star_reasoning;
        entry.new_price_tier = ai.new_price_tier;
        entry.price_reasoning = ai.price_reasoning;
        entry.source = entry.tripadvisor_url ? "tripadvisor" : "ai_fallback";
        entry.confidence = "low";
        console.log(`  ★ AI: ${ai.star_rating}/5 — ${ai.star_reasoning}`);
      }

      // Also use AI to reclassify price tier (even for TripAdvisor-sourced entries)
      if (entry.source === "tripadvisor") {
        const ai = await classifyWithAI(acc);
        entry.new_price_tier = ai.new_price_tier;
        entry.price_reasoning = ai.price_reasoning;
      }
    } catch (err) {
      console.error(`  ERROR: ${(err as Error).message}`);
      entry.star_reasoning = `Error: ${(err as Error).message}`;

      // Recover browser page
      if (browser && browserPage) {
        try {
          await browserPage.close();
        } catch { /* ignore */ }
        const ctx = browser.contexts()[0];
        if (ctx) browserPage = await ctx.newPage();
      }
    }

    results.push(entry);

    // Incremental save every 10
    if (results.length % 10 === 0) {
      writeFileSync(OUTPUT_JSON, JSON.stringify(results, null, 2));
      console.log(`  [saved ${results.length} entries]`);
    }
  }

  // Final save
  writeFileSync(OUTPUT_JSON, JSON.stringify(results, null, 2));
  console.log(`\n✓ Saved ${results.length} entries to ${OUTPUT_JSON}`);

  if (browser) await browser.close();

  // --- Generate markdown report ---
  const confirmed = results.filter((r) => r.source === "tripadvisor" && r.confidence === "high");
  const needsReview = results.filter((r) => r.source !== "tripadvisor" || r.confidence !== "high");

  let md = `# Star Rating Audit Report\n\n`;
  md += `Generated: ${new Date().toISOString()}\n\n`;

  // Summary stats
  const starDist: Record<number, number> = {};
  const tierChanges = results.filter((r) => r.new_price_tier !== r.current_price_tier);
  for (const r of results) {
    if (r.star_rating != null) starDist[r.star_rating] = (starDist[r.star_rating] || 0) + 1;
  }

  md += `## Summary\n\n`;
  md += `- **Total:** ${results.length} / 127\n`;
  md += `- **Confirmed (TripAdvisor):** ${confirmed.length}\n`;
  md += `- **Needs Review (AI fallback):** ${needsReview.length}\n`;
  md += `- **Star distribution:** ${[5, 4, 3, 2, 1].map((s) => `${s}★: ${starDist[s] || 0}`).join(", ")}\n`;
  md += `- **Price tier changes:** ${tierChanges.length} accommodations reclassified\n\n`;

  // Section 1: Confirmed
  md += `## Section 1 — Confirmed (TripAdvisor sourced)\n\n`;
  md += `| Slug | Name | Type | ★ Rating | Current $Tier | New $Tier | Source |\n`;
  md += `|---|---|---|---|---|---|---|\n`;
  for (const r of confirmed.sort((a, b) => (b.star_rating || 0) - (a.star_rating || 0))) {
    const stars = r.star_rating != null ? "★".repeat(r.star_rating) + ` (${r.star_rating})` : "?";
    const tierChange = r.new_price_tier !== r.current_price_tier
      ? `${r.current_price_tier} → **${r.new_price_tier}**`
      : `${r.current_price_tier}`;
    md += `| ${r.slug} | ${r.name} | ${r.type} | ${stars} | ${r.current_price_tier} | ${tierChange} | [TA](${r.tripadvisor_url}) |\n`;
  }

  // Section 2: Needs Review
  md += `\n## Section 2 — Needs Review\n\n`;
  md += `| Slug | Name | Type | ★ Rating | Confidence | Reasoning | Current $Tier | New $Tier |\n`;
  md += `|---|---|---|---|---|---|---|---|\n`;
  for (const r of needsReview.sort((a, b) => (b.star_rating || 0) - (a.star_rating || 0))) {
    const stars = r.star_rating != null ? "★".repeat(r.star_rating) + ` (${r.star_rating})` : "?";
    const tierChange = r.new_price_tier !== r.current_price_tier
      ? `${r.current_price_tier} → **${r.new_price_tier}**`
      : `${r.current_price_tier}`;
    md += `| ${r.slug} | ${r.name} | ${r.type} | ${stars} | ${r.confidence} | ${r.star_reasoning.slice(0, 60)} | ${r.current_price_tier} | ${tierChange} |\n`;
  }

  writeFileSync(OUTPUT_MD, md);
  console.log(`✓ Saved report to ${OUTPUT_MD}`);
})();
