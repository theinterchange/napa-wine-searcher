import Link from "next/link";
import Image from "next/image";
import { db } from "@/db";
import {
  dayTripRoutes,
  dayTripStops,
  wineries,
  subRegions,
  tastingExperiences,
} from "@/db/schema";
import { eq, asc, min, max, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  Clock,
  MapPin,
  Star,
  Wine,
  Car,
  Navigation,
  DollarSign,
  Sparkles,
  CalendarCheck,
} from "lucide-react";
import type { Metadata } from "next";
import {
  computeSegments,
  buildGoogleMapsUrl,
  formatDistance,
  formatDriveTime,
} from "@/lib/geo";
import { ShareButton } from "@/components/social/ShareButton";
import { TrackedLink } from "@/components/monetization/TrackedLink";
import { AccommodationCard } from "@/components/accommodation/AccommodationCard";
import { getAllAccommodations } from "@/lib/accommodation-data";
import { BedDouble } from "lucide-react";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import { BASE_URL } from "@/lib/constants";

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

  const title = `${route.title} | Napa Sonoma Guide`;
  const description =
    route.description || `Day trip route through wine country`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/day-trips/${slug}`,
      siteName: "Napa Sonoma Guide",
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
      wineryWebsiteUrl: wineries.websiteUrl,
      lat: wineries.lat,
      lng: wineries.lng,
      subRegion: subRegions.name,
      valley: subRegions.valley,
    })
    .from(dayTripStops)
    .innerJoin(wineries, eq(dayTripStops.wineryId, wineries.id))
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(eq(dayTripStops.routeId, route.id))
    .orderBy(asc(dayTripStops.stopOrder));

  // Get min and max tasting price per stop winery
  const wineryIds = stops.map((s) => s.wineryId);
  const tastingPrices =
    wineryIds.length > 0
      ? await db
          .select({
            wineryId: tastingExperiences.wineryId,
            minPrice: min(tastingExperiences.price),
            maxPrice: max(tastingExperiences.price),
          })
          .from(tastingExperiences)
          .groupBy(tastingExperiences.wineryId)
      : [];
  const priceMap = new Map(
    tastingPrices.map((t) => [t.wineryId, { min: t.minPrice, max: t.maxPrice }])
  );

  // Compute distances between stops
  const segments = computeSegments(stops);
  const totalDrivingMiles = segments.reduce((s, seg) => s + seg.miles, 0);
  const totalDrivingMinutes = segments.reduce((s, seg) => s + seg.minutes, 0);

  // Get accommodations for the route's valley
  const routeValley = stops[0]?.valley ?? null;
  const allAccommodations = await getAllAccommodations();
  const nearbyAccommodations = routeValley
    ? allAccommodations.filter((a) => a.valley === routeValley).slice(0, 3)
    : allAccommodations.slice(0, 3);

  const totalTastingMinutes = stops.reduce(
    (sum, s) => sum + (s.suggestedDuration || 60),
    0
  );
  const totalMinutes = totalDrivingMinutes + totalTastingMinutes;

  // Tasting cost range
  let totalMinCost = 0;
  let totalMaxCost = 0;
  let hasCostData = false;
  for (const stop of stops) {
    const prices = priceMap.get(stop.wineryId);
    if (prices?.min != null) {
      totalMinCost += prices.min;
      totalMaxCost += prices.max ?? prices.min;
      hasCostData = true;
    }
  }

  const googleMapsUrl = buildGoogleMapsUrl(
    stops.map((s) => ({ lat: s.lat, lng: s.lng, name: s.wineryName }))
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
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Day Trips", href: "/day-trips" },
          { name: route.title, href: `/day-trips/${route.slug}` },
        ]}
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
          <Link
            href="/"
            className="hover:text-[var(--foreground)] transition-colors"
          >
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <Link
            href="/day-trips"
            className="hover:text-[var(--foreground)] transition-colors"
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
              ~{route.estimatedHours || Math.round(totalMinutes / 60)} hours total
            </span>
            <span>{stops.length} stops</span>
          </div>
        </div>

        {/* Route Summary Card */}
        <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="font-heading text-lg font-semibold mb-4">Route Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Car className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400 shrink-0" />
              <div>
                <p className="text-sm font-medium">{formatDistance(totalDrivingMiles)}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Total driving</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400 shrink-0" />
              <div>
                <p className="text-sm font-medium">{formatDriveTime(totalDrivingMinutes)} driving</p>
                <p className="text-xs text-[var(--muted-foreground)]">{formatDriveTime(totalTastingMinutes)} tasting</p>
              </div>
            </div>
            {hasCostData && (
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium">
                    ${Math.round(totalMinCost)}–${Math.round(totalMaxCost)}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">Est. tasting cost</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Wine className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400 shrink-0" />
              <div>
                <p className="text-sm font-medium">{stops.length} wineries</p>
                <p className="text-xs text-[var(--muted-foreground)]">on this route</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {googleMapsUrl && (
              <TrackedLink
                href={googleMapsUrl}
                clickType="directions"
                sourcePage={`/day-trips/${slug}`}
                sourceComponent="RouteSummary"
                className="inline-flex items-center gap-2 rounded-lg bg-burgundy-700 px-4 py-2 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors"
              >
                <Navigation className="h-4 w-4" />
                Open in Google Maps
              </TrackedLink>
            )}
            <Link
              href={`/plan-trip?from=${slug}`}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:border-burgundy-400 dark:hover:border-burgundy-600 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Customize This Route
            </Link>
            <ShareButton title={route.title} text={route.description ?? undefined} />
          </div>
        </div>

        {/* Stops */}
        <div className="space-y-0">
          {stops.map((stop, idx) => (
            <div key={stop.wineryId}>
              {/* Stop card */}
              <div className="flex gap-4">
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
                        <Image
                          src={stop.wineryHeroImageUrl}
                          alt={stop.wineryName}
                          fill
                          sizes="(max-width: 640px) 100vw, 192px"
                          className="object-cover transition-transform group-hover:scale-105"
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
                        {priceMap.get(stop.wineryId)?.min != null && (
                          <span>
                            Tastings from $
                            {Math.round(priceMap.get(stop.wineryId)!.min!)}
                          </span>
                        )}
                      </div>
                      {stop.wineryWebsiteUrl && (
                        <div className="mt-2">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-burgundy-950">
                            <CalendarCheck className="h-3.5 w-3.5" />
                            Book a Tasting
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </div>

              {/* Drive time indicator between stops */}
              {idx < stops.length - 1 && segments[idx] && segments[idx].miles > 0 && (
                <div className="flex gap-4 mb-2">
                  <div className="flex flex-col items-center w-8">
                    {/* spacer to align with timeline */}
                  </div>
                  <div className="flex items-center gap-2 py-1 px-3 text-xs text-[var(--muted-foreground)]">
                    <Car className="h-3.5 w-3.5" />
                    <span>
                      ~{formatDistance(segments[idx].miles)} · ~{formatDriveTime(segments[idx].minutes)} drive
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Where to Stay */}
        {nearbyAccommodations.length > 0 && (
          <section className="mt-12 border-t border-[var(--border)] pt-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl font-bold">
                Where to Stay
              </h2>
              <Link
                href={routeValley === "napa" ? "/where-to-stay/napa-valley" : routeValley === "sonoma" ? "/where-to-stay/sonoma-county" : "/where-to-stay"}
                className="text-sm font-medium text-[var(--foreground)] hover:underline"
              >
                All hotels &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyAccommodations.map((a) => (
                <AccommodationCard key={a.slug} accommodation={a} showBookingCTA />
              ))}
            </div>
          </section>
        )}

      </div>
    </>
  );
}
