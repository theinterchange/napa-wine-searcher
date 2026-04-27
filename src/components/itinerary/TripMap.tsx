"use client";

import { useEffect, useMemo } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import type { TripStop } from "@/lib/trip-state/types";

const PIN_COLOR = "#722F37";
const ORIGIN_COLOR = "#1f2937";

/**
 * Imperative polyline wrapper — @vis.gl/react-google-maps v1 doesn't ship a
 * Polyline component, so we reach into the maps library and mount a native
 * google.maps.Polyline. Renders nothing; side effect only.
 */
function RoutePolyline({ path }: { path: { lat: number; lng: number }[] }) {
  const map = useMap();
  const mapsLib = useMapsLibrary("maps");

  useEffect(() => {
    if (!map || !mapsLib || path.length < 2) return;
    const polyline = new mapsLib.Polyline({
      path,
      strokeColor: PIN_COLOR,
      strokeOpacity: 0.85,
      strokeWeight: 3,
      map,
    });
    return () => {
      polyline.setMap(null);
    };
  }, [map, mapsLib, path]);

  return null;
}

interface TripMapProps {
  stops: TripStop[];
  origin?: { lat: number; lng: number; label: string | null } | null;
  className?: string;
}

export function TripMap({ stops, origin, className }: TripMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "default";

  const validStops = useMemo(
    () => stops.filter((s): s is TripStop & { lat: number; lng: number } =>
      s.lat != null && s.lng != null
    ),
    [stops]
  );

  const center = useMemo(() => {
    if (validStops.length === 0) {
      return origin ?? { lat: 38.5025, lng: -122.4025 };
    }
    const sumLat = validStops.reduce((a, s) => a + s.lat, 0);
    const sumLng = validStops.reduce((a, s) => a + s.lng, 0);
    return {
      lat: sumLat / validStops.length,
      lng: sumLng / validStops.length,
    };
  }, [validStops, origin]);

  const path = useMemo(() => {
    const pts: { lat: number; lng: number }[] = [];
    if (origin) pts.push({ lat: origin.lat, lng: origin.lng });
    for (const s of validStops) pts.push({ lat: s.lat, lng: s.lng });
    return pts;
  }, [validStops, origin]);

  if (!apiKey) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--muted)] ${className ?? ""}`}>
        <p className="text-sm text-[var(--muted-foreground)]">Map unavailable</p>
      </div>
    );
  }

  return (
    <div className={className ?? ""}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={validStops.length > 1 ? 11 : 13}
          mapId={mapId}
          className="h-full w-full"
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          <RoutePolyline path={path} />
          {origin && (
            <AdvancedMarker position={{ lat: origin.lat, lng: origin.lng }}>
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-md text-white text-[10px] font-semibold"
                style={{ backgroundColor: ORIGIN_COLOR }}
                title={origin.label ?? "Start"}
              >
                ●
              </div>
            </AdvancedMarker>
          )}
          {validStops.map((s, i) => (
            <AdvancedMarker
              key={s.wineryId}
              position={{ lat: s.lat, lng: s.lng }}
              title={s.name}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white shadow-md text-white text-sm font-semibold"
                style={{ backgroundColor: PIN_COLOR }}
              >
                {i + 1}
              </div>
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}
