/**
 * Data layer for SEO category landing pages (dog-friendly, kid-friendly,
 * sustainable wineries; dog-friendly / family-friendly hotels).
 *
 * Single source of truth for all category routes. Page files stay thin —
 * everything DB-shaped lives here.
 */
import { db } from "@/db";
import {
  wineries,
  subRegions,
  accommodations,
} from "@/db/schema";
import { and, count, eq, max, sql, desc } from "drizzle-orm";
import { wineryRankingScore } from "@/lib/winery-ranking";

export type WineryAmenity = "dog" | "kid" | "sustainable";
export type Valley = "napa" | "sonoma";

export type CategoryScope =
  | { kind: "hub" }
  | { kind: "valley"; valley: Valley }
  | { kind: "subregion"; subRegionSlug: string };

export interface QualifyingSubregion {
  slug: string;
  name: string;
  valley: Valley;
  count: number;
}

/** Map an amenity key to the boolean column on the wineries table. */
function wineryAmenityColumn(amenity: WineryAmenity) {
  switch (amenity) {
    case "dog":
      return wineries.dogFriendly;
    case "kid":
      return wineries.kidFriendly;
    case "sustainable":
      return wineries.sustainableFarming;
  }
}

/** Build the WHERE conditions for a (amenity, scope) pair. */
function buildWineryConditions(amenity: WineryAmenity, scope: CategoryScope) {
  const amenityCol = wineryAmenityColumn(amenity);
  const conditions = [eq(amenityCol, true)];

  if (scope.kind === "valley") {
    conditions.push(eq(subRegions.valley, scope.valley));
  } else if (scope.kind === "subregion") {
    conditions.push(eq(subRegions.slug, scope.subRegionSlug));
  }

  return and(...conditions);
}

/**
 * Fetch all wineries matching an amenity within a scope, ordered by ranking
 * score then rating. Returns the same field shape WineryCard expects, plus
 * the amenity-specific note + source for citation pills.
 */
export async function getCategoryWineries(
  amenity: WineryAmenity,
  scope: CategoryScope
) {
  const where = buildWineryConditions(amenity, scope);

  const results = await db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      shortDescription: wineries.shortDescription,
      city: wineries.city,
      priceLevel: wineries.priceLevel,
      aggregateRating: wineries.aggregateRating,
      totalRatings: wineries.totalRatings,
      reservationRequired: wineries.reservationRequired,
      dogFriendly: wineries.dogFriendly,
      dogFriendlyNote: wineries.dogFriendlyNote,
      dogFriendlySource: wineries.dogFriendlySource,
      picnicFriendly: wineries.picnicFriendly,
      kidFriendly: wineries.kidFriendly,
      kidFriendlyNote: wineries.kidFriendlyNote,
      kidFriendlySource: wineries.kidFriendlySource,
      kidFriendlyConfidence: wineries.kidFriendlyConfidence,
      tastingPriceMin: wineries.tastingPriceMin,
      sustainableFarming: wineries.sustainableFarming,
      sustainableNote: wineries.sustainableNote,
      sustainableSource: wineries.sustainableSource,
      heroImageUrl: wineries.heroImageUrl,
      curated: wineries.curated,
      curatedAt: wineries.curatedAt,
      subRegion: subRegions.name,
      subRegionSlug: subRegions.slug,
      valley: subRegions.valley,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(where)
    .orderBy(sql`${wineryRankingScore} DESC`);

  return results;
}

/**
 * Subregions with at least `threshold` confirmed-yes wineries for the given
 * amenity. Used to gate spoke pages so we don't ship thin content.
 *
 * Threshold lowered from 5→4 on 2026-04-11 specifically to admit Stags Leap
 * District. Stags Leap has 11 total wineries (all iconic Napa cabernet
 * producers) but only 4 confirmed dog-friendly, with 5 more NULL pending
 * verification. The AVA is iconic enough that visitors search for it by
 * name — punishing it with a 404 because policy data is incomplete on a
 * handful of estates would be the wrong call. Threshold 4 only admits Stags
 * Leap; the next-highest unqualified subregions sit at 3.
 */
export async function getQualifyingSubregions(
  amenity: WineryAmenity,
  threshold = 4
): Promise<QualifyingSubregion[]> {
  const amenityCol = wineryAmenityColumn(amenity);

  const results = await db
    .select({
      slug: subRegions.slug,
      name: subRegions.name,
      valley: subRegions.valley,
      count: count(wineries.id),
    })
    .from(subRegions)
    .innerJoin(wineries, eq(wineries.subRegionId, subRegions.id))
    .where(eq(amenityCol, true))
    .groupBy(subRegions.id)
    .having(sql`count(${wineries.id}) >= ${threshold}`)
    .orderBy(desc(count(wineries.id)));

  return results.map((r) => ({
    slug: r.slug,
    name: r.name,
    valley: r.valley as Valley,
    count: Number(r.count),
  }));
}

