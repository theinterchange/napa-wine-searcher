"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Share2, RotateCcw, Map as MapIcon, Undo2 } from "lucide-react";
import { TripStopCard } from "./TripStopCard";
import { AddStopSlot } from "./AddStopSlot";
import { StopDrawer } from "./StopDrawer";
import { DriveTimeInset } from "./DriveTimeInset";
import { AccommodationModule } from "./AccommodationModule";
import { TripMap } from "./TripMap";
import { TripOriginInput, type TripOriginValue } from "./TripOriginInput";
import { ShuffleButton } from "./ShuffleButton";
import { MoreLikeThisPool } from "./MoreLikeThisPool";
import { WineryPreviewDrawer } from "./WineryPreviewDrawer";
import { ValleyVariantToggle } from "./ValleyVariantToggle";
import { useTrip } from "@/lib/trip-state/use-trip";
import type { Trip, TripStop } from "@/lib/trip-state/types";
import { getDriveTimeProvider } from "@/lib/drive-time";
import type { DriveTimeResult } from "@/lib/drive-time";
import { buildGoogleMapsUrl, optimizeStopOrder } from "@/lib/geo";
import type { TripNearbyAccommodation } from "@/lib/itinerary/nearby-accommodations";

interface TripPageProps {
  initialTrip: Trip;
  initialAccommodations: TripNearbyAccommodation[];
}

