"use client";

import { useMemo } from "react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import type { TripStop } from "@/lib/trip-state/types";

const PIN_COLOR = "#722F37";
const ORIGIN_COLOR = "#1f2937";

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
