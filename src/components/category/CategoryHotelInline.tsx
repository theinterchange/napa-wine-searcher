import { BookHotelCTA } from "@/components/accommodation/BookHotelCTA";
import type { AccommodationCard as AccommodationCardData } from "@/lib/accommodation-data";
import type { WineryAmenity } from "@/lib/category-data";

interface CategoryHotelInlineProps {
  accommodation: AccommodationCardData;
  amenity: WineryAmenity;
  sourcePage: string;
}

const LEAD_COPY: Record<WineryAmenity, string> = {
  dog: "Bringing the dog?",
  kid: "Making it a weekend?",
  sustainable: "Making it a weekend?",
};

export function CategoryHotelInline({
  accommodation,
  amenity,
  sourcePage,
}: CategoryHotelInlineProps) {
  if (!accommodation.bookingUrl && !accommodation.websiteUrl) return null;

  return (
    <aside className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
      <div className="border-y border-[var(--rule)] py-5 flex flex-wrap items-center justify-between gap-3">
        <p className="font-[var(--font-serif-text)] text-[15px] text-[var(--ink-2)]">
          <span className="font-semibold text-[var(--ink)]">{LEAD_COPY[amenity]}</span>{" "}
          {accommodation.name} is the highest-rated{" "}
          {amenity === "dog" ? "dog-friendly stay" : "stay"}{" "}
          {accommodation.city ? `in ${accommodation.city}` : "nearby"}.
        </p>
        <BookHotelCTA
          bookingUrl={accommodation.bookingUrl}
          websiteUrl={accommodation.websiteUrl}
          accommodationName={accommodation.name}
          lat={accommodation.lat}
          lng={accommodation.lng}
          accommodationSlug={accommodation.slug}
          sourcePage={sourcePage}
          sourceComponent="category_bookhotel_inline"
          size="sm"
          label={`Book ${accommodation.name}`}
        />
      </div>
    </aside>
  );
}
