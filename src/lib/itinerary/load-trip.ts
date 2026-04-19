import "server-only";
import { db } from "@/db";
import {
  wineries,
  subRegions,
  tastingExperiences,
  dayTripRoutes,
  dayTripStops,
  savedTrips,
  savedTripStops,
  anonymousTrips,
  anonymousTripStops,
} from "@/db/schema";
import { eq, inArray, asc, min, max, sql } from "drizzle-orm";
import type { Trip, TripStop } from "@/lib/trip-state/types";
import { optimizeStopOrder } from "@/lib/geo";

function regionToVariant(region: string | null): "napa" | "sonoma" | "both" {
  if (!region) return "both";
  const r = region.toLowerCase();
  const hasNapa = r.includes("napa");
  const hasSonoma = r.includes("sonoma");
  if (hasNapa && hasSonoma) return "both";
  if (r.includes("carneros")) return "both";
  if (hasNapa) return "napa";
  if (hasSonoma) return "sonoma";
  return "both";
}

function optimizeStops(
  stops: TripStop[],
  origin: { lat: number; lng: number } | null
): TripStop[] {
  const withCoords = stops.filter(
    (s): s is TripStop & { lat: number; lng: number } =>
      s.lat != null && s.lng != null
  );
  if (withCoords.length < 2) return stops;
  const coords = withCoords.map((s) => ({ lat: s.lat, lng: s.lng }));
  const order = optimizeStopOrder(coords, origin, origin);
  const orderedWithCoords = order.map((i) => withCoords[i]);
  const coordless = stops.filter((s) => s.lat == null || s.lng == null);
  return [...orderedWithCoords, ...coordless];
}

type WineryRow = {
  id: number;
  slug: string;
  name: string;
  city: string | null;
  lat: number | null;
  lng: number | null;
  heroImageUrl: string | null;
  googleRating: number | null;
  aggregateRating: number | null;
  priceLevel: number | null;
  dogFriendly: boolean | null;
  kidFriendly: boolean | null;
  picnicFriendly: boolean | null;
  sustainable: boolean | null;
  reservationRequired: boolean | null;
  dogFriendlySource: string | null;
  kidFriendlySource: string | null;
  picnicFriendlySource: string | null;
  sustainableSource: string | null;
  subRegion: string | null;
  subRegionSlug: string | null;
  valley: string | null;
  hoursJson: string | null;
  visitUrl: string | null;
  websiteUrl: string | null;
  curated: boolean;
  lastScrapedAt: string | null;
};

async function fetchWineryRows(ids: number[]): Promise<Map<number, WineryRow>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      city: wineries.city,
      lat: wineries.lat,
      lng: wineries.lng,
      heroImageUrl: wineries.heroImageUrl,
      googleRating: wineries.googleRating,
      aggregateRating: wineries.aggregateRating,
      priceLevel: wineries.priceLevel,
      dogFriendly: wineries.dogFriendly,
      kidFriendly: wineries.kidFriendly,
      picnicFriendly: wineries.picnicFriendly,
      sustainable: wineries.sustainableFarming,
      reservationRequired: wineries.reservationRequired,
      dogFriendlySource: wineries.dogFriendlySource,
      kidFriendlySource: wineries.kidFriendlySource,
      picnicFriendlySource: wineries.picnicFriendlySource,
      sustainableSource: wineries.sustainableSource,
      subRegion: subRegions.name,
      subRegionSlug: subRegions.slug,
      valley: subRegions.valley,
      hoursJson: wineries.hoursJson,
      visitUrl: wineries.visitUrl,
      websiteUrl: wineries.websiteUrl,
      curated: wineries.curated,
      lastScrapedAt: wineries.lastScrapedAt,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(inArray(wineries.id, ids));

  const map = new Map<number, WineryRow>();
  for (const row of rows) {
    map.set(row.id, {
      ...row,
      curated: row.curated ?? false,
    } as WineryRow);
  }
  return map;
}

async function fetchTastingInfo(ids: number[]) {
  if (ids.length === 0) {
    return { prices: new Map(), durations: new Map() };
  }
  const rows = await db
    .select({
      wineryId: tastingExperiences.wineryId,
      minPrice: min(tastingExperiences.price),
      maxPrice: max(tastingExperiences.price),
      avgDuration: sql<number>`COALESCE(AVG(${tastingExperiences.durationMinutes}), 60)`.as(
        "avg_duration"
      ),
    })
    .from(tastingExperiences)
    .where(inArray(tastingExperiences.wineryId, ids))
    .groupBy(tastingExperiences.wineryId);

  const prices = new Map<
    number,
    { min: number | null; max: number | null }
  >();
  const durations = new Map<number, number>();
  for (const r of rows) {
    prices.set(r.wineryId, { min: r.minPrice ?? null, max: r.maxPrice ?? null });
    durations.set(r.wineryId, Math.round(r.avgDuration));
  }
  return { prices, durations };
}

