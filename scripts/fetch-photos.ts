import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { put } from "@vercel/blob";
import { wineries, wineryPhotos, scrapeLog } from "../src/db/schema";
import { eq, isNotNull, sql, and } from "drizzle-orm";

// --- CLI args ---
const useTurso = process.argv.includes("--turso");
const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");
const winerySlugArg = process.argv.find((a) => a.startsWith("--winery="))?.split("=")[1];
const olderThanDays = parseInt(
  process.argv.find((a) => a.startsWith("--older-than="))?.split("=")[1] || "90",
  10
);

// --- DB setup ---
let dbUrl: string;
let dbAuthToken: string | undefined;

if (useTurso) {
  dbUrl = "libsql://napa-winery-search-theinterchange.aws-us-west-2.turso.io";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  if (!dbAuthToken) {
    console.log("No DATABASE_AUTH_TOKEN in env, generating via Turso CLI...");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { execSync } = require("child_process") as typeof import("child_process");
    dbAuthToken = execSync(
      `${process.env.HOME}/.turso/turso db tokens create napa-winery-search`,
      { encoding: "utf-8" }
    ).trim();
  }
  console.log("Using Turso production database");
} else {
  dbUrl = process.env.DATABASE_URL || "file:./data/winery.db";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  console.log("Using local database");
}

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY && !dryRun) {
  console.error("Missing GOOGLE_PLACES_API_KEY in environment");
  process.exit(1);
}

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
if (!BLOB_TOKEN && !dryRun) {
  console.error("Missing BLOB_READ_WRITE_TOKEN in environment");
  process.exit(1);
}

const client = createClient({ url: dbUrl, authToken: dbAuthToken });
const db = drizzle(client);

const MAX_PHOTOS = 8;
const DELAY_MS = 200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface PlacePhoto {
  name: string;
  widthPx: number;
  heightPx: number;
  authorAttributions: { displayName: string; uri: string }[];
}

async function getPhotoRefs(placeId: string): Promise<PlacePhoto[]> {
  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=photos&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  Failed to get place details: ${res.status} ${res.statusText}`);
    return [];
  }
  const data = await res.json();
  return data.photos || [];
}

async function getPhotoUrl(photoName: string): Promise<string | null> {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&skipHttpRedirect=true&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  Failed to get photo URL: ${res.status}`);
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
      console.error(`  Failed to download image: ${res.status}`);
      return null;
    }
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : "jpg";
    const buffer = Buffer.from(await res.arrayBuffer());

    const blob = await put(
      `winery-photos/${winerySlug}/${photoIndex}.${ext}`,
      buffer,
      { access: "public", contentType, token: BLOB_TOKEN, addRandomSuffix: false, allowOverwrite: true }
    );
    return blob.url;
  } catch (err) {
    console.error(`  Blob upload failed: ${err}`);
    return null;
  }
}

type RefreshReason = "no photos" | "stale" | "content changed" | "force" | "targeted";

interface WineryToFetch {
  id: number;
  name: string;
  slug: string;
  googlePlaceId: string;
  reason: RefreshReason;
  detail?: string;
}

