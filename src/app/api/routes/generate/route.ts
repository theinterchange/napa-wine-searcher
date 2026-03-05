import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  wineries,
  wines,
  wineTypes,
  subRegions,
  tastingExperiences,
  dayTripRoutes,
  dayTripStops,
} from "@/db/schema";
import { eq, and, asc, sql, inArray, min, max } from "drizzle-orm";
import {
  haversineDistance,
  estimatedDrivingMiles,
  estimatedDrivingMinutes,
  optimizeStopOrder,
  computeSegments,
  buildGoogleMapsUrl,
} from "@/lib/geo";
import { isOpenOnDay } from "@/lib/hours";

const THEME_AMENITY_MAP: Record<string, string[]> = {
  "dog-friendly": ["dog"],
  "kid-friendly": ["kid"],
  picnic: ["picnic"],
  "walk-in": ["walkin"],
};

// Wine type category groupings for wizard
const WINE_CATEGORY_MAP: Record<string, string[]> = {
  "Cabernet Sauvignon": ["Cabernet Sauvignon", "Cabernet Franc"],
  "Pinot Noir": ["Pinot Noir", "Pinot Noir Blanc"],
  Chardonnay: ["Chardonnay"],
  Sparkling: ["Sparkling Wine", "Sparkling Rosé", "Brut", "Blanc de Blancs"],
  Rosé: ["Rosé"],
  Zinfandel: ["Zinfandel"],
  "Red Blends": [
    "Red Blend",
    "Merlot",
    "Syrah",
    "Petite Sirah",
    "Malbec",
    "Tempranillo",
    "Sangiovese",
    "Grenache",
    "Mourvèdre",
    "Barbera",
  ],
  "White & Other": [
    "Sauvignon Blanc",
    "Viognier",
    "Riesling",
    "White Blend",
    "Gewürztraminer",
    "Pinot Grigio",
    "Chenin Blanc",
    "Muscat",
    "Albariño",
    "Grüner Veltliner",
  ],
};

