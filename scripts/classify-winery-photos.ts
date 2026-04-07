/**
 * Classify winery photos to find the best "setting" and "tasting_room" images.
 *
 * Sends all photos for each winery in a single API call, asking GPT-4o-mini
 * to pick the best photo for each category. This means 189 API calls total
 * (one per winery) instead of 1,512 (one per photo).
 *
 * Usage:
 *   npx tsx scripts/classify-winery-photos.ts
 *   npx tsx scripts/classify-winery-photos.ts --dry-run
 *   npx tsx scripts/classify-winery-photos.ts --winery=opus-one
 *   npx tsx scripts/classify-winery-photos.ts --turso
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries, wineryPhotos } from "../src/db/schema";
import { eq } from "drizzle-orm";

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

const PhotoClassification = z.object({
  settingPhotoIndex: z
    .number()
    .nullable()
    .describe(
      "The 0-based index of the best photo showing the winery's exterior, grounds, vineyard, landscape, or overall setting. Pick the most visually striking outdoor/architectural shot. Return null if no photo fits."
    ),
  tastingRoomPhotoIndex: z
    .number()
    .nullable()
    .describe(
      "The 0-based index of the best photo showing a wine tasting experience — any space where guests taste wine. This includes: indoor tasting bars, outdoor tasting patios with wine glasses, seated tasting rooms, barrel room tastings, wine lounges. Do NOT pick: food-only photos, empty vineyard/landscape shots, wine bottles without people or glasses, generic hallways, or event spaces without wine service. Return null only if NO photo shows any kind of wine tasting space."
    ),
});

const DELAY_MS = 1500;
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(
    `Flags: ${dryRun ? "--dry-run " : ""}${winerySlugArg ? `--winery=${winerySlugArg} ` : ""}\n`
  );

  // Get all wineries
  const allWineries = await db
    .select({ id: wineries.id, slug: wineries.slug, name: wineries.name })
    .from(wineries);

  let toProcess = allWineries;

  if (winerySlugArg) {
    toProcess = toProcess.filter((w) => w.slug === winerySlugArg);
    if (toProcess.length === 0) {
      console.error(`No winery found with slug "${winerySlugArg}"`);
      process.exit(1);
    }
  }

  console.log(`${toProcess.length} wineries to classify\n`);

  let processed = 0;
  let classified = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (const winery of toProcess) {
    processed++;

    // Get photos for this winery — only those with blob URLs (Google Places URLs expire)
    const allPhotos = await db
      .select({
        id: wineryPhotos.id,
        url: wineryPhotos.url,
        blobUrl: wineryPhotos.blobUrl,
        category: wineryPhotos.category,
      })
      .from(wineryPhotos)
      .where(eq(wineryPhotos.wineryId, winery.id));

    // Skip logic
    const hasSetting = allPhotos.some((p) => p.category === "setting");
    const hasTastingRoom = allPhotos.some((p) => p.category === "tasting_room");
    const hasClassified = hasSetting || hasTastingRoom;

    if (force) {
      // --force: clear everything and re-classify
      if (hasClassified) {
        for (const p of allPhotos.filter((p) => p.category)) {
          await db.update(wineryPhotos).set({ category: null }).where(eq(wineryPhotos.id, p.id));
        }
      }
    } else if (winerySlugArg) {
      // targeted: clear and re-classify
      if (hasClassified) {
        for (const p of allPhotos.filter((p) => p.category)) {
          await db.update(wineryPhotos).set({ category: null }).where(eq(wineryPhotos.id, p.id));
        }
      }
    } else if (hasSetting && hasTastingRoom) {
      // both categories present: skip
      continue;
    }
    // Otherwise: missing at least one category, proceed to classify

    const photos = allPhotos.filter((p) => p.blobUrl);

    if (photos.length < 2) {
      console.log(`[${processed}/${toProcess.length}] ${winery.name} — ${photos.length} blob photos, skipping (need 2+)`);
      continue;
    }

    console.log(
      `[${processed}/${toProcess.length}] ${winery.name} (${photos.length} blob photos)${dryRun ? " (dry run)" : ""}`
    );

    if (dryRun) {
      await sleep(50);
      continue;
    }

    const imageUrls = photos.map((p) => p.blobUrl!);

    try {
      const completion = await openai.chat.completions.parse({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 200,
        messages: [
          {
            role: "system",
            content:
              "You are classifying winery photos. Pick the BEST photo for each category. Be selective but reasonable — many wineries taste wine outdoors on patios or in barrel rooms, not just at indoor bars.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `These are ${photos.length} photos from ${winery.name}. For each category, tell me the index (0-based) of the BEST matching photo:

1. SETTING: An exterior shot showing the winery building, grounds, vineyard rows, or landscape. What visitors see when they arrive or look around outside.

2. TASTING ROOM: Any space where guests taste wine. This includes: indoor tasting bars, outdoor patios with wine glasses set up, seated tasting rooms, barrel room tastings, wine lounges, covered terraces with wine service. Look for wine glasses, tasting setups, or people enjoying wine. Do NOT pick: food-only photos (plates of food without wine context), empty vineyard/landscape shots, wine bottles alone on a shelf, generic hallways, or parking lots.

Return null for tasting room only if NO photo shows any kind of wine tasting space at all.`,
              },
              ...imageUrls.map(
                (url, i) =>
                  ({
                    type: "image_url" as const,
                    image_url: { url, detail: "low" as const },
                  })
              ),
            ],
          },
        ],
        response_format: zodResponseFormat(PhotoClassification, "classification"),
      });

      if (completion.usage) {
        totalInputTokens += completion.usage.prompt_tokens;
        totalOutputTokens += completion.usage.completion_tokens;
      }

      const result = completion.choices[0]?.message?.parsed;
      if (!result) {
        console.log("  No result returned, skipping");
        continue;
      }

      // Update photo categories — only set categories that are missing
      let updated = 0;

      if (result.settingPhotoIndex != null && result.settingPhotoIndex < photos.length && !hasSetting) {
        await db
          .update(wineryPhotos)
          .set({ category: "setting" })
          .where(eq(wineryPhotos.id, photos[result.settingPhotoIndex].id));
        updated++;
        console.log(`  ✓ setting: photo ${result.settingPhotoIndex}`);
      }

      if (result.tastingRoomPhotoIndex != null && result.tastingRoomPhotoIndex < photos.length && !hasTastingRoom) {
        await db
          .update(wineryPhotos)
          .set({ category: "tasting_room" })
          .where(eq(wineryPhotos.id, photos[result.tastingRoomPhotoIndex].id));
        updated++;
        console.log(`  ✓ tasting_room: photo ${result.tastingRoomPhotoIndex}`);
      }

      if (updated > 0) classified++;
      if (updated === 0) console.log("  — no clear matches found");
    } catch (err) {
      console.error(`  Error: ${err}`);
    }

    await sleep(DELAY_MS);
  }

  // Cost summary — gpt-4o-mini vision: $0.15/1M input, $0.60/1M output
  const inputCost = (totalInputTokens / 1_000_000) * 0.15;
  const outputCost = (totalOutputTokens / 1_000_000) * 0.6;
  console.log(`\n=== Summary ===`);
  console.log(`Processed: ${processed}`);
  console.log(`Wineries with classified photos: ${classified}`);
  console.log(`Tokens: ${totalInputTokens} in / ${totalOutputTokens} out`);
  console.log(`Estimated cost: $${(inputCost + outputCost).toFixed(3)}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
