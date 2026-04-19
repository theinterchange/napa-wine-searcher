import { db } from "@/db";
import {
  accommodations,
  accommodationPhotos,
  accommodationNearbyWineries,
  wineries,
  subRegions,
} from "@/db/schema";
import { eq, desc, asc, and, sql } from "drizzle-orm";

export interface AccommodationCard {
  slug: string;
  name: string;
  type: string;
  shortDescription: string | null;
  city: string | null;
  subRegion: string | null;
  subRegionSlug: string | null;
  valley: string;
  priceTier: number | null;
  starRating: number | null;
  heroImageUrl: string | null;
  thumbnailUrl: string | null;
  bestFor: string | null;
  bestForTags: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  dogFriendly: boolean | null;
  dogFriendlyNote: string | null;
  kidFriendly: boolean | null;
  kidFriendlyNote: string | null;
  adultsOnly: boolean | null;
  // Booking fields — enable inline Stay22 booking CTAs on cards
  bookingUrl: string | null;
  websiteUrl: string | null;
  lat: number | null;
  lng: number | null;
}

export interface AccommodationDetail extends AccommodationCard {
  id: number;
  description: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  websiteUrl: string | null;
  bookingUrl: string | null;
  bookingProvider: string | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  amenitiesJson: string | null;
  wineFeatures: string | null;
  whyStayHere: string | null;
  theSetting: string | null;
  theExperience: string | null;
  beforeYouBook: string | null;
  whyThisHotel: string | null;
  highlightTags: string | null;
  dogFriendlyNote: string | null;
  dogFriendlySource: string | null;
  kidFriendlyNote: string | null;
  kidFriendlySource: string | null;
  roomsJson: string | null;
  diningJson: string | null;
  spaJson: string | null;
  activitiesJson: string | null;
  childrenAmenitiesJson: string | null;
  updatedAt: string | null;
}

export interface AccommodationPhoto {
  id: number;
  url: string;
  caption: string | null;
  category: string | null;
}

export interface NearbyWinery {
  id: number;
  slug: string;
  name: string;
  shortDescription: string | null;
  city: string | null;
  subRegion: string | null;
  subRegionSlug: string | null;
  valley: string | null;
  priceLevel: number | null;
  aggregateRating: number | null;
  totalRatings: number | null;
  reservationRequired: boolean | null;
  dogFriendly: boolean | null;
  picnicFriendly: boolean | null;
  kidFriendly: boolean | null;
  kidFriendlyConfidence: string | null;
  curated: boolean | null;
  heroImageUrl: string | null;
  distanceMiles: number | null;
  driveMinutes: number | null;
}

const cardFields = {
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
  bestFor: accommodations.bestFor,
  bestForTags: accommodations.bestForTags,
  googleRating: accommodations.googleRating,
  googleReviewCount: accommodations.googleReviewCount,
  dogFriendly: accommodations.dogFriendly,
  dogFriendlyNote: accommodations.dogFriendlyNote,
  kidFriendly: accommodations.kidFriendly,
  kidFriendlyNote: accommodations.kidFriendlyNote,
  adultsOnly: accommodations.adultsOnly,
  bookingUrl: accommodations.bookingUrl,
  websiteUrl: accommodations.websiteUrl,
  lat: accommodations.lat,
  lng: accommodations.lng,
};

// Ranking: log10(reviews) × 30 + rating × 40 + priceTier × 15
// Balances popularity, quality, and luxury (affiliate revenue)
const rankingScore = sql`(
  (CASE WHEN ${accommodations.googleReviewCount} > 0
    THEN log(${accommodations.googleReviewCount} + 1) / log(10) * 30
    ELSE 0 END)
  + COALESCE(${accommodations.googleRating}, 0) * 40
  + COALESCE(${accommodations.priceTier}, 2) * 15
)`;

export async function getAllAccommodations(
  valley?: "napa" | "sonoma"
): Promise<AccommodationCard[]> {
  let query = db
    .select(cardFields)
    .from(accommodations)
    .leftJoin(subRegions, eq(accommodations.subRegionId, subRegions.id))
    .orderBy(sql`${rankingScore} DESC`);

  if (valley) {
    return query.where(eq(accommodations.valley, valley));
  }

  return query;
}

