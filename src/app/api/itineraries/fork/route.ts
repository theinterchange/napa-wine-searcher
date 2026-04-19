import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  dayTripRoutes,
  dayTripStops,
  savedTrips,
  savedTripStops,
  anonymousTrips,
  anonymousTripStops,
} from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { generateShareCode } from "@/lib/share-codes";
import { auth } from "@/auth";
import { z } from "zod";

const forkInput = z.object({
  routeId: z.number().int().positive().optional(),
  shareCode: z.string().min(4).max(32).optional(),
  stops: z
    .array(z.number().int().positive())
    .min(1)
    .max(12)
    .optional(),
  origin: z
    .object({
      lat: z.number(),
      lng: z.number(),
      label: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  name: z.string().min(1).max(120).optional(),
  theme: z.string().max(64).nullable().optional(),
  valley: z.string().max(32).nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const input = forkInput.parse(json);

    let sourceStopIds: number[] = input.stops ?? [];
    let routeId: number | null = input.routeId ?? null;
    let name = input.name ?? "Your Wine Country trip";
    let theme = input.theme ?? null;
    let valley = input.valley ?? null;

    if (routeId && sourceStopIds.length === 0) {
      const [route] = await db
        .select()
        .from(dayTripRoutes)
        .where(eq(dayTripRoutes.id, routeId))
        .limit(1);
      if (!route) {
        return NextResponse.json(
          { error: "Curated trip not found" },
          { status: 404 }
        );
      }
      const rows = await db
        .select({ wineryId: dayTripStops.wineryId })
        .from(dayTripStops)
        .where(eq(dayTripStops.routeId, route.id))
        .orderBy(asc(dayTripStops.stopOrder));
      sourceStopIds = rows.map((r) => r.wineryId);
      name = input.name ?? route.title;
      theme = theme ?? route.theme ?? null;
      valley = valley ?? route.region ?? null;
    }

    if (sourceStopIds.length === 0) {
      return NextResponse.json(
        { error: "No stops provided" },
        { status: 400 }
      );
    }

    const session = await auth().catch(() => null);
    const userId = session?.user?.id ?? null;

    const shareCode = generateShareCode();

    if (userId) {
      const [inserted] = await db
        .insert(savedTrips)
        .values({
          userId,
          name,
          shareCode,
          theme,
          valley,
          forkedFromRouteId: routeId,
          originLat: input.origin?.lat ?? null,
          originLng: input.origin?.lng ?? null,
          originLabel: input.origin?.label ?? null,
        })
        .returning({ id: savedTrips.id });
      if (inserted?.id) {
        await db.insert(savedTripStops).values(
          sourceStopIds.map((wineryId, idx) => ({
            tripId: inserted.id,
            wineryId,
            stopOrder: idx,
          }))
        );
      }
    } else {
      const [inserted] = await db
        .insert(anonymousTrips)
        .values({
          shareCode,
          name,
          theme,
          valley,
          forkedFromRouteId: routeId,
          originLat: input.origin?.lat ?? null,
          originLng: input.origin?.lng ?? null,
          originLabel: input.origin?.label ?? null,
        })
        .returning({ id: anonymousTrips.id });
      if (inserted?.id) {
        await db.insert(anonymousTripStops).values(
          sourceStopIds.map((wineryId, idx) => ({
            tripId: inserted.id,
            wineryId,
            stopOrder: idx,
          }))
        );
      }
    }

    return NextResponse.json({
      shareCode,
      authenticated: !!userId,
      editUrl: `/trips/${shareCode}/edit`,
      viewUrl: `/trips/${shareCode}`,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/itineraries/fork error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
