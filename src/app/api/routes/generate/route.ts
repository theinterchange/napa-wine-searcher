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
  computeDetour,
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
// Each stop ≈ 75-90 min (tasting + buffer to explore/leave) + 15-20 min driving between stops
const TIME_BUDGET_STOPS: Record<string, { min: number; max: number; minutes: number }> = {
  half: { min: 2, max: 2, minutes: 210 },     // ~3.5h: 2 stops × 75 min + driving
  full: { min: 3, max: 4, minutes: 420 },      // ~7h: 3-4 stops × 75 min + driving + lunch
  extended: { min: 4, max: 5, minutes: 540 },  // ~9h: 4-5 stops × 75 min + driving + lunch
};

export async function GET(request: NextRequest) {
  try {
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
  const dayOfWeekParam = sp.get("dayOfWeek") || "";
  const daysOfWeek = dayOfWeekParam ? dayOfWeekParam.split(",").filter(Boolean) : [];
  const wineTypesParam = sp.get("wineTypes") || "";
  const maxPrice = sp.get("maxPrice") ? parseInt(sp.get("maxPrice")!, 10) : null;
  const priceLevelsParam = sp.get("priceLevels")?.split(",").map(Number).filter(Boolean) || [];
  const timeBudget = sp.get("timeBudget") || "";
  const anchorIdsStr = sp.get("anchorIds") || "";
  const anchorIds = anchorIdsStr
    ? anchorIdsStr.split(",").map(Number).filter(Boolean)
    : [];

  // Ending destination
  const endLat = sp.get("endLat") ? parseFloat(sp.get("endLat")!) : null;
  const endLng = sp.get("endLng") ? parseFloat(sp.get("endLng")!) : null;
  const hasEnd = endLat != null && endLng != null;

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

  // Price filtering — exact match with multi-select
  // Backward compat: convert legacy maxPrice to priceLevels if new param absent
  const effectivePriceLevels = priceLevelsParam.length > 0
    ? priceLevelsParam
    : maxPrice != null
      ? [maxPrice]
      : [];
  if (effectivePriceLevels.length > 0) {
    conditions.push(
      sql`${wineries.priceLevel} IS NULL OR ${wineries.priceLevel} IN (${sql.join(effectivePriceLevels.map(l => sql`${l}`), sql`, `)})`
    );
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
      visitUrl: wineries.visitUrl,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(where)
    .orderBy(sql`COALESCE(${wineries.googleRating}, ${wineries.aggregateRating}, 0) DESC`)
    .limit(150);

  // Filter by day of week (in JS since hoursJson is a JSON string)
  // If multiple days, include winery if open on ANY of the selected days
  let candidates = daysOfWeek.length > 0
    ? pool.filter((w) => daysOfWeek.some((day) => isOpenOnDay(w.hoursJson, day)))
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
      const candidateIds = candidates.map((c) => c.id);

      // Count matching wines and total wines per winery in parallel
      const [wineCounts, totalCounts] = await Promise.all([
        db
          .select({
            wineryId: wines.wineryId,
            matchCount: sql<number>`COUNT(*)`.as("match_count"),
          })
          .from(wines)
          .innerJoin(wineTypes, eq(wines.wineTypeId, wineTypes.id))
          .where(inArray(wineTypes.name, expandedTypeNames))
          .groupBy(wines.wineryId),
        db
          .select({
            wineryId: wines.wineryId,
            totalCount: sql<number>`COUNT(*)`.as("total_count"),
          })
          .from(wines)
          .where(inArray(wines.wineryId, candidateIds))
          .groupBy(wines.wineryId),
      ]);

      const matchMap = new Map(wineCounts.map((w) => [w.wineryId, w.matchCount]));
      const totalMap = new Map(totalCounts.map((w) => [w.wineryId, w.totalCount]));

      // Score = ratio of matching wines to total wines (0.0 to 1.0)
      for (const [wineryId, matchCount] of matchMap) {
        const total = totalMap.get(wineryId) || matchCount;
        wineScoreMap.set(wineryId, matchCount / total);
      }
    }

    // Sort candidates by wine relevance ratio (desc) then rating (desc)
    candidates = [...candidates].sort((a, b) => {
      const scoreA = wineScoreMap.get(a.id) || 0;
      const scoreB = wineScoreMap.get(b.id) || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      const ratingA = a.googleRating ?? a.aggregateRating ?? 0;
      const ratingB = b.googleRating ?? b.aggregateRating ?? 0;
      return ratingB - ratingA;
    });

    // Filter out wineries below minimum relevance threshold
    const MIN_WINE_RELEVANCE = 0.10;
    if (wineScoreMap.size > 0) {
      const filtered = candidates.filter((c) => (wineScoreMap.get(c.id) || 0) >= MIN_WINE_RELEVANCE);
      if (filtered.length >= 2) {
        candidates = filtered;
      }
    }
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
        visitUrl: wineries.visitUrl,
      })
      .from(wineries)
      .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
      .where(inArray(wineries.id, missingAnchorIds));
    anchorWineries.push(...missing);
  }

  // Build selected set: start with anchors, fill remaining slots
  const selected: typeof candidates = [...anchorWineries];
  const selectedIds = new Set(selected.map((s) => s.id));

  // Destination-aware candidate scoring
  const hasOrigin = originLat != null && originLng != null;
  const originPt = hasOrigin ? { lat: originLat!, lng: originLng! } : null;
  const destPt = hasEnd ? { lat: endLat!, lng: endLng! } : null;

  // Score every non-anchor candidate
  const slotsToFill = stopCount - selected.length;
  const scoredCandidates = candidates
    .filter((c) => !selectedIds.has(c.id) && c.lat != null && c.lng != null)
    .map((c) => {
      const wineRelevance = wineScoreMap.get(c.id) || 0;
      const rating = c.googleRating ?? c.aggregateRating ?? 0;
      const normalizedRating = Math.min(1, Math.max(0, (rating - 3) / 2));
      let score: number;

      if (hasOrigin && hasEnd) {
        const detour = computeDetour(originPt!, { lat: c.lat!, lng: c.lng! }, destPt!);
        const scaleFactor = Math.max(haversineDistance(originPt!.lat, originPt!.lng, destPt!.lat, destPt!.lng), 10);
        const routeEfficiency = 1 / (1 + detour / scaleFactor);
        score = wineRelevance * 0.35 + routeEfficiency * 0.45 + normalizedRating * 0.20;
      } else if (hasOrigin) {
        const dist = haversineDistance(originLat!, originLng!, c.lat!, c.lng!);
        const proximity = Math.max(0, 1 - dist / 60);
        score = wineRelevance * 0.40 + proximity * 0.35 + normalizedRating * 0.25;
      } else {
        score = wineRelevance * 0.60 + normalizedRating * 0.40;
      }

      return { candidate: c, score };
    })
    .sort((a, b) => b.score - a.score);

  // Pick top N candidates
  for (const { candidate } of scoredCandidates.slice(0, slotsToFill)) {
    selected.push(candidate);
    selectedIds.add(candidate.id);
  }

  // Optimize order
  const coords = selected.map((s) => ({ lat: s.lat!, lng: s.lng! }));
  const loopDest = hasEnd ? destPt : originPt; // loop-aware fallback
  const optimalOrder = optimizeStopOrder(coords, originPt, loopDest);
  let ordered = optimalOrder.map((i) => selected[i]);

  // Pre-fetch tasting durations for selected stops (needed for time-budget trimming)
  const selectedStopIds = selected.map((s) => s.id);
  const earlyDurations = selectedStopIds.length > 0
    ? await db
        .select({
          wineryId: tastingExperiences.wineryId,
          avgDuration: sql<number>`COALESCE(AVG(${tastingExperiences.durationMinutes}), 60)`.as("avg_duration"),
        })
        .from(tastingExperiences)
        .where(inArray(tastingExperiences.wineryId, selectedStopIds))
        .groupBy(tastingExperiences.wineryId)
    : [];
  const durationMap = new Map(
    earlyDurations.map((t) => [t.wineryId, Math.round(t.avgDuration)])
  );

  // Time budget validation: smart drop of biggest detour contributor + re-optimize
  if (timeBudgetConfig) {
    const anchorIdSet = new Set(anchorIds);
    let trimmed = false;

    while (ordered.length > timeBudgetConfig.min) {
      const budgetStops = [
        ...(hasOrigin ? [{ lat: originLat, lng: originLng }] : []),
        ...ordered,
        ...(hasEnd ? [{ lat: endLat, lng: endLng }] : []),
      ];
      const segs = computeSegments(budgetStops);
      const totalDrive = segs.reduce((s, seg) => s + seg.minutes, 0);
      const totalTaste = ordered.reduce((sum, s) => sum + (durationMap.get(s.id) || 60), 0);
      if (totalDrive + totalTaste <= timeBudgetConfig.minutes) break;

      // Find non-anchor stop whose removal saves the most driving time
      let bestDropIdx = -1;
      let bestSaving = -Infinity;

      for (let i = 0; i < ordered.length; i++) {
        if (anchorIdSet.has(ordered[i].id)) continue;
        const without = ordered.filter((_, j) => j !== i);
        const trialStops = [
          ...(hasOrigin ? [{ lat: originLat, lng: originLng }] : []),
          ...without,
          ...(hasEnd ? [{ lat: endLat, lng: endLng }] : []),
        ];
        const trialSegs = computeSegments(trialStops);
        const trialDrive = trialSegs.reduce((s, seg) => s + seg.minutes, 0);
        const saving = totalDrive - trialDrive;
        if (saving > bestSaving) {
          bestSaving = saving;
          bestDropIdx = i;
        }
      }

      if (bestDropIdx === -1) break; // only anchors left
      ordered = ordered.filter((_, j) => j !== bestDropIdx);
      trimmed = true;
    }

    // Re-optimize after trimming
    if (trimmed && ordered.length > 1) {
      const trimCoords = ordered.map((s) => ({ lat: s.lat!, lng: s.lng! }));
      const reOrder = optimizeStopOrder(trimCoords, originPt, loopDest);
      ordered = reOrder.map((i) => ordered[i]);
    }
  }

  // Find alternatives for each stop
  const alternatives: Record<number, (typeof candidates)[number][]> = {};
  for (const stop of ordered) {
    const alts = candidates
      .filter((w) => !selectedIds.has(w.id))
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
            avgDuration: sql<number>`COALESCE(AVG(${tastingExperiences.durationMinutes}), 60)`.as("avg_duration"),
          })
          .from(tastingExperiences)
          .where(inArray(tastingExperiences.wineryId, allIds))
          .groupBy(tastingExperiences.wineryId)
      : [];
  const priceMap = new Map(
    tastingPrices.map((t) => [t.wineryId, { min: t.minPrice, max: t.maxPrice }])
  );
  // Merge durations from full query into the existing durationMap
  for (const t of tastingPrices) {
    if (!durationMap.has(t.wineryId)) {
      durationMap.set(t.wineryId, Math.round(t.avgDuration));
    }
  }

  // Compute distances (include origin and/or ending destination)
  const originPoint = hasOrigin ? { lat: originLat, lng: originLng } : null;
  const endPoint = hasEnd ? { lat: endLat, lng: endLng } : null;
  const segmentStops = [
    ...(originPoint ? [originPoint] : []),
    ...ordered,
    ...(endPoint ? [endPoint] : []),
  ];
  const segments = computeSegments(segmentStops);

  // When origin is present, first segment is origin→stop1
  const originSegment = originPoint ? segments[0] : null;
  // When end is present, last segment is lastStop→destination
  const endSegment = endPoint ? segments[segments.length - 1] : null;
  // Stop-to-stop segments are in between
  const stopStart = originPoint ? 1 : 0;
  const stopEnd = endPoint ? segments.length - 1 : segments.length;
  const stopSegments = segments.slice(stopStart, stopEnd);

  const totalMiles = segments.reduce((s, seg) => s + seg.miles, 0);
  const totalDriveMinutes = segments.reduce((s, seg) => s + seg.minutes, 0);
  const totalTasteMinutes = ordered.reduce(
    (sum, s) => sum + (durationMap.get(s.id) || 60), 0
  );

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
    originPoint,
    endPoint
  );

  // Build matchReasons for each stop
  const anchorIdSet = new Set(anchorIds);
  const amenityLabels: Record<string, string> = {
    dog: "Dog-friendly",
    kid: "Kid-friendly",
    picnic: "Picnic area",
    walkin: "Walk-in welcome",
  };

  function getMatchReasons(stop: (typeof ordered)[number], idx: number): string[] {
    const reasons: string[] = [];
    // Anchor / must-visit
    if (anchorIdSet.has(stop.id)) reasons.push("Must-visit");
    // Wine type matches (ratio-aware labels)
    if (requestedWineTypes.length > 0) {
      const score = wineScoreMap.get(stop.id) || 0;
      if (score >= 0.20) {
        const label = requestedWineTypes.length === 1
          ? `Strong in ${requestedWineTypes[0]}`
          : `${requestedWineTypes[0]} selection`;
        reasons.push(label);
      } else if (score >= 0.10) {
        reasons.push(`${requestedWineTypes[0]} available`);
      }
    }
    // Amenity matches
    for (const a of allAmenities) {
      if (amenityLabels[a]) reasons.push(amenityLabels[a]);
    }
    // High rating
    const rating = stop.googleRating ?? stop.aggregateRating ?? 0;
    if (rating >= 4.5) reasons.push("Highly rated");
    // Proximity to previous stop
    if (idx > 0) {
      const prev = ordered[idx - 1];
      if (prev.lat && prev.lng && stop.lat && stop.lng) {
        const dist = haversineDistance(prev.lat, prev.lng, stop.lat, stop.lng);
        if (dist < 3) reasons.push("Close to previous stop");
      }
    }
    return reasons.slice(0, 3);
  }

  // Strip hoursJson from alternatives only (stops keep it for hours display)
  const cleanAlt = ({ hoursJson, visitUrl, ...rest }: (typeof ordered)[number]) => rest;

  return NextResponse.json({
    stops: ordered.map((s, i) => ({
      ...s,
      tasting: priceMap.get(s.id) || null,
      tastingDurationMinutes: durationMap.get(s.id) || 60,
      segmentAfter: stopSegments[i] || null,
      matchReasons: getMatchReasons(s, i),
    })),
    alternatives: Object.fromEntries(
      Object.entries(alternatives).map(([k, v]) => [k, v.map(cleanAlt)])
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
    endSegment,
    segments,
  });
  } catch (error) {
    console.error("GET /api/routes/generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
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
      hoursJson: wineries.hoursJson,
      visitUrl: wineries.visitUrl,
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

  // Get tasting prices and durations
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
            avgDuration: sql<number>`COALESCE(AVG(${tastingExperiences.durationMinutes}), 60)`.as("avg_duration"),
          })
          .from(tastingExperiences)
          .where(inArray(tastingExperiences.wineryId, allIds))
          .groupBy(tastingExperiences.wineryId)
      : [];
  const priceMap = new Map(
    tastingPrices.map((t) => [t.wineryId, { min: t.minPrice, max: t.maxPrice }])
  );
  const curatedDurationMap = new Map(
    tastingPrices.map((t) => [t.wineryId, Math.round(t.avgDuration)])
  );

  const segments = computeSegments(stops);
  const totalMiles = segments.reduce((s, seg) => s + seg.miles, 0);
  const totalDriveMinutes = segments.reduce((s, seg) => s + seg.minutes, 0);
  const totalTasteMinutes = stops.reduce(
    (sum, s) => sum + (s.suggestedDuration || curatedDurationMap.get(s.id) || 60),
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
      tastingDurationMinutes: s.suggestedDuration || curatedDurationMap.get(s.id) || 60,
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
      avgDuration: sql<number>`COALESCE(AVG(${tastingExperiences.durationMinutes}), 60)`.as("avg_duration"),
    })
    .from(tastingExperiences)
    .where(inArray(tastingExperiences.wineryId, ids))
    .groupBy(tastingExperiences.wineryId);
  const priceMap = new Map(
    tastingPrices.map((t) => [t.wineryId, { min: t.minPrice, max: t.maxPrice }])
  );
  const specificDurationMap = new Map(
    tastingPrices.map((t) => [t.wineryId, Math.round(t.avgDuration)])
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
      tastingDurationMinutes: specificDurationMap.get(s.id) || 60,
      segmentAfter: segments[i] || null,
    })),
    alternatives: {},
    summary: {
      totalMiles: Math.round(totalMiles * 10) / 10,
      totalDriveMinutes: Math.round(totalDriveMinutes),
      totalTasteMinutes: ordered.reduce(
        (sum, s) => sum + (specificDurationMap.get(s.id) || 60), 0
      ),
      totalMinCost: Math.round(totalMinCost),
      totalMaxCost: Math.round(totalMaxCost),
      googleMapsUrl,
    },
    segments,
  });
}
