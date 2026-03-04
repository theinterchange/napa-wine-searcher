"use client";

import { useState, useEffect, useCallback } from "react";
import { Shuffle, Loader2, Wine } from "lucide-react";
import { TripStopCard } from "./TripStopCard";
import { TripSummary } from "./TripSummary";
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
}

export function TripPlanner({
  initialFrom,
  initialTheme,
  initialStops,
  initialValley,
}: TripPlannerProps) {
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [alternatives, setAlternatives] = useState<Record<number, Alternative[]>>({});
  const [summary, setSummary] = useState<RouteSummary | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ title: string; slug: string; theme: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState(initialTheme || "");
  const [valley, setValley] = useState(initialValley || "");
  const [stopCount, setStopCount] = useState(4);

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
        } else {
          setStops(data.stops);
          setAlternatives(data.alternatives || {});
          setSummary(data.summary);
          setRouteInfo(data.route || null);
        }
      } catch {
        setError("Failed to generate route. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    if (initialFrom) {
      fetchRoute({ from: initialFrom });
    } else if (initialStops) {
      fetchRoute({ stopIds: initialStops });
    } else {
      fetchRoute({
        theme: initialTheme || "",
        valley: initialValley || "",
        stops: String(stopCount),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShuffle = () => {
    const excludeIds = stops.map((s) => s.id).join(",");
    fetchRoute({
      theme,
      valley,
      stops: String(stopCount),
      excludeIds,
    });
  };

  const handleGenerate = () => {
    fetchRoute({
      theme,
      valley,
      stops: String(stopCount),
    });
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
    const segments = computeSegments(currentStops);
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
    const googleMapsUrl = buildGoogleMapsUrl(
      currentStops.map((s) => ({ lat: s.lat, lng: s.lng, name: s.name }))
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

          {/* Stop count */}
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