// Time budget → stop count ranges
const TIME_BUDGET_STOPS: Record<string, { min: number; max: number; minutes: number }> = {
  half: { min: 2, max: 3, minutes: 180 },
  full: { min: 3, max: 5, minutes: 360 },
  extended: { min: 5, max: 6, minutes: 480 },
};

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const theme = sp.get("theme") || "";
  const valley = sp.get("valley") || "";
  const amenities = sp.get("amenities") || "";
  const excludeIdsStr = sp.get("excludeIds") || "";
  const excludeIds = excludeIdsStr
    ? excludeIdsStr.split(",").map(Number).filter(Boolean)
    : [];

  // Wizard params
  const originLat = sp.get("originLat") ? parseFloat(sp.get("originLat")!) : null;
  const originLng = sp.get("originLng") ? parseFloat(sp.get("originLng")!) : null;
  const dayOfWeek = sp.get("dayOfWeek") || "";
  const wineTypesParam = sp.get("wineTypes") || "";
  const maxPrice = sp.get("maxPrice") ? parseInt(sp.get("maxPrice")!, 10) : null;
  const timeBudget = sp.get("timeBudget") || "";
  const anchorIdsStr = sp.get("anchorIds") || "";
  const anchorIds = anchorIdsStr
    ? anchorIdsStr.split(",").map(Number).filter(Boolean)
    : [];

  // Derive stop count from timeBudget or explicit param
  const timeBudgetConfig = TIME_BUDGET_STOPS[timeBudget];
  const stopCount = timeBudgetConfig
    ? timeBudgetConfig.max
    : Math.min(8, Math.max(2, parseInt(sp.get("stops") || "4", 10)));

  // Load from existing curated route
  const fromSlug = sp.get("from") || "";
  if (fromSlug) {
    return loadCuratedRoute(fromSlug);
  }

  // Load specific winery IDs
  const stopIdsStr = sp.get("stopIds") || "";
  if (stopIdsStr) {
    return loadSpecificStops(stopIdsStr);
  }

  // Build filter conditions
  const conditions = [];
  conditions.push(sql`${wineries.lat} IS NOT NULL AND ${wineries.lng} IS NOT NULL`);

  if (excludeIds.length > 0) {
    conditions.push(sql`${wineries.id} NOT IN (${sql.join(excludeIds.map(id => sql`${id}`), sql`, `)})`);
  }

  if (valley) {
    conditions.push(eq(subRegions.valley, valley as "napa" | "sonoma"));
  }

  // Price filtering
  if (maxPrice != null) {
    conditions.push(sql`${wineries.priceLevel} IS NULL OR ${wineries.priceLevel} <= ${maxPrice}`);
  }

  // Combine explicit amenities with theme-mapped ones
  const amenityList = amenities ? amenities.split(",").filter(Boolean) : [];
  const themeAmenities = THEME_AMENITY_MAP[theme] || [];
  const allAmenities = [...new Set([...amenityList, ...themeAmenities])];

  for (const a of allAmenities) {
    switch (a) {
      case "dog":
        conditions.push(eq(wineries.dogFriendly, true));
        break;
      case "kid":
        conditions.push(eq(wineries.kidFriendly, true));
        break;
      case "picnic":
        conditions.push(eq(wineries.picnicFriendly, true));
        break;
      case "walkin":
        conditions.push(eq(wineries.reservationRequired, false));
        break;
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Fetch candidate wineries (include hoursJson for day filtering)
  const pool = await db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      city: wineries.city,
      lat: wineries.lat,
      lng: wineries.lng,
      heroImageUrl: wineries.heroImageUrl,
      aggregateRating: wineries.aggregateRating,
      googleRating: wineries.googleRating,
      priceLevel: wineries.priceLevel,
      dogFriendly: wineries.dogFriendly,
      kidFriendly: wineries.kidFriendly,
      picnicFriendly: wineries.picnicFriendly,
      reservationRequired: wineries.reservationRequired,
      subRegion: subRegions.name,
      subRegionSlug: subRegions.slug,
      valley: subRegions.valley,
      hoursJson: wineries.hoursJson,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(where)
    .orderBy(sql`COALESCE(${wineries.googleRating}, ${wineries.aggregateRating}, 0) DESC`)
    .limit(150);

  // Filter by day of week (in JS since hoursJson is a JSON string)
  let candidates = dayOfWeek
    ? pool.filter((w) => isOpenOnDay(w.hoursJson, dayOfWeek))
    : pool;

  if (candidates.length < 2) {
    return NextResponse.json(
      { error: "Not enough wineries match your criteria", stops: [], alternatives: {} },
      { status: 200 }
    );
  }

  // Wine type scoring: if wineTypes provided, score each winery by matching wines
  let wineScoreMap = new Map<number, number>();
  const requestedWineTypes = wineTypesParam
    ? wineTypesParam.split(",").filter(Boolean)
    : [];

  if (requestedWineTypes.length > 0) {
    // Expand category names to individual wine type names
    const expandedTypeNames: string[] = [];
    for (const cat of requestedWineTypes) {
      const mapped = WINE_CATEGORY_MAP[cat];
      if (mapped) {
        expandedTypeNames.push(...mapped);
      } else {
        expandedTypeNames.push(cat);
      }
    }

    if (expandedTypeNames.length > 0) {
      // Count matching wines per winery
      const wineCounts = await db
        .select({
          wineryId: wines.wineryId,
          matchCount: sql<number>`COUNT(*)`.as("match_count"),
        })
        .from(wines)
        .innerJoin(wineTypes, eq(wines.wineTypeId, wineTypes.id))
        .where(
          inArray(wineTypes.name, expandedTypeNames)
        )
        .groupBy(wines.wineryId);

      wineScoreMap = new Map(wineCounts.map((w) => [w.wineryId, w.matchCount]));
    }

    // Sort candidates by wine match score (desc) then rating (desc)
    candidates = [...candidates].sort((a, b) => {
      const scoreA = wineScoreMap.get(a.id) || 0;
      const scoreB = wineScoreMap.get(b.id) || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      const ratingA = a.googleRating ?? a.aggregateRating ?? 0;
      const ratingB = b.googleRating ?? b.aggregateRating ?? 0;
      return ratingB - ratingA;
    });
  }

  // Force-include anchor wineries
  const anchorWineries = anchorIds.length > 0
    ? candidates.filter((w) => anchorIds.includes(w.id))
    : [];
  // If anchors not found in candidates (e.g. filtered out), fetch them directly
  const missingAnchorIds = anchorIds.filter(
    (id) => !anchorWineries.some((w) => w.id === id)
  );
  if (missingAnchorIds.length > 0) {
    const missing = await db
      .select({
        id: wineries.id,
        slug: wineries.slug,
        name: wineries.name,
        city: wineries.city,
        lat: wineries.lat,
        lng: wineries.lng,
        heroImageUrl: wineries.heroImageUrl,
        aggregateRating: wineries.aggregateRating,
        googleRating: wineries.googleRating,
        priceLevel: wineries.priceLevel,
        dogFriendly: wineries.dogFriendly,
        kidFriendly: wineries.kidFriendly,
        picnicFriendly: wineries.picnicFriendly,
        reservationRequired: wineries.reservationRequired,
        subRegion: subRegions.name,
        subRegionSlug: subRegions.slug,
        valley: subRegions.valley,
        hoursJson: wineries.hoursJson,
      })
      .from(wineries)
      .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
      .where(inArray(wineries.id, missingAnchorIds));
    anchorWineries.push(...missing);
  }

  // Build selected set: start with anchors, fill remaining slots
  const selected: typeof candidates = [...anchorWineries];
  const selectedIds = new Set(selected.map((s) => s.id));

  // Use origin or highest-scored candidate as seed for nearest-neighbor
  const hasOrigin = originLat != null && originLng != null;
  const seedLat = hasOrigin ? originLat : (selected[0]?.lat ?? candidates[0]?.lat ?? 0);
  const seedLng = hasOrigin ? originLng : (selected[0]?.lng ?? candidates[0]?.lng ?? 0);

  // If no anchors, pick seed from candidates
  if (selected.length === 0) {
    // Pick candidate closest to origin if origin provided, else highest-scored
    if (hasOrigin) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < candidates.length; i++) {
        if (!candidates[i].lat || !candidates[i].lng) continue;
        const d = haversineDistance(originLat, originLng, candidates[i].lat!, candidates[i].lng!);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      selected.push(candidates[bestIdx]);
    } else {
      selected.push(candidates[0]);
    }
    selectedIds.add(selected[0].id);
  }

  // Greedy nearest-neighbor to fill remaining slots
  while (selected.length < stopCount && selected.length < candidates.length) {
    const last = selected[selected.length - 1];
    let bestIdx = -1;
    let bestDist = Infinity;

    for (let i = 0; i < candidates.length; i++) {
      if (selectedIds.has(candidates[i].id)) continue;
      if (!candidates[i].lat || !candidates[i].lng) continue;
      const d = haversineDistance(last.lat!, last.lng!, candidates[i].lat!, candidates[i].lng!);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }

    if (bestIdx === -1) break;
    selected.push(candidates[bestIdx]);
    selectedIds.add(candidates[bestIdx].id);
  }

  // Optimize order
  const coords = selected.map((s) => ({ lat: s.lat!, lng: s.lng! }));
  const optimalOrder = optimizeStopOrder(coords);
  let ordered = optimalOrder.map((i) => selected[i]);

  // Time budget validation: check if route fits
  if (timeBudgetConfig) {
    let attempts = 0;
    while (attempts < 3 && ordered.length > timeBudgetConfig.min) {
      const segs = computeSegments(
        hasOrigin
          ? [{ lat: originLat, lng: originLng }, ...ordered]
          : ordered
      );
      const totalDrive = segs.reduce((s, seg) => s + seg.minutes, 0);
      const totalTaste = ordered.length * 60;
      if (totalDrive + totalTaste <= timeBudgetConfig.minutes) break;
      // Over budget — drop the last stop
      ordered = ordered.slice(0, -1);
      attempts++;
    }
  }

  // Find alternatives for each stop
  const alternatives: Record<number, (typeof candidates)[number][]> = {};
  for (const stop of ordered) {
    const alts = candidates
      .filter((w) => !selectedIds.has(w.id) && w.subRegionSlug === stop.subRegionSlug)
      .map((w) => ({
        ...w,
        _dist: haversineDistance(stop.lat!, stop.lng!, w.lat!, w.lng!),
      }))
      .sort((a, b) => a._dist - b._dist)
      .slice(0, 3)
      .map(({ _dist, ...w }) => w);
    if (alts.length > 0) {
      alternatives[stop.id] = alts;
    }
  }

  // Get tasting prices for selected + alternative wineries
  const allIds = [
    ...ordered.map((s) => s.id),
    ...Object.values(alternatives).flat().map((a) => a.id),
  ];
  const tastingPrices =
    allIds.length > 0
      ? await db
          .select({
            wineryId: tastingExperiences.wineryId,
            minPrice: min(tastingExperiences.price),
            maxPrice: max(tastingExperiences.price),
          })
          .from(tastingExperiences)
          .where(inArray(tastingExperiences.wineryId, allIds))
          .groupBy(tastingExperiences.wineryId)
      : [];
  const priceMap = new Map(
    tastingPrices.map((t) => [t.wineryId, { min: t.minPrice, max: t.maxPrice }])
  );

  // Compute distances (include origin if provided)
  const originPoint = hasOrigin ? { lat: originLat, lng: originLng } : null;
  const segmentStops = originPoint
    ? [originPoint, ...ordered]
    : ordered;
  const segments = computeSegments(segmentStops);

  // When origin is present, first segment is origin→stop1
  const originSegment = originPoint ? segments[0] : null;
  const stopSegments = originPoint ? segments.slice(1) : segments;

  const totalMiles = segments.reduce((s, seg) => s + seg.miles, 0);
  const totalDriveMinutes = segments.reduce((s, seg) => s + seg.minutes, 0);
  const totalTasteMinutes = ordered.length * 60;

  let totalMinCost = 0;
  let totalMaxCost = 0;
  for (const stop of ordered) {
    const prices = priceMap.get(stop.id);
    if (prices?.min != null) {
      totalMinCost += prices.min;
      totalMaxCost += prices.max ?? prices.min;
    }
  }

  const googleMapsUrl = buildGoogleMapsUrl(
    ordered.map((s) => ({ lat: s.lat, lng: s.lng, name: s.name })),
    originPoint
  );

  // Strip hoursJson from response
  const cleanStop = ({ hoursJson, ...rest }: (typeof ordered)[number]) => rest;

  return NextResponse.json({
    stops: ordered.map((s, i) => ({
      ...cleanStop(s),
      tasting: priceMap.get(s.id) || null,
      segmentAfter: stopSegments[i] || null,
    })),
    alternatives: Object.fromEntries(
      Object.entries(alternatives).map(([k, v]) => [k, v.map(cleanStop)])
    ),
    summary: {
      totalMiles: Math.round(totalMiles * 10) / 10,
      totalDriveMinutes: Math.round(totalDriveMinutes),
      totalTasteMinutes,
      totalMinCost: Math.round(totalMinCost),
      totalMaxCost: Math.round(totalMaxCost),
      googleMapsUrl,
    },
    originSegment,
    segments,
  });
}

