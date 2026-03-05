import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { savedTrips, savedTripStops, wineries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateShareCode } from "@/lib/share-codes";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trips = await db
    .select()
    .from(savedTrips)
    .where(eq(savedTrips.userId, session.user.id))
    .orderBy(desc(savedTrips.createdAt));

  // Get stop counts and winery names for each trip
  const tripsWithStops = await Promise.all(
    trips.map(async (trip) => {
      const stops = await db
        .select({
          stopOrder: savedTripStops.stopOrder,
          wineryName: wineries.name,
          winerySlug: wineries.slug,
        })
        .from(savedTripStops)
        .innerJoin(wineries, eq(savedTripStops.wineryId, wineries.id))
        .where(eq(savedTripStops.tripId, trip.id))
        .orderBy(savedTripStops.stopOrder);

      return { ...trip, stops };
    })
  );

  return NextResponse.json(tripsWithStops);
}

export async function POST(request: NextRequest) {
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

  const [trip] = await db
    .insert(savedTrips)
    .values({
      userId: session.user.id,
      name,
      shareCode,
      theme: theme || null,
      valley: valley || null,
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
}
