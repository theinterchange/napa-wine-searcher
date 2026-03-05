"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Shuffle, Loader2, Wine, MapPin, Navigation } from "lucide-react";
import { TripStopCard } from "./TripStopCard";
import { TripSummary } from "./TripSummary";
import type { WizardParams } from "./TripWizard";
import {
  computeSegments,
  buildGoogleMapsUrl,
  formatDistance,
  formatDriveTime,
} from "@/lib/geo";

export interface RouteStop {
  id: number;
  slug: string;
  name: string;
  city: string | null;
  lat: number | null;
  lng: number | null;
  heroImageUrl: string | null;
  aggregateRating: number | null;
  googleRating: number | null;
  priceLevel: number | null;
  dogFriendly: boolean | null;
  kidFriendly: boolean | null;
  picnicFriendly: boolean | null;
  reservationRequired: boolean | null;
  subRegion: string | null;
  subRegionSlug: string | null;
  valley: string | null;
  tasting: { min: number | null; max: number | null } | null;
  segmentAfter: { miles: number; minutes: number } | null;
}

export interface Alternative {
  id: number;
  slug: string;
  name: string;
  city: string | null;
  lat: number | null;
  lng: number | null;
  heroImageUrl: string | null;
  aggregateRating: number | null;
  googleRating: number | null;
  priceLevel: number | null;
  subRegion: string | null;
  subRegionSlug: string | null;
  valley: string | null;
}

interface RouteSummary {
  totalMiles: number;
  totalDriveMinutes: number;
  totalTasteMinutes: number;
  totalMinCost: number;
  totalMaxCost: number;
  googleMapsUrl: string | null;
}

interface RouteResponse {
  stops: RouteStop[];
  alternatives: Record<number, Alternative[]>;
  summary: RouteSummary;
  route?: { title: string; slug: string; theme: string | null };
  originSegment?: { miles: number; minutes: number } | null;
  error?: string;
}

const THEMES = [
  { key: "", label: "All Styles" },
  { key: "dog-friendly", label: "Dog-Friendly" },
  { key: "kid-friendly", label: "Kid-Friendly" },
  { key: "picnic", label: "Picnic" },
  { key: "walk-in", label: "Walk-in" },
];

const STOP_COUNTS = [2, 3, 4, 5, 6];

interface TripPlannerProps {
  initialFrom?: string;
  initialTheme?: string;
  initialStops?: string;
  initialValley?: string;
  wizardParams?: WizardParams;
}

