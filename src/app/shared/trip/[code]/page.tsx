import { db } from "@/db";
import { savedTrips, savedTripStops, wineries, subRegions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { MapPin, Route } from "lucide-react";
import Link from "next/link";
import { WineryCard } from "@/components/directory/WineryCard";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const [trip] = await db
    .select({ name: savedTrips.name })
    .from(savedTrips)
    .where(eq(savedTrips.shareCode, code))
    .limit(1);

  if (!trip) {
    return { title: "Trip Not Found" };
  }

  return {
    title: `${trip.name} | Wine Country Guide`,
    description: `Check out this wine country trip plan: ${trip.name}`,
    openGraph: {
      title: `${trip.name} — Wine Country Trip`,
      description: `A curated wine country trip plan on Wine Country Guide.`,
      type: "website",
    },
    alternates: {
      canonical: `/shared/trip/${code}`,
    },
  };
}

export default async function SharedTripPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const [trip] = await db
    .select()
    .from(savedTrips)
    .where(eq(savedTrips.shareCode, code))
    .limit(1);

  if (!trip) notFound();

  const stops = await db
    .select({
      stopOrder: savedTripStops.stopOrder,
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
      valley: subRegions.valley,
      curated: wineries.curated,
    })
    .from(savedTripStops)
    .innerJoin(wineries, eq(savedTripStops.wineryId, wineries.id))
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(eq(savedTripStops.tripId, trip.id))
    .orderBy(savedTripStops.stopOrder);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm text-[var(--muted-foreground)] flex items-center gap-1 mb-2">
          <Route className="h-4 w-4" />
          Shared Trip Plan
        </p>
        <h1 className="font-heading text-2xl font-bold">{trip.name}</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {stops.length} wineries
          {trip.theme && ` · ${trip.theme}`}
        </p>
      </div>

      <div className="space-y-4">
        {stops.map((stop, i) => (
          <div key={stop.id} className="flex gap-4 items-start">
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-burgundy-700 text-white text-sm font-bold">
                {i + 1}
              </div>
              {i < stops.length - 1 && (
                <div className="w-0.5 h-8 bg-[var(--border)]" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <WineryCard winery={stop} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/plan-trip"
          className="inline-flex items-center gap-2 rounded-lg bg-burgundy-700 px-6 py-3 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors"
        >
          <Route className="h-4 w-4" />
          Plan Your Own Trip
        </Link>
      </div>
    </div>
  );
}
