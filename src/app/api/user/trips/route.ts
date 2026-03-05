import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { savedTrips, savedTripStops, wineries } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { generateShareCode } from "@/lib/share-codes";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trips = await db
      .select()
      .from(savedTrips)
      .where(eq(savedTrips.userId, session.user.id))
      .orderBy(desc(savedTrips.createdAt));

    if (trips.length === 0) {
      return NextResponse.json([]);
    }

    // Fix N+1: fetch all stops for all trips in a single query
    const tripIds = trips.map((t) => t.id);
    const allStops = await db
      .select({
        tripId: savedTripStops.tripId,
        stopOrder: savedTripStops.stopOrder,
        wineryName: wineries.name,
        winerySlug: wineries.slug,
      })
      .from(savedTripStops)
      .innerJoin(wineries, eq(savedTripStops.wineryId, wineries.id))
      .where(inArray(savedTripStops.tripId, tripIds))
      .orderBy(savedTripStops.stopOrder);

    // Group stops by tripId
    const stopsByTrip = new Map<number, typeof allStops>();
    for (const stop of allStops) {
      const existing = stopsByTrip.get(stop.tripId) || [];
      existing.push(stop);
      stopsByTrip.set(stop.tripId, existing);
    }

    const tripsWithStops = trips.map((trip) => ({
      ...trip,
      stops: stopsByTrip.get(trip.id) || [],
    }));

    return NextResponse.json(tripsWithStops);
  } catch (error) {
    console.error("GET /api/user/trips error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, stops, theme, valley } = await request.json();

    if (!name || !stops?.length) {
      return NextResponse.json(
        { error: "Name and stops are required" },
        { status: 400 }
      );
    }

    const shareCode = generateShareCode();
    const now = new Date().toISOString();

    const [trip] = await db
      .insert(savedTrips)
      .values({
        userId: session.user.id,
        name,
        shareCode,
        theme: theme || null,
        valley: valley || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await db.insert(savedTripStops).values(
      (stops as number[]).map((wineryId, index) => ({
        tripId: trip.id,
        wineryId,
        stopOrder: index + 1,
      }))
    );

    return NextResponse.json({ ...trip, shareCode });
  } catch (error) {
    console.error("POST /api/user/trips error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
