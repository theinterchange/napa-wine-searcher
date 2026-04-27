import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  savedTrips,
  anonymousTrips,
  accommodations,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

/**
 * Set (or clear) the home-base accommodation on a trip. Also copies the
 * accommodation's coords + name into the trip's origin columns so the
 * engine treats the hotel as the trip's anchor point for route
 * optimization.
 *
 * Body:
 *   { accommodationId: number, nights: number | null }  — set home base
 *   { accommodationId: null }                           — clear home base
 */

const bodySchema = z.object({
  accommodationId: z.number().int().positive().nullable(),
  nights: z.number().int().min(1).max(7).nullable().optional(),
});

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ shareCode: string }> }
) {
  try {
    const { shareCode } = await ctx.params;
    const body = bodySchema.parse(await req.json());

    let lat: number | null = null;
    let lng: number | null = null;
    let label: string | null = null;

    if (body.accommodationId != null) {
      const [hotel] = await db
        .select({
          id: accommodations.id,
          name: accommodations.name,
          lat: accommodations.lat,
          lng: accommodations.lng,
        })
        .from(accommodations)
        .where(eq(accommodations.id, body.accommodationId))
        .limit(1);
      if (!hotel) {
        return NextResponse.json(
          { error: "Accommodation not found" },
          { status: 404 }
        );
      }
      if (hotel.lat == null || hotel.lng == null) {
        return NextResponse.json(
          { error: "Accommodation has no coordinates" },
          { status: 422 }
        );
      }
      lat = hotel.lat;
      lng = hotel.lng;
      label = hotel.name;
    }

    // Try saved trips first, then anonymous. The same shareCode won't
    // collide across tables because both shareCode columns are unique
    // within their table and the generator runs across a shared namespace.
    const savedResult = await db
      .update(savedTrips)
      .set({
        homeBaseAccommodationId: body.accommodationId,
        nights: body.nights ?? null,
        originLat: lat,
        originLng: lng,
        originLabel: label,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(savedTrips.shareCode, shareCode))
      .returning({ id: savedTrips.id });

    if (savedResult.length > 0) {
      return NextResponse.json({ ok: true, tripKind: "saved" });
    }

    const anonResult = await db
      .update(anonymousTrips)
      .set({
        homeBaseAccommodationId: body.accommodationId,
        nights: body.nights ?? null,
        originLat: lat,
        originLng: lng,
        originLabel: label,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(anonymousTrips.shareCode, shareCode))
      .returning({ id: anonymousTrips.id });

    if (anonResult.length > 0) {
      return NextResponse.json({ ok: true, tripKind: "anonymous" });
    }

    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.issues },
        { status: 400 }
      );
    }
    console.error("PUT /api/trips/[shareCode]/home-base error:", err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Internal server error", detail },
      { status: 500 }
    );
  }
}
