/**
 * Regenerate voice-sensitive accommodation prose with Claude Sonnet 4.5.
 *
 * Replaces the existing gpt-4o-mini fluff in:
 *   - shortDescription   (hero subtitle, 1 sentence)
 *   - whyStayHere        (2-3 sentences, "convince me to book")
 *   - theSetting         (3-4 sentences, "what does this place look/feel like")
 *   - theExperience      (1 paragraph, "what staying here is like")
 *   - whyThisHotel       (3-5 bullets, JSON array)
 *
 * Outputs to data/accommodation-prose-v2.json. Does NOT write to DB. Run
 * apply-accommodation-prose.ts after human QC.
 *
 * KEY DIFFERENCE FROM WINERY VERSION:
 * Each entity already has a Sonnet 4.5–generated `spotlightTeaser` in the DB.
 * That column is the gold-standard voice for this site. We pass it to the
 * model as a "MATCH THIS VOICE" example so the regen can anchor on a known-
 * good sample written for THIS specific property.
 *
 * Usage:
 *   npx tsx scripts/regenerate-accommodation-prose.ts --dry-run
 *   npx tsx scripts/regenerate-accommodation-prose.ts --slug=auberge-du-soleil
 *   npx tsx scripts/regenerate-accommodation-prose.ts --limit=5
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { accommodations, subRegions } from "../src/db/schema";

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
  : path.resolve("data/accommodation-prose-v2.json");

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
  name: "write_accommodation_prose",
  description: "Write voice-sensitive editorial prose for a single accommodation.",
  input_schema: {
    type: "object",
    properties: {
      shortDescription: {
        type: "string",
        description:
          "ONE sentence, 60-110 chars. Concrete and specific to THIS property. Lead with what makes it different. NO 'Charming inn in X', 'Luxurious resort in Y' templates. NO 'must-stay', 'unforgettable', 'iconic'.",
      },
      whyStayHere: {
        type: "string",
        description:
          "2-3 sentences, 220-380 chars. Lead with the SINGLE most distinctive concrete detail — a specific named room, a specific structure (year built), a specific feature (mineral pool, vineyard view from a specific room). Then one sentence on what that means for the guest. NO 'envelops you', 'soothing ambiance', 'cherished moments', 'cozy retreat'. NO sensory clichés.",
      },
      theSetting: {
        type: "string",
        description:
          "3-4 sentences, 320-480 chars. The single most distinctive PHYSICAL feature first — named structure, year built, named exterior detail, named neighborhood location. NO 'striking architecture', 'vibrant gardens', 'lush greenery', 'rustic charm', 'inviting entrance'. Pass the swap test: if the property name could be replaced and the description still works, rewrite.",
      },
      theExperience: {
        type: "string",
        description:
          "2-4 sentences, 300-500 chars. What staying here is actually like — specific routines, specific named amenities, specific named meals/foods, specific named wines. NO 'memorable experience', 'magical ambiance', 'tranquil retreat', 'sense of connection'.",
      },
      whyThisHotel: {
        type: "array",
        items: { type: "string" },
        description:
          "EXACTLY 3-5 short bullet points (40-90 chars each). Each must contain a CONCRETE specific fact: a named room, a named amenity, a price, a year, a person. NO bullets like 'exceptional service' or 'beautiful gardens' or 'memorable hospitality'.",
      },
    },
    required: ["shortDescription", "whyStayHere", "theSetting", "theExperience", "whyThisHotel"],
  },
};

interface ProseOutput {
  shortDescription: string;
  whyStayHere: string;
  theSetting: string;
  theExperience: string;
  whyThisHotel: string[];
}

// --- Banned phrases (informed by 2026-05-06 audit + winery findings) ---
const BANNED_PHRASES = [
  "picture yourself",
  "picture the",
  "imagine the",
  "imagine yourself",
  "envelops you",
  "envelops guests",
  "warm embrace",
  "comforting embrace",
  "cherished moments",
  "cherished experience",
  "cherished memories",
  "magical ambiance",
  "soothing ambiance",
  "vibrant ambiance",
  "tranquil retreat",
  "tranquil backdrop",
  "cozy retreat",
  "peaceful retreat",
  "serene retreat",
  "calming ritual",
  "savor every moment",
  "every moment feels",
  "lingers long",
  "leaves you in awe",
  "leaves you eager",
  "captures the charm",
  "captures the essence",
  "capture the imagination",
  "captures attention",
  "must-stay",
  "must-visit",
  "memorable experience",
  "unforgettable experience",
  "unforgettable stay",
  "sense of connection",
  "sense of place",
  "perfect retreat",
  "perfect getaway",
  "perfect blend",
  "perfectly paired",
  "thoughtfully designed",
  "thoughtfully curated",
  "carefully curated",
  "harmoniously",
  "harmonizes beautifully",
  "blends seamlessly",
  "merges seamlessly",
  // Old enrich-content.ts list — keep as backstop
  "rolling hills",
  "sun-drenched",
  "lush vineyards",
  "lush gardens",
  "lush greenery",
  "warm glow",
  "golden light",
  "inviting atmosphere",
  "inviting entrance",
  "knowledgeable hosts",
];

const BANNED_WORDS = [
  "acclaimed",
  "captivating",
  "captivates",
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
  "whimsical",
  "vibrant",
];

const BANNED_OPENERS = [
  "experience the",
  "discover ",
  "explore ",
  "savor ",
  "welcome to ",
  "step into ",
  "as you arrive",
  "upon arrival",
  "as visitors",
  "guests are greeted",
  "the first thing that captures",
  "a stay at",
  "a unique blend",
  "a striking",
];

// --- Validation ---

interface Violation {
  type: string;
  detail: string;
}

interface EntityContext {
  name: string;
  slug: string;
  type: string;
  city: string | null;
  subRegion: string | null;
  valley: string | null;
  description: string | null;
  amenities: string[];
  rooms: string;
  spotlightTeaser: string | null;
  websiteCopy: string;
  wikipediaCopy: string;
}

function validateProse(out: ProseOutput, ent: EntityContext): Violation[] {
  const violations: Violation[] = [];
  const all = [
    out.shortDescription,
    out.whyStayHere,
    out.theSetting,
    out.theExperience,
    ...out.whyThisHotel,
  ].join(" \n ");
  const allLower = all.toLowerCase();

  for (const p of BANNED_PHRASES) {
    if (allLower.includes(p)) violations.push({ type: "banned-phrase", detail: `"${p}"` });
  }
  for (const w of BANNED_WORDS) {
    const re = new RegExp(`\\b${w}\\b`, "i");
    if (re.test(all)) violations.push({ type: "banned-word", detail: `"${w}"` });
  }

  const sections: Array<[string, string]> = [
    ["whyStayHere", out.whyStayHere],
    ["theSetting", out.theSetting],
    ["theExperience", out.theExperience],
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

  // Length bounds
  if (out.shortDescription.length < 40 || out.shortDescription.length > 130) {
    violations.push({ type: "length", detail: `shortDescription ${out.shortDescription.length} chars (want 40-130)` });
  }
  if (out.whyStayHere.length < 180 || out.whyStayHere.length > 420) {
    violations.push({ type: "length", detail: `whyStayHere ${out.whyStayHere.length} chars (want 180-420)` });
  }
  if (out.theSetting.length < 280 || out.theSetting.length > 540) {
    violations.push({ type: "length", detail: `theSetting ${out.theSetting.length} chars (want 280-540)` });
  }
  if (out.theExperience.length < 240 || out.theExperience.length > 580) {
    violations.push({ type: "length", detail: `theExperience ${out.theExperience.length} chars (want 240-580)` });
  }
  if (out.whyThisHotel.length < 3 || out.whyThisHotel.length > 5) {
    violations.push({ type: "bullets", detail: `whyThisHotel has ${out.whyThisHotel.length} (want 3-5)` });
  }
  for (const b of out.whyThisHotel) {
    if (b.length < 30 || b.length > 110) {
      violations.push({ type: "bullet-length", detail: `bullet ${b.length} chars: "${b.slice(0, 60)}..."` });
    }
  }

  // Concrete-noun-in-first-sentence
  function firstSentenceHasConcrete(txt: string): boolean {
    // Don't split on abbreviations like "St.", "Mt.", "Dr.", "Ave.", "Inc."
    // Replace abbreviation periods with a placeholder before splitting, then restore.
    const ABBR_RE = /\b(St|Mt|Mr|Mrs|Ms|Dr|Ave|Blvd|Rd|Inc|Ltd|Co|Capt|Sgt|Lt|Jr|Sr|Vol|No|Vs|Etc|Hwy)\.\s+(?=[A-Z])/g;
    const PH = "\x00";
    const protectedTxt = txt.replace(ABBR_RE, (m) => m.replace(".", PH));
    const first = (protectedTxt.split(/(?<=[.!?])\s+/)[0] ?? protectedTxt).replace(new RegExp(PH, "g"), ".");
    if (!first) return false;
    const lower = first.toLowerCase();
    // Strip punctuation from name tokens so "Solage," matches "Solage"
    const nameTokens = ent.name
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.replace(/[^a-z0-9]/g, ""))
      .filter((t) => t.length >= 4 && !["hotel", "inn", "resort", "house", "country"].includes(t));
    if (nameTokens.length > 0 && nameTokens.some((t) => lower.includes(t))) return true;
    if (/\b(19|20)\d{2}\b/.test(first)) return true;
    if (/\$\d{1,4}/.test(first)) return true;
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
  if (!firstSentenceHasConcrete(out.whyStayHere)) {
    violations.push({ type: "no-concrete-first-sentence", detail: "whyStayHere first sentence lacks concrete noun/year/$/name" });
  }
  if (!firstSentenceHasConcrete(out.theSetting)) {
    violations.push({ type: "no-concrete-first-sentence", detail: "theSetting first sentence lacks concrete noun/year/$/name" });
  }

  // Swap test — strip punctuation from name tokens before matching
  const nameRoot = ent.name
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ""))
    .filter((t) => t.length >= 4 && !["hotel", "inn", "resort", "house"].includes(t))[0];
  const hasName = nameRoot ? allLower.includes(nameRoot) : true;
  if (!hasName) {
    violations.push({ type: "swap-test-fail", detail: "prose doesn't mention the property name; could describe any property" });
  }

  // Factuality — multi-digit numbers in output must appear in input context
  const allowedText = [
    ent.name,
    ent.city ?? "",
    ent.subRegion ?? "",
    ent.description ?? "",
    ent.amenities.join(" "),
    ent.rooms,
    ent.spotlightTeaser ?? "",
    ent.websiteCopy,
    ent.wikipediaCopy,
  ].join(" ").toLowerCase();
  const numberMatches = all.match(/\b\d{2,4}\b/g) ?? [];
  const seen = new Set<string>();
  for (const num of numberMatches) {
    if (seen.has(num)) continue;
    seen.add(num);
    if (allowedText.includes(num)) continue;
    if (allowedText.includes(`$${num}`)) continue;
    violations.push({ type: "unverified-number", detail: `output mentions "${num}" not present in input context` });
  }

  return violations;
}

// --- Variety tracker ---
class VarietyTracker {
  private firstWords = new Map<string, number>();
  private trigrams = new Map<string, number>();

  record(out: ProseOutput) {
    const all = `${out.whyStayHere} ${out.theSetting} ${out.theExperience}`.toLowerCase();
    const opener = out.whyStayHere.trim().split(/\s+/).slice(0, 4).join(" ").toLowerCase();
    if (opener) this.firstWords.set(opener, (this.firstWords.get(opener) ?? 0) + 1);
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
    const lines = ["\n\nCONTEXT — these patterns are repeating across the batch. Use something different:"];
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

async function fetchWebsiteCopy(url: string | null): Promise<string> {
  if (!url) return "";
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NapaSonomaGuide/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2500);
  } catch {
    return "";
  }
}

async function fetchWikipediaSummary(name: string): Promise<string> {
  const variants = new Set<string>();
  variants.add(name);
  const stripped = name.replace(/\s+(Hotel|Inn|Resort|Lodge|Spa|House)$/i, "").trim();
  if (stripped !== name && stripped.length > 2) variants.add(stripped);
  for (const v of variants) {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(v)}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "NapaSonomaGuide/1.0 (https://www.napasonomaguide.com)" },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { type?: string; extract?: string };
      if (data.type === "disambiguation") continue;
      const extract = (data.extract ?? "").trim();
      const head = extract.slice(0, 600).toLowerCase();
      const looksRelevant = /\b(hotel|inn|resort|napa|sonoma|wine country|spa)\b/.test(head);
      if (extract.length > 80 && looksRelevant) return extract.slice(0, 2000);
    } catch { /* continue */ }
  }
  return "";
}

