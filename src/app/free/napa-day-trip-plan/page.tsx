import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Clock, MapPin, Wine, Coffee } from "lucide-react";
import { db } from "@/db";
import { wineries, subRegions } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { BASE_URL } from "@/lib/constants";
import { LeadMagnetCapture } from "@/components/monetization/LeadMagnetCapture";

export const revalidate = 86400;

// Three Editor's Picks that form a geographically sensible Napa day —
// Rutherford → St. Helena → Calistoga along the Hwy 29 / Silverado corridor.
// All three carry the Editor's Pick badge from Item #1.
const DAY_TRIP_SLUGS = ["frogs-leap", "hall-wines", "castello-di-amorosa"] as const;

export const metadata: Metadata = {
  title: "The First-Timer's 1-Day Napa Plan — 3 Wineries, 1 Lunch, 6 Hours",
  description:
    "A free Napa day-trip plan for first-timers: three editor-picked wineries (Frog's Leap, Hall, Castello di Amorosa), where to eat in between, and the timing that actually works. No fluff, no upsells.",
  alternates: { canonical: `${BASE_URL}/free/napa-day-trip-plan` },
  openGraph: {
    title: "The First-Timer's 1-Day Napa Plan — Free Guide",
    description:
      "Three editor-picked wineries, a Yountville or St. Helena lunch, and the timing that works. Free.",
    url: `${BASE_URL}/free/napa-day-trip-plan`,
    type: "article",
  },
};

async function getDayTripWineries() {
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
      visitUrl: wineries.visitUrl,
      websiteUrl: wineries.websiteUrl,
      subRegion: subRegions.name,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(inArray(wineries.slug, DAY_TRIP_SLUGS as unknown as string[]));

  // Preserve the route order.
  return DAY_TRIP_SLUGS.map((s) => rows.find((r) => r.slug === s)!).filter(Boolean);
}

function lead(w: { whyVisit: string | null; shortDescription: string | null }): string | null {
  if (w.whyVisit && !w.whyVisit.trim().startsWith("[")) return w.whyVisit.trim();
  if (w.shortDescription && !w.shortDescription.trim().startsWith("[")) {
    return w.shortDescription.trim();
  }
  return null;
}

export default async function NapaDayTripPlanPage() {
  const stops = await getDayTripWineries();

  return (
    <main>
      <header className="mx-auto max-w-3xl px-4 sm:px-6 pt-10 sm:pt-16 pb-8 sm:pb-12">
        <span className="kicker">Free Guide</span>
        <h1 className="editorial-h2 text-[32px] sm:text-[46px] lg:text-[56px] mt-3 sm:mt-4">
          The First-Timer&apos;s <em>1-Day</em> Napa Plan.
        </h1>
        <p
          className="mt-5 max-w-[60ch] text-[16px] sm:text-[18px] leading-[1.55] text-[var(--ink-2)]"
          style={{ fontFamily: "var(--font-serif-text)", textWrap: "pretty" }}
        >
          Three editor-picked wineries, one lunch, ~6 hours, ~30 miles end to
          end — laid out so first-timers leave with a story, not jet lag. Drop
          your email and the full plan reveals below.
        </p>
        <p className="mt-3 font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--ink-3)] inline-flex items-center gap-2">
          <Clock className="h-3 w-3" /> 6 hours · 3 stops · 30 miles
        </p>
      </header>

      <LeadMagnetCapture
        source="guide"
        heading="Get the 1-day Napa plan"
        description="Hand-picked wineries, where to eat in between, and the timing that works. Free, no spam."
      >
        <article className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
          <div className="border-t border-[var(--brass)] pt-6 mb-10">
            <span className="kicker">The plan</span>
            <h2 className="editorial-h2 text-[24px] sm:text-[30px] mt-2">
              Drive south to north along Hwy 29.
            </h2>
            <p
              className="mt-3 font-[var(--font-serif-text)] text-[15.5px] leading-[1.6] text-[var(--ink-2)]"
              style={{ textWrap: "pretty" }}
            >
              Start in Rutherford around 11 a.m. (most tasting rooms open at
              10–11). Move north to St. Helena for the second tasting after
              lunch. Finish in Calistoga before 5 p.m. The order is the route —
              don&apos;t skip ahead.
            </p>
          </div>

          <ol className="space-y-12">
            {stops.map((w, i) => (
              <li key={w.id} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-6 sm:gap-8">
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
                      {String(i + 1).padStart(2, "0")}
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
                  {(() => {
                    const text = lead(w);
                    return text ? (
                      <p
                        className="mt-3 font-[var(--font-serif-text)] text-[15px] leading-[1.6] text-[var(--ink-2)] line-clamp-4"
                        style={{ textWrap: "pretty" }}
                      >
                        {text}
                      </p>
                    ) : null;
                  })()}
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
                  {i === 0 && (
                    <p className="mt-4 font-[var(--font-serif-text)] text-[14px] leading-[1.6] text-[var(--ink-2)] italic">
                      Plan to arrive at 11 a.m. The seated tasting runs ~75
                      minutes. Walk the gardens before you go.
                    </p>
                  )}
                  {i === 1 && (
                    <p className="mt-4 font-[var(--font-serif-text)] text-[14px] leading-[1.6] text-[var(--ink-2)] italic">
                      Mid-afternoon stop — eat first. Tastings here are
                      back-to-back; arrive on time.
                    </p>
                  )}
                  {i === 2 && (
                    <p className="mt-4 font-[var(--font-serif-text)] text-[14px] leading-[1.6] text-[var(--ink-2)] italic">
                      Save the castle for last — it&apos;s the most fun finish
                      and the kid-friendly stop if you brought family.
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-12 pt-8 border-t border-[var(--rule)]">
            <span className="kicker inline-flex items-center gap-1.5">
              <Coffee className="h-3.5 w-3.5 text-[var(--brass)]" />
              Lunch between stops 2 and 3
            </span>
            <h3 className="editorial-h2 text-[22px] mt-2">St. Helena or Yountville.</h3>
            <p
              className="mt-3 font-[var(--font-serif-text)] text-[15px] leading-[1.6] text-[var(--ink-2)]"
              style={{ textWrap: "pretty" }}
            >
              Both towns sit on Hwy 29 between stops 2 and 3 and have multiple
              reliable options: Ad Hoc, Bouchon, R+D Kitchen in Yountville;
              Press, Goose &amp; Gander, Cindy&apos;s Backstreet Kitchen in St.
              Helena. Book ahead on weekends.
            </p>
          </div>

          <div className="mt-10 pt-6 border-t border-[var(--rule-soft)] flex flex-wrap items-center gap-4">
            <p className="font-[var(--font-serif-text)] text-[14.5px] text-[var(--ink-2)] flex-1 min-w-[200px]">
              Want a weekend instead?{" "}
              <Link
                href="/free/weekend-trip-planner"
                className="underline decoration-[var(--brass)] underline-offset-4 hover:text-[var(--ink)]"
              >
                The 2-day Napa + Sonoma plan →
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
