import Link from "next/link";
import { ArrowRight, Wine, Route, MapPin, Heart, BookOpen, Grape } from "lucide-react";
import { db } from "@/db";
import { wineries, subRegions, dayTripRoutes } from "@/db/schema";
import { sql, count, eq, desc, and } from "drizzle-orm";
import { auth } from "@/auth";
import { HeroFeatured } from "@/components/home/HeroFeatured";
import { QuickFilterBar } from "@/components/home/QuickFilterBar";
import { WineryCard } from "@/components/directory/WineryCard";
import { EmailCapture } from "@/components/monetization/EmailCapture";

async function getFeaturedWineries() {
  return db
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
    .orderBy(sql`RANDOM()`)
    .limit(5);
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
    .orderBy(desc(wineries.curated), desc(wineries.aggregateRating))
    .limit(9);
}

export default async function HomePage() {
  const [featured, totalWineries, session, dayTripCount, homepageWineries, popularRegions] =
    await Promise.all([
      getFeaturedWineries(),
      getTotalWineries(),
      auth(),
      getDayTripCount(),
      getHomepageWineries(),
      getPopularSubRegions(),
    ]);

  return (
    <>
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
            View all {totalWineries} wineries &rarr;
          </Link>
        </div>
        <QuickFilterBar />
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {homepageWineries.map((winery) => (
            <WineryCard key={winery.slug} winery={winery} />
          ))}
        </div>
      </section>

      {/* 4. Explore Wine Regions */}
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

      {/* 5. Account CTA + Email Capture */}
      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {!session && (
            <div className="max-w-2xl mx-auto mb-12 text-center">
              <h2 className="font-heading text-2xl font-bold mb-3">
                Create Your Free Account
              </h2>
              <p className="text-[var(--muted-foreground)] mb-6">
                Get more out of your wine country experience with a free account.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-6">
                <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                  <Heart className="h-5 w-5 text-burgundy-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Save Favorites</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Bookmark wineries you love
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                  <Route className="h-5 w-5 text-burgundy-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Plan Trips</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Build and save custom routes
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                  <BookOpen className="h-5 w-5 text-burgundy-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Tasting Journal</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Log and rate wines you try
                    </p>
                  </div>
                </div>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-burgundy-700 px-6 py-3 text-sm font-semibold text-white hover:bg-burgundy-800 transition-colors"
              >
                Get Started — It&apos;s Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
          <div className="max-w-xl mx-auto">
            <EmailCapture source="guide" />
          </div>
        </div>
      </section>
    </>
  );
}