function toTripStop(
  row: WineryRow,
  price: { min: number | null; max: number | null } | undefined,
  duration: number | undefined,
  notes: string | null,
  suggestedDuration: number | null,
  isFeatured = false,
  valleyVariant: "napa" | "sonoma" | "both" = "both"
): TripStop {
  return {
    wineryId: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    lat: row.lat,
    lng: row.lng,
    heroImageUrl: row.heroImageUrl,
    googleRating: row.googleRating,
    aggregateRating: row.aggregateRating,
    priceLevel: row.priceLevel,
    subRegion: row.subRegion,
    subRegionSlug: row.subRegionSlug,
    valley: row.valley,
    hoursJson: row.hoursJson,
    visitUrl: row.visitUrl,
    websiteUrl: row.websiteUrl,
    dogFriendly: row.dogFriendly,
    kidFriendly: row.kidFriendly,
    picnicFriendly: row.picnicFriendly,
    sustainable: row.sustainable,
    reservationRequired: row.reservationRequired,
    dogFriendlySource: row.dogFriendlySource,
    kidFriendlySource: row.kidFriendlySource,
    picnicFriendlySource: row.picnicFriendlySource,
    sustainableSource: row.sustainableSource,
    curated: row.curated,
    isFeatured,
    valleyVariant,
    notes,
    suggestedDurationMinutes: suggestedDuration,
    tasting: price ?? null,
    tastingDurationMinutes: suggestedDuration ?? duration ?? 60,
    lastScrapedAt: row.lastScrapedAt,
  };
}

