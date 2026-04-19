/**
 * Generate social media captions + overlay text for wineries and accommodations.
 *
 * Uses Claude Sonnet 4.6 with tool-based structured output. Pulls editorial
 * fields from Turso, generates per-entity captions, appends hashtags from the
 * hashtag library, and inserts draft rows into social_posts.
 *
 * Usage:
 *   npx tsx scripts/generate-social-batch.ts --dry-run            # preview cost
 *   npx tsx scripts/generate-social-batch.ts --limit=20 --force   # 20-entity test
 *   npx tsx scripts/generate-social-batch.ts --type=winery        # wineries only
 *   npx tsx scripts/generate-social-batch.ts --slug=opus-one      # specific entity
 *   npx tsx scripts/generate-social-batch.ts --only-failures      # retry only failed
 *   npx tsx scripts/generate-social-batch.ts --force              # full batch (overwrite)
 *
 * Features:
 * - Entities shuffled so wineries + hotels interleave (breaks pattern clustering)
 * - Live VarietyTracker injects "recently used openings/phrases" into later prompts
 * - validateCaption() checks each output; auto-retries up to 3 times with feedback
 * - Hashtag helpers are entity-type-aware (no #winery tags on hotels, etc.)
 * - Final audit report prints opener distribution, repeated phrases, failures
 *
 * Cost: Claude Sonnet 4.5 at $3/M input + $15/M output.
 *   ~315 entities × ~1500 tokens/entity ≈ ~$4-5 total (with variety context).
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import Anthropic from "@anthropic-ai/sdk";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import {
  wineries,
  accommodations,
  wineryPhotos,
  accommodationPhotos,
  socialPosts,
  subRegions,
} from "../src/db/schema";
import { eq, and, sql, isNull } from "drizzle-orm";
import {
  buildInstagramHashtags,
  buildPinterestKeywords,
} from "../src/lib/social/hashtag-library";

// --- CLI args ---
const dryRun = process.argv.includes("--dry-run");
const limitArg = process.argv
  .find((a) => a.startsWith("--limit="))
  ?.split("=")[1];
const limit = limitArg ? parseInt(limitArg, 10) : Infinity;
const typeFilter = process.argv
  .find((a) => a.startsWith("--type="))
  ?.split("=")[1] as "winery" | "accommodation" | undefined;
// Collect all --slug=foo args (supports multiple)
const slugFilter = process.argv
  .filter((a) => a.startsWith("--slug="))
  .map((a) => a.split("=")[1])
  .filter(Boolean);
const forceOverwrite = process.argv.includes("--force");
const onlyFailures = process.argv.includes("--only-failures");

// --- DB setup ---
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

// --- Zod schema for structured output ---

// Tool definition for Claude's structured output
const CAPTION_TOOL = {
  name: "write_social_caption",
  description: "Write a social media caption for this entity using the structured format.",
  input_schema: {
    type: "object" as const,
    properties: {
      overlayHeadline: {
        type: "string",
        description:
          "2-5 words. The main text on the card image. Usually the entity name, but can be a punchy variant (e.g. 'Opus One' not 'Opus One Winery'). Short enough to read at phone-glance speed.",
      },
      overlaySubtext: {
        type: "string",
        description:
          "4-8 words. A fragment, not a sentence. The single most evocative detail about THIS specific place — the kind of thing you'd whisper to a friend. 'Cave-aged, zero pretension' or 'The dog runs the place' or 'Converted 1890s dairy barn'. Not a tagline. Not 'Acclaimed wines, beautiful setting'.",
      },
      captionInstagram: {
        type: "string",
        description:
          "EXACTLY two sentences, 100-180 chars total. First sentence: a physical or atmospheric detail that grounds the reader in THIS specific place. Second sentence: why go — broadly appealing, emotional, makes non-experts want to book. NO specific vintages, bottle names, case numbers, winemaker names. No hashtags.",
      },
      captionPinterest: {
        type: "string",
        description:
          "EXACTLY two sentences, 180-300 chars. Same two-part structure with more room. Weave in the entity name, city, and place-specific details. NO specific vintages or bottle names. Natural language. No hashtags.",
      },
    },
    required: [
      "overlayHeadline",
      "overlaySubtext",
      "captionInstagram",
      "captionPinterest",
    ],
  },
};

interface CaptionOutput {
  overlayHeadline: string;
  overlaySubtext: string;
  captionInstagram: string;
  captionPinterest: string;
}

const DELAY_MS = 300;
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- Validation ---

interface Violation {
  type: string;
  detail: string;
}

const BANNED_PHRASES = [
  "kind of",
  "makes you slow",
  "makes you stop",
  "makes you forget",
  "forget to check your phone",
  "fall asleep to",
  "nobody's in a hurry",
  "kids run between",
  "dogs nap under",
  "boots still dusty",
  "long after you leave",
  "lingers long",
  "rooted in the land",
  "still talking about it weeks later",
  "nothing on the table is there by accident",
  "nothing is there by accident",
];

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
  "hidden gem",
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
  "discover ",
  "experience ",
  "explore ",
  "savor ",
  "welcome to ",
  "step into ",
  "looking for ",
  "as the sun",
  "overlooking",
];

// --- Factuality validator ---
// Catches Claude inventing specific numbers or chef names that weren't in
// the editorial context we passed it. Uses substring matching — not semantic,
// but reliably catches the "model made up a number" failure mode.

function validateFactuality(c: CaptionOutput, entity: EntityData): Violation[] {
  const errors: Violation[] = [];
  const captionText = `${c.captionInstagram} ${c.captionPinterest}`;

  // Build the allowed text: everything the model was given as context
  const allowedText = [
    entity.name,
    entity.city ?? "",
    entity.region ?? "",
    entity.editorial,
  ]
    .join(" ")
    .toLowerCase();

  // 1. Multi-digit numbers must appear in the editorial context
  // Skip 2-digit numbers that are likely degrees, percentages, or common quantities
  // (still flag them, but this is where false positives can come from — retry will fix)
  const numberMatches = captionText.match(/\b\d{2,}\b/g) ?? [];
  const seenNumbers = new Set<string>();
  for (const num of numberMatches) {
    if (seenNumbers.has(num)) continue;
    seenNumbers.add(num);
    if (!allowedText.includes(num)) {
      errors.push({
        type: "unverified-number",
        detail: `caption mentions "${num}" but it's not in the editorial context`,
      });
    }
  }

  // 2. "Chef [Name]" patterns must reference a name in context
  const chefMatches =
    captionText.match(/Chef\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g) ?? [];
  const seenChefs = new Set<string>();
  for (const chef of chefMatches) {
    if (seenChefs.has(chef)) continue;
    seenChefs.add(chef);
    // Extract just the name portion
    const name = chef.replace(/^Chef\s+/, "").toLowerCase();
    // Require that at least one part of the name appears in context
    const nameParts = name.split(/\s+/);
    const anyPartInContext = nameParts.some((p) => allowedText.includes(p));
    if (!anyPartInContext) {
      errors.push({
        type: "unverified-name",
        detail: `"${chef}" not found in editorial context`,
      });
    }
  }

  // 3. "Chef-Michelin", "Michelin-starred", "LEED-certified" — flag if not in context
  const certificationPhrases = [
    /michelin[- ]starred/i,
    /michelin star/i,
    /leed[- ]certified/i,
    /james beard/i,
  ];
  for (const re of certificationPhrases) {
    const m = captionText.match(re);
    if (m && !allowedText.includes(m[0].toLowerCase())) {
      errors.push({
        type: "unverified-certification",
        detail: `caption mentions "${m[0]}" but it's not in the editorial context`,
      });
    }
  }

  // 4. "Oldest", "first", "only" superlatives paired with a specific claim
  // Flag "the only [X] in [Y]" or "the oldest [X] in [Y]" — these are high-risk
  const superlativeMatches = captionText.match(
    /\b(the only|the oldest|the first|the largest)\s+[^.,]{5,60}\bin\s+[A-Z][\w\s]+/gi
  ) ?? [];
  for (const claim of superlativeMatches) {
    const claimLower = claim.toLowerCase();
    // If the superlative structure doesn't appear verbatim in context, flag it
    const structureWords = claim.toLowerCase().match(/\b(only|oldest|first|largest)\b/);
    if (structureWords && !allowedText.includes(structureWords[0])) {
      errors.push({
        type: "unverified-superlative",
        detail: `caption claims "${claim.slice(0, 80)}" — superlative not supported in context`,
      });
    }
  }

  return errors;
}

function validateCaption(c: CaptionOutput, entity: EntityData): Violation[] {
  const errors: Violation[] = [];
  const ig = c.captionInstagram ?? "";
  const pin = c.captionPinterest ?? "";
  const igLower = ig.toLowerCase();
  const pinLower = pin.toLowerCase();

  // 1. Entity name must appear early in IG caption.
  // Don't split on periods (breaks on abbreviations like "St.", "Dr.", "V.").
  // Check the first 150 chars instead — that's the first-sentence window in practice.
  const igOpening = ig.slice(0, 150).toLowerCase();
  const nameTokens = entity.name
    .toLowerCase()
    .replace(/[’']s\b/g, "")
    .split(/\s+/)
    .filter((t) => t.length >= 4); // skip "st.", "v.", "dr.", "the", "and", etc.

  // Fallback: if every token was a short abbreviation, just use the whole name
  const tokensToCheck =
    nameTokens.length > 0 ? nameTokens : [entity.name.toLowerCase()];

  const nameFound = tokensToCheck.some((t) => igOpening.includes(t));
  if (!nameFound) {
    errors.push({
      type: "missing-name",
      detail: `IG opening doesn't contain any of: ${tokensToCheck.join(", ")}`,
    });
  }

  // 2. Banned phrases
  for (const p of BANNED_PHRASES) {
    if (igLower.includes(p)) {
      errors.push({ type: "banned-phrase", detail: `IG: "${p}"` });
    }
    if (pinLower.includes(p)) {
      errors.push({ type: "banned-phrase", detail: `Pinterest: "${p}"` });
    }
  }

  // 3. Banned hyperbolic words (use word boundaries where possible)
  for (const w of BANNED_WORDS) {
    const re = new RegExp(`\\b${w}\\b`, "i");
    if (re.test(ig)) errors.push({ type: "banned-word", detail: `IG: "${w}"` });
    if (re.test(pin))
      errors.push({ type: "banned-word", detail: `Pinterest: "${w}"` });
  }

  // 4. Banned openers (only check IG's first 40 chars)
  const igStart = igLower.trim().slice(0, 40);
  for (const o of BANNED_OPENERS) {
    if (igStart.startsWith(o)) {
      errors.push({ type: "banned-opener", detail: `IG starts with "${o.trim()}"` });
    }
  }

  // 5. Length bounds — loosened after first full batch showed many legit captions at 240-280
  if (ig.length < 80 || ig.length > 280) {
    errors.push({ type: "ig-length", detail: `${ig.length} chars (want 80-280)` });
  }
  if (pin.length < 140 || pin.length > 400) {
    errors.push({ type: "pin-length", detail: `${pin.length} chars (want 140-400)` });
  }

  return errors;
}

// --- Variety tracker (live pattern awareness across the batch) ---

class VarietyTracker {
  // First 4 words of each IG caption → count
  private openings = new Map<string, number>();
  // 3-word phrases in any caption → count
  private phrases = new Map<string, number>();

  recordCaption(ig: string, pin: string) {
    // Opener (first 4 words of IG, lowercased, no leading "The"/"A"/"An" stripped)
    const firstFour = ig.trim().split(/\s+/).slice(0, 4).join(" ").toLowerCase();
    if (firstFour) {
      this.openings.set(firstFour, (this.openings.get(firstFour) ?? 0) + 1);
    }

    // 3-word rolling phrases across both captions (skip stopword-only ones)
    const text = `${ig} ${pin}`.toLowerCase().replace(/[^a-z\s]/g, " ");
    const words = text.split(/\s+/).filter(Boolean);
    for (let i = 0; i <= words.length - 3; i++) {
      const tri = words.slice(i, i + 3).join(" ");
      // Skip trigrams dominated by stopwords
      const stopish = ["the", "a", "and", "of", "in", "to", "is", "at", "it", "on"];
      if (tri.split(" ").every((w) => stopish.includes(w))) continue;
      this.phrases.set(tri, (this.phrases.get(tri) ?? 0) + 1);
    }
  }

  getContextBlock(): string {
    // Only surface the ones that are starting to repeat
    const repeatedOpeners = [...this.openings.entries()]
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    const repeatedPhrases = [...this.phrases.entries()]
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (repeatedOpeners.length === 0 && repeatedPhrases.length === 0)
      return "";

    const lines = [
      "\n\nCONTEXT — These patterns are starting to repeat across the batch. Use something different this time:",
    ];
    if (repeatedOpeners.length > 0) {
      lines.push("\nOpeners already used:");
      for (const [opener, n] of repeatedOpeners) {
        lines.push(`  - "${opener}…" (${n} times)`);
      }
    }
    if (repeatedPhrases.length > 0) {
      lines.push("\nPhrases already used in the batch:");
      for (const [phrase, n] of repeatedPhrases) {
        lines.push(`  - "${phrase}" (${n} times)`);
      }
    }
    lines.push(
      "\nPick a different opening pattern and fresh phrasing — do not reuse any of the above."
    );
    return lines.join("\n");
  }

  getOpeningsDistribution() {
    return [...this.openings.entries()].sort((a, b) => b[1] - a[1]);
  }

  getRepeatedPhrases(minCount = 2) {
    return [...this.phrases.entries()]
      .filter(([, n]) => n >= minCount)
      .sort((a, b) => b[1] - a[1]);
  }
}

// --- System prompt ---

const SYSTEM_PROMPT = `You are writing social captions for napasonomaguide.com. Each caption is paired with ONE hero photo of the winery or hotel, and posted on Instagram or Pinterest. Your captions must make readers tap through to the site and want to book a visit.

OBJECTIVE
Create intrigue that pulls readers in. Specificity + emotional hook + trust. No "link in bio," no "DM us," no fake urgency — let the intrigue do the work.

CAPTION ≠ IMAGE
The image shows what the place looks like. Your caption must add what the photo CAN'T convey — scent, sound, history, the people who show up, the scene playing out across a visit. If your first sentence could be written by just looking at a photo ("A beautiful tasting room with views of…"), rewrite it. The caption should make someone who already saw the photo want to know more.

STRUCTURE — two sentences, in this order:
1. Ground the reader in THIS specific place. Include the entity name in this first sentence. Pick one concrete detail a visitor would actually notice — something that makes this place not interchangeable with any other.
2. Why go. The moment, the feeling, the reason to book. Broadly appealing, emotional, no wine-expert knowledge required.

THE STRIPPED-NAME TEST (apply before finalizing)
Remove the entity name from your caption. Could the result describe fifty other Napa/Sonoma places? If yes, rewrite. Generic phrases ("stunning views," "perfect atmosphere," "where wine and nature come together") fail this test.

WHAT TO MENTION
- Physical detail: architecture, outdoor spaces, gardens, the drive in, unusual buildings, views, what you see when you walk in
- Experience: vibe (intimate, buzzing, quiet, casual, refined), who shows up, what makes a visit memorable
- History + people: family-run, owner still pours, generations-deep, a notable chef, a reclaimed building
- Classifications (fine when factually true): biodynamic, organic, sustainable, estate-grown, dry-farmed, LEED-certified

WHAT NOT TO MENTION
- Specific vintage years ("2021 Estate Cab")
- Specific bottle names or reserve labels
- Case-production numbers
- Winemaker names (unless the place is defined by them, like Hamel's chef)
- Named tasting flights (names change)
- Wine-snob jargon that requires expertise

FACTUAL ACCURACY (strict — this site is a trusted source)
- Do NOT invent specific numbers, years, acreage, heights, distances, case counts, ratings, or quantities. Only use numbers that appear in the editorial context I provide below. If you want to say "ten-course dinner", that number must be in the context. Same for "190 acres", "1884", "22 feet", etc.
- Do NOT invent chef names, winemaker names, owner names, family names, or staff names. If a name appears in the context, you may use it; otherwise omit it entirely.
- Do NOT invent certifications or claims ("LEED-certified", "Michelin-starred", "first in Napa to…", "oldest in…") unless the context explicitly states it.
- When specifics aren't in the context, default to general description. "A hillside winery" is better than "a 40-acre hillside winery" if acreage wasn't given.
- Do NOT reuse phrasing from what you might know about the place's own website. Write original sentences in your own words — rearrange the provided facts, don't echo source marketing copy.

VOICE
- A person wrote this, not a brand. Confident, warm, never salesy.
- Specific adjectives are fine ("weathered barn," "volcanic slopes"). Hyperbolic ones are not.
- Vary sentence length — a short, punchy line can land after a longer one.
- Every caption should feel like a different person wrote it. Different rhythm, different angle, different pride point.

BANNED HYPERBOLIC WORDS (reliably mark AI copy)
"acclaimed", "captivating", "exceptional", "unforgettable", "exquisite", "stunning", "breathtaking", "world-class", "must-visit", "hidden gem", "crafted with passion", "the magic of", "sets the stage", "creating a perfect backdrop", "celebrates", "immerse", "immersive", "indulge", "nestled", "sun-drenched", "rolling hills", "a true", "harmoniously", "elegance meets"

BANNED OPENERS
"Discover", "Experience", "Explore", "Savor", "Welcome to", "Step into", "Looking for", "As the sun…", "Overlooking…"
Also: don't start with "At [Name]," as a standalone clause.

BANNED TEMPLATE PHRASES (these got copied across 100+ prior outputs — do not use in any form)
- "the kind of ___" (any form — "kind of place," "kind of pairing," "kind of experience," etc.)
- "makes you [verb]" as a closer ("makes you slow down," "makes you forget")
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

OPENER VARIETY — mix across these patterns so 315 captions don't all start the same way:
- Entity name as subject: "Hamel Estate sits on volcanic slopes…"
- Sensory detail first: "Cookies come out of the oven every afternoon at…"
- A character / action: "The owner pours most of the flights himself at…"
- Time-of-day hook: "By 3pm, the courtyard at [Name] fills up…"
- A surprising fact: "Five generations of the family still farm…"
- A fragment: "Three walls of glass. Two sculptures out front. That's [Name]."
- A direct observation: "[Name] is one of the few places where…"

EXAMPLES

Example 1 — winery, refined:
"Jordan Winery's terracotta chateau rises out of the olive grove you pass on the way in, and once you're on the terrace the valley just opens up. The estate chef cooks each pairing to the wine already in your glass, so it feels less like a tasting and more like being invited over."

Example 2 — winery, casual:
"Frog's Leap grows heirloom vegetables right next to the vines, and you'll taste a few of them alongside the wine. The red barn, the gardens, the dogs — it all adds up to a quieter, slower Napa than most places let you have."

Example 3 — hotel, boutique:
"The Inn on Pine bakes cookies in the afternoon, and every room has a private deck looking at the Palisades. Calistoga hot springs are ten minutes away, but most guests end up just sitting on their deck."

Example 4 — hotel, refined:
"Auberge du Soleil carves into the Rutherford hillside like it's always been there, with vineyard terraces stepping down below your suite. You check in, you don't really leave — meals, spa, and valley views are all within a few minutes' walk."

Note how all four: include the entity name in sentence one, avoid "the kind of," use varied openers, avoid banned words, and add what a photo can't show (history, the walk, the chef, the rhythm of a stay).`;

// --- Data fetching ---

interface EntityData {
  slug: string;
  name: string;
  type: "winery" | "accommodation";
  city: string;
  region: string | null;
  valley: "napa" | "sonoma";
  editorial: string; // combined editorial context for the prompt
  themes: string[]; // for hashtag generation
  heroPhotoUrl: string | null;
}

async function fetchWineryEntities(): Promise<EntityData[]> {
  const rows = await db
    .select({
      slug: wineries.slug,
      name: wineries.name,
      city: wineries.city,
      region: subRegions.name,
      whyVisit: wineries.whyVisit,
      theSetting: wineries.theSetting,
      tastingRoomVibe: wineries.tastingRoomVibe,
      shortDescription: wineries.shortDescription,
      dogFriendly: wineries.dogFriendly,
      kidFriendly: wineries.kidFriendly,
      sustainable: wineries.sustainableFarming,
      picnicFriendly: wineries.picnicFriendly,
      heroImageUrl: wineries.heroImageUrl,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(eq(wineries.curated, true))
    .orderBy(wineries.name);

  return rows.map((w) => {
    const themes: string[] = [];
    if (w.dogFriendly) themes.push("dog-friendly");
    if (w.kidFriendly) themes.push("kid-friendly");
    if (w.sustainable) themes.push("sustainable");
    if (w.picnicFriendly) themes.push("picnic");

    const editorialParts = [
      w.shortDescription && `Overview: ${w.shortDescription}`,
      w.whyVisit && `Why visit: ${w.whyVisit}`,
      w.theSetting && `The setting: ${w.theSetting}`,
      w.tastingRoomVibe && `Tasting room: ${w.tastingRoomVibe}`,
      themes.length > 0 && `Attributes: ${themes.join(", ")}`,
    ].filter(Boolean);

    // Determine valley from region name
    const regionLower = (w.region || "").toLowerCase();
    const sonomaRegions = [
      "russian river",
      "alexander valley",
      "dry creek",
      "sonoma",
      "carneros",
      "petaluma",
      "healdsburg",
      "glen ellen",
      "kenwood",
    ];
    const valley = sonomaRegions.some((r) => regionLower.includes(r))
      ? "sonoma"
      : "napa";

    return {
      slug: w.slug,
      name: w.name,
      type: "winery" as const,
      city: w.city ?? "",
      region: w.region,
      valley,
      editorial: editorialParts.join("\n"),
      themes,
      heroPhotoUrl: w.heroImageUrl,
    };
  });
}

async function fetchAccommodationEntities(): Promise<EntityData[]> {
  const rows = await db
    .select({
      slug: accommodations.slug,
      name: accommodations.name,
      city: accommodations.city,
      region: subRegions.name,
      valley: accommodations.valley,
      type: accommodations.type,
      whyStayHere: accommodations.whyStayHere,
      theSetting: accommodations.theSetting,
      theExperience: accommodations.theExperience,
      shortDescription: accommodations.shortDescription,
      dogFriendly: accommodations.dogFriendly,
      kidFriendly: accommodations.kidFriendly,
      adultsOnly: accommodations.adultsOnly,
      heroImageUrl: accommodations.heroImageUrl,
    })
    .from(accommodations)
    .leftJoin(subRegions, eq(accommodations.subRegionId, subRegions.id))
    .orderBy(accommodations.name);

  return rows.map((a) => {
    const themes: string[] = [];
    if (a.dogFriendly) themes.push("dog-friendly");
    if (a.kidFriendly) themes.push("kid-friendly");
    if (a.adultsOnly) themes.push("adults-only");

    const editorialParts = [
      a.shortDescription && `Overview: ${a.shortDescription}`,
      a.type && `Type: ${a.type}`,
      a.whyStayHere && `Why stay here: ${a.whyStayHere}`,
      a.theSetting && `The setting: ${a.theSetting}`,
      a.theExperience && `The experience: ${a.theExperience}`,
      themes.length > 0 && `Attributes: ${themes.join(", ")}`,
    ].filter(Boolean);

    return {
      slug: a.slug,
      name: a.name,
      type: "accommodation" as const,
      city: a.city ?? "",
      region: a.region,
      valley: (a.valley as "napa" | "sonoma") ?? "napa",
      editorial: editorialParts.join("\n"),
      themes,
      heroPhotoUrl: a.heroImageUrl,
    };
  });
}

// --- Get hero photo for an entity ---

async function getHeroPhoto(
  slug: string,
  type: "winery" | "accommodation"
): Promise<string | null> {
  if (type === "winery") {
    const photos = await db
      .select({ url: wineryPhotos.blobUrl })
      .from(wineryPhotos)
      .innerJoin(wineries, eq(wineryPhotos.wineryId, wineries.id))
      .where(
        and(
          eq(wineries.slug, slug),
          sql`${wineryPhotos.blobUrl} IS NOT NULL`
        )
      )
      .limit(1);
    return photos[0]?.url ?? null;
  } else {
    const photos = await db
      .select({
        url: sql<string>`COALESCE(${accommodationPhotos.blobUrl}, ${accommodationPhotos.photoUrl})`,
      })
      .from(accommodationPhotos)
      .innerJoin(
        accommodations,
        eq(accommodationPhotos.accommodationId, accommodations.id)
      )
      .where(eq(accommodations.slug, slug))
      .limit(1);
    return photos[0]?.url ?? null;
  }
}

// --- Check if post already exists ---

async function existingPost(
  slug: string,
  type: "winery" | "accommodation"
): Promise<{ id: number } | null> {
  const rows = await db
    .select({ id: socialPosts.id })
    .from(socialPosts)
    .where(
      and(
        eq(socialPosts.entitySlug, slug),
        eq(socialPosts.entityType, type)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

// --- Main ---

async function main() {
  // Fetch entities
  const allEntities: EntityData[] = [];

  if (!typeFilter || typeFilter === "winery") {
    allEntities.push(...(await fetchWineryEntities()));
  }
  if (!typeFilter || typeFilter === "accommodation") {
    allEntities.push(...(await fetchAccommodationEntities()));
  }

  // Filter by slug(s) if specified
  let entities =
    slugFilter.length > 0
      ? allEntities.filter((e) => slugFilter.includes(e.slug))
      : allEntities;

  // --only-failures: keep only entities whose last post row is status='failed'
  if (onlyFailures) {
    const failedRows = await db
      .select({ slug: socialPosts.entitySlug, type: socialPosts.entityType })
      .from(socialPosts)
      .where(eq(socialPosts.status, "failed"));
    const failedSet = new Set(failedRows.map((r) => `${r.type}:${r.slug}`));
    entities = entities.filter((e) => failedSet.has(`${e.type}:${e.slug}`));
  }

  // Shuffle so wineries + hotels interleave (breaks pattern clustering)
  // Seeded-ish: Fisher-Yates with Math.random
  for (let i = entities.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entities[i], entities[j]] = [entities[j], entities[i]];
  }

  // Apply limit AFTER shuffle so test runs get a mix
  entities = entities.slice(0, limit);

  // Count how many already have posts (skip unless --force)
  let skipCount = 0;
  if (!forceOverwrite) {
    const filtered: EntityData[] = [];
    for (const e of entities) {
      const existing = await existingPost(e.slug, e.type);
      if (existing) {
        skipCount++;
      } else {
        filtered.push(e);
      }
    }
    entities = filtered;
  }

  // Cost estimate — Claude Sonnet 4.5: $3/M input, $15/M output
  // Budget extra tokens for variety context + retries (~30% headroom)
  const estimatedInputTokens = entities.length * 1300;
  const estimatedOutputTokens = entities.length * 280;
  const estimatedCost =
    (estimatedInputTokens / 1_000_000) * 3.0 +
    (estimatedOutputTokens / 1_000_000) * 15.0;

  console.log(`\n--- Social Caption Generator ---`);
  console.log(`Total entities found: ${allEntities.length}`);
  console.log(`Skipping ${skipCount} with existing posts`);
  console.log(`To generate: ${entities.length}`);
  console.log(`Estimated cost: ~$${estimatedCost.toFixed(2)}`);
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}\n`);

  if (dryRun) {
    for (const e of entities.slice(0, 20)) {
      console.log(`  ${e.type}: ${e.name} (${e.slug}) — ${e.city}`);
    }
    if (entities.length > 20) {
      console.log(`  ... and ${entities.length - 20} more`);
    }
    return;
  }

  // Stats & audit tracking
  let generated = 0;
  let retriesNeeded = 0;
  let hardFailed = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  const variety = new VarietyTracker();
  const auditLog: {
    slug: string;
    type: string;
    violations: Violation[];
    attempts: number;
    igCaption?: string;
    pinCaption?: string;
    igHashtags?: string;
  }[] = [];
  const hashtagAuditErrors: string[] = [];

  for (let idx = 0; idx < entities.length; idx++) {
    const entity = entities[idx];
    const location = [entity.city, entity.region]
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i) // dedupe city === region
      .join(", ");

    // Build the base user prompt. Retries append feedback.
    const buildUserPrompt = (feedback?: string): string => {
      let p = `Generate social media captions for this ${entity.type}:

Name: ${entity.name}
Location: ${location}
Valley: ${entity.valley === "sonoma" ? "Sonoma County" : "Napa Valley"}

${entity.editorial}

Remember: the overlayHeadline goes ON the card image — short (entity name or a punchy variant).
overlaySubtext: one evocative fragment below the headline.
captionInstagram: the post caption (no hashtags).
captionPinterest: the pin description (no hashtags, but keyword-rich).`;

      // Inject variety context (after first 5 entities so we have something to show)
      if (idx >= 5) {
        const ctx = variety.getContextBlock();
        if (ctx) p += ctx;
      }

      if (feedback) {
        p += `\n\nRETRY — your previous attempt had these issues:\n${feedback}\nFix all of them in this version.`;
      }

      return p;
    };

    let content: CaptionOutput | undefined;
    let violations: Violation[] = [];
    let attempts = 0;
    const MAX_ATTEMPTS = 3;
    let lastFeedback: string | undefined;

    while (attempts < MAX_ATTEMPTS) {
      attempts++;
      try {
        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 500,
          temperature: 1.0,
          system: SYSTEM_PROMPT,
          tools: [CAPTION_TOOL],
          tool_choice: { type: "tool", name: "write_social_caption" },
          messages: [{ role: "user", content: buildUserPrompt(lastFeedback) }],
        });

        if (message.usage) {
          totalInputTokens += message.usage.input_tokens;
          totalOutputTokens += message.usage.output_tokens;
        }

        const toolUse = message.content.find((b) => b.type === "tool_use");
        content = toolUse?.input as CaptionOutput | undefined;
        if (!content) {
          violations = [{ type: "no-output", detail: "model returned no tool_use block" }];
          lastFeedback = "No structured output returned. Use the write_social_caption tool.";
          continue;
        }

        violations = [
          ...validateCaption(content, entity),
          ...validateFactuality(content, entity),
        ];
        if (violations.length === 0) break;

        lastFeedback = violations.map((v) => `- [${v.type}] ${v.detail}`).join("\n");
        retriesNeeded++;
      } catch (err) {
        violations = [{ type: "api-error", detail: String(err) }];
        lastFeedback = "API error on previous attempt. Try again.";
      }
    }

    const progress = `[${idx + 1}/${entities.length}]`;

    if (!content || violations.length > 0) {
      hardFailed++;
      console.log(
        `${progress} ${entity.name}: ❌ failed after ${attempts} attempts — ${violations.map((v) => v.type).join(", ")}`
      );
      auditLog.push({
        slug: entity.slug,
        type: entity.type,
        violations,
        attempts,
        igCaption: content?.captionInstagram,
        pinCaption: content?.captionPinterest,
      });

      // Mark existing row as failed if present (helps --only-failures later)
      const existing = await existingPost(entity.slug, entity.type);
      if (existing) {
        await db
          .update(socialPosts)
          .set({ status: "failed", updatedAt: new Date().toISOString() })
          .where(eq(socialPosts.id, existing.id));
      }
      await sleep(DELAY_MS);
      continue;
    }

    // Success path
    // Build hashtags (accommodations use where-to-stay; wineries use spotlight)
    const postType =
      entity.type === "accommodation" ? "where-to-stay" : "spotlight";

    const igHashtags = buildInstagramHashtags({
      entityType: entity.type,
      region: entity.region ?? entity.city,
      themes: entity.themes,
      valley: entity.valley,
      postType,
    });

    const pinterestKw = buildPinterestKeywords({
      entityType: entity.type,
      region: entity.region ?? entity.city,
      themes: entity.themes,
      postType,
      valley: entity.valley,
    });

    // Hashtag sanity check: accommodations must NOT contain any "#winery*" tag
    if (entity.type === "accommodation" && /#winery/i.test(igHashtags)) {
      hashtagAuditErrors.push(
        `${entity.slug} (accommodation) has winery hashtag in: "${igHashtags}"`
      );
    }
    if (entity.type === "winery" && /#hotel|#resort/i.test(igHashtags)) {
      hashtagAuditErrors.push(
        `${entity.slug} (winery) has hotel hashtag in: "${igHashtags}"`
      );
    }

    // Append hashtags
    const fullIgCaption = `${content.captionInstagram}\n\n${igHashtags}`;
    const fullPinterestCaption = `${content.captionPinterest} | ${pinterestKw.join(" | ")}`;

    // Record patterns for downstream entities
    variety.recordCaption(content.captionInstagram, content.captionPinterest);

    // Build default overlay tags from themes
    const overlayTags = entity.themes
      .map((t) =>
        t
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join("-")
      )
      .join(",");

    // Hero photo (fall back to db lookup if entity didn't have one cached)
    const photoUrl =
      entity.heroPhotoUrl ?? (await getHeroPhoto(entity.slug, entity.type));

    const now = new Date().toISOString();
    const existing = await existingPost(entity.slug, entity.type);

    if (existing && forceOverwrite) {
      await db
        .update(socialPosts)
        .set({
          overlayHeadline: content.overlayHeadline,
          overlaySubtext: content.overlaySubtext,
          overlayTags: overlayTags || null,
          captionInstagram: fullIgCaption,
          captionPinterest: fullPinterestCaption,
          photoUrl,
          status: "draft",
          updatedAt: now,
        })
        .where(eq(socialPosts.id, existing.id));
      console.log(
        `${progress} ${entity.name}: ✓ ${attempts > 1 ? `ok (after ${attempts} tries)` : "ok"}`
      );
    } else {
      await db.insert(socialPosts).values({
        entitySlug: entity.slug,
        entityType: entity.type,
        postType: "spotlight",
        variant: "overlay",
        format: "ig",
        overlayHeadline: content.overlayHeadline,
        overlaySubtext: content.overlaySubtext,
        overlayTags: overlayTags || null,
        captionInstagram: fullIgCaption,
        captionPinterest: fullPinterestCaption,
        photoUrl,
        photoFocalX: 50,
        photoFocalY: 50,
        photoZoom: 1,
        status: "draft",
        utmCampaign: "social-spotlight",
        createdAt: now,
        updatedAt: now,
      });
      console.log(
        `${progress} ${entity.name}: ✓ created ${attempts > 1 ? `(after ${attempts} tries)` : ""}`
      );
    }

    auditLog.push({
      slug: entity.slug,
      type: entity.type,
      violations: [],
      attempts,
      igCaption: content.captionInstagram,
      pinCaption: content.captionPinterest,
      igHashtags,
    });

    generated++;
    await sleep(DELAY_MS);
  }

  // --- Cost summary ---
  const inputCost = (totalInputTokens / 1_000_000) * 3.0;
  const outputCost = (totalOutputTokens / 1_000_000) * 15.0;

  console.log(`\n--- Done ---`);
  console.log(`Generated: ${generated}`);
  console.log(`Hard-failed (after 3 attempts): ${hardFailed}`);
  console.log(`Retries needed: ${retriesNeeded}`);
  console.log(`Skipped (existing): ${skipCount}`);
  console.log(
    `Tokens: ${totalInputTokens.toLocaleString()} input + ${totalOutputTokens.toLocaleString()} output`
  );
  console.log(`Cost: ~$${(inputCost + outputCost).toFixed(3)}`);

  // --- Audit report ---
  console.log(`\n=== AUDIT REPORT ===\n`);

  // Opener distribution
  const openers = variety.getOpeningsDistribution();
  const topOpeners = openers.filter(([, n]) => n >= 2).slice(0, 10);
  console.log("Opener distribution (first 4 words of IG caption):");
  if (topOpeners.length === 0) {
    console.log("  (all openers are unique — excellent)");
  } else {
    for (const [op, n] of topOpeners) {
      console.log(`  ${n}×  "${op}..."`);
    }
    const maxN = topOpeners[0][1];
    const pct = ((maxN / generated) * 100).toFixed(0);
    console.log(`  Max single pattern: ${maxN}/${generated} (${pct}%) — TARGET <30%`);
  }

  // Repeated phrases
  console.log(`\nRepeated 3-word phrases (used 2+ times across batch):`);
  const repeatedPhrases = variety.getRepeatedPhrases(2);
  if (repeatedPhrases.length === 0) {
    console.log("  (none)");
  } else {
    for (const [ph, n] of repeatedPhrases.slice(0, 15)) {
      console.log(`  ${n}×  "${ph}"`);
    }
    if (repeatedPhrases.length > 15) {
      console.log(`  ... and ${repeatedPhrases.length - 15} more`);
    }
  }

  // Validation summary
  const validationErrors = auditLog.filter((a) => a.violations.length > 0);
  console.log(`\nValidation failures: ${validationErrors.length}/${entities.length}`);
  if (validationErrors.length > 0) {
    console.log("  Failed entities:");
    for (const a of validationErrors) {
      console.log(`    ${a.slug} (${a.type}): ${a.violations.map((v) => v.type).join(", ")}`);
    }
  }

  // Hashtag audit
  console.log(`\nHashtag audit:`);
  if (hashtagAuditErrors.length === 0) {
    console.log(`  ✓ All ${generated} entities have correct entity-type-aware hashtags`);
  } else {
    console.log(`  ✗ ${hashtagAuditErrors.length} hashtag mismatches:`);
    for (const err of hashtagAuditErrors) console.log(`    ${err}`);
  }

  // Sample captions for review
  console.log(`\n=== CAPTIONS FOR REVIEW ===`);
  for (const a of auditLog.filter((x) => x.violations.length === 0)) {
    console.log(`\n━━━ ${a.slug} (${a.type}) ━━━`);
    console.log(`IG: ${a.igCaption}`);
    if (a.igHashtags) console.log(`    ${a.igHashtags}`);
    console.log(`Pinterest: ${a.pinCaption}`);
  }
}

main().catch(console.error);
