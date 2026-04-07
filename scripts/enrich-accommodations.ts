/**
 * Generate editorial content for accommodation detail pages using OpenAI.
 *
 * Re-generates narrative fields with diversity constraints and website-informed context.
 * Modeled on scripts/enrich-content.ts (winery enrichment).
 *
 * Usage:
 *   npx tsx scripts/enrich-accommodations.ts                     # Local DB, only empty fields
 *   npx tsx scripts/enrich-accommodations.ts --force              # Re-generate all 128
 *   npx tsx scripts/enrich-accommodations.ts --slug=meadowood-napa-valley  # Single property
 *   npx tsx scripts/enrich-accommodations.ts --dry-run            # Preview prompts only
 *   npx tsx scripts/enrich-accommodations.ts --turso --force      # Write to production
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { accommodations, subRegions } from "../src/db/schema";
import { eq } from "drizzle-orm";

// --- CLI args ---
const useTurso = process.argv.includes("--turso");
const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");
const slugArg = process.argv
  .find((a) => a.startsWith("--slug="))
  ?.split("=")[1];

// --- DB setup ---
let dbUrl: string;
let dbAuthToken: string | undefined;

if (useTurso) {
  dbUrl = "libsql://napa-winery-search-theinterchange.aws-us-west-2.turso.io";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  if (!dbAuthToken) {
    const { execSync } =
      require("child_process") as typeof import("child_process");
    dbAuthToken = execSync(`turso db tokens create napa-winery-search`, {
      encoding: "utf-8",
    }).trim();
  }
  console.log("Using Turso production database");
} else {
  dbUrl = process.env.DATABASE_URL || "file:./data/winery.db";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  console.log("Using local database");
}

const client = createClient({ url: dbUrl, authToken: dbAuthToken });
const db = drizzle(client);

// --- OpenAI ---
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const AccommodationEditorial = z.object({
  whyStayHere: z.string().describe(
    "2-3 sentences. Lead with the single most compelling reason to book THIS property — a signature experience, a view, a location advantage, a unique amenity. Then describe what staying here FEELS like. Make someone reach for the Book button. NEVER start with 'Nestled', 'Located in', 'Situated in', 'Welcome to', 'Experience', 'For those seeking'. BANNED phrases: 'nestled', 'rolling hills', 'world-class', 'unparalleled', 'unforgettable', 'beckons', 'sun-drenched', 'boasts', 'Whether you', 'quintessential'."
  ),
  theSetting: z.string().describe(
    "3-4 sentences. What does this place LOOK like? Lead with the single most distinctive visual element — the one thing a guest would photograph first. The building's architecture, the garden, the view from the terrace. Then immediate surroundings. NEVER start with 'Nestled'. BANNED phrases: 'nestled', 'rolling hills', 'sun-drenched', 'breathtaking', 'picturesque', 'lush vineyards', 'golden light', 'warm glow'. If you can swap in another hotel's name and the description still works, it's too generic — rewrite it."
  ),
  theExperience: z.string().describe(
    "3-4 sentences. What is it ACTUALLY like to stay here? Reference real amenities — the pool, the spa, the restaurant, the wine bar, the concierge, specific room features. Drop the reader into a real moment from an actual stay. NEVER start with 'Imagine', 'Picture yourself', 'Whether you', 'Guests can', 'Your stay at'. BANNED phrases: 'Whether you', 'world-class', 'unparalleled', 'unforgettable', 'beckons', 'curated', 'immerse'."
  ),
  beforeYouBook: z.string().describe(
    "2-3 sentences of practical, scannable tips. Include: booking window for peak season, parking situation, check-in details, or specific practical advice for THIS property. NEVER start with 'Consider', 'Plan your', 'Before you', 'Be sure to'. Just lead with the most useful tip directly. Keep factual and brief — no flowery language."
  ),
  whyThisHotel: z.array(z.string()).describe(
    "3-5 specific, factually verifiable reasons to stay at THIS property. Each reason one concise sentence. Focus on what's unique: signature amenities, location advantages, specific rooms/suites, dining, wine programs, history. No generic praise — every reason must be something you can check."
  ),
  shortDescription: z.string().describe(
    "1 sentence, max 120 characters. Concise card-level summary — what type of property, where, key differentiator."
  ),
  highlightTags: z.array(z.string()).describe(
    "4-6 short tags. Pick from: Pool, Spa, Restaurant, Vineyard Views, Mountain Views, Valley Views, Garden Setting, Downtown, Historic, Boutique, Luxury Resort, Casual & Cozy, Modern, Romantic, Couples, Families, Dog-Friendly, Kid-Friendly, Adults Only, Wine Tasting On-Site, Breakfast Included, Farm-to-Table Dining, Fireplace, Hot Tub, EV Charging, Free Parking, Concierge, Fitness Center, Pet-Friendly, Budget-Friendly, Splurge-Worthy, Walkable Tasting Rooms. You may include ONE property-specific tag if something is truly distinctive (e.g. 'Michelin-Star Restaurant', 'Train Car Rooms', 'Private Vineyards'). Only pick tags that DIFFERENTIATE this property."
  ),
});

const DELAY_MS = 300;
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch editorial copy from an accommodation's website.
 * Tries homepage + common subpages. Extracts meta descriptions
 * and visible body text, then returns a trimmed summary.
 */
