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
  const sustainabilityPatterns =
    /sustain|organic|green|farm|environ|about|story|estate|vineyard|solar|biodynamic|eco|steward/i;

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
      if (!sustainabilityPatterns.test(resolved)) continue;
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

interface LLMResult {
  sustainableFarming: boolean;
  confidence: "high" | "medium" | "low";
  note: string;
  evidence: string;
}

const SYSTEM_PROMPT = `You are analyzing a winery's website to determine if they practice sustainable farming or have sustainability certifications.

You are looking for SUBSTANTIVE sustainability practices — not generic marketing language.

sustainableFarming: true — the winery has:
- Explicit certifications: Napa Green, CSWA Certified Sustainable, Organic (USDA/CCOF), Biodynamic (Demeter), Fish Friendly Farming, SIP Certified, LEED certified building
- Substantive sustainable practices described with specifics: solar power, dry farming, cover crops, integrated pest management, zero waste, carbon neutral, regenerative agriculture, water reclamation, composting, owl boxes for pest control, electric vehicles in vineyard

sustainableFarming: false — no meaningful sustainability claims, OR only vague marketing like:
- "We care about the land"
- "We respect nature"
- "Committed to quality and the environment"
- Generic statements without specific practices or certifications

IMPORTANT: Many wineries use vague "green" marketing. Only classify as sustainable if they name SPECIFIC certifications or describe CONCRETE practices.

For the "note" field, create a SHORT label (under 60 chars) summarizing the key certifications/practices. Examples:
- "Napa Green Certified"
- "Organic & Biodynamic (Demeter Certified)"
- "CSWA Certified Sustainable, Solar Powered"
- "Organic Vineyard, Fish Friendly Farming"
- "Solar Powered, Dry Farmed"

Set confidence to:
- "high" — explicit certification mentioned by name (Napa Green, Organic, Biodynamic, CSWA, LEED, etc.)
- "medium" — describes specific sustainable practices (solar panels, dry farming, cover crops, composting) but no formal certification named
- "low" — only vague environmental language with no specifics

Respond with ONLY valid JSON in this exact format:
{"sustainableFarming": true/false, "confidence": "high"/"medium"/"low", "note": "short label", "evidence": "the key text that informed your decision"}`;

async function classifyWithLLM(
  wineryName: string,
  pageTexts: string[],
  sourceUrl: string
): Promise<(LLMResult & { sourceUrl: string }) | null> {
  const combinedText = pageTexts.join("\n\n---\n\n").slice(0, MAX_TEXT_CHARS);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 250,
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

    const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    if (
      typeof parsed.sustainableFarming !== "boolean" ||
      !["high", "medium", "low"].includes(parsed.confidence)
    ) {
      return null;
    }

    return { ...parsed, sourceUrl } as LLMResult & { sourceUrl: string };
  } catch (e) {
    console.error(`  LLM error: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

// --- Main ---
async function main() {
  console.log(dryRun ? "=== DRY RUN — no DB writes ===\n" : "");

  const allWineries = await db
    .select({
      id: wineries.id,
      name: wineries.name,
      websiteUrl: wineries.websiteUrl,
      sustainableFarming: wineries.sustainableFarming,
    })
    .from(wineries)
    .where(isNotNull(wineries.websiteUrl));

  console.log(`Found ${allWineries.length} wineries with website URLs\n`);

  let classified = 0;
  let sustainableCount = 0;
  let notSustainableCount = 0;
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

    // Step 2: Discover and fetch sustainability-related sub-pages
    const subPageUrls = extractLinks(homepageHtml, url);
    const pageTexts = [homepageText];
    let bestSourceUrl = url;

    if (subPageUrls.length > 0) {
      console.log(`  Found ${subPageUrls.length} sub-pages to check`);
      for (const subUrl of subPageUrls) {
        const subHtml = await fetchPage(subUrl);
        if (subHtml) {
          const subText = htmlToText(subHtml);
          pageTexts.push(subText);
          // Track the most sustainability-relevant page as source
          if (/sustain|organic|green|biodynamic|solar|environ/i.test(subUrl)) {
            bestSourceUrl = subUrl;
          }
        }
        await sleep(200);
      }
    }

    // Step 3: Classify with LLM
    const result = await classifyWithLLM(winery.name, pageTexts, bestSourceUrl);

    if (!result) {
      console.log("  LLM classification failed");
      await sleep(DELAY_MS);
      continue;
    }

    if (result.confidence === "low") {
      console.log(`  [Low confidence] Skipping — ${result.evidence.slice(0, 100)}`);
      skippedLowConfidence++;
      await sleep(DELAY_MS);
      continue;
    }

    // Step 4: Write to DB (high or medium confidence only)
    if (!dryRun) {
      await db
        .update(wineries)
        .set({
          sustainableFarming: result.sustainableFarming,
          sustainableNote: result.sustainableFarming ? result.note : null,
          sustainableSource: result.sustainableFarming ? result.sourceUrl : null,
        })
        .where(eq(wineries.id, winery.id));
    }

    classified++;
    if (result.sustainableFarming) {
      sustainableCount++;
      console.log(
        `  ✓ Sustainable [${result.confidence}] — ${result.note} — ${result.evidence.slice(0, 80)}`
      );
    } else {
      notSustainableCount++;
      console.log(
        `  ✗ Not sustainable [${result.confidence}] — ${result.evidence.slice(0, 100)}`
      );
    }

    await sleep(DELAY_MS);
  }

  const total = allWineries.length;
  const coverage = ((classified / total) * 100).toFixed(1);

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Results${dryRun ? " (DRY RUN)" : ""}:`);
  console.log(`  Total wineries:      ${total}`);
  console.log(`  Classified:          ${classified} (${coverage}%)`);
  console.log(`  Sustainable:         ${sustainableCount}`);
  console.log(`  Not sustainable:     ${notSustainableCount}`);
  console.log(`  Low confidence:      ${skippedLowConfidence}`);
  console.log(`  Fetch errors:        ${fetchErrors}`);
  console.log(`${"=".repeat(60)}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