async function loadCuratedRoute(slug: string) {
  const [route] = await db
    .select()
    .from(dayTripRoutes)
    .where(eq(dayTripRoutes.slug, slug))
    .limit(1);

  if (!route) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  const stops = await db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      city: wineries.city,
      lat: wineries.lat,
      lng: wineries.lng,
      heroImageUrl: wineries.heroImageUrl,
      aggregateRating: wineries.aggregateRating,
      googleRating: wineries.googleRating,
      priceLevel: wineries.priceLevel,
      dogFriendly: wineries.dogFriendly,
      kidFriendly: wineries.kidFriendly,
      picnicFriendly: wineries.picnicFriendly,
      reservationRequired: wineries.reservationRequired,
      subRegion: subRegions.name,
      subRegionSlug: subRegions.slug,
      valley: subRegions.valley,
      notes: dayTripStops.notes,
      suggestedDuration: dayTripStops.suggestedDuration,
    })
    .from(dayTripStops)
    .innerJoin(wineries, eq(dayTripStops.wineryId, wineries.id))
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(eq(dayTripStops.routeId, route.id))
    .orderBy(asc(dayTripStops.stopOrder));

  // Get alternatives for each stop
  const selectedIds = new Set(stops.map((s) => s.id));
  const alternatives: Record<number, typeof stops> = {};

  for (const stop of stops) {
    if (!stop.lat || !stop.lng || !stop.subRegionSlug) continue;
    const alts = await db
      .select({
        id: wineries.id,
        slug: wineries.slug,
        name: wineries.name,
        city: wineries.city,
        lat: wineries.lat,
        lng: wineries.lng,
        heroImageUrl: wineries.heroImageUrl,
        aggregateRating: wineries.aggregateRating,
        googleRating: wineries.googleRating,
        priceLevel: wineries.priceLevel,
        dogFriendly: wineries.dogFriendly,
        kidFriendly: wineries.kidFriendly,
        picnicFriendly: wineries.picnicFriendly,
        reservationRequired: wineries.reservationRequired,
        subRegion: subRegions.name,
        subRegionSlug: subRegions.slug,
        valley: subRegions.valley,
      })
      .from(wineries)
      .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
      .where(
        and(
          eq(subRegions.slug, stop.subRegionSlug),
          sql`${wineries.lat} IS NOT NULL`,
          sql`${wineries.id} NOT IN (${sql.join([...selectedIds].map(id => sql`${id}`), sql`, `)})`
        )
      )
      .limit(3);
    if (alts.length > 0) {
      alternatives[stop.id] = alts as typeof stops;
    }
  }

  // Get tasting prices
  const allIds = [
    ...stops.map((s) => s.id),
    ...Object.values(alternatives).flat().map((a) => a.id),
  ];
  const tastingPrices =
    allIds.length > 0
      ? await db
          .select({
            wineryId: tastingExperiences.wineryId,
            minPrice: min(tastingExperiences.price),
            maxPrice: max(tastingExperiences.price),
          })
          .from(tastingExperiences)
          .where(inArray(tastingExperiences.wineryId, allIds))
          .groupBy(tastingExperiences.wineryId)
      : [];
  const priceMap = new Map(
    tastingPrices.map((t) => [t.wineryId, { min: t.minPrice, max: t.maxPrice }])
  );

  const segments = computeSegments(stops);
  const totalMiles = segments.reduce((s, seg) => s + seg.miles, 0);
  const totalDriveMinutes = segments.reduce((s, seg) => s + seg.minutes, 0);
  const totalTasteMinutes = stops.reduce(
    (sum, s) => sum + (s.suggestedDuration || 60),
    0
  );

  let totalMinCost = 0;
  let totalMaxCost = 0;
  for (const stop of stops) {
    const prices = priceMap.get(stop.id);
    if (prices?.min != null) {
      totalMinCost += prices.min;
      totalMaxCost += prices.max ?? prices.min;
    }
  }

  const googleMapsUrl = buildGoogleMapsUrl(
    stops.map((s) => ({ lat: s.lat, lng: s.lng, name: s.name }))
  );

  return NextResponse.json({
    route: { title: route.title, slug: route.slug, theme: route.theme },
    stops: stops.map((s, i) => ({
      ...s,
      tasting: priceMap.get(s.id) || null,
      segmentAfter: segments[i] || null,
    })),
    alternatives,
    summary: {
      totalMiles: Math.round(totalMiles * 10) / 10,
      totalDriveMinutes: Math.round(totalDriveMinutes),
      totalTasteMinutes,
      totalMinCost: Math.round(totalMinCost),
      totalMaxCost: Math.round(totalMaxCost),
      googleMapsUrl,
    },
    segments,
  });
}

