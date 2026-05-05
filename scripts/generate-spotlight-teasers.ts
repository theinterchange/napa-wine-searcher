/**
 * Generate spotlight teasers for wineries and accommodations.
 *
 * Writes a 2-sentence editorial dek per entity to spotlight_teaser. The dek
 * appears on the homepage Spotlight slot; the bulleted "Why this estate"
 * reveal beneath it still uses whyThisWinery/whyThisHotel. Teaser must NOT
 * verbatim repeat any phrase from those arrays — it's the magazine cover hook,
 * not the feature article.
 *
 * Usage:
 *   npx tsx scripts/generate-spotlight-teasers.ts --limit=5             # smoke test
 *   npx tsx scripts/generate-spotlight-teasers.ts --type=winery         # wineries only
 *   npx tsx scripts/generate-spotlight-teasers.ts --type=accommodation  # hotels only
 *   npx tsx scripts/generate-spotlight-teasers.ts --slug=opus-one       # specific entity
 *   npx tsx scripts/generate-spotlight-teasers.ts --force               # overwrite existing
 *   npx tsx scripts/generate-spotlight-teasers.ts                       # full run
 *
 * Model: claude-sonnet-4-5. Cost: ~$1.50 first run, $3-5 with iteration.
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import Anthropic from "@anthropic-ai/sdk";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import {
  wineries,
  accommodations,
  subRegions,
} from "../src/db/schema";
import { eq, isNull, or } from "drizzle-orm";

// --- CLI args ---
const limitArg = process.argv
  .find((a) => a.startsWith("--limit="))
  ?.split("=")[1];
const limit = limitArg ? parseInt(limitArg, 10) : Infinity;
const typeFilter = process.argv
  .find((a) => a.startsWith("--type="))
  ?.split("=")[1] as "winery" | "accommodation" | undefined;
const slugFilter = process.argv
  .filter((a) => a.startsWith("--slug="))
  .map((a) => a.split("=")[1])
  .filter(Boolean);
const forceOverwrite = process.argv.includes("--force");

// --- DB + SDK setup ---
const dbUrl = process.env.DATABASE_URL;
const dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
if (!dbUrl) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY");
  process.exit(1);
}
const client = createClient({ url: dbUrl, authToken: dbAuthToken });
const db = drizzle(client);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TEASER_TOOL = {
  name: "write_spotlight_teaser",
  description:
    "Write the homepage spotlight teaser for this entity in the structured format.",
  input_schema: {
    type: "object" as const,
    properties: {
      teaser: {
        type: "string",
        description:
          "1–3 sentences, 30–55 words. The dek that appears on the homepage spotlight beneath the entity name. Lead with one specific concrete detail (varietal, building age, vista direction, owner's hands-on role, a chef name only if in context). Do NOT lead with the entity name. End with a small curiosity hook so the reader clicks through. This is a teaser, not a recap — do not summarize the bullets that appear below.",
      },
    },
    required: ["teaser"],
  },
};

interface TeaserOutput {
  teaser: string;
}

const DELAY_MS = 300;
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- Voice rules (system prompt — cached) ---

const SYSTEM_PROMPT = `You are writing the editorial dek that appears on the homepage Spotlight of napasonomaguide.com — a Condé-Nast-style guide to Napa and Sonoma. Each spotlight features ONE winery or hotel for the month. Beneath your teaser, the page renders 3 bulleted "Why this estate" reasons drawn from the entity's detail page. Your job is to pull readers in to those bullets and to the full detail page — not to summarize them.

OBJECTIVE
A short, magazine-feel pull-quote that grounds a reader in this specific place and creates the small itch to click through. 30–55 words, 1–3 sentences. No more, no less.

FRAMING
- This is a teaser, not a recap. The reader will see bullets below your teaser and will visit the detail page if you do your job. Don't enumerate; don't summarize. Trust the bullets to do that work.
- Lead with one concrete, observable detail. A varietal, a building's age, the direction the windows face, the family's role, a sound, a smell, a season. Something a visitor would actually notice.
- End with a curiosity hook — never a summary clause. The last beat should leave the reader wanting one more sentence.

STRUCTURE
- Do NOT start with the entity name. Use it later (or not at all if the photo carries it).
- Do NOT use a banned opener (see below).
- Sentence count: 1, 2, or 3. Whichever serves. Mostly 2.
- Word count: 30–55. Hard limit. Strict.

DUPLICATION RULE — CRITICAL
The user message will include a "DO NOT REPEAT" list of phrases drawn from whyThisWinery / whyThisHotel. Those phrases render as bullets directly under your teaser. Your teaser must not verbatim repeat any 6-word run from that list. Paraphrase or pick a different angle entirely.

FACTUAL ACCURACY (strict — this site is a trusted source)
- Do NOT invent specific numbers, years, acreage, distances, case counts, or quantities. Only use facts that appear in the editorial context I provide.
- Do NOT invent chef names, winemaker names, owner names, or family names. If a name is in the context you may use it; otherwise omit.
- Do NOT invent certifications ("LEED-certified", "Michelin-starred", "first in Napa to…") unless the context explicitly states it.
- When specifics aren't in the context, default to general description. "A hillside winery" beats "a 40-acre hillside winery" if acreage wasn't given.

VOICE
- A person wrote this, not a brand. Confident, warm, never salesy.
- Specific adjectives are fine ("weathered barn," "volcanic slopes"). Hyperbolic ones are not.
- Vary rhythm. A short, punchy line can land after a longer one.
- Every teaser should feel like a different person wrote it. Different angle, different pride point.

BANNED HYPERBOLIC WORDS (reliably mark AI copy)
"acclaimed", "captivating", "exceptional", "unforgettable", "exquisite", "stunning", "breathtaking", "world-class", "must-visit", "hidden gem", "crafted with passion", "the magic of", "sets the stage", "creating a perfect backdrop", "celebrates", "immerse", "immersive", "indulge", "nestled", "sun-drenched", "rolling hills", "a true", "harmoniously", "elegance meets"

BANNED OPENERS
"Discover", "Experience", "Explore", "Savor", "Welcome to", "Step into", "Looking for", "As the sun…", "Overlooking…"
Also: don't start with "At [Name]," and don't start with the entity name.

BANNED TEMPLATE PHRASES
- "the kind of ___" (any form)
- "makes you [verb]" as a closer
- "forget to check your phone"
- "fall asleep to the [X]"
- "nobody's in a hurry"
- "kids run between the rows"
- "dogs nap under oak trees"
- "boots still dusty"
- "long after you leave"
- "lingers long"
- "rooted in the land"
- "still talking about it weeks later"
- "nothing on the table is there by accident"

BANNED STRUCTURES
"[Adjective] wine awaits", "Enjoy [thing] while [thing]", "Guests can [verb]", "Whether you're [X] or [Y]", "A visit here is…", "This is [a place / the kind of place] where…"

EXAMPLES (voice and length, not content)

Example 1 — winery, refined:
"Volcanic soils give Hamel Estate's Cabernet a darker spine than most Sonoma reds, and the family pours the flights themselves on the patio above the home vineyard. There's a reason the house Cab sells out by July."

Example 2 — winery, casual:
"Heirloom vegetables grow between the Cabernet rows at Frog's Leap, and you'll taste a few of them on the lunch board. Skip the limo — drive yourself, and stay long enough to meet one of the dogs."

Example 3 — hotel, boutique:
"Each room at The Inn on Pine looks at the Palisades through a private deck, and the kitchen sets out cookies every afternoon. Most guests check in for two nights and barely leave the property."

Example 4 — hotel, refined:
"Suites at Auberge du Soleil step down the Rutherford hillside in olive-grove terraces, each one private enough to take dinner outdoors. The valley view from the bar, at sundown, is the one most guests come back for."

All four lead with a concrete detail, withhold something for the click-through, avoid every banned word and opener, and feel different from each other.`;

// --- Data fetching ---

interface WineryRow {
  id: number;
  slug: string;
  name: string;
  shortDescription: string | null;
  whyVisit: string | null;
  theSetting: string | null;
  knownFor: string | null;
  tastingRoomVibe: string | null;
  visitorTips: string | null;
  whyThisWinery: string | null;
  spotlightTeaser: string | null;
  subRegion: string | null;
  valley: string | null;
}

interface AccommodationRow {
  id: number;
  slug: string;
  name: string;
  type: string;
  shortDescription: string | null;
  whyStayHere: string | null;
  theSetting: string | null;
  theExperience: string | null;
  beforeYouBook: string | null;
  whyThisHotel: string | null;
  spotlightTeaser: string | null;
  subRegion: string | null;
  valley: string | null;
}

async function fetchWineries(): Promise<WineryRow[]> {
  const rows = await db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      shortDescription: wineries.shortDescription,
      whyVisit: wineries.whyVisit,
      theSetting: wineries.theSetting,
      knownFor: wineries.knownFor,
      tastingRoomVibe: wineries.tastingRoomVibe,
      visitorTips: wineries.visitorTips,
      whyThisWinery: wineries.whyThisWinery,
      spotlightTeaser: wineries.spotlightTeaser,
      subRegion: subRegions.name,
      valley: subRegions.valley,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id));

  return rows
    .filter((r) => slugFilter.length === 0 || slugFilter.includes(r.slug))
    .filter((r) => forceOverwrite || !r.spotlightTeaser);
}

async function fetchAccommodations(): Promise<AccommodationRow[]> {
  const rows = await db
    .select({
      id: accommodations.id,
      slug: accommodations.slug,
      name: accommodations.name,
      type: accommodations.type,
      shortDescription: accommodations.shortDescription,
      whyStayHere: accommodations.whyStayHere,
      theSetting: accommodations.theSetting,
      theExperience: accommodations.theExperience,
      beforeYouBook: accommodations.beforeYouBook,
      whyThisHotel: accommodations.whyThisHotel,
      spotlightTeaser: accommodations.spotlightTeaser,
      subRegion: subRegions.name,
      valley: accommodations.valley,
    })
    .from(accommodations)
    .leftJoin(subRegions, eq(accommodations.subRegionId, subRegions.id));

  return rows
    .filter((r) => slugFilter.length === 0 || slugFilter.includes(r.slug))
    .filter((r) => forceOverwrite || !r.spotlightTeaser);
}

// --- Validator ---

const BANNED_WORDS = [
  "acclaimed",
  "captivating",
  "exceptional",
  "unforgettable",
  "exquisite",
  "stunning",
  "breathtaking",
  "world-class",
  "must-visit",
  "must visit",
  "hidden gem",
  "crafted with passion",
  "the magic of",
  "sets the stage",
  "celebrates",
  "immerse",
  "immersive",
  "indulge",
  "nestled",
  "sun-drenched",
  "rolling hills",
  "harmoniously",
  "elegance meets",
];

const BANNED_OPENERS = [
  "Discover",
  "Experience",
  "Explore",
  "Savor",
  "Welcome to",
  "Step into",
  "Looking for",
  "As the sun",
  "Overlooking",
];

const BANNED_TEMPLATES = [
  "the kind of",
  "forget to check your phone",
  "fall asleep to the",
  "nobody's in a hurry",
  "kids run between the rows",
  "dogs nap under oak trees",
  "boots still dusty",
  "long after you leave",
  "lingers long",
  "rooted in the land",
  "still talking about it weeks later",
  "nothing on the table is there by accident",
];

function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function countSentences(s: string): number {
  // Count sentence-final punctuation followed by space or end-of-string.
  const matches = s.trim().match(/[.!?]+(?=\s|$)/g);
  return matches ? matches.length : 1;
}

function parseReasons(jsonArrayOrText: string | null): string[] {
  if (!jsonArrayOrText) return [];
  const trimmed = jsonArrayOrText.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (r): r is string => typeof r === "string" && r.trim().length > 0
        );
      }
    } catch {
      // ignore
    }
  }
  return [];
}

function findVerbatimDuplication(
  teaser: string,
  reasons: string[]
): string | null {
  // Slide a 6-word window over the teaser; if any window appears in any reason
  // (case-insensitive), flag it.
  const teaserLower = teaser.toLowerCase();
  const teaserWords = teaserLower.split(/\s+/).filter(Boolean);
  if (teaserWords.length < 6) return null;
  const reasonsLower = reasons.map((r) => r.toLowerCase());
  for (let i = 0; i + 6 <= teaserWords.length; i++) {
    const window = teaserWords.slice(i, i + 6).join(" ");
    for (const reason of reasonsLower) {
      if (reason.includes(window)) return window;
    }
  }
  return null;
}

interface ValidationResult {
  ok: boolean;
  violations: string[];
}

function validateTeaser(
  teaser: string,
  entityName: string,
  reasons: string[]
): ValidationResult {
  const violations: string[] = [];
  const trimmed = teaser.trim();
  const lower = trimmed.toLowerCase();

  const words = countWords(trimmed);
  if (words < 30) violations.push(`Too short: ${words} words (need 30–55).`);
  if (words > 55) violations.push(`Too long: ${words} words (need 30–55).`);

  const sentences = countSentences(trimmed);
  if (sentences > 3) violations.push(`Too many sentences: ${sentences} (need 1–3).`);

  for (const banned of BANNED_WORDS) {
    if (lower.includes(banned)) violations.push(`Banned word: "${banned}".`);
  }
  for (const tpl of BANNED_TEMPLATES) {
    if (lower.includes(tpl)) violations.push(`Banned template phrase: "${tpl}".`);
  }
  for (const opener of BANNED_OPENERS) {
    if (lower.startsWith(opener.toLowerCase())) {
      violations.push(`Banned opener: "${opener}".`);
    }
  }

  // Don't open with the entity name.
  const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase() ?? "";
  const nameFirstWord = entityName.split(/\s+/)[0]?.toLowerCase() ?? "";
  if (firstWord === nameFirstWord && nameFirstWord.length > 3) {
    violations.push(`Don't lead with the entity name ("${entityName}").`);
  }

  // Don't open with "At [Name]".
  if (/^at\s+/.test(lower)) {
    violations.push(`Don't open with "At [Name],".`);
  }

  const dup = findVerbatimDuplication(trimmed, reasons);
  if (dup) {
    violations.push(
      `Verbatim duplication of detail-page bullet (6-word match): "${dup}". Pick a different angle.`
    );
  }

  return { ok: violations.length === 0, violations };
}

// --- LLM call ---

function buildWineryUserMessage(w: WineryRow): string {
  const reasons = parseReasons(w.whyThisWinery);
  return [
    `Entity type: winery`,
    `Name: ${w.name}`,
    w.subRegion ? `Sub-region: ${w.subRegion}` : null,
    w.valley
      ? `Valley: ${w.valley === "napa" ? "Napa Valley" : "Sonoma County"}`
      : null,
    "",
    "EDITORIAL CONTEXT (use these facts only — do not invent):",
    w.shortDescription ? `Short description: ${w.shortDescription}` : null,
    w.whyVisit ? `Why visit: ${w.whyVisit}` : null,
    w.theSetting ? `The setting: ${w.theSetting}` : null,
    w.knownFor ? `Known for: ${w.knownFor}` : null,
    w.tastingRoomVibe ? `Tasting room vibe: ${w.tastingRoomVibe}` : null,
    w.visitorTips ? `Visitor tips: ${w.visitorTips}` : null,
    "",
    reasons.length > 0
      ? `DO NOT REPEAT — these reasons render as bullets directly under your teaser:\n${reasons.map((r) => `- ${r}`).join("\n")}`
      : null,
    "",
    `Write the spotlight teaser for ${w.name}. 30–55 words, 1–3 sentences. Use the write_spotlight_teaser tool.`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildAccommodationUserMessage(a: AccommodationRow): string {
  const reasons = parseReasons(a.whyThisHotel);
  return [
    `Entity type: ${a.type.replace("_", " ")}`,
    `Name: ${a.name}`,
    a.subRegion ? `Sub-region: ${a.subRegion}` : null,
    `Valley: ${a.valley === "napa" ? "Napa Valley" : "Sonoma County"}`,
    "",
    "EDITORIAL CONTEXT (use these facts only — do not invent):",
    a.shortDescription ? `Short description: ${a.shortDescription}` : null,
    a.whyStayHere ? `Why stay here: ${a.whyStayHere}` : null,
    a.theSetting ? `The setting: ${a.theSetting}` : null,
    a.theExperience ? `The experience: ${a.theExperience}` : null,
    a.beforeYouBook ? `Before you book: ${a.beforeYouBook}` : null,
    "",
    reasons.length > 0
      ? `DO NOT REPEAT — these reasons render as bullets directly under your teaser:\n${reasons.map((r) => `- ${r}`).join("\n")}`
      : null,
    "",
    `Write the spotlight teaser for ${a.name}. 30–55 words, 1–3 sentences. Use the write_spotlight_teaser tool.`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function callSonnet(
  userMessage: string,
  feedback: string | null
): Promise<TeaserOutput | null> {
  const userBlocks: Anthropic.MessageParam["content"] = [
    { type: "text" as const, text: userMessage },
  ];
  if (feedback) {
    userBlocks.push({
      type: "text" as const,
      text: `\nThe previous attempt failed validation. Fix these issues and try again:\n${feedback}`,
    });
  }

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 400,
    temperature: 1.0,
    system: [
      {
        type: "text" as const,
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [TEASER_TOOL],
    tool_choice: { type: "tool", name: "write_spotlight_teaser" },
    messages: [{ role: "user", content: userBlocks }],
  });

  const toolUse = message.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return null;
  return toolUse.input as TeaserOutput;
}

async function generateForEntity(
  name: string,
  reasons: string[],
  userMessage: string
): Promise<{ teaser: string | null; failures: string[] }> {
  const failures: string[] = [];
  let feedback: string | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await callSonnet(userMessage, feedback);
    if (!result?.teaser) {
      failures.push(`attempt ${attempt + 1}: empty response`);
      continue;
    }
    const validation = validateTeaser(result.teaser, name, reasons);
    if (validation.ok) return { teaser: result.teaser.trim(), failures };
    failures.push(`attempt ${attempt + 1}: ${validation.violations.join(" | ")}`);
    feedback = validation.violations.join("\n");
  }
  return { teaser: null, failures };
}

// --- Main ---

async function main() {
  console.log("Target:", dbUrl);
  console.log(
    `Mode: ${forceOverwrite ? "OVERWRITE" : "skip-existing"}` +
      (limit !== Infinity ? ` · limit=${limit}` : "") +
      (typeFilter ? ` · type=${typeFilter}` : "") +
      (slugFilter.length > 0 ? ` · slugs=${slugFilter.join(",")}` : "")
  );
  console.log("");

  const allWineries =
    typeFilter === "accommodation" ? [] : await fetchWineries();
  const allAccommodations =
    typeFilter === "winery" ? [] : await fetchAccommodations();

  const totalEligible = allWineries.length + allAccommodations.length;
  const cap =
    limit === Infinity ? totalEligible : Math.min(limit, totalEligible);
  console.log(
    `Eligible: ${allWineries.length} wineries + ${allAccommodations.length} accommodations`
  );
  console.log(`Will process: ${cap}`);
  console.log("");

  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  const failureLog: Array<{ slug: string; failures: string[] }> = [];

  // Interleave so we don't push 200 wineries through Sonnet before any hotels.
  const interleaved: Array<
    | { kind: "winery"; row: WineryRow }
    | { kind: "accommodation"; row: AccommodationRow }
  > = [];
  const maxLen = Math.max(allWineries.length, allAccommodations.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < allWineries.length)
      interleaved.push({ kind: "winery", row: allWineries[i] });
    if (i < allAccommodations.length)
      interleaved.push({ kind: "accommodation", row: allAccommodations[i] });
  }

  for (const item of interleaved) {
    if (processed >= cap) break;
    processed++;
    const start = Date.now();

    if (item.kind === "winery") {
      const w = item.row;
      const reasons = parseReasons(w.whyThisWinery);
      const userMessage = buildWineryUserMessage(w);
      const { teaser, failures } = await generateForEntity(w.name, reasons, userMessage);
      if (teaser) {
        await db
          .update(wineries)
          .set({ spotlightTeaser: teaser })
          .where(eq(wineries.id, w.id));
        succeeded++;
        const ms = Date.now() - start;
        const wc = countWords(teaser);
        console.log(
          `[${processed}/${cap}]  ✓ ${w.name}  (${wc}w · ${ms}ms)\n           "${teaser}"`
        );
      } else {
        failed++;
        failureLog.push({ slug: w.slug, failures });
        console.log(`[${processed}/${cap}]  ✗ ${w.name}  → ${failures.join(" || ")}`);
      }
    } else {
      const a = item.row;
      const reasons = parseReasons(a.whyThisHotel);
      const userMessage = buildAccommodationUserMessage(a);
      const { teaser, failures } = await generateForEntity(a.name, reasons, userMessage);
      if (teaser) {
        await db
          .update(accommodations)
          .set({ spotlightTeaser: teaser })
          .where(eq(accommodations.id, a.id));
        succeeded++;
        const ms = Date.now() - start;
        const wc = countWords(teaser);
        console.log(
          `[${processed}/${cap}]  ✓ ${a.name}  (${wc}w · ${ms}ms)\n           "${teaser}"`
        );
      } else {
        failed++;
        failureLog.push({ slug: a.slug, failures });
        console.log(`[${processed}/${cap}]  ✗ ${a.name}  → ${failures.join(" || ")}`);
      }
    }

    await sleep(DELAY_MS);
  }

  console.log("");
  console.log(`Done. ${succeeded} succeeded, ${failed} failed.`);
  if (failureLog.length > 0) {
    console.log("\nFailures:");
    for (const f of failureLog) {
      console.log(`  ${f.slug}:`);
      for (const v of f.failures) console.log(`    - ${v}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
