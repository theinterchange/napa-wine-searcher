/**
 * Write scraped data to the database using Drizzle ORM.
 * Upserts wineries, replaces wines and tastings.
 */

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import {
  wineries,
  wines,
  wineTypes,
  tastingExperiences,
  subRegions,
  scrapeLog,
  wineryPhotos,
} from "../../db/schema";
import type { WineryTarget, WineryExtractionResult } from "../types";
import type { ValidationResult } from "./validate";
import { createHash } from "crypto";

// Create a standalone DB connection for the scraper
const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const db = drizzle(client);

// Cache for wine type ID lookups
let wineTypeMap: Map<string, number> | null = null;
// Cache for sub-region slug → ID
let subRegionMap: Map<string, number> | null = null;

async function getWineTypeMap(): Promise<Map<string, number>> {
  if (!wineTypeMap) {
    const types = await db.select().from(wineTypes);
    wineTypeMap = new Map(types.map((t) => [t.name, t.id]));
  }
  return wineTypeMap;
}

async function getSubRegionMap(): Promise<Map<string, number>> {
  if (!subRegionMap) {
    const regions = await db.select().from(subRegions);
    subRegionMap = new Map(regions.map((r) => [r.slug, r.id]));
  }
  return subRegionMap;
}

export async function upsertWinery(
  target: WineryTarget,
  extraction: WineryExtractionResult,
  validation: ValidationResult
): Promise<{ wineryId: number; status: string }> {
  const regionMap = await getSubRegionMap();
  const typeMap = await getWineTypeMap();

  const subRegionId = target.subRegion
    ? regionMap.get(target.subRegion) || null
    : null;

  const now = new Date().toISOString();

  // Check if winery already exists
  const existing = await db
    .select({ id: wineries.id })
    .from(wineries)
    .where(eq(wineries.slug, target.slug))
    .limit(1);

  let wineryId: number;

  const wineryData = {
    slug: target.slug,
    name: target.name,
    subRegionId,
    description: extraction.info.description,
    shortDescription: extraction.info.shortDescription,
    address: target.address,
    city: target.city,
    state: "CA" as const,
    lat: target.lat,
    lng: target.lng,
    phone: extraction.info.phone || target.phone,
    email: extraction.info.email,
    websiteUrl: target.websiteUrl,
    hoursJson: extraction.info.hours
      ? JSON.stringify(extraction.info.hours)
      : null,
    reservationRequired: extraction.info.reservationRequired,
    dogFriendly: extraction.info.dogFriendly,
    picnicFriendly: extraction.info.picnicFriendly,
    googlePlaceId: target.googlePlaceId,
    googleReviewCount: target.googleReviewCount,
    googleRating: target.googleRating,
    aggregateRating: target.googleRating,
    totalRatings: target.googleReviewCount,
    dataSource: "scraped" as const,
    lastScrapedAt: now,
    updatedAt: now,
  };

  if (existing.length > 0) {
    wineryId = existing[0].id;
    await db
      .update(wineries)
      .set(wineryData)
      .where(eq(wineries.id, wineryId));
  } else {
    const result = await db
      .insert(wineries)
      .values(wineryData)
      .returning({ id: wineries.id });
    wineryId = result[0].id;
  }

  // Only replace wines if the new scrape actually found wines
  if (validation.cleanedWines.length > 0) {
    await db.delete(wines).where(eq(wines.wineryId, wineryId));
    for (const wine of validation.cleanedWines) {
      const wineTypeId = typeMap.get(wine.wineType) || null;
      await db.insert(wines).values({
        wineryId,
        wineTypeId,
        name: wine.name,
        vintage: wine.vintage,
        price: wine.price,
        description: wine.description,
        sourceUrl: extraction.sourceUrls.wines,
        updatedAt: now,
      });
    }
  }

  // Only replace tastings if the new scrape actually found tastings
  if (validation.cleanedTastings.length > 0) {
    await db.delete(tastingExperiences).where(eq(tastingExperiences.wineryId, wineryId));
    for (const tasting of validation.cleanedTastings) {
      await db.insert(tastingExperiences).values({
        wineryId,
        name: tasting.name,
        description: tasting.description,
        price: tasting.price,
        durationMinutes: tasting.durationMinutes,
        reservationRequired: tasting.reservationRequired,
        sourceUrl: extraction.sourceUrls.tastings,
        updatedAt: now,
      });
    }
  }

  // Log the scrape
  const contentHash = createHash("sha256")
    .update(JSON.stringify({ wines: validation.cleanedWines, tastings: validation.cleanedTastings }))
    .digest("hex");

  await db.insert(scrapeLog).values({
    wineryId,
    scrapedAt: now,
    status: extraction.status,
    winesFound: validation.cleanedWines.length,
    tastingsFound: validation.cleanedTastings.length,
    contentHash,
    errorMessage:
      extraction.errors.length > 0 ? extraction.errors.join("; ") : null,
  });

  return {
    wineryId,
    status: `OK: ${validation.cleanedWines.length} wines, ${validation.cleanedTastings.length} tastings`,
  };
}

export async function insertWineryPhotos(
  wineryId: number,
  photoUrls: string[],
  source: "google_places" | "website"
): Promise<void> {
  for (const url of photoUrls) {
    await db.insert(wineryPhotos).values({
      wineryId,
      url,
      source,
    });
  }
}

export async function removeNonTargetWineries(
  targetSlugs: Set<string>
): Promise<number> {
  const allWineries = await db.select({ id: wineries.id, slug: wineries.slug }).from(wineries);
  let removed = 0;

  for (const w of allWineries) {
    if (!targetSlugs.has(w.slug)) {
      // Delete wines, tastings, photos, scrape logs, then winery
      await db.delete(wines).where(eq(wines.wineryId, w.id));
      await db.delete(tastingExperiences).where(eq(tastingExperiences.wineryId, w.id));
      await db.delete(wineryPhotos).where(eq(wineryPhotos.wineryId, w.id));
      await db.delete(scrapeLog).where(eq(scrapeLog.wineryId, w.id));
      await db.delete(wineries).where(eq(wineries.id, w.id));
      removed++;
    }
  }

  return removed;
}
