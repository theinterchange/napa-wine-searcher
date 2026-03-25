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
      "2 sentences max. What makes this winery worth a special trip? Be specific to THIS winery — mention their signature wine, unique experience, or defining characteristic. No generic wine-country praise."
    ),
  theSetting: z
    .string()
    .describe(
      "2 sentences. What do you actually see when you arrive? The architecture, landscape, views. Paint a specific picture someone can visualize."
    ),
  knownFor: z
    .string()
    .describe(
      "3-5 items separated by commas. What is this winery famous for? e.g. 'Estate Cabernet Sauvignon, Château-style architecture, Cave tours, Hilltop vineyard views'. Be specific to this winery, not generic."
    ),
  tastingRoomVibe: z
    .string()
    .describe(
      "2-3 sentences. What's the tasting room experience actually like? The energy, service style, crowd, seating, what makes it memorable. Help someone picture themselves there."
    ),
  visitorTips: z
    .string()
    .describe(
      "Short, practical, scannable tips. Use this format: 'Reservations required [timeframe] ahead. Parking: [situation]. Dress: [code]. Allow [time]. Best for: [type of visitor].' Keep it factual and brief. Do NOT mention specific tasting prices or recommend specific tasting packages. Do NOT use flowery language."
    ),
});

const DELAY_MS = 200;
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
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

    const prompt = `Write editorial content for this winery profile page. The content should inspire someone to want to visit and share this page with friends.

Winery: ${winery.name}
Location: ${winery.city || ""}${subRegion ? `, ${subRegion.name} (${subRegion.valley === "napa" ? "Napa Valley" : "Sonoma County"})` : ""}
Description: ${winery.description || winery.shortDescription || "No description available"}
Rating: ${winery.aggregateRating || winery.googleRating || "N/A"}/5 (${winery.totalRatings || winery.googleReviewCount || 0} reviews)
Price level: ${"$".repeat(winery.priceLevel || 2)}
${tastingContext}
${amenities ? `Amenities: ${amenities}` : ""}

Write in a warm, sophisticated editorial voice — like a well-traveled friend recommending their favorite spot. Be specific to THIS winery, not generic. Avoid clichés like "hidden gem" or "must-visit."`;

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
              "You are writing for a trusted wine country travel guide. Write like a knowledgeable local friend giving recommendations — specific, practical, honest. No marketing fluff, no clichés ('hidden gem', 'must-visit', 'unforgettable'), no generic wine praise. Every sentence should help someone decide if this winery is right for them and what to expect.",
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
