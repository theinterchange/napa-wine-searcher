import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  wineries,
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

const THEME_AMENITY_MAP: Record<string, string[]> = {
  "dog-friendly": ["dog"],
  "kid-friendly": ["kid"],
  picnic: ["picnic"],
  "walk-in": ["walkin"],
};

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const theme = sp.get("theme") || "";
  const valley = sp.get("valley") || "";
  const amenities = sp.get("amenities") || "";
  const stopCount = Math.min(8, Math.max(2, parseInt(sp.get("stops") || "4", 10)));
  const excludeIdsStr = sp.get("excludeIds") || "";
  const excludeIds = excludeIdsStr
    ? excludeIdsStr.split(",").map(Number).filter(Boolean)
    : [];

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

  // Fetch candidate wineries
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
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(where)
    .orderBy(sql`COALESCE(${wineries.googleRating}, ${wineries.aggregateRating}, 0) DESC`)
    .limit(100);

  if (pool.length < 2) {
    return NextResponse.json(
      { error: "Not enough wineries match your criteria", stops: [], alternatives: {} },
      { status: 200 }
    );
  }

  // Pick seed: highest rated
  const seed = pool[0];
  const selected = [seed];
  const selectedIds = new Set([seed.id]);

  // Greedy nearest-neighbor from seed, filtering by quality
  while (selected.length < stopCount && selected.length < pool.length) {
    const last = selected[selected.length - 1];
    let bestIdx = -1;
    let bestDist = Infinity;

    for (let i = 0; i < pool.length; i++) {
      if (selectedIds.has(pool[i].id)) continue;
      const d = haversineDistance(last.lat!, last.lng!, pool[i].lat!, pool[i].lng!);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }

    if (bestIdx === -1) break;
    selected.push(pool[bestIdx]);
    selectedIds.add(pool[bestIdx].id);
  }

  // Optimize order
  const coords = selected.map((s) => ({ lat: s.lat!, lng: s.lng! }));
  const optimalOrder = optimizeStopOrder(coords);
  const ordered = optimalOrder.map((i) => selected[i]);

  // Find alternatives for each stop (2-3 nearby from same sub-region or valley)
  const alternatives: Record<number, typeof pool> = {};
  for (const stop of ordered) {
    const alts = pool
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

  // Compute distances
  const segments = computeSegments(ordered);
  const totalMiles = segments.reduce((s, seg) => s + seg.miles, 0);
  const totalDriveMinutes = segments.reduce((s, seg) => s + seg.minutes, 0);
  const totalTasteMinutes = ordered.length * 60; // default 60 min per stop

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
