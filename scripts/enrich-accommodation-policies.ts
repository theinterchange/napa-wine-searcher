import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { accommodations } from "../src/db/schema";
import { eq, isNotNull, or, isNull } from "drizzle-orm";
import OpenAI from "openai";
import { writeFileSync } from "fs";

// --- Configuration ---
const DELAY_MS = 500;
const MAX_SUB_PAGES = 3;
const MAX_TEXT_CHARS = 6000;
const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)";

// --- CLI args ---
const useTurso = process.argv.includes("--turso");
const dryRun = process.argv.includes("--dry-run");

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

if (dryRun) {
  console.log("🔍 DRY RUN — no database writes will be made\n");
}

const client = createClient({ url: dbUrl, authToken: dbAuthToken });
const db = drizzle(client);

// --- OpenAI setup ---
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
if (!process.env.OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY in environment");
  process.exit(1);
}

// --- Helpers ---
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
  const policyPatterns =
    /pet|dog|animal|polic|faq|famil|kid|child|amenit|about|experience|service|guest/i;

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
      if (!policyPatterns.test(resolved)) continue;
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

// --- LLM types ---
interface LLMResult {
  dogFriendly: boolean;
  kidFriendly: boolean;
  adultsOnly: boolean;
  dogFriendlyNote: string;
  kidFriendlyNote: string;
  confidence: "high" | "medium" | "low";
  evidence: string;
}

const SYSTEM_PROMPT = `You are analyzing a hotel/inn/resort website to determine its guest policies regarding pets and children.

Classify THREE things:

1. **dogFriendly** (boolean): Does the property allow dogs/pets to stay?
   - true: explicitly allows pets/dogs (even with fees, size limits, or breed restrictions)
   - false: explicitly prohibits pets, or no evidence of pet policy (default to false for hotels)

2. **kidFriendly** (boolean): Is the property welcoming to children/families?
   - true: mentions families, children's amenities, cribs, family suites, kids welcome
   - false: no evidence of family accommodations (but NOT adults-only unless explicitly stated)

3. **adultsOnly** (boolean): Does the property restrict to adults only?
   - true: explicitly states "adults only", "21+", "no children", or similar restriction
   - false: no such restriction mentioned (default)

IMPORTANT RULES:
- adultsOnly and kidFriendly should be mutually exclusive (if adultsOnly is true, kidFriendly must be false)
- If the website mentions a pet fee, weight limit, or breed restriction, dogFriendly is still TRUE (they allow pets with conditions)
- If no pet policy is found, default dogFriendly to false
- If no family/children info is found AND no adults-only policy, set kidFriendly to false and adultsOnly to false

For notes:
- dogFriendlyNote: Brief policy detail if dogFriendly is true (e.g., "$50/night fee, max 40 lbs, 2 pets max"). Empty string if not dog-friendly.
- kidFriendlyNote: Brief note on kid amenities or age restrictions if relevant. Empty string if not applicable.

Set confidence to:
- "high" — explicit policy found on the website
- "medium" — strong indirect signals (e.g., family photos, pet amenities listed)
- "low" — no relevant info found, using defaults

Respond with ONLY valid JSON:
{"dogFriendly": true/false, "kidFriendly": true/false, "adultsOnly": true/false, "dogFriendlyNote": "...", "kidFriendlyNote": "...", "confidence": "high"/"medium"/"low", "evidence": "brief summary of what you found"}`;

