/**
 * Regenerate voice-sensitive winery prose with Claude Sonnet 4.5.
 *
 * Replaces the existing gpt-4o-mini fluff in:
 *   - shortDescription   (hero subtitle, 1 sentence)
 *   - whyVisit           (2-3 sentences, "convince me to book")
 *   - theSetting         (3-4 sentences, "what does this place look/feel like")
 *   - tastingRoomVibe    (1 paragraph, "what is the actual tasting like")
 *   - whyThisWinery      (3-5 bullets, JSON array)
 *
 * Outputs to data/winery-prose-v2.json. Does NOT write to DB.
 * After human QC, run `apply-winery-prose.ts` (separate script) to write
 * approved entries into the DB.
 *
 * Validation: banned phrase list, concrete-noun-in-first-sentence rule,
 * swap test, factuality check on numbers/years. Auto-retries up to 3x with
 * feedback. Variety tracker injects cross-batch pattern awareness.
 *
 * Usage:
 *   npx tsx scripts/regenerate-winery-prose.ts --dry-run
 *   npx tsx scripts/regenerate-winery-prose.ts --slug=opus-one
 *   npx tsx scripts/regenerate-winery-prose.ts --slug=opus-one --slug=silver-oak
 *   npx tsx scripts/regenerate-winery-prose.ts --limit=5
 *   npx tsx scripts/regenerate-winery-prose.ts --out=data/sample-prose.json --limit=5
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries, tastingExperiences, subRegions } from "../src/db/schema";
import { eq } from "drizzle-orm";

// --- CLI ---
const dryRun = process.argv.includes("--dry-run");
const limitArg = process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1];
const limit = limitArg ? parseInt(limitArg, 10) : Infinity;
const slugFilter = process.argv
  .filter((a) => a.startsWith("--slug="))
  .map((a) => a.split("=")[1])
  .filter(Boolean);
const outArg = process.argv.find((a) => a.startsWith("--out="))?.split("=")[1];
const outPath = outArg
  ? path.resolve(outArg)
  : path.resolve("data/winery-prose-v2.json");

// --- DB ---
const dbUrl = process.env.DATABASE_URL;
const dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
if (!dbUrl) { console.error("Missing DATABASE_URL"); process.exit(1); }
if (!process.env.ANTHROPIC_API_KEY) { console.error("Missing ANTHROPIC_API_KEY"); process.exit(1); }

const client = createClient({ url: dbUrl, authToken: dbAuthToken });
const db = drizzle(client);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// --- Output schema (Claude tool) ---
const PROSE_TOOL: Anthropic.Tool = {
  name: "write_winery_prose",
  description: "Write voice-sensitive editorial prose for a single winery.",
  input_schema: {
    type: "object",
    properties: {
      shortDescription: {
        type: "string",
        description:
          "ONE sentence, 60-110 chars. Concrete and specific to THIS winery. Lead with what makes it different from any other tasting room. NO 'Experience the X', 'Discover the Y', or generic teasers. NO 'must-visit', 'unforgettable', 'iconic'.",
      },
      whyVisit: {
        type: "string",
        description:
          "2-3 sentences, 220-380 chars. Lead with the SINGLE most compelling concrete reason — a specific wine name, a specific experience name, a specific detail (year founded, person, structure, vineyard). Not 'their Cabernet' but the actual wine name. Then one sentence on why it matters for a visitor. NO 'picture yourself', 'imagine the', 'first sip', 'lingers', 'wow factor', 'leaves you in awe'. NO sensory clichés.",
      },
      theSetting: {
        type: "string",
        description:
          "3-4 sentences, 320-480 chars. The single most distinctive PHYSICAL feature first — a specific named structure, a view of a specific named place, a specific architectural detail. NO 'striking architecture', 'modern design', 'rolling hills', 'breathtaking views', 'rustic charm', 'inviting atmosphere'. Test: if you swap the winery name out, does the description still work for a different winery? Then it's too generic. Rewrite.",
      },
      tastingRoomVibe: {
        type: "string",
        description:
          "2-4 sentences, 300-500 chars. Describe the ACTUAL tasting experience using specific tasting names and prices from the input context. Anchor in concrete: what's poured, where you sit, who's pouring, what they tell you. NO 'engaging journey', 'sensory journey', 'thoughtfully curated', 'intimate setting', 'memorable experience'.",
      },
      whyThisWinery: {
        type: "array",
        items: { type: "string" },
        description:
          "EXACTLY 3-5 short bullet points (40-90 chars each). Each must contain a CONCRETE specific fact: a wine name, a year, a person, a structure name, a price, a tasting name. NO bullets like 'exceptional wines' or 'memorable hospitality' or 'beautiful setting'. If you can't make the bullet specific, omit it.",
      },
    },
    required: ["shortDescription", "whyVisit", "theSetting", "tastingRoomVibe", "whyThisWinery"],
  },
};

interface ProseOutput {
  shortDescription: string;
  whyVisit: string;
  theSetting: string;
  tastingRoomVibe: string;
  whyThisWinery: string[];
}

// --- Banned phrases (informed by 2026-05-06 audit of 10 random wineries) ---
const BANNED_PHRASES = [
  // From the audit — these were rampant
  "picture yourself",
  "picture the",
  "imagine the",
  "imagine yourself",
  "the first sip",
  "first sip hits",
  "first sip reveals",
  "lingers long",
  "lingers in the memory",
  "leaves you in awe",
  "leaves you eager",
  "wow factor",
  "delightful 'wow'",
  "delightful wow",
  "leaving a lasting impression",
  "leaving a profound impression",
  "essence of",
  "captures the essence",
  "elevates the very essence",
  "must-visit",
  "must-taste",
  "any wine enthusiast",
  "engaging journey",
  "sensory journey",
  "thoughtfully curated",
  "carefully curated",
  "meticulously curated",
  "intimate setting",
  "memorable experience",
  "unforgettable experience",
  "harmoniously",
  "elegance meets",
  "harmonizes beautifully",
  "harmonizing seamlessly",
  "blends seamlessly",
  "perfect blend",
  "perfectly paired",
  "is anything but ordinary",
  // Old enrich-content.ts list — keep as backstop
  "clink of glasses",
  "rolling hills",
  "sun-drenched",
  "lush vineyards",
  "warm glow",
  "golden light",
  "inviting atmosphere",
  "knowledgeable hosts",
  "knowledgeable staff",
  "curated selection",
  "rich aromas",
  "velvety tannins",
];

const BANNED_WORDS = [
  "acclaimed",
  "captivating",
  "enchanting",
  "exceptional",
  "exquisite",
  "extraordinary",
  "stunning",
  "breathtaking",
  "world-class",
  "unparalleled",
  "iconic",
  "hidden gem",
  "immerse",
  "immersive",
  "indulge",
  "nestled",
  "palpable",
  "irresistible",
  "delightful",
  "magical",
];

const BANNED_OPENERS = [
  "experience the",
  "discover ",
  "explore ",
  "savor ",
  "welcome to ",
  "step into ",
  "looking for ",
  "as the sun",
  "approaching",
  "as you arrive",
  "upon arrival",
  "as visitors",
  "the gentle",
  "guests are greeted",
];

// --- Validation ---

interface Violation {
  type: string;
  detail: string;
}

interface EntityContext {
  name: string;
  slug: string;
  city: string | null;
  subRegion: string | null;
  valley: string | null;
  description: string | null;
  tastingNames: string[];
  tastingDetails: string;
  websiteCopy: string;
  wikipediaCopy: string;
}

function validateProse(out: ProseOutput, ent: EntityContext): Violation[] {
  const violations: Violation[] = [];
  const all = [
    out.shortDescription,
    out.whyVisit,
    out.theSetting,
    out.tastingRoomVibe,
    ...out.whyThisWinery,
  ].join(" \n ");
  const allLower = all.toLowerCase();

  // 1. Banned phrases (substring)
  for (const p of BANNED_PHRASES) {
    if (allLower.includes(p)) violations.push({ type: "banned-phrase", detail: `"${p}"` });
  }

  // 2. Banned words (whole-word)
  for (const w of BANNED_WORDS) {
    const re = new RegExp(`\\b${w}\\b`, "i");
    if (re.test(all)) violations.push({ type: "banned-word", detail: `"${w}"` });
  }

  // 3. Banned openers — check first 30 chars of each section
  const sections: Array<[string, string]> = [
    ["whyVisit", out.whyVisit],
    ["theSetting", out.theSetting],
    ["tastingRoomVibe", out.tastingRoomVibe],
  ];
  for (const [field, txt] of sections) {
    const start = txt.toLowerCase().trim().slice(0, 30);
    for (const o of BANNED_OPENERS) {
      if (start.startsWith(o)) {
        violations.push({ type: "banned-opener", detail: `${field}: "${o.trim()}"` });
        break;
      }
    }
  }

  // 4. Length bounds
  if (out.shortDescription.length < 40 || out.shortDescription.length > 130) {
    violations.push({
      type: "length",
      detail: `shortDescription ${out.shortDescription.length} chars (want 40-130)`,
    });
  }
  if (out.whyVisit.length < 180 || out.whyVisit.length > 420) {
    violations.push({ type: "length", detail: `whyVisit ${out.whyVisit.length} chars (want 180-420)` });
  }
  if (out.theSetting.length < 280 || out.theSetting.length > 540) {
    violations.push({ type: "length", detail: `theSetting ${out.theSetting.length} chars (want 280-540)` });
  }
  if (out.tastingRoomVibe.length < 240 || out.tastingRoomVibe.length > 580) {
    violations.push({
      type: "length",
      detail: `tastingRoomVibe ${out.tastingRoomVibe.length} chars (want 240-580)`,
    });
  }
  if (out.whyThisWinery.length < 3 || out.whyThisWinery.length > 5) {
    violations.push({
      type: "bullets",
      detail: `whyThisWinery has ${out.whyThisWinery.length} (want 3-5)`,
    });
  }
  for (const b of out.whyThisWinery) {
    if (b.length < 30 || b.length > 110) {
      violations.push({ type: "bullet-length", detail: `bullet ${b.length} chars (want 30-110): "${b.slice(0, 60)}..."` });
    }
  }

  // 5. Concrete-noun-in-first-sentence rule for whyVisit and theSetting.
  // First sentence MUST contain at least one of: the winery name, a tasting experience
  // name, a year (4-digit), a $price, or a multi-word capitalized proper noun
  // not in the banned generic list.
  function firstSentenceHasConcrete(txt: string): boolean {
    // Don't split on abbreviations like "St.", "Mt.", "Dr."
    const ABBR_RE = /\b(St|Mt|Mr|Mrs|Ms|Dr|Ave|Blvd|Rd|Inc|Ltd|Co|Capt|Sgt|Lt|Jr|Sr|Vol|No|Vs|Etc|Hwy)\.\s+(?=[A-Z])/g;
    const PH = "\x00";
    const protectedTxt = txt.replace(ABBR_RE, (m) => m.replace(".", PH));
    const first = (protectedTxt.split(/(?<=[.!?])\s+/)[0] ?? protectedTxt).replace(new RegExp(PH, "g"), ".");
    if (!first) return false;
    const lower = first.toLowerCase();
    // Winery name (or significant part), stripping punctuation
    const nameTokens = ent.name
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.replace(/[^a-z0-9]/g, ""))
      .filter((t) => t.length >= 4 && !["family", "winery", "vineyards", "estate", "cellars"].includes(t));
    if (nameTokens.length > 0 && nameTokens.some((t) => lower.includes(t))) return true;
    // Tasting experience name (multi-word match)
    for (const tn of ent.tastingNames) {
      if (tn.length > 6 && lower.includes(tn.toLowerCase())) return true;
    }
    // 4-digit year (1900-2099)
    if (/\b(19|20)\d{2}\b/.test(first)) return true;
    // Dollar amount
    if (/\$\d{1,4}/.test(first)) return true;
    // Multi-word capitalized proper noun (not at sentence start) — heuristic
    const words = first.split(/\s+/);
    let runOfCaps = 0;
    for (let i = 1; i < words.length; i++) {
      const w = words[i].replace(/[^a-zA-Z]/g, "");
      if (w.length >= 3 && /^[A-Z]/.test(w)) {
        runOfCaps++;
        if (runOfCaps >= 2) return true;
      } else {
        runOfCaps = 0;
      }
    }
    return false;
  }
  if (!firstSentenceHasConcrete(out.whyVisit)) {
    violations.push({
      type: "no-concrete-first-sentence",
      detail: `whyVisit first sentence lacks a concrete proper noun, year, $price, tasting name, or the winery name`,
    });
  }
  if (!firstSentenceHasConcrete(out.theSetting)) {
    violations.push({
      type: "no-concrete-first-sentence",
      detail: `theSetting first sentence lacks a concrete proper noun, year, $price, tasting name, or the winery name`,
    });
  }

  // 6. Swap test — output must mention the winery's NAME or a tasting experience NAME
  // somewhere in the body. If neither, the prose is name-agnostic and could describe
  // any other winery. Strip punctuation from name tokens before matching.
  const nameRoot = ent.name
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ""))
    .filter((t) => t.length >= 4)[0];
  const hasName = nameRoot ? allLower.includes(nameRoot) : true;
  const hasTasting = ent.tastingNames.some((tn) => tn.length > 6 && allLower.includes(tn.toLowerCase()));
  if (!hasName && !hasTasting) {
    violations.push({
      type: "swap-test-fail",
      detail: `prose contains neither the winery name nor any tasting experience name — could describe any other winery`,
    });
  }

  // 7. Factuality — multi-digit numbers in output must appear in input context.
  // Include tastingDetails (prices like "$85") so legit price citations don't trip
  // the validator.
  const allowedText = [
    ent.name,
    ent.city ?? "",
    ent.subRegion ?? "",
    ent.description ?? "",
    ent.tastingNames.join(" "),
    ent.tastingDetails,
    ent.websiteCopy,
    ent.wikipediaCopy,
  ].join(" ").toLowerCase();
  const numberMatches = all.match(/\b\d{2,4}\b/g) ?? [];
  const seen = new Set<string>();
  for (const num of numberMatches) {
    if (seen.has(num)) continue;
    seen.add(num);
    // Skip prices ($X) — acceptable as long as a $price appears in context
    if (allowedText.includes(num)) continue;
    // Tasting prices in context come through as "$85" in tasting strings
    if (allowedText.includes(`$${num}`)) continue;
    violations.push({
      type: "unverified-number",
      detail: `output mentions "${num}" not present in input context`,
    });
  }

  return violations;
}

// --- Variety tracker (across batch) ---
class VarietyTracker {
  private firstWords = new Map<string, number>();
  private trigrams = new Map<string, number>();

  record(out: ProseOutput) {
    const all = `${out.whyVisit} ${out.theSetting} ${out.tastingRoomVibe}`.toLowerCase();
    // First 4 words of whyVisit
    const opener = out.whyVisit.trim().split(/\s+/).slice(0, 4).join(" ").toLowerCase();
    if (opener) this.firstWords.set(opener, (this.firstWords.get(opener) ?? 0) + 1);
    // 3-word phrases
    const words = all.replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
    const stop = new Set(["the", "a", "and", "of", "in", "to", "is", "at", "on", "for", "with", "by"]);
    for (let i = 0; i <= words.length - 3; i++) {
      const tri = words.slice(i, i + 3).join(" ");
      if (tri.split(" ").every((w) => stop.has(w))) continue;
      this.trigrams.set(tri, (this.trigrams.get(tri) ?? 0) + 1);
    }
  }

  contextBlock(): string {
    const op = [...this.firstWords.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const tg = [...this.trigrams.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (op.length === 0 && tg.length === 0) return "";
    const lines = ["\n\nCONTEXT — these patterns are starting to repeat across the batch. Use something different this time:"];
    if (op.length > 0) {
      lines.push("\nOpeners already used:");
      for (const [o, n] of op) lines.push(`  - "${o}…" (${n}×)`);
    }
    if (tg.length > 0) {
      lines.push("\nPhrases already used:");
      for (const [t, n] of tg) lines.push(`  - "${t}" (${n}×)`);
    }
    return lines.join("\n");
  }
}

// --- Website copy fetch (cached per slug, lightweight) ---
async function fetchWebsiteCopy(url: string | null): Promise<string> {
  if (!url) return "";
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NapaSonomaGuide/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    // Strip scripts, styles, tags
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, 2500);
  } catch {
    return "";
  }
}

// --- Wikipedia fallback (free) ---
// Tries the exact winery name, plus variations stripping/adding "Winery", "Cellars",
// "Vineyards", "Estate". Returns the lead extract if a non-disambiguation article matches.
async function fetchWikipediaSummary(name: string): Promise<string> {
  const variants = new Set<string>();
  variants.add(name);
  // Strip common suffixes
  const stripped = name
    .replace(/\s+(Winery|Cellars|Vineyards|Estate Winery|Estate|Family Winery|Family Vineyards|Vineyard|Wines)$/i, "")
    .trim();
  if (stripped !== name && stripped.length > 2) variants.add(stripped);
  // Try with "Winery" appended if not present
  if (!/\bwinery\b/i.test(name)) variants.add(`${stripped} Winery`);
  // Try with "(winery)" disambiguation suffix
  variants.add(`${stripped} (winery)`);

  for (const variant of variants) {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(variant)}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "NapaSonomaGuide/1.0 (https://www.napasonomaguide.com)" },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { type?: string; extract?: string; description?: string };
      // Skip disambiguation pages
      if (data.type === "disambiguation") continue;
      const extract = (data.extract ?? "").trim();
      // Filter out obviously-wrong matches (e.g., a person, a place that isn't the winery).
      // Cheap heuristic: extract should mention "wine", "winery", "vineyard", or "Napa"/"Sonoma"
      // somewhere in its first ~600 chars.
      const head = extract.slice(0, 600).toLowerCase();
      const looksWineRelated = /\b(wine|winery|vineyard|napa|sonoma)\b/.test(head);
      if (extract.length > 80 && looksWineRelated) {
        return extract.slice(0, 2000);
      }
    } catch {
      // continue to next variant
    }
  }
  return "";
}

// --- System prompt ---
const SYSTEM_PROMPT = `You are writing for napasonomaguide.com — a trusted, editorial wine country travel guide. Write as if you personally visited this winery and want to tell a friend about it. Each winery's prose should read like it was written by someone who only knows THAT specific place.

VOICE: Warm third-person, knowledgeable. No first person. No marketing copy. No filler. Concrete over abstract — always.

THE SWAP TEST: The most important rule. If you can replace the winery's name in your prose with another winery's name and the description still reads as plausible, you've failed. Every paragraph must contain at least one fact, name, or detail that ONLY applies to THIS winery.

FORBIDDEN PATTERNS (these are why the existing copy is being thrown out):
- Sensory clichés: "picture yourself", "imagine the", "the first sip", "lingers long", "leaves you in awe", "wow factor"
- Marketing adjectives: "exceptional", "captivating", "exquisite", "stunning", "breathtaking", "world-class", "unparalleled", "iconic", "must-visit", "unforgettable"
- Generic openers: "Experience the…", "Discover…", "Step into…", "Welcome to…"
- Fake-specific filler: "engaging journey", "sensory journey", "thoughtfully curated", "intimate setting", "rich aromas", "velvety tannins"
- Vague visuals: "rolling hills", "sun-drenched", "lush vineyards", "rustic charm", "inviting atmosphere", "modern design", "striking architecture"

LEAD WITH FACTS:
- Name a specific wine (its actual name, e.g. "Insignia", not "their Cabernet")
- Name a specific tasting experience (e.g. "the Bubble Room")
- Name a specific person (founder, winemaker — only if given in input)
- Name a specific year (founded, replanted, opened — only if given in input)
- Name a specific structure or feature (e.g. "the Caves at Soda Canyon", "the Villa Fiore")
- Name a specific neighbor or geography (e.g. "above the fog line in Atlas Peak")

If you don't have a real specific detail to lead with, write LESS, not more generic filler. A 2-sentence whyVisit grounded in two real facts beats 4 sentences of fluff.

NUMBERS AND NAMES MUST BE GROUNDED: Only use numbers, years, dollar amounts, and proper nouns that appear in the input. Do not invent. If the input doesn't say when the winery was founded, do not write a year.`;

function buildUserPrompt(ent: EntityContext, tastingDetails: string, varietyContext: string): string {
  const locStr = [ent.city, ent.subRegion, ent.valley === "napa" ? "Napa Valley" : ent.valley === "sonoma" ? "Sonoma County" : null]
    .filter(Boolean)
    .join(", ");
  return `Write voice-sensitive prose for this winery profile.

WINERY: ${ent.name}
LOCATION: ${locStr || "Wine country"}
DESCRIPTION (use as factual context, do not echo phrasing): ${ent.description ?? "(none)"}
TASTING EXPERIENCES: ${tastingDetails || "(none)"}
${ent.websiteCopy ? `\nFROM THE WINERY'S WEBSITE (factual source only — never echo phrasing):\n${ent.websiteCopy}` : ""}${ent.wikipediaCopy ? `\n\nFROM WIKIPEDIA (factual source only — verified third-party context, never echo phrasing):\n${ent.wikipediaCopy}` : ""}${varietyContext}

Apply every rule from the system prompt. Pass the swap test on every section.`;
}

// --- Main loop ---

interface Outcome {
  slug: string;
  name: string;
  ok: boolean;
  attempts: number;
  output: ProseOutput | null;
  violations: Violation[];
  inputTokens: number;
  outputTokens: number;
}

const MAX_ATTEMPTS = 3;
const DELAY_MS = 400;
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  const allWineries = await db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      city: wineries.city,
      subRegionId: wineries.subRegionId,
      description: wineries.description,
      websiteUrl: wineries.websiteUrl,
    })
    .from(wineries);

  const subRegionRows = await db.select().from(subRegions);
  const subRegionMap = new Map(subRegionRows.map((s) => [s.id, s]));

  let toProcess = allWineries;
  if (slugFilter.length > 0) {
    const set = new Set(slugFilter);
    toProcess = toProcess.filter((w) => set.has(w.slug));
    const found = new Set(toProcess.map((w) => w.slug));
    const missing = slugFilter.filter((s) => !found.has(s));
    if (missing.length > 0) {
      console.error(`Slugs not found: ${missing.join(", ")}`);
      process.exit(1);
    }
  } else if (toProcess.length > limit) {
    // Random sample if limit set without explicit slugs
    toProcess = toProcess.sort(() => Math.random() - 0.5).slice(0, limit);
  }

  console.log(`Regenerating prose for ${toProcess.length} wineries${dryRun ? " (dry run — no API calls)" : ""}\n`);
  console.log(`Output: ${outPath}\n`);

  const variety = new VarietyTracker();
  const outcomes: Outcome[] = [];
  let totalIn = 0, totalOut = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const w = toProcess[i];
    const sr = w.subRegionId ? subRegionMap.get(w.subRegionId) : null;
    const tastings = await db
      .select({ name: tastingExperiences.name, price: tastingExperiences.price, description: tastingExperiences.description })
      .from(tastingExperiences)
      .where(eq(tastingExperiences.wineryId, w.id));

    const tastingNames = tastings.map((t) => t.name).filter((n): n is string => !!n);
    const tastingDetails = tastings
      .map((t) => `${t.name}${t.price ? ` ($${t.price})` : ""}${t.description ? ` — ${t.description.slice(0, 200)}` : ""}`)
      .join("; ");

    // Fetch website first; only fall back to Wikipedia if the site returned
    // little or no usable content. Wikipedia is third-party context and we
    // should prefer the winery's own words whenever possible.
    const websiteCopy = dryRun ? "" : await fetchWebsiteCopy(w.websiteUrl);
    const WEBSITE_MIN_USEFUL_CHARS = 400;
    const wikipediaCopy =
      dryRun || websiteCopy.length >= WEBSITE_MIN_USEFUL_CHARS
        ? ""
        : await fetchWikipediaSummary(w.name);

    const ent: EntityContext = {
      name: w.name,
      slug: w.slug,
      city: w.city,
      subRegion: sr?.name ?? null,
      valley: sr?.valley ?? null,
      description: w.description,
      tastingNames,
      tastingDetails,
      websiteCopy,
      wikipediaCopy,
    };

    const progress = `[${i + 1}/${toProcess.length}]`;
    if (dryRun) {
      console.log(`${progress} ${w.name} (${w.slug}) — would generate (tastings: ${tastingNames.length}, website: ${websiteCopy.length} chars, wikipedia: ${wikipediaCopy.length} chars [fallback only if website < ${WEBSITE_MIN_USEFUL_CHARS}])`);
      continue;
    }
    if (wikipediaCopy.length > 0) {
      console.log(`  → using Wikipedia fallback (website returned ${websiteCopy.length} chars)`);
    }

    let attempts = 0;
    let lastFeedback = "";
    let success = false;
    let lastOutput: ProseOutput | null = null;
    let lastViolations: Violation[] = [];

    while (attempts < MAX_ATTEMPTS) {
      attempts++;
      let userPrompt = buildUserPrompt(ent, tastingDetails, variety.contextBlock());
      if (lastFeedback) {
        userPrompt += `\n\nRETRY — your previous attempt had these issues. Fix ALL of them:\n${lastFeedback}`;
      }

      try {
        const resp = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 1500,
          system: SYSTEM_PROMPT,
          tools: [PROSE_TOOL],
          tool_choice: { type: "tool", name: "write_winery_prose" },
          messages: [{ role: "user", content: userPrompt }],
        });
        totalIn += resp.usage.input_tokens;
        totalOut += resp.usage.output_tokens;

        const block = resp.content.find((c) => c.type === "tool_use");
        if (!block || block.type !== "tool_use") {
          lastFeedback = "API returned no tool_use block. Try again.";
          continue;
        }
        const out = block.input as ProseOutput;
        lastOutput = out;
        const violations = validateProse(out, ent);
        lastViolations = violations;
        if (violations.length === 0) {
          variety.record(out);
          success = true;
          break;
        }
        lastFeedback = violations.map((v) => `- ${v.type}: ${v.detail}`).join("\n");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        lastFeedback = `API error on previous attempt: ${msg}. Try again.`;
        await sleep(1000);
      }
    }

    if (success) {
      console.log(`${progress} ${w.name}: ✓ ${attempts > 1 ? `(after ${attempts} tries)` : ""}`);
    } else {
      console.log(`${progress} ${w.name}: ❌ failed after ${attempts} attempts — ${lastViolations.map((v) => v.type).join(", ")}`);
    }

    outcomes.push({
      slug: w.slug,
      name: w.name,
      ok: success,
      attempts,
      output: lastOutput,
      violations: lastViolations,
      inputTokens: 0, // tracked at totalIn level
      outputTokens: 0,
    });

    await sleep(DELAY_MS);
  }

  // --- Write output ---
  if (!dryRun) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const result = {
      generatedAt: new Date().toISOString(),
      totalEntities: outcomes.length,
      passed: outcomes.filter((o) => o.ok).length,
      failed: outcomes.filter((o) => !o.ok).length,
      tokenUsage: { input: totalIn, output: totalOut },
      estimatedCost: totalIn * 3 / 1_000_000 + totalOut * 15 / 1_000_000,
      entries: Object.fromEntries(outcomes.map((o) => [o.slug, o])),
    };
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.log(`\nWrote ${outPath}`);
    console.log(`Passed: ${result.passed}/${result.totalEntities}, Failed: ${result.failed}`);
    console.log(`Tokens: ${totalIn} in + ${totalOut} out`);
    console.log(`Cost: $${result.estimatedCost.toFixed(3)}`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