export function TripPlanner({
  initialFrom,
  initialTheme,
  initialStops,
  initialValley,
  wizardParams,
}: TripPlannerProps) {
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [alternatives, setAlternatives] = useState<Record<number, Alternative[]>>({});
  const [summary, setSummary] = useState<RouteSummary | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ title: string; slug: string; theme: string | null } | null>(null);
  const [originSegment, setOriginSegment] = useState<{ miles: number; minutes: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState(initialTheme || "");
  const [valley, setValley] = useState(initialValley || "");
  const [stopCount, setStopCount] = useState(4);
  const [savedWizardParams, setSavedWizardParams] = useState<WizardParams | undefined>(wizardParams);
  const skipCacheRef = useRef(false);

  const CACHE_KEY = "trip-planner-route";
  const CACHE_MAX_AGE = 30 * 60 * 1000; // 30 minutes

  const saveToCache = useCallback((data: {
    stops: RouteStop[];
    alternatives: Record<number, Alternative[]>;
    summary: RouteSummary;
    routeInfo: { title: string; slug: string; theme: string | null } | null;
    originSegment: { miles: number; minutes: number } | null;
  }) => {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, timestamp: Date.now() }));
    } catch {}
  }, []);

  const loadFromCache = useCallback((): boolean => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return false;
      const cached = JSON.parse(raw);
      if (Date.now() - cached.timestamp > CACHE_MAX_AGE) {
        sessionStorage.removeItem(CACHE_KEY);
        return false;
      }
      setStops(cached.stops);
      setAlternatives(cached.alternatives || {});
      setSummary(cached.summary);
      setRouteInfo(cached.routeInfo || null);
      setOriginSegment(cached.originSegment || null);
      setLoading(false);
      return true;
    } catch {
      return false;
    }
  }, []);

  const clearCache = useCallback(() => {
    try { sessionStorage.removeItem(CACHE_KEY); } catch {}
  }, []);

  const buildWizardQueryParams = useCallback((wp: WizardParams): Record<string, string> => {
    const params: Record<string, string> = {};
    if (wp.originLat != null && wp.originLng != null) {
      params.originLat = String(wp.originLat);
      params.originLng = String(wp.originLng);
    }
    if (wp.dayOfWeek) params.dayOfWeek = wp.dayOfWeek;
    if (wp.wineTypes && wp.wineTypes.length > 0) params.wineTypes = wp.wineTypes.join(",");
    if (wp.priceLevels && wp.priceLevels.length > 0) params.priceLevels = wp.priceLevels.join(",");
    if (wp.amenities && wp.amenities.length > 0) params.amenities = wp.amenities.join(",");
    if (wp.timeBudget) params.timeBudget = wp.timeBudget;
    if (wp.anchorIds && wp.anchorIds.length > 0) params.anchorIds = wp.anchorIds.join(",");
    return params;
  }, []);

  const fetchRoute = useCallback(
    async (params: Record<string, string>) => {
      setLoading(true);
      setError(null);
      try {
        const sp = new URLSearchParams(params);
        const res = await fetch(`/api/routes/generate?${sp.toString()}`);
        const data: RouteResponse = await res.json();
        if (data.error && (!data.stops || data.stops.length === 0)) {
          setError(data.error);
          setStops([]);
          setSummary(null);
          setOriginSegment(null);
        } else {
          setStops(data.stops);
          setAlternatives(data.alternatives || {});
          setSummary(data.summary);
          setRouteInfo(data.route || null);
          setOriginSegment(data.originSegment || null);
          saveToCache({
            stops: data.stops,
            alternatives: data.alternatives || {},
            summary: data.summary,
            routeInfo: data.route || null,
            originSegment: data.originSegment || null,
          });
        }
      } catch {
        setError("Failed to generate route. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial load — try cache first
  useEffect(() => {
    if (!skipCacheRef.current && loadFromCache()) return;
    skipCacheRef.current = false;

    if (initialFrom) {
      fetchRoute({ from: initialFrom });
    } else if (initialStops) {
      fetchRoute({ stopIds: initialStops });
    } else {
      const baseParams: Record<string, string> = {
        theme: initialTheme || "",
        valley: initialValley || "",
      };
      // If wizard params include timeBudget, don't pass manual stop count
      if (savedWizardParams?.timeBudget) {
        // stop count derived from timeBudget
      } else {
        baseParams.stops = String(stopCount);
      }
      if (savedWizardParams) {
        Object.assign(baseParams, buildWizardQueryParams(savedWizardParams));
      }
      fetchRoute(baseParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update wizard params when prop changes
  useEffect(() => {
    if (wizardParams) {
      setSavedWizardParams(wizardParams);
    }
  }, [wizardParams]);

  const handleShuffle = () => {
    clearCache();
    const excludeIds = stops.map((s) => s.id).join(",");
    const params: Record<string, string> = {
      theme,
      valley,
      excludeIds,
    };
    if (savedWizardParams?.timeBudget) {
      // stop count derived from timeBudget
    } else {
      params.stops = String(stopCount);
    }
    if (savedWizardParams) {
      Object.assign(params, buildWizardQueryParams(savedWizardParams));
    }
    fetchRoute(params);
  };

  const handleGenerate = () => {
    clearCache();
    const params: Record<string, string> = {
      theme,
      valley,
    };
    if (savedWizardParams?.timeBudget) {
      // stop count derived from timeBudget
    } else {
      params.stops = String(stopCount);
    }
    if (savedWizardParams) {
      Object.assign(params, buildWizardQueryParams(savedWizardParams));
    }
    fetchRoute(params);
  };

  const handleSwap = (stopId: number, newWinery: Alternative) => {
    setStops((prev) => {
      const updated = prev.map((s) =>
        s.id === stopId
          ? {
              ...s,
              id: newWinery.id,
              slug: newWinery.slug,
              name: newWinery.name,
              city: newWinery.city,
              lat: newWinery.lat,
              lng: newWinery.lng,
              heroImageUrl: newWinery.heroImageUrl,
              aggregateRating: newWinery.aggregateRating,
              googleRating: newWinery.googleRating,
              priceLevel: newWinery.priceLevel,
              subRegion: newWinery.subRegion,
              subRegionSlug: newWinery.subRegionSlug,
              valley: newWinery.valley,
            }
          : s
      );
      // Recalculate segments
      const segments = computeSegments(updated);
      return updated.map((s, i) => ({
        ...s,
        segmentAfter: segments[i] || null,
      }));
    });

    // Recalculate summary
    setTimeout(() => {
      setStops((current) => {
        recalcSummary(current);
        return current;
      });
    }, 0);
  };

  const handleRemove = (stopId: number) => {
    setStops((prev) => {
      const updated = prev.filter((s) => s.id !== stopId);
      const segments = computeSegments(updated);
      return updated.map((s, i) => ({
        ...s,
        segmentAfter: segments[i] || null,
      }));
    });

    setTimeout(() => {
      setStops((current) => {
        recalcSummary(current);
        return current;
      });
    }, 0);
  };

  const recalcSummary = (currentStops: RouteStop[]) => {
    const originCoords = savedWizardParams?.originLat != null && savedWizardParams?.originLng != null
      ? { lat: savedWizardParams.originLat, lng: savedWizardParams.originLng }
      : null;

    const segmentStops = originCoords
      ? [originCoords, ...currentStops]
      : currentStops;
    const segments = computeSegments(segmentStops);
    const totalMiles = segments.reduce((s, seg) => s + seg.miles, 0);
    const totalDriveMinutes = segments.reduce((s, seg) => s + seg.minutes, 0);
    const totalTasteMinutes = currentStops.length * 60;
    let totalMinCost = 0;
    let totalMaxCost = 0;
    for (const stop of currentStops) {
      if (stop.tasting?.min != null) {
        totalMinCost += stop.tasting.min;
        totalMaxCost += stop.tasting.max ?? stop.tasting.min;
      }
    }

    if (originCoords) {
      setOriginSegment(segments[0] || null);
    }

    const googleMapsUrl = buildGoogleMapsUrl(
      currentStops.map((s) => ({ lat: s.lat, lng: s.lng, name: s.name })),
      originCoords
    );
    setSummary({
      totalMiles: Math.round(totalMiles * 10) / 10,
      totalDriveMinutes: Math.round(totalDriveMinutes),
      totalTasteMinutes,
      totalMinCost: Math.round(totalMinCost),
      totalMaxCost: Math.round(totalMaxCost),
      googleMapsUrl,
    });
  };

  const hasOrigin = savedWizardParams?.originLat != null && savedWizardParams?.originLng != null;

  return (
    <div>
      {/* Controls */}
      <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex flex-wrap items-end gap-4">
          {/* Theme pills */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-2">Style</label>
            <div className="flex flex-wrap gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTheme(t.key)}
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    theme === t.key
                      ? "bg-burgundy-700 text-white"
                      : "border border-[var(--border)] hover:border-burgundy-400 dark:hover:border-burgundy-600"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Valley */}
          <div>
            <label className="block text-sm font-medium mb-2">Valley</label>
            <select
              value={valley}
              onChange={(e) => setValley(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm"
            >
              <option value="">Both</option>
              <option value="napa">Napa</option>
              <option value="sonoma">Sonoma</option>
            </select>
          </div>

          {/* Stop count — hidden when timeBudget controls it */}
          {!savedWizardParams?.timeBudget && (
            <div>
              <label className="block text-sm font-medium mb-2">Stops</label>
              <div className="flex gap-1">
                {STOP_COUNTS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setStopCount(n)}
                    className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                      stopCount === n
                        ? "bg-burgundy-700 text-white"
                        : "border border-[var(--border)] hover:border-burgundy-400 dark:hover:border-burgundy-600"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-burgundy-700 px-4 py-2 text-sm font-medium text-white hover:bg-burgundy-800 disabled:opacity-50 transition-colors"
            >
              Generate Route
            </button>
            <button
              onClick={handleShuffle}
              disabled={loading || stops.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:border-burgundy-400 dark:hover:border-burgundy-600 disabled:opacity-50 transition-colors"
            >
              <Shuffle className="h-4 w-4" />
              Shuffle
            </button>
          </div>
        </div>

        {/* Wizard preferences summary */}
        {savedWizardParams && (
          <div className="mt-3 pt-3 border-t border-[var(--border)]">
            <div className="flex flex-wrap gap-2 text-xs text-[var(--muted-foreground)]">
              <span className="font-medium text-[var(--foreground)]">Preferences:</span>
              {savedWizardParams.originLabel && (
                <span className="inline-flex items-center gap-1 rounded-full bg-burgundy-50 dark:bg-burgundy-950/30 px-2 py-0.5 text-burgundy-700 dark:text-burgundy-400">
                  <MapPin className="h-3 w-3" /> {savedWizardParams.originLabel}
                </span>
              )}
              {savedWizardParams.dayOfWeek && (
                <span className="rounded-full bg-burgundy-50 dark:bg-burgundy-950/30 px-2 py-0.5 text-burgundy-700 dark:text-burgundy-400">
                  {savedWizardParams.dayOfWeek.charAt(0).toUpperCase() + savedWizardParams.dayOfWeek.slice(1)}
                </span>
              )}
              {savedWizardParams.wineTypes && savedWizardParams.wineTypes.length > 0 && (
                <span className="rounded-full bg-burgundy-50 dark:bg-burgundy-950/30 px-2 py-0.5 text-burgundy-700 dark:text-burgundy-400">
                  {savedWizardParams.wineTypes.join(", ")}
                </span>
              )}
              {savedWizardParams.amenities && savedWizardParams.amenities.length > 0 && (
                <span className="rounded-full bg-burgundy-50 dark:bg-burgundy-950/30 px-2 py-0.5 text-burgundy-700 dark:text-burgundy-400">
                  {savedWizardParams.amenities.map((a) => {
                    const labels: Record<string, string> = { dog: "Dog-Friendly", kid: "Kid-Friendly", picnic: "Picnic", walkin: "Walk-in" };
                    return labels[a] || a;
                  }).join(", ")}
                </span>
              )}
              {savedWizardParams.priceLevels && savedWizardParams.priceLevels.length > 0 && (
                <span className="rounded-full bg-burgundy-50 dark:bg-burgundy-950/30 px-2 py-0.5 text-burgundy-700 dark:text-burgundy-400">
                  {savedWizardParams.priceLevels.sort((a, b) => a - b).map((l) => "$".repeat(l)).join(", ")}
                </span>
              )}
              {savedWizardParams.timeBudget && (
                <span className="rounded-full bg-burgundy-50 dark:bg-burgundy-950/30 px-2 py-0.5 text-burgundy-700 dark:text-burgundy-400">
                  {savedWizardParams.timeBudget === "half" ? "Half day" : savedWizardParams.timeBudget === "full" ? "Full day" : "Extended"}
                </span>
              )}
              {savedWizardParams.anchorNames && savedWizardParams.anchorNames.length > 0 && (
                <span className="rounded-full bg-burgundy-50 dark:bg-burgundy-950/30 px-2 py-0.5 text-burgundy-700 dark:text-burgundy-400">
                  Must-visit: {savedWizardParams.anchorNames.join(", ")}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-burgundy-600 dark:text-burgundy-400" />
          <span className="ml-3 text-[var(--muted-foreground)]">
            Building your route...
          </span>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="text-center py-16">
          <Wine className="h-12 w-12 mx-auto text-[var(--muted-foreground)] mb-4" />
          <p className="text-lg text-[var(--muted-foreground)]">{error}</p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Try different filters or a different style.
          </p>
        </div>
      )}

      {/* Route display */}
      {!loading && !error && stops.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stops list */}
          <div className="lg:col-span-2">
            {routeInfo && (
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Based on: <strong>{routeInfo.title}</strong>
              </p>
            )}
            <div className="space-y-0">
              {/* Origin pseudo-stop */}
              {hasOrigin && (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-burgundy-300 dark:border-burgundy-700 bg-burgundy-50/50 dark:bg-burgundy-950/20 mb-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-burgundy-100 dark:bg-burgundy-900/50 text-burgundy-700 dark:text-burgundy-400">
                      <Navigation className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Start: {savedWizardParams?.originLabel || "Your Location"}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Starting point
                      </p>
                    </div>
                  </div>
                  {/* Driving segment from origin to first stop */}
                  {originSegment && (
                    <div className="flex items-center gap-2 py-2 pl-8">
                      <div className="h-6 border-l-2 border-dashed border-burgundy-300 dark:border-burgundy-700" />
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {formatDistance(originSegment.miles)} &middot;{" "}
                        {formatDriveTime(originSegment.minutes)} drive
                      </span>
                    </div>
                  )}
                </>
              )}

              {stops.map((stop, idx) => (
                <TripStopCard
                  key={stop.id}
                  stop={stop}
                  index={idx}
                  total={stops.length}
                  alternatives={alternatives[stop.id] || []}
                  onSwap={handleSwap}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </div>

          {/* Summary sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {summary && (
                <TripSummary
                  summary={summary}
                  stopIds={stops.map((s) => s.id)}
                  theme={theme || routeInfo?.theme || undefined}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
