import { db } from "@/db";
import {
  wineries,
  subRegions,
  wines,
  wineTypes,
  tastingExperiences,
} from "@/db/schema";
import { eq, and, sql, count, desc, min, max, avg, lte, gte } from "drizzle-orm";
import { wineryRankingDesc } from "@/lib/winery-ranking";

// Standard winery card fields used across all guide pages
const wineryCardFields = {
  id: wineries.id,
  slug: wineries.slug,
  name: wineries.name,
  shortDescription: wineries.shortDescription,
  city: wineries.city,
  subRegion: subRegions.name,
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
  websiteUrl: wineries.websiteUrl,
} as const;

// Amenity-based queries
export async function getWineriesByAmenity(
  amenity: "dogFriendly" | "kidFriendly" | "picnicFriendly" | "walkIn",
  valley?: "napa" | "sonoma",
  subRegionSlug?: string
) {
  const conditions = [];

  if (amenity === "dogFriendly") conditions.push(eq(wineries.dogFriendly, true));
  else if (amenity === "kidFriendly") conditions.push(eq(wineries.kidFriendly, true));
  else if (amenity === "picnicFriendly") conditions.push(eq(wineries.picnicFriendly, true));
  else if (amenity === "walkIn") {
    // Luxury wineries (price_level=4) list reservation_required=false in Google
    // data but in practice require appointments — exclude to keep walk-in lists honest.
    conditions.push(eq(wineries.reservationRequired, false));
    conditions.push(sql`(${wineries.priceLevel} IS NULL OR ${wineries.priceLevel} < 4)`);
  }

  if (valley) conditions.push(eq(subRegions.valley, valley));
  if (subRegionSlug) conditions.push(eq(subRegions.slug, subRegionSlug));

  return db
    .select(wineryCardFields)
    .from(wineries)
    .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(and(...conditions))
    .orderBy(wineryRankingDesc);
}

