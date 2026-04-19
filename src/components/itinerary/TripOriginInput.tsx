"use client";

import { useState } from "react";
import { MapPin, X } from "lucide-react";

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
 * Common Napa & Sonoma starting points. Keeps this shippable without pulling
 * in Google Geocoding (a separate paid SKU). Free text is captured as a label
 * but doesn't re-optimize until a known location is picked.
 */
const PRESETS: TripOriginValue[] = [
  { lat: 37.6188, lng: -122.3756, label: "SFO / San Francisco Airport" },
  { lat: 37.7749, lng: -122.4194, label: "San Francisco" },
  { lat: 38.2975, lng: -122.2869, label: "Napa (downtown)" },
  { lat: 38.401, lng: -122.362, label: "Yountville" },
  { lat: 38.505, lng: -122.471, label: "St. Helena" },
  { lat: 38.5788, lng: -122.5797, label: "Calistoga" },
  { lat: 38.6103, lng: -122.8695, label: "Healdsburg" },
  { lat: 38.2919, lng: -122.4584, label: "Sonoma (downtown)" },
  { lat: 38.4405, lng: -122.7144, label: "Santa Rosa" },
  { lat: 38.3785, lng: -122.5447, label: "Glen Ellen / Kenwood" },
];

export function TripOriginInput({
  value,
  onChange,
  className = "",
}: TripOriginInputProps) {
  const [open, setOpen] = useState(false);

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

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-burgundy-900"
      >
        <MapPin className="h-4 w-4 text-burgundy-900" />
        Set a starting point
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-lg">
          <p className="px-2 pb-1 pt-1 text-xs text-[var(--muted-foreground)]">
            Choose where you're starting so we can re-order stops efficiently.
          </p>
          <ul className="max-h-72 overflow-auto">
            {PRESETS.map((p) => (
              <li key={p.label}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(p);
                    setOpen(false);
                  }}
                  className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-[var(--muted)]"
                >
                  {p.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
