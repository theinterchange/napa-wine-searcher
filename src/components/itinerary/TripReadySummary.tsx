"use client";

import { forwardRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Hotel,
  Map as MapIcon,
  Share2,
  Bookmark,
  Check,
  Sparkles,
} from "lucide-react";
import { BookHotelCTA } from "@/components/accommodation/BookHotelCTA";
import type { TripHomeBase } from "@/lib/trip-state/types";
import { trackTripEvent } from "@/lib/analytics-events";

interface TripReadySummaryProps {
  homeBase: TripHomeBase | null;
  stopCount: number;
  totalDriveMin: number;
  totalMiles: number;
  totalTasteMin: number;
  minCost: number;
  maxCost: number;
  googleMapsUrl: string | null;
  saveState: "save" | "saved" | "signin";
  onSave: () => void;
  onShare: () => void;
  saving?: boolean;
  shareCode?: string | null;
  tripId?: number | null;
}

/**
 * End-of-flow "Your trip is ready" section. Stages the gold hotel Book
 * CTA at the excitement peak, with the trip totals and Save/Share
 * secondary actions alongside. Rendered only when there is enough trip
 * to summarize (at least one stop).
 */
export const TripReadySummary = forwardRef<HTMLElement, TripReadySummaryProps>(
  function TripReadySummary(
    {
      homeBase,
      stopCount,
      totalDriveMin,
      totalMiles,
      totalTasteMin,
      minCost,
      maxCost,
      googleMapsUrl,
      saveState,
      onSave,
      onShare,
      saving,
      shareCode,
      tripId,
    },
    ref
  ) {
    if (stopCount === 0) return null;
    const priceChars = homeBase?.priceTier
      ? "$".repeat(Math.max(1, Math.min(4, homeBase.priceTier)))
      : null;

    return (
      <section
        ref={ref}
        className="mt-10 rounded-3xl border border-burgundy-900/30 bg-gradient-to-br from-[var(--card)] to-[color-mix(in_srgb,var(--card)_85%,theme(colors.burgundy.900)_15%)] p-6 shadow-sm sm:p-8"
      >
        <header className="mb-6 text-center">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-burgundy-900">
            <Sparkles className="h-3.5 w-3.5" />
            Your trip is ready
          </p>
          <h2 className="mt-2 font-serif text-2xl font-semibold leading-tight sm:text-3xl">
            {homeBase ? "Book your stay and start packing" : "Save, share, and start packing"}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {homeBase
              ? "You locked in your home base and stops — one tap to book the hotel."
              : "You can add a home base anytime to make booking one tap."}
          </p>
        </header>

        {homeBase && (
          <div className="mb-6 grid overflow-hidden rounded-2xl border border-burgundy-900/40 bg-[var(--background)] sm:grid-cols-[220px_1fr]">
            <div className="relative aspect-[4/3] w-full bg-[var(--muted)] sm:aspect-auto sm:h-full">
              {homeBase.heroImageUrl ? (
                <Image
                  src={homeBase.heroImageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 220px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-burgundy-900/10 to-burgundy-900/5">
                  <Hotel className="h-10 w-10 text-burgundy-900/40" />
                </div>
              )}
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-burgundy-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-md">
                <Hotel className="h-3 w-3" />
                Home base
              </span>
            </div>
            <div className="flex flex-col gap-3 p-5">
              <div>
                <h3 className="font-serif text-xl font-semibold leading-tight">
                  {homeBase.name}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[var(--muted-foreground)]">
                  {homeBase.city && <span>{homeBase.city}</span>}
                  {homeBase.googleRating != null && (
                    <span>· ★ {homeBase.googleRating.toFixed(1)}</span>
                  )}
                  {priceChars && <span>· {priceChars}</span>}
                  {homeBase.starRating != null && (
                    <span>· {homeBase.starRating}-star</span>
                  )}
                </div>
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-3">
                <BookHotelCTA
                  bookingUrl={homeBase.bookingUrl}
                  websiteUrl={homeBase.websiteUrl}
                  accommodationId={homeBase.id}
                  accommodationSlug={homeBase.slug}
                  accommodationName={homeBase.name}
                  lat={homeBase.lat}
                  lng={homeBase.lng}
                  sourceComponent="trip_summary_stay_book"
                  size="lg"
                  label="Book your stay"
                />
                <Link
                  href={`/where-to-stay/${homeBase.slug}`}
                  className="text-xs font-medium text-[var(--muted-foreground)] underline-offset-2 hover:underline"
                >
                  See hotel details
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Trip totals */}
        <dl className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Stops" value={String(stopCount)} />
          <Stat
            label="Drive"
            value={`${totalDriveMin} min · ${totalMiles} mi`}
          />
          <Stat
            label="Tasting time"
            value={`${Math.round(totalTasteMin / 60)} hr`}
          />
          <Stat
            label="Tasting fees"
            value={
              minCost === 0
                ? "Varies"
                : minCost === maxCost
                ? `$${minCost}`
                : `$${minCost}–$${maxCost}`
            }
          />
        </dl>

        {/* Secondary actions */}
        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-[var(--border)] pt-5">
          {saveState === "saved" ? (
            <span className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)]">
              <Check className="h-4 w-4 text-burgundy-900" /> Saved to your trips
            </span>
          ) : (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-burgundy-900 bg-[var(--card)] px-4 py-2 text-sm font-semibold text-burgundy-900 hover:bg-burgundy-900 hover:text-white disabled:opacity-50"
            >
              <Bookmark className="h-4 w-4" />
              {saveState === "signin" ? "Save trip" : "Save trip"}
            </button>
          )}
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:border-burgundy-900"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackTripEvent({
                  eventName: "trip_exported",
                  shareCode: shareCode ?? undefined,
                  tripId: tripId ?? undefined,
                  payload: { target: "google_maps" },
                })
              }
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:border-burgundy-900"
            >
              <MapIcon className="h-4 w-4" /> Open in Maps
            </a>
          )}
        </div>
      </section>
    );
  }
);

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-center">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
      </dt>
      <dd className="mt-1 font-serif text-base font-semibold text-[var(--foreground)]">
        {value}
      </dd>
    </div>
  );
}
