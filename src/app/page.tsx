import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Map, Wine, Route, Star, UserPlus } from "lucide-react";
import { db } from "@/db";
import { wineries, subRegions } from "@/db/schema";
import { sql, count, eq, gte, and } from "drizzle-orm";
import { auth } from "@/auth";
import { FeaturedCarousel } from "@/components/home/FeaturedCarousel";
import { HomepageSearch } from "@/components/home/HomepageSearch";

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
    .where(and(eq(wineries.curated, true), gte(wineries.googleRating, 4.5)))
    .orderBy(sql`RANDOM()`)
    .limit(5);
}

async function getRegionStats() {
  const rows = await db
    .select({
      valley: subRegions.valley,
      subRegionName: subRegions.name,
      subRegionSlug: subRegions.slug,
      count: count(),
    })
    .from(wineries)
    .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .groupBy(subRegions.id)
    .orderBy(sql`count(*) DESC`);

  const napa = rows.filter((r) => r.valley === "napa");
  const sonoma = rows.filter((r) => r.valley === "sonoma");
  const napaTotal = napa.reduce((s, r) => s + r.count, 0);
  const sonomaTotal = sonoma.reduce((s, r) => s + r.count, 0);

  return { napa, sonoma, napaTotal, sonomaTotal };
}

async function getTotalWineries() {
  const [{ total }] = await db.select({ total: count() }).from(wineries);
  return total;
}

const discoveryLinks = [
  { label: "Luxury", href: "/wineries?tastingPrice=luxury" },
  { label: "Dog-Friendly", href: "/wineries?dog=true" },
  { label: "Kid-Friendly", href: "/wineries?kid=true" },
  { label: "Walk-in Friendly", href: "/wineries?reservation=false" },
  { label: "Picnic-Ready", href: "/wineries?picnic=true" },
  { label: "Under $40 Tastings", href: "/wineries?tastingPrice=budget" },
  { label: "Cabernet Sauvignon", href: "/wineries?varietal=cabernet-sauvignon" },
];

export default async function HomePage() {
  const [featured, regionStats, totalWineries, session] = await Promise.all([
    getFeaturedWineries(),
    getRegionStats(),
    getTotalWineries(),
    auth(),
  ]);

  return (
    <>
      {/* 1. Hero + Search */}
      <section className="relative bg-burgundy-950">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="flex items-center gap-2 mb-4">
            <Wine className="h-5 w-5 text-gold-400" />
            <span className="text-sm font-medium text-gold-400/80">
              Wine Country Guide
            </span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-2xl">
            Discover Napa & Sonoma Wine Country
          </h1>
          <p className="mt-4 text-lg text-white/70 max-w-xl">
            Explore {totalWineries} wineries across two of the world&apos;s
            finest wine regions.
          </p>
          <div className="mt-8">
            <HomepageSearch />
          </div>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/wineries"
              className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-burgundy-950 hover:bg-gold-400 transition-colors"
            >
              Browse All Wineries
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              <Map className="h-4 w-4" />
              View Map
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Featured Wineries Carousel */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold mb-6 flex items-center gap-2">
            <Star className="h-5 w-5 text-gold-500" />
            Featured Wineries
          </h2>
          <FeaturedCarousel wineries={featured} />
        </section>
      )}

      {/* 3. Discovery Pills */}
      <section className="border-y border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="font-heading text-lg font-semibold mb-4">
            What are you looking for?
          </h2>
          <div className="flex flex-wrap gap-2">
            {discoveryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium hover:border-burgundy-400 hover:text-burgundy-700 dark:hover:border-burgundy-600 dark:hover:text-burgundy-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Map CTA */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/map"
          className="group relative block overflow-hidden rounded-xl"
        >
          <Image
            src="/map-preview.jpg"
            alt="Map of Napa and Sonoma wine country"
            width={1200}
            height={400}
            className="w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-burgundy-950/80 via-burgundy-950/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-white">
              Explore the Map
            </h2>
            <p className="mt-1 text-sm text-white/70 max-w-md">
              See every winery plotted across Napa and Sonoma valleys
            </p>
            <span className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-white group-hover:bg-white/30 transition-colors">
              <Map className="h-4 w-4" />
              Open Map
            </span>
          </div>
        </Link>
      </section>

      {/* 5. Explore by Region */}
      <section className="border-t border-[var(--border)] bg-[var(--muted)]/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold mb-8">
            Explore by Region
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Napa Valley */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-xl font-semibold">
                  Napa Valley
                </h3>
                <span className="text-sm text-[var(--muted-foreground)]">
                  {regionStats.napaTotal} wineries
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {regionStats.napa.slice(0, 4).map((r) => (
                  <Link
                    key={r.subRegionSlug}
                    href={`/wineries?region=${r.subRegionSlug}`}
                    className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm hover:border-burgundy-400 hover:text-burgundy-700 dark:hover:border-burgundy-600 dark:hover:text-burgundy-400 transition-colors"
                  >
                    {r.subRegionName}{" "}
                    <span className="text-[var(--muted-foreground)]">
                      ({r.count})
                    </span>
                  </Link>
                ))}
                <Link
                  href="/wineries?valley=napa"
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-burgundy-700 dark:text-burgundy-400 hover:underline"
                >
                  View all &rarr;
                </Link>
              </div>
            </div>

            {/* Sonoma County */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-xl font-semibold">
                  Sonoma County
                </h3>
                <span className="text-sm text-[var(--muted-foreground)]">
                  {regionStats.sonomaTotal} wineries
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {regionStats.sonoma.slice(0, 4).map((r) => (
                  <Link
                    key={r.subRegionSlug}
                    href={`/wineries?region=${r.subRegionSlug}`}
                    className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm hover:border-burgundy-400 hover:text-burgundy-700 dark:hover:border-burgundy-600 dark:hover:text-burgundy-400 transition-colors"
                  >
                    {r.subRegionName}{" "}
                    <span className="text-[var(--muted-foreground)]">
                      ({r.count})
                    </span>
                  </Link>
                ))}
                <Link
                  href="/wineries?valley=sonoma"
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-burgundy-700 dark:text-burgundy-400 hover:underline"
                >
                  View all &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Day Trip CTA */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/day-trips"
          className="group flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 hover:shadow-lg hover:border-burgundy-300 dark:hover:border-burgundy-700 transition-all"
        >
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-burgundy-100 dark:bg-burgundy-900">
            <Route className="h-6 w-6 text-burgundy-700 dark:text-burgundy-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-lg font-semibold group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors">
              Plan a Day Trip
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Ready-made itineraries for a perfect day in wine country
            </p>
          </div>
          <ArrowRight className="h-5 w-5 flex-shrink-0 text-[var(--muted-foreground)] group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors" />
        </Link>
      </section>

      {/* 7. Join CTA (only if not logged in) */}
      {!session && (
        <section className="bg-olive-50 dark:bg-olive-950 border-t border-[var(--border)]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
            <UserPlus className="h-8 w-8 mx-auto text-burgundy-600 dark:text-burgundy-400 mb-4" />
            <h2 className="font-heading text-2xl font-bold">
              Create your free account
            </h2>
            <p className="mt-3 text-[var(--muted-foreground)] max-w-lg mx-auto">
              Save favorites, track visits, and plan your trip across Napa and
              Sonoma.
            </p>
            <div className="mt-8">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-burgundy-700 px-6 py-3 text-sm font-semibold text-white hover:bg-burgundy-800 transition-colors"
              >
                Sign Up
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
