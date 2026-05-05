import Link from "next/link";
import Image from "next/image";
import { BookHotelCTA } from "@/components/accommodation/BookHotelCTA";

export interface SpotlightAccommodation {
  id: number;
  slug: string;
  name: string;
  shortDescription: string | null;
  heroImageUrl: string | null;
  websiteUrl: string | null;
  bookingUrl: string | null;
  whyStayHere: string | null;
  theExperience: string | null;
  whyThisHotel: string | null;
  type: "hotel" | "inn" | "resort" | "vacation_rental" | "bed_and_breakfast";
  priceTier: number | null;
  starRating: number | null;
  googleRating: number | null;
  lat: number | null;
  lng: number | null;
  valley: "napa" | "sonoma";
  subRegion: string | null;
  spotlightTeaser: string | null;
}

const TYPE_LABEL: Record<SpotlightAccommodation["type"], string> = {
  hotel: "Hotel",
  inn: "Inn",
  resort: "Resort",
  vacation_rental: "Vacation rental",
  bed_and_breakfast: "Bed & breakfast",
};

function rateLabel(tier: number | null): string {
  if (!tier) return "Inquire for rates";
  if (tier === 1) return "From $150 / night";
  if (tier === 2) return "$250–$450 / night";
  if (tier === 3) return "$450–$800 / night";
  return "$800+ / night";
}

function parseReasons(jsonArrayOrText: string | null): string[] {
  if (!jsonArrayOrText) return [];
  const trimmed = jsonArrayOrText.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (r): r is string => typeof r === "string" && r.trim().length > 0
        );
      }
    } catch {
      // fall through to plain-text path
    }
  }
  return trimmed.length > 0 ? [trimmed] : [];
}

function pickLead(a: SpotlightAccommodation): string | null {
  if (a.spotlightTeaser && a.spotlightTeaser.trim().length > 0) {
    return a.spotlightTeaser.trim();
  }
  if (a.whyStayHere && !a.whyStayHere.trim().startsWith("[")) {
    return a.whyStayHere.trim();
  }
  if (a.theExperience && !a.theExperience.trim().startsWith("[")) {
    return a.theExperience.trim();
  }
  if (a.shortDescription && !a.shortDescription.trim().startsWith("[")) {
    return a.shortDescription.trim();
  }
  return parseReasons(a.whyThisHotel)[0] ?? null;
}

export function HomepageAccommodationSpotlight({
  accommodation,
}: {
  accommodation: SpotlightAccommodation | null;
}) {
  if (!accommodation) return null;

  const lead = pickLead(accommodation);
  const reasons = parseReasons(accommodation.whyThisHotel).slice(0, 3);
  const valleyLabel =
    accommodation.valley === "napa" ? "Napa Valley" : "Sonoma County";

  return (
    <article
      className="bg-[var(--paper-2)] border-t-2"
      style={{ borderTopColor: "var(--brass)" }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-0 lg:items-stretch">
        {/* Left: photo — fills the row height on desktop */}
        <div className="photo-zoom relative aspect-[4/3] lg:aspect-auto lg:min-h-[440px] lg:h-full">
          {accommodation.heroImageUrl ? (
            <Image
              src={accommodation.heroImageUrl}
              alt={accommodation.name}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[var(--ink-2)]" />
          )}
        </div>

        {/* Right: editorial copy */}
        <div className="p-8 sm:p-10 lg:p-12 flex flex-col">
          <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--brass-2)]">
            Editor&apos;s Stay
          </span>

          <h3
            className="font-[var(--font-heading)] text-[26px] sm:text-[32px] lg:text-[38px] leading-[1.05] tracking-[-0.02em] font-normal text-[var(--ink)] mt-3"
            style={{ textWrap: "balance" }}
          >
            {accommodation.name}
          </h3>

          {lead && (
            <p
              className="font-[var(--font-serif-text)] text-[16px] leading-[1.55] mt-4 max-w-[52ch] text-[var(--ink-2)] line-clamp-4"
              style={{ textWrap: "pretty" }}
            >
              {lead}
            </p>
          )}

          {reasons.length > 0 && (
            <div className="mt-6">
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--brass-2)]">
                Why this stay
              </span>
              <ul className="mt-3 space-y-2 max-w-[56ch]">
                {reasons.map((reason, i) => (
                  <li key={i} className="flex gap-3 items-baseline">
                    <span className="font-mono text-[10.5px] text-[var(--brass-2)] tabular-nums shrink-0 pt-0.5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className="font-[var(--font-serif-text)] text-[14px] leading-[1.5] text-[var(--ink)] line-clamp-2"
                      style={{ textWrap: "pretty" }}
                    >
                      {reason}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/where-to-stay/${accommodation.slug}`}
                className="inline-flex items-center gap-1.5 mt-4 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--brass-2)] border-b border-[var(--brass)]/40 pb-0.5 hover:text-[var(--ink)] hover:border-[var(--ink)] transition-colors"
              >
                Read the full story →
              </Link>
            </div>
          )}

          <dl
            className="grid grid-cols-2 gap-x-6 gap-y-4 mt-7 pt-6 border-t"
            style={{ borderColor: "var(--rule)" }}
          >
            <div>
              <dt className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--brass-2)]">
                Where
              </dt>
              <dd className="font-[var(--font-serif-text)] text-[14.5px] mt-1.5 text-[var(--ink)]">
                {accommodation.subRegion ?? valleyLabel}
                {accommodation.subRegion && (
                  <span className="text-[var(--ink-3)]"> · {valleyLabel}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--brass-2)]">
                Style
              </dt>
              <dd className="font-[var(--font-serif-text)] text-[14.5px] mt-1.5 text-[var(--ink)]">
                {TYPE_LABEL[accommodation.type]}
                {accommodation.starRating && (
                  <span className="text-[var(--ink-3)]"> · {accommodation.starRating}★</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--brass-2)]">
                Rate
              </dt>
              <dd className="font-[var(--font-serif-text)] text-[14.5px] mt-1.5 text-[var(--ink)]">
                {rateLabel(accommodation.priceTier)}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--brass-2)]">
                Rating
              </dt>
              <dd className="font-[var(--font-serif-text)] text-[14.5px] mt-1.5 text-[var(--ink)]">
                {accommodation.googleRating
                  ? `${accommodation.googleRating.toFixed(1)} on Google`
                  : "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <BookHotelCTA
              bookingUrl={accommodation.bookingUrl}
              websiteUrl={accommodation.websiteUrl}
              accommodationName={accommodation.name}
              lat={accommodation.lat}
              lng={accommodation.lng}
              accommodationId={accommodation.id}
              accommodationSlug={accommodation.slug}
              sourcePage="/"
              sourceComponent="HomepageAccommodationSpotlight"
              size="lg"
              label="Book this stay"
            />
            <Link
              href={`/where-to-stay/${accommodation.slug}`}
              className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)] border-b border-[var(--brass)] pb-1 hover:text-[var(--brass-2)] transition-colors"
            >
              View hotel →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