// Varietal-based queries — ranked by specialization score
// Score = (varietal_count / total_wines) * varietal_count * rating
// This rewards wineries that concentrate on a varietal, not just ones that happen to have one.
export async function getWineriesByVarietal(
  varietalName: string,
  valley?: "napa" | "sonoma",
  subRegionSlug?: string
) {
  const conditions = [];
  if (valley) conditions.push(eq(subRegions.valley, valley));
  if (subRegionSlug) conditions.push(eq(subRegions.slug, subRegionSlug));

  // Subquery: count of wines matching this varietal per winery
  const varietalCount = db
    .select({
      wineryId: wines.wineryId,
      varietalCount: count().as("varietal_count"),
    })
    .from(wines)
    .innerJoin(wineTypes, eq(wines.wineTypeId, wineTypes.id))
    .where(sql`LOWER(${wineTypes.name}) = LOWER(${varietalName})`)
    .groupBy(wines.wineryId)
    .as("vc");

  // Subquery: total wines per winery
  const totalCount = db
    .select({
      wineryId: wines.wineryId,
      totalWines: count().as("total_wines"),
    })
    .from(wines)
    .groupBy(wines.wineryId)
    .as("tc");

  return db
    .select({
      ...wineryCardFields,
    })
    .from(wineries)
    .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .innerJoin(varietalCount, eq(wineries.id, varietalCount.wineryId))
    .innerJoin(totalCount, eq(wineries.id, totalCount.wineryId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(
      sql`(CAST(${varietalCount.varietalCount} AS REAL) / ${totalCount.totalWines}) * ${varietalCount.varietalCount} * COALESCE(${wineries.aggregateRating}, 0) DESC`,
      desc(wineries.curated),
    );
}

// Price-based tasting queries
export async function getWineriesByTastingPrice(
  tier: "free" | "budget" | "mid" | "luxury",
  valley?: "napa" | "sonoma"
) {
  const priceConditions: ReturnType<typeof lte>[] = [];

  if (tier === "free") priceConditions.push(eq(tastingExperiences.price, 0));
  else if (tier === "budget") priceConditions.push(lte(tastingExperiences.price, 40));
  else if (tier === "mid") priceConditions.push(and(gte(tastingExperiences.price, 40), lte(tastingExperiences.price, 80))!);
  else if (tier === "luxury") priceConditions.push(gte(tastingExperiences.price, 100));

  const conditions = [...priceConditions];
  if (valley) conditions.push(eq(subRegions.valley, valley));

  return db
    .selectDistinct({
      ...wineryCardFields,
      minTastingPrice: min(tastingExperiences.price).as("min_tasting_price"),
    })
    .from(wineries)
    .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .innerJoin(tastingExperiences, eq(tastingExperiences.wineryId, wineries.id))
    .where(and(...conditions))
    .groupBy(wineries.id)
    .orderBy(sql`min_tasting_price ASC`, desc(wineries.curated));
}

// Wine price queries
export async function getWineriesByWinePrice(
  maxPrice: number,
  valley?: "napa" | "sonoma"
) {
  const conditions = [lte(wines.price, maxPrice)];
  if (valley) conditions.push(eq(subRegions.valley, valley));

  return db
    .selectDistinct(wineryCardFields)
    .from(wineries)
    .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .innerJoin(wines, eq(wines.wineryId, wineries.id))
    .where(and(...conditions))
    .orderBy(wineryRankingDesc);
}

// Experience-based queries (groups, first-time)
export async function getWineriesByExperience(
  experienceType: "groups" | "first-time",
  valley?: "napa" | "sonoma",
  subRegionSlug?: string
) {
  const conditions = [];

  if (experienceType === "groups") {
    // Walk-in friendly → naturally group-accommodating
    conditions.push(eq(wineries.reservationRequired, false));
  } else if (experienceType === "first-time") {
    // Walk-in + affordable + good ratings
    conditions.push(
      eq(wineries.reservationRequired, false),
      sql`(${wineries.priceLevel} <= 2 OR ${wineries.priceLevel} IS NULL)`
    );
  }

  if (valley) conditions.push(eq(subRegions.valley, valley));
  if (subRegionSlug) conditions.push(eq(subRegions.slug, subRegionSlug));

  return db
    .select(wineryCardFields)
    .from(wineries)
    .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(and(...conditions))
    .orderBy(wineryRankingDesc);
}

// Comparison data between two regions
export async function getRegionComparisonData(
  valley1: "napa" | "sonoma",
  valley2: "napa" | "sonoma"
) {
  const getValleyStats = async (valley: "napa" | "sonoma") => {
    const [wineryStats, tastingStats, topVarietals, amenities] = await Promise.all([
      db
        .select({
          count: count(),
          avgRating: avg(wineries.aggregateRating).as("avg_rating"),
        })
        .from(wineries)
        .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
        .where(eq(subRegions.valley, valley)),
      db
        .select({
          avgPrice: avg(tastingExperiences.price).as("avg_price"),
          minPrice: min(tastingExperiences.price).as("min_price"),
          maxPrice: max(tastingExperiences.price).as("max_price"),
        })
        .from(tastingExperiences)
        .innerJoin(wineries, eq(tastingExperiences.wineryId, wineries.id))
        .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
        .where(eq(subRegions.valley, valley)),
      db
        .select({
          name: wineTypes.name,
          count: count().as("count"),
        })
        .from(wines)
        .innerJoin(wineTypes, eq(wines.wineTypeId, wineTypes.id))
        .innerJoin(wineries, eq(wines.wineryId, wineries.id))
        .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
        .where(eq(subRegions.valley, valley))
        .groupBy(wineTypes.id)
        .orderBy(sql`count(*) DESC`)
        .limit(5),
      db
        .select({
          dogFriendly: sql<number>`SUM(CASE WHEN ${wineries.dogFriendly} = 1 THEN 1 ELSE 0 END)`.as("dog"),
          kidFriendly: sql<number>`SUM(CASE WHEN ${wineries.kidFriendly} = 1 THEN 1 ELSE 0 END)`.as("kid"),
          picnicFriendly: sql<number>`SUM(CASE WHEN ${wineries.picnicFriendly} = 1 THEN 1 ELSE 0 END)`.as("picnic"),
        })
        .from(wineries)
        .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
        .where(eq(subRegions.valley, valley)),
    ]);

    return {
      wineryCount: wineryStats[0]?.count ?? 0,
      avgRating: Number(wineryStats[0]?.avgRating ?? 0),
      avgTastingPrice: Number(tastingStats[0]?.avgPrice ?? 0),
      minTastingPrice: Number(tastingStats[0]?.minPrice ?? 0),
      maxTastingPrice: Number(tastingStats[0]?.maxPrice ?? 0),
      topVarietals: topVarietals.map((v) => v.name),
      dogFriendlyCount: amenities[0]?.dogFriendly ?? 0,
      kidFriendlyCount: amenities[0]?.kidFriendly ?? 0,
      picnicFriendlyCount: amenities[0]?.picnicFriendly ?? 0,
    };
  };

  const [stats1, stats2] = await Promise.all([
    getValleyStats(valley1),
    getValleyStats(valley2),
  ]);

  return { [valley1]: stats1, [valley2]: stats2 };
}

// Sub-region comparison data
export async function getSubRegionComparisonData(slug1: string, slug2: string) {
  const getSubRegionStats = async (slug: string) => {
    const [region] = await db
      .select()
      .from(subRegions)
      .where(eq(subRegions.slug, slug))
      .limit(1);

    if (!region) return null;

    const [wineryStats, tastingStats, topVarietals] = await Promise.all([
      db
        .select({
          count: count(),
          avgRating: avg(wineries.aggregateRating).as("avg_rating"),
        })
        .from(wineries)
        .where(eq(wineries.subRegionId, region.id)),
      db
        .select({
          avgPrice: avg(tastingExperiences.price).as("avg_price"),
        })
        .from(tastingExperiences)
        .innerJoin(wineries, eq(tastingExperiences.wineryId, wineries.id))
        .where(eq(wineries.subRegionId, region.id)),
      db
        .select({
          name: wineTypes.name,
          count: count().as("count"),
        })
        .from(wines)
        .innerJoin(wineTypes, eq(wines.wineTypeId, wineTypes.id))
        .innerJoin(wineries, eq(wines.wineryId, wineries.id))
        .where(eq(wineries.subRegionId, region.id))
        .groupBy(wineTypes.id)
        .orderBy(sql`count(*) DESC`)
        .limit(5),
    ]);

    return {
      name: region.name,
      slug: region.slug,
      valley: region.valley,
      wineryCount: wineryStats[0]?.count ?? 0,
      avgRating: Number(wineryStats[0]?.avgRating ?? 0),
      avgTastingPrice: Number(tastingStats[0]?.avgPrice ?? 0),
      topVarietals: topVarietals.map((v) => v.name),
    };
  };

  const [stats1, stats2] = await Promise.all([
    getSubRegionStats(slug1),
    getSubRegionStats(slug2),
  ]);

  return { region1: stats1, region2: stats2 };
}
