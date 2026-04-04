import Link from "next/link";
import Image from "next/image";
import { MapPin, BedDouble, Star, Dog, Baby, Heart } from "lucide-react";
import type { AccommodationCard as AccommodationCardData } from "@/lib/accommodation-data";

const typeLabels: Record<string, string> = {
  hotel: "Hotel",
  inn: "Inn",
  resort: "Resort",
  vacation_rental: "Vacation Rental",
  bed_and_breakfast: "B&B",
};

const valleyPrefix: Record<string, string> = {
  napa: "/napa-valley",
  sonoma: "/sonoma-county",
};

export function AccommodationCard({
  accommodation,
}: {
  accommodation: AccommodationCardData & { distanceMiles?: number | null };
}) {
  const a = accommodation;
  const subRegionHref =
    a.subRegion && a.subRegionSlug && a.valley && valleyPrefix[a.valley]
      ? `${valleyPrefix[a.valley]}/${a.subRegionSlug}`
      : null;

  const tags: string[] = a.bestForTags ? JSON.parse(a.bestForTags) : [];

  return (
    <div className="group relative flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:shadow-lg hover:border-burgundy-300 dark:hover:border-burgundy-700 transition-all">
      <Link
        href={`/where-to-stay/${a.slug}`}
        className="absolute inset-0 z-10"
        aria-label={a.name}
      />
      <div className="relative aspect-[16/9] bg-burgundy-100 dark:bg-burgundy-900 flex items-center justify-center overflow-hidden">
        {a.heroImageUrl || a.thumbnailUrl ? (
          <Image
            src={a.heroImageUrl || a.thumbnailUrl!}
            alt={a.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <BedDouble className="h-12 w-12 text-burgundy-300 dark:text-burgundy-700" />
        )}
        <span className="absolute top-2 left-2 rounded-full bg-white dark:bg-gray-900 px-2.5 py-0.5 text-xs font-semibold text-gray-900 dark:text-gray-100 shadow-sm">
          {typeLabels[a.type] || a.type}
        </span>
      </div>
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-lg font-semibold group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors line-clamp-1">
            {a.name}
          </h3>
          <span
            className="shrink-0 text-sm text-[var(--muted-foreground)]"
            aria-label={`Price level ${a.priceTier || 2} of 4`}
          >
            {"$".repeat(a.priceTier || 2)}
          </span>
        </div>
        {(a.subRegion || a.city) && (
          <div className="mt-1 flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
            <MapPin className="h-3.5 w-3.5" />
            {subRegionHref ? (
              <span>
                <Link
                  href={subRegionHref}
                  className="relative z-20 hover:text-[var(--foreground)] hover:underline transition-colors"
                >
                  {a.subRegion}
                </Link>
                {a.city && ` · ${a.city}`}
              </span>
            ) : (
              <span>
                {[a.subRegion, a.city].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>
        )}
        <p className="mt-2 text-sm text-[var(--muted-foreground)] line-clamp-2 flex-1">
          {a.shortDescription}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2">
          {a.googleRating != null && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-gold-500 text-gold-500" />
              <span className="text-sm font-medium">
                {a.googleRating.toFixed(1)}
              </span>
              {a.googleReviewCount != null && (
                <span className="text-xs text-[var(--muted-foreground)]">
                  ({a.googleReviewCount.toLocaleString()})
                </span>
              )}
            </div>
          )}
          {a.dogFriendly && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-gold-100 text-gold-700 dark:bg-gold-900 dark:text-gold-300">
              Dog OK
            </span>
          )}
          {a.kidFriendly && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              Kid Friendly
            </span>
          )}
          {a.adultsOnly && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-burgundy-100 text-burgundy-700 dark:bg-burgundy-900 dark:text-burgundy-300">
              Adults Only
            </span>
          )}
          {tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]"
            >
              {tag}
            </span>
          ))}
          {a.distanceMiles != null && (
            <span className="text-xs text-[var(--muted-foreground)]">
              {a.distanceMiles < 1
                ? "< 1 mi away"
                : `${a.distanceMiles.toFixed(1)} mi away`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
