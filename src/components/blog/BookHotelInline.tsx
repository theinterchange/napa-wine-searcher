import { getAccommodationBySlug } from "@/lib/accommodation-data";
import { BookHotelCTA } from "@/components/accommodation/BookHotelCTA";

interface BookHotelInlineProps {
  slug: string;
  sourcePage?: string;
}

export async function BookHotelInline({ slug, sourcePage }: BookHotelInlineProps) {
  const acc = await getAccommodationBySlug(slug);
  if (!acc) return null;

  return (
    <span className="block my-4">
      <BookHotelCTA
        bookingUrl={acc.bookingUrl}
        websiteUrl={acc.websiteUrl}
        accommodationName={acc.name}
        lat={acc.lat}
        lng={acc.lng}
        accommodationId={acc.id}
        accommodationSlug={acc.slug}
        sourcePage={sourcePage}
        sourceComponent="blog_bookhotel_inline"
        size="sm"
        label={`Book ${acc.name}`}
      />
    </span>
  );
}
