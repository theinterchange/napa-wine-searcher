"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Sparkles, X, Eye } from "lucide-react";
import type { TripNearbyAccommodation } from "@/lib/itinerary/nearby-accommodations";
import { StayPreviewDrawer } from "./StayPreviewDrawer";

/**
 * Builder context, encoded in the edit-page URL so the picker can score
 * and pre-filter matches without re-fetching builder state. Everything
 * optional — trips without a builder origin (e.g., curated forks) still
 * render the picker, just without the scoring bonuses.
 */
export interface StayContext {
  dogs: boolean;
  kids: boolean;
  vibe: string | null;
}

interface StayPickerProps {
  accommodations: TripNearbyAccommodation[];
  context: StayContext;
  onPick: (hotel: TripNearbyAccommodation) => void;
  onDismiss: () => void;
}

type PriceTier = 1 | 2 | 3 | 4;

interface Scored {
  hotel: TripNearbyAccommodation;
  score: number;
  matchTags: string[];
}

/**
 * Score each candidate against the builder context. Higher score = better
 * fit for THIS trip. Filters out hotels that explicitly fail a hard
 * constraint (non-dog-friendly when dogs=yes, budget when vibe=luxury).
 */
function scoreAccommodations(
  list: TripNearbyAccommodation[],
  ctx: StayContext
): Scored[] {
  return list
    .filter((a) => {
      if (ctx.dogs && a.dogFriendly === false) return false;
      if (ctx.kids && a.kidFriendly === false) return false;
      if (ctx.vibe === "luxury" && a.priceTier != null && a.priceTier < 3)
        return false;
      return true;
    })
    .map((a) => {
      let score = 0;
      const tags: string[] = [];

      if (ctx.dogs && a.dogFriendly === true) {
        score += 30;
        tags.push("Dog-friendly");
      }
      if (ctx.kids && a.kidFriendly === true) {
        score += 30;
        tags.push("Kid-friendly");
      }
      if (ctx.vibe === "luxury" && (a.priceTier ?? 0) >= 3) {
        score += 15;
      }
      if (ctx.vibe === "romantic" && a.adultsOnly === true) {
        score += 10;
        tags.push("Adults-only");
      }
      if (a.sustainable === true) {
        tags.push("Sustainable");
      }
      if (a.whyStayHere) score += 5;
      // Favor hotels that are central to ALL stops, not just close to one.
      if (a.averageDistanceMiles < 5) score += 10;
      else if (a.averageDistanceMiles < 8) score += 5;
      score += a.googleRating ?? 0;
      return { hotel: a, score, matchTags: tags };
    })
    .sort((a, b) => b.score - a.score);
}

function editorialReason(a: TripNearbyAccommodation): string {
  if (a.whyStayHere && a.whyStayHere.length < 180) return a.whyStayHere;
  if (a.shortDescription) return a.shortDescription;
  if (a.bestFor) return `Best for ${a.bestFor.toLowerCase()}`;
  if (a.city) {
    return `${a.city} stay with easy access to your stops.`;
  }
  return "Close to your stops, vetted by our editorial team.";
}

