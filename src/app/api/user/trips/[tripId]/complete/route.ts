import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { savedTrips, savedTripStops, visited } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tripId: tripIdStr } = await params;
    const tripId = parseInt(tripIdStr);
    if (isNaN(tripId)) {
      return NextResponse.json({ error: "Invalid tripId" }, { status: 400 });
    }

    // Verify trip belongs to user
    const [trip] = await db
      .select()
      .from(savedTrips)
      .where(
        and(eq(savedTrips.id, tripId), eq(savedTrips.userId, session.user.id))
      );

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Fetch stops for this trip
    const stops = await db
      .select({ wineryId: savedTripStops.wineryId })
      .from(savedTripStops)
      .where(eq(savedTripStops.tripId, tripId));

    if (stops.length === 0) {
      return NextResponse.json(
        { error: "Trip has no stops" },
        { status: 400 }
      );
    }

    // Bulk insert into visited table
    const today = new Date().toISOString().split("T")[0];
    for (const stop of stops) {
      await db
        .insert(visited)
        .values({
          userId: session.user.id,
          wineryId: stop.wineryId,
          visitedDate: today,
        })
        .onConflictDoNothing();
    }

    return NextResponse.json({ success: true, markedCount: stops.length });
  } catch (error) {
    console.error("POST /api/user/trips/[tripId]/complete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
