/**
 * Generate editorial content for winery detail pages using OpenAI.
 *
 * Generates three fields per winery:
 *   - whyVisit: Compelling reasons to visit (2-3 sentences)
 *   - theSetting: Atmosphere, architecture, views (2-3 sentences)
 *   - visitorTips: Practical tips for planning a visit (3-4 bullet points as prose)
 *
 * Usage:
 *   npx tsx scripts/enrich-content.ts --turso
 *   npx tsx scripts/enrich-content.ts --turso --dry-run
 *   npx tsx scripts/enrich-content.ts --turso --winery=opus-one
 *   npx tsx scripts/enrich-content.ts --turso --force
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries, tastingExperiences, subRegions } from "../src/db/schema";
import { eq, isNull, and, or } from "drizzle-orm";

// --- CLI args ---
const useTurso = process.argv.includes("--turso");
const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");
const winerySlugArg = process.argv
  .find((a) => a.startsWith("--winery="))
  ?.split("=")[1];

// --- DB setup ---
let dbUrl: string;
let dbAuthToken: string | undefined;

if (useTurso) {
  dbUrl = "libsql://napa-winery-search-theinterchange.aws-us-west-2.turso.io";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  if (!dbAuthToken) {
    const { execSync } = require("child_process") as typeof import("child_process");
    dbAuthToken = execSync(
      `turso db tokens create napa-winery-search`,
      { encoding: "utf-8" }
    ).trim();
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

const EditorialContent = z.object({
  whyVisit: z
    .string()
    .describe(
      "2 sentences max. The hook — what makes THIS winery worth rearranging your itinerary for? Lead with the most compelling specific detail: a legendary wine, a jaw-dropping view, a one-of-a-kind experience. No generic praise."
    ),
  theSetting: z
    .string()
    .describe(
      "2-3 sentences. Transport the reader to the arrival moment. What catches their eye first? Describe the architecture, the landscape, the light, the feel of the space. Use concrete, sensory details specific to THIS property — not generic 'rolling hills and beautiful views'. Make someone think 'I need to see this.'"
    ),
  knownFor: z
    .string()
    .describe(
      "DEPRECATED — return empty string. Use highlightTags instead."
    ),
  tastingRoomVibe: z
    .string()
    .describe(
      "2-3 sentences. Describe the tasting experience — not just the room, but the feeling. The pace, the conversation with the host, the pour, the moment you taste the flagship wine. Whether it's a bar, a patio, a cave, or a table under an oak tree — make it specific and real. Help someone picture themselves mid-tasting, glass in hand."
    ),
  visitorTips: z
    .string()
    .describe(
      "Short, practical, scannable tips. Use this format: 'Reservations required [timeframe] ahead. Parking: [situation]. Dress: [code]. Allow [time]. Best for: [type of visitor].' Keep it factual and brief. Do NOT mention specific tasting prices or recommend specific tasting packages. Do NOT use flowery language."
    ),
  whyThisWinery: z
    .array(z.string())
    .describe(
      "3-5 specific, factually verifiable reasons someone should visit THIS winery. Each reason should be one concise sentence. Focus on what's unique: signature wines, winemaking approach, views, architecture, history, tasting format, setting. No generic praise."
    ),
  bestForTags: z
    .array(z.string())
    .describe(
      "DEPRECATED — return empty array. Use highlightTags instead."
    ),
  highlightTags: z
    .array(z.string())
    .describe(
      "4-6 short tags (2-4 words each) that describe this winery at a glance. Pick PRIMARILY from this controlled list: Cabernet, Pinot Noir, Chardonnay, Sparkling, Zinfandel, Bordeaux Blends, Rosé, Sauvignon Blanc, Cave Tours, Outdoor Tasting, Food Pairing, Walk-Ins Welcome, By Appointment, Family-Owned, Historic Estate, Boutique, Luxury, Casual & Fun, Modern, Mountain Views, Valley Views, Garden Setting, Downtown, Hilltop, Couples, Groups, Dog-Friendly, Kid-Friendly, Budget-Friendly, Splurge-Worthy, Sustainable, Organic, Picnic Area. You may include ONE short winery-specific tag (2-4 words) if there's something truly distinctive — e.g. 'Castle Architecture', 'NFL Founders', 'Gravity-Flow Winery'. No full sentences, no obscure wine names, no fragments."
    ),
});

const DELAY_MS = 300;
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch editorial copy from a winery's website.
 * Tries homepage + /visit or /about pages. Extracts meta descriptions
 * and visible body text, then returns a trimmed summary.
 */
