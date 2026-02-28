import { Star, MapPin } from "lucide-react";
import Link from "next/link";

interface MapInfoCardProps {
  slug: string;
  name: string;
  subRegion: string | null;
  city: string | null;
  aggregateRating: number | null;
  totalRatings: number | null;
  priceLevel: number | null;
  shortDescription: string | null;
}

export function MapInfoCard({
  winery,
  onClose,
}: {
  winery: MapInfoCardProps;
  onClose: () => void;
}) {
  return (
    <div className="absolute top-4 right-4 z-10 w-72 sm:w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xl">
      <button
        onClick={onClose}
        className="absolute top-2 right-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-lg"
        aria-label="Close"
      >
        &times;
      </button>
      <h3 className="font-heading text-lg font-semibold pr-6">{winery.name}</h3>
      <div className="mt-1 flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
        <MapPin className="h-3.5 w-3.5" />
        {winery.subRegion}{winery.city && ` · ${winery.city}`}
      </div>
      {winery.shortDescription && (
        <p className="mt-2 text-sm text-[var(--muted-foreground)] line-clamp-2">
          {winery.shortDescription}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between">
        {winery.aggregateRating != null ? (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-gold-500 text-gold-500" />
            <span className="text-sm font-medium">
              {winery.aggregateRating.toFixed(1)}
            </span>
          </div>
        ) : (
          <div />
        )}
        <span className="text-sm text-[var(--muted-foreground)]" aria-label={`Price level ${winery.priceLevel || 2} of 4`}>
          {"$".repeat(winery.priceLevel || 2)}
        </span>
      </div>
      <Link
        href={`/wineries/${winery.slug}`}
        className="mt-4 block text-center rounded-lg bg-burgundy-700 px-4 py-2 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors"
      >
        View Details
      </Link>
    </div>
  );
}
