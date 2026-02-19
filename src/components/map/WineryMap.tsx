"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { useSearchParams } from "next/navigation";
import { MapInfoCard } from "./MapInfoCard";
import { Locate } from "lucide-react";

interface WineryMapData {
  id: number;
  slug: string;
  name: string;
  lat: number | null;
  lng: number | null;
  city: string | null;
  priceLevel: number | null;
  aggregateRating: number | null;
  totalRatings: number | null;
  shortDescription: string | null;
  subRegion: string | null;
  subRegionColor: string | null;
  valley: string | null;
}

const NAPA_CENTER = { lat: 38.5025, lng: -122.4025 };

export function WineryMap() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [wineries, setWineries] = useState<WineryMapData[]>([]);
  const [selected, setSelected] = useState<WineryMapData | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    fetch(`/api/wineries?${params.toString()}`)
      .then((r) => r.json())
      .then(setWineries)
      .catch(console.error);
  }, [searchParams]);

  const handleNearMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => console.error("Geolocation error:", err)
    );
  };

  if (!apiKey) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--muted)]">
        <div className="text-center">
          <p className="text-lg font-medium">Map Unavailable</p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={userLocation || NAPA_CENTER}
          defaultZoom={10}
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "default"}
          className="h-full w-full"
          gestureHandling="greedy"
        >
          {wineries
            .filter((w) => w.lat && w.lng)
            .map((w) => (
              <AdvancedMarker
                key={w.id}
                position={{ lat: w.lat!, lng: w.lng! }}
                onClick={() => setSelected(w)}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-md text-white text-xs font-bold cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: w.subRegionColor || "#8B0000" }}
                >
                  {w.aggregateRating?.toFixed(1)?.slice(0, 3) || "?"}
                </div>
              </AdvancedMarker>
            ))}
          {userLocation && (
            <AdvancedMarker position={userLocation}>
              <div className="h-4 w-4 rounded-full bg-blue-500 border-2 border-white shadow-md" />
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>

      {selected && (
        <MapInfoCard winery={selected} onClose={() => setSelected(null)} />
      )}

      <button
        onClick={handleNearMe}
        className="absolute bottom-6 right-6 z-10 flex items-center gap-2 rounded-lg bg-[var(--card)] border border-[var(--border)] px-4 py-2.5 text-sm font-medium shadow-lg hover:bg-[var(--muted)] transition-colors"
      >
        <Locate className="h-4 w-4" />
        Near Me
      </button>
    </div>
  );
}
