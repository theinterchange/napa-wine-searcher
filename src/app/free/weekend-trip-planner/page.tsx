import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Clock, MapPin, Wine, BedDouble } from "lucide-react";
import { db } from "@/db";
import { wineries, subRegions, accommodations } from "@/db/schema";
import { eq, inArray, and, isNotNull, desc } from "drizzle-orm";
import { BASE_URL } from "@/lib/constants";
import { LeadMagnetCapture } from "@/components/monetization/LeadMagnetCapture";
import { BookHotelCTA } from "@/components/accommodation/BookHotelCTA";

export const revalidate = 86400;

// 6 Editor's Picks split across 2 valleys.
// Day 1 (Napa): geographically sequenced south → north along the Silverado/Hwy 29 corridor.
// Day 2 (Sonoma): Russian River → Sonoma Valley → Alexander Valley loop.
const DAY_ONE_SLUGS = ["frogs-leap", "stags-leap-wine-cellars", "hall-wines"] as const;
const DAY_TWO_SLUGS = ["iron-horse", "hamel", "jordan-winery"] as const;
const ALL_SLUGS = [...DAY_ONE_SLUGS, ...DAY_TWO_SLUGS];

export const metadata: Metadata = {
  title: "Free 2-Day Napa + Sonoma Weekend Planner — Wineries, Hotel, Routes",
  description:
    "A free weekend trip planner for first-time wine country visitors: 3 Napa wineries Saturday, a top-rated hotel between, 3 Sonoma wineries Sunday. Editor-picked, no upsells.",
  alternates: { canonical: `${BASE_URL}/free/weekend-trip-planner` },
  openGraph: {
    title: "Free 2-Day Napa + Sonoma Weekend Planner",
    description:
      "Six editor-picked wineries, a top-rated hotel in between, and the routing that works. Free.",
    url: `${BASE_URL}/free/weekend-trip-planner`,
    type: "article",
  },
};

async function getStops() {
  const rows = await db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      city: wineries.city,
      heroImageUrl: wineries.heroImageUrl,
      whyVisit: wineries.whyVisit,
      shortDescription: wineries.shortDescription,
      reservationRequired: wineries.reservationRequired,
      tastingPriceMin: wineries.tastingPriceMin,
      subRegion: subRegions.name,
      valley: subRegions.valley,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(inArray(wineries.slug, ALL_SLUGS as unknown as string[]));

  return {
    napa: DAY_ONE_SLUGS.map((s) => rows.find((r) => r.slug === s)!).filter(Boolean),
    sonoma: DAY_TWO_SLUGS.map((s) => rows.find((r) => r.slug === s)!).filter(Boolean),
  };
}

async function getRecommendedHotel() {
  // Top-rated curated Napa hotel with a usable booking link — Stay22 will
  // resolve generic accommodations too, so name + lat/lng is enough.
  const [row] = await db
    .select({
      id: accommodations.id,
      slug: accommodations.slug,
      name: accommodations.name,
      city: accommodations.city,
      heroImageUrl: accommodations.heroImageUrl,
      bookingUrl: accommodations.bookingUrl,
      websiteUrl: accommodations.websiteUrl,
      lat: accommodations.lat,
      lng: accommodations.lng,
      whyStayHere: accommodations.whyStayHere,
      shortDescription: accommodations.shortDescription,
      googleRating: accommodations.googleRating,
      starRating: accommodations.starRating,
      priceTier: accommodations.priceTier,
    })
    .from(accommodations)
    .where(
      and(
        eq(accommodations.curated, true),
        eq(accommodations.valley, "napa"),
        isNotNull(accommodations.heroImageUrl)
      )
    )
    .orderBy(desc(accommodations.googleRating))
    .limit(1);
  return row ?? null;
}

function lead(w: { whyVisit: string | null; shortDescription: string | null }): string | null {
  if (w.whyVisit && !w.whyVisit.trim().startsWith("[")) return w.whyVisit.trim();
  if (w.shortDescription && !w.shortDescription.trim().startsWith("[")) {
    return w.shortDescription.trim();
  }
  return null;
}