async function getWineriesToFetch(): Promise<WineryToFetch[]> {
  // Get all wineries with place IDs, their photo stats, and latest scrape info
  const rows = await db
    .select({
      id: wineries.id,
      name: wineries.name,
      slug: wineries.slug,
      googlePlaceId: wineries.googlePlaceId,
      hoursJson: wineries.hoursJson,
      photoCount: sql<number>`count(${wineryPhotos.id})`.as("photo_count"),
      oldestFetchedAt: sql<string | null>`min(${wineryPhotos.fetchedAt})`.as("oldest_fetched_at"),
      latestContentHash: sql<string | null>`(
        SELECT ${scrapeLog.contentHash} FROM ${scrapeLog}
        WHERE ${scrapeLog.wineryId} = ${wineries.id}
        ORDER BY ${scrapeLog.scrapedAt} DESC LIMIT 1
      )`.as("latest_content_hash"),
      prevContentHash: sql<string | null>`(
        SELECT ${scrapeLog.contentHash} FROM ${scrapeLog}
        WHERE ${scrapeLog.wineryId} = ${wineries.id}
        ORDER BY ${scrapeLog.scrapedAt} DESC LIMIT 1 OFFSET 1
      )`.as("prev_content_hash"),
    })
    .from(wineries)
    .leftJoin(wineryPhotos, eq(wineryPhotos.wineryId, wineries.id))
    .where(isNotNull(wineries.googlePlaceId))
    .groupBy(wineries.id);

  // Filter by slug if specified
  const filtered = winerySlugArg
    ? rows.filter((r) => r.slug === winerySlugArg)
    : rows;

  if (winerySlugArg && filtered.length === 0) {
    console.error(`No winery found with slug "${winerySlugArg}"`);
    process.exit(1);
  }

  const result: WineryToFetch[] = [];
  const staleCutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();

  for (const row of filtered) {
    const placeId = row.googlePlaceId!;
    let reason: RefreshReason | null = null;
    let detail: string | undefined;

    if (winerySlugArg) {
      reason = "targeted";
    } else if (force) {
      reason = "force";
    } else if (row.photoCount === 0) {
      reason = "no photos";
    } else if (
      row.latestContentHash &&
      row.prevContentHash &&
      row.latestContentHash !== row.prevContentHash
    ) {
      reason = "content changed";
      detail = `hash ${row.prevContentHash?.slice(0, 8)} → ${row.latestContentHash?.slice(0, 8)}`;
    } else if (!row.oldestFetchedAt || row.oldestFetchedAt < staleCutoff) {
      const daysOld = row.oldestFetchedAt
        ? Math.round((Date.now() - new Date(row.oldestFetchedAt).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      reason = "stale";
      detail = daysOld ? `${daysOld} days old` : "no fetchedAt timestamp";
    }

    if (reason) {
      result.push({ id: row.id, name: row.name, slug: row.slug, googlePlaceId: placeId, reason, detail });
    }
  }

  return result;
}

async function main() {
  console.log(`Flags: ${force ? "--force " : ""}${dryRun ? "--dry-run " : ""}${winerySlugArg ? `--winery=${winerySlugArg} ` : ""}--older-than=${olderThanDays}\n`);

  const toFetch = await getWineriesToFetch();

  // Count all wineries for context
  const allCount = (
    await db.select({ id: wineries.id }).from(wineries).where(isNotNull(wineries.googlePlaceId))
  ).length;

  console.log(`${toFetch.length} / ${allCount} wineries need photo refresh:\n`);

  if (toFetch.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  // Print summary
  const reasonCounts: Record<string, number> = {};
  for (const w of toFetch) {
    reasonCounts[w.reason] = (reasonCounts[w.reason] || 0) + 1;
  }
  for (const [reason, count] of Object.entries(reasonCounts)) {
    console.log(`  ${reason}: ${count}`);
  }
  console.log();

  if (dryRun) {
    for (const w of toFetch) {
      console.log(`  [dry-run] ${w.name} — ${w.reason}${w.detail ? ` (${w.detail})` : ""}`);
    }
    console.log("\nDry run complete. No API calls made.");
    return;
  }

  let totalPhotos = 0;
  let processed = 0;
  const now = new Date().toISOString();

  for (const winery of toFetch) {
    processed++;
    console.log(`[${processed}/${toFetch.length}] ${winery.name} — ${winery.reason}${winery.detail ? ` (${winery.detail})` : ""}`);

    const photoRefs = await getPhotoRefs(winery.googlePlaceId);
    if (photoRefs.length === 0) {
      console.log("  No photos found, skipping");
      await sleep(DELAY_MS);
      continue;
    }

    // Prefer landscape photos (width > height) for hero image
    const landscapeFirst = [...photoRefs].sort((a, b) => {
      const aLandscape = a.widthPx > a.heightPx ? 1 : 0;
      const bLandscape = b.widthPx > b.heightPx ? 1 : 0;
      return bLandscape - aLandscape;
    });
    const refs = landscapeFirst.slice(0, MAX_PHOTOS);
    const photos: { googleUrl: string; blobUrl: string }[] = [];

    for (let pi = 0; pi < refs.length; pi++) {
      const googleUrl = await getPhotoUrl(refs[pi].name);
      if (!googleUrl) continue;

      const blobUrl = await uploadToBlob(googleUrl, winery.slug, pi);
      if (blobUrl) {
        photos.push({ googleUrl, blobUrl });
      } else {
        // Store Google URL as fallback even if Blob upload fails
        photos.push({ googleUrl, blobUrl: googleUrl });
      }
    }

    if (photos.length === 0) {
      console.log("  No photo URLs resolved, skipping");
      await sleep(DELAY_MS);
      continue;
    }

    // Delete existing photos for this winery, then insert new ones
    await db.delete(wineryPhotos).where(eq(wineryPhotos.wineryId, winery.id));
    await db.insert(wineryPhotos).values(
      photos.map((p) => ({
        wineryId: winery.id,
        url: p.googleUrl,
        blobUrl: p.blobUrl,
        source: "google_places" as const,
        altText: `Photo of ${winery.name}`,
        fetchedAt: now,
      }))
    );

    // Set hero image to first photo's Blob URL
    await db
      .update(wineries)
      .set({ heroImageUrl: photos[0].blobUrl })
      .where(eq(wineries.id, winery.id));

    totalPhotos += photos.length;
    console.log(`  Saved ${photos.length} photos (Blob)`);
    await sleep(DELAY_MS);
  }

  console.log(`\nDone! Saved ${totalPhotos} photos across ${processed} wineries.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
