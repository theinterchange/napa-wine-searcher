import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wineries, subRegions, wineTypes, wines, dayTripRoutes, accommodations } from "@/db/schema";
import { sql, eq, count } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { Column } from "drizzle-orm";

const FILTER_SHORTCUTS = [
  { keywords: ["dog", "dogs", "dog-friendly", "pet", "pets"], label: "Dog-Friendly Wineries", href: "/wineries?amenities=dog", type: "amenity" },
  { keywords: ["kid", "kids", "child", "children", "family", "kid-friendly"], label: "Kid-Friendly Wineries", href: "/wineries?amenities=kid", type: "amenity" },
  { keywords: ["picnic", "picnics", "outdoor", "outside"], label: "Picnic-Friendly Wineries", href: "/wineries?amenities=picnic", type: "amenity" },
  { keywords: ["walk-in", "walkin", "walk in", "no reservation", "drop in", "drop-in"], label: "Walk-in Friendly Wineries", href: "/wineries?amenities=walkin", type: "amenity" },
  { keywords: ["budget", "cheap", "affordable", "under 40", "under $40"], label: "Budget Tastings (Under $40)", href: "/wineries?tastingPrice=budget", type: "price" },
  { keywords: ["classic", "moderate", "mid-range", "midrange"], label: "Classic Tastings ($40–$75)", href: "/wineries?tastingPrice=classic", type: "price" },
  { keywords: ["premium", "high-end", "upscale"], label: "Premium Tastings ($75–$100)", href: "/wineries?tastingPrice=premium", type: "price" },
  { keywords: ["luxury", "expensive", "splurge", "over 100", "over $100"], label: "Luxury Tastings ($100+)", href: "/wineries?tastingPrice=luxury", type: "price" },
  { keywords: ["top rated", "top-rated", "best", "highest rated", "4.5", "highly rated"], label: "Top Rated Wineries", href: "/wineries?minRating=4.5", type: "rating" },
  { keywords: ["napa valley", "napa"], label: "Napa Valley Wineries", href: "/napa-valley", type: "region" },
  { keywords: ["sonoma valley", "sonoma"], label: "Sonoma County Wineries", href: "/sonoma-county", type: "region" },
  { keywords: ["curated", "featured", "recommended", "editors pick"], label: "Curated Picks", href: "/wineries?curated=true", type: "featured" },
];

// Strip punctuation for fuzzy matching (e.g. "St Francis" matches "St. Francis")
function normalize(text: string): string {
  return text.replace(/[.\-'']/g, "").replace(/\s+/g, " ").trim();
}

// Wrap a column with REPLACE calls to strip the same punctuation in SQL
function normalizedCol(col: Column): SQL {
  return sql`REPLACE(REPLACE(REPLACE(${col}, '.', ''), '''', ''), '-', '')`;
}

function matchFilters(q: string) {
  const lower = q.toLowerCase();
  return FILTER_SHORTCUTS.filter((f) =>
    f.keywords.some((kw) => lower.includes(kw))
  ).map(({ label, href, type }) => ({ label, href, type }));
}

export async function GET(request: NextRequest) {
  try {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ wineries: [], wineTypes: [], cities: [], regions: [], dayTrips: [], accommodations: [], filters: [] });
  }

  const normalizedQ = normalize(q);
  const pattern = `%${q}%`;
  const normalizedPattern = `%${normalizedQ}%`;

  const [wineryResults, wineTypeResults, cityResults, regionResults, dayTripResults, accommodationResults] = await Promise.all([
    // Wineries: match name, city, or description (normalized for punctuation)
    db
      .select({
        id: wineries.id,
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
        sql`(${normalizedCol(wineries.name)} LIKE ${normalizedPattern} OR ${normalizedCol(wineries.city)} LIKE ${normalizedPattern} OR ${wineries.shortDescription} LIKE ${pattern})`
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
      .where(sql`${normalizedCol(wineTypes.name)} LIKE ${normalizedPattern}`)
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
      .where(sql`${normalizedCol(wineries.city)} LIKE ${normalizedPattern}`)
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
      .where(sql`${normalizedCol(subRegions.name)} LIKE ${normalizedPattern}`)
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
        sql`(${normalizedCol(dayTripRoutes.title)} LIKE ${normalizedPattern} OR ${dayTripRoutes.theme} LIKE ${pattern})`
      )
      .limit(4),

    // Accommodations: match name, city, or type
    db
      .select({
        slug: accommodations.slug,
        name: accommodations.name,
        city: accommodations.city,
        type: accommodations.type,
        valley: accommodations.valley,
        googleRating: accommodations.googleRating,
        priceTier: accommodations.priceTier,
      })
      .from(accommodations)
      .where(
        sql`(${normalizedCol(accommodations.name)} LIKE ${normalizedPattern} OR ${normalizedCol(accommodations.city)} LIKE ${normalizedPattern})`
      )
      .orderBy(sql`COALESCE(${accommodations.googleRating}, 0) DESC`)
      .limit(4),
  ]);

  const filters = matchFilters(q);

  return NextResponse.json({
    wineries: wineryResults,
    wineTypes: wineTypeResults,
    cities: cityResults,
    regions: regionResults,
    dayTrips: dayTripResults,
    accommodations: accommodationResults,
    filters,
  });
  } catch (error) {
    console.error("GET /api/search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
