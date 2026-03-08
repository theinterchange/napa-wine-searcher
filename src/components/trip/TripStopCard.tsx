"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeftRight, X, MapPin, Star, Clock, Wine, ChevronDown, CalendarCheck } from "lucide-react";
import { useState } from "react";
import type { RouteStop, Alternative } from "./TripPlanner";
import { formatDistance, formatDriveTime } from "@/lib/geo";

interface TripStopCardProps {
  stop: RouteStop;
  index: number;
  total: number;
  alternatives: Alternative[];
  onSwap: (stopId: number, newWinery: Alternative) => void;
  onRemove: (stopId: number) => void;
  onPreview?: (slug: string) => void;
}

export function TripStopCard({
  stop,
  index,
  total,
  alternatives,
  onSwap,
  onRemove,
  onPreview,
}: TripStopCardProps) {
  const [showAlts, setShowAlts] = useState(false);

  return (
    <div>
      <div className="flex gap-4">
        {/* Timeline */}
        <div className="flex flex-col items-center">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-burgundy-700 text-sm font-bold text-white">
            {index + 1}
          </div>
          {index < total - 1 && (
            <div className="w-0.5 flex-1 bg-burgundy-200 dark:bg-burgundy-800 mt-2" />
          )}
        </div>

        {/* Card */}
        <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden mb-2">
          <div className="flex flex-col sm:flex-row">
            <div className="relative aspect-[16/9] sm:aspect-auto sm:w-44 bg-burgundy-100 dark:bg-burgundy-900 shrink-0 flex items-center justify-center overflow-hidden">
              {stop.heroImageUrl ? (
                <Image
                  src={stop.heroImageUrl}
                  alt={stop.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 176px"
                  className="object-cover"
                />
              ) : (
                <Wine className="h-10 w-10 text-burgundy-300 dark:text-burgundy-700" />
              )}
            </div>
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={() => onPreview?.(stop.slug)}
                  className="font-heading text-lg font-semibold text-left hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors"
                >
                  {stop.name}
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  {alternatives.length > 0 && (
                    <button
                      onClick={() => setShowAlts(!showAlts)}
                      className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors"
                      title="Swap winery"
                    >
                      <ArrowLeftRight className="h-4 w-4" />
                    </button>
                  )}
                  {total > 2 && (
                    <button
                      onClick={() => onRemove(stop.id)}
                      className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 transition-colors"
                      title="Remove stop"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-1 flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {stop.subRegion}
                  {stop.city && ` · ${stop.city}`}
                </span>
                {(stop.googleRating || stop.aggregateRating) && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
                    {(stop.googleRating || stop.aggregateRating)?.toFixed(1)}
                  </span>
                )}
              </div>
              {stop.matchReasons && stop.matchReasons.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {stop.matchReasons.map((reason) => (
                    <span
                      key={reason}
                      className="inline-flex items-center rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              )}
              {stop.tasting?.min != null && (
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Tastings from ${Math.round(stop.tasting.min)}
                </p>
              )}
              <div className="mt-2">
                <Link
                  href={`/wineries/${stop.slug}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-burgundy-950 hover:bg-gold-400 transition-colors"
                >
                  <CalendarCheck className="h-3.5 w-3.5" />
                  Book a Tasting
                </Link>
              </div>
            </div>
          </div>

          {/* Alternatives dropdown */}
          {showAlts && alternatives.length > 0 && (
            <div className="border-t border-[var(--border)] bg-[var(--muted)]/30 p-3">
              <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
                Swap with:
              </p>
              <div className="space-y-2">
                {alternatives.map((alt) => (
                  <button
                    key={alt.id}
                    onClick={() => {
                      onSwap(stop.id, alt);
                      setShowAlts(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-left hover:border-burgundy-400 dark:hover:border-burgundy-600 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{alt.name}</p>
                      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                        {alt.subRegion && <span>{alt.subRegion}</span>}
                        {(alt.googleRating || alt.aggregateRating) && (
                          <span className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-gold-500 text-gold-500" />
                            {(alt.googleRating || alt.aggregateRating)?.toFixed(1)}
                          </span>
                        )}
                        {alt.priceLevel && (
                          <span>{"$".repeat(alt.priceLevel)}</span>
                        )}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 -rotate-90 text-[var(--muted-foreground)]" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drive segment */}
      {stop.segmentAfter && stop.segmentAfter.miles > 0 && (
        <div className="flex gap-4 mb-2">
          <div className="w-8" />
          <div className="flex items-center gap-2 py-1 px-3 text-xs text-[var(--muted-foreground)]">
            <Clock className="h-3.5 w-3.5" />
            <span>
              ~{formatDistance(stop.segmentAfter.miles)} · ~{formatDriveTime(stop.segmentAfter.minutes)} drive
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
