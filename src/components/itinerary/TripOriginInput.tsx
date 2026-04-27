"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, X, AlertCircle } from "lucide-react";
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export interface TripOriginValue {
  lat: number;
  lng: number;
  label: string | null;
}

interface TripOriginInputProps {
  value: TripOriginValue | null;
  onChange: (value: TripOriginValue | null) => void;
  className?: string;
}

/**
 * Google Places–backed starting-point autocomplete. Results cover any
 * hotel, address, city, or landmark — biased toward Napa/Sonoma. Uses a
 * Places session token so keystrokes + final getDetails call are billed
 * as a single session.
 */
export function TripOriginInput(props: TripOriginInputProps) {
  if (!GOOGLE_MAPS_API_KEY) {
    if (typeof window !== "undefined") {
      console.warn("TripOriginInput: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY missing");
    }
    return null;
  }
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={["places"]}>
      <PlacesOriginInput {...props} />
    </APIProvider>
  );
}

function PlacesOriginInput({
  value,
  onChange,
  className = "",
}: TripOriginInputProps) {
  const places = useMapsLibrary("places");
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState(false);
  const acService = useRef<google.maps.places.AutocompleteService | null>(null);
  const detailsService = useRef<google.maps.places.PlacesService | null>(null);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(
    null
  );
  const dummyDiv = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!places) return;
    acService.current = new places.AutocompleteService();
    if (!dummyDiv.current) dummyDiv.current = document.createElement("div");
    detailsService.current = new places.PlacesService(dummyDiv.current);
    sessionToken.current = new places.AutocompleteSessionToken();
  }, [places]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!acService.current || trimmed.length < 2) {
      setPredictions([]);
      setError(false);
      return;
    }
    const timer = setTimeout(() => {
      acService.current!.getPlacePredictions(
        {
          input: trimmed,
          sessionToken: sessionToken.current ?? undefined,
          locationBias: {
            center: { lat: 38.5, lng: -122.4 },
            radius: 50_000,
          } as google.maps.places.LocationBias,
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            setPredictions(results ?? []);
            setError(false);
          } else if (
            status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS
          ) {
            setPredictions([]);
            setError(false);
          } else {
            console.error("Places autocomplete error:", status);
            setPredictions([]);
            setError(true);
          }
        }
      );
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const pick = (p: google.maps.places.AutocompletePrediction) => {
    if (!detailsService.current || !places) return;
    detailsService.current.getDetails(
      {
        placeId: p.place_id,
        fields: ["geometry", "formatted_address", "name"],
        sessionToken: sessionToken.current ?? undefined,
      },
      (place, status) => {
        if (
          status !== google.maps.places.PlacesServiceStatus.OK ||
          !place?.geometry?.location
        ) {
          console.error("Place details error:", status);
          return;
        }
        const label =
          place.name || place.formatted_address || p.description || null;
        onChange({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          label,
        });
        setQuery("");
        setPredictions([]);
        setFocused(false);
        // Tokens are single-use; mint a fresh one for the next session.
        sessionToken.current = new places.AutocompleteSessionToken();
      }
    );
  };

  if (value) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] ${className}`}
      >
        <MapPin className="h-4 w-4 text-burgundy-900" />
        <span>Starting from {value.label ?? "your location"}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Clear starting point"
          className="ml-0.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  const trimmed = query.trim();
  const showDropdown = focused && trimmed.length >= 2;

  return (
    <div
      ref={wrapperRef}
      className={`relative inline-block ${className}`}
      onBlur={(e) => {
        if (!wrapperRef.current?.contains(e.relatedTarget as Node)) {
          setFocused(false);
        }
      }}
    >
      <div className="flex h-10 w-72 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 transition-colors focus-within:border-burgundy-900">
        <MapPin className="h-4 w-4 shrink-0 text-burgundy-900" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Hotel, address, or city"
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"
          aria-label="Search a starting point"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQuery("");
              setPredictions([]);
            }}
            className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="h-3.5 w-3.5" />
              Couldn&apos;t load results — try again.
            </div>
          )}
          {!error && predictions.length === 0 && (
            <div className="px-3 py-2 text-xs text-[var(--muted-foreground)]">
              No matches for &ldquo;{trimmed}&rdquo;.
            </div>
          )}
          {!error && predictions.length > 0 && (
            <ul className="max-h-80 overflow-y-auto py-1">
              {predictions.map((p) => (
                <li key={p.place_id}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(p);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[var(--muted)]"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--muted)]">
                      <MapPin className="h-4 w-4 text-[var(--muted-foreground)]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {p.structured_formatting.main_text}
                      </span>
                      <span className="block truncate text-xs text-[var(--muted-foreground)]">
                        {p.structured_formatting.secondary_text}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
