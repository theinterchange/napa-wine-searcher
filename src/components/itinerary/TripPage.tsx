"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useSession } from "next-auth/react";
import { TripStopCard } from "./TripStopCard";
import { AddStopSlot } from "./AddStopSlot";
import { StopDrawer } from "./StopDrawer";
import { DriveTimeInset } from "./DriveTimeInset";
import { TripMap } from "./TripMap";
import { TripOriginInput, type TripOriginValue } from "./TripOriginInput";
import { ShuffleButton } from "./ShuffleButton";
import { ValleyVariantToggle } from "./ValleyVariantToggle";
import { StayPicker, type StayContext } from "./StayPicker";
import { HomeBaseCard } from "./HomeBaseCard";
import { TripReadySummary } from "./TripReadySummary";
import { useTrip } from "@/lib/trip-state/use-trip";
import type { Trip, TripHomeBase, TripStop } from "@/lib/trip-state/types";
import { getDriveTimeProvider } from "@/lib/drive-time";
import type { DriveTimeResult } from "@/lib/drive-time";
import { buildGoogleMapsUrl, optimizeStopOrder } from "@/lib/geo";
import type { TripNearbyAccommodation } from "@/lib/itinerary/nearby-accommodations";
import { trackTripEvent } from "@/lib/analytics-events";

interface TripPageProps {
  initialTrip: Trip;
  initialAccommodations: TripNearbyAccommodation[];
  /** Set by the edit route when ?stay=1 is in the URL (the user said in the
   *  builder that they need a place to stay). Triggers the StayPicker banner. */
  initialNeedsStay?: boolean;
  /** Builder context (dogs/kids/vibe) encoded in the edit-page URL — lets
   *  StayPicker score and pre-filter matches without re-fetching state. */
  initialContext?: StayContext;
}

