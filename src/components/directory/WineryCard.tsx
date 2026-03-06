import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Wine, BadgeCheck } from "lucide-react";

interface WineryCardProps {
  slug: string;
  name: string;
  shortDescription: string | null;
  city: string | null;
  subRegion: string | null;
  valley: string | null;
  priceLevel: number | null;
  aggregateRating: number | null;
  totalRatings: number | null;
  reservationRequired: boolean | null;
  dogFriendly: boolean | null;
  picnicFriendly: boolean | null;
  kidFriendly: boolean | null;
  kidFriendlyConfidence: string | null;
  curated: boolean | null;
  heroImageUrl: string | null;
}

export function WineryCard({ winery }: { winery: WineryCardProps }) {
  return (
    <Link
      href={`/wineries/${winery.slug}`}
      className="group flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:shadow-lg hover:border-burgundy-300 dark:hover:border-burgundy-700 transition-all"
    >
      <div className="relative aspect-[16/9] bg-burgundy-100 dark:bg-burgundy-900 flex items-center justify-center overflow-hidden">
        {winery.heroImageUrl ? (
          <Image
            src={winery.heroImageUrl}
            alt={winery.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <Wine className="h-12 w-12 text-burgundy-300 dark:text-burgundy-700" />
        )}
        {winery.curated ? (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
            <BadgeCheck className="h-3 w-3" />
            Verified
          </span>
        ) : (
          <span className="absolute top-2 right-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            Preview
          </span>
        )}
      </div>
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-lg font-semibold group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors line-clamp-1">
            {winery.name}
          </h3>
          <span className="shrink-0 text-sm text-[var(--muted-foreground)]" aria-label={`Price level ${winery.priceLevel || 2} of 4`}>
            {"$".repeat(winery.priceLevel || 2)}
          </span>
        </div>
        {(winery.subRegion || winery.city) && (
          <div className="mt-1 flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
            <MapPin className="h-3.5 w-3.5" />
            <span>
              {[winery.subRegion, winery.city].filter(Boolean).join(" · ")}
            </span>
          </div>
        )}
        <p className="mt-2 text-sm text-[var(--muted-foreground)] line-clamp-2 flex-1">
          {winery.shortDescription}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2">
          {winery.aggregateRating != null && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-gold-500 text-gold-500" />
              <span className="text-sm font-medium">
                {winery.aggregateRating.toFixed(1)}
              </span>
              {winery.totalRatings != null && (
                <span className="text-xs text-[var(--muted-foreground)]">
                  ({winery.totalRatings.toLocaleString()})
                </span>
              )}
            </div>
          )}
          {winery.reservationRequired && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-burgundy-100 text-burgundy-700 dark:bg-burgundy-900 dark:text-burgundy-300">
              Reservation
            </span>
          )}
          {winery.dogFriendly && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-olive-100 text-olive-700 dark:bg-olive-900 dark:text-olive-300">
              Dog OK
            </span>
          )}
          {winery.kidFriendly && winery.kidFriendlyConfidence === "high" && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              Kid Friendly
            </span>
          )}
          {winery.kidFriendly && winery.kidFriendlyConfidence === "medium" && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
              title="Check with winery"
            >
              Kid Friendly*
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