export async function loadCuratedTrip(slug: string): Promise<Trip | null> {
  // Explicit column list keeps the query resilient if new columns haven't
  // been migrated yet — we try the full set first, then retry with pre-
  // migration columns on a SQL error.
  type RouteRow = {
    id: number;
    slug: string;
    title: string;
    description: string | null;
    region: string | null;
    theme: string | null;
    estimatedHours: number | null;
    heroImageUrl: string | null;
    groupVibe: string | null;
    duration: string | null;
    editorialPull: string | null;
  };

  let route: RouteRow | undefined;
  try {
    const rows = await db
      .select({
        id: dayTripRoutes.id,
        slug: dayTripRoutes.slug,
        title: dayTripRoutes.title,
        description: dayTripRoutes.description,
        region: dayTripRoutes.region,
        theme: dayTripRoutes.theme,
        estimatedHours: dayTripRoutes.estimatedHours,
        heroImageUrl: dayTripRoutes.heroImageUrl,
        groupVibe: dayTripRoutes.groupVibe,
        duration: dayTripRoutes.duration,
        editorialPull: dayTripRoutes.editorialPull,
      })
      .from(dayTripRoutes)
      .where(eq(dayTripRoutes.slug, slug))
      .limit(1);
    route = rows[0];
  } catch (err) {
    console.warn(
      "[load-trip] Falling back to pre-migration dayTripRoutes query. Run `npm run db:push` to apply migration 0013.",
      err
    );
    const rows = await db
      .select({
        id: dayTripRoutes.id,
        slug: dayTripRoutes.slug,
        title: dayTripRoutes.title,
        description: dayTripRoutes.description,
        region: dayTripRoutes.region,
        theme: dayTripRoutes.theme,
        estimatedHours: dayTripRoutes.estimatedHours,
      })
      .from(dayTripRoutes)
      .where(eq(dayTripRoutes.slug, slug))
      .limit(1);
    if (rows[0]) {
      route = {
        ...rows[0],
        heroImageUrl: null,
        groupVibe: null,
        duration: null,
        editorialPull: null,
      };
    }
  }

  if (!route) return null;

  let stopRows: {
    wineryId: number;
    stopOrder: number;
    notes: string | null;
    suggestedDuration: number | null;
    isFeatured: boolean | null;
    valleyVariant: "napa" | "sonoma" | "both" | null;
  }[];
  try {
    stopRows = await db
      .select({
        wineryId: dayTripStops.wineryId,
        stopOrder: dayTripStops.stopOrder,
        notes: dayTripStops.notes,
        suggestedDuration: dayTripStops.suggestedDuration,
        isFeatured: dayTripStops.isFeatured,
        valleyVariant: dayTripStops.valleyVariant,
      })
      .from(dayTripStops)
      .where(eq(dayTripStops.routeId, route.id))
      .orderBy(asc(dayTripStops.stopOrder));
  } catch {
    // Pre-0014/0015 schema fallback — is_featured or valley_variant columns not yet applied.
    const rows = await db
      .select({
        wineryId: dayTripStops.wineryId,
        stopOrder: dayTripStops.stopOrder,
        notes: dayTripStops.notes,
        suggestedDuration: dayTripStops.suggestedDuration,
      })
      .from(dayTripStops)
      .where(eq(dayTripStops.routeId, route.id))
      .orderBy(asc(dayTripStops.stopOrder));
    stopRows = rows.map((r) => ({
      ...r,
      isFeatured: false,
      valleyVariant: "both" as const,
    }));
  }

  const wineryIds = stopRows.map((s) => s.wineryId);
  const [wineryMap, tastingInfo] = await Promise.all([
    fetchWineryRows(wineryIds),
    fetchTastingInfo(wineryIds),
  ]);

  const allStops: TripStop[] = stopRows
    .map((s) => {
      const w = wineryMap.get(s.wineryId);
      if (!w) return null;
      return toTripStop(
        w,
        tastingInfo.prices.get(s.wineryId),
        tastingInfo.durations.get(s.wineryId),
        s.notes,
        s.suggestedDuration,
        s.isFeatured ?? false,
        s.valleyVariant ?? "both"
      );
    })
    .filter((s): s is TripStop => s !== null);

  // Which variants have at least one stop — drives the toggle's enabled options.
  const variantSet = new Set<"napa" | "sonoma" | "both">();
  for (const s of allStops) variantSet.add(s.valleyVariant);
  const availableVariants: ("napa" | "sonoma" | "both")[] = ["napa", "sonoma", "both"].filter(
    (v): v is "napa" | "sonoma" | "both" => variantSet.has(v as "napa" | "sonoma" | "both")
  );

  // Default variant: prefer the route's native region, fall back to whatever variant has stops.
  const regionHint = regionToVariant(route.region);
  const activeVariant: "napa" | "sonoma" | "both" =
    availableVariants.includes(regionHint)
      ? regionHint
      : availableVariants[0] ?? "both";

  const editorialStops = allStops.filter((s) => s.valleyVariant === activeVariant);
  const editorialStopOrder = editorialStops.map((s) => s.wineryId);
  const stops = optimizeStops(editorialStops, null);

  const lastScrapedAt = stops.reduce<string | null>((latest, s) => {
    if (!s.lastScrapedAt) return latest;
    if (!latest || s.lastScrapedAt > latest) return s.lastScrapedAt;
    return latest;
  }, null);

  const duration =
    route.duration === "half" ||
    route.duration === "full" ||
    route.duration === "weekend"
      ? route.duration
      : null;

  return {
    id: null,
    shareCode: null,
    name: route.title,
    slug: route.slug,
    forkedFromRouteId: route.id,
    theme: route.theme ?? null,
    valley: route.region ?? null,
    groupVibe: route.groupVibe,
    duration,
    heroImageUrl: route.heroImageUrl ?? stops[0]?.heroImageUrl ?? null,
    editorialPull: route.editorialPull ?? route.description ?? null,
    origin: null,
    stops,
    editorialStopOrder,
    availableVariants,
    activeVariant,
    allCuratedStops: allStops,
    source: "curated",
    isEditable: false,
    lastScrapedAt,
  };
}

async function loadStopsForTrip(
  stopRows: { wineryId: number; stopOrder: number; notes: string | null }[]
): Promise<TripStop[]> {
  const wineryIds = stopRows.map((s) => s.wineryId);
  const [wineryMap, tastingInfo] = await Promise.all([
    fetchWineryRows(wineryIds),
    fetchTastingInfo(wineryIds),
  ]);

  return stopRows
    .sort((a, b) => a.stopOrder - b.stopOrder)
    .map((s) => {
      const w = wineryMap.get(s.wineryId);
      if (!w) return null;
      return toTripStop(
        w,
        tastingInfo.prices.get(s.wineryId),
        tastingInfo.durations.get(s.wineryId),
        s.notes,
        null
      );
    })
    .filter((s): s is TripStop => s !== null);
}

