import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { savedTrips, savedTripStops, wineries, visited } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { Route } from "lucide-react";
import Link from "next/link";
import { TripCard } from "@/components/trip/TripCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Trips | Napa Sonoma Guide",
  description: "Your saved wine country trip plans.",
};

export default async function MyTripsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const trips = await db
    .select()
    .from(savedTrips)
    .where(eq(savedTrips.userId, session.user.id))
    .orderBy(desc(savedTrips.createdAt));

  const tripIds = trips.map((t) => t.id);
  const allStops = tripIds.length > 0
    ? await db
        .select({
          tripId: savedTripStops.tripId,
          stopOrder: savedTripStops.stopOrder,
          wineryId: savedTripStops.wineryId,
          wineryName: wineries.name,
        })
        .from(savedTripStops)
        .innerJoin(wineries, eq(savedTripStops.wineryId, wineries.id))
        .where(inArray(savedTripStops.tripId, tripIds))
        .orderBy(savedTripStops.stopOrder)
    : [];

  // Fetch visited winery IDs
  const userVisited = await db
    .select({ wineryId: visited.wineryId })
    .from(visited)
    .where(eq(visited.userId, session.user.id));
  const visitedSet = new Set(userVisited.map((v) => v.wineryId));

  const tripsWithStops = trips.map((trip) => {
    const stops = allStops.filter((s) => s.tripId === trip.id);
    const isCompleted =
      stops.length > 0 && stops.every((s) => visitedSet.has(s.wineryId));
    return { ...trip, stops, isCompleted };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 pb-5 border-b border-[var(--rule)]">
        <span className="kicker flex items-center gap-2">
          <Route className="h-3.5 w-3.5 text-[var(--brass)]" />
          Itineraries
        </span>
        <h1 className="editorial-h2 text-[28px] sm:text-[36px] mt-2">
          My <em>trips.</em>
        </h1>
      </header>

      {tripsWithStops.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tripsWithStops.map((trip) => (
            <TripCard
              key={trip.id}
              trip={{
                id: trip.id,
                name: trip.name,
                theme: trip.theme,
                shareCode: trip.shareCode,
                createdAt: trip.createdAt,
                stops: trip.stops,
              }}
              isCompleted={trip.isCompleted}
            />
          ))}
        </div>
      ) : (
        <div className="card-flat p-12 text-center">
          <Route className="mx-auto h-9 w-9 text-[var(--brass)] opacity-70" />
          <h2 className="mt-4 editorial-h2 text-[22px]">
            No saved trips yet
          </h2>
          <p className="mt-3 font-[var(--font-serif-text)] text-[15px] text-[var(--ink-2)] max-w-[50ch] mx-auto">
            Use the trip planner to create a route, then save it here.
          </p>
          <Link href="/itineraries" className="btn-ink mt-6 inline-flex">
            Plan a Trip
          </Link>
        </div>
      )}
    </div>
  );
}
