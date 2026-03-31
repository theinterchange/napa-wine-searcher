import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Wine, Route, MapPin, Heart, BookOpen, Grape, BedDouble } from "lucide-react";
import { db } from "@/db";
import { BASE_URL } from "@/lib/constants";
import { wineries, subRegions, dayTripRoutes } from "@/db/schema";
import { sql, count, eq, desc, and } from "drizzle-orm";
import { SignUpPrompt } from "@/components/home/SignUpPrompt";
import { HeroFeatured } from "@/components/home/HeroFeatured";
import { QuickFilterBar } from "@/components/home/QuickFilterBar";
import { WineryCard } from "@/components/directory/WineryCard";
import { AccommodationCard } from "@/components/accommodation/AccommodationCard";
import { getAllAccommodations } from "@/lib/accommodation-data";

export const revalidate = 3600; // ISR: regenerate every hour

export const metadata: Metadata = {
  title: "Napa Sonoma Guide | Discover Wineries in Napa Valley & Sonoma County",
  description:
    "Find and compare wineries across Napa Valley and Sonoma County. Browse tasting experiences, plan day trips, and get insider tips for your wine country visit.",
  openGraph: {
    title: "Napa Sonoma Guide | Discover Wineries in Napa Valley & Sonoma County",
    description:
      "Find and compare wineries across Napa Valley and Sonoma County. Browse tasting experiences, plan day trips, and get insider tips for your wine country visit.",
    url: BASE_URL,
    siteName: "Napa Sonoma Guide",
    type: "website",
  },
  alternates: {
    canonical: BASE_URL,
  },
};

