import Link from "next/link";
import Image from "next/image";
import { Star, Wine, BadgeCheck } from "lucide-react";
import { displaySubRegionName } from "@/lib/subregion-display";

const valleyPrefix: Record<string, string> = {
  napa: "/napa-valley",
  sonoma: "/sonoma-county",
};

const valleyLabel: Record<string, string> = {
  napa: "Napa",
  sonoma: "Sonoma",
};

interface WineryCardProps {
  id: number;
  slug: string;
  name: string;
  shortDescription: string | null;
  city: string | null;
  subRegion: string | null;
  subRegionSlug?: string | null;
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
  featured?: boolean | null;
  heroImageUrl: string | null;
  tastingPriceMin?: number | null;
}

function tierFromTastingPrice(price: number): number {
  if (price <= 25) return 1;
  if (price <= 50) return 2;
  if (price <= 100) return 3;
  return 4;
}

export function WineryCard({ winery, priority = false }: { winery: WineryCardProps; priority?: boolean }) {
  const subRegionHref = winery.subRegion && winery.subRegionSlug && winery.valley && valleyPrefix[winery.valley]
    ? `${valleyPrefix[winery.valley]}/${winery.subRegionSlug}`
    : null;

  const tier = winery.tastingPriceMin != null
    ? tierFromTastingPrice(winery.tastingPriceMin)
    : (winery.priceLevel || 2);

  const locationKicker = [
    displaySubRegionName(winery.subRegion),
    winery.valley ? valleyLabel[winery.valley] : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="group relative flex flex-col bg-[var(--paper-2)] border-t-2 border-[var(--rule)] hover:border-[var(--brass)] transition-colors">
      <Link href={`/wineries/${winery.slug}`} className="absolute inset-0 z-10" aria-label={winery.name} />

      <div className="photo-zoom relative aspect-[16/10] bg-[var(--paper-2)] flex items-center justify-center">
        {winery.heroImageUrl ? (
          <Image
            src={winery.heroImageUrl}
            alt={winery.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
          />
        ) : (
          <Wine className="h-12 w-12 text-[var(--rule)]" />
        )}
        {winery.featured && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-[var(--brass)] px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--paper)]">
            <BadgeCheck className="h-3 w-3" />
            Featured
          </span>
        )}
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
          {winery.aggregateRating != null && (
            <span className="font-mono text-[11px] tracking-[0.12em] text-[var(--ink-2)] tabular-nums shrink-0">
              <Star className="inline-block h-3 w-3 fill-[var(--brass)] text-[var(--brass)] mr-1 -mt-px" />
              {winery.aggregateRating.toFixed(1)}
              {winery.totalRatings != null && (
                <span className="text-[var(--ink-3)]"> · {winery.totalRatings.toLocaleString()}</span>
              )}
            </span>
          )}
        </div>

        <hr className="rule-brass mt-3" />

        <h3 className="editorial-h2 text-[22px] mt-2 line-clamp-2 group-hover:text-[var(--color-burgundy-900)] transition-colors">
          {winery.name}
        </h3>

        {winery.shortDescription && (
          <p className="font-[var(--font-serif-text)] text-[15px] leading-relaxed text-[var(--ink-2)] mt-4 line-clamp-3 flex-1">
            {winery.shortDescription}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-1.5 min-h-[26px]">
          {winery.reservationRequired && (
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border border-[var(--rule)] text-[var(--ink-2)]">
              Reservation
            </span>
          )}
          {winery.dogFriendly && (
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border border-[var(--rule)] text-[var(--ink-2)]">
              Dog OK
            </span>
          )}
          {winery.kidFriendly && winery.kidFriendlyConfidence === "high" && (
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border border-[var(--rule)] text-[var(--ink-2)]">
              Kid Friendly
            </span>
          )}
          {winery.kidFriendly && winery.kidFriendlyConfidence === "medium" && (
            <span
              className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border border-[var(--rule)] text-[var(--ink-2)]"
              title="Check with winery"
            >
              Kid Friendly*
            </span>
          )}
          {winery.picnicFriendly && (
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border border-[var(--rule)] text-[var(--ink-2)]">
              Picnic
            </span>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--rule-soft)] flex items-center justify-between">
          <span className="font-mono text-[11px] tracking-[0.14em] text-[var(--ink-2)] tabular-nums">
            <span className="text-[var(--ink)] font-semibold">{"$".repeat(tier)}</span>
            <span className="text-[var(--ink-3)] ml-2 uppercase">
              {winery.tastingPriceMin != null
                ? winery.tastingPriceMin === 0
                  ? "Complimentary"
                  : `From $${Math.round(winery.tastingPriceMin)}`
                : winery.reservationRequired
                  ? "Seated"
                  : "Walk-in OK"}
            </span>
          </span>
          {!winery.curated && (
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--ink-3)]">
              Preview
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
