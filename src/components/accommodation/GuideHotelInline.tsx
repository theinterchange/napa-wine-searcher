import { BookHotelCTA } from "@/components/accommodation/BookHotelCTA";
import type { AccommodationCard as AccommodationCardData } from "@/lib/accommodation-data";

interface GuideHotelInlineProps {
  accommodation: AccommodationCardData;
  sourcePage: string;
  /** Distinct outbound_clicks label so each surface is measured separately. */
  sourceComponent?: string;
  /** Bold lead-in copy; defaults to the guide phrasing. */
  lead?: string;
}

/**
 * Single "Book [top hotel]" gold band — the converting pattern proven on
 * blog/winery/category surfaces (one clear gold CTA in the reading flow beats
 * the bottom-of-page card grid, which historically converted at ~0). Used on
 * guide pages (after the winery grid) and the /wineries directory (after the
 * results grid), where trip intent peaks.
 */
export function GuideHotelInline({
  accommodation,
  sourcePage,
  sourceComponent = "guide_bookhotel_inline",
  lead = "Making it a weekend?",
}: GuideHotelInlineProps) {
  const hasLink =
    accommodation.bookingUrl ||
    accommodation.websiteUrl ||
    (accommodation.lat != null && accommodation.lng != null);
  if (!hasLink) return null;

  return (
    <aside className="mb-10 border-y border-[var(--rule)] py-5 flex flex-wrap items-center justify-between gap-3">
      <p className="font-[var(--font-serif-text)] text-[15px] text-[var(--ink-2)] max-w-[62ch]">
        <span className="font-semibold text-[var(--ink)]">{lead}</span>{" "}
        {accommodation.name} is a top-rated place to stay
        {accommodation.city ? ` in ${accommodation.city}` : " nearby"}.
      </p>
      <BookHotelCTA
        bookingUrl={accommodation.bookingUrl}
        websiteUrl={accommodation.websiteUrl}
        accommodationName={accommodation.name}
        lat={accommodation.lat}
        lng={accommodation.lng}
        accommodationSlug={accommodation.slug}
        sourcePage={sourcePage}
        sourceComponent={sourceComponent}
        size="sm"
        label={`Book ${accommodation.name}`}
      />
    </aside>
  );
}
