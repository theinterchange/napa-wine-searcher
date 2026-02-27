import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries, wineryPhotos } from "../src/db/schema";
import { eq, isNotNull } from "drizzle-orm";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  console.error("Missing GOOGLE_PLACES_API_KEY in environment");
  process.exit(1);
}

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
});
const db = drizzle(client);

const MAX_PHOTOS = 5;
const DELAY_MS = 200; // small delay between wineries to be polite

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface PlacePhoto {
  name: string; // e.g. "places/PLACE_ID/photos/PHOTO_REF"
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

async function main() {
  const allWineries = await db
    .select({
      id: wineries.id,
      name: wineries.name,
      googlePlaceId: wineries.googlePlaceId,
    })
    .from(wineries)
    .where(isNotNull(wineries.googlePlaceId));

  console.log(`Found ${allWineries.length} wineries with Google Place IDs\n`);

  let totalPhotos = 0;
  let processed = 0;

  for (const winery of allWineries) {
    processed++;
    const placeId = winery.googlePlaceId!;
    console.log(`[${processed}/${allWineries.length}] ${winery.name} (${placeId})`);

    const photoRefs = await getPhotoRefs(placeId);
    if (photoRefs.length === 0) {
      console.log("  No photos found, skipping");
      await sleep(DELAY_MS);
      continue;
    }

    const refs = photoRefs.slice(0, MAX_PHOTOS);
    const urls: string[] = [];

    for (const ref of refs) {
      const photoUrl = await getPhotoUrl(ref.name);
      if (photoUrl) urls.push(photoUrl);
    }

    if (urls.length === 0) {
      console.log("  No photo URLs resolved, skipping");
      await sleep(DELAY_MS);
      continue;
    }

    // Delete existing photos for this winery, then insert new ones
    await db.delete(wineryPhotos).where(eq(wineryPhotos.wineryId, winery.id));
    await db.insert(wineryPhotos).values(
      urls.map((url) => ({
        wineryId: winery.id,
        url,
        source: "google_places" as const,
        altText: `Photo of ${winery.name}`,
      }))
    );

    totalPhotos += urls.length;
    console.log(`  Saved ${urls.length} photos`);
    await sleep(DELAY_MS);
  }

  console.log(`\nDone! Saved ${totalPhotos} photos across ${processed} wineries.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
