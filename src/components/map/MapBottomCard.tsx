"use client";

import { Star, Dog, Baby, UserX, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BookHotelCTA } from "@/components/accommodation/BookHotelCTA";
import { BookTastingCTA } from "@/components/monetization/BookTastingCTA";

interface WineryData {
  slug: string;
  name: string;
  subRegion: string | null;
  city: string | null;
  aggregateRating: number | null;
  priceLevel: number | null;
  shortDescription: string | null;
  heroImageUrl: string | null;
  websiteUrl: string | null;
}

interface AccommodationData {
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

export function MapBottomCard({
  winery,
  accommodation,
  onClose,
}: {
  winery?: WineryData | null;
  accommodation?: AccommodationData | null;
  onClose: () => void;
}) {
  const item = winery || accommodation;
  if (!item) return null;

  const isHotel = !!accommodation;
  const subtitle = isHotel
    ? [typeLabels[accommodation!.type] || accommodation!.type, accommodation!.city].filter(Boolean).join(" · ")
    : [winery!.subRegion, winery!.city].filter(Boolean).join(" · ");
  const rating = isHotel ? accommodation!.googleRating : winery!.aggregateRating;
  const price = isHotel
    ? null
    : "$".repeat(winery!.priceLevel || 2);
  const starClass = isHotel && accommodation!.starRating
    ? `${accommodation!.starRating}-star ${typeLabels[accommodation!.type]?.toLowerCase() || accommodation!.type}`
    : null;
  const detailHref = isHotel
    ? `/where-to-stay/${accommodation!.slug}`
    : `/wineries/${winery!.slug}`;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 w-[calc(100%-2rem)] max-w-lg animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="flex rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl overflow-hidden">
        {/* Image */}
        {item.heroImageUrl && (
          <Link href={detailHref} className="relative w-32 min-h-[120px] shrink-0">
            <Image
              src={item.heroImageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="128px"
            />
          </Link>
        )}

        {/* Content */}
        <div className="flex-1 p-3 min-w-0">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center rounded-full hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)]"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
              {subtitle}
            </p>
          )}

          {/* Name */}
          <h3 className="font-[var(--font-heading)] text-[14px] font-normal leading-snug pr-6 line-clamp-1">
            {item.name}
          </h3>

          {/* Description */}
          {item.shortDescription && (
            <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)] line-clamp-1">
              {item.shortDescription}
            </p>
          )}

          {/* Rating + Price + Badges row */}
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            {rating != null && (
              <div className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-gold-500 text-gold-500" />
                <span className="text-[11px] font-medium">{rating.toFixed(1)}</span>
              </div>
            )}
            {price && (
              <span className="text-[11px] text-[var(--muted-foreground)]">{price}</span>
            )}
            {starClass && (
              <span className="text-[11px] text-[var(--muted-foreground)]">{starClass}</span>
            )}
            {isHotel && accommodation!.dogFriendly && (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] text-[var(--muted-foreground)]"
                title={accommodation!.dogFriendlyNote || undefined}
              >
                <Dog className="h-2.5 w-2.5" /> Dog OK{accommodation!.dogFriendlyNote ? "*" : ""}
              </span>
            )}
            {isHotel && accommodation!.kidFriendly && !accommodation!.adultsOnly && (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] text-[var(--muted-foreground)]"
                title={accommodation!.kidFriendlyNote || undefined}
              >
                <Baby className="h-2.5 w-2.5" /> Kids{accommodation!.kidFriendlyNote ? "*" : ""}
              </span>
            )}
            {isHotel && accommodation!.adultsOnly && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--muted-foreground)]">
                <UserX className="h-2.5 w-2.5" /> Adults
              </span>
            )}
          </div>

          {/* CTAs */}
          <div className="mt-2 flex items-center gap-2">
            {isHotel ? (
              <BookHotelCTA
                bookingUrl={accommodation!.bookingUrl}
                websiteUrl={accommodation!.websiteUrl}
                accommodationName={accommodation!.name}
                lat={accommodation!.lat}
                lng={accommodation!.lng}
                sourceComponent="map_bottom_card"
                size="sm"
                label="Book Now"
              />
            ) : winery!.websiteUrl ? (
              <BookTastingCTA
                websiteUrl={winery!.websiteUrl}
                winerySlug={winery!.slug}
                sourceComponent="map_bottom_card"
                size="sm"
                label="Book Tasting"
              />
            ) : null}
            <Link
              href={detailHref}
              className="text-[11px] font-medium text-[var(--foreground)] hover:underline whitespace-nowrap"
            >
              Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
