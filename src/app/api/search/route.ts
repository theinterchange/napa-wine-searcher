import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wineries, subRegions, wineTypes, wines, dayTripRoutes } from "@/db/schema";
import { sql, like, eq, count } from "drizzle-orm";

const FILTER_SHORTCUTS = [
  { keywords: ["dog", "dogs", "dog-friendly", "pet", "pets"], label: "Dog-Friendly Wineries", href: "/wineries?dog=true", type: "amenity" },
  { keywords: ["kid", "kids", "child", "children", "family", "kid-friendly"], label: "Kid-Friendly Wineries", href: "/wineries?kid=true", type: "amenity" },
  { keywords: ["picnic", "picnics", "outdoor", "outside"], label: "Picnic-Friendly Wineries", href: "/wineries?picnic=true", type: "amenity" },
  { keywords: ["walk-in", "walkin", "walk in", "no reservation", "drop in", "drop-in"], label: "Walk-in Friendly Wineries", href: "/wineries?reservation=false", type: "amenity" },
  { keywords: ["budget", "cheap", "affordable", "under 40", "under $40"], label: "Budget Tastings (Under $40)", href: "/wineries?tastingPrice=budget", type: "price" },
  { keywords: ["classic", "moderate", "mid-range", "midrange"], label: "Classic Tastings ($40–$75)", href: "/wineries?tastingPrice=classic", type: "price" },
  { keywords: ["premium", "high-end", "upscale"], label: "Premium Tastings ($75–$100)", href: "/wineries?tastingPrice=premium", type: "price" },
  { keywords: ["luxury", "expensive", "splurge", "over 100", "over $100"], label: "Luxury Tastings ($100+)", href: "/wineries?tastingPrice=luxury", type: "price" },
  { keywords: ["top rated", "top-rated", "best", "highest rated", "4.5", "highly rated"], label: "Top Rated Wineries", href: "/wineries?minRating=4.5", type: "rating" },
  { keywords: ["napa valley", "napa"], label: "Napa Valley Wineries", href: "/wineries?valley=napa", type: "region" },
  { keywords: ["sonoma valley", "sonoma"], label: "Sonoma Valley Wineries", href: "/wineries?valley=sonoma", type: "region" },
  { keywords: ["curated", "featured", "recommended", "editors pick"], label: "Curated Picks", href: "/wineries?curated=true", type: "featured" },
];

function matchFilters(q: string) {
  const lower = q.toLowerCase();
  return FILTER_SHORTCUTS.filter((f) =>
    f.keywords.some((kw) => lower.includes(kw))
  ).map(({ label, href, type }) => ({ label, href, type }));
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ wineries: [], wineTypes: [], cities: [], regions: [], dayTrips: [], filters: [] });
  }

  const pattern = `%${q}%`;

  const [wineryResults, wineTypeResults, cityResults, regionResults, dayTripResults] = await Promise.all([
    // Wineries: match name, city, or description
    db
      .select({
        slug: wineries.slug,
        name: wineries.name,
        city: wineries.city,
        subRegion: subRegions.name,
        valley: subRegions.valley,
        aggregateRating: wineries.aggregateRating,
        googleRating: wineries.googleRating,
        priceLevel: wineries.priceLevel,
      })
      .from(wineries)
      .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
      .where(
        sql`(${wineries.name} LIKE ${pattern} OR ${wineries.city} LIKE ${pattern} OR ${wineries.shortDescription} LIKE ${pattern})`
      )
      .orderBy(sql`${wineries.curated} DESC, COALESCE(${wineries.googleRating}, 0) DESC`)
      .limit(6),

    // Wine types: match name, include winery count
    db
      .select({
        name: wineTypes.name,
        category: wineTypes.category,
        wineryCount: count(wines.wineryId).as("winery_count"),
      })
      .from(wineTypes)
      .leftJoin(wines, eq(wines.wineTypeId, wineTypes.id))
      .where(like(wineTypes.name, pattern))
      .groupBy(wineTypes.id)
      .limit(5),

    // Cities: group wineries by city
    db
      .select({
        city: wineries.city,
        valley: subRegions.valley,
        count: count().as("count"),
      })
      .from(wineries)
      .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
      .where(like(wineries.city, pattern))
      .groupBy(wineries.city)
      .limit(5),

    // Regions (sub_regions)
    db
      .select({
        slug: subRegions.slug,
        name: subRegions.name,
        valley: subRegions.valley,
      })
      .from(subRegions)
      .where(like(subRegions.name, pattern))
      .limit(5),

    // Day trips
    db
      .select({
        slug: dayTripRoutes.slug,
        title: dayTripRoutes.title,
        theme: dayTripRoutes.theme,
      })
      .from(dayTripRoutes)
      .where(
        sql`(${dayTripRoutes.title} LIKE ${pattern} OR ${dayTripRoutes.theme} LIKE ${pattern})`
      )
      .limit(4),
  ]);

  const filters = matchFilters(q);

  return NextResponse.json({
    wineries: wineryResults,
    wineTypes: wineTypeResults,
    cities: cityResults,
    regions: regionResults,
    dayTrips: dayTripResults,
    filters,
  });
}
