import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { savedTrips, anonymousTrips } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";

const input = z.object({
  origin: z
    .object({
      lat: z.number(),
      lng: z.number(),
      label: z.string().nullable().optional(),
    })
    .nullable(),
});

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ shareCode: string }> }
) {
  try {
    const { shareCode } = await ctx.params;
    const { origin } = input.parse(await req.json());

    const session = await auth().catch(() => null);
    const userId = session?.user?.id ?? null;

    const [saved] = await db
      .select()
      .from(savedTrips)
      .where(eq(savedTrips.shareCode, shareCode))
      .limit(1);

    if (saved) {
      if (userId && saved.userId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      await db
        .update(savedTrips)
        .set({
          originLat: origin?.lat ?? null,
          originLng: origin?.lng ?? null,
          originLabel: origin?.label ?? null,
        })
        .where(eq(savedTrips.id, saved.id));
      return NextResponse.json({ ok: true });
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
      .update(anonymousTrips)
      .set({
        originLat: origin?.lat ?? null,
        originLng: origin?.lng ?? null,
        originLabel: origin?.label ?? null,
      })
      .where(eq(anonymousTrips.id, anon.id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.issues },
        { status: 400 }
      );
    }
    console.error("PUT /api/trips/[shareCode]/origin error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
