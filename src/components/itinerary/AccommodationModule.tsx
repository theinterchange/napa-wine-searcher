import Image from "next/image";
import Link from "next/link";
import { BookHotelCTA } from "@/components/accommodation/BookHotelCTA";
import type { TripNearbyAccommodation } from "@/lib/itinerary/nearby-accommodations";

interface AccommodationModuleProps {
  accommodations: TripNearbyAccommodation[];
  emphasized?: boolean;
}

export function AccommodationModule({
  accommodations,
  emphasized,
}: AccommodationModuleProps) {
  if (accommodations.length === 0) return null;

  return (
    <section
      className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 ${
        emphasized ? "ring-1 ring-gold-500/30" : ""
      }`}
      aria-labelledby="stay-near-this-trip"
    >
      <header className="mb-3">
        <h2
          id="stay-near-this-trip"
          className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]"
        >
          Stay near this trip
        </h2>
        <p className="mt-1 text-sm text-[var(--foreground)]">
          {accommodations.length === 1
            ? "One option within a short drive of your stops."
            : `${accommodations.length} options within a short drive of your stops.`}
        </p>
      </header>

      <ul className="space-y-3">
        {accommodations.map((a) => (
          <li
            key={a.id}
            className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-2"
          >
            <Link
              href={`/where-to-stay/${a.slug}`}
              className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-[var(--muted)]"
            >
              {(a.thumbnailUrl ?? a.heroImageUrl) && (
                <Image
                  src={a.thumbnailUrl ?? a.heroImageUrl!}
                  alt={a.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              )}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div>
                <Link
                  href={`/where-to-stay/${a.slug}`}
                  className="block truncate text-sm font-semibold text-[var(--foreground)] hover:underline"
                >
                  {a.name}
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--muted-foreground)]">
                  {a.googleRating != null && <span>★ {a.googleRating.toFixed(1)}</span>}
                  {a.priceTier != null && <span>{"$".repeat(a.priceTier)}</span>}
                  {a.closestDistanceMiles != null && (
                    <span>{a.closestDistanceMiles.toFixed(1)} mi from stops</span>
                  )}
                </div>
              </div>
              <div className="mt-1">
                <BookHotelCTA
                  bookingUrl={a.bookingUrl}
                  websiteUrl={a.websiteUrl}
                  accommodationId={a.id}
                  accommodationSlug={a.slug}
                  accommodationName={a.name}
                  lat={a.lat}
                  lng={a.lng}
                  sourceComponent="trip_page_accommodation_book"
                  size="sm"
                  label="Book stay"
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
