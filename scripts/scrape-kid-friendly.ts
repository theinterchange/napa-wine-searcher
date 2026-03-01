import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries } from "../src/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import OpenAI from "openai";

// --- Configuration ---
const DELAY_MS = 500;
const MAX_SUB_PAGES = 3;
const MAX_TEXT_CHARS = 4000;
const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)";

// --- CLI args ---
const useTurso = process.argv.includes("--turso");

// --- DB setup ---
let dbUrl: string;
let dbAuthToken: string | undefined;

if (useTurso) {
  dbUrl = "libsql://napa-winery-search-theinterchange.aws-us-west-2.turso.io";
  // Get token from env or generate via turso CLI
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
  const visitPatterns =
    /visit|plan|faq|polic|book|reserv|experience|tasting|about|contact|tour|group|private|family|kid|child/i;

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

    // Resolve relative URLs
    try {
      const resolved = new URL(href, baseUrl).href;
      // Only same-origin links
      if (!resolved.startsWith(baseOrigin)) continue;
      // Must match visit-related patterns
      if (!visitPatterns.test(resolved)) continue;
      // Skip asset files
      if (/\.(jpg|jpeg|png|gif|svg|pdf|css|js|webp|avif|mp4|mp3)(\?|$)/i.test(resolved))
        continue;
      // Deduplicate
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

interface LLMResult {
  kidFriendly: boolean;
  confidence: "high" | "medium" | "low";
  evidence: string;
}

const SYSTEM_PROMPT = `You are analyzing a winery's website to determine if children/minors under 21 are welcome to VISIT the physical winery/tasting room.

IMPORTANT DISTINCTION: Almost every winery website has a standard age verification gate ("Are you 21?", "By entering this site you affirm you are of legal drinking age"). These are LEGAL REQUIREMENTS for alcohol websites and say NOTHING about whether children can physically visit. IGNORE these entirely.

You are ONLY looking for policies about VISITING the physical location:
- kidFriendly: true — the winery explicitly welcomes families, children, or minors to visit (even with restrictions like "accompanied by adult" or age minimums like "12+")
- kidFriendly: false — the winery has an explicit policy that ALL VISITORS/GUESTS must be 21+ or that children/minors/infants are NOT ALLOWED on the premises

Signals that mean 21+ VISITORS ONLY (kidFriendly: false):
- "All guests must be 21+" (referring to visitors, not website users)
- "We cannot accommodate children/minors/infants"
- "No one under 21 is permitted on the property"
- "Adults-only property" (referring to the whole venue, not one specific experience)

Signals that mean kid-friendly (kidFriendly: true):
- "Families welcome", "family-friendly", "kids welcome", "children welcome", "all ages"
- Mentions of children's activities, play areas, family picnic grounds
- "Minors must be accompanied by an adult" (they're still allowed!)
- Kid's menu, family events, strollers welcome

Things to IGNORE (not evidence either way):
- Website age verification gates ("Are you 21?", "Enter your date of birth", "By entering this site...")
- "Please drink responsibly" or "Must be 21 to purchase/consume alcohol"
- Generic subscription confirmations ("By subscribing you confirm you are 21+")
- One specific adults-only experience/tour when the winery may have other family options

Set confidence to:
- "high" — explicit visitor policy found (e.g., "All visitors must be 21+" or "Families welcome to visit!")
- "medium" — strong signal about the visit experience (e.g., family picnic grounds, or "reservation for adults" with no family options)
- "low" — no relevant visitor policy found; only website age gates or no info at all

Respond with ONLY valid JSON in this exact format:
{"kidFriendly": true/false, "confidence": "high"/"medium"/"low", "evidence": "the key text that informed your decision"}`;

async function classifyWithLLM(
  wineryName: string,
  pageTexts: string[]
): Promise<LLMResult | null> {
  const combinedText = pageTexts.join("\n\n---\n\n").slice(0, MAX_TEXT_CHARS);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 200,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Winery: ${wineryName}\n\nWebsite content:\n${combinedText}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return null;

    // Parse JSON from response (handle markdown code blocks)
    const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    if (
      typeof parsed.kidFriendly !== "boolean" ||
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
  const allWineries = await db
    .select({
      id: wineries.id,
      name: wineries.name,
      websiteUrl: wineries.websiteUrl,
      kidFriendly: wineries.kidFriendly,
    })
    .from(wineries)
    .where(isNotNull(wineries.websiteUrl));

  console.log(`Found ${allWineries.length} wineries with website URLs\n`);

  let classified = 0;
  let kidFriendlyCount = 0;
  let restrictedCount = 0;
  let skippedLowConfidence = 0;
  let fetchErrors = 0;

  for (let i = 0; i < allWineries.length; i++) {
    const winery = allWineries[i];
    const url = winery.websiteUrl!;
    console.log(`[${i + 1}/${allWineries.length}] ${winery.name}`);

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
        await sleep(200); // Brief delay between sub-page fetches
      }
    }

    // Step 3: Classify with LLM
    const result = await classifyWithLLM(winery.name, pageTexts);

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

    // Step 4: Write to DB (high or medium confidence only)
    await db
      .update(wineries)
      .set({
        kidFriendly: result.kidFriendly,
        kidFriendlyConfidence: result.confidence,
      })
      .where(eq(wineries.id, winery.id));

    classified++;
    if (result.kidFriendly) {
      kidFriendlyCount++;
      console.log(
        `  ✓ Kid-friendly [${result.confidence}] — ${result.evidence.slice(0, 100)}`
      );
    } else {
      restrictedCount++;
      console.log(
        `  ✗ 21+ only [${result.confidence}] — ${result.evidence.slice(0, 100)}`
      );
    }

    await sleep(DELAY_MS);
  }

  const total = allWineries.length;
  const coverage = ((classified / total) * 100).toFixed(1);

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Results:`);
  console.log(`  Total wineries:      ${total}`);
  console.log(`  Classified:          ${classified} (${coverage}%)`);
  console.log(`  Kid-friendly:        ${kidFriendlyCount}`);
  console.log(`  Restricted (21+):    ${restrictedCount}`);
  console.log(`  Low confidence:      ${skippedLowConfidence}`);
  console.log(`  Fetch errors:        ${fetchErrors}`);
  console.log(`${"=".repeat(60)}`);

  if (parseFloat(coverage) < 90) {
    console.log(
      `\n⚠️  Coverage is below 90%. Consider removing the kid-friendly filter from the UI.`
    );
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
