import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  savedTrips,
  savedTripStops,
  wineries,
  wineJournalEntries,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { sendTripRecapEmail } from "@/lib/email";

// Rate limit: 1 recap per trip per 24h
const lastSentMap = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tripId } = await request.json();
    const parsed = parseInt(tripId);
    if (isNaN(parsed)) {
      return NextResponse.json({ error: "Invalid tripId" }, { status: 400 });
    }

    // Verify trip belongs to user
    const [trip] = await db
      .select()
      .from(savedTrips)
      .where(
        and(eq(savedTrips.id, parsed), eq(savedTrips.userId, session.user.id))
      );

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Rate limit check
    const rateKey = `${session.user.id}-${parsed}`;
    const lastSent = lastSentMap.get(rateKey);
    if (lastSent && Date.now() - lastSent < 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { error: "Recap already sent for this trip today. Check your email!" },
        { status: 429 }
      );
    }

    // Fetch trip stops with winery info
    const stops = await db
      .select({
        wineryId: savedTripStops.wineryId,
        wineryName: wineries.name,
        winerySlug: wineries.slug,
        websiteUrl: wineries.websiteUrl,
      })
      .from(savedTripStops)
      .innerJoin(wineries, eq(savedTripStops.wineryId, wineries.id))
      .where(eq(savedTripStops.tripId, parsed))
      .orderBy(savedTripStops.stopOrder);

    if (stops.length === 0) {
      return NextResponse.json(
        { error: "Trip has no stops" },
        { status: 400 }
      );
    }

    // Fetch journal entries for each winery
    const userId = session.user.id;
    const tripWineries = await Promise.all(
      stops.map(async (stop) => {
        const wines = await db
          .select({
            wineName: wineJournalEntries.wineName,
            wineryName: wineJournalEntries.wineryName,
            vintage: wineJournalEntries.vintage,
            rating: wineJournalEntries.rating,
            tastingNotes: wineJournalEntries.tastingNotes,
            dateTried: wineJournalEntries.dateTried,
          })
          .from(wineJournalEntries)
          .where(
            and(
              eq(wineJournalEntries.userId, userId),
              eq(wineJournalEntries.wineryId, stop.wineryId)
            )
          );

        return {
          name: stop.wineryName,
          slug: stop.winerySlug,
          websiteUrl: stop.websiteUrl,
          wines,
        };
      })
    );

    await sendTripRecapEmail(session.user.email, {
      tripName: trip.name,
      wineries: tripWineries,
    });

    lastSentMap.set(rateKey, Date.now());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/user/trip-recap error:", error);
    return NextResponse.json(
      { error: "Failed to send recap email" },
      { status: 500 }
    );
  }
}