export function TripPage({
  initialTrip,
  initialAccommodations,
  initialNeedsStay = false,
  initialContext = { dogs: false, kids: false, vibe: null },
}: TripPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const {
    trip,
    canUndo,
    apply,
    undo,
    setTrip,
  } = useTrip(initialTrip);

  const [accommodations, setAccommodations] = useState(initialAccommodations);
  // Picker is shown when the user said "need a place to stay" in the builder
  // AND they haven't picked a home-base yet. Once they pick (trip.homeBase set),
  // the Stop 0 card replaces the picker. Clicking "Change" on the Stop 0 card
  // flips this back to true.
  const [showStayPicker, setShowStayPicker] = useState(
    initialNeedsStay && !initialTrip.homeBase
  );
  const [isForking, setIsForking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [drawer, setDrawer] = useState<
    | { open: false }
    | { open: true; mode: "add"; atIndex: number }
    | { open: true; mode: "swap"; wineryId: number }
  >({ open: false });
  const [driveTimes, setDriveTimes] = useState<DriveTimeResult[]>([]);
  /** Home-base → stop 1 drive time. Kept separate from `driveTimes` so the
   *  between-stop indexing downstream doesn't have to change. */
  const [homeBaseDriveTime, setHomeBaseDriveTime] =
    useState<DriveTimeResult | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [pool, setPool] = useState<TripStop[]>([]);
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
  const summaryRef = useRef<HTMLElement | null>(null);
  const scrollToSummary = useCallback(() => {
    summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Resync when the server-provided trip changes (shouldn't happen mid-session).
  useEffect(() => {
    setTrip(initialTrip);
    originalCuratedStopsRef.current = initialTrip.stops;
  }, [initialTrip, setTrip]);

  // Fire a single trip_generated event per share code, the first time the
  // user lands on this trip in a session. sessionStorage gates duplicates
  // across hot reloads, route remounts, and back/forward navigations.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `seen_trip:${initialTrip.shareCode ?? initialTrip.slug ?? "anon"}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    trackTripEvent({
      eventName: "trip_generated",
      tripId: initialTrip.id ?? undefined,
      shareCode: initialTrip.shareCode ?? undefined,
      mode: initialTrip.source ?? undefined,
      payload: {
        stopCount: initialTrip.stops.length,
        valley: initialTrip.valley ?? null,
        hasOrigin: !!initialTrip.origin,
        hasHomeBase: !!initialTrip.homeBase,
      },
    });
  }, [initialTrip]);

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

  // Home-base → stop 1 drive time. Computed separately from the between-stop
  // legs so the existing driveTimes[i] indexing doesn't have to shift.
  useEffect(() => {
    const hb = trip.homeBase;
    const first = trip.stops[0];
    if (!hb || !first || first.lat == null || first.lng == null) {
      setHomeBaseDriveTime(null);
      return;
    }
    const provider = getDriveTimeProvider();
    let cancelled = false;
    provider
      .computeMany([
        {
          from: { lat: hb.lat, lng: hb.lng },
          to: { lat: first.lat, lng: first.lng },
        },
      ])
      .then((results) => {
        if (!cancelled) setHomeBaseDriveTime(results[0] ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [trip.homeBase, trip.stops]);

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

  // Pool of theme-matched wineries for the swap/add drawer. Fetched lazily —
  // only populates when the drawer opens so page load isn't blocked by a
  // second DB roundtrip users may never look at.
  useEffect(() => {
    if (!drawer.open || !trip.theme) return;
    const currentValley = trip.source === "curated" ? poolValley : trip.valley;
    const params = new URLSearchParams({ theme: trip.theme, limit: "18" });
    if (currentValley) params.set("valley", currentValley);
    const excludeIds = trip.stops.map((s) => s.wineryId);
    if (excludeIds.length > 0) params.set("excludeIds", excludeIds.join(","));
    let cancelled = false;
    fetch(`/api/itineraries/pool?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : { pool: [] }))
      .then((data) => {
        if (!cancelled) setPool(data.pool ?? []);
      })
      .catch(() => {
        if (!cancelled) setPool([]);
      });
    return () => {
      cancelled = true;
    };
  }, [drawer.open, trip.theme, trip.source, trip.valley, poolValley, trip.stops]);

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
      trackTripEvent({
        eventName: "stop_swapped",
        shareCode: trip.shareCode ?? undefined,
        tripId: trip.id ?? undefined,
        payload: { fromWineryId: oldWineryId, toWineryId: newStop.wineryId },
      });
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
      trackTripEvent({
        eventName: "stop_added",
        shareCode: trip.shareCode ?? undefined,
        tripId: trip.id ?? undefined,
        payload: { wineryId: newStop.wineryId, atIndex },
      });
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
      trackTripEvent({
        eventName: "stop_removed",
        shareCode: trip.shareCode ?? undefined,
        tripId: trip.id ?? undefined,
        payload: { wineryId: stop.wineryId },
      });
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
      trackTripEvent({
        eventName: "stop_reordered",
        shareCode: trip.shareCode ?? undefined,
        tripId: trip.id ?? undefined,
        payload: { fromIndex, toIndex, wineryId: m.wineryId },
      });
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
      trackTripEvent({
        eventName: "origin_set",
        shareCode: trip.shareCode ?? undefined,
        tripId: trip.id ?? undefined,
        payload: { hasOrigin: !!origin, label: origin?.label ?? null },
      });
      // Optimistically reorder client-side so the map and stops update now.
      if (nextStops !== trip.stops) {
        // Reorder via a sequence of swaps would be clunky; just set trip directly.
        setTrip({ ...trip, origin, stops: nextStops });
        if (origin) {
          setShowToast("Stops re-ordered from your starting point.");
        }
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
   * User picked a home-base hotel in the StayPicker. Sets the trip's
   * origin to the hotel's coords (re-optimizing stops around it),
   * persists `home_base_accommodation_id` to the trip row, and collapses
   * the picker so the Stop 0 card renders.
   */
  const handlePickHomeBase = useCallback(
    async (hotel: TripNearbyAccommodation) => {
      if (hotel.lat == null || hotel.lng == null) return;
      const origin = { lat: hotel.lat, lng: hotel.lng, label: hotel.name };

      // Re-optimize the stops around the hotel.
      let nextStops = trip.stops;
      const withCoords = trip.stops.filter(
        (s): s is TripStop & { lat: number; lng: number } =>
          s.lat != null && s.lng != null
      );
      if (withCoords.length >= 2) {
        const coords = withCoords.map((s) => ({ lat: s.lat, lng: s.lng }));
        const order = optimizeStopOrder(coords, origin, origin);
        const ordered = order.map((i) => withCoords[i]);
        const coordless = trip.stops.filter(
          (s) => s.lat == null || s.lng == null
        );
        nextStops = [...ordered, ...coordless];
      }

      const nextHomeBase: TripHomeBase = {
        id: hotel.id,
        slug: hotel.slug,
        name: hotel.name,
        city: hotel.city,
        lat: hotel.lat,
        lng: hotel.lng,
        heroImageUrl: hotel.heroImageUrl,
        googleRating: hotel.googleRating,
        priceTier: hotel.priceTier,
        starRating: hotel.starRating,
        bookingUrl: hotel.bookingUrl,
        websiteUrl: hotel.websiteUrl,
      };

      const isReplacement = !!trip.homeBase;
      setTrip({
        ...trip,
        origin,
        stops: nextStops,
        homeBase: nextHomeBase,
      });
      setShowStayPicker(false);
      trackTripEvent({
        eventName: isReplacement ? "home_base_changed" : "home_base_picked",
        shareCode: trip.shareCode ?? undefined,
        tripId: trip.id ?? undefined,
        payload: { accommodationId: hotel.id, slug: hotel.slug },
      });
      setShowToast(`${hotel.name} is your home base.`);
      window.setTimeout(() => setShowToast(null), 3500);

      // Fork the trip if it's still a curated copy, then persist everything.
      let shareCode = trip.shareCode;
      if (trip.source === "curated") {
        shareCode = await forkIfNeeded(nextStops);
      } else {
        await persistStops(trip.shareCode, nextStops);
      }
      if (!shareCode) return;
      try {
        await fetch(`/api/trips/${shareCode}/home-base`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ accommodationId: hotel.id, nights: null }),
        });
      } catch (err) {
        console.error("Failed to persist home base:", err);
      }
    },
    [trip, setTrip, forkIfNeeded, persistStops]
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
      trackTripEvent({
        eventName: "shuffle_clicked",
        shareCode: trip.shareCode ?? undefined,
        tripId: trip.id ?? undefined,
        payload: { newStopIds: ordered.map((s) => s.wineryId) },
      });
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

  const handleShare = useCallback(async () => {
    if (trip.source === "curated") {
      const shareCode = await forkIfNeeded(trip.stops);
      if (shareCode) {
        await navigator.clipboard
          .writeText(`${window.location.origin}/trips/${shareCode}`)
          .catch(() => {});
        trackTripEvent({
          eventName: "trip_shared",
          shareCode,
          payload: { source: "curated_fork" },
        });
        setShowToast("Share link copied");
        window.setTimeout(() => setShowToast(null), 3000);
      }
      return;
    }
    if (trip.shareCode) {
      await navigator.clipboard
        .writeText(`${window.location.origin}/trips/${trip.shareCode}`)
        .catch(() => {});
      trackTripEvent({
        eventName: "trip_shared",
        shareCode: trip.shareCode,
        tripId: trip.id ?? undefined,
        payload: { source: trip.source ?? "unknown" },
      });
      setShowToast("Share link copied");
      window.setTimeout(() => setShowToast(null), 3000);
    }
  }, [trip, forkIfNeeded]);

  /**
   * Save states:
   *  - curated: fork into user's account (requires auth) or prompt sign-in.
   *  - anonymous: prompt sign-in to claim this trip as a savedTrip.
   *  - saved: already in the user's account → disabled "Saved" check.
   */
  const handleSave = useCallback(async () => {
    // Authenticated users saving a curated trip: fork creates a savedTrip row.
    if (trip.source === "curated") {
      if (!session) {
        router.push(
          `/login?callbackUrl=${encodeURIComponent(
            window.location.pathname
          )}`
        );
        return;
      }
      setIsSaving(true);
      try {
        const shareCode = await forkIfNeeded(trip.stops);
        if (shareCode) {
          trackTripEvent({
            eventName: "trip_saved",
            shareCode,
            payload: { source: "curated_fork", authenticated: true },
          });
          setShowToast("Saved to your trips");
          window.setTimeout(() => setShowToast(null), 3000);
        }
      } finally {
        setIsSaving(false);
      }
      return;
    }
    // Anonymous trip: route through sign-in; promotion to savedTrips happens
    // downstream when the user completes auth with a claim=<shareCode> hint.
    if (trip.source === "anonymous" && trip.shareCode) {
      router.push(
        `/login?callbackUrl=${encodeURIComponent(
          `/trips/${trip.shareCode}/edit`
        )}&claim=${trip.shareCode}`
      );
    }
  }, [trip, session, forkIfNeeded, router]);

  const saveState: "save" | "saved" | "signin" =
    trip.source === "saved"
      ? "saved"
      : trip.source === "anonymous" || !session
      ? "signin"
      : "save";

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

      {/* Editor bar — trip-shaping controls. Save / Share / Book live in
          the TripReadySummary at the bottom of the page. */}
      <div className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Customize
          </div>
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
              className="inline-flex items-center gap-1.5 border border-[var(--ink)] bg-transparent px-3 py-2 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)] transition-colors"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          {/* Stop 0 — chosen home-base, rendered as a first-class card
              above the wineries. Drive-time inset to stop 1 appears below. */}
          {trip.homeBase && (
            <div className="mb-3 space-y-3">
              <HomeBaseCard
                homeBase={trip.homeBase}
                onOpenPicker={() => setShowStayPicker(true)}
                onScrollToSummary={scrollToSummary}
              />
              {homeBaseDriveTime && trip.stops.length > 0 && (
                <DriveTimeInset result={homeBaseDriveTime} />
              )}
            </div>
          )}
          {showStayPicker && !trip.homeBase && (
            <StayPicker
              accommodations={accommodations}
              context={initialContext}
              onPick={(hotel) => void handlePickHomeBase(hotel)}
              onDismiss={() => setShowStayPicker(false)}
            />
          )}
          {trip.stops.length === 0 && (
            <p className="border border-dashed border-[var(--rule)] bg-[var(--paper-2)] p-6 text-center font-[var(--font-serif-text)] text-[14px] text-[var(--ink-2)]">
              No stops yet. Add a winery to start your trip.
            </p>
          )}
          <div className="space-y-3">
          {isEditable && trip.stops.length > 0 && !trip.homeBase && (
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
          <section className="card-flat p-5">
            <span className="kicker">Trip summary</span>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[var(--ink-3)]">Stops</dt>
                <dd className="font-[var(--font-heading)] text-[18px] text-[var(--ink)] mt-0.5">{trip.stops.length}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[var(--ink-3)]">Drive</dt>
                <dd className="font-[var(--font-heading)] text-[15px] text-[var(--ink)] mt-0.5">
                  {summary.totalDriveMin} min · {summary.totalMiles} mi
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[var(--ink-3)]">
                  Tasting time
                </dt>
                <dd className="font-[var(--font-heading)] text-[15px] text-[var(--ink)] mt-0.5">{Math.round(summary.totalTasteMin / 60)} hr (approx)</dd>
              </div>
              <div>
                <dt className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[var(--ink-3)]">
                  Tasting fees
                </dt>
                <dd className="font-[var(--font-heading)] text-[15px] text-[var(--ink)] mt-0.5">
                  {summary.minCost === 0
                    ? "Varies"
                    : summary.minCost === summary.maxCost
                    ? `$${summary.minCost}`
                    : `$${summary.minCost}–$${summary.maxCost}`}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={scrollToSummary}
              className="btn-ink mt-5 w-full"
            >
              Review &amp; book
            </button>
          </section>
          <TripMap
            stops={trip.stops}
            origin={trip.origin}
            className="h-[320px] w-full overflow-hidden border-t-2 border-[var(--brass)]"
          />
        </aside>
      </main>

      {/* Bottom-of-page "Your trip is ready" section — the conversion moment
          where the gold hotel Book CTA lives. */}
      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <TripReadySummary
          ref={summaryRef}
          homeBase={trip.homeBase}
          stopCount={trip.stops.length}
          totalDriveMin={summary.totalDriveMin}
          totalMiles={summary.totalMiles}
          totalTasteMin={summary.totalTasteMin}
          minCost={summary.minCost}
          maxCost={summary.maxCost}
          googleMapsUrl={summary.googleMapsUrl}
          saveState={saveState}
          onSave={handleSave}
          onShare={handleShare}
          saving={isSaving || isForking}
          shareCode={trip.shareCode}
          tripId={trip.id}
        />
      </div>

      <StopDrawer
        open={drawer.open}
        title={
          drawer.open && drawer.mode === "swap"
            ? "Swap this stop"
            : "Add a stop"
        }
        suggestionsLabel={
          drawer.open && drawer.mode === "swap"
            ? "Suggested alternatives"
            : "More wineries that fit this trip"
        }
        existingIds={existingIds}
        suggested={pool}
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

      {showToast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-lg bg-[var(--foreground)] px-4 py-2 text-sm text-[var(--background)] shadow-lg"
        >
          <span>{showToast}</span>
          {canUndo && (
            <button
              type="button"
              onClick={() => {
                undo();
                setShowToast(null);
              }}
              className="rounded-md border border-white/20 px-2 py-0.5 text-xs font-semibold text-[var(--background)] hover:border-white/60"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
