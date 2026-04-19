import Link from "next/link";
import Image from "next/image";
import { MapPin, BedDouble, Star } from "lucide-react";
import type { AccommodationCard as AccommodationCardData } from "@/lib/accommodation-data";
import { displaySubRegionName } from "@/lib/subregion-display";
import { BookHotelCTA } from "./BookHotelCTA";

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
  showBookingCTA = false,
  sourceComponent,
}: {
  accommodation: AccommodationCardData & { distanceMiles?: number | null };
  /** If true, render an inline "Book Now" Stay22 CTA below the card body */
  showBookingCTA?: boolean;
  sourceComponent?: string;
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
        <h3 className="font-heading text-lg font-semibold group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors line-clamp-1">
          {a.name}
        </h3>
        {(a.subRegion || a.city) && (
          <div className="mt-1 flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {subRegionHref ? (
              <span>
                <Link
                  href={subRegionHref}
                  className="relative z-20 hover:text-[var(--foreground)] hover:underline transition-colors"
                >
                  {displaySubRegionName(a.subRegion)}
                </Link>
                {a.city && a.city !== a.subRegion && ` · ${a.city}`}
              </span>
            ) : (
              <span>
                {[displaySubRegionName(a.subRegion), a.city]
                  .filter((v, i, arr) => v && arr.indexOf(v) === i)
                  .join(" · ")}
              </span>
            )}
          </div>
        )}
        <p
          className="mt-2 text-sm text-[var(--muted-foreground)] line-clamp-2 flex-1"
          title={a.shortDescription ?? undefined}
        >
          {a.shortDescription}
        </p>
        {/* Amenity row — fixed height, single line, hides overflow so cards align */}
        <div className="mt-3 flex items-center gap-1.5 h-5 overflow-hidden">
          {a.dogFriendly && !a.dogFriendlyNote && (
            <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gold-100 text-gold-700 dark:bg-gold-900 dark:text-gold-300">
              Dog OK
            </span>
          )}
          {a.dogFriendly && a.dogFriendlyNote && (
            <span
              className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
              title={a.dogFriendlyNote}
            >
              Dog OK*
            </span>
          )}
          {a.kidFriendly && !a.kidFriendlyNote && !a.adultsOnly && (
            <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              Kid Friendly
            </span>
          )}
          {a.kidFriendly && a.kidFriendlyNote && !a.adultsOnly && (
            <span
              className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
              title={a.kidFriendlyNote}
            >
              Kid Friendly*
            </span>
          )}
          {a.adultsOnly && (
            <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-burgundy-100 text-burgundy-700 dark:bg-burgundy-900 dark:text-burgundy-300">
              Adults Only
            </span>
          )}
          {tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]"
            >
              {tag}
            </span>
          ))}
        </div>
        {/* Rating row — fixed height so it aligns across cards */}
        <div className="mt-2 flex items-center gap-2 h-5">
          {a.googleRating != null && (
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-gold-500 text-gold-500" />
              <span className="text-sm font-semibold tabular-nums">
                {a.googleRating.toFixed(1)}
              </span>
              {a.googleReviewCount != null && (
                <span className="text-xs text-[var(--muted-foreground)] tabular-nums">
                  ({a.googleReviewCount.toLocaleString()})
                </span>
              )}
            </div>
          )}
          {a.starRating && (
            <span className="text-xs text-[var(--muted-foreground)]">
              · {a.starRating}-star {typeLabels[a.type]?.toLowerCase() || a.type}
            </span>
          )}
          {a.distanceMiles != null && (
            <span className="text-xs text-[var(--muted-foreground)]">
              · {a.distanceMiles < 1
                ? "< 1 mi"
                : `${a.distanceMiles.toFixed(1)} mi`}
            </span>
          )}
        </div>
        {showBookingCTA && (a.bookingUrl || a.websiteUrl) && (
          <div className="relative z-20 mt-3">
            <BookHotelCTA
              bookingUrl={a.bookingUrl}
              websiteUrl={a.websiteUrl}
              accommodationName={a.name}
              lat={a.lat}
              lng={a.lng}
              accommodationSlug={a.slug}
              sourceComponent={sourceComponent ?? "AccommodationCard"}
              size="sm"
              label="Book Now"
            />
          </div>
        )}
      </div>
    </div>
  );
}