async function classifyWithLLM(
  propertyName: string,
  pageTexts: string[]
): Promise<LLMResult | null> {
  const combinedText = pageTexts.join("\n\n---\n\n").slice(0, MAX_TEXT_CHARS);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 300,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Property: ${propertyName}\n\nWebsite content:\n${combinedText}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return null;

    const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    if (
      typeof parsed.dogFriendly !== "boolean" ||
      typeof parsed.kidFriendly !== "boolean" ||
      typeof parsed.adultsOnly !== "boolean" ||
      !["high", "medium", "low"].includes(parsed.confidence)
    ) {
      return null;
    }

    return parsed as LLMResult;
  } catch (e) {
    console.error(`  LLM error: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

// --- Main ---
async function main() {
  // Get accommodations that need enrichment (any of the three fields is null)
  const allAccommodations = await db
    .select({
      id: accommodations.id,
      name: accommodations.name,
      slug: accommodations.slug,
      websiteUrl: accommodations.websiteUrl,
      dogFriendly: accommodations.dogFriendly,
      kidFriendly: accommodations.kidFriendly,
      adultsOnly: accommodations.adultsOnly,
    })
    .from(accommodations)
    .where(isNotNull(accommodations.websiteUrl));

  // Filter to only those needing enrichment
  const needsEnrichment = allAccommodations.filter(
    (a) => a.dogFriendly === null || a.kidFriendly === null || a.adultsOnly === null
  );

  console.log(`Found ${allAccommodations.length} accommodations with website URLs`);
  console.log(`${needsEnrichment.length} need policy enrichment\n`);

  if (needsEnrichment.length === 0) {
    console.log("All accommodations already have policy data. Nothing to do.");
    return;
  }

  let classified = 0;
  let skippedLowConfidence = 0;
  let fetchErrors = 0;
  const results: Array<{
    name: string;
    slug: string;
    dogFriendly: boolean;
    kidFriendly: boolean;
    adultsOnly: boolean;
    dogFriendlyNote: string;
    kidFriendlyNote: string;
    confidence: string;
    evidence: string;
  }> = [];

  for (let i = 0; i < needsEnrichment.length; i++) {
    const accommodation = needsEnrichment[i];
    const url = accommodation.websiteUrl!;
    console.log(`[${i + 1}/${needsEnrichment.length}] ${accommodation.name}`);

    // Step 1: Fetch homepage
    const homepageHtml = await fetchPage(url);
    if (!homepageHtml) {
      console.log("  Failed to fetch homepage");
      fetchErrors++;
      await sleep(DELAY_MS);
      continue;
    }

    const homepageText = htmlToText(homepageHtml);

    // Step 2: Discover and fetch sub-pages
    const subPageUrls = extractLinks(homepageHtml, url);
    const pageTexts = [homepageText];

    if (subPageUrls.length > 0) {
      console.log(`  Found ${subPageUrls.length} sub-pages to check`);
      for (const subUrl of subPageUrls) {
        const subHtml = await fetchPage(subUrl);
        if (subHtml) {
          pageTexts.push(htmlToText(subHtml));
        }
        await sleep(200);
      }
    }

    // Step 3: Classify with LLM
    const result = await classifyWithLLM(accommodation.name, pageTexts);

    if (!result) {
      console.log("  LLM classification failed");
      await sleep(DELAY_MS);
      continue;
    }

    if (result.confidence === "low") {
      console.log(`  [Low confidence] Skipping — ${result.evidence}`);
      skippedLowConfidence++;
      await sleep(DELAY_MS);
      continue;
    }

    // Collect result
    const entry = {
      name: accommodation.name,
      slug: accommodation.slug,
      dogFriendly: result.dogFriendly,
      kidFriendly: result.kidFriendly,
      adultsOnly: result.adultsOnly,
      dogFriendlyNote: result.dogFriendlyNote,
      kidFriendlyNote: result.kidFriendlyNote,
      confidence: result.confidence,
      evidence: result.evidence,
    };
    results.push(entry);

    // Step 4: Write to DB (unless dry run)
    if (!dryRun) {
      await db
        .update(accommodations)
        .set({
          dogFriendly: result.dogFriendly,
          dogFriendlyNote: result.dogFriendlyNote || null,
          kidFriendly: result.kidFriendly,
          kidFriendlyNote: result.kidFriendlyNote || null,
          adultsOnly: result.adultsOnly,
        })
        .where(eq(accommodations.id, accommodation.id));
    }

    classified++;
    const tags = [
      result.dogFriendly ? "🐕 Dog OK" : null,
      result.kidFriendly ? "👨‍👩‍👧 Kid Friendly" : null,
      result.adultsOnly ? "🔞 Adults Only" : null,
    ]
      .filter(Boolean)
      .join(", ");

    console.log(`  ✓ [${result.confidence}] ${tags || "No special tags"}`);
    if (result.dogFriendlyNote) console.log(`    Pet: ${result.dogFriendlyNote}`);
    if (result.kidFriendlyNote) console.log(`    Kids: ${result.kidFriendlyNote}`);

    await sleep(DELAY_MS);
  }

  // Summary
  const total = needsEnrichment.length;
  const coverage = ((classified / total) * 100).toFixed(1);

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Results:`);
  console.log(`  Needed enrichment:   ${total}`);
  console.log(`  Classified:          ${classified} (${coverage}%)`);
  console.log(`  Dog-friendly:        ${results.filter((r) => r.dogFriendly).length}`);
  console.log(`  Kid-friendly:        ${results.filter((r) => r.kidFriendly).length}`);
  console.log(`  Adults-only:         ${results.filter((r) => r.adultsOnly).length}`);
  console.log(`  Low confidence:      ${skippedLowConfidence}`);
  console.log(`  Fetch errors:        ${fetchErrors}`);
  if (dryRun) {
    console.log(`  Mode:                DRY RUN (no DB writes)`);
  }
  console.log(`${"=".repeat(60)}`);

  // Write preview JSON for review
  if (results.length > 0) {
    const outputPath = "data/accommodation-policies-enriched.json";
    writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\nPreview written to ${outputPath} — review before pushing to production.`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
