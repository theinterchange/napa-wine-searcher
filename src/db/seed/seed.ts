import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import * as schema from "../schema";
import subRegionsData from "./data/sub-regions.json";
import wineTypesData from "./data/wine-types.json";
import wineriesData from "./data/wineries.json";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
});

const db = drizzle(client, { schema });

interface WineryData {
  name: string;
  slug: string;
  subRegionSlug: string;
  description: string;
  shortDescription: string;
  address: string;
  city: string;
  zip: string;
  lat: number;
  lng: number;
  phone: string;
  websiteUrl: string;
  hoursJson: string;
  reservationRequired: boolean;
  dogFriendly: boolean;
  picnicFriendly: boolean;
  priceLevel: number;
  curated: boolean;
  curatedAt: string | null;
  wines: {
    name: string;
    wineType: string;
    vintage: number;
    price: number;
    description: string;
    rating: number;
    ratingSource: string;
    ratingCount: number;
  }[];
  tastings: {
    name: string;
    description: string;
    price: number;
    durationMinutes: number;
    includes: string;
    reservationRequired: boolean;
    minGroupSize: number;
    maxGroupSize: number;
  }[];
  ratings: {
    provider: string;
    score: number;
    maxScore: number;
    reviewCount: number;
  }[];
}

async function seed() {
  console.log("Seeding database...");

  // Sub-regions
  console.log("Inserting sub-regions...");
  for (const region of subRegionsData) {
    await db.insert(schema.subRegions).values(region as typeof region & { valley: "napa" | "sonoma" }).onConflictDoNothing();
  }

  // Wine types
  console.log("Inserting wine types...");
  for (const wt of wineTypesData) {
    await db
      .insert(schema.wineTypes)
      .values(wt as { name: string; category: "red" | "white" | "rosé" | "sparkling" | "dessert" })
      .onConflictDoNothing();
  }

  // Fetch lookups
  const allSubRegions = await db.select().from(schema.subRegions);
  const allWineTypes = await db.select().from(schema.wineTypes);

  const regionMap = new Map(allSubRegions.map((r) => [r.slug, r.id]));
  const wineTypeMap = new Map(allWineTypes.map((wt) => [wt.name, wt.id]));

  // Wineries
  console.log(`Inserting ${(wineriesData as WineryData[]).length} wineries...`);
  for (const w of wineriesData as WineryData[]) {
    const subRegionId = regionMap.get(w.subRegionSlug);
    if (!subRegionId) {
      console.warn(`Sub-region not found: ${w.subRegionSlug} for ${w.name}`);
      continue;
    }

    // Calculate aggregate rating from winery ratings
    const avgRating =
      w.ratings.length > 0
        ? w.ratings.reduce((sum, r) => sum + (r.score / r.maxScore) * 5, 0) /
          w.ratings.length
        : null;
    const totalReviews = w.ratings.reduce((sum, r) => sum + r.reviewCount, 0);

    const [inserted] = await db
      .insert(schema.wineries)
      .values({
        slug: w.slug,
        name: w.name,
        subRegionId,
        description: w.description,
        shortDescription: w.shortDescription,
        address: w.address,
        city: w.city,
        state: "CA",
        zip: w.zip,
        lat: w.lat,
        lng: w.lng,
        phone: w.phone,
        websiteUrl: w.websiteUrl,
        hoursJson: w.hoursJson,
        reservationRequired: w.reservationRequired,
        dogFriendly: w.dogFriendly,
        picnicFriendly: w.picnicFriendly,
        priceLevel: w.priceLevel,
        aggregateRating: avgRating,
        totalRatings: totalReviews,
        curated: w.curated ?? false,
        curatedAt: w.curatedAt ?? null,
      })
      .onConflictDoNothing()
      .returning({ id: schema.wineries.id });

    if (!inserted) continue;
    const wineryId = inserted.id;

    // Wines
    for (const wine of w.wines) {
      const wineTypeId = wineTypeMap.get(wine.wineType);
      await db.insert(schema.wines).values({
        wineryId,
        wineTypeId: wineTypeId || null,
        name: wine.name,
        vintage: wine.vintage,
        price: wine.price,
        description: wine.description,
        rating: wine.rating,
        ratingSource: wine.ratingSource,
        ratingCount: wine.ratingCount,
      });
    }

    // Tastings
    for (const tasting of w.tastings) {
      await db.insert(schema.tastingExperiences).values({
        wineryId,
        name: tasting.name,
        description: tasting.description,
        price: tasting.price,
        durationMinutes: tasting.durationMinutes,
        includes: tasting.includes,
        reservationRequired: tasting.reservationRequired,
        minGroupSize: tasting.minGroupSize,
        maxGroupSize: tasting.maxGroupSize,
      });
    }

    // Winery ratings
    for (const rating of w.ratings) {
      await db.insert(schema.wineryRatings).values({
        wineryId,
        provider: rating.provider,
        score: rating.score,
        maxScore: rating.maxScore,
        reviewCount: rating.reviewCount,
        fetchedAt: new Date().toISOString(),
      });
    }
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