async function fetchEditorialOrder(routeId: number | null): Promise<number[] | null> {
  if (!routeId) return null;
  const rows = await db
    .select({ wineryId: dayTripStops.wineryId })
    .from(dayTripStops)
    .where(eq(dayTripStops.routeId, routeId))
    .orderBy(asc(dayTripStops.stopOrder));
  return rows.length > 0 ? rows.map((r) => r.wineryId) : null;
}

export async function loadTripByShareCode(
  shareCode: string
): Promise<Trip | null> {
  const [saved] = await db
    .select()
    .from(savedTrips)
    .where(eq(savedTrips.shareCode, shareCode))
    .limit(1);

  if (saved) {
    const stopRows = await db
      .select({
        wineryId: savedTripStops.wineryId,
        stopOrder: savedTripStops.stopOrder,
        notes: savedTripStops.notes,
      })
      .from(savedTripStops)
      .where(eq(savedTripStops.tripId, saved.id));

    const stops = await loadStopsForTrip(stopRows);
    const editorialStopOrder = await fetchEditorialOrder(
      saved.forkedFromRouteId ?? null
    );
    const lastScrapedAt = stops.reduce<string | null>((latest, s) => {
      if (!s.lastScrapedAt) return latest;
      if (!latest || s.lastScrapedAt > latest) return s.lastScrapedAt;
      return latest;
    }, null);

    return {
      id: saved.id,
      shareCode: saved.shareCode ?? null,
      name: saved.name,
      slug: null,
      forkedFromRouteId: saved.forkedFromRouteId ?? null,
      theme: saved.theme ?? null,
      valley: saved.valley ?? null,
      groupVibe: null,
      duration: null,
      heroImageUrl: stops[0]?.heroImageUrl ?? null,
      editorialPull: null,
      origin:
        saved.originLat != null && saved.originLng != null
          ? {
              lat: saved.originLat,
              lng: saved.originLng,
              label: saved.originLabel ?? null,
            }
          : null,
      stops,
      editorialStopOrder,
      availableVariants: null,
      activeVariant: null,
      allCuratedStops: null,
      source: "saved",
      isEditable: true,
      lastScrapedAt,
    };
  }

  const [anon] = await db
    .select()
    .from(anonymousTrips)
    .where(eq(anonymousTrips.shareCode, shareCode))
    .limit(1);

  if (!anon) return null;

  const stopRows = await db
    .select({
      wineryId: anonymousTripStops.wineryId,
      stopOrder: anonymousTripStops.stopOrder,
      notes: anonymousTripStops.notes,
    })
    .from(anonymousTripStops)
    .where(eq(anonymousTripStops.tripId, anon.id));

  const stops = await loadStopsForTrip(stopRows);
  const editorialStopOrder = await fetchEditorialOrder(
    anon.forkedFromRouteId ?? null
  );
  const lastScrapedAt = stops.reduce<string | null>((latest, s) => {
    if (!s.lastScrapedAt) return latest;
    if (!latest || s.lastScrapedAt > latest) return s.lastScrapedAt;
    return latest;
  }, null);

  return {
    id: anon.id,
    shareCode: anon.shareCode,
    name: anon.name ?? "Your Wine Country trip",
    slug: null,
    forkedFromRouteId: anon.forkedFromRouteId ?? null,
    theme: anon.theme ?? null,
    valley: anon.valley ?? null,
    groupVibe: null,
    duration: null,
    heroImageUrl: stops[0]?.heroImageUrl ?? null,
    editorialPull: null,
    origin:
      anon.originLat != null && anon.originLng != null
        ? {
            lat: anon.originLat,
            lng: anon.originLng,
            label: anon.originLabel ?? null,
          }
        : null,
    stops,
    editorialStopOrder,
    availableVariants: null,
    activeVariant: null,
    allCuratedStops: null,
    source: "anonymous",
    isEditable: true,
    lastScrapedAt,
  };
}

export async function loadStopsByWineryIds(
  wineryIds: number[]
): Promise<TripStop[]> {
  if (wineryIds.length === 0) return [];
  const [wineryMap, tastingInfo] = await Promise.all([
    fetchWineryRows(wineryIds),
    fetchTastingInfo(wineryIds),
  ]);
  return wineryIds
    .map((id) => {
      const w = wineryMap.get(id);
      if (!w) return null;
      return toTripStop(
        w,
        tastingInfo.prices.get(id),
        tastingInfo.durations.get(id),
        null,
        null
      );
    })
    .filter((s): s is TripStop => s !== null);
}