const SYSTEM_PROMPT = `You are writing for napasonomaguide.com — a trusted, editorial wine country travel guide. Write as if you personally stayed at this property and want to tell a friend about it. Each property's prose should read like it was written by someone who only knows THAT specific place.

VOICE: Warm third-person, conversational. No first person. No marketing copy. No filler. Concrete over abstract — always.

THE SWAP TEST: The most important rule. If you can replace the property's name in your prose with another hotel's name and the description still reads as plausible, you've failed. Every paragraph must contain at least one fact, name, or detail that ONLY applies to THIS property.

FORBIDDEN PATTERNS (these are why the existing copy is being thrown out):
- Sensory fluff: "envelops you", "warm embrace", "magical ambiance", "soothing ambiance", "cherished moments", "savor every moment", "lingers long"
- Marketing adjectives: "exceptional", "captivating", "exquisite", "stunning", "breathtaking", "world-class", "iconic", "must-stay", "memorable", "unforgettable"
- Generic openers: "Experience the…", "Discover…", "Welcome to…", "A stay at…", "A striking…", "The first thing that captures…"
- Fake-specific filler: "thoughtfully designed", "carefully curated", "sense of connection", "perfect retreat", "tranquil backdrop"
- Vague visuals: "rolling hills", "lush gardens", "vibrant gardens", "rustic charm", "inviting atmosphere", "modern design", "striking architecture"

LEAD WITH FACTS — REQUIRED IN THE FIRST SENTENCE OF whyStayHere AND theSetting:
- A specific named room (e.g., "the Cypress Cottage", "the Jensen Room")
- A specific year (built, renovated, opened — only if given in input)
- A specific named structure or feature (e.g., "the Carriage House", "the 1909 building")
- A specific named menu item or local product
- The property name itself

The first sentence of whyStayHere and theSetting MUST contain at least one of the above. "The balcony rooms face west" doesn't qualify (generic). "The Vineyard View Collection Suite faces west" does.

PROPERTY NAME REQUIREMENT: The property name (e.g., "Auberge du Soleil", "Harvest Inn", "Meadowlark") MUST appear at least once across your prose. Pick the section where it fits most naturally. This is non-negotiable — without the name, the description is pseudo-generic.

If you don't have a real specific detail, write LESS, not more generic filler.

NUMBERS AND NAMES MUST BE GROUNDED: Only use numbers, years, dollar amounts, and proper nouns that appear in the input. Do not invent.`;

