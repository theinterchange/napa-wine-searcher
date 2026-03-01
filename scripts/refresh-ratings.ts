import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries } from "../src/db/schema";
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

const DELAY_MS = 200;
const DRY_RUN = process.argv.includes("--dry-run");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getRating(placeId: string): Promise<{ rating: number | null; reviewCount: number | null }> {
  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=rating,userRatingCount&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  Failed to get place details: ${res.status} ${res.statusText}`);
    return { rating: null, reviewCount: null };
  }
  const data = await res.json();
  return {
    rating: data.rating ?? null,
    reviewCount: data.userRatingCount ?? null,
  };
}

async function main() {
  if (DRY_RUN) {
    console.log("=== DRY RUN — no changes will be written ===\n");
  }

  const allWineries = await db
    .select({
      id: wineries.id,
      name: wineries.name,
      googlePlaceId: wineries.googlePlaceId,
      aggregateRating: wineries.aggregateRating,
      totalRatings: wineries.totalRatings,
      googleRating: wineries.googleRating,
      googleReviewCount: wineries.googleReviewCount,
    })
    .from(wineries)
    .where(isNotNull(wineries.googlePlaceId));

  console.log(`Found ${allWineries.length} wineries with Google Place IDs\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < allWineries.length; i++) {
    const winery = allWineries[i];
    const placeId = winery.googlePlaceId!;
    console.log(`[${i + 1}/${allWineries.length}] ${winery.name}`);

    const { rating, reviewCount } = await getRating(placeId);

    if (rating === null && reviewCount === null) {
      console.log("  No rating data returned, skipping");
      errors++;
      await sleep(DELAY_MS);
      continue;
    }

    const oldRating = winery.aggregateRating ?? winery.googleRating;
    const oldCount = winery.totalRatings ?? winery.googleReviewCount;

    console.log(`  Rating: ${oldRating ?? "null"} → ${rating ?? "null"}`);
    console.log(`  Reviews: ${oldCount ?? "null"} → ${reviewCount ?? "null"}`);

    if (!DRY_RUN) {
      await db
        .update(wineries)
        .set({
          aggregateRating: rating,
          totalRatings: reviewCount,
          googleRating: rating,
          googleReviewCount: reviewCount,
        })
        .where(eq(wineries.id, winery.id));
    }

    updated++;
    await sleep(DELAY_MS);
  }

  console.log(`\nDone! Updated: ${updated}, Skipped/errors: ${errors}, Total: ${allWineries.length}`);
  if (DRY_RUN) {
    console.log("(Dry run — no changes were written)");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
