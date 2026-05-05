import Link from "next/link";
import Image from "next/image";
import { BedDouble, Star } from "lucide-react";
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

const valleyLabel: Record<string, string> = {
  napa: "Napa",
  sonoma: "Sonoma",
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

  const locationKicker = [
    displaySubRegionName(a.subRegion),
    a.valley ? valleyLabel[a.valley] : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="group relative flex flex-col bg-[var(--paper-2)] border-t-2 border-[var(--rule)] hover:border-[var(--brass)] transition-colors">
      <Link
        href={`/where-to-stay/${a.slug}`}
        className="absolute inset-0 z-10"
        aria-label={a.name}
      />

      <div className="photo-zoom relative aspect-[16/10] bg-[var(--paper-2)] flex items-center justify-center">
        {a.heroImageUrl || a.thumbnailUrl ? (
          <Image
            src={a.heroImageUrl || a.thumbnailUrl!}
            alt={a.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <BedDouble className="h-12 w-12 text-[var(--rule)]" />
        )}
        <span className="absolute top-3 left-3 bg-[var(--paper)] px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink)]">
          {typeLabels[a.type] || a.type}
        </span>
      </div>

      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start justify-between gap-3 min-h-[18px]">
          {locationKicker ? (
            subRegionHref ? (
              <Link
                href={subRegionHref}
                className="kicker relative z-20 hover:text-[var(--ink)] transition-colors"
              >
                {locationKicker}
              </Link>
            ) : (
              <span className="kicker">{locationKicker}</span>
            )
          ) : <span />}
          {a.googleRating != null && (
            <span className="font-mono text-[11px] tracking-[0.12em] text-[var(--ink-2)] tabular-nums shrink-0">
              <Star className="inline-block h-3 w-3 fill-[var(--brass)] text-[var(--brass)] mr-1 -mt-px" />
              {a.googleRating.toFixed(1)}
              {a.googleReviewCount != null && (
                <span className="text-[var(--ink-3)]"> · {a.googleReviewCount.toLocaleString()}</span>
              )}
            </span>
          )}
        </div>

        <hr className="rule-brass mt-3" />

        <h3 className="editorial-h2 text-[22px] mt-2 line-clamp-2 group-hover:text-[var(--color-burgundy-900)] transition-colors">
          {a.name}
        </h3>

        {a.shortDescription && (
          <p
            className="font-[var(--font-serif-text)] text-[15px] leading-relaxed text-[var(--ink-2)] mt-3 line-clamp-3 flex-1"
            title={a.shortDescription ?? undefined}
          >
            {a.shortDescription}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-1.5 min-h-[26px]">
          {a.dogFriendly && !a.dogFriendlyNote && (
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border border-[var(--rule)] text-[var(--ink-2)]">
              Dog OK
            </span>
          )}
          {a.dogFriendly && a.dogFriendlyNote && (
            <span
              className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border border-[var(--rule)] text-[var(--ink-2)]"
              title={a.dogFriendlyNote}
            >
              Dog OK*
            </span>
          )}
          {a.kidFriendly && !a.kidFriendlyNote && !a.adultsOnly && (
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border border-[var(--rule)] text-[var(--ink-2)]">
              Kid Friendly
            </span>
          )}
          {a.kidFriendly && a.kidFriendlyNote && !a.adultsOnly && (
            <span
              className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border border-[var(--rule)] text-[var(--ink-2)]"
              title={a.kidFriendlyNote}
            >
              Kid Friendly*
            </span>
          )}
          {a.adultsOnly && (
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border border-[var(--brass)] text-[var(--brass-2)]">
              Adults Only
            </span>
          )}
          {tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border border-[var(--rule)] text-[var(--ink-2)]"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--rule-soft)] flex items-center justify-between gap-3 min-h-[20px]">
          <span className="font-mono text-[11px] tracking-[0.14em] text-[var(--ink-2)]">
            {a.starRating && (
              <span className="text-[var(--ink)] font-semibold">
                {"★".repeat(a.starRating)}
              </span>
            )}
            {a.distanceMiles != null && (
              <span className="ml-2 text-[var(--ink-3)]">
                {a.distanceMiles < 1 ? "< 1 mi" : `${a.distanceMiles.toFixed(1)} mi`}
              </span>
            )}
          </span>
        </div>

        {showBookingCTA && (a.bookingUrl || a.websiteUrl) && (
          <div className="relative z-20 mt-4">
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
    </article>
  );
}
