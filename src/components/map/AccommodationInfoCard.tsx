import { Star, Dog, UserX, Baby } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BookHotelCTA } from "@/components/accommodation/BookHotelCTA";

interface AccommodationInfoCardProps {
  slug: string;
  name: string;
  city: string | null;
  type: string;
  priceTier: number | null;
  starRating: number | null;
  googleRating: number | null;
  bookingUrl: string | null;
  websiteUrl: string | null;
  lat: number | null;
  lng: number | null;
  heroImageUrl: string | null;
  shortDescription: string | null;
  dogFriendly: boolean | null;
  dogFriendlyNote: string | null;
  kidFriendly: boolean | null;
  kidFriendlyNote: string | null;
  adultsOnly: boolean | null;
}

const typeLabels: Record<string, string> = {
  hotel: "Hotel",
  inn: "Inn",
  resort: "Resort",
  vacation_rental: "Vacation Rental",
  bed_and_breakfast: "B&B",
};

export function AccommodationInfoCard({
  accommodation,
  onClose,
}: {
  accommodation: AccommodationInfoCardProps;
  onClose: () => void;
}) {
  const typeLabel = accommodation.starRating
    ? `${accommodation.starRating}-star ${(typeLabels[accommodation.type] || accommodation.type).toLowerCase()}`
    : typeLabels[accommodation.type] || accommodation.type;
  const locationParts = [typeLabel, accommodation.city].filter(Boolean);

  return (
    <div className="absolute top-20 right-4 z-10 w-72 sm:w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl overflow-hidden">
      {/* Hero image */}
      {accommodation.heroImageUrl && (
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={accommodation.heroImageUrl}
            alt={accommodation.name}
            fill
            className="object-cover"
            sizes="320px"
          />
          <button
            onClick={onClose}
            className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full bg-black/50 text-white text-sm hover:bg-black/70 transition-colors"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
      )}

      <div className="p-4">
        {/* Close button when no image */}
        {!accommodation.heroImageUrl && (
          <button
            onClick={onClose}
            className="absolute top-2 right-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-lg"
            aria-label="Close"
          >
            &times;
          </button>
        )}

        {/* Type · City */}
        <p className="text-xs text-[var(--muted-foreground)]">
          {locationParts.join(" · ")}
        </p>

        {/* Name */}
        <h3 className="mt-1 font-[var(--font-heading)] text-[15px] font-normal leading-snug pr-6">
          {accommodation.name}
        </h3>

        {/* Short description */}
        {accommodation.shortDescription && (
          <p className="mt-1.5 text-xs text-[var(--muted-foreground)] line-clamp-2">
            {accommodation.shortDescription}
          </p>
        )}

        {/* Rating + Price */}
        <div className="mt-2 flex items-center justify-between">
          {accommodation.googleRating != null ? (
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
              <span className="text-xs font-medium">
                {accommodation.googleRating.toFixed(1)}
              </span>
            </div>
          ) : (
            <div />
          )}
        </div>

        {/* Amenity badges */}
        {(accommodation.dogFriendly || accommodation.kidFriendly || accommodation.adultsOnly) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {accommodation.dogFriendly && !accommodation.dogFriendlyNote && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                <Dog className="h-3 w-3" /> Dog OK
              </span>
            )}
            {accommodation.dogFriendly && accommodation.dogFriendlyNote && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                title={accommodation.dogFriendlyNote}
              >
                <Dog className="h-3 w-3" /> Dog OK*
              </span>
            )}
            {accommodation.kidFriendly && !accommodation.kidFriendlyNote && !accommodation.adultsOnly && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                <Baby className="h-3 w-3" /> Kid Friendly
              </span>
            )}
            {accommodation.kidFriendly && accommodation.kidFriendlyNote && !accommodation.adultsOnly && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                title={accommodation.kidFriendlyNote}
              >
                <Baby className="h-3 w-3" /> Kid Friendly*
              </span>
            )}
            {accommodation.adultsOnly && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                <UserX className="h-3 w-3" /> Adults Only
              </span>
            )}
          </div>
        )}

        {/* CTAs — Book Now is primary */}
        <div className="mt-3">
          <BookHotelCTA
            bookingUrl={accommodation.bookingUrl}
            websiteUrl={accommodation.websiteUrl}
            accommodationName={accommodation.name}
            lat={accommodation.lat}
            lng={accommodation.lng}
            sourceComponent="map_info_card"
            size="lg"
            label="Book Now"
          />
          <Link
            href={`/where-to-stay/${accommodation.slug}`}
            className="mt-2 block text-center text-xs font-medium text-[var(--foreground)] hover:underline"
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
