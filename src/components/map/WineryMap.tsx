"use client";

import { useState, useEffect, useCallback } from "react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { useSearchParams, useRouter } from "next/navigation";
import { MapBottomCard } from "./MapBottomCard";
import { Locate, Dog, Baby, TreePine, DoorOpen, Hotel, Leaf } from "lucide-react";

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
  heroImageUrl: string | null;
  websiteUrl: string | null;
  subRegion: string | null;
  subRegionColor: string | null;
  valley: string | null;
}

interface AccommodationMapData {
  id: number;
  slug: string;
  name: string;
  lat: number | null;
  lng: number | null;
  city: string | null;
  type: string;
  priceTier: number | null;
  starRating: number | null;
  googleRating: number | null;
  bookingUrl: string | null;
  websiteUrl: string | null;
  heroImageUrl: string | null;
  shortDescription: string | null;
  dogFriendly: boolean | null;
  dogFriendlyNote: string | null;
  kidFriendly: boolean | null;
  kidFriendlyNote: string | null;
  adultsOnly: boolean | null;
}

const NAPA_CENTER = { lat: 38.5025, lng: -122.4025 };
const PIN_COLOR = "#722F37"; // burgundy
const HOTEL_PIN_COLOR = "#B8860B"; // dark gold

interface FilterState {
  valley: string;
  dog: boolean;
  kid: boolean;
  picnic: boolean;
  walkin: boolean;
  sustainable: boolean;
  prices: Set<string>;
}

const defaultFilters: FilterState = {
  valley: "",
  dog: false,
  kid: false,
  picnic: false,
  walkin: false,
  sustainable: false,
  prices: new Set(),
};

