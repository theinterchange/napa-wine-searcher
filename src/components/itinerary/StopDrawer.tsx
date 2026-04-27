"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X, Search } from "lucide-react";
import type { TripStop } from "@/lib/trip-state/types";

interface StopDrawerProps {
  open: boolean;
  title: string;
  /** Label above the suggestion grid — lets callers distinguish "alternatives" vs. "more wineries". */
  suggestionsLabel?: string;
  existingIds: Set<number>;
  suggested?: TripStop[];
  /** Optional: when provided, clicking a suggestion opens the preview drawer instead of adding directly. */
  onPreview?: (stop: TripStop) => void;
  onClose: () => void;
  onSelect: (stop: TripStop) => void;
}

type SearchRow = {
  id: number;
  slug: string;
  name: string;
  city: string | null;
  lat: number | null;
  lng: number | null;
  heroImageUrl: string | null;
  googleRating: number | null;
  aggregateRating: number | null;
  priceLevel: number | null;
  subRegion: string | null;
  subRegionSlug: string | null;
  valley: string | null;
  hoursJson: string | null;
  visitUrl: string | null;
  websiteUrl: string | null;
  dogFriendly: boolean | null;
  kidFriendly: boolean | null;
  picnicFriendly: boolean | null;
  sustainable: boolean | null;
  reservationRequired: boolean | null;
  dogFriendlySource: string | null;
  kidFriendlySource: string | null;
  picnicFriendlySource: string | null;
  sustainableSource: string | null;
  curated: boolean;
  lastScrapedAt: string | null;
};

function rowToStop(row: SearchRow): TripStop {
  return {
    wineryId: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    lat: row.lat,
    lng: row.lng,
    heroImageUrl: row.heroImageUrl,
    googleRating: row.googleRating,
    aggregateRating: row.aggregateRating,
    priceLevel: row.priceLevel,
    subRegion: row.subRegion,
    subRegionSlug: row.subRegionSlug,
    valley: row.valley,
    hoursJson: row.hoursJson,
    visitUrl: row.visitUrl,
    websiteUrl: row.websiteUrl,
    dogFriendly: row.dogFriendly,
    kidFriendly: row.kidFriendly,
    picnicFriendly: row.picnicFriendly,
    sustainable: row.sustainable,
    reservationRequired: row.reservationRequired,
    dogFriendlySource: row.dogFriendlySource,
    kidFriendlySource: row.kidFriendlySource,
    picnicFriendlySource: row.picnicFriendlySource,
    sustainableSource: row.sustainableSource,
    curated: row.curated,
    isFeatured: false,
    valleyVariant: "both",
    notes: null,
    suggestedDurationMinutes: null,
    tasting: null,
    tastingDurationMinutes: 60,
    lastScrapedAt: row.lastScrapedAt,
  };
}

export function StopDrawer({
  open,
  title,
  suggestionsLabel = "Suggested alternatives",
  existingIds,
  suggested,
  onPreview,
  onClose,
  onSelect,
}: StopDrawerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/wineries/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then((data) => {
          setResults(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          if (err.name !== "AbortError") console.error(err);
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, open]);

  const filteredSuggestions = useMemo(
    () =>
      (suggested ?? []).filter((s) => !existingIds.has(s.wineryId)).slice(0, 12),
    [suggested, existingIds]
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-[var(--background)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 py-3">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-[var(--muted)]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="p-4">
          {filteredSuggestions.length > 0 && (
            <section className="mb-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                {suggestionsLabel}
              </h3>
              <ul className="space-y-2">
                {filteredSuggestions.map((s) => {
                  const price = s.priceLevel
                    ? "$".repeat(Math.max(1, Math.min(4, s.priceLevel)))
                    : null;
                  return (
                    <li key={s.wineryId}>
                      <button
                        type="button"
                        onClick={() =>
                          onPreview ? onPreview(s) : onSelect(s)
                        }
                        className="flex w-full items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 text-left transition-colors hover:border-burgundy-900"
                      >
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-[var(--muted)]">
                          {s.heroImageUrl && (
                            <Image
                              src={s.heroImageUrl}
                              alt=""
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">
                            {s.name}
                          </div>
                          <div className="truncate text-xs text-[var(--muted-foreground)]">
                            {s.subRegion ?? s.city}
                            {s.googleRating != null
                              ? ` · ★ ${s.googleRating.toFixed(1)}`
                              : ""}
                            {price ? ` · ${price}` : ""}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              Search all wineries
            </h3>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                type="search"
                autoFocus
                placeholder="Search by name, town, or varietal"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2 pl-9 pr-3 text-sm outline-none focus:border-burgundy-900"
              />
            </label>
            {loading && (
              <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                Searching…
              </p>
            )}
            {!loading && query.length >= 2 && results.length === 0 && (
              <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                No wineries match.
              </p>
            )}
            <ul className="mt-3 space-y-2">
              {results
                .filter((r) => !existingIds.has(r.id))
                .map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(rowToStop(r))}
                      className="flex w-full items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 text-left hover:border-burgundy-900"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {r.name}
                        </div>
                        <div className="truncate text-xs text-[var(--muted-foreground)]">
                          {r.subRegion ?? r.city}
                          {r.googleRating != null
                            ? ` · ★ ${r.googleRating.toFixed(1)}`
                            : ""}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