export function TripPage({ initialTrip, initialAccommodations }: TripPageProps) {
  const router = useRouter();
  const {
    trip,
    canUndo,
    apply,
    undo,
    setTrip,
  } = useTrip(initialTrip);

  const [accommodations, setAccommodations] = useState(initialAccommodations);
  const [isForking, setIsForking] = useState(false);
  const [drawer, setDrawer] = useState<
    | { open: false }
    | { open: true; mode: "add"; atIndex: number }
    | { open: true; mode: "swap"; wineryId: number }
  >({ open: false });
  const [driveTimes, setDriveTimes] = useState<DriveTimeResult[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [previewStop, setPreviewStop] = useState<TripStop | null>(null);
  const [previewAdding, setPreviewAdding] = useState(false);
  const [activeVariant, setActiveVariant] = useState<"napa" | "sonoma" | "both">(
    initialTrip.activeVariant ?? "both"
  );

  // Pool valley filter tracks the active variant — Both = no filter (null).
  const poolValley: string | null =
    activeVariant === "napa"
      ? "Napa Valley"
      : activeVariant === "sonoma"
      ? "Sonoma County"
      : null;

  /**
   * Switch which variant's stops are shown. Pulls from the pristine
   * `allCuratedStops` snapshot, re-optimizes geographically, and replaces the
   * client trip's stop list. Only available on the curated detail page.
   */
  const handleVariantChange = useCallback(
    (next: "napa" | "sonoma" | "both") => {
      if (!trip.allCuratedStops || next === activeVariant) return;
      setActiveVariant(next);
      const filtered = trip.allCuratedStops.filter(
        (s) => s.valleyVariant === next
      );
      const origin = trip.origin
        ? { lat: trip.origin.lat, lng: trip.origin.lng }
        : null;
      // Re-run the same optimization the server applied on initial load.
      const withCoords = filtered.filter(
        (s): s is TripStop & { lat: number; lng: number } =>
          s.lat != null && s.lng != null
      );
      let ordered: TripStop[] = filtered;
      if (withCoords.length >= 2) {
        const coords = withCoords.map((s) => ({ lat: s.lat, lng: s.lng }));
        const order = optimizeStopOrder(coords, origin, origin);
        const rest = filtered.filter((s) => s.lat == null || s.lng == null);
        ordered = [...order.map((i) => withCoords[i]), ...rest];
      }
      setTrip({
        ...trip,
        stops: ordered,
        editorialStopOrder: filtered.map((s) => s.wineryId),
      });
      originalCuratedStopsRef.current = ordered;
    },
    [trip, activeVariant, setTrip]
  );
  const originalCuratedStopsRef = useRef(initialTrip.stops);

  // Resync when the server-provided trip changes (shouldn't happen mid-session).
  useEffect(() => {
    setTrip(initialTrip);
    originalCuratedStopsRef.current = initialTrip.stops;
  }, [initialTrip, setTrip]);

  // Recompute drive times whenever stops change.
  useEffect(() => {
    const provider = getDriveTimeProvider();
    const legs: Array<{
      from: { lat: number; lng: number };
      to: { lat: number; lng: number };
    }> = [];
    for (let i = 0; i < trip.stops.length - 1; i++) {
      const a = trip.stops[i];
      const b = trip.stops[i + 1];
      if (a.lat != null && a.lng != null && b.lat != null && b.lng != null) {
        legs.push({
          from: { lat: a.lat, lng: a.lng },
          to: { lat: b.lat, lng: b.lng },
        });
      }
    }
    if (legs.length === 0) {
      setDriveTimes([]);
      return;
    }
    let cancelled = false;
    provider.computeMany(legs).then((results) => {
      if (!cancelled) setDriveTimes(results);
    });
    return () => {
      cancelled = true;
    };
  }, [trip.stops]);

  // Refresh accommodations when stops change after a swap/remove/add.
  useEffect(() => {
    const ids = trip.stops.map((s) => s.wineryId);
    if (ids.length === 0) {
      setAccommodations([]);
      return;
    }
    // Only re-fetch if stops actually differ from initial (saves a roundtrip on mount).
    const initialIds = initialAccommodations
      .map((a) => a.id)
      .sort()
      .join(",");
    let cancelled = false;
    fetch(
      `/api/accommodations/for-trip?stopIds=${ids.join(",")}&limit=3`
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          const newIds = data
            .map((a: TripNearbyAccommodation) => a.id)
            .sort()
            .join(",");
          if (newIds !== initialIds) setAccommodations(data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [trip.stops, initialAccommodations]);

  const existingIds = useMemo(
    () => new Set(trip.stops.map((s) => s.wineryId)),
    [trip.stops]
  );

  const summary = useMemo(() => {
    const totalDriveMin = driveTimes.reduce((sum, r) => sum + r.minutes, 0);
    const totalMiles = driveTimes.reduce((sum, r) => sum + r.miles, 0);
    const totalTasteMin = trip.stops.reduce(
      (sum, s) => sum + s.tastingDurationMinutes,
      0
    );
    let minCost = 0;
    let maxCost = 0;
    for (const s of trip.stops) {
      if (s.tasting?.min != null) {
        minCost += s.tasting.min;
        maxCost += s.tasting.max ?? s.tasting.min;
      }
    }
    const googleMapsUrl = buildGoogleMapsUrl(
      trip.stops.map((s) => ({ lat: s.lat, lng: s.lng, name: s.name })),
      trip.origin ? { lat: trip.origin.lat, lng: trip.origin.lng } : null
    );
    return {
      totalDriveMin: Math.round(totalDriveMin),
      totalMiles: Math.round(totalMiles * 10) / 10,
      totalTasteMin,
      minCost,
      maxCost,
      googleMapsUrl,
    };
  }, [driveTimes, trip.stops, trip.origin]);

  /**
   * Silently fork a curated trip into a user/anonymous trip on first edit.
   * Returns the shareCode of the new editable trip.
   */
  const forkIfNeeded = useCallback(
    async (nextStops: TripStop[]): Promise<string | null> => {
      if (trip.source !== "curated") return trip.shareCode;
      setIsForking(true);
      try {
        const res = await fetch("/api/itineraries/fork", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            routeId: trip.forkedFromRouteId,
            stops: nextStops.map((s) => s.wineryId),
            name: trip.name,
            theme: trip.theme,
            valley: trip.valley,
          }),
        });
        if (!res.ok) throw new Error("Fork failed");
        const data = await res.json();
        router.replace(`/trips/${data.shareCode}/edit`);
        return data.shareCode as string;
      } finally {
        setIsForking(false);
      }
    },
    [trip, router]
  );

  const persistStops = useCallback(
    async (shareCode: string | null, stops: TripStop[]) => {
      if (!shareCode) return;
      try {
        await fetch(`/api/trips/${shareCode}/stops`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            stopWineryIds: stops.map((s) => s.wineryId),
          }),
        });
      } catch (err) {
        console.error("Failed to sync trip stops:", err);
      }
    },
    []
  );

  const handleSwap = useCallback(
    async (oldWineryId: number, newStop: TripStop) => {
      apply({ type: "swap_stop", oldWineryId, newStop });
      const nextStops = trip.stops.map((s) =>
        s.wineryId === oldWineryId ? newStop : s
      );
      if (trip.source === "curated") {
        await forkIfNeeded(nextStops);
      } else {
        await persistStops(trip.shareCode, nextStops);
      }
      setDrawer({ open: false });
    },
    [apply, trip, forkIfNeeded, persistStops]
  );

  const handleAdd = useCallback(
    async (atIndex: number, newStop: TripStop) => {
      apply({ type: "add_stop", stop: newStop, atIndex });
      const nextStops = [...trip.stops];
      nextStops.splice(atIndex, 0, newStop);
      if (trip.source === "curated") {
        await forkIfNeeded(nextStops);
      } else {
        await persistStops(trip.shareCode, nextStops);
      }
      setDrawer({ open: false });
    },
    [apply, trip, forkIfNeeded, persistStops]
  );

  const handleRemove = useCallback(
    async (stop: TripStop) => {
      apply({ type: "remove_stop", wineryId: stop.wineryId });
      const nextStops = trip.stops.filter(
        (s) => s.wineryId !== stop.wineryId
      );
      setShowToast(`Removed ${stop.name} — undo available`);
      window.setTimeout(() => setShowToast(null), 4000);
      if (trip.source === "curated") {
        await forkIfNeeded(nextStops);
      } else {
        await persistStops(trip.shareCode, nextStops);
      }
    },
    [apply, trip, forkIfNeeded, persistStops]
  );

  const handleReorder = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      apply({ type: "reorder", fromIndex, toIndex });
      const nextStops = [...trip.stops];
      const [m] = nextStops.splice(fromIndex, 1);
      nextStops.splice(toIndex, 0, m);
      if (trip.source === "curated") {
        await forkIfNeeded(nextStops);
      } else {
        await persistStops(trip.shareCode, nextStops);
      }
    },
    [apply, trip, forkIfNeeded, persistStops]
  );

  /**
   * Set or clear the trip's origin. Re-optimizes stop order against the new
   * origin, forks a curated trip if needed, and persists the origin to the
   * backing savedTrip or anonymousTrip row.
   */
  const handleSetOrigin = useCallback(
    async (next: TripOriginValue | null) => {
      const origin = next;
      // Re-optimize stops against the new origin (loop-trip semantics — origin
      // is both start and end — matches how the server-side loader chooses).
      let nextStops = trip.stops;
      const withCoords = trip.stops.filter(
        (s): s is TripStop & { lat: number; lng: number } =>
          s.lat != null && s.lng != null
      );
      if (origin && withCoords.length >= 2) {
        const coords = withCoords.map((s) => ({ lat: s.lat, lng: s.lng }));
        const order = optimizeStopOrder(coords, origin, origin);
        const ordered = order.map((i) => withCoords[i]);
        const coordless = trip.stops.filter(
          (s) => s.lat == null || s.lng == null
        );
        nextStops = [...ordered, ...coordless];
      }

      apply({ type: "set_origin", origin });
      // Optimistically reorder client-side so the map and stops update now.
      if (nextStops !== trip.stops) {
        // Reorder via a sequence of swaps would be clunky; just set trip directly.
        setTrip({ ...trip, origin, stops: nextStops });
      }

      let shareCode = trip.shareCode;
      if (trip.source === "curated") {
        shareCode = await forkIfNeeded(nextStops);
      } else {
        await persistStops(trip.shareCode, nextStops);
      }
      if (shareCode) {
        try {
          await fetch(`/api/trips/${shareCode}/origin`, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ origin }),
          });
        } catch (err) {
          console.error("Failed to persist origin:", err);
        }
      }
    },
    [apply, setTrip, trip, forkIfNeeded, persistStops]
  );

  /**
   * "Try a different set" — swap out the current stops for a new pool of
   * theme-matching wineries. First edit of a curated trip silently forks.
   */
  const handleShuffle = useCallback(
    async (nextStops: TripStop[]) => {
      // Reorder for geographic sanity against the current origin (or loop).
      const origin = trip.origin
        ? { lat: trip.origin.lat, lng: trip.origin.lng }
        : null;
      const withCoords = nextStops.filter(
        (s): s is TripStop & { lat: number; lng: number } =>
          s.lat != null && s.lng != null
      );
      let ordered = nextStops;
      if (withCoords.length >= 2) {
        const coords = withCoords.map((s) => ({ lat: s.lat, lng: s.lng }));
        const order = optimizeStopOrder(coords, origin, origin);
        const rest = nextStops.filter((s) => s.lat == null || s.lng == null);
        ordered = [...order.map((i) => withCoords[i]), ...rest];
      }
      setTrip({ ...trip, stops: ordered });
      if (trip.source === "curated") {
        await forkIfNeeded(ordered);
      } else {
        await persistStops(trip.shareCode, ordered);
      }
      setShowToast("Loaded a different set. Undo to restore.");
      window.setTimeout(() => setShowToast(null), 4000);
    },
    [setTrip, trip, forkIfNeeded, persistStops]
  );

  /**
   * Restore the original editorial stop sequence. Only meaningful for trips
   * that were forked from a curated route — editorialStopOrder carries the
   * hand-picked winery IDs; we snap back to that set in that order.
   */
  const hasDriftedFromEditorial = useMemo(() => {
    if (!trip.editorialStopOrder) return false;
    if (trip.stops.length !== trip.editorialStopOrder.length) return true;
    return trip.stops.some(
      (s, i) => s.wineryId !== trip.editorialStopOrder![i]
    );
  }, [trip.stops, trip.editorialStopOrder]);

  const handleResetToEditorial = useCallback(async () => {
    if (!trip.editorialStopOrder || trip.editorialStopOrder.length === 0) return;
    try {
      const idsQs = trip.editorialStopOrder.join(",");
      const resp = await fetch(`/api/itineraries/stops?ids=${idsQs}`);
      if (!resp.ok) throw new Error("lookup failed");
      const data = await resp.json();
      const ordered: TripStop[] = data.stops ?? [];
      if (ordered.length === 0) return;
      setTrip({ ...trip, stops: ordered });
      await persistStops(trip.shareCode, ordered);
      setShowToast("Restored the editorial order");
      window.setTimeout(() => setShowToast(null), 3000);
    } catch (err) {
      console.error("Reset to editorial failed:", err);
    }
  }, [trip, setTrip, persistStops]);

  const handleAddFromPool = useCallback(
    async (stop: TripStop) => {
      await handleAdd(trip.stops.length, stop);
      setShowToast(`Added ${stop.name} to your trip`);
      window.setTimeout(() => setShowToast(null), 3000);
    },
    [handleAdd, trip.stops.length]
  );

  const handleShare = useCallback(async () => {
    if (trip.source === "curated") {
      const shareCode = await forkIfNeeded(trip.stops);
      if (shareCode) {
        await navigator.clipboard
          .writeText(`${window.location.origin}/trips/${shareCode}`)
          .catch(() => {});
        setShowToast("Share link copied");
        window.setTimeout(() => setShowToast(null), 3000);
      }
      return;
    }
    if (trip.shareCode) {
      await navigator.clipboard
        .writeText(`${window.location.origin}/trips/${trip.shareCode}`)
        .catch(() => {});
      setShowToast("Share link copied");
      window.setTimeout(() => setShowToast(null), 3000);
    }
  }, [trip, forkIfNeeded]);

  const isEditable = trip.isEditable || trip.source === "curated";

  return (
    <div className="relative">
      {/* Hero */}
      <header className="relative isolate overflow-hidden">
        <div className="relative h-[45vh] min-h-[320px] w-full">
          {trip.heroImageUrl ? (
            <Image
              src={trip.heroImageUrl}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-burgundy-900 to-burgundy-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-8 text-white sm:px-6">
          <Link
            href="/itineraries"
            className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> All itineraries
          </Link>
          <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">
            {trip.name}
          </h1>
          {trip.editorialPull && (
            <p className="mt-2 max-w-2xl text-sm text-white/90 sm:text-base">
              {trip.editorialPull}
            </p>
          )}
        </div>
      </header>

      {/* Toolbar — actions moved out of the hero so they're legible */}
      <div className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
          {trip.source === "curated" && trip.availableVariants && trip.availableVariants.length > 1 && (
            <ValleyVariantToggle
              value={activeVariant}
              available={trip.availableVariants}
              onChange={handleVariantChange}
            />
          )}
          <TripOriginInput
            value={trip.origin}
            onChange={(next) => void handleSetOrigin(next)}
          />
          <button
            type="button"
            onClick={handleShare}
            disabled={isForking}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:border-burgundy-900 disabled:opacity-50"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>
          {summary.googleMapsUrl && (
            <a
              href={summary.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:border-burgundy-900"
            >
              <MapIcon className="h-4 w-4" /> Open in Google Maps
            </a>
          )}
          {trip.theme && (
            <ShuffleButton
              theme={trip.theme}
              valley={trip.valley}
              currentStopIds={trip.stops.map((s) => s.wineryId)}
              onReplaceStops={(next) => void handleShuffle(next)}
              disabled={isForking}
            />
          )}
          {hasDriftedFromEditorial && (
            <button
              type="button"
              onClick={() => void handleResetToEditorial()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:border-burgundy-900"
            >
              <RotateCcw className="h-4 w-4" /> Reset to editorial
            </button>
          )}
          {canUndo && (
            <button
              type="button"
              onClick={undo}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:border-burgundy-900"
            >
              <Undo2 className="h-4 w-4" /> Undo
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          {trip.stops.length === 0 && (
            <p className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted-foreground)]">
              No stops yet. Add a winery to start your trip.
            </p>
          )}
          <div className="space-y-3">
          {isEditable && trip.stops.length > 0 && (
            <AddStopSlot
              label="Add a stop at the start"
              onClick={() => setDrawer({ open: true, mode: "add", atIndex: 0 })}
            />
          )}
          {trip.stops.map((stop, i) => (
            <div key={stop.wineryId} className="space-y-3">
              <TripStopCard
                stop={stop}
                index={i}
                editable={isEditable}
                onSwap={(s) =>
                  setDrawer({ open: true, mode: "swap", wineryId: s.wineryId })
                }
                onRemove={(s) => handleRemove(s)}
                onDragStart={(idx) => setDragIndex(idx)}
                onDragOver={(idx) => {
                  if (dragIndex != null && dragIndex !== idx) {
                    void handleReorder(dragIndex, idx);
                    setDragIndex(idx);
                  }
                }}
                onDragEnd={() => setDragIndex(null)}
                isDragging={dragIndex === i}
              />
              {i < trip.stops.length - 1 && driveTimes[i] && (
                <DriveTimeInset result={driveTimes[i]} />
              )}
              {isEditable && (
                <AddStopSlot
                  onClick={() =>
                    setDrawer({ open: true, mode: "add", atIndex: i + 1 })
                  }
                />
              )}
            </div>
          ))}
          </div>

          {trip.theme && (
            <MoreLikeThisPool
              theme={trip.theme}
              valley={trip.source === "curated" ? poolValley : trip.valley}
              excludeIds={trip.stops.map((s) => s.wineryId)}
              onPreview={(stop) => setPreviewStop(stop)}
            />
          )}

          {trip.lastScrapedAt && (
            <p className="mt-6 text-xs text-[var(--muted-foreground)]">
              Hours and reservation info last verified{" "}
              {new Date(trip.lastScrapedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              . Confirm directly with wineries before visiting.
            </p>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <TripMap
            stops={trip.stops}
            origin={trip.origin}
            className="h-[320px] w-full overflow-hidden rounded-2xl border border-[var(--border)]"
          />
          <AccommodationModule
            accommodations={accommodations}
            emphasized={trip.duration === "weekend"}
          />
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              Trip summary
            </h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-[var(--muted-foreground)]">Stops</dt>
                <dd>{trip.stops.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--muted-foreground)]">Drive</dt>
                <dd>
                  {summary.totalDriveMin} min · {summary.totalMiles} mi
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--muted-foreground)]">
                  Tasting time
                </dt>
                <dd>{Math.round(summary.totalTasteMin / 60)} hr (approx)</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--muted-foreground)]">
                  Tasting fees
                </dt>
                <dd>
                  {summary.minCost === 0
                    ? "Varies"
                    : summary.minCost === summary.maxCost
                    ? `$${summary.minCost}`
                    : `$${summary.minCost}–$${summary.maxCost}`}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </main>

      <StopDrawer
        open={drawer.open}
        title={
          drawer.open && drawer.mode === "swap"
            ? "Swap this stop"
            : "Add a stop"
        }
        existingIds={existingIds}
        onClose={() => setDrawer({ open: false })}
        onSelect={(selected) => {
          if (!drawer.open) return;
          if (drawer.mode === "swap") {
            void handleSwap(drawer.wineryId, selected);
          } else {
            void handleAdd(drawer.atIndex, selected);
          }
        }}
      />

      <WineryPreviewDrawer
        slug={previewStop?.slug ?? null}
        adding={previewAdding}
        onClose={() => setPreviewStop(null)}
        onAdd={async () => {
          if (!previewStop) return;
          setPreviewAdding(true);
          try {
            await handleAddFromPool(previewStop);
          } finally {
            setPreviewAdding(false);
            setPreviewStop(null);
          }
        }}
      />

      {showToast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-lg bg-[var(--foreground)] px-4 py-2 text-sm text-[var(--background)] shadow-lg"
        >
          {showToast}
        </div>
      )}
    </div>
  );
}