export function WineryMap() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [wineries, setWineries] = useState<WineryMapData[]>([]);
  const [selected, setSelected] = useState<WineryMapData | null>(null);
  const [accommodations, setAccommodations] = useState<AccommodationMapData[]>([]);
  const [selectedAccommodation, setSelectedAccommodation] = useState<AccommodationMapData | null>(null);
  const [showHotels, setShowHotels] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const searchParams = useSearchParams();

  // Build query params from filters
  const buildParams = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (filters.valley) params.set("valley", filters.valley);
    else params.delete("valley");
    if (filters.dog) params.set("dog", "1");
    else params.delete("dog");
    if (filters.kid) params.set("kid", "1");
    else params.delete("kid");
    if (filters.picnic) params.set("picnic", "1");
    else params.delete("picnic");
    if (filters.walkin) params.set("reservation", "0");
    else params.delete("reservation");
    if (filters.sustainable) params.set("sustainable", "1");
    else params.delete("sustainable");
    if (filters.prices.size > 0) params.set("price", [...filters.prices].join(","));
    else params.delete("price");
    return params.toString();
  }, [filters, searchParams]);

  useEffect(() => {
    fetch(`/api/wineries?${buildParams()}`)
      .then((r) => r.json())
      .then(setWineries)
      .catch(console.error);
  }, [buildParams]);

  // Lazy-fetch accommodations only when hotel toggle is on
  useEffect(() => {
    if (!showHotels) return;
    const params = new URLSearchParams();
    if (filters.valley) params.set("valley", filters.valley);
    fetch(`/api/accommodations/map?${params.toString()}`)
      .then((r) => r.json())
      .then(setAccommodations)
      .catch(console.error);
  }, [showHotels, filters.valley]);

  const toggle = (key: keyof FilterState, value?: string) => {
    setFilters((prev) => {
      if (typeof prev[key] === "boolean") {
        return { ...prev, [key]: !prev[key] };
      }
      // For string filters, toggle between value and empty
      return { ...prev, [key]: prev[key] === value ? "" : value || "" };
    });
    setSelected(null);
    setSelectedAccommodation(null);
  };

  const togglePrice = (level: string) => {
    setFilters((prev) => {
      const next = new Set(prev.prices);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return { ...prev, prices: next };
    });
    setSelected(null);
  };

  const activeCount =
    Object.entries(filters).filter(
      ([k, v]) => k !== "prices" && (v === true || (typeof v === "string" && v !== ""))
    ).length + filters.prices.size;

  const handleNearMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
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
      {/* Filter bar */}
      <div className="absolute top-4 left-52 z-10 flex flex-wrap items-center gap-2">
        {/* Valley */}
        <div className="flex rounded-lg overflow-hidden border border-[var(--border)] shadow-md text-xs">
          {[
            { label: "All", value: "" },
            { label: "Napa", value: "napa" },
            { label: "Sonoma", value: "sonoma" },
          ].map((v) => (
            <button
              key={v.value}
              onClick={() => toggle("valley", v.value || undefined)}
              className={`px-3 py-2 transition-colors ${
                filters.valley === v.value
                  ? "bg-burgundy-700 text-white"
                  : "bg-[var(--card)] hover:bg-[var(--muted)]"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Amenity toggles */}
        {[
          { key: "dog" as const, label: "Dog Friendly", icon: Dog },
          { key: "kid" as const, label: "Kid Friendly", icon: Baby },
          { key: "picnic" as const, label: "Picnic", icon: TreePine },
          { key: "walkin" as const, label: "Walk-In", icon: DoorOpen },
          { key: "sustainable" as const, label: "Sustainable", icon: Leaf },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium shadow-md transition-colors ${
              filters[key]
                ? "bg-burgundy-700 text-white border-burgundy-700"
                : "bg-[var(--card)] border-[var(--border)] hover:bg-[var(--muted)]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}

        {/* Price (multi-select) */}
        {["1", "2", "3", "4"].map((p) => (
          <button
            key={p}
            onClick={() => togglePrice(p)}
            className={`rounded-lg border px-3 py-2 text-xs font-medium shadow-md transition-colors ${
              filters.prices.has(p)
                ? "bg-burgundy-700 text-white border-burgundy-700"
                : "bg-[var(--card)] border-[var(--border)] hover:bg-[var(--muted)]"
            }`}
          >
            {"$".repeat(Number(p))}
          </button>
        ))}

        {/* Clear */}
        {activeCount > 0 && (
          <button
            onClick={() => {
              setFilters({ ...defaultFilters, prices: new Set() });
              setSelectedAccommodation(null);
            }}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-medium shadow-md hover:bg-[var(--muted)] transition-colors"
          >
            Clear ({activeCount})
          </button>
        )}

        {/* Hotels layer toggle */}
        <label className="flex items-center gap-2 rounded-lg bg-[var(--card)] border border-[var(--border)] px-3 py-2 shadow-md cursor-pointer select-none">
          <Hotel className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
          <span className="text-xs font-medium">Hotels</span>
          <button
            role="switch"
            aria-checked={showHotels}
            onClick={() => {
              setShowHotels((prev) => !prev);
              setSelected(null);
              setSelectedAccommodation(null);
            }}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              showHotels ? "bg-gold-500" : "bg-[var(--muted)]"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                showHotels ? "translate-x-[18px]" : "translate-x-[3px]"
              }`}
            />
          </button>
        </label>
      </div>

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
                onClick={() => {
                  setSelected(w);
                  setSelectedAccommodation(null);
                }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-md text-white text-xs font-bold cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: PIN_COLOR }}
                >
                  {w.aggregateRating?.toFixed(1)?.slice(0, 3) || "?"}
                </div>
              </AdvancedMarker>
            ))}
          {showHotels &&
            accommodations
              .filter((a) => a.lat && a.lng)
              .map((a) => (
                <AdvancedMarker
                  key={`hotel-${a.id}`}
                  position={{ lat: a.lat!, lng: a.lng! }}
                  onClick={() => {
                    setSelectedAccommodation(a);
                    setSelected(null);
                  }}
                >
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-md border-2 border-white shadow-md text-white text-[10px] font-bold cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: HOTEL_PIN_COLOR }}
                  >
                    {a.starRating ? `${a.starRating}★` : "🛏"}
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

      {(selected || selectedAccommodation) && (
        <MapBottomCard
          winery={selected}
          accommodation={selectedAccommodation}
          onClose={() => {
            setSelected(null);
            setSelectedAccommodation(null);
          }}
        />
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
