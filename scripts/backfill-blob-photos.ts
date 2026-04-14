/**
 * Backfill winery_photos rows that have a Google Places URL but no blob_url.
 * Re-fetches from the Places API at 1600px (higher res than the original 800px)
 * and uploads to Vercel Blob.
 *
 * Usage:
 *   npx tsx scripts/backfill-blob-photos.ts              # live run
 *   npx tsx scripts/backfill-blob-photos.ts --dry-run     # preview only
 *   npx tsx scripts/backfill-blob-photos.ts --limit=10    # first 10 wineries only
 *
 * Cost: ~$0.007 per photo via Places API Photo. 472 missing photos ≈ $3.30.
 * Blob uploads are free on Vercel Pro.
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
const MAX_WIDTH = 1600; // Higher res than original 800px fetch

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Places API helpers (same as fetch-photos.ts) ---

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
  // Find wineries with at least one photo missing blob_url
  const wineriesToFix = await client.execute(`
    SELECT DISTINCT w.id, w.slug, w.name, w.google_place_id,
      (SELECT COUNT(*) FROM winery_photos wp WHERE wp.winery_id = w.id AND wp.blob_url IS NULL) AS missing_count,
      (SELECT COUNT(*) FROM winery_photos wp WHERE wp.winery_id = w.id) AS total_count
    FROM wineries w
    JOIN winery_photos wp ON wp.winery_id = w.id
    WHERE wp.blob_url IS NULL AND w.google_place_id IS NOT NULL
    ORDER BY w.name
  `);

  const toProcess = wineriesToFix.rows.slice(0, limit);
  const totalMissing = toProcess.reduce(
    (sum, r) => sum + (r.missing_count as number),
    0
  );

  console.log(
    `\nFound ${wineriesToFix.rows.length} wineries with missing blob photos`
  );
  console.log(
    `Processing ${toProcess.length} wineries, ~${totalMissing} photos`
  );
  console.log(
    `Estimated Places API cost: ~$${((totalMissing * 7) / 1000).toFixed(2)}`
  );
  console.log(`Resolution: ${MAX_WIDTH}px (vs original 800px)`);
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}\n`);

  let uploaded = 0;
  let failed = 0;
  let skipped = 0;

  for (const winery of toProcess) {
    const slug = winery.slug as string;
    const name = winery.name as string;
    const placeId = winery.google_place_id as string;
    const missingCount = winery.missing_count as number;

    console.log(
      `${name} (${slug}) — ${missingCount} missing of ${winery.total_count}`
    );

    if (dryRun) {
      skipped += missingCount;
      continue;
    }

    // Get fresh photo references from Places API
    const photoRefs = await getPhotoRefs(placeId);
    if (photoRefs.length === 0) {
      console.log(`  No photo refs found, skipping`);
      skipped += missingCount;
      continue;
    }

    // Get all existing photo rows for this winery (ordered by id)
    const existingPhotos = await client.execute({
      sql: `SELECT id, url, blob_url FROM winery_photos WHERE winery_id = ? ORDER BY id`,
      args: [winery.id as number],
    });

    // For each row missing blob_url, try to fetch and upload
    for (let i = 0; i < existingPhotos.rows.length; i++) {
      const row = existingPhotos.rows[i];
      if (row.blob_url) continue; // already has blob

      // Match to a photo ref by index (photos are stored in order)
      const refIndex = i < photoRefs.length ? i : null;
      if (refIndex === null) {
        console.log(`  Row ${row.id}: no matching photo ref at index ${i}`);
        skipped++;
        continue;
      }

      // Get fresh URL for this photo
      const freshUrl = await getPhotoUrl(photoRefs[refIndex].name);
      if (!freshUrl) {
        console.log(`  Row ${row.id}: failed to get fresh URL`);
        failed++;
        await sleep(DELAY_MS);
        continue;
      }

      // Upload to Blob
      const blobUrl = await uploadToBlob(freshUrl, slug, i);
      if (!blobUrl) {
        console.log(`  Row ${row.id}: blob upload failed`);
        failed++;
        await sleep(DELAY_MS);
        continue;
      }

      // Update the row with the new blob_url (don't touch url — unique constraint on winery_id+url)
      try {
        await client.execute({
          sql: `UPDATE winery_photos SET blob_url = ? WHERE id = ?`,
          args: [blobUrl, row.id as number],
        });
        console.log(`  Row ${row.id}: ✓ uploaded (${blobUrl.substring(0, 60)}...)`);
        uploaded++;
      } catch (err) {
        console.error(`  Row ${row.id}: DB update failed: ${err}`);
        failed++;
      }
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n--- Done ---`);
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);
}

main().catch(console.error);
