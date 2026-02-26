/**
 * Fetch hero photos for all wineries using Google Places API.
 *
 * Steps:
 *   1. Backfill google_place_id for wineries missing them
 *   2. Fetch photo URIs via Places Photos media endpoint
 *   3. Update hero_image_url on each winery row + insert into winery_photos
 *
 * Usage:
 *   npx tsx tmp-fetch-photos.ts
 *   npx tsx tmp-fetch-photos.ts --dry-run     # Preview without writing
 *   npx tsx tmp-fetch-photos.ts --limit 5     # Process only first N
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFileSync } from "fs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries, wineryPhotos } from "./src/db/schema";

// --- DB setup ---
const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const db = drizzle(client);

// --- Config ---
const API_KEY =
  process.env.GOOGLE_PLACES_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  "";

if (!API_KEY) {
  console.error("ERROR: No Google Places API key found. Set GOOGLE_PLACES_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local");
  process.exit(1);
}

const DELAY_MS = 100; // Rate limit between photo fetches
const dryRun = process.argv.includes("--dry-run");
const limitArg = process.argv.indexOf("--limit");
const limit = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity;

// --- Types ---
interface WineryTarget {
  name: string;
  slug: string;
  googlePlaceId?: string;
  googlePhotos?: string[];
}

// --- Helpers ---
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Google Places Text Search (New) to find a Place ID by name.
 */
async function searchPlaceId(wineryName: string): Promise<string | null> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "places.id",
    },
    body: JSON.stringify({
      textQuery: `${wineryName} winery Napa Sonoma`,
    }),
  });

  if (!res.ok) {
    console.error(`  Text Search failed for "${wineryName}": ${res.status} ${await res.text()}`);
    return null;
  }

  const data = await res.json();
  const placeId = data.places?.[0]?.id;
  return placeId || null;
}

/**
 * Get photo references from Place Details (New API).
 */
async function getPhotoRefs(placeId: string): Promise<string[]> {
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}`,
    {
      headers: {
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": "photos",
      },
    }
  );

  if (!res.ok) {
    console.error(`  Place Details failed for ${placeId}: ${res.status}`);
    return [];
  }

  const data = await res.json();
  return (data.photos || []).map((p: { name: string }) => p.name);
}

/**
 * Get a photo URI using the media endpoint with skipHttpRedirect.
 */
async function getPhotoUri(photoName: string): Promise<string | null> {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=800&skipHttpRedirect=true&key=${API_KEY}`;
  const res = await fetch(url);

  if (!res.ok) {
    console.error(`  Photo media failed for ${photoName}: ${res.status}`);
    return null;
  }

  const data = await res.json();
  return data.photoUri || null;
}

// --- Main ---
async function main() {
  console.log("=== Winery Photo Fetcher ===");
  if (dryRun) console.log("(DRY RUN — no DB writes)");
  console.log();

  // 1. Load winery-targets.json
  const targetsRaw = readFileSync("src/scraper/data/winery-targets.json", "utf-8");
  const targets: WineryTarget[] = JSON.parse(targetsRaw);
  const targetsBySlug = new Map(targets.map((t) => [t.slug, t]));

  console.log(`Loaded ${targets.length} winery targets`);

  // 2. Load all wineries from DB
  const allWineries = await db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      googlePlaceId: wineries.googlePlaceId,
      heroImageUrl: wineries.heroImageUrl,
    })
    .from(wineries);

  console.log(`Found ${allWineries.length} wineries in DB`);

  // 3. Backfill google_place_id for those missing it
  const missingPlaceId = allWineries.filter((w) => !w.googlePlaceId);
  console.log(`\n--- Backfilling ${missingPlaceId.length} missing Place IDs ---`);

  for (const w of missingPlaceId) {
    const target = targetsBySlug.get(w.slug);
    if (target?.googlePlaceId) {
      console.log(`  ${w.slug}: using target JSON → ${target.googlePlaceId}`);
      if (!dryRun) {
        await db
          .update(wineries)
          .set({ googlePlaceId: target.googlePlaceId })
          .where(eq(wineries.id, w.id));
      }
      w.googlePlaceId = target.googlePlaceId;
    } else {
      console.log(`  ${w.slug}: searching Google Places API...`);
      const placeId = await searchPlaceId(w.name);
      if (placeId) {
        console.log(`    → found: ${placeId}`);
        if (!dryRun) {
          await db
            .update(wineries)
            .set({ googlePlaceId: placeId })
            .where(eq(wineries.id, w.id));
        }
        w.googlePlaceId = placeId;
      } else {
        console.log(`    → NOT FOUND`);
      }
      await sleep(DELAY_MS);
    }
  }

  // 4. Fetch photos for all wineries
  const toProcess = allWineries
    .filter((w) => w.googlePlaceId)
    .slice(0, limit);
  const alreadyHavePhoto = toProcess.filter((w) => w.heroImageUrl).length;

  console.log(`\n--- Fetching photos for ${toProcess.length} wineries (${alreadyHavePhoto} already have photos) ---`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const w = toProcess[i];

    // Skip if already has a hero image
    if (w.heroImageUrl) {
      skipped++;
      continue;
    }

    const progress = `[${i + 1}/${toProcess.length}]`;

    // Try to get photo ref from targets first
    const target = targetsBySlug.get(w.slug);
    let photoRef = target?.googlePhotos?.[0] || null;

    // If no cached photo ref, call Place Details
    if (!photoRef) {
      const refs = await getPhotoRefs(w.googlePlaceId!);
      photoRef = refs[0] || null;
      await sleep(DELAY_MS);
    }

    if (!photoRef) {
      console.log(`${progress} ${w.slug}: no photo refs found`);
      failed++;
      continue;
    }

    // Get photo URI
    const photoUri = await getPhotoUri(photoRef);
    if (!photoUri) {
      console.log(`${progress} ${w.slug}: photo media endpoint failed`);
      failed++;
      continue;
    }

    console.log(`${progress} ${w.slug}: ✓`);

    if (!dryRun) {
      // Update hero_image_url
      await db
        .update(wineries)
        .set({ heroImageUrl: photoUri })
        .where(eq(wineries.id, w.id));

      // Insert into winery_photos (check for duplicates first)
      const existing = await db
        .select({ id: wineryPhotos.id })
        .from(wineryPhotos)
        .where(eq(wineryPhotos.wineryId, w.id))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(wineryPhotos).values({
          wineryId: w.id,
          url: photoUri,
          source: "google_places",
          altText: `${w.name} winery`,
        });
      }
    }

    success++;
    await sleep(DELAY_MS);
  }

  // 5. Summary
  const noPlaceId = allWineries.filter((w) => !w.googlePlaceId).length;
  console.log(`\n=== Summary ===`);
  console.log(`Photos fetched:  ${success}`);
  console.log(`Already had:     ${skipped}`);
  console.log(`Failed:          ${failed}`);
  console.log(`No Place ID:     ${noPlaceId}`);
  console.log(`Total wineries:  ${allWineries.length}`);

  if (dryRun) {
    console.log("\n(DRY RUN — nothing written to DB)");
  }
}

main().catch(console.error);