async function getFeaturedWineries() {
  // Fetch top 10 curated wineries by rating, then shuffle in JS
  // Avoids expensive RANDOM() full table scan in SQL
  const top = await db
    .select({
      slug: wineries.slug,
      name: wineries.name,
      heroImageUrl: wineries.heroImageUrl,
      subRegion: subRegions.name,
      valley: subRegions.valley,
      googleRating: wineries.googleRating,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(eq(wineries.curated, true))
    .orderBy(desc(wineries.googleRating))
    .limit(10);

  // Fisher-Yates shuffle and take 5
  for (let i = top.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [top[i], top[j]] = [top[j], top[i]];
  }
  return top.slice(0, 5);
}

async function getTotalWineries() {
  const [{ total }] = await db.select({ total: count() }).from(wineries);
  return total;
}

async function getDayTripCount() {
  const [{ total }] = await db.select({ total: count() }).from(dayTripRoutes);
  return total;
}

async function getPopularSubRegions() {
  return db
    .select({
      name: subRegions.name,
      slug: subRegions.slug,
      valley: subRegions.valley,
      count: count(),
    })
    .from(wineries)
    .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .groupBy(subRegions.id)
    .orderBy(sql`count(*) DESC`)
    .limit(8);
}

async function getHomepageWineries() {
  return db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      shortDescription: wineries.shortDescription,
      city: wineries.city,
      priceLevel: wineries.priceLevel,
      aggregateRating: wineries.aggregateRating,
      totalRatings: wineries.totalRatings,
      reservationRequired: wineries.reservationRequired,
      dogFriendly: wineries.dogFriendly,
      picnicFriendly: wineries.picnicFriendly,
      kidFriendly: wineries.kidFriendly,
      kidFriendlyConfidence: wineries.kidFriendlyConfidence,
      heroImageUrl: wineries.heroImageUrl,
      subRegion: subRegions.name,
      subRegionSlug: subRegions.slug,
      valley: subRegions.valley,
      curated: wineries.curated,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .orderBy(sql`(
      (CASE WHEN ${wineries.totalRatings} > 0
        THEN log(${wineries.totalRatings} + 1) / log(10) * 25
        ELSE 0 END)
      + COALESCE(${wineries.googleRating}, COALESCE(${wineries.aggregateRating}, 0)) * 40
      + (CASE WHEN ${wineries.curated} = 1 THEN 30 ELSE 0 END)
      + COALESCE(${wineries.priceLevel}, 2) * 5
    ) DESC`)
    .limit(9);
}

export default async function HomePage() {
  const [featured, totalWineries, dayTripCount, homepageWineries, popularRegions, topAccommodations] =
    await Promise.all([
      getFeaturedWineries(),
      getTotalWineries(),
      getDayTripCount(),
      getHomepageWineries(),
      getPopularSubRegions(),
      getAllAccommodations().then((all) => all.slice(0, 3)),
    ]);

  return (
    <>
      <h1 className="sr-only">Napa Sonoma Guide — Discover Wineries in Napa Valley &amp; Sonoma County</h1>
      {/* 1. Hero with Featured Wineries */}
      <HeroFeatured wineries={featured} totalWineries={totalWineries} />

      {/* 2. Quick Stats Bar */}
      <section className="border-y border-[var(--border)] bg-[var(--muted)]/30">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-[var(--muted-foreground)]">
            <Link href="/wineries" className="flex items-center gap-1.5 hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors">
              <Wine className="h-4 w-4 text-burgundy-600 dark:text-burgundy-400" />
              <strong className="text-[var(--foreground)]">{totalWineries}</strong> Wineries
            </Link>
            <span className="hidden sm:inline text-[var(--border)]" aria-hidden="true">|</span>
            <Link href="/day-trips" className="flex items-center gap-1.5 hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors">
              <Route className="h-4 w-4 text-burgundy-600 dark:text-burgundy-400" />
              <strong className="text-[var(--foreground)]">{dayTripCount}</strong> Day Trip Routes
            </Link>
            <span className="hidden sm:inline text-[var(--border)]" aria-hidden="true">|</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-burgundy-600 dark:text-burgundy-400" />
              <Link href="/napa-valley" className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors"><strong className="text-[var(--foreground)]">Napa Valley</strong></Link>
              <span className="text-[var(--border)]" aria-hidden="true">|</span>
              <Link href="/sonoma-county" className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors"><strong className="text-[var(--foreground)]">Sonoma County</strong></Link>
            </span>
          </div>
        </div>
      </section>

      {/* 3. Explore Wineries */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold">Explore Wineries</h2>
          <Link
            href="/wineries"
            className="text-sm font-medium text-burgundy-700 dark:text-burgundy-400 hover:underline"
          >
            Browse All Wineries &rarr;
          </Link>
        </div>
        <QuickFilterBar />
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {homepageWineries.map((winery) => (
            <WineryCard key={winery.slug} winery={winery} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/wineries"
            className="inline-flex items-center gap-2 rounded-lg bg-burgundy-700 px-6 py-3 text-sm font-semibold text-white hover:bg-burgundy-600 transition-colors"
          >
            Browse All Wineries &rarr;
          </Link>
        </div>
      </section>

      {/* 4. Plan Your Trip — Accommodation Cards + Quick Links */}
      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold">
              Plan Your Wine Country Trip
            </h2>
            <div className="flex gap-4 text-sm font-medium">
              <Link href="/where-to-stay" className="text-burgundy-700 dark:text-burgundy-400 hover:underline">
                All hotels &rarr;
              </Link>
              <Link href="/day-trips" className="text-burgundy-700 dark:text-burgundy-400 hover:underline">
                Day trips &rarr;
              </Link>
            </div>
          </div>

          {/* Accommodation cards */}
          {topAccommodations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {topAccommodations.map((a) => (
                <AccommodationCard key={a.slug} accommodation={a} />
              ))}
            </div>
          )}

          {/* Quick links row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/wineries"
              className="group flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 hover:shadow-md hover:border-burgundy-300 dark:hover:border-burgundy-700 transition-all"
            >
              <Wine className="h-6 w-6 text-burgundy-600 shrink-0" />
              <div>
                <p className="font-semibold group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors">
                  Browse Wineries
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {totalWineries} wineries with tastings & ratings
                </p>
              </div>
            </Link>
            <Link
              href="/where-to-stay"
              className="group flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 hover:shadow-md hover:border-burgundy-300 dark:hover:border-burgundy-700 transition-all"
            >
              <BedDouble className="h-6 w-6 text-burgundy-600 shrink-0" />
              <div>
                <p className="font-semibold group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors">
                  Where to Stay
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Hand-picked hotels & resorts
                </p>
              </div>
            </Link>
            <Link
              href="/plan-trip"
              className="group flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 hover:shadow-md hover:border-burgundy-300 dark:hover:border-burgundy-700 transition-all"
            >
              <Route className="h-6 w-6 text-burgundy-600 shrink-0" />
              <div>
                <p className="font-semibold group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors">
                  Plan a Trip
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Build your winery route
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Explore Wine Regions */}
      {popularRegions.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-10 pt-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-bold">Explore Wine Regions</h2>
            <div className="flex gap-3 text-sm font-medium">
              <Link href="/napa-valley" className="text-burgundy-700 dark:text-burgundy-400 hover:underline">
                Napa Valley &rarr;
              </Link>
              <Link href="/sonoma-county" className="text-burgundy-700 dark:text-burgundy-400 hover:underline">
                Sonoma County &rarr;
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {popularRegions.map((sr) => (
              <Link
                key={sr.slug}
                href={`${sr.valley === "napa" ? "/napa-valley" : "/sonoma-county"}/${sr.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 hover:border-burgundy-400 hover:shadow-sm dark:hover:border-burgundy-600 transition-all"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-burgundy-50 dark:bg-burgundy-950 shrink-0">
                  <Grape className="h-4 w-4 text-burgundy-600 dark:text-burgundy-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors truncate">
                    {sr.name}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {sr.count} {sr.count === 1 ? "winery" : "wineries"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 6. Account CTA */}
      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SignUpPrompt />
        </div>
      </section>
    </>
  );
}