async function fetchWineryCopy(websiteUrl: string): Promise<string | null> {
  const urls = [websiteUrl];
  // Try common subpages for richer editorial content
  const base = websiteUrl.replace(/\/$/, "");
  urls.push(`${base}/visit`, `${base}/about`, `${base}/story`);

  const allText: string[] = [];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "NapaSonomaGuide/1.0 (editorial research)" },
        signal: AbortSignal.timeout(8000),
        redirect: "follow",
      });
      if (!res.ok) continue;

      const html = await res.text();

      // Extract meta description
      const metaMatch = html.match(/meta\s+(?:name|property)="(?:description|og:description)"[^>]*content="([^"]*)"/i)
        || html.match(/content="([^"]*)"[^>]*(?:name|property)="(?:description|og:description)"/i);
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

      // Extract sentences that contain wine/visit-related keywords
      const sentences = body.match(/[A-Z][^.!?]{20,}[.!?]/g) || [];
      const relevant = sentences.filter((s) =>
        /wine|tasting|vineyard|estate|valley|cellar|barrel|cave|terr|harvest|craft|blend|vintage|experience|welcome|visit|discover|journey|story|heritage|tradition|family|generation|landscape|view|mountain|hill|sunset|garden|picnic|patio|lounge/i.test(s)
      ).filter((s) =>
        // Filter out code/CSS/JS fragments
        !/\{|\}|function|var |const |import |export |px|rgb|font|margin|padding|display|width|height/i.test(s)
      );

      if (relevant.length > 0) {
        allText.push(...relevant.slice(0, 8));
      }
    } catch {
      // Timeout or network error — skip this URL
    }
  }

  if (allText.length === 0) return null;

  // Deduplicate and trim
  const unique = [...new Set(allText)];
  const combined = unique.join(" ").slice(0, 1500);
  return combined;
}