function buildUserPrompt(ent: EntityContext, varietyContext: string): string {
  const locStr = [ent.city, ent.subRegion, ent.valley === "napa" ? "Napa Valley" : ent.valley === "sonoma" ? "Sonoma County" : null]
    .filter(Boolean).join(", ");

  const voiceAnchor = ent.spotlightTeaser
    ? `\n\nVOICE ANCHOR — this is a 2-sentence teaser already written for THIS property in the same site voice you should match. Don't echo its specific phrases, but let its level of concreteness, conversational rhythm, and "knowing observation" set the bar:\n"${ent.spotlightTeaser}"`
    : "";

  return `Write voice-sensitive prose for this accommodation profile.

PROPERTY: ${ent.name}
TYPE: ${ent.type}
LOCATION: ${locStr || "Wine country"}
DESCRIPTION (factual context, do not echo phrasing): ${ent.description ?? "(none)"}
AMENITIES: ${ent.amenities.join(", ") || "(none)"}
${ent.rooms ? `\nROOMS: ${ent.rooms}` : ""}${voiceAnchor}
${ent.websiteCopy ? `\n\nFROM THE PROPERTY'S WEBSITE (factual source — never echo phrasing):\n${ent.websiteCopy}` : ""}${ent.wikipediaCopy ? `\n\nFROM WIKIPEDIA (third-party context, never echo phrasing):\n${ent.wikipediaCopy}` : ""}${varietyContext}

Apply every rule from the system prompt. Pass the swap test on every section.`;
}

interface Outcome {
  slug: string;
  name: string;
  ok: boolean;
  attempts: number;
  output: ProseOutput | null;
  violations: Violation[];
  hasVoiceAnchor: boolean;
}

const MAX_ATTEMPTS = 3;
const DELAY_MS = 400;
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  const allRows = await db.select().from(accommodations);
  const subRegionRows = await db.select().from(subRegions);
  const subRegionMap = new Map(subRegionRows.map((s) => [s.id, s]));

  let toProcess = allRows;
  if (slugFilter.length > 0) {
    const set = new Set(slugFilter);
    toProcess = toProcess.filter((a) => set.has(a.slug));
    const found = new Set(toProcess.map((a) => a.slug));
    const missing = slugFilter.filter((s) => !found.has(s));
    if (missing.length > 0) {
      console.error(`Slugs not found: ${missing.join(", ")}`);
      process.exit(1);
    }
  } else if (toProcess.length > limit) {
    toProcess = toProcess.sort(() => Math.random() - 0.5).slice(0, limit);
  }

  console.log(`Regenerating prose for ${toProcess.length} accommodations${dryRun ? " (dry run — no API calls)" : ""}`);
  console.log(`Output: ${outPath}\n`);

  const variety = new VarietyTracker();
  const outcomes: Outcome[] = [];
  let totalIn = 0, totalOut = 0;
  let withAnchor = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const a = toProcess[i];
    const sr = a.subRegionId ? subRegionMap.get(a.subRegionId) : null;
    const amenities: string[] = [];
    if (a.amenitiesJson) {
      try {
        const parsed = JSON.parse(a.amenitiesJson);
        if (Array.isArray(parsed)) amenities.push(...parsed);
      } catch { /* ignore */ }
    }
    if (a.dogFriendly) amenities.push("Dog-friendly");
    if (a.kidFriendly) amenities.push("Kid-friendly");
    if (a.adultsOnly) amenities.push("Adults-only");
    if (a.sustainable) amenities.push("Sustainable");

    let rooms = "";
    if (a.roomsJson) {
      try {
        const parsed = JSON.parse(a.roomsJson);
        if (Array.isArray(parsed)) {
          rooms = parsed
            .map((r: { name?: string; description?: string; price?: string | number }) =>
              `${r.name ?? ""}${r.price ? ` ($${r.price})` : ""}${r.description ? ` — ${String(r.description).slice(0, 150)}` : ""}`)
            .filter((s: string) => s.trim())
            .slice(0, 8)
            .join("; ");
        }
      } catch { /* ignore */ }
    }

    const websiteCopy = dryRun ? "" : await fetchWebsiteCopy(a.websiteUrl);
    const WEBSITE_MIN_USEFUL_CHARS = 400;
    const wikipediaCopy =
      dryRun || websiteCopy.length >= WEBSITE_MIN_USEFUL_CHARS
        ? ""
        : await fetchWikipediaSummary(a.name);

    const ent: EntityContext = {
      name: a.name,
      slug: a.slug,
      type: a.type,
      city: a.city,
      subRegion: sr?.name ?? null,
      valley: sr?.valley ?? a.valley ?? null,
      description: a.description,
      amenities,
      rooms,
      spotlightTeaser: a.spotlightTeaser,
      websiteCopy,
      wikipediaCopy,
    };
    if (ent.spotlightTeaser) withAnchor++;

    const progress = `[${i + 1}/${toProcess.length}]`;
    if (dryRun) {
      console.log(`${progress} ${a.name} — would generate (rooms: ${rooms.length} ch, web: ${websiteCopy.length} ch, anchor: ${ent.spotlightTeaser ? "yes" : "no"})`);
      continue;
    }

    let attempts = 0;
    let lastFeedback = "";
    let success = false;
    let lastOutput: ProseOutput | null = null;
    let lastViolations: Violation[] = [];

    while (attempts < MAX_ATTEMPTS) {
      attempts++;
      let userPrompt = buildUserPrompt(ent, variety.contextBlock());
      if (lastFeedback) {
        userPrompt += `\n\nRETRY — your previous attempt had these issues. Fix ALL of them:\n${lastFeedback}`;
      }
      try {
        const resp = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 1500,
          system: SYSTEM_PROMPT,
          tools: [PROSE_TOOL],
          tool_choice: { type: "tool", name: "write_accommodation_prose" },
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
        lastFeedback = `API error: ${msg}. Try again.`;
        await sleep(1000);
      }
    }

    if (success) console.log(`${progress} ${a.name}: ✓ ${attempts > 1 ? `(after ${attempts} tries)` : ""}`);
    else console.log(`${progress} ${a.name}: ❌ failed after ${attempts} attempts — ${lastViolations.map((v) => v.type).join(", ")}`);

    outcomes.push({
      slug: a.slug,
      name: a.name,
      ok: success,
      attempts,
      output: lastOutput,
      violations: lastViolations,
      hasVoiceAnchor: !!ent.spotlightTeaser,
    });

    await sleep(DELAY_MS);
  }

  if (!dryRun) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const result = {
      generatedAt: new Date().toISOString(),
      totalEntities: outcomes.length,
      passed: outcomes.filter((o) => o.ok).length,
      failed: outcomes.filter((o) => !o.ok).length,
      withVoiceAnchor: withAnchor,
      tokenUsage: { input: totalIn, output: totalOut },
      estimatedCost: totalIn * 3 / 1_000_000 + totalOut * 15 / 1_000_000,
      entries: Object.fromEntries(outcomes.map((o) => [o.slug, o])),
    };
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.log(`\nWrote ${outPath}`);
    console.log(`Passed: ${result.passed}/${result.totalEntities} (${withAnchor} had voice anchor)`);
    console.log(`Tokens: ${totalIn} in + ${totalOut} out`);
    console.log(`Cost: $${result.estimatedCost.toFixed(3)}`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