export async function getAccommodationBySlug(
  slug: string
): Promise<AccommodationDetail | null> {
  const rows = await db
    .select({
      id: accommodations.id,
      slug: accommodations.slug,
      name: accommodations.name,
      type: accommodations.type,
      description: accommodations.description,
      shortDescription: accommodations.shortDescription,
      city: accommodations.city,
      subRegion: subRegions.name,
      subRegionSlug: subRegions.slug,
      valley: accommodations.valley,
      address: accommodations.address,
      lat: accommodations.lat,
      lng: accommodations.lng,
      phone: accommodations.phone,
      websiteUrl: accommodations.websiteUrl,
      bookingUrl: accommodations.bookingUrl,
      bookingProvider: accommodations.bookingProvider,
      priceTier: accommodations.priceTier,
      starRating: accommodations.starRating,
      priceRangeMin: accommodations.priceRangeMin,
      priceRangeMax: accommodations.priceRangeMax,
      amenitiesJson: accommodations.amenitiesJson,
      wineFeatures: accommodations.wineFeatures,
      whyStayHere: accommodations.whyStayHere,
      theSetting: accommodations.theSetting,
      theExperience: accommodations.theExperience,
      beforeYouBook: accommodations.beforeYouBook,
      whyThisHotel: accommodations.whyThisHotel,
      highlightTags: accommodations.highlightTags,
      bestFor: accommodations.bestFor,
      bestForTags: accommodations.bestForTags,
      googleRating: accommodations.googleRating,
      googleReviewCount: accommodations.googleReviewCount,
      dogFriendly: accommodations.dogFriendly,
      dogFriendlyNote: accommodations.dogFriendlyNote,
      dogFriendlySource: accommodations.dogFriendlySource,
      kidFriendly: accommodations.kidFriendly,
      kidFriendlyNote: accommodations.kidFriendlyNote,
      kidFriendlySource: accommodations.kidFriendlySource,
      adultsOnly: accommodations.adultsOnly,
      roomsJson: accommodations.roomsJson,
      diningJson: accommodations.diningJson,
      spaJson: accommodations.spaJson,
      activitiesJson: accommodations.activitiesJson,
      childrenAmenitiesJson: accommodations.childrenAmenitiesJson,
      heroImageUrl: accommodations.heroImageUrl,
      thumbnailUrl: accommodations.thumbnailUrl,
      updatedAt: accommodations.updatedAt,
    })
    .from(accommodations)
    .leftJoin(subRegions, eq(accommodations.subRegionId, subRegions.id))
    .where(eq(accommodations.slug, slug))
    .limit(1);

  return rows[0] ?? null;
}

export async function getAccommodationPhotos(
  accommodationId: number
): Promise<AccommodationPhoto[]> {
  const rows = await db
    .select({
      id: accommodationPhotos.id,
      photoUrl: accommodationPhotos.photoUrl,
      blobUrl: accommodationPhotos.blobUrl,
      caption: accommodationPhotos.caption,
      category: accommodationPhotos.category,
    })
    .from(accommodationPhotos)
    .where(eq(accommodationPhotos.accommodationId, accommodationId))
    .orderBy(asc(accommodationPhotos.sortOrder));

  return rows.map((r) => ({
    id: r.id,
    url: r.blobUrl || r.photoUrl || "",
    caption: r.caption,
    category: r.category,
  }));
}

export async function getNearbyWineries(
  accommodationId: number
): Promise<NearbyWinery[]> {
  return db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      shortDescription: wineries.shortDescription,
      city: wineries.city,
      subRegion: subRegions.name,
      subRegionSlug: subRegions.slug,
      valley: subRegions.valley,
      priceLevel: wineries.priceLevel,
      aggregateRating: wineries.aggregateRating,
      totalRatings: wineries.totalRatings,
      reservationRequired: wineries.reservationRequired,
      dogFriendly: wineries.dogFriendly,
      picnicFriendly: wineries.picnicFriendly,
      kidFriendly: wineries.kidFriendly,
      kidFriendlyConfidence: wineries.kidFriendlyConfidence,
      curated: wineries.curated,
      heroImageUrl: wineries.heroImageUrl,
      distanceMiles: accommodationNearbyWineries.distanceMiles,
      driveMinutes: accommodationNearbyWineries.driveMinutes,
    })
    .from(accommodationNearbyWineries)
    .innerJoin(wineries, eq(accommodationNearbyWineries.wineryId, wineries.id))
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(eq(accommodationNearbyWineries.accommodationId, accommodationId))
    .orderBy(asc(accommodationNearbyWineries.distanceMiles));
}

