import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  savedTrips,
  savedTripStops,
  anonymousTrips,
  anonymousTripStops,
  wineries,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { z } from "zod";

const stopsInput = z.object({
  stopWineryIds: z
    .array(z.number().int().positive())
    .min(1)
    .max(12),
  origin: z
    .object({
      lat: z.number(),
      lng: z.number(),
      label: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ shareCode: string }> }
) {
  try {
    const { shareCode } = await params;
    const body = stopsInput.parse(await request.json());

    // Validate all winery IDs exist (prevent client from inventing IDs)
    const existing = await db
      .select({ id: wineries.id })
      .from(wineries)
      .where(inArray(wineries.id, body.stopWineryIds));
    if (existing.length !== body.stopWineryIds.length) {
      return NextResponse.json(
        { error: "One or more stops not found" },
        { status: 400 }
      );
    }

    const [saved] = await db
      .select()
      .from(savedTrips)
      .where(eq(savedTrips.shareCode, shareCode))
      .limit(1);

    if (saved) {
      // Only owner can mutate
      const session = await auth().catch(() => null);
      const userId = session?.user?.id;
      if (!userId || userId !== saved.userId) {
        return NextResponse.json(
          { error: "Not authorized to edit this trip" },
          { status: 403 }
        );
      }
      await db.delete(savedTripStops).where(eq(savedTripStops.tripId, saved.id));
      await db.insert(savedTripStops).values(
        body.stopWineryIds.map((wineryId, idx) => ({
          tripId: saved.id,
          wineryId,
          stopOrder: idx,
        }))
      );
      await db
        .update(savedTrips)
        .set({
          updatedAt: new Date().toISOString(),
          originLat: body.origin?.lat ?? saved.originLat,
          originLng: body.origin?.lng ?? saved.originLng,
          originLabel: body.origin?.label ?? saved.originLabel,
        })
        .where(eq(savedTrips.id, saved.id));
      return NextResponse.json({ ok: true, source: "saved" });
    }

    const [anon] = await db
      .select()
      .from(anonymousTrips)
      .where(eq(anonymousTrips.shareCode, shareCode))
      .limit(1);

    if (!anon) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    await db
      .delete(anonymousTripStops)
      .where(eq(anonymousTripStops.tripId, anon.id));
    await db.insert(anonymousTripStops).values(
      body.stopWineryIds.map((wineryId, idx) => ({
        tripId: anon.id,
        wineryId,
        stopOrder: idx,
      }))
    );
    await db
      .update(anonymousTrips)
      .set({
        updatedAt: new Date().toISOString(),
        originLat: body.origin?.lat ?? anon.originLat,
        originLng: body.origin?.lng ?? anon.originLng,
        originLabel: body.origin?.label ?? anon.originLabel,
      })
      .where(eq(anonymousTrips.id, anon.id));

    return NextResponse.json({ ok: true, source: "anonymous" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.issues },
        { status: 400 }
      );
    }
    console.error("PUT /api/trips/[shareCode]/stops error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
