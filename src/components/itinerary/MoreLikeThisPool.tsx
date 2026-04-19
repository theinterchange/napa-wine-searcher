"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { TripStop } from "@/lib/trip-state/types";

interface MoreLikeThisPoolProps {
  theme: string | null;
  valley: string | null;
  excludeIds: number[];
  /** Opens the slide-over preview drawer (caller owns the drawer state). */
  onPreview: (stop: TripStop) => void;
}

export function MoreLikeThisPool({
  theme,
  valley,
  excludeIds,
  onPreview,
}: MoreLikeThisPoolProps) {
  const [pool, setPool] = useState<TripStop[] | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!theme) {
      setPool([]);
      return;
    }
    const params = new URLSearchParams({ theme, limit: "18" });
    if (valley) params.set("valley", valley);
    if (excludeIds.length > 0) params.set("excludeIds", excludeIds.join(","));
    let cancelled = false;
    fetch(`/api/itineraries/pool?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : { pool: [] }))
      .then((data) => {
        if (!cancelled) setPool(data.pool ?? []);
      })
      .catch(() => {
        if (!cancelled) setPool([]);
      });
    return () => {
      cancelled = true;
    };
  }, [theme, valley, excludeIds.join(",")]);

  if (pool === null) {
    return (
      <section className="mt-10">
        <h2 className="font-serif text-xl font-semibold">
          More wineries that fit this trip
        </h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">Loading…</p>
      </section>
    );
  }

  if (pool.length === 0) return null;

  const visible = expanded ? pool : pool.slice(0, 6);

  return (
    <section className="mt-10">
      <header className="mb-5">
        <h2 className="font-serif text-xl font-semibold">
          More wineries that fit this trip
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          The featured stops above were picked from this pool. Tap a card to
          preview and add it to your trip.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((w) => {
          const price = w.priceLevel
            ? "$".repeat(Math.max(1, Math.min(4, w.priceLevel)))
            : null;
          return (
            <li key={w.wineryId}>
              <button
                type="button"
                onClick={() => onPreview(w)}
                className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] text-left transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[4/3] w-full bg-[var(--muted)]">
                  {w.heroImageUrl && (
                    <Image
                      src={w.heroImageUrl}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <div className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">
                    {w.subRegion ?? w.city ?? ""}
                  </div>
                  <h3 className="font-serif text-base font-semibold text-[var(--foreground)] group-hover:underline">
                    {w.name}
                  </h3>
                  <div className="mt-auto flex items-center gap-2 pt-2 text-xs text-[var(--muted-foreground)]">
                    {w.googleRating != null && (
                      <span>★ {w.googleRating.toFixed(1)}</span>
                    )}
                    {price && <span>· {price}</span>}
                    {w.tasting?.min != null && (
                      <span>· From ${w.tasting.min}</span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {pool.length > 6 && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-5 text-sm font-medium text-[var(--foreground)] underline-offset-4 hover:underline"
        >
          {expanded ? "Show fewer" : `Show ${pool.length - 6} more`}
        </button>
      )}
    </section>
  );
}