function StopCard({
  w,
  index,
}: {
  w: Awaited<ReturnType<typeof getStops>>["napa"][number];
  index: number;
}) {
  const text = lead(w);
  return (
    <li className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-6 sm:gap-8">
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--paper-2)]">
        {w.heroImageUrl ? (
          <Image
            src={w.heroImageUrl}
            alt={w.name}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <Wine className="h-12 w-12 text-[var(--rule)] absolute inset-0 m-auto" />
        )}
      </div>
      <div>
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[12px] tracking-[0.18em] text-[var(--brass)] tabular-nums">
            {String(index).padStart(2, "0")}
          </span>
          <span className="kicker inline-flex items-center gap-1.5">
            <MapPin className="h-3 w-3" /> {[w.subRegion, w.city].filter(Boolean).join(" · ")}
          </span>
        </div>
        <h3 className="editorial-h2 text-[22px] sm:text-[26px] mt-2">
          <Link
            href={`/wineries/${w.slug}`}
            className="hover:text-[var(--color-burgundy-900)] transition-colors"
          >
            {w.name}
          </Link>
        </h3>
        {text && (
          <p
            className="mt-3 font-[var(--font-serif-text)] text-[15px] leading-[1.6] text-[var(--ink-2)] line-clamp-4"
            style={{ textWrap: "pretty" }}
          >
            {text}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--ink-3)]">
          {w.tastingPriceMin != null && (
            <span>
              {w.tastingPriceMin === 0
                ? "Complimentary"
                : `From $${Math.round(w.tastingPriceMin)}`}
            </span>
          )}
          <span>{w.reservationRequired ? "Reservation required" : "Walk-ins welcome"}</span>
        </div>
      </div>
    </li>
  );
}

