"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, X, Search, Hotel, Plane } from "lucide-react";
import type { TripOriginValue } from "../TripOriginInput";

interface BuilderOriginInputProps {
  value: TripOriginValue | null;
  label: string;
  onChange: (value: TripOriginValue | null, label: string) => void;
}

type OriginResult = {
  id: string;
  kind: "hotel" | "city";
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
};

/**
 * Autocomplete starting-point input. Hits /api/origins/search for real
 * matches against our hotels + a preset city/airport list — typing
 * "Meadowood" pulls up Meadowood Napa Valley with real coords.
 *
 * No external Places API: results come from our own DB + static cities.
 */
export function BuilderOriginInput({
  value,
  label,
  onChange,
}: BuilderOriginInputProps) {
  const [query, setQuery] = useState(label);
  const [results, setResults] = useState<OriginResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Sync from external changes.
  useEffect(() => {
    setQuery(label);
  }, [label]);

  // Close dropdown on outside click.
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Fetch matching origins on query change.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/origins/search?q=${encodeURIComponent(trimmed)}&limit=8`, {
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : []))
        .then((data: OriginResult[]) => {
          setResults(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          if (err.name !== "AbortError") console.error(err);
        })
        .finally(() => setLoading(false));
    }, 180);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const pick = (r: OriginResult) => {
    onChange({ lat: r.lat, lng: r.lng, label: r.name }, r.name);
    setQuery(r.name);
    setOpen(false);
  };

  const handleChange = (v: string) => {
    setQuery(v);
    setOpen(true);
    if (v.trim() === "") {
      onChange(null, "");
    } else {
      // Free text held as a label; coords only set when a match is picked.
      onChange(null, v);
    }
  };

  const clear = () => {
    setQuery("");
    onChange(null, "");
    setOpen(false);
  };

  const hasCoords = value != null;
  const showDropdown = open && focused && query.trim().length >= 2;

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className={`flex h-10 items-center gap-2 rounded-lg border bg-[var(--card)] px-3 transition-colors focus-within:border-burgundy-900 ${
          hasCoords ? "border-burgundy-900" : "border-[var(--border)]"
        }`}
      >
        <MapPin
          className={`h-4 w-4 shrink-0 ${
            hasCoords ? "text-burgundy-900" : "text-[var(--muted-foreground)]"
          }`}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => setFocused(false)}
          placeholder="Airport, hotel, city, or address"
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear starting point"
            onClick={clear}
            className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg">
          {loading && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--muted-foreground)]">
              <Search className="h-3.5 w-3.5" />
              Searching…
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-[var(--muted-foreground)]">
              No matches — we&apos;ll use what you typed as a label.
            </div>
          )}
          {!loading && results.length > 0 && (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((r) => {
                const Icon =
                  r.kind === "hotel"
                    ? Hotel
                    : r.name.toLowerCase().includes("airport")
                    ? Plane
                    : MapPin;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pick(r);
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[var(--muted)]"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--muted)]">
                        <Icon className="h-4 w-4 text-[var(--muted-foreground)]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {r.name}
                        </span>
                        <span className="block truncate text-xs text-[var(--muted-foreground)]">
                          {r.subtitle}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
