import "server-only";
import { db } from "@/db";
import {
  accommodations,
  accommodationNearbyWineries,
  subRegions,
} from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";

export interface TripNearbyAccommodation {
  id: number;
  slug: string;
  name: string;
  type: string;
  shortDescription: string | null;
  city: string | null;
  subRegion: string | null;
  subRegionSlug: string | null;
  valley: string;
  priceTier: number | null;
  heroImageUrl: string | null;
  thumbnailUrl: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  starRating: number | null;
  bookingUrl: string | null;
  websiteUrl: string | null;
  lat: number | null;
  lng: number | null;
  dogFriendly: boolean | null;
  adultsOnly: boolean | null;
  /** Closest stop distance in miles */
  closestDistanceMiles: number;
}

/**
 * Ranks accommodations within a reasonable radius of any trip stop.
 * Uses pre-computed `accommodationNearbyWineries` — no runtime haversine.
 * Sort: rating-first, closest distance tiebreak.
 */
export async function getAccommodationsForTripStops(
  wineryIds: number[],
  limit = 3,
  maxMiles = 20
): Promise<TripNearbyAccommodation[]> {
  if (wineryIds.length === 0) return [];

  const rows = await db
    .select({
      accommodationId: accommodationNearbyWineries.accommodationId,
      distanceMiles: accommodationNearbyWineries.distanceMiles,
    })
    .from(accommodationNearbyWineries)
    .where(
      inArray(accommodationNearbyWineries.wineryId, wineryIds)
    );

  const closestByAccommodation = new Map<number, number>();
  for (const r of rows) {
    if (r.distanceMiles == null) continue;
    const prev = closestByAccommodation.get(r.accommodationId);
    if (prev == null || r.distanceMiles < prev) {
      closestByAccommodation.set(r.accommodationId, r.distanceMiles);
    }
  }

  const eligibleIds = [...closestByAccommodation.entries()]
    .filter(([, d]) => d <= maxMiles)
    .map(([id]) => id);

  if (eligibleIds.length === 0) return [];

  // Defensive SELECT: avoids columns from pending migrations (starRating from
  // 0012, new itinerary cols from 0013) so the query runs even before those
  // migrations are applied locally. Star rating can be re-added once local is
  // caught up.
  const baseFields = {
    id: accommodations.id,
    slug: accommodations.slug,
    name: accommodations.name,
    type: accommodations.type,
    shortDescription: accommodations.shortDescription,
    city: accommodations.city,
    subRegion: subRegions.name,
    subRegionSlug: subRegions.slug,
    valley: accommodations.valley,
    priceTier: accommodations.priceTier,
    starRating: accommodations.starRating,
    heroImageUrl: accommodations.heroImageUrl,
    thumbnailUrl: accommodations.thumbnailUrl,
    googleRating: accommodations.googleRating,
    googleReviewCount: accommodations.googleReviewCount,
    bookingUrl: accommodations.bookingUrl,
    websiteUrl: accommodations.websiteUrl,
    lat: accommodations.lat,
    lng: accommodations.lng,
    dogFriendly: accommodations.dogFriendly,
    adultsOnly: accommodations.adultsOnly,
  };

  const accommodationRows = await db
    .select(baseFields)
    .from(accommodations)
    .leftJoin(subRegions, eq(accommodations.subRegionId, subRegions.id))
    .where(inArray(accommodations.id, eligibleIds));

  const withDistance: TripNearbyAccommodation[] = accommodationRows.map((row) => ({
    ...row,
    starRating: null,
    closestDistanceMiles: closestByAccommodation.get(row.id) ?? maxMiles,
  }));

  // Rating-first sort, distance tiebreak
  withDistance.sort((a, b) => {
    const ratingA = a.googleRating ?? 0;
    const ratingB = b.googleRating ?? 0;
    if (Math.abs(ratingA - ratingB) > 0.1) return ratingB - ratingA;
    return a.closestDistanceMiles - b.closestDistanceMiles;
  });

  return withDistance.slice(0, limit);
}
