import Link from "next/link";
import { db } from "@/db";
import {
  dayTripRoutes,
  dayTripStops,
  wineries,
  subRegions,
  tastingExperiences,
} from "@/db/schema";
import { eq, asc, min } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ChevronRight, Clock, MapPin, Star, Wine } from "lucide-react";
import type { Metadata } from "next";

const BASE_URL = "https://napa-winery-search.vercel.app";

export async function generateStaticParams() {
  const routes = await db
    .select({ slug: dayTripRoutes.slug })
    .from(dayTripRoutes);
  return routes.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [route] = await db
    .select({
      title: dayTripRoutes.title,
      description: dayTripRoutes.description,
    })
    .from(dayTripRoutes)
    .where(eq(dayTripRoutes.slug, slug))
    .limit(1);

  if (!route) return { title: "Route Not Found" };

  const title = `${route.title} | Wine Country Guide`;
  const description =
    route.description || `Day trip route through wine country`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/day-trips/${slug}`,
      siteName: "Wine Country Guide",
      type: "website",
    },
  };
}

export default async function DayTripDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [route] = await db
    .select()
    .from(dayTripRoutes)
    .where(eq(dayTripRoutes.slug, slug))
    .limit(1);

  if (!route) notFound();

  const stops = await db
    .select({
      stopOrder: dayTripStops.stopOrder,
      notes: dayTripStops.notes,
      suggestedDuration: dayTripStops.suggestedDuration,
      wineryId: wineries.id,
      winerySlug: wineries.slug,
      wineryName: wineries.name,
      wineryCity: wineries.city,
      wineryHeroImageUrl: wineries.heroImageUrl,
      wineryRating: wineries.aggregateRating,
      wineryTotalRatings: wineries.totalRatings,
      wineryPriceLevel: wineries.priceLevel,
      subRegion: subRegions.name,
      valley: subRegions.valley,
    })
    .from(dayTripStops)
    .innerJoin(wineries, eq(dayTripStops.wineryId, wineries.id))
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(eq(dayTripStops.routeId, route.id))
    .orderBy(asc(dayTripStops.stopOrder));

  // Get min tasting price per stop winery
  const wineryIds = stops.map((s) => s.wineryId);
  const tastingPrices =
    wineryIds.length > 0
      ? await db
          .select({
            wineryId: tastingExperiences.wineryId,
            minPrice: min(tastingExperiences.price),
          })
          .from(tastingExperiences)
          .groupBy(tastingExperiences.wineryId)
      : [];
  const priceMap = new Map(tastingPrices.map((t) => [t.wineryId, t.minPrice]));

  const totalDuration = stops.reduce(
    (sum, s) => sum + (s.suggestedDuration || 60),
    0
  );

  // JSON-LD TouristTrip
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: route.title,
    description: route.description,
    url: `${BASE_URL}/day-trips/${route.slug}`,
    touristType: "Wine tourist",
    itinerary: {
      "@type": "ItemList",
      itemListElement: stops.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Winery",
          name: s.wineryName,
          url: `${BASE_URL}/wineries/${s.winerySlug}`,
        },
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
          <Link
            href="/"
            className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors"
          >
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <Link
            href="/day-trips"
            className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors"
          >
            Day Trips
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-[var(--foreground)] font-medium truncate" aria-current="page">
            {route.title}
          </span>
        </nav>

        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold">{route.title}</h1>
          <p className="mt-3 text-[var(--muted-foreground)] max-w-3xl">
            {route.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-[var(--muted-foreground)]">
            {route.region && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {route.region}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              ~{route.estimatedHours || Math.round(totalDuration / 60)} hours
            </span>
            <span>{stops.length} stops</span>
          </div>
        </div>

        {/* Stops */}
        <div className="space-y-6">
          {stops.map((stop, idx) => (
            <div key={stop.wineryId} className="flex gap-4">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-burgundy-700 text-sm font-bold text-white">
                  {idx + 1}
                </div>
                {idx < stops.length - 1 && (
                  <div className="w-0.5 flex-1 bg-burgundy-200 dark:bg-burgundy-800 mt-2" />
                )}
              </div>

              {/* Card */}
              <Link
                href={`/wineries/${stop.winerySlug}`}
                className="group flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:shadow-md hover:border-burgundy-300 dark:hover:border-burgundy-700 transition-all mb-2"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="relative aspect-[16/9] sm:aspect-auto sm:w-48 bg-burgundy-100 dark:bg-burgundy-900 shrink-0 flex items-center justify-center overflow-hidden">
                    {stop.wineryHeroImageUrl ? (
                      <img
                        src={stop.wineryHeroImageUrl}
                        alt={stop.wineryName}
                        className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <Wine className="h-10 w-10 text-burgundy-300 dark:text-burgundy-700" />
                    )}
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-heading text-lg font-semibold group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors">
                        {stop.wineryName}
                      </h3>
                      {stop.wineryPriceLevel && (
                        <span className="text-sm text-[var(--muted-foreground)]" aria-label={`Price level ${stop.wineryPriceLevel} of 4`}>
                          {"$".repeat(stop.wineryPriceLevel)}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {stop.subRegion}
                        {stop.wineryCity && ` · ${stop.wineryCity}`}
                      </span>
                      {stop.wineryRating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
                          {stop.wineryRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {stop.notes && (
                      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                        {stop.notes}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                      {stop.suggestedDuration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {stop.suggestedDuration} min
                        </span>
                      )}
                      {priceMap.get(stop.wineryId) && (
                        <span>
                          Tastings from $
                          {Math.round(priceMap.get(stop.wineryId)!)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
