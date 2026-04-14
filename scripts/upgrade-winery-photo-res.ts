/**
 * Upgrade all winery_photos from 800px to 1600px resolution.
 * Re-fetches from the Places API at 1600px and overwrites existing Blob files.
 *
 * Usage:
 *   npx tsx scripts/upgrade-winery-photo-res.ts              # live run
 *   npx tsx scripts/upgrade-winery-photo-res.ts --dry-run     # preview only
 *   npx tsx scripts/upgrade-winery-photo-res.ts --limit=3     # first 3 wineries only
 *
 * Cost: ~$0.007 per photo via Places API Photo. ~923 photos ≈ $6.50.
 * Blob uploads are free on Vercel Pro. Overwrites in place (same URL).
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@libsql/client";
import { put } from "@vercel/blob";

const dryRun = process.argv.includes("--dry-run");
const limitArg = process.argv
  .find((a) => a.startsWith("--limit="))
  ?.split("=")[1];
const limit = limitArg ? parseInt(limitArg, 10) : Infinity;

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const DB_URL = process.env.DATABASE_URL;
const DB_AUTH = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");

if (!API_KEY) {
  console.error("Missing GOOGLE_PLACES_API_KEY");
  process.exit(1);
}
if (!BLOB_TOKEN && !dryRun) {
  console.error("Missing BLOB_READ_WRITE_TOKEN");
  process.exit(1);
}
if (!DB_URL) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const client = createClient({ url: DB_URL, authToken: DB_AUTH });

const DELAY_MS = 500; // 2 per second — safe for Blob + Places API
const MAX_WIDTH = 1600;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Places API helpers ---

interface PlacePhoto {
  name: string;
  widthPx: number;
  heightPx: number;
}

async function getPhotoRefs(placeId: string): Promise<PlacePhoto[]> {
  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=photos&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  Places Details failed: ${res.status} ${res.statusText}`);
    return [];
  }
  const data = await res.json();
  return data.photos || [];
}

async function getPhotoUrl(photoName: string): Promise<string | null> {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${MAX_WIDTH}&skipHttpRedirect=true&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  Photo URL failed: ${res.status}`);
    return null;
  }
  const data = await res.json();
  return data.photoUri || null;
}

async function uploadToBlob(
  googleUrl: string,
  winerySlug: string,
  photoIndex: number
): Promise<string | null> {
  try {
    const res = await fetch(googleUrl);
    if (!res.ok) {
      console.error(`  Download failed: ${res.status}`);
      return null;
    }
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : "jpg";
    const buffer = Buffer.from(await res.arrayBuffer());

    const blob = await put(
      `winery-photos/${winerySlug}/${photoIndex}.${ext}`,
      buffer,
      {
        access: "public",
        contentType,
        token: BLOB_TOKEN,
        addRandomSuffix: false,
        allowOverwrite: true,
      }
    );
    return blob.url;
  } catch (err) {
    console.error(`  Blob upload failed: ${err}`);
    return null;
  }
}

// --- Main ---

async function main() {
  // Find all wineries that have photos with blob_url (already uploaded at 800px)
  const wineriesToUpgrade = await client.execute(`
    SELECT DISTINCT w.id, w.slug, w.name, w.google_place_id,
      (SELECT COUNT(*) FROM winery_photos wp WHERE wp.winery_id = w.id AND wp.blob_url IS NOT NULL) AS photo_count
    FROM wineries w
    JOIN winery_photos wp ON wp.winery_id = w.id
    WHERE wp.blob_url IS NOT NULL AND w.google_place_id IS NOT NULL
    ORDER BY w.name
  `);

  const toProcess = wineriesToUpgrade.rows.slice(0, limit);
  const totalPhotos = toProcess.reduce(
    (sum, r) => sum + (r.photo_count as number),
    0
  );

  console.log(
    `\nFound ${wineriesToUpgrade.rows.length} wineries with blob photos to upgrade`
  );
  console.log(
    `Processing ${toProcess.length} wineries, ~${totalPhotos} photos`
  );
  console.log(
    `Estimated Places API cost: ~$${((totalPhotos * 7) / 1000).toFixed(2)}`
  );
  console.log(`Upgrading to: ${MAX_WIDTH}px`);
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}\n`);

  let upgraded = 0;
  let failed = 0;
  let skipped = 0;

  for (const winery of toProcess) {
    const slug = winery.slug as string;
    const name = winery.name as string;
    const placeId = winery.google_place_id as string;
    const photoCount = winery.photo_count as number;

    console.log(`${name} (${slug}) — ${photoCount} photos`);

    if (dryRun) {
      skipped += photoCount;
      continue;
    }

    // Get fresh photo references from Places API
    const photoRefs = await getPhotoRefs(placeId);
    if (photoRefs.length === 0) {
      console.log(`  No photo refs found, skipping`);
      skipped += photoCount;
      continue;
    }

    // Get all photo rows with blob_url for this winery (ordered by id)
    const existingPhotos = await client.execute({
      sql: `SELECT id, blob_url FROM winery_photos WHERE winery_id = ? AND blob_url IS NOT NULL ORDER BY id`,
      args: [winery.id as number],
    });

    // For each row, re-fetch at 1600px and overwrite the Blob file
    for (let i = 0; i < existingPhotos.rows.length; i++) {
      const row = existingPhotos.rows[i];

      // Match to a photo ref by index
      if (i >= photoRefs.length) {
        console.log(`  Row ${row.id}: no matching photo ref at index ${i}, skipping`);
        skipped++;
        continue;
      }

      // Get fresh high-res URL
      const freshUrl = await getPhotoUrl(photoRefs[i].name);
      if (!freshUrl) {
        console.log(`  Row ${row.id}: failed to get fresh URL`);
        failed++;
        await sleep(DELAY_MS);
        continue;
      }

      // Upload to Blob (overwrites existing file at same path)
      const blobUrl = await uploadToBlob(freshUrl, slug, i);
      if (!blobUrl) {
        console.log(`  Row ${row.id}: blob upload failed`);
        failed++;
        await sleep(DELAY_MS);
        continue;
      }

      // Update blob_url in DB (don't touch url — unique constraint)
      try {
        await client.execute({
          sql: `UPDATE winery_photos SET blob_url = ? WHERE id = ?`,
          args: [blobUrl, row.id as number],
        });
        console.log(`  Row ${row.id}: ✓ upgraded`);
        upgraded++;
      } catch (err) {
        console.error(`  Row ${row.id}: DB update failed: ${err}`);
        failed++;
      }
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n--- Done ---`);
  console.log(`Upgraded: ${upgraded}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);
}

main().catch(console.error);
