import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BookTastingCTA } from "@/components/monetization/BookTastingCTA";

interface MapInfoCardProps {
  slug: string;
  name: string;
  subRegion: string | null;
  city: string | null;
  aggregateRating: number | null;
  totalRatings: number | null;
  priceLevel: number | null;
  shortDescription: string | null;
  heroImageUrl: string | null;
  websiteUrl: string | null;
}

export function MapInfoCard({
  winery,
  onClose,
}: {
  winery: MapInfoCardProps;
  onClose: () => void;
}) {
  const locationParts = [winery.subRegion, winery.city].filter(Boolean);

  return (
    <div className="absolute top-20 right-4 z-10 w-72 sm:w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl overflow-hidden">
      {/* Hero image */}
      {winery.heroImageUrl && (
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={winery.heroImageUrl}
            alt={winery.name}
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
        {!winery.heroImageUrl && (
          <button
            onClick={onClose}
            className="absolute top-2 right-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-lg"
            aria-label="Close"
          >
            &times;
          </button>
        )}

        {/* Location */}
        {locationParts.length > 0 && (
          <p className="text-xs text-[var(--muted-foreground)]">
            {locationParts.join(" · ")}
          </p>
        )}

        {/* Name */}
        <h3 className="mt-1 font-[var(--font-heading)] text-[15px] font-normal leading-snug pr-6">
          {winery.name}
        </h3>

        {/* Description */}
        {winery.shortDescription && (
          <p className="mt-1.5 text-xs text-[var(--muted-foreground)] line-clamp-2">
            {winery.shortDescription}
          </p>
        )}

        {/* Rating + Price */}
        <div className="mt-2 flex items-center justify-between">
          {winery.aggregateRating != null ? (
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
              <span className="text-xs font-medium">
                {winery.aggregateRating.toFixed(1)}
              </span>
            </div>
          ) : (
            <div />
          )}
          <span className="text-xs text-[var(--muted-foreground)]" aria-label={`Price level ${winery.priceLevel || 2} of 4`}>
            {"$".repeat(winery.priceLevel || 2)}
          </span>
        </div>

        {/* CTAs */}
        <div className="mt-3">
          <Link
            href={`/wineries/${winery.slug}`}
            className="block text-center rounded-lg bg-burgundy-700 px-4 py-2 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors"
          >
            View Details
          </Link>
          {winery.websiteUrl && (
            <div className="mt-2 flex justify-center">
              <BookTastingCTA
                websiteUrl={winery.websiteUrl}
                winerySlug={winery.slug}
                sourceComponent="map_info_card"
                size="sm"
                variant="outline"
                label="Book a Tasting"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