/** Most recent curatedAt across the matching wineries — used by sitemap. */
export async function getLastVerifiedDate(
  amenity: WineryAmenity,
  scope: CategoryScope
): Promise<Date | null> {
  const where = buildWineryConditions(amenity, scope);
  const [row] = await db
    .select({ latest: max(wineries.curatedAt) })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(where);
  return row?.latest ? new Date(row.latest) : null;
}

/**
 * Nearby accommodations for the "Where to stay" module on category pages.
 *
 * Semantics differ by amenity:
 * - "dog": opt-in filter — only accommodations with dog_friendly = true
 * - "kid": default-inclusive — everything EXCEPT adults_only properties
 *   (accommodations are assumed family-welcoming unless explicitly marked
 *   adults-only; see Michael's guidance 2026-04-12)
 * - "sustainable": column does not exist yet, returns empty array
 */
export async function getCategoryAccommodations(
  amenity: WineryAmenity,
  valley: Valley | null,
  limit = 4
) {
  if (amenity === "sustainable") return [];

  const conditions = [];
  if (amenity === "dog") {
    conditions.push(eq(accommodations.dogFriendly, true));
  } else {
    // kid: exclude only adults_only properties
    conditions.push(sql`${accommodations.adultsOnly} IS NOT TRUE`);
  }
  if (valley) conditions.push(eq(accommodations.valley, valley));

  const rows = await db
    .select({
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
      kidFriendly: accommodations.kidFriendly,
      adultsOnly: accommodations.adultsOnly,
      bookingUrl: accommodations.bookingUrl,
      websiteUrl: accommodations.websiteUrl,
      lat: accommodations.lat,
      lng: accommodations.lng,
    })
    .from(accommodations)
    .leftJoin(subRegions, eq(accommodations.subRegionId, subRegions.id))
    .where(and(...conditions))
    .orderBy(desc(accommodations.googleRating))
    .limit(limit);

  return rows;
}


// ────────────────────────────────────────────────────────────────────────────
// Accommodation category pages
// ────────────────────────────────────────────────────────────────────────────

// Accommodation category pages currently only exist for dog-friendly.
// Family-friendly was removed 2026-04-12: accommodations default to
// kid-welcoming unless flagged adults_only, so a dedicated page would be
// misleading (~90% of hotels would qualify).
export type AccommodationAmenity = "dog";

/** Ranking: log10(reviews) × 30 + rating × 40 + priceTier × 15 */
const accommodationRankingScore = sql`(
  (CASE WHEN ${accommodations.googleReviewCount} > 0
    THEN log(${accommodations.googleReviewCount} + 1) / log(10) * 30
    ELSE 0 END)
  + COALESCE(${accommodations.googleRating}, 0) * 40
  + COALESCE(${accommodations.priceTier}, 2) * 15
)`;

/**
 * All dog-friendly accommodations, optionally filtered by valley.
 * Used by the dog-friendly hotel category landing pages.
 */
export async function getAccommodationCategoryListings(
  _amenity: AccommodationAmenity,
  valley: Valley | null
) {
  const conditions = [eq(accommodations.dogFriendly, true)];
  if (valley) conditions.push(eq(accommodations.valley, valley));

  const rows = await db
    .select({
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
    })
    .from(accommodations)
    .leftJoin(subRegions, eq(accommodations.subRegionId, subRegions.id))
    .where(and(...conditions))
    .orderBy(sql`${accommodationRankingScore} DESC`);

  return rows;
}

/** Hero image auto-pick for accommodation category pages. */
export function getAccommodationHeroImage(
  accs: { heroImageUrl: string | null; name: string; slug: string }[]
): { url: string; name: string; slug: string } | null {
  for (const a of accs) {
    if (a.heroImageUrl && a.heroImageUrl.trim() !== "") {
      return { url: a.heroImageUrl, name: a.name, slug: a.slug };
    }
  }
  return null;
}

// Re-exported from the pure helper module so existing callers of
// `category-data` keep working without pulling DB imports into client code.
export { displaySubRegionName } from "@/lib/subregion-display";

/**
 * Auto-pick a hero image from a category page's winery result set.
 *
 * Used by the V2 category layout (and routes that branch into it) to surface
 * a feature photo at the top of each topical page. Walks the in-memory result
 * set in rank order, returning the first winery whose `heroImageUrl` is
 * non-null. Returns null if none of the wineries have a hero image — the
 * layout falls back to a placeholder gradient in that case.
 *
 * Pure function — operates on the array, no DB access.
 */
export interface CategoryHeroPick {
  url: string;
  wineryName: string;
  winerySlug: string;
}

export function getCategoryHeroImage(
  wineries: { heroImageUrl: string | null; name: string; slug: string }[]
): CategoryHeroPick | null {
  for (const w of wineries) {
    if (w.heroImageUrl && w.heroImageUrl.trim() !== "") {
      return {
        url: w.heroImageUrl,
        wineryName: w.name,
        winerySlug: w.slug,
      };
    }
  }
  return null;
}

