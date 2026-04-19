"use client";

import { useMemo, useState } from "react";
import { CuratedTripGallery, type CuratedTripCard } from "./CuratedTripGallery";

interface CuratedLibraryProps {
  trips: CuratedTripCard[];
}

type FilterKey = "region" | "vibe" | "duration";

const DURATION_LABELS: Record<string, string> = {
  half: "Half day",
  full: "Full day",
  weekend: "Weekend",
};

export function CuratedLibrary({ trips }: CuratedLibraryProps) {
  const [selected, setSelected] = useState<Record<FilterKey, string | null>>({
    region: null,
    vibe: null,
    duration: null,
  });

  const options = useMemo(() => {
    const regions = new Set<string>();
    const vibes = new Set<string>();
    const durations = new Set<string>();
    for (const t of trips) {
      if (t.region) regions.add(t.region);
      if (t.groupVibe) vibes.add(t.groupVibe);
      if (t.duration) durations.add(t.duration);
    }
    return {
      region: [...regions].sort(),
      vibe: [...vibes].sort(),
      duration: ["half", "full", "weekend"].filter((d) => durations.has(d)),
    };
  }, [trips]);

  const filtered = useMemo(() => {
    return trips.filter((t) => {
      if (selected.region && t.region !== selected.region) return false;
      if (selected.vibe && t.groupVibe !== selected.vibe) return false;
      if (selected.duration && t.duration !== selected.duration) return false;
      return true;
    });
  }, [trips, selected]);

  function toggle(key: FilterKey, value: string) {
    setSelected((prev) => ({
      ...prev,
      [key]: prev[key] === value ? null : value,
    }));
  }

  const hasAnyFilter =
    selected.region !== null ||
    selected.vibe !== null ||
    selected.duration !== null;

  const hasAnyOptions =
    options.region.length > 1 ||
    options.vibe.length > 1 ||
    options.duration.length > 1;

  return (
    <div>
      {hasAnyOptions && (
        <div className="mb-6 space-y-2.5">
          {options.region.length > 1 && (
            <FilterRow label="Region">
              {options.region.map((r) => (
                <FilterChip
                  key={`region-${r}`}
                  label={r}
                  active={selected.region === r}
                  onClick={() => toggle("region", r)}
                />
              ))}
            </FilterRow>
          )}
          {options.vibe.length > 1 && (
            <FilterRow label="Vibe">
              {options.vibe.map((v) => (
                <FilterChip
                  key={`vibe-${v}`}
                  label={v}
                  active={selected.vibe === v}
                  onClick={() => toggle("vibe", v)}
                />
              ))}
            </FilterRow>
          )}
          {options.duration.length > 1 && (
            <FilterRow label="Duration">
              {options.duration.map((d) => (
                <FilterChip
                  key={`duration-${d}`}
                  label={DURATION_LABELS[d] ?? d}
                  active={selected.duration === d}
                  onClick={() => toggle("duration", d)}
                />
              ))}
            </FilterRow>
          )}
          {hasAnyFilter && (
            <button
              type="button"
              onClick={() => setSelected({ region: null, vibe: null, duration: null })}
              className="text-xs text-[var(--muted-foreground)] underline-offset-2 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted-foreground)]">
          No curated trips match these filters. Clear a filter to see more.
        </p>
      ) : (
        <CuratedTripGallery trips={filtered} />
      )}
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-20 shrink-0 text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-burgundy-900 bg-burgundy-900 text-white"
          : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-burgundy-900"
      }`}
    >
      {label}
    </button>
  );
}
