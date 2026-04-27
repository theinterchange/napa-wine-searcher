"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Hotel,
  ExternalLink,
  Dog,
  Baby,
  Leaf,
  Users,
} from "lucide-react";
import type { TripNearbyAccommodation } from "@/lib/itinerary/nearby-accommodations";

interface StayPreviewDrawerProps {
  hotel: TripNearbyAccommodation | null;
  onClose: () => void;
  onPick: (hotel: TripNearbyAccommodation) => void;
}

/**
 * Evaluation surface for a single hotel. Renders hero + editorial prose +
 * amenities inline so the user can decide without leaving the planner.
 * Booking CTAs live on the TripReadySummary, not here — the drawer's only
 * conversion action is "Set as home base."
 */
export function StayPreviewDrawer({
  hotel,
  onClose,
  onPick,
}: StayPreviewDrawerProps) {
  useEffect(() => {
    if (!hotel) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [hotel, onClose]);

  if (!hotel) return null;

  const price = hotel.priceTier
    ? "$".repeat(Math.max(1, Math.min(4, hotel.priceTier)))
    : null;
  const priceRange =
    hotel.priceRangeMin != null
      ? hotel.priceRangeMax != null && hotel.priceRangeMax !== hotel.priceRangeMin
        ? `$${hotel.priceRangeMin}–$${hotel.priceRangeMax}/night`
        : `From $${hotel.priceRangeMin}/night`
      : null;

  const amenities = parseAmenities(hotel.amenitiesJson);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-label={`${hotel.name} preview`}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-hidden bg-[var(--background)] shadow-2xl"
      >
        <header className="relative shrink-0">
          <div className="relative aspect-[4/3] w-full bg-[var(--muted)]">
            {hotel.heroImageUrl ? (
              <Image
                src={hotel.heroImageUrl}
                alt=""
                fill
                sizes="448px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-burgundy-900/10 to-burgundy-900/5">
                <Hotel className="h-10 w-10 text-burgundy-900/40" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
            {hotel.subRegion ?? hotel.city ?? ""}
          </div>
          <h2 className="mt-1 font-serif text-2xl font-semibold leading-tight">
            {hotel.name}
          </h2>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--muted-foreground)]">
            {hotel.googleRating != null && (
              <span>
                ★ {hotel.googleRating.toFixed(1)}
                {hotel.googleReviewCount
                  ? ` (${hotel.googleReviewCount.toLocaleString()})`
                  : ""}
              </span>
            )}
            {price && <span>· {price}</span>}
            {hotel.starRating != null && <span>· {hotel.starRating}-star</span>}
            {hotel.averageDistanceMiles != null && (
              <span>
                · ~{Math.round(hotel.averageDistanceMiles * 2)} min from your stops
              </span>
            )}
          </div>

          {priceRange && (
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {priceRange}
            </p>
          )}

          {hotel.whyStayHere && (
            <p className="mt-4 text-sm leading-relaxed text-[var(--foreground)]">
              {hotel.whyStayHere}
            </p>
          )}

          {(hotel.theSetting || hotel.theExperience) && (
            <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
              {hotel.theSetting && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    The setting
                  </div>
                  <p className="mt-1 text-sm leading-relaxed">
                    {hotel.theSetting}
                  </p>
                </div>
              )}
              {hotel.theExperience && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    The experience
                  </div>
                  <p className="mt-1 text-sm leading-relaxed">
                    {hotel.theExperience}
                  </p>
                </div>
              )}
            </div>
          )}

          {(hotel.dogFriendly === true ||
            hotel.kidFriendly === true ||
            hotel.sustainable === true ||
            hotel.adultsOnly === true) && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {hotel.dogFriendly === true && (
                <MatchPill
                  icon={<Dog className="h-3.5 w-3.5" />}
                  label="Dog-friendly"
                />
              )}
              {hotel.kidFriendly === true && (
                <MatchPill
                  icon={<Baby className="h-3.5 w-3.5" />}
                  label="Kid-friendly"
                />
              )}
              {hotel.sustainable === true && (
                <MatchPill
                  icon={<Leaf className="h-3.5 w-3.5" />}
                  label="Sustainable"
                />
              )}
              {hotel.adultsOnly === true && (
                <MatchPill
                  icon={<Users className="h-3.5 w-3.5" />}
                  label="Adults-only"
                />
              )}
            </div>
          )}

          {amenities.length > 0 && (
            <div className="mt-4 border-t border-[var(--border)] pt-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Amenities
              </div>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {amenities.slice(0, 12).map((a) => (
                  <li
                    key={a}
                    className="rounded-full border border-[var(--border)] bg-[var(--card)] px-2.5 py-0.5 text-xs text-[var(--foreground)]"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hotel.bestFor && (
            <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Best for
              </div>
              <div className="mt-1 text-sm">{hotel.bestFor}</div>
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPick(hotel)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-burgundy-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-burgundy-800"
            >
              Set as home base
            </button>
            <Link
              href={`/where-to-stay/${hotel.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:border-burgundy-900"
            >
              Full page <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="mt-2 text-center text-[11px] text-[var(--muted-foreground)]">
            You can change this anytime while planning.
          </p>
        </footer>
      </aside>
    </>
  );
}

function MatchPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-burgundy-900/30 bg-[color-mix(in_srgb,var(--muted)_40%,transparent)] px-2.5 py-0.5 text-[11px] font-semibold text-burgundy-900">
      {icon}
      {label}
    </span>
  );
}

function parseAmenities(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is string => typeof v === "string");
    }
    return [];
  } catch {
    return [];
  }
}
