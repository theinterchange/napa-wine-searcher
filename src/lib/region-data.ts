import { db } from "@/db";
import {
  wineries,
  subRegions,
  wines,
  wineTypes,
  tastingExperiences,
  dayTripRoutes,
  dayTripStops,
} from "@/db/schema";
import { eq, sql, count, and, desc, asc, min, max } from "drizzle-orm";

export async function getValleyOverview(valley: "napa" | "sonoma") {
  const [topWineries, subRegionRows, amenityCounts, priceRange] =
    await Promise.all([
      // Top 12 wineries by Google rating
      db
        .select({
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
          googleRating: wineries.googleRating,
        })
        .from(wineries)
        .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
        .where(eq(subRegions.valley, valley))
        .orderBy(
          desc(wineries.curated),
          sql`COALESCE(${wineries.googleRating}, 0) DESC`
        )
        .limit(12),

      // Sub-region breakdown with counts
      db
        .select({
          id: subRegions.id,
          name: subRegions.name,
          slug: subRegions.slug,
          count: count(),
        })
        .from(wineries)
        .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
        .where(eq(subRegions.valley, valley))
        .groupBy(subRegions.id)
        .orderBy(sql`count(*) DESC`),

      // Amenity counts
      db
        .select({
          dogFriendlyCount:
            sql<number>`SUM(CASE WHEN ${wineries.dogFriendly} = 1 THEN 1 ELSE 0 END)`.as(
              "dog_friendly_count"
            ),
          kidFriendlyCount:
            sql<number>`SUM(CASE WHEN ${wineries.kidFriendly} = 1 THEN 1 ELSE 0 END)`.as(
              "kid_friendly_count"
            ),
          picnicFriendlyCount:
            sql<number>`SUM(CASE WHEN ${wineries.picnicFriendly} = 1 THEN 1 ELSE 0 END)`.as(
              "picnic_friendly_count"
            ),
        })
        .from(wineries)
        .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
        .where(eq(subRegions.valley, valley)),

      // Tasting price range
      db
        .select({
          minPrice: min(tastingExperiences.price).as("min_price"),
          maxPrice: max(tastingExperiences.price).as("max_price"),
        })
        .from(tastingExperiences)
        .innerJoin(wineries, eq(tastingExperiences.wineryId, wineries.id))
        .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
        .where(eq(subRegions.valley, valley)),
    ]);

  const totalWineries = subRegionRows.reduce((s, r) => s + r.count, 0);

  return {
    topWineries,
    subRegions: subRegionRows,
    totalWineries,
    amenities: amenityCounts[0] ?? {
      dogFriendlyCount: 0,
      kidFriendlyCount: 0,
      picnicFriendlyCount: 0,
    },
    tastingPriceRange: {
      min: priceRange[0]?.minPrice ?? 0,
      max: priceRange[0]?.maxPrice ?? 0,
    },
  };
}

export async function getTopVarietals(valley: "napa" | "sonoma", limit = 8) {
  return db
    .select({
      name: wineTypes.name,
      category: wineTypes.category,
      count: count().as("count"),
    })
    .from(wines)
    .innerJoin(wineTypes, eq(wines.wineTypeId, wineTypes.id))
    .innerJoin(wineries, eq(wines.wineryId, wineries.id))
    .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(eq(subRegions.valley, valley))
    .groupBy(wineTypes.id)
    .orderBy(sql`count(*) DESC`)
    .limit(limit);
}

export async function getSubRegionDetail(slug: string) {
  // Get the sub-region info
  const [region] = await db
    .select()
    .from(subRegions)
    .where(eq(subRegions.slug, slug))
    .limit(1);

  if (!region) return null;

  const [regionWineries, topVarietals, siblingRegions, relatedTrips] =
    await Promise.all([
      // All wineries in this sub-region
      db
        .select({
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
          googleRating: wineries.googleRating,
        })
        .from(wineries)
        .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
        .where(eq(wineries.subRegionId, region.id))
        .orderBy(
          desc(wineries.curated),
          sql`COALESCE(${wineries.googleRating}, 0) DESC`
        ),

      // Top varietals in this sub-region
      db
        .select({
          name: wineTypes.name,
          category: wineTypes.category,
          count: count().as("count"),
        })
        .from(wines)
        .innerJoin(wineTypes, eq(wines.wineTypeId, wineTypes.id))
        .innerJoin(wineries, eq(wines.wineryId, wineries.id))
        .where(eq(wineries.subRegionId, region.id))
        .groupBy(wineTypes.id)
        .orderBy(sql`count(*) DESC`)
        .limit(5),

      // Sibling sub-regions (same valley, excluding this one)
      db
        .select({
          name: subRegions.name,
          slug: subRegions.slug,
          count: count(),
        })
        .from(wineries)
        .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
        .where(
          and(
            eq(subRegions.valley, region.valley),
            sql`${subRegions.id} != ${region.id}`
          )
        )
        .groupBy(subRegions.id)
        .orderBy(sql`count(*) DESC`),

      // Day trips with stops in this sub-region
      db
        .select({
          slug: dayTripRoutes.slug,
          title: dayTripRoutes.title,
          theme: dayTripRoutes.theme,
          estimatedHours: dayTripRoutes.estimatedHours,
        })
        .from(dayTripStops)
        .innerJoin(dayTripRoutes, eq(dayTripStops.routeId, dayTripRoutes.id))
        .innerJoin(wineries, eq(dayTripStops.wineryId, wineries.id))
        .where(eq(wineries.subRegionId, region.id))
        .groupBy(dayTripRoutes.id),
    ]);

  return {
    region,
    wineries: regionWineries,
    topVarietals,
    siblingRegions,
    relatedTrips,
  };
}

export async function getAllSubRegions(valley: "napa" | "sonoma") {
  return db
    .select({
      slug: subRegions.slug,
    })
    .from(subRegions)
    .where(eq(subRegions.valley, valley));
}

export async function getMoreWineriesInRegion(
  subRegionName: string,
  excludeSlug: string,
  limit = 4
) {
  return db
    .select({
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
    })
    .from(wineries)
    .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(
      and(
        eq(subRegions.name, subRegionName),
        sql`${wineries.slug} != ${excludeSlug}`
      )
    )
    .orderBy(
      desc(wineries.curated),
      sql`COALESCE(${wineries.googleRating}, 0) DESC`
    )
    .limit(limit);
}