async function fetchAccommodationCopy(
  websiteUrl: string
): Promise<string | null> {
  const urls = [websiteUrl];
  const base = websiteUrl.replace(/\/$/, "");
  urls.push(
    `${base}/rooms`,
    `${base}/suites`,
    `${base}/amenities`,
    `${base}/dining`,
    `${base}/spa`,
    `${base}/about`,
    `${base}/experiences`
  );

  const allText: string[] = [];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "NapaSonomaGuide/1.0 (editorial research)",
        },
        signal: AbortSignal.timeout(8000),
        redirect: "follow",
      });
      if (!res.ok) continue;

      const html = await res.text();

      // Extract meta description
      const metaMatch =
        html.match(
          /meta\s+(?:name|property)="(?:description|og:description)"[^>]*content="([^"]*)"/i
        ) ||
        html.match(
          /content="([^"]*)"[^>]*(?:name|property)="(?:description|og:description)"/i
        );
      if (metaMatch?.[1]) {
        allText.push(metaMatch[1]);
      }

      // Strip scripts, styles, nav, header, footer, then tags
      let body = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&#8217;/g, "'")
        .replace(/&#8220;|&#8221;/g, '"')
        .replace(/&#8211;/g, "-")
        .replace(/&#\d+;/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      // Extract sentences with accommodation-relevant keywords
      const sentences = body.match(/[A-Z][^.!?]{20,}[.!?]/g) || [];
      const relevant = sentences
        .filter((s) =>
          /room|suite|spa|pool|dining|restaurant|garden|terrace|balcony|concierge|amenity|breakfast|view|vineyard|wine|tasting|wellness|retreat|luxury|boutique|estate|historic|experience|guest|lounge|fireplace|patio|hot tub|fitness|yoga|massage|chef|farm|organic/i.test(
            s
          )
        )
        .filter(
          (s) =>
            !/\{|\}|function|var |const |import |export |px|rgb|font|margin|padding|display|width|height/i.test(
              s
            )
        );

      if (relevant.length > 0) {
        allText.push(...relevant.slice(0, 8));
      }
    } catch {
      // Timeout or network error — skip this URL
    }
  }

  if (allText.length === 0) return null;

  const unique = [...new Set(allText)];
  const combined = unique.join(" ").slice(0, 1500);
  return combined;
}

