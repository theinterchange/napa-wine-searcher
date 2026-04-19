"use client";

import Image from "next/image";
import Link from "next/link";
import { GripVertical, X, ArrowRightLeft, ShieldCheck, Star } from "lucide-react";
import { BookTastingCTA } from "@/components/monetization/BookTastingCTA";
import { SourceTooltip } from "./SourceTooltip";
import type { TripStop } from "@/lib/trip-state/types";

interface TripStopCardProps {
  stop: TripStop;
  index: number;
  editable: boolean;
  onSwap?: (stop: TripStop) => void;
  onRemove?: (stop: TripStop) => void;
  onDragStart?: (index: number) => void;
  onDragOver?: (index: number) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

function priceLabel(level: number | null): string {
  if (level == null) return "";
  return "$".repeat(Math.max(1, Math.min(4, level)));
}

function tastingRangeLabel(
  tasting: TripStop["tasting"]
): string | null {
  if (!tasting) return null;
  if (tasting.min == null) return null;
  if (tasting.max == null || tasting.max === tasting.min) {
    return `Tasting from $${tasting.min}`;
  }
  return `Tasting $${tasting.min}–$${tasting.max}`;
}

export function TripStopCard({
  stop,
  index,
  editable,
  onSwap,
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
}: TripStopCardProps) {
  const rating = stop.googleRating ?? stop.aggregateRating;

  return (
    <article
      className={`relative grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition-shadow sm:grid-cols-[200px_1fr] ${
        isDragging ? "opacity-50 shadow-lg" : "hover:shadow-md"
      }`}
      draggable={editable}
      onDragStart={() => onDragStart?.(index)}
      onDragOver={(e) => {
        if (editable) {
          e.preventDefault();
          onDragOver?.(index);
        }
      }}
      onDragEnd={() => onDragEnd?.()}
    >
      <div className="absolute -left-[14px] top-4 flex h-8 w-8 items-center justify-center rounded-full bg-burgundy-900 text-sm font-semibold text-white shadow-md ring-2 ring-[var(--background)]">
        {index + 1}
      </div>

      <Link
        href={`/wineries/${stop.slug}`}
        className="relative block aspect-[16/10] overflow-hidden rounded-xl bg-[var(--muted)] sm:aspect-[4/3] sm:self-start"
      >
        {stop.heroImageUrl ? (
          <Image
            src={stop.heroImageUrl}
            alt={stop.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 200px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[var(--muted-foreground)]">
            No image
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
              {stop.subRegion && <span>{stop.subRegion}</span>}
              {stop.isFeatured && (
                <span
                  title="Featured stop"
                  className="inline-flex items-center gap-0.5 rounded-full bg-[#b8860b]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#8b6508]"
                >
                  <Star className="h-3 w-3 fill-current" />
                  Featured
                </span>
              )}
              {stop.curated && !stop.isFeatured && (
                <span
                  title="Verified by editorial team"
                  className="inline-flex items-center gap-0.5 text-[var(--gold-600,#B8860B)]"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              )}
            </div>
            <Link
              href={`/wineries/${stop.slug}`}
              className="mt-0.5 block truncate text-lg font-semibold text-[var(--foreground)] hover:underline"
            >
              {stop.name}
            </Link>
          </div>
          {editable && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onSwap?.(stop)}
                aria-label="Swap this stop"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onRemove?.(stop)}
                aria-label="Remove this stop"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <X className="h-4 w-4" />
              </button>
              <span
                aria-label="Drag to reorder"
                className="inline-flex h-8 w-6 cursor-grab items-center justify-center text-[var(--muted-foreground)] active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4" />
              </span>
            </div>
          )}
        </div>

        {stop.notes && (
          <p className="text-sm leading-snug text-[var(--foreground)]">
            {stop.notes}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
          {rating != null && (
            <span className="inline-flex items-center gap-1">
              ★ {rating.toFixed(1)}
            </span>
          )}
          {stop.priceLevel != null && <span>{priceLabel(stop.priceLevel)}</span>}
          {stop.tasting && (
            <span>{tastingRangeLabel(stop.tasting)}</span>
          )}
          <span>~{stop.tastingDurationMinutes} min visit</span>
          {stop.reservationRequired != null && (
            <span>
              {stop.reservationRequired ? "Reservation required" : "Walk-ins welcome"}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {stop.dogFriendly && (
            <SourceTooltip
              label="Dog-friendly"
              source={stop.dogFriendlySource}
            />
          )}
          {stop.kidFriendly && (
            <SourceTooltip
              label="Kid-friendly"
              source={stop.kidFriendlySource}
            />
          )}
          {stop.picnicFriendly && (
            <SourceTooltip
              label="Picnic area"
              source={stop.picnicFriendlySource}
            />
          )}
          {stop.sustainable && (
            <SourceTooltip
              label="Sustainable"
              source={stop.sustainableSource}
            />
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-3">
          {(stop.visitUrl || stop.websiteUrl) && (
            <BookTastingCTA
              websiteUrl={stop.visitUrl ?? stop.websiteUrl!}
              wineryId={stop.wineryId}
              winerySlug={stop.slug}
              sourceComponent="trip_page_stop_book_tasting"
              size="sm"
              label="Book tasting"
            />
          )}
          <Link
            href={`/wineries/${stop.slug}`}
            className="text-sm text-[var(--foreground)] underline-offset-4 hover:underline"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
