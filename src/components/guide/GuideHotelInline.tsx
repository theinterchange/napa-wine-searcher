import { BookHotelCTA } from "@/components/accommodation/BookHotelCTA";
import type { AccommodationCard as AccommodationCardData } from "@/lib/accommodation-data";

interface GuideHotelInlineProps {
  accommodation: AccommodationCardData;
  valleyLabel: string;
  sourcePage: string;
}

/**
 * Single inline hotel band for guide pages — the converting pattern proven on
 * blog (blog_bookhotel_inline) and category (category_bookhotel_inline) pages.
 * Placed at a high-intent spot (after the winery list) so the reader meets one
 * clear "Book [Hotel]" moment instead of the bottom 3-card grid that earns ~0.
 */
export function GuideHotelInline({
  accommodation,
  valleyLabel,
  sourcePage,
}: GuideHotelInlineProps) {
  const hasLink =
    accommodation.bookingUrl ||
    accommodation.websiteUrl ||
    (accommodation.lat != null && accommodation.lng != null);
  if (!hasLink) return null;

  const where = accommodation.city ? `in ${accommodation.city}` : `in ${valleyLabel}`;

  return (
    <aside className="mb-10">
      <div className="border-y border-[var(--rule)] py-5 flex flex-wrap items-center justify-between gap-3">
        <p className="font-[var(--font-serif-text)] text-[15px] text-[var(--ink-2)] max-w-[60ch]">
          <span className="font-semibold text-[var(--ink)]">Making a trip of it?</span>{" "}
          {accommodation.name} is the highest-rated place to stay {where} — an easy base
          for visiting these wineries.
        </p>
        <BookHotelCTA
          bookingUrl={accommodation.bookingUrl}
          websiteUrl={accommodation.websiteUrl}
          accommodationName={accommodation.name}
          lat={accommodation.lat}
          lng={accommodation.lng}
          accommodationSlug={accommodation.slug}
          sourcePage={sourcePage}
          sourceComponent="guide_bookhotel_inline"
          size="sm"
          label={`Book ${accommodation.name}`}
        />
      </div>
    </aside>
  );
}
