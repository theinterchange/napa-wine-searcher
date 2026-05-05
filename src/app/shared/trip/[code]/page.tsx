import { db } from "@/db";
import { savedTrips, savedTripStops, wineries, subRegions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Route } from "lucide-react";
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
    title: `${trip.name} | Napa Sonoma Guide`,
    description: `Check out this wine country trip plan: ${trip.name}`,
    openGraph: {
      title: `${trip.name} — Wine Country Trip`,
      description: `A curated wine country trip plan on Napa Sonoma Guide.`,
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
      tastingPriceMin: wineries.tastingPriceMin,
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
      <header className="mb-8 pb-5 border-b border-[var(--rule)]">
        <span className="kicker flex items-center gap-2">
          <Route className="h-3.5 w-3.5 text-[var(--brass)]" />
          Shared trip plan
        </span>
        <h1 className="editorial-h2 text-[28px] sm:text-[36px] mt-2">{trip.name}</h1>
        <p className="mt-3 font-mono text-[11px] tracking-[0.12em] uppercase text-[var(--ink-3)]">
          {stops.length} {stops.length === 1 ? "winery" : "wineries"}
          {trip.theme && ` · ${trip.theme}`}
        </p>
      </header>

      <div className="space-y-4">
        {stops.map((stop, i) => (
          <div key={stop.id} className="flex gap-4 items-start">
            <div className="flex flex-col items-center">
              <div className="flex h-9 w-9 items-center justify-center bg-[var(--ink)] text-[var(--paper)] font-mono text-[12px] tracking-[0.05em] tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </div>
              {i < stops.length - 1 && (
                <div className="w-0.5 h-8 bg-[var(--rule)]" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <WineryCard winery={stop} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link href="/itineraries" className="btn-ink">
          <Route className="h-3.5 w-3.5" />
          Plan Your Own Trip
        </Link>
      </div>
    </div>
  );
}