async function main() {
  console.log(
    `Flags: ${force ? "--force " : ""}${dryRun ? "--dry-run " : ""}${winerySlugArg ? `--winery=${winerySlugArg} ` : ""}\n`
  );

  // Get wineries that need enrichment
  let query = db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      description: wineries.description,
      shortDescription: wineries.shortDescription,
      city: wineries.city,
      subRegionId: wineries.subRegionId,
      aggregateRating: wineries.aggregateRating,
      totalRatings: wineries.totalRatings,
      googleRating: wineries.googleRating,
      googleReviewCount: wineries.googleReviewCount,
      priceLevel: wineries.priceLevel,
      reservationRequired: wineries.reservationRequired,
      dogFriendly: wineries.dogFriendly,
      kidFriendly: wineries.kidFriendly,
      picnicFriendly: wineries.picnicFriendly,
      websiteUrl: wineries.websiteUrl,
      whyVisit: wineries.whyVisit,
    })
    .from(wineries);

  const allWineries = await query;

  let toProcess = allWineries;

  if (winerySlugArg) {
    toProcess = toProcess.filter((w) => w.slug === winerySlugArg);
    if (toProcess.length === 0) {
      console.error(`No winery found with slug "${winerySlugArg}"`);
      process.exit(1);
    }
  } else if (!force) {
    toProcess = toProcess.filter((w) => !w.whyVisit);
  }

  console.log(`${toProcess.length} wineries need content enrichment\n`);

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

  for (const winery of toProcess) {
    processed++;
    const subRegion = winery.subRegionId
      ? subRegionMap.get(winery.subRegionId)
      : null;

    // Get tasting info for context
    const tastings = await db
      .select({
        name: tastingExperiences.name,
        price: tastingExperiences.price,
        description: tastingExperiences.description,
      })
      .from(tastingExperiences)
      .where(eq(tastingExperiences.wineryId, winery.id));

    const tastingContext = tastings.length > 0
      ? `Tasting experiences: ${tastings.map((t) => `${t.name}${t.price ? ` ($${t.price})` : ""}${t.description ? ` - ${t.description}` : ""}`).join("; ")}`
      : "No tasting details available.";

    const amenities = [
      winery.reservationRequired && "Reservation required",
      winery.dogFriendly && "Dog friendly",
      winery.kidFriendly && "Kid friendly",
      winery.picnicFriendly && "Picnic friendly",
    ]
      .filter(Boolean)
      .join(", ");

    // Fetch editorial copy from the winery's own website for context
    let wineryCopy = "";
    if (winery.websiteUrl) {
      const copy = await fetchWineryCopy(winery.websiteUrl);
      if (copy) {
        wineryCopy = `\nFrom the winery's own website (use ONLY as factual context — do NOT copy phrases or sentence structures):\n${copy}`;
        console.log(`  Fetched ${copy.length} chars from website`);
      } else {
        console.log(`  No website copy extracted`);
      }
    }

    const prompt = `Write editorial content for this winery profile page.

Winery: ${winery.name}
Location: ${winery.city || ""}${subRegion ? `, ${subRegion.name} (${subRegion.valley === "napa" ? "Napa Valley" : "Sonoma County"})` : ""}
Description: ${winery.description || winery.shortDescription || "No description available"}
Rating: ${winery.aggregateRating || winery.googleRating || "N/A"}/5 (${winery.totalRatings || winery.googleReviewCount || 0} reviews)
Price level: ${"$".repeat(winery.priceLevel || 2)}
${tastingContext}
${amenities ? `Amenities: ${amenities}` : ""}${wineryCopy}

Your job: help someone FEEL what it's like to visit this place. Use specific, concrete details — what they'll see, hear, smell, taste. Ground every sentence in something real about THIS winery. No generic wine-country filler. Write like a knowledgeable friend who's been there and wants to share what makes it worth the trip.`;

    console.log(
      `[${processed}/${toProcess.length}] ${winery.name}${dryRun ? " (dry run)" : ""}`
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
        max_tokens: 800,
        messages: [
          {
            role: "system",
            content:
              "You are writing for a trusted wine country travel guide (napasonomaguide.com). Your voice: warm third-person, authoritative through specificity — like Condé Nast Traveler, not a brochure. No first person ('I', 'we'). No marketing fluff. No clichés ('hidden gem', 'must-visit', 'unforgettable', 'world-class'). No flowery language that feels fake. Every sentence earns its place by helping someone picture themselves there and decide if it's right for them. Use concrete sensory details — what you see, the energy, the light, the space. If the winery's own website gave you specific facts (grape varieties, winemaking techniques, history), weave those in naturally but NEVER copy their phrasing. Your content must be 100% original.",
          },
          { role: "user", content: prompt },
        ],
        response_format: zodResponseFormat(EditorialContent, "editorial"),
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
        .update(wineries)
        .set({
          whyVisit: content.whyVisit,
          theSetting: content.theSetting,
          visitorTips: content.visitorTips,
          knownFor: content.knownFor,
          tastingRoomVibe: content.tastingRoomVibe,
          whyThisWinery: JSON.stringify(content.whyThisWinery),
          bestForTags: JSON.stringify(content.bestForTags),
          highlightTags: JSON.stringify(content.highlightTags),
        })
        .where(eq(wineries.id, winery.id));

      console.log(
        `  ✓ whyVisit: ${content.whyVisit.slice(0, 60)}...`
      );
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
  console.log(
    `Tokens: ${totalInputTokens} in / ${totalOutputTokens} out`
  );
  console.log(
    `Estimated cost: $${(inputCost + outputCost).toFixed(3)}`
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