export function StayPicker({
  accommodations,
  context,
  onPick,
  onDismiss,
}: StayPickerProps) {
  // Filters start unlit. Builder context (dogs/kids/luxury/etc.) drives
  // ranking via scoreAccommodations() so the top picks already match —
  // pre-lighting chips on top of that collapses the pool harshly when
  // amenity data has nulls. User can opt into hard filtering by tapping.
  const [filters, setFilters] = useState<{
    dog: boolean;
    kid: boolean;
    sustainable: boolean;
    adultsOnly: boolean;
  }>({
    dog: false,
    kid: false,
    sustainable: false,
    adultsOnly: false,
  });
  const [priceFilter, setPriceFilter] = useState<Set<PriceTier>>(
    () => new Set<PriceTier>()
  );
  const [previewHotel, setPreviewHotel] =
    useState<TripNearbyAccommodation | null>(null);

  const scored = useMemo(
    () => scoreAccommodations(accommodations, context),
    [accommodations, context]
  );

  // Apply the user-toggleable filters to the scored list. Null amenity
  // values mean "we don't have data" — we keep them in (only `false`
  // explicitly disqualifies). Price tier is well-populated, so we treat
  // its filter strictly.
  const filtered = useMemo(() => {
    return scored.filter(({ hotel }) => {
      if (filters.dog && hotel.dogFriendly === false) return false;
      if (filters.kid && hotel.kidFriendly === false) return false;
      if (filters.sustainable && hotel.sustainable === false) return false;
      if (filters.adultsOnly && hotel.adultsOnly === false) return false;
      if (priceFilter.size > 0) {
        const tier = hotel.priceTier as PriceTier | null;
        if (tier == null || !priceFilter.has(tier)) return false;
      }
      return true;
    });
  }, [scored, filters, priceFilter]);

  const handlePickFromDrawer = (hotel: TripNearbyAccommodation) => {
    setPreviewHotel(null);
    onPick(hotel);
  };

  const togglePrice = (tier: PriceTier) => {
    setPriceFilter((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  };

  if (accommodations.length === 0) {
    return (
      <section className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-burgundy-900">
              Pick where you&apos;ll stay
            </p>
            <h2 className="mt-1 font-serif text-xl font-semibold leading-tight">
              No hotels within range yet
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Add or change stops and we&apos;ll refresh the list.
            </p>
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={onDismiss}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <header className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-burgundy-900">
              Pick where you&apos;ll stay
            </p>
            <h2 className="mt-1 font-serif text-xl font-semibold leading-tight">
              Your home base
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Pick a hotel to anchor your trip. You can change this anytime.
            </p>
          </div>
          <button
            type="button"
            aria-label="I already have somewhere"
            onClick={onDismiss}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Filters row */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <FilterChip
            label="Dog-friendly"
            active={filters.dog}
            onClick={() => setFilters((f) => ({ ...f, dog: !f.dog }))}
          />
          <FilterChip
            label="Kid-friendly"
            active={filters.kid}
            onClick={() => setFilters((f) => ({ ...f, kid: !f.kid }))}
          />
          <FilterChip
            label="Sustainable"
            active={filters.sustainable}
            onClick={() =>
              setFilters((f) => ({ ...f, sustainable: !f.sustainable }))
            }
          />
          <FilterChip
            label="Adults-only"
            active={filters.adultsOnly}
            onClick={() =>
              setFilters((f) => ({ ...f, adultsOnly: !f.adultsOnly }))
            }
          />
          <span className="h-5 w-px bg-[var(--border)]" />
          {([1, 2, 3, 4] as PriceTier[]).map((tier) => (
            <FilterChip
              key={tier}
              label={"$".repeat(tier)}
              active={priceFilter.has(tier)}
              onClick={() => togglePrice(tier)}
            />
          ))}
        </div>

        <h3 className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground)]">
          <Sparkles className="h-3.5 w-3.5 text-burgundy-900" />
          {filters.dog || filters.kid || filters.sustainable || filters.adultsOnly || priceFilter.size > 0
            ? `${filtered.length} matches`
            : "Picked for your trip"}
        </h3>

        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted-foreground)]">
            No hotels match these filters. Loosen one to see more.
          </p>
        ) : (
          <ul
            className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2"
            aria-label="Hotel options"
          >
            {filtered.map(({ hotel, matchTags }) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                matchTags={matchTags}
                onPreview={() => setPreviewHotel(hotel)}
                onPick={() => onPick(hotel)}
              />
            ))}
          </ul>
        )}
      </section>

      <StayPreviewDrawer
        hotel={previewHotel}
        onClose={() => setPreviewHotel(null)}
        onPick={handlePickFromDrawer}
      />
    </>
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
      aria-pressed={active}
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

function HotelCard({
  hotel,
  matchTags,
  onPreview,
  onPick,
}: {
  hotel: TripNearbyAccommodation;
  matchTags: string[];
  onPreview: () => void;
  onPick: () => void;
}) {
  const price = hotel.priceTier
    ? "$".repeat(Math.max(1, Math.min(4, hotel.priceTier)))
    : null;
  return (
    <li className="w-[260px] shrink-0 snap-start">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] transition-shadow hover:shadow-md">
        <button
          type="button"
          onClick={onPreview}
          aria-label={`Preview ${hotel.name}`}
          className="relative aspect-[4/3] w-full bg-[var(--muted)]"
        >
          {hotel.heroImageUrl && (
            <Image
              src={hotel.heroImageUrl}
              alt=""
              fill
              sizes="260px"
              className="object-cover"
            />
          )}
        </button>
        <div className="flex flex-1 flex-col gap-2 p-3">
          <div>
            <button
              type="button"
              onClick={onPreview}
              className="line-clamp-1 text-left font-serif text-sm font-semibold leading-tight text-[var(--foreground)] hover:underline"
            >
              {hotel.name}
            </button>
            <div className="mt-0.5 line-clamp-1 text-[11px] text-[var(--muted-foreground)]">
              {hotel.city}
              {hotel.googleRating != null &&
                ` · ★ ${hotel.googleRating.toFixed(1)}`}
              {price && ` · ${price}`}
            </div>
            {hotel.averageDistanceMiles != null && (
              <div className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                ~{Math.round(hotel.averageDistanceMiles * 2)} min from stops
              </div>
            )}
          </div>
          <p className="line-clamp-2 text-xs text-[var(--muted-foreground)]">
            {editorialReason(hotel)}
          </p>
          {matchTags.length > 0 && (
            <ul className="flex flex-wrap gap-1">
              {matchTags.slice(0, 2).map((t) => (
                <li
                  key={t}
                  className="inline-flex items-center rounded-full border border-burgundy-900/30 bg-[color-mix(in_srgb,var(--muted)_40%,transparent)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-burgundy-900"
                >
                  {t}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-auto flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={onPreview}
              aria-label={`Preview ${hotel.name}`}
              className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:border-burgundy-900"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onPick}
              className="flex-1 rounded-lg bg-burgundy-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-burgundy-800"
            >
              Set as home base
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