async function main() {
  console.log(
    `Flags: ${force ? "--force " : ""}${dryRun ? "--dry-run " : ""}${slugArg ? `--slug=${slugArg} ` : ""}\n`
  );

  // Get all accommodations
  const allAccommodations = await db
    .select({
      id: accommodations.id,
      slug: accommodations.slug,
      name: accommodations.name,
      type: accommodations.type,
      valley: accommodations.valley,
      city: accommodations.city,
      subRegionId: accommodations.subRegionId,
      googleRating: accommodations.googleRating,
      googleReviewCount: accommodations.googleReviewCount,
      priceTier: accommodations.priceTier,
      amenitiesJson: accommodations.amenitiesJson,
      wineFeatures: accommodations.wineFeatures,
      roomsJson: accommodations.roomsJson,
      diningJson: accommodations.diningJson,
      spaJson: accommodations.spaJson,
      activitiesJson: accommodations.activitiesJson,
      dogFriendly: accommodations.dogFriendly,
      kidFriendly: accommodations.kidFriendly,
      adultsOnly: accommodations.adultsOnly,
      websiteUrl: accommodations.websiteUrl,
      whyStayHere: accommodations.whyStayHere,
      highlightTags: accommodations.highlightTags,
    })
    .from(accommodations);

  let toProcess = allAccommodations;

  if (slugArg) {
    toProcess = toProcess.filter((a) => a.slug === slugArg);
    if (toProcess.length === 0) {
      console.error(`No accommodation found with slug "${slugArg}"`);
      process.exit(1);
    }
  } else if (!force) {
    toProcess = toProcess.filter((a) => !a.highlightTags);
  }

  console.log(`${toProcess.length} accommodations need content enrichment\n`);

  if (toProcess.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  // Get sub-region names
  const allSubRegions = await db.select().from(subRegions);
  const subRegionMap = new Map(allSubRegions.map((s) => [s.id, s]));

  let processed = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (const acc of toProcess) {
    processed++;
    const subRegion = acc.subRegionId
      ? subRegionMap.get(acc.subRegionId)
      : null;

    // Build context from existing structured data
    const amenities: string[] = acc.amenitiesJson
      ? JSON.parse(acc.amenitiesJson)
      : [];
    const wineFeatures: string[] = acc.wineFeatures
      ? JSON.parse(acc.wineFeatures)
      : [];

    let roomContext = "";
    if (acc.roomsJson) {
      try {
        const rooms = JSON.parse(acc.roomsJson);
        roomContext = `Room types: ${rooms.map((r: { name: string; description?: string }) => `${r.name}${r.description ? ` - ${r.description}` : ""}`).join("; ")}`;
      } catch {}
    }

    let diningContext = "";
    if (acc.diningJson) {
      try {
        const dining = JSON.parse(acc.diningJson);
        diningContext = `Dining: ${dining.map((d: { name: string; type?: string; description?: string }) => `${d.name} (${d.type || "restaurant"})${d.description ? ` - ${d.description}` : ""}`).join("; ")}`;
      } catch {}
    }

    let spaContext = "";
    if (acc.spaJson) {
      try {
        const spa = JSON.parse(acc.spaJson);
        spaContext = `Spa: ${spa.name || "On-site spa"}${spa.description ? ` - ${spa.description}` : ""}${spa.highlights?.length ? `. Highlights: ${spa.highlights.join(", ")}` : ""}`;
      } catch {}
    }

    let activitiesContext = "";
    if (acc.activitiesJson) {
      try {
        const activities = JSON.parse(acc.activitiesJson);
        activitiesContext = `Activities: ${activities.map((a: { name: string }) => a.name).join(", ")}`;
      } catch {}
    }

    const policyFlags = [
      acc.dogFriendly && "Dog-friendly",
      acc.kidFriendly && "Kid-friendly",
      acc.adultsOnly && "Adults-only",
    ]
      .filter(Boolean)
      .join(", ");

    // Fetch editorial copy from the property's own website
    let websiteCopy = "";
    if (acc.websiteUrl) {
      const copy = await fetchAccommodationCopy(acc.websiteUrl);
      if (copy) {
        websiteCopy = `\nFrom the property's own website (use ONLY as factual context — do NOT copy phrases or sentence structures):\n${copy}`;
        console.log(`  Fetched ${copy.length} chars from website`);
      } else {
        console.log(`  No website copy extracted`);
      }
    }

    const typeLabels: Record<string, string> = {
      hotel: "Hotel",
      inn: "Inn",
      resort: "Resort",
      vacation_rental: "Vacation Rental",
      bed_and_breakfast: "Bed & Breakfast",
    };

    const prompt = `Write editorial content for this wine country accommodation page.

Property: ${acc.name}
Type: ${typeLabels[acc.type] || acc.type}
Location: ${acc.city || ""}${subRegion ? `, ${subRegion.name} (${subRegion.valley === "napa" ? "Napa Valley" : "Sonoma County"})` : ""}
Rating: ${acc.googleRating || "N/A"}/5 (${acc.googleReviewCount || 0} reviews)
Price tier: ${"$".repeat(acc.priceTier || 2)}
${amenities.length > 0 ? `Amenities: ${amenities.join(", ")}` : ""}
${wineFeatures.length > 0 ? `Wine features: ${wineFeatures.join(", ")}` : ""}
${roomContext}
${diningContext}
${spaContext}
${activitiesContext}
${policyFlags ? `Policies: ${policyFlags}` : ""}${websiteCopy}

Your job: help someone FEEL what it's like to stay at this property. Use specific, concrete details — what they'll see walking in, the view from their room, the smell of breakfast, the sound of the evening. Ground every sentence in something real about THIS place. No generic wine-country filler. Write like you stayed here last month and want to tell a friend why they should book it.`;

    console.log(
      `[${processed}/${toProcess.length}] ${acc.name}${dryRun ? " (dry run)" : ""}`
    );

    if (dryRun) {
      console.log(`  Prompt: ${prompt.slice(0, 120)}...`);
      await sleep(50);
      continue;
    }

    try {
      const completion = await openai.chat.completions.parse({
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 1200,
        messages: [
          {
            role: "system",
            content: `You are writing for napasonomaguide.com — a trusted wine country travel guide. Write as if you personally know this accommodation inside and out. Each property should read like it was written by someone who actually stayed there and understands what makes it different from every other hotel in the valley.

VOICE: Warm third-person, like a knowledgeable friend who's been there. No first person. No marketing speak. No filler.

CRITICAL RULES FOR ORIGINALITY:
- Every property MUST have a unique opening sentence structure. Never reuse openers across properties.
- ABSOLUTELY BANNED words/phrases: "nestled", "rolling hills", "sun-drenched", "world-class", "unparalleled", "unforgettable", "beckons", "boasts", "palpable", "lush", "breathtaking", "warm glow", "golden light", "inviting atmosphere", "curated", "Whether you", "quintessential", "idyllic", "enchanting", "picturesque"
- BANNED openers: Never start any field with "Nestled", "Located in", "Situated in", "Welcome to", "Imagine", "Picture yourself", "Consider", "Plan your", "As you", "For those seeking", "Guests can", "Your stay at", "At [property name]"
- Instead: Start with the ONE thing that makes THIS place unlike any other property. A specific architectural detail, a view, the smell of the garden, the sound of a creek, the color of the building.
- Use the property's own website copy as a source of FACTS (room types, amenities, history, dining) but write in completely original language. Never echo their phrasing.
- If you don't have a specific detail, say less rather than making up generic filler.`,
          },
          { role: "user", content: prompt },
        ],
        response_format: zodResponseFormat(
          AccommodationEditorial,
          "editorial"
        ),
      });

      if (completion.usage) {
        totalInputTokens += completion.usage.prompt_tokens;
        totalOutputTokens += completion.usage.completion_tokens;
      }

      const content = completion.choices[0]?.message?.parsed;
      if (!content) {
        console.log("  No content returned, skipping");
        continue;
      }

      await db
        .update(accommodations)
        .set({
          whyStayHere: content.whyStayHere,
          theSetting: content.theSetting,
          theExperience: content.theExperience,
          beforeYouBook: content.beforeYouBook,
          whyThisHotel: JSON.stringify(content.whyThisHotel),
          shortDescription: content.shortDescription,
          highlightTags: JSON.stringify(content.highlightTags),
        })
        .where(eq(accommodations.id, acc.id));

      console.log(`  ✓ whyStay: ${content.whyStayHere.slice(0, 60)}...`);
    } catch (err) {
      console.error(`  Error: ${err}`);
    }

    await sleep(DELAY_MS);
  }

  // Cost summary
  const inputCost = (totalInputTokens / 1_000_000) * 0.15;
  const outputCost = (totalOutputTokens / 1_000_000) * 0.6;
  console.log(`\n=== Summary ===`);
  console.log(`Processed: ${processed}`);
  console.log(`Tokens: ${totalInputTokens} in / ${totalOutputTokens} out`);
  console.log(`Estimated cost: $${(inputCost + outputCost).toFixed(3)}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