export async function getAccommodationsForRegion(
  subRegionId: number,
  limit = 3
): Promise<AccommodationCard[]> {
  return db
    .select(cardFields)
    .from(accommodations)
    .leftJoin(subRegions, eq(accommodations.subRegionId, subRegions.id))
    .where(eq(accommodations.subRegionId, subRegionId))
    .orderBy(sql`${rankingScore} DESC`)
    .limit(limit);
}

export async function getAccommodationsNearWinery(
  wineryId: number,
  limit = 2
): Promise<(AccommodationCard & { distanceMiles: number | null })[]> {
  return db
    .select({
      ...cardFields,
      distanceMiles: accommodationNearbyWineries.distanceMiles,
    })
    .from(accommodationNearbyWineries)
    .innerJoin(
      accommodations,
      eq(accommodationNearbyWineries.accommodationId, accommodations.id)
    )
    .leftJoin(subRegions, eq(accommodations.subRegionId, subRegions.id))
    .where(eq(accommodationNearbyWineries.wineryId, wineryId))
    .orderBy(asc(accommodationNearbyWineries.distanceMiles))
    .limit(limit);
}

/**
 * Rank candidate accommodations by similarity to a reference property.
 * Pure function — operates on already-fetched cards, no DB hit.
 *
 * Scoring philosophy: price tier and amenities trump pure geography. A luxury
 * shopper should see luxury peers elsewhere before mid-tier peers next door;
 * a dog-friendly booking should surface other dog-welcome stays first.
 *
 * Signals:
 *   +5  same subRegion (town-level geographic match)
 *   +2  same type (hotel vs. B&B vs. inn)
 *   +6  starRating exact match (quality tier — replaces priceTier)
 *   +2  starRating within ±1
 *   -3  starRating diff of 2 (penalty — different quality tier)
 *   -5  starRating diff of 3+ (penalty — very different quality tier)
 *   +4  both dogFriendly
 *   +4  both kidFriendly
 *   +5  both adultsOnly (strong product differentiator)
 *
 * Candidates are filtered to same valley only (cross-valley isn't "related").
 * Ties broken by the order of the input array — pass already ranking-sorted.
 */
export function getRelatedAccommodations(
  reference: Pick<
    AccommodationCard,
    | "slug"
    | "valley"
    | "subRegionSlug"
    | "type"
    | "starRating"
    | "dogFriendly"
    | "kidFriendly"
    | "adultsOnly"
  >,
  candidates: AccommodationCard[],
  limit = 6
): AccommodationCard[] {
  const scored = candidates
    .filter((c) => c.slug !== reference.slug && c.valley === reference.valley)
    .map((c, idx) => {
      let score = 0;
      if (c.subRegionSlug && c.subRegionSlug === reference.subRegionSlug) score += 5;
      if (c.type === reference.type) score += 2;
      if (c.starRating != null && reference.starRating != null) {
        const diff = Math.abs(c.starRating - reference.starRating);
        if (diff === 0) score += 6;
        else if (diff === 1) score += 2;
        else if (diff === 2) score -= 3;
        else if (diff >= 3) score -= 5;
      }
      if (c.dogFriendly === true && reference.dogFriendly === true) score += 4;
      if (c.kidFriendly === true && reference.kidFriendly === true) score += 4;
      if (c.adultsOnly === true && reference.adultsOnly === true) score += 5;
      return { c, score, idx };
    })
    .sort((a, b) => b.score - a.score || a.idx - b.idx);

  return scored.slice(0, limit).map((s) => s.c);
}
