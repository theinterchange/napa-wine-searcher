import { BookHotelCTA } from "@/components/accommodation/BookHotelCTA";
import type { AccommodationCard as AccommodationCardData } from "@/lib/accommodation-data";

interface WineryHotelInlineProps {
  accommodation: AccommodationCardData & { distanceMiles?: number | null };
  wineryName: string;
  winerySlug: string;
}

/**
 * Single "Book [nearest hotel]" band for winery detail pages — the converting
 * pattern proven on blog/category/guide surfaces (one clear gold CTA beats a
 * card grid). Winery pages are the top on-site pageview + hotel-conversion
 * surface, so this leads the "Where to Stay Nearby" section.
 */
export function WineryHotelInline({
  accommodation,
  wineryName,
  winerySlug,
}: WineryHotelInlineProps) {
  const hasLink =
    accommodation.bookingUrl ||
    accommodation.websiteUrl ||
    (accommodation.lat != null && accommodation.lng != null);
  if (!hasLink) return null;

  const distance =
    accommodation.distanceMiles != null
      ? accommodation.distanceMiles < 1
        ? "less than a mile"
        : `${accommodation.distanceMiles.toFixed(1)} miles`
      : null;

  return (
    <aside className="border-y border-[var(--rule)] py-5 flex flex-wrap items-center justify-between gap-3">
      <p className="font-[var(--font-serif-text)] text-[15px] text-[var(--ink-2)] max-w-[62ch]">
        <span className="font-semibold text-[var(--ink)]">Staying the night?</span>{" "}
        {accommodation.name} is the closest place to stay
        {distance
          ? ` — ${distance} from ${wineryName}`
          : accommodation.city
            ? ` in ${accommodation.city}`
            : ""}
        .
      </p>
      <BookHotelCTA
        bookingUrl={accommodation.bookingUrl}
        websiteUrl={accommodation.websiteUrl}
        accommodationName={accommodation.name}
        lat={accommodation.lat}
        lng={accommodation.lng}
        accommodationSlug={accommodation.slug}
        sourcePage={`/wineries/${winerySlug}`}
        sourceComponent="winery_bookhotel_inline"
        size="sm"
        label={`Book ${accommodation.name}`}
      />
    </aside>
  );
}