export default async function WeekendTripPlannerPage() {
  const [{ napa, sonoma }, hotel] = await Promise.all([getStops(), getRecommendedHotel()]);

  return (
    <main>
      <header className="mx-auto max-w-3xl px-4 sm:px-6 pt-10 sm:pt-16 pb-8 sm:pb-12">
        <span className="kicker">Free Guide</span>
        <h1 className="editorial-h2 text-[32px] sm:text-[46px] lg:text-[56px] mt-3 sm:mt-4">
          The <em>2-day</em> Napa &amp; Sonoma weekend.
        </h1>
        <p
          className="mt-5 max-w-[60ch] text-[16px] sm:text-[18px] leading-[1.55] text-[var(--ink-2)]"
          style={{ fontFamily: "var(--font-serif-text)", textWrap: "pretty" }}
        >
          Six editor-picked wineries — three in Napa, three in Sonoma — with a
          top-rated hotel between. Drop your email and the full weekend reveals
          below, including the hotel booking link.
        </p>
        <p className="mt-3 font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--ink-3)] inline-flex items-center gap-2">
          <Clock className="h-3 w-3" /> 2 days · 6 wineries · 1 hotel
        </p>
      </header>

      <LeadMagnetCapture
        source="guide"
        heading="Get the 2-day weekend plan"
        description="Six editor-picked wineries, a top-rated hotel, the routes. Free, no spam."
      >
        <article className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
          {/* DAY 1 */}
          <div className="border-t border-[var(--brass)] pt-6 mb-10">
            <span className="kicker">Day 1 · Saturday</span>
            <h2 className="editorial-h2 text-[26px] sm:text-[32px] mt-2">Napa Valley.</h2>
            <p
              className="mt-3 font-[var(--font-serif-text)] text-[15.5px] leading-[1.6] text-[var(--ink-2)]"
              style={{ textWrap: "pretty" }}
            >
              South to north along the valley floor. Start in Rutherford by 11
              a.m., lunch in St. Helena (Press, Goose &amp; Gander, or Cindy&apos;s
              Backstreet Kitchen), finish in the Stags Leap District by 4 p.m.
              You&apos;ll be at the hotel by 5.
            </p>
          </div>
          <ol className="space-y-12 mb-12">
            {napa.map((w, i) => (
              <StopCard key={w.id} w={w} index={i + 1} />
            ))}
          </ol>

          {/* HOTEL — the revenue moment */}
          {hotel && (
            <div className="border-y border-[var(--brass)] py-8 sm:py-10 my-12">
              <span className="kicker inline-flex items-center gap-1.5">
                <BedDouble className="h-3.5 w-3.5 text-[var(--brass)]" />
                Where to stay
              </span>
              <h3 className="editorial-h2 text-[26px] sm:text-[32px] mt-2">{hotel.name}</h3>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-[2fr_3fr] gap-6 items-start">
                {hotel.heroImageUrl && (
                  <div className="relative aspect-[4/3] overflow-hidden bg-[var(--paper-2)]">
                    <Image
                      src={hotel.heroImageUrl}
                      alt={hotel.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 40vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  {(() => {
                    const t = hotel.whyStayHere ?? hotel.shortDescription;
                    return t ? (
                      <p
                        className="font-[var(--font-serif-text)] text-[15.5px] leading-[1.6] text-[var(--ink-2)] line-clamp-5"
                        style={{ textWrap: "pretty" }}
                      >
                        {t}
                      </p>
                    ) : null;
                  })()}
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--ink-3)]">
                    {hotel.starRating && <span>{hotel.starRating}★</span>}
                    {hotel.googleRating && <span>{hotel.googleRating.toFixed(1)} Google</span>}
                    {hotel.priceTier && <span>{"$".repeat(Math.min(4, hotel.priceTier))}</span>}
                    {hotel.city && <span>{hotel.city}</span>}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <BookHotelCTA
                      bookingUrl={hotel.bookingUrl}
                      websiteUrl={hotel.websiteUrl}
                      accommodationName={hotel.name}
                      lat={hotel.lat}
                      lng={hotel.lng}
                      accommodationId={hotel.id}
                      accommodationSlug={hotel.slug}
                      sourcePage="/free/weekend-trip-planner"
                      sourceComponent="lead_magnet_weekend_hotel"
                      size="md"
                      label="Book this hotel"
                    />
                    <Link
                      href={`/where-to-stay/${hotel.slug}`}
                      className="inline-flex items-center gap-2 border border-[var(--ink)] text-[var(--ink)] font-mono text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-2.5 hover:bg-[var(--ink)] hover:text-[var(--paper)] transition-colors"
                    >
                      Hotel profile →
                    </Link>
                    <Link
                      href="/where-to-stay/napa-valley"
                      className="inline-flex items-center font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--ink-2)] border-b border-[var(--brass)]/40 pb-0.5 hover:text-[var(--ink)]"
                    >
                      Or browse all Napa stays →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DAY 2 */}
          <div className="border-t border-[var(--brass)] pt-6 mb-10">
            <span className="kicker">Day 2 · Sunday</span>
            <h2 className="editorial-h2 text-[26px] sm:text-[32px] mt-2">Sonoma County.</h2>
            <p
              className="mt-3 font-[var(--font-serif-text)] text-[15.5px] leading-[1.6] text-[var(--ink-2)]"
              style={{ textWrap: "pretty" }}
            >
              West to east in a loop. Russian River first for outdoor sparkling,
              then back through Sonoma Valley for the most considered tasting of
              the trip, and finish in Alexander Valley with a chef-driven food
              pairing. Lunch in Healdsburg between stops 2 and 3.
            </p>
          </div>
          <ol className="space-y-12">
            {sonoma.map((w, i) => (
              <StopCard key={w.id} w={w} index={i + 1} />
            ))}
          </ol>

          <div className="mt-12 pt-6 border-t border-[var(--rule-soft)] flex flex-wrap items-center gap-4">
            <p className="font-[var(--font-serif-text)] text-[14.5px] text-[var(--ink-2)] flex-1 min-w-[200px]">
              Just have one day?{" "}
              <Link
                href="/free/napa-day-trip-plan"
                className="underline decoration-[var(--brass)] underline-offset-4 hover:text-[var(--ink)]"
              >
                The 1-day Napa plan →
              </Link>
            </p>
            <Link
              href="/wineries/editors-picks"
              className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--ink-2)] hover:text-[var(--ink)] border-b border-[var(--brass)]/40 pb-0.5"
            >
              All 8 Editor&apos;s Picks →
            </Link>
          </div>
        </article>
      </LeadMagnetCapture>
    </main>
  );
}