async function loadSpecificStops(stopIdsStr: string) {
  const ids = stopIdsStr.split(",").map(Number).filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({ error: "No valid stop IDs", stops: [] }, { status: 400 });
  }

  const stops = await db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      city: wineries.city,
      lat: wineries.lat,
      lng: wineries.lng,
      heroImageUrl: wineries.heroImageUrl,
      aggregateRating: wineries.aggregateRating,
      googleRating: wineries.googleRating,
      priceLevel: wineries.priceLevel,
      dogFriendly: wineries.dogFriendly,
      kidFriendly: wineries.kidFriendly,
      picnicFriendly: wineries.picnicFriendly,
      reservationRequired: wineries.reservationRequired,
      subRegion: subRegions.name,
      subRegionSlug: subRegions.slug,
      valley: subRegions.valley,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(inArray(wineries.id, ids));

  // Preserve the order from the URL
  const stopMap = new Map(stops.map((s) => [s.id, s]));
  const ordered = ids.map((id) => stopMap.get(id)).filter(Boolean) as typeof stops;

  const tastingPrices = await db
    .select({
      wineryId: tastingExperiences.wineryId,
      minPrice: min(tastingExperiences.price),
      maxPrice: max(tastingExperiences.price),
    })
    .from(tastingExperiences)
    .where(inArray(tastingExperiences.wineryId, ids))
    .groupBy(tastingExperiences.wineryId);
  const priceMap = new Map(
    tastingPrices.map((t) => [t.wineryId, { min: t.minPrice, max: t.maxPrice }])
  );

  const segments = computeSegments(ordered);
  const totalMiles = segments.reduce((s, seg) => s + seg.miles, 0);
  const totalDriveMinutes = segments.reduce((s, seg) => s + seg.minutes, 0);

  let totalMinCost = 0;
  let totalMaxCost = 0;
  for (const stop of ordered) {
    const prices = priceMap.get(stop.id);
    if (prices?.min != null) {
      totalMinCost += prices.min;
      totalMaxCost += prices.max ?? prices.min;
    }
  }

  const googleMapsUrl = buildGoogleMapsUrl(
    ordered.map((s) => ({ lat: s.lat, lng: s.lng, name: s.name }))
  );

  return NextResponse.json({
    stops: ordered.map((s, i) => ({
      ...s,
      tasting: priceMap.get(s.id) || null,
      segmentAfter: segments[i] || null,
    })),
    alternatives: {},
    summary: {
      totalMiles: Math.round(totalMiles * 10) / 10,
      totalDriveMinutes: Math.round(totalDriveMinutes),
      totalTasteMinutes: ordered.length * 60,
      totalMinCost: Math.round(totalMinCost),
      totalMaxCost: Math.round(totalMaxCost),
      googleMapsUrl,
    },
    segments,
  });
}
