import Link from "next/link";
import { Map, Search, Wine, Star, ArrowRight } from "lucide-react";
import { db } from "@/db";
import { wineries, subRegions, wines } from "@/db/schema";
import { desc, count, sql } from "drizzle-orm";

async function getStats() {
  const [wineryCount] = await db.select({ count: count() }).from(wineries);
  const [wineCount] = await db.select({ count: count() }).from(wines);
  const [regionCount] = await db.select({ count: count() }).from(subRegions);
  return {
    wineries: wineryCount.count,
    wines: wineCount.count,
    regions: regionCount.count,
  };
}

async function getFeaturedWineries() {
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
      subRegion: subRegions.name,
      valley: subRegions.valley,
    })
    .from(wineries)
    .leftJoin(subRegions, sql`${wineries.subRegionId} = ${subRegions.id}`)
    .orderBy(desc(wineries.aggregateRating))
    .limit(6);
}

export default async function HomePage() {
  const [stats, featured] = await Promise.all([getStats(), getFeaturedWineries()]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-burgundy-900 dark:bg-burgundy-950 text-white">
        <div className="absolute inset-0 bg-[url('/vineyard-pattern.svg')] opacity-5" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Discover Napa &{" "}
            <span className="text-gold-400">Sonoma Valley</span> Wineries
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-burgundy-200">
            Explore over {stats.wineries} world-class wineries across{" "}
            {stats.regions} sub-regions. Compare wines, book tastings, and plan
            your perfect wine country experience.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/wineries"
              className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-burgundy-950 hover:bg-gold-400 transition-colors"
            >
              <Search className="h-4 w-4" />
              Browse Wineries
            </Link>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 rounded-lg border border-burgundy-400 px-6 py-3 text-sm font-semibold text-white hover:bg-burgundy-800 transition-colors"
            >
              <Map className="h-4 w-4" />
              View Map
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="font-heading text-3xl font-bold text-burgundy-700 dark:text-burgundy-400">
                {stats.wineries}
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Wineries</p>
            </div>
            <div>
              <p className="font-heading text-3xl font-bold text-burgundy-700 dark:text-burgundy-400">
                {stats.wines}
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Wines</p>
            </div>
            <div>
              <p className="font-heading text-3xl font-bold text-burgundy-700 dark:text-burgundy-400">
                {stats.regions}
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Sub-Regions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Wineries */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-heading text-3xl font-bold">
              Top-Rated Wineries
            </h2>
            <p className="mt-2 text-[var(--muted-foreground)]">
              The highest-rated destinations in wine country
            </p>
          </div>
          <Link
            href="/wineries"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-burgundy-700 dark:text-burgundy-400 hover:underline"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((w) => (
            <Link
              key={w.id}
              href={`/wineries/${w.slug}`}
              className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 hover:shadow-lg hover:border-burgundy-300 dark:hover:border-burgundy-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading text-lg font-semibold group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors">
                    {w.name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {w.subRegion} &middot;{" "}
                    {w.valley === "napa" ? "Napa Valley" : "Sonoma County"}
                  </p>
                </div>
                <Wine className="h-5 w-5 text-burgundy-300 dark:text-burgundy-600" />
              </div>
              <p className="mt-3 text-sm text-[var(--muted-foreground)] line-clamp-2">
                {w.shortDescription}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-gold-500 text-gold-500" />
                  <span className="text-sm font-medium">
                    {w.aggregateRating?.toFixed(1)}
                  </span>
                  <span className="text-sm text-[var(--muted-foreground)]">
                    ({w.totalRatings})
                  </span>
                </div>
                <span className="text-sm text-[var(--muted-foreground)]">
                  {"$".repeat(w.priceLevel || 2)}
                </span>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/wineries"
            className="inline-flex items-center gap-1 text-sm font-medium text-burgundy-700 dark:text-burgundy-400"
          >
            View all wineries <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-olive-50 dark:bg-olive-950 border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-bold">
            Plan Your Wine Country Visit
          </h2>
          <p className="mt-4 text-[var(--muted-foreground)] max-w-2xl mx-auto">
            Compare wineries side-by-side, save your favorites, and create the
            perfect tasting itinerary across Napa and Sonoma Valleys.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/map"
              className="inline-flex items-center gap-2 rounded-lg bg-burgundy-700 px-6 py-3 text-sm font-semibold text-white hover:bg-burgundy-800 transition-colors"
            >
              <Map className="h-4 w-4" />
              Explore the Map
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-6 py-3 text-sm font-semibold hover:bg-[var(--muted)] transition-colors"
            >
              Compare Wineries
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
