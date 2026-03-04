import Link from "next/link";
import { ArrowRight, Map, Wine, Star, UserPlus, MapPin, Route } from "lucide-react";
import { db } from "@/db";
import { wineries, subRegions, dayTripRoutes } from "@/db/schema";
import { sql, count, eq, gte, and } from "drizzle-orm";
import { auth } from "@/auth";
import { FeaturedCarousel } from "@/components/home/FeaturedCarousel";
import { HeroSearchTrigger } from "@/components/home/HeroSearchTrigger";
import { PlanYourVisit } from "@/components/home/PlanYourVisit";
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

async function getDayTrips() {
  return db
    .select({
      slug: dayTripRoutes.slug,
      title: dayTripRoutes.title,
      theme: dayTripRoutes.theme,
      estimatedHours: dayTripRoutes.estimatedHours,
    })
    .from(dayTripRoutes);
}

async function getDayTripCount() {
  const [{ total }] = await db.select({ total: count() }).from(dayTripRoutes);
  return total;
}

const discoveryLinks = [
  { label: "Luxury", href: "/wineries?tastingPrice=luxury" },
  { label: "Dog-Friendly", href: "/wineries?amenities=dog" },
  { label: "Kid-Friendly", href: "/wineries?amenities=kid" },
  { label: "Walk-in Friendly", href: "/wineries?amenities=walkin" },
  { label: "Picnic-Ready", href: "/wineries?amenities=picnic" },
  { label: "Under $40 Tastings", href: "/wineries?tastingPrice=budget" },
  { label: "Cabernet Sauvignon", href: "/wineries?varietal=cabernet-sauvignon" },
];

export default async function HomePage() {
  const [featured, regionStats, totalWineries, session, dayTrips, dayTripCount] = await Promise.all([
    getFeaturedWineries(),
    getRegionStats(),
    getTotalWineries(),
    auth(),
    getDayTrips(),
    getDayTripCount(),
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
            <HeroSearchTrigger />
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

      {/* 3. Quick Stats Bar */}
      <section className="border-y border-[var(--border)] bg-[var(--muted)]/30">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-6 text-sm text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1.5">
              <Wine className="h-4 w-4 text-burgundy-600 dark:text-burgundy-400" />
              <strong className="text-[var(--foreground)]">{totalWineries}</strong> Wineries
            </span>
            <span className="text-[var(--border)]" aria-hidden="true">|</span>
            <span className="flex items-center gap-1.5">
              <Route className="h-4 w-4 text-burgundy-600 dark:text-burgundy-400" />
              <strong className="text-[var(--foreground)]">{dayTripCount}</strong> Day Trip Routes
            </span>
            <span className="text-[var(--border)]" aria-hidden="true">|</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-burgundy-600 dark:text-burgundy-400" />
              <strong className="text-[var(--foreground)]">2</strong> Valleys
            </span>
          </div>
        </div>
      </section>

      {/* 4. Plan Your Visit — tabbed planner */}
      <PlanYourVisit
        discoveryLinks={discoveryLinks}
        regionStats={regionStats}
        dayTrips={dayTrips}
      />

      {/* 5. Email Capture + Account CTA */}
      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto">
            <EmailCapture source="guide" />
          </div>
          {!session && (
            <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
              Already visiting?{" "}
              <Link
                href="/login"
                className="font-medium text-burgundy-700 dark:text-burgundy-400 hover:underline"
              >
                Sign up to save favorites and track visits
              </Link>
            </p>
          )}
        </div>
      </section>
    </>
  );
}
