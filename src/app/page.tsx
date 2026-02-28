import Link from "next/link";
import { Map, Search, ArrowRight, Clock, MapPin, Wine } from "lucide-react";
import { db } from "@/db";
import { wineries, subRegions, dayTripRoutes, dayTripStops } from "@/db/schema";
import { sql, count, eq } from "drizzle-orm";

async function getFeaturedWinery() {
  const [winery] = await db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      heroImageUrl: wineries.heroImageUrl,
      shortDescription: wineries.shortDescription,
      subRegion: subRegions.name,
      valley: subRegions.valley,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(eq(wineries.curated, true))
    .orderBy(sql`RANDOM()`)
    .limit(1);
  return winery;
}

async function getDayTrips() {
  const routes = await db.select().from(dayTripRoutes).limit(3);

  // Get stop counts per route
  const stopCounts = await db
    .select({
      routeId: dayTripStops.routeId,
      count: count(),
    })
    .from(dayTripStops)
    .groupBy(dayTripStops.routeId);

  const countMap: Record<number, number> = {};
  for (const s of stopCounts) countMap[s.routeId] = s.count;

  return routes.map((r) => ({
    ...r,
    stopCount: countMap[r.id] || 0,
  }));
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

const discoveryLinks = [
  { label: "Walk-in Friendly", href: "/wineries?reservation=false" },
  { label: "Dog-Friendly", href: "/wineries?dog=true" },
  { label: "Picnic-Ready", href: "/wineries?picnic=true" },
  { label: "Under $40 Tastings", href: "/wineries?tastingPrice=budget" },
  { label: "Luxury Experiences", href: "/wineries?tastingPrice=luxury" },
  { label: "Cabernet Sauvignon", href: "/wineries?varietal=cabernet-sauvignon" },
];

export default async function HomePage() {
  const [featured, dayTrips, regionStats] = await Promise.all([
    getFeaturedWinery(),
    getDayTrips(),
    getRegionStats(),
  ]);

  return (
    <>
      {/* Featured Winery Hero */}
      {featured && (
        <section className="relative overflow-hidden bg-burgundy-950">
          {featured.heroImageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${featured.heroImageUrl})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-burgundy-950/85 via-burgundy-950/60 to-burgundy-950/40" />
            </div>
          )}
          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
            <span className="inline-block rounded-full bg-white/10 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white/80 mb-6">
              Featured
            </span>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-2xl">
              {featured.name}
            </h1>
            <p className="mt-2 text-sm text-white/70">
              {featured.subRegion} &middot;{" "}
              {featured.valley === "napa" ? "Napa Valley" : "Sonoma County"}
            </p>
            {featured.shortDescription && (
              <p className="mt-4 max-w-xl text-lg text-white/80">
                {featured.shortDescription}
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={`/wineries/${featured.slug}`}
                className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-burgundy-950 hover:bg-gold-400 transition-colors"
              >
                Explore {featured.name}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/wineries"
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Browse All Wineries
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Discovery Row */}
      <section className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="font-heading text-lg font-semibold mb-4">
            Find your perfect visit
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

      {/* Curated Day Trips */}
      {dayTrips.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-heading text-2xl font-bold">
                Curated Day Trips
              </h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Ready-made itineraries for a perfect day in wine country
              </p>
            </div>
            <Link
              href="/day-trips"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-burgundy-700 dark:text-burgundy-400 hover:underline"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dayTrips.map((trip) => (
              <Link
                key={trip.id}
                href={`/day-trips/${trip.slug}`}
                className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 hover:shadow-lg hover:border-burgundy-300 dark:hover:border-burgundy-700 transition-all"
              >
                <h3 className="font-heading text-lg font-semibold group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors">
                  {trip.title}
                </h3>
                {trip.description && (
                  <p className="mt-2 text-sm text-[var(--muted-foreground)] line-clamp-2">
                    {trip.description}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                  {trip.region && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {trip.region}
                    </span>
                  )}
                  <span>{trip.stopCount} stops</span>
                  {trip.estimatedHours && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      ~{trip.estimatedHours}h
                    </span>
                  )}
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-burgundy-700 dark:text-burgundy-400">
                  View route <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center sm:hidden">
            <Link
              href="/day-trips"
              className="inline-flex items-center gap-1 text-sm font-medium text-burgundy-700 dark:text-burgundy-400"
            >
              View all day trips <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Explore by Region */}
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

      {/* CTA */}
      <section className="bg-olive-50 dark:bg-olive-950 border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-2xl font-bold">
            Ready to explore?
          </h2>
          <p className="mt-3 text-[var(--muted-foreground)] max-w-lg mx-auto">
            Browse wineries, plan your route, and find the perfect tasting
            experience across Napa and Sonoma.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/wineries"
              className="inline-flex items-center gap-2 rounded-lg bg-burgundy-700 px-6 py-3 text-sm font-semibold text-white hover:bg-burgundy-800 transition-colors"
            >
              <Search className="h-4 w-4" />
              Browse Wineries
            </Link>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-6 py-3 text-sm font-semibold hover:bg-[var(--muted)] transition-colors"
            >
              <Map className="h-4 w-4" />
              View Map
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
