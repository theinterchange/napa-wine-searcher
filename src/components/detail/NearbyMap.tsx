"use client";

import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import Link from "next/link";

interface NearbyWinery {
  slug: string;
  name: string;
  lat: number | null;
  lng: number | null;
}

interface NearbyMapProps {
  center: { lat: number; lng: number };
  name: string;
  nearby: NearbyWinery[];
}

export function NearbyMap({ center, name, nearby }: NearbyMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID;

  if (!apiKey) return null;

  const validNearby = nearby.filter(
    (w) => w.lat != null && w.lng != null
  ) as (NearbyWinery & { lat: number; lng: number })[];

  return (
    <div>
      <h3 className="font-heading text-xl font-semibold mb-4">
        Explore the Area
      </h3>
      <div className="rounded-xl overflow-hidden border border-[var(--border)]">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={center}
            defaultZoom={13}
            mapId={mapId}
            style={{ width: "100%", height: "300px" }}
            disableDefaultUI
            zoomControl
          >
            {/* Current winery — highlighted */}
            <AdvancedMarker position={center} title={name}>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-burgundy-700 text-white text-xs font-bold shadow-lg border-2 border-white">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </AdvancedMarker>

            {/* Nearby wineries */}
            {validNearby.map((w) => (
              <AdvancedMarker
                key={w.slug}
                position={{ lat: w.lat, lng: w.lng }}
                title={w.name}
              >
                <Link href={`/wineries/${w.slug}`}>
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-burgundy-700 text-[10px] font-bold shadow-md border border-[var(--border)] hover:bg-burgundy-50 transition-colors cursor-pointer">
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-3 h-3"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </Link>
              </AdvancedMarker>
            ))}
          </Map>
        </APIProvider>
      </div>

      {/* Nearby winery names below map */}
      {validNearby.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {validNearby.map((w) => (
            <Link
              key={w.slug}
              href={`/wineries/${w.slug}`}
              className="text-xs text-[var(--muted-foreground)] hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors"
            >
              {w.name} &rarr;
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
