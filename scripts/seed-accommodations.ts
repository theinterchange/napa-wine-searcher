/**
 * Seed accommodation properties from Google Places API + GPT-4o-mini editorial.
 *
 * Searches for top-rated hotels/inns/resorts in Napa & Sonoma wine country,
 * fetches details + photos, generates editorial content, and outputs for review.
 *
 * Usage:
 *   npx tsx scripts/seed-accommodations.ts --dry-run          # Preview what would be found
 *   npx tsx scripts/seed-accommodations.ts                    # Full run, output to preview JSON
 *   npx tsx scripts/seed-accommodations.ts --confirm          # Insert into local DB
 *   npx tsx scripts/seed-accommodations.ts --turso --confirm  # Insert into production DB
 *   npx tsx scripts/seed-accommodations.ts --slug=meadowood-napa-valley  # Single property
 *   npx tsx scripts/seed-accommodations.ts --skip-photos      # Skip photo fetching
 *   npx tsx scripts/seed-accommodations.ts --skip-editorial   # Skip GPT content
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { put } from "@vercel/blob";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import {
  accommodations,
  accommodationPhotos,
  accommodationNearbyWineries,
  wineries,
  subRegions,
} from "../src/db/schema";
import { eq, sql } from "drizzle-orm";
import { writeFileSync, mkdirSync } from "fs";

// --- CLI args ---
const useTurso = process.argv.includes("--turso");
const dryRun = process.argv.includes("--dry-run");
const confirm = process.argv.includes("--confirm");
const skipPhotos = process.argv.includes("--skip-photos");
const skipEditorial = process.argv.includes("--skip-editorial");
const slugArg = process.argv.find((a) => a.startsWith("--slug="))?.split("=")[1];

// --- DB setup ---
let dbUrl: string;
let dbAuthToken: string | undefined;

if (useTurso) {
  dbUrl = "libsql://napa-winery-search-theinterchange.aws-us-west-2.turso.io";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  if (!dbAuthToken) {
    const { execSync } = require("child_process") as typeof import("child_process");
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

// --- API keys ---
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!GOOGLE_API_KEY && !dryRun) {
  console.error("Missing GOOGLE_PLACES_API_KEY");
  process.exit(1);
}

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
if (!BLOB_TOKEN && !dryRun && !skipPhotos) {
  console.error("Missing BLOB_READ_WRITE_TOKEN");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- Constants ---
const DELAY_MS = 300;
const MAX_PHOTOS = 8;
const MIN_RATING = 4.2;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// --- Search regions ---
interface SearchRegion {
  name: string;
  valley: "napa" | "sonoma";
  queries: string[];
}

const SEARCH_REGIONS: SearchRegion[] = [
  // Napa Valley
  { name: "Calistoga", valley: "napa", queries: ["luxury hotel Calistoga Napa Valley", "resort spa Calistoga", "inn Calistoga wine country"] },
  { name: "St. Helena", valley: "napa", queries: ["luxury hotel St Helena Napa Valley", "resort St Helena wine country", "boutique inn St Helena"] },
  { name: "Yountville", valley: "napa", queries: ["hotel Yountville Napa Valley", "luxury resort Yountville", "boutique hotel Yountville"] },
  { name: "Rutherford", valley: "napa", queries: ["luxury hotel Rutherford Napa Valley", "resort Oakville Napa Valley"] },
  { name: "Napa", valley: "napa", queries: ["hotel downtown Napa", "luxury hotel Napa California", "boutique hotel Napa wine country"] },
  { name: "Carneros", valley: "napa", queries: ["resort Carneros Napa", "luxury hotel Carneros wine country"] },
  // Sonoma County
  { name: "Healdsburg", valley: "sonoma", queries: ["luxury hotel Healdsburg", "resort Healdsburg Sonoma", "boutique hotel Healdsburg plaza", "inn Healdsburg wine country"] },
  { name: "Sonoma", valley: "sonoma", queries: ["luxury hotel Sonoma town plaza", "resort Sonoma Valley", "inn Sonoma California"] },
  { name: "Russian River Valley", valley: "sonoma", queries: ["hotel Guerneville Russian River", "inn Forestville wine country", "resort Russian River Valley Sonoma"] },
  { name: "Sebastopol", valley: "sonoma", queries: ["hotel Sebastopol Sonoma County", "hotel Petaluma wine country"] },
  { name: "Alexander Valley", valley: "sonoma", queries: ["hotel Geyserville Alexander Valley", "inn Cloverdale wine country"] },
];

// --- City → sub-region mapping ---
const CITY_TO_SUBREGION: Record<string, string> = {
  calistoga: "Calistoga",
  "st helena": "St. Helena",
  "st. helena": "St. Helena",
  "saint helena": "St. Helena",
  yountville: "Yountville",
  rutherford: "Rutherford",
  oakville: "Oakville",
  napa: "Downtown Napa",
  healdsburg: "Healdsburg & Northern Sonoma",
  sonoma: "Sonoma Valley",
  glen_ellen: "Sonoma Valley",
  "glen ellen": "Sonoma Valley",
  kenwood: "Sonoma Valley",
  guerneville: "Russian River Valley",
  forestville: "Russian River Valley",
  sebastopol: "Petaluma Gap",
  petaluma: "Petaluma Gap",
  geyserville: "Alexander Valley",
  cloverdale: "Alexander Valley",
};

// --- Google Places API ---
interface PlaceResult {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
  location: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  types?: string[];
  priceLevel?: string;
  photos?: { name: string }[];
}

async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_API_KEY!,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.websiteUri,places.types,places.priceLevel,places.photos",
    },
    body: JSON.stringify({
      textQuery: query,
      includedType: "lodging",
      languageCode: "en",
    }),
  });

  if (!res.ok) {
    console.error(`  Search API error: ${res.status} ${await res.text()}`);
    return [];
  }

  const data = await res.json();
  return data.places || [];
}

async function getPhotoUrl(photoName: string): Promise<string | null> {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1200&skipHttpRedirect=true&key=${GOOGLE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.photoUri || null;
}

async function uploadToBlob(
  googleUrl: string,
  slug: string,
  index: number
): Promise<string | null> {
  try {
    const res = await fetch(googleUrl);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : "jpg";
    const buffer = Buffer.from(await res.arrayBuffer());

    const blob = await put(
      `accommodation-photos/${slug}/${index}.${ext}`,
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

// --- GPT editorial content ---
const EditorialContent = z.object({
  whyStayHere: z.string().describe(
    "2-3 sentences. Why should a wine country traveler choose this specific property? Be evocative and specific — mention real features, views, location advantages. Make the reader picture themselves there."
  ),
  theSetting: z.string().describe(
    "2-3 sentences. Paint the physical environment: what do you see on arrival? The architecture, landscape, grounds, surrounding area. Be specific to this property."
  ),
  theExperience: z.string().describe(
    "2-3 sentences. What does a stay feel like day-to-day? The service, dining, atmosphere, pace. Help someone imagine their morning, afternoon, and evening."
  ),
  beforeYouBook: z.string().describe(
    "2-3 sentences. Practical tips: best room type, when to book, what to know. Factual and useful."
  ),
  shortDescription: z.string().describe(
    "1 sentence, max 120 characters. Card-level summary for listing pages."
  ),
  bestForTags: z.array(z.string()).describe(
    "2-4 tags from: Couples, Families, Groups, Solo, Wine Tastings, Spa & Wellness, Fine Dining, Hot Springs, Best Value, Luxury Experience, Walkable Tasting Rooms, Vineyard Setting, Downtown"
  ),
  whyThisHotel: z.array(z.string()).describe(
    "3-5 specific, factually verifiable reasons. e.g., '5 minutes from 8 top Cabernet producers in Stags Leap District', 'Walking distance to Yountville tasting rooms', 'On-site spa with wine-based treatments'. Each reason must be something that can be checked."
  ),
  seasonalNote: z.string().nullable().describe(
    "Optional. When is peak season? When are best rates? e.g., 'Book 3+ months ahead for harvest season (Sep-Oct). Best rates January-March.' Only include if you can be specific."
  ),
});

// --- Property type detection ---
function detectPropertyType(name: string, types: string[] = []): string {
  const lower = name.toLowerCase();
  if (lower.includes("resort") || lower.includes("four seasons") || lower.includes("montage")) return "resort";
  if (lower.includes("inn") || lower.includes("cottage") || lower.includes("manor") || lower.includes("maison")) return "inn";
  if (lower.includes("b&b") || lower.includes("bed and breakfast") || lower.includes("bed & breakfast")) return "bed_and_breakfast";
  if (lower.includes("ranch") || lower.includes("lodge")) return "resort";
  return "hotel";
}

// --- Price tier mapping ---
function mapPriceTier(priceLevel?: string, name?: string): number {
  if (priceLevel === "PRICE_LEVEL_VERY_EXPENSIVE") return 4;
  if (priceLevel === "PRICE_LEVEL_EXPENSIVE") return 3;
  if (priceLevel === "PRICE_LEVEL_MODERATE") return 2;
  if (priceLevel === "PRICE_LEVEL_INEXPENSIVE") return 1;
  // Heuristic from name
  const lower = (name || "").toLowerCase();
  if (lower.includes("four seasons") || lower.includes("montage") || lower.includes("auberge") || lower.includes("meadowood")) return 4;
  if (lower.includes("resort") || lower.includes("spa")) return 3;
  return 3; // Default to upscale for wine country
}

// --- Main ---
async function main() {
  console.log(
    `Flags: ${dryRun ? "--dry-run " : ""}${confirm ? "--confirm " : ""}${skipPhotos ? "--skip-photos " : ""}${skipEditorial ? "--skip-editorial " : ""}${slugArg ? `--slug=${slugArg} ` : ""}\n`
  );

  // Load sub-regions for mapping
  const allSubRegions = await db.select().from(subRegions);
  const subRegionByName = new Map(allSubRegions.map((s) => [s.name, s]));

  // Load existing wineries for nearby computation
  const allWineries = await db
    .select({
      id: wineries.id,
      name: wineries.name,
      slug: wineries.slug,
      lat: wineries.lat,
      lng: wineries.lng,
      subRegionId: wineries.subRegionId,
    })
    .from(wineries);

  // ---- STEP 1: Search Google Places for properties ----
  console.log("=== Step 1: Searching Google Places ===\n");

  const seenPlaceIds = new Set<string>();
  interface PropertyCandidate {
    placeId: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    rating: number;
    reviewCount: number;
    phone: string | null;
    websiteUrl: string | null;
    types: string[];
    priceLevel: string | undefined;
    photos: { name: string }[];
    regionName: string;
    valley: "napa" | "sonoma";
  }

  const candidates: PropertyCandidate[] = [];

  for (const region of SEARCH_REGIONS) {
    console.log(`Searching: ${region.name} (${region.valley})`);

    for (const query of region.queries) {
      if (dryRun) {
        console.log(`  Query: "${query}" (dry run)`);
        continue;
      }

      const results = await searchPlaces(query);
      let added = 0;

      for (const place of results) {
        if (seenPlaceIds.has(place.id)) continue;
        if (!place.rating || place.rating < MIN_RATING) continue;

        seenPlaceIds.add(place.id);
        candidates.push({
          placeId: place.id,
          name: place.displayName.text,
          address: place.formattedAddress,
          lat: place.location.latitude,
          lng: place.location.longitude,
          rating: place.rating,
          reviewCount: place.userRatingCount || 0,
          phone: place.nationalPhoneNumber || null,
          websiteUrl: place.websiteUri || null,
          types: place.types || [],
          priceLevel: place.priceLevel,
          photos: place.photos || [],
          regionName: region.name,
          valley: region.valley,
        });
        added++;
      }

      console.log(`  "${query}" → ${results.length} results, ${added} new (${MIN_RATING}+ rating)`);
      await sleep(DELAY_MS);
    }
  }

  // Sort by rating descending
  candidates.sort((a, b) => b.rating - a.rating);

  console.log(`\nFound ${candidates.length} unique properties above ${MIN_RATING} rating\n`);

  if (dryRun) {
    console.log("Dry run complete. Re-run without --dry-run to fetch data.");
    return;
  }

  // ---- STEP 2-7: Process each property ----
  console.log("=== Processing properties ===\n");

  const results: any[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let photosUploaded = 0;

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const slug = slugify(c.name);

    if (slugArg && slug !== slugArg) continue;

    const progress = `[${i + 1}/${candidates.length}]`;
    console.log(`${progress} ${c.name} (${c.rating}★, ${c.reviewCount} reviews)`);

    // Detect type and price
    const type = detectPropertyType(c.name, c.types);
    const priceTier = mapPriceTier(c.priceLevel, c.name);

    // Map city to sub-region
    const cityMatch = c.address.split(",")[1]?.trim().toLowerCase() || "";
    const subRegionName =
      CITY_TO_SUBREGION[cityMatch] ||
      CITY_TO_SUBREGION[c.regionName.toLowerCase()] ||
      null;
    const subRegion = subRegionName ? subRegionByName.get(subRegionName) : null;

    // --- Photos ---
    let heroImageUrl: string | null = null;
    const photoUrls: { photoUrl: string; blobUrl: string }[] = [];

    if (!skipPhotos && c.photos.length > 0) {
      const photosToFetch = c.photos.slice(0, MAX_PHOTOS);
      for (let pi = 0; pi < photosToFetch.length; pi++) {
        const googleUrl = await getPhotoUrl(photosToFetch[pi].name);
        if (!googleUrl) continue;

        const blobUrl = await uploadToBlob(googleUrl, slug, pi);
        if (blobUrl) {
          photoUrls.push({ photoUrl: googleUrl, blobUrl });
          if (pi === 0) heroImageUrl = blobUrl;
          photosUploaded++;
        }
        await sleep(100);
      }
      console.log(`  Photos: ${photoUrls.length}/${photosToFetch.length} uploaded`);
    }

    // --- Nearby wineries ---
    const nearbyWineriesList = allWineries
      .filter((w) => w.lat && w.lng)
      .map((w) => ({
        ...w,
        distance: haversineDistance(c.lat, c.lng, w.lat!, w.lng!),
      }))
      .filter((w) => w.distance <= 10)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 6);

    const nearbyContext = nearbyWineriesList.length > 0
      ? `Nearby wineries (within 10 mi): ${nearbyWineriesList.map((w) => `${w.name} (${w.distance.toFixed(1)} mi)`).join(", ")}`
      : "No wineries found within 10 miles.";

    // --- Editorial content ---
    let editorial: z.infer<typeof EditorialContent> | null = null;

    if (!skipEditorial) {
      try {
        const prompt = `Write editorial content for this wine country accommodation.

Property: ${c.name}
Type: ${type}
Location: ${c.address}
Rating: ${c.rating}/5 (${c.reviewCount} reviews)
Price level: ${"$".repeat(priceTier)}
${nearbyContext}

Write in the voice of Condé Nast Traveler — warm, evocative, aspirational. Make the reader picture themselves there. But every detail must be real: describe what actually exists based on the property name, type, and location. Do not invent specific amenities or views you aren't confident exist. If uncertain, be vague rather than specific.`;

        const completion = await openai.chat.completions.parse({
          model: "gpt-4o-mini",
          temperature: 0.7,
          max_tokens: 1000,
          messages: [
            {
              role: "system",
              content:
                "You are a travel editor at Condé Nast Traveler writing about wine country accommodations. Your tone is warm, evocative, and aspirational — make readers picture themselves there. But every detail must be real: describe what actually exists, not what sounds good. Be specific about the setting, the light, the views, the feeling of arrival. Reference real landmarks, real wineries nearby, real experiences. Never invent details. If you don't know something, leave it out. Trust, reliability, and utility are the core principles.",
            },
            { role: "user", content: prompt },
          ],
          response_format: zodResponseFormat(EditorialContent, "editorial"),
        });

        if (completion.usage) {
          totalInputTokens += completion.usage.prompt_tokens;
          totalOutputTokens += completion.usage.completion_tokens;
        }

        editorial = completion.choices[0]?.message?.parsed || null;
        if (editorial) {
          console.log(`  Editorial: ✓ "${editorial.shortDescription.slice(0, 50)}..."`);
        }
      } catch (err) {
        console.error(`  Editorial error: ${err}`);
      }
    }

    // --- Build property record ---
    const property = {
      slug,
      name: c.name,
      type,
      subRegionId: subRegion?.id || null,
      valley: c.valley,
      description: null as string | null,
      shortDescription: editorial?.shortDescription || null,
      heroImageUrl,
      thumbnailUrl: heroImageUrl,
      address: c.address,
      city: c.address.split(",")[1]?.trim() || null,
      state: "CA",
      lat: c.lat,
      lng: c.lng,
      phone: c.phone,
      websiteUrl: c.websiteUrl,
      bookingUrl: null as string | null,
      bookingProvider: "booking_com",
      priceTier,
      priceRangeMin: null as number | null,
      priceRangeMax: null as number | null,
      amenitiesJson: null as string | null,
      wineFeatures: null as string | null,
      whyStayHere: editorial?.whyStayHere || null,
      theSetting: editorial?.theSetting || null,
      theExperience: editorial?.theExperience || null,
      beforeYouBook: editorial?.beforeYouBook || null,
      bestFor: editorial?.bestForTags?.[0] || null,
      bestForTags: editorial?.bestForTags ? JSON.stringify(editorial.bestForTags) : null,
      whyThisHotel: editorial?.whyThisHotel ? JSON.stringify(editorial.whyThisHotel) : null,
      dogFriendly: null as boolean | null,
      dogFriendlyNote: null as string | null,
      kidFriendly: null as boolean | null,
      kidFriendlyNote: null as string | null,
      adultsOnly: null as boolean | null,
      googleRating: c.rating,
      googleReviewCount: c.reviewCount,
      googlePlaceId: c.placeId,
      seasonalNote: editorial?.seasonalNote || null,
      nearbyDining: null as string | null,
      dataConfidence: "medium",
      updatedAt: new Date().toISOString(),
    };

    results.push({
      property,
      photos: photoUrls,
      nearbyWineries: nearbyWineriesList.map((w) => ({
        wineryId: w.id,
        wineryName: w.name,
        distanceMiles: Math.round(w.distance * 10) / 10,
        driveMinutes: Math.round(w.distance * 2.5),
      })),
    });

    await sleep(DELAY_MS);
  }

  // ---- Output summary ----
  console.log(`\n=== Summary ===`);
  console.log(`Properties found: ${results.length}`);
  console.log(`Photos uploaded: ${photosUploaded}`);

  const inputCost = (totalInputTokens / 1_000_000) * 0.15;
  const outputCost = (totalOutputTokens / 1_000_000) * 0.6;
  console.log(`GPT tokens: ${totalInputTokens} in / ${totalOutputTokens} out`);
  console.log(`Estimated GPT cost: $${(inputCost + outputCost).toFixed(3)}`);

  // Print verification report
  console.log(`\n=== Verification Report ===`);
  for (const r of results) {
    const p = r.property;
    const confidence = p.googleRating >= 4.5 ? "HIGH" : "MEDIUM";
    const symbol = confidence === "HIGH" ? "✓" : "⚠";
    const details = [
      `${p.googleRating}★`,
      `${p.type}`,
      `${"$".repeat(p.priceTier)}`,
      `${r.photos.length} photos`,
      `${r.nearbyWineries.length} nearby wineries`,
      p.whyStayHere ? "has editorial" : "NO editorial",
    ].join(", ");
    console.log(`${symbol} ${p.name} — ${confidence} confidence (${details})`);
  }

  // Write preview JSON
  mkdirSync("data", { recursive: true });
  writeFileSync(
    "data/accommodations-preview.json",
    JSON.stringify(results, null, 2)
  );
  console.log(`\nPreview written to data/accommodations-preview.json`);

  // ---- Insert into DB if confirmed ----
  if (confirm) {
    console.log(`\n=== Inserting into database ===`);

    for (const r of results) {
      const p = r.property;

      // Check if already exists
      const existing = await db
        .select({ id: accommodations.id })
        .from(accommodations)
        .where(eq(accommodations.googlePlaceId, p.googlePlaceId))
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(accommodations)
          .set(p)
          .where(eq(accommodations.id, existing[0].id));
        console.log(`  Updated: ${p.name}`);

        // Update photos
        for (let pi = 0; pi < r.photos.length; pi++) {
          const photo = r.photos[pi];
          await db.insert(accommodationPhotos).values({
            accommodationId: existing[0].id,
            photoUrl: photo.photoUrl,
            blobUrl: photo.blobUrl,
            sortOrder: pi,
          });
        }

        // Update nearby wineries
        for (const nw of r.nearbyWineries) {
          await db
            .insert(accommodationNearbyWineries)
            .values({
              accommodationId: existing[0].id,
              wineryId: nw.wineryId,
              distanceMiles: nw.distanceMiles,
              driveMinutes: nw.driveMinutes,
            })
            .onConflictDoNothing();
        }
      } else {
        // Insert new
        const inserted = await db
          .insert(accommodations)
          .values(p)
          .returning({ id: accommodations.id });

        const accId = inserted[0].id;

        // Insert photos
        for (let pi = 0; pi < r.photos.length; pi++) {
          const photo = r.photos[pi];
          await db.insert(accommodationPhotos).values({
            accommodationId: accId,
            photoUrl: photo.photoUrl,
            blobUrl: photo.blobUrl,
            sortOrder: pi,
          });
        }

        // Insert nearby wineries
        for (const nw of r.nearbyWineries) {
          await db.insert(accommodationNearbyWineries).values({
            accommodationId: accId,
            wineryId: nw.wineryId,
            distanceMiles: nw.distanceMiles,
            driveMinutes: nw.driveMinutes,
          });
        }

        console.log(`  Inserted: ${p.name} (${r.photos.length} photos, ${r.nearbyWineries.length} nearby wineries)`);
      }
    }

    console.log(`\nDone! ${results.length} properties in database.`);
  } else {
    console.log(`\nReview the preview JSON, then re-run with --confirm to insert into DB.`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
