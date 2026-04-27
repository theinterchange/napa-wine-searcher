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
  /** Editorial "why stay here" sentence — hand-authored, used in Top 3 picks. */
  whyStayHere: string | null;
  /** Short tag-like line ("Couples and honeymoons", "Families", etc.) */
  bestFor: string | null;
  /** Longer editorial prose surfaced in the preview drawer. */
  theSetting: string | null;
  theExperience: string | null;
  /** JSON array of amenity labels for drawer chips. */
  amenitiesJson: string | null;
  highlightTags: string | null;
  city: string | null;
  subRegion: string | null;
  subRegionSlug: string | null;
  valley: string;
  priceTier: number | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
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
  kidFriendly: boolean | null;
  sustainable: boolean | null;
  adultsOnly: boolean | null;
  /** Closest stop distance in miles — kept for back-compat, prefer avg. */
  closestDistanceMiles: number;
  /** Average distance from this hotel to every trip stop (miles). Lower = more central home base. */
  averageDistanceMiles: number;
  /** Max distance from this hotel to any trip stop (miles). Worst-case drive from any one leg. */
  maxDistanceMiles: number;
}

/**
 * Ranks accommodations that work as a home base for the trip.
 *
 * Eligibility: hotel must be within the junction radius (15 mi) of at
 * least ONE stop. Stops outside the junction are treated as `MISSING_PENALTY_MILES`
 * (20 mi) when computing averages — keeps spread-out trips workable
 * (Windsor + Sonoma in one trip spans ~25mi; no single hotel is central
 * but we should still surface the closest options) while penalizing
 * hotels that aren't actually central.
 *
 * Ranking: average distance to ALL stops (lower = more central home base).
 *
 * Uses pre-computed `accommodationNearbyWineries` — no runtime haversine.
 */
const MISSING_PENALTY_MILES = 20;

export async function getAccommodationsForTripStops(
  wineryIds: number[],
  limit = 3,
  // Hotels with min-distance (any stop) > maxMiles are excluded entirely.
  maxMiles = 15
): Promise<TripNearbyAccommodation[]> {
  if (wineryIds.length === 0) return [];

  const rows = await db
    .select({
      accommodationId: accommodationNearbyWineries.accommodationId,
      wineryId: accommodationNearbyWineries.wineryId,
      distanceMiles: accommodationNearbyWineries.distanceMiles,
    })
    .from(accommodationNearbyWineries)
    .where(
      inArray(accommodationNearbyWineries.wineryId, wineryIds)
    );

  // Collect per-hotel distance to each stop present in the junction.
  const distancesByHotel = new Map<number, Map<number, number>>();
  for (const r of rows) {
    if (r.distanceMiles == null) continue;
    let perStop = distancesByHotel.get(r.accommodationId);
    if (!perStop) {
      perStop = new Map();
      distancesByHotel.set(r.accommodationId, perStop);
    }
    perStop.set(r.wineryId, r.distanceMiles);
  }

  type Stats = {
    avg: number;
    max: number;
    min: number;
    inRangeStops: number;
  };
  const statsByHotel = new Map<number, Stats>();
  for (const [hotelId, perStop] of distancesByHotel) {
    if (perStop.size === 0) continue;
    const ds = wineryIds.map((id) => perStop.get(id) ?? MISSING_PENALTY_MILES);
    const known = wineryIds
      .map((id) => perStop.get(id))
      .filter((d): d is number => typeof d === "number");
    const min = Math.min(...known);
    if (min > maxMiles) continue; // hotel isn't actually near any stop
    const sum = ds.reduce((s, n) => s + n, 0);
    statsByHotel.set(hotelId, {
      avg: sum / ds.length,
      max: Math.max(...ds),
      min,
      inRangeStops: perStop.size,
    });
  }

  const eligibleIds = [...statsByHotel.keys()];

  if (eligibleIds.length === 0) return [];

  const baseFields = {
    id: accommodations.id,
    slug: accommodations.slug,
    name: accommodations.name,
    type: accommodations.type,
    shortDescription: accommodations.shortDescription,
    whyStayHere: accommodations.whyStayHere,
    bestFor: accommodations.bestFor,
    theSetting: accommodations.theSetting,
    theExperience: accommodations.theExperience,
    amenitiesJson: accommodations.amenitiesJson,
    highlightTags: accommodations.highlightTags,
    city: accommodations.city,
    subRegion: subRegions.name,
    subRegionSlug: subRegions.slug,
    valley: accommodations.valley,
    priceTier: accommodations.priceTier,
    priceRangeMin: accommodations.priceRangeMin,
    priceRangeMax: accommodations.priceRangeMax,
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
    kidFriendly: accommodations.kidFriendly,
    sustainable: accommodations.sustainable,
    adultsOnly: accommodations.adultsOnly,
  };

  const accommodationRows = await db
    .select(baseFields)
    .from(accommodations)
    .leftJoin(subRegions, eq(accommodations.subRegionId, subRegions.id))
    .where(inArray(accommodations.id, eligibleIds));

  const withDistance: TripNearbyAccommodation[] = accommodationRows.map((row) => {
    const stats = statsByHotel.get(row.id);
    return {
      ...row,
      closestDistanceMiles: stats?.min ?? maxMiles,
      averageDistanceMiles: stats?.avg ?? maxMiles,
      maxDistanceMiles: stats?.max ?? maxMiles,
    };
  });

  // Centrality-first sort (lower avg = more central home base), rating tiebreak.
  // Picker consumers layer their own scoring (dog/kid match, etc.) on top.
  withDistance.sort((a, b) => {
    const avgDelta = a.averageDistanceMiles - b.averageDistanceMiles;
    if (Math.abs(avgDelta) > 1) return avgDelta;
    const ratingDelta = (b.googleRating ?? 0) - (a.googleRating ?? 0);
    if (Math.abs(ratingDelta) > 0.05) return ratingDelta;
    return a.averageDistanceMiles - b.averageDistanceMiles;
  });

  return withDistance.slice(0, limit);
}
