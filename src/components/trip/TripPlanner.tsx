"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Shuffle, Loader2, Wine, MapPin, Navigation, Clock, Flag, Pencil, Sparkles } from "lucide-react";
import { TripStopCard } from "./TripStopCard";
import { TripSummary } from "./TripSummary";
import { WineryPreviewPanel } from "./WineryPreviewPanel";
import type { WizardParams } from "./TripWizard";
import type { HomeBase } from "@/app/plan-trip/PlanTripClient";
import {
  computeSegments,
  buildGoogleMapsUrl,
  formatDriveTime,
  formatDriveTimeRange,
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
  tastingDurationMinutes?: number;
  segmentAfter: { miles: number; minutes: number } | null;
  matchReasons?: string[];
  visitUrl?: string | null;
  hoursJson?: string | null;
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
  dogFriendly: boolean | null;
  kidFriendly: boolean | null;
  picnicFriendly: boolean | null;
  reservationRequired: boolean | null;
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
  endSegment?: { miles: number; minutes: number } | null;
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

export interface ScheduleEntry {
  arriveAt: string;
  departAt: string;
}

const START_TIME_OPTIONS = [
  { value: "09:00", label: "9:00 AM" },
  { value: "09:30", label: "9:30 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "10:30", label: "10:30 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "11:30", label: "11:30 AM" },
  { value: "12:00", label: "12:00 PM" },
];

function formatTimeFromMinutes(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const mins = Math.round(totalMinutes % 60);
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
  return `${hours12}:${mins.toString().padStart(2, "0")} ${period}`;
}

function roundToHalfHour(minutes: number): number {
  return Math.round(minutes / 30) * 30;
}

function computeSchedule(
  startTimeStr: string,
  stops: RouteStop[],
  originSegment: { miles: number; minutes: number } | null,
  endSegment: { miles: number; minutes: number } | null,
): { stops: ScheduleEntry[]; endArrival: string | null } {
  const [h, m] = startTimeStr.split(":").map(Number);
  let clock = h * 60 + m;

  // Drive from origin to first stop
  if (originSegment) {
    clock += originSegment.minutes;
  }

  const entries: ScheduleEntry[] = [];
  for (let i = 0; i < stops.length; i++) {
    clock = roundToHalfHour(clock);
    const arriveAt = formatTimeFromMinutes(clock);
    // Minimum 75 min per stop: 60-90 min tasting + buffer to explore/leave
    const rawDuration = stops[i].tastingDurationMinutes || 75;
    const duration = Math.max(rawDuration, 75);
    clock += duration;
    clock = roundToHalfHour(clock);
    const departAt = formatTimeFromMinutes(clock);
    entries.push({ arriveAt, departAt });

    // Drive to next stop
    if (stops[i].segmentAfter && i < stops.length - 1) {
      clock += stops[i].segmentAfter!.minutes;
    }
  }

  // Drive to end
  let endArrival: string | null = null;
  if (endSegment) {
    clock += endSegment.minutes;
    clock = roundToHalfHour(clock);
    endArrival = formatTimeFromMinutes(clock);
  }

  return { stops: entries, endArrival };
}

interface TripPlannerProps {
  initialFrom?: string;
  initialTheme?: string;
  initialStops?: string;
  initialValley?: string;
  wizardParams?: WizardParams;
  homeBase?: HomeBase | null;
  onOpenWizard?: () => void;
  onEditPreference?: (step: number) => void;
}

export function TripPlanner({
  initialFrom,
  initialTheme,
  initialStops,
  initialValley,
  wizardParams,
  homeBase,
  onOpenWizard,
  onEditPreference,
}: TripPlannerProps) {
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [alternatives, setAlternatives] = useState<Record<number, Alternative[]>>({});
  const [summary, setSummary] = useState<RouteSummary | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ title: string; slug: string; theme: string | null } | null>(null);
  const [originSegment, setOriginSegment] = useState<{ miles: number; minutes: number } | null>(null);
  const [endSegment, setEndSegment] = useState<{ miles: number; minutes: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState(initialTheme || "");
  const [valley, setValley] = useState(initialValley || "");
  const [stopCount, setStopCount] = useState(() => {
    // When loading pre-selected wineries, match the stop count to actual selections
    if (initialStops) {
      const count = initialStops.split(",").filter(Boolean).length;
      return Math.max(2, Math.min(count, 6));
    }
    return 4;
  });
  const [savedWizardParams, setSavedWizardParams] = useState<WizardParams | undefined>(wizardParams);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const hasPreselectedStops = Boolean(initialStops);
  const [startTime, setStartTime] = useState("10:00");
  const skipCacheRef = useRef(false);

  const CACHE_KEY = "trip-planner-route";
  const CACHE_MAX_AGE = 30 * 60 * 1000; // 30 minutes

  const saveToCache = useCallback((data: {
    stops: RouteStop[];
    alternatives: Record<number, Alternative[]>;
    summary: RouteSummary;
    routeInfo: { title: string; slug: string; theme: string | null } | null;
    originSegment: { miles: number; minutes: number } | null;
    endSegment: { miles: number; minutes: number } | null;
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
      setEndSegment(cached.endSegment || null);
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
    if (wp.endLat != null && wp.endLng != null) {
      params.endLat = String(wp.endLat);
      params.endLng = String(wp.endLng);
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
          setEndSegment(null);
        } else {
          setStops(data.stops);
          setAlternatives(data.alternatives || {});
          setSummary(data.summary);
          setRouteInfo(data.route || null);
          setOriginSegment(data.originSegment || null);
          setEndSegment(data.endSegment || null);
          saveToCache({
            stops: data.stops,
            alternatives: data.alternatives || {},
            summary: data.summary,
            routeInfo: data.route || null,
            originSegment: data.originSegment || null,
            endSegment: data.endSegment || null,
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

  // Initial load — try cache first (skip cache when wizard params or preselected stops are present)
  useEffect(() => {
    if (!skipCacheRef.current && !wizardParams && !initialStops && loadFromCache()) return;
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
    const endCoords = savedWizardParams?.endLat != null && savedWizardParams?.endLng != null
      ? { lat: savedWizardParams.endLat, lng: savedWizardParams.endLng }
      : null;

    const segmentStops = [
      ...(originCoords ? [originCoords] : []),
      ...currentStops,
      ...(endCoords ? [endCoords] : []),
    ];
    const segments = computeSegments(segmentStops);
    const totalMiles = segments.reduce((s, seg) => s + seg.miles, 0);
    const totalDriveMinutes = segments.reduce((s, seg) => s + seg.minutes, 0);
    const totalTasteMinutes = currentStops.reduce((sum, s) => sum + Math.max(s.tastingDurationMinutes || 75, 75), 0);
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
    if (endCoords) {
      setEndSegment(segments[segments.length - 1] || null);
    } else {
      setEndSegment(null);
    }

    const googleMapsUrl = buildGoogleMapsUrl(
      currentStops.map((s) => ({ lat: s.lat, lng: s.lng, name: s.name })),
      originCoords,
      endCoords
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
  const hasEnd = savedWizardParams?.endLat != null && savedWizardParams?.endLng != null;

  // Compute suggested schedule based on start time + drive/tasting durations
  const schedule = useMemo(() => {
    if (stops.length === 0) return null;
    return computeSchedule(startTime, stops, originSegment, endSegment);
  }, [startTime, stops, originSegment, endSegment]);

  // Compute route centroid for nearby accommodations
  const routeCentroid = useMemo(() => {
    const valid = stops.filter((s) => s.lat != null && s.lng != null);
    if (valid.length === 0) return null;
    const avgLat = valid.reduce((sum, s) => sum + s.lat!, 0) / valid.length;
    const avgLng = valid.reduce((sum, s) => sum + s.lng!, 0) / valid.length;
    return { lat: avgLat, lng: avgLng };
  }, [stops]);

  return (
    <div>
      {/* Controls */}
      <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
        {hasPreselectedStops ? (
          /* Simplified controls when wineries were pre-selected via "Add to trip" */
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                Your selected wineries ({stops.length || initialStops?.split(",").filter(Boolean).length || 0})
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Route optimized by driving distance. Swap or remove stops below.
              </p>
            </div>
            <div className="flex items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Start Time</label>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm"
                >
                  {START_TIME_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              {onOpenWizard && (
                <button
                  onClick={onOpenWizard}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-1.5 text-sm font-medium hover:border-[var(--foreground)]/30 transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  Build My Perfect Trip
                </button>
              )}
            </div>
          </div>
        ) : (
        <>
        {/* Row 1: Style pills */}
        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Style</label>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {THEMES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors border ${
                  theme === t.key
                    ? "border-[var(--foreground)] bg-burgundy-900 text-white font-medium"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]/30"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Settings */}
        <div className="flex flex-wrap items-end gap-3 sm:gap-4 mt-4 pt-4 border-t border-[var(--border)]">
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Valley</label>
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

          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Start Time</label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm"
            >
              {START_TIME_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {!savedWizardParams?.timeBudget && (
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Stops</label>
              <div className="flex gap-1">
                {STOP_COUNTS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setStopCount(n)}
                    className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors border ${
                      stopCount === n
                        ? "border-[var(--foreground)] bg-burgundy-900 text-white"
                        : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--foreground)]/30"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Row 3: Actions + Personalize */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-[var(--border)]">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-burgundy-900 px-4 py-2 text-sm font-medium text-white hover:bg-burgundy-800 disabled:opacity-50 transition-colors"
          >
            Generate Route
          </button>
          <button
            onClick={handleShuffle}
            disabled={loading || stops.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:border-[var(--foreground)]/30 disabled:opacity-50 transition-colors"
          >
            <Shuffle className="h-4 w-4" />
            Shuffle
          </button>
          {onOpenWizard && (
            <button
              onClick={onOpenWizard}
              className="ml-auto inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium hover:border-[var(--foreground)]/30 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Build My Perfect Trip
            </button>
          )}
        </div>
        </>
        )}

        {/* Wizard preferences summary */}
        {savedWizardParams && (
          <div className="mt-3 pt-3 border-t border-[var(--border)] overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex flex-nowrap sm:flex-wrap gap-2 text-xs text-[var(--muted-foreground)]">
              <span className="inline-flex items-center gap-1 font-medium text-[var(--foreground)]">
                Preferences <Pencil className="h-3 w-3 text-[var(--muted-foreground)]" />
              </span>
              {savedWizardParams.originLabel && (
                <button onClick={() => onEditPreference?.(1)} className={`inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-0.5 text-[var(--muted-foreground)]${onEditPreference ? " cursor-pointer hover:border-[var(--foreground)]/30" : ""}`}>
                  <MapPin className="h-3 w-3" /> {savedWizardParams.originLabel}
                  {savedWizardParams.originAddress && (
                    <span className="text-[var(--muted-foreground)]"> · {savedWizardParams.originAddress}</span>
                  )}
                </button>
              )}
              {savedWizardParams.endLabel && (
                <button onClick={() => onEditPreference?.(2)} className={`inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-0.5 text-[var(--muted-foreground)]${onEditPreference ? " cursor-pointer hover:border-[var(--foreground)]/30" : ""}`}>
                  <Flag className="h-3 w-3" /> {savedWizardParams.endLabel}
                  {savedWizardParams.endAddress && (
                    <span className="text-[var(--muted-foreground)]"> · {savedWizardParams.endAddress}</span>
                  )}
                </button>
              )}
              {savedWizardParams.dayOfWeek && (
                <button onClick={() => onEditPreference?.(3)} className={`inline-flex items-center rounded-full border border-[var(--border)] px-2 py-0.5 text-[var(--muted-foreground)]${onEditPreference ? " cursor-pointer hover:border-[var(--foreground)]/30" : ""}`}>
                  {savedWizardParams.dayOfWeek.split(",").map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}
                </button>
              )}
              {savedWizardParams.wineTypes && savedWizardParams.wineTypes.length > 0 && (
                <button onClick={() => onEditPreference?.(4)} className={`inline-flex items-center rounded-full border border-[var(--border)] px-2 py-0.5 text-[var(--muted-foreground)]${onEditPreference ? " cursor-pointer hover:border-[var(--foreground)]/30" : ""}`}>
                  {savedWizardParams.wineTypes.join(", ")}
                </button>
              )}
              {savedWizardParams.amenities && savedWizardParams.amenities.length > 0 && (
                <button onClick={() => onEditPreference?.(5)} className={`inline-flex items-center rounded-full border border-[var(--border)] px-2 py-0.5 text-[var(--muted-foreground)]${onEditPreference ? " cursor-pointer hover:border-[var(--foreground)]/30" : ""}`}>
                  {savedWizardParams.amenities.map((a) => {
                    const labels: Record<string, string> = { dog: "Dog-Friendly", kid: "Kid-Friendly", picnic: "Picnic", walkin: "Walk-in" };
                    return labels[a] || a;
                  }).join(", ")}
                </button>
              )}
              {savedWizardParams.priceLevels && savedWizardParams.priceLevels.length > 0 && (
                <button onClick={() => onEditPreference?.(6)} className={`inline-flex items-center rounded-full border border-[var(--border)] px-2 py-0.5 text-[var(--muted-foreground)]${onEditPreference ? " cursor-pointer hover:border-[var(--foreground)]/30" : ""}`}>
                  {savedWizardParams.priceLevels.sort((a, b) => a - b).map((l) => "$".repeat(l)).join(", ")}
                </button>
              )}
              {savedWizardParams.timeBudget && (
                <button onClick={() => onEditPreference?.(7)} className={`inline-flex items-center rounded-full border border-[var(--border)] px-2 py-0.5 text-[var(--muted-foreground)]${onEditPreference ? " cursor-pointer hover:border-[var(--foreground)]/30" : ""}`}>
                  {savedWizardParams.timeBudget === "half" ? "Half day" : savedWizardParams.timeBudget === "full" ? "Full day" : "Extended"}
                </button>
              )}
              {savedWizardParams.anchorNames && savedWizardParams.anchorNames.length > 0 && (
                <button onClick={() => onEditPreference?.(8)} className={`inline-flex items-center rounded-full border border-[var(--border)] px-2 py-0.5 text-[var(--muted-foreground)]${onEditPreference ? " cursor-pointer hover:border-[var(--foreground)]/30" : ""}`}>
                  Must-visit: {savedWizardParams.anchorNames.join(", ")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" />
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
                <div>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-burgundy-900 text-white text-xs">
                        <Navigation className="h-3.5 w-3.5" />
                      </div>
                      <div className="w-px flex-1 bg-[var(--border)] mt-2" />
                    </div>
                    <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 mb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-heading text-lg font-semibold">
                            {savedWizardParams?.originLabel || "Your Location"}
                          </p>
                          <p className="text-sm text-[var(--muted-foreground)]">Starting point</p>
                        </div>
                        <span className="text-sm font-medium">
                          Depart {formatTimeFromMinutes(
                            parseInt(startTime.split(":")[0]) * 60 + parseInt(startTime.split(":")[1])
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  {originSegment && (
                    <div className="flex gap-4 mb-2">
                      <div className="w-8" />
                      <div className="flex items-center gap-2 py-1 px-3 text-xs text-[var(--muted-foreground)] rounded-full bg-[var(--muted)]/50">
                        <Clock className="h-3.5 w-3.5" />
                        <span>~{originSegment.minutes > 15 ? formatDriveTimeRange(originSegment.minutes) : formatDriveTime(originSegment.minutes)} drive</span>
                      </div>
                    </div>
                  )}
                </div>
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
                  onPreview={setPreviewSlug}
                  schedule={schedule?.stops[idx]}
                />
              ))}

              {/* Destination pseudo-stop */}
              {hasEnd && (
                <div>
                  {endSegment && (
                    <div className="flex gap-4 mb-2">
                      <div className="w-8" />
                      <div className="flex items-center gap-2 py-1 px-3 text-xs text-[var(--muted-foreground)] rounded-full bg-[var(--muted)]/50">
                        <Clock className="h-3.5 w-3.5" />
                        <span>~{endSegment.minutes > 15 ? formatDriveTimeRange(endSegment.minutes) : formatDriveTime(endSegment.minutes)} drive</span>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-burgundy-900 text-white text-xs">
                        <Flag className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-heading text-lg font-semibold">
                            {savedWizardParams?.endLabel || "Destination"}
                          </p>
                          <p className="text-sm text-[var(--muted-foreground)]">Ending point</p>
                        </div>
                        {schedule?.endArrival && (
                          <span className="text-sm font-medium">
                            Arrive {schedule.endArrival}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                  homeBase={homeBase}
                  routeCentroid={routeCentroid}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <WineryPreviewPanel slug={previewSlug} onClose={() => setPreviewSlug(null)} />
    </div>
  );
}
