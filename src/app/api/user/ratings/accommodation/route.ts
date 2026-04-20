import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { userAccommodationRatings } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accommodationId = request.nextUrl.searchParams.get("accommodationId");
    if (!accommodationId) {
      return NextResponse.json({ error: "accommodationId required" }, { status: 400 });
    }
    const parsed = parseInt(accommodationId);
    if (isNaN(parsed)) {
      return NextResponse.json({ error: "Invalid accommodationId" }, { status: 400 });
    }

    const [row] = await db
      .select()
      .from(userAccommodationRatings)
      .where(
        and(
          eq(userAccommodationRatings.userId, session.user.id),
          eq(userAccommodationRatings.accommodationId, parsed)
        )
      );

    return NextResponse.json({ rating: row?.rating ?? 0 });
  } catch (error) {
    console.error("GET /api/user/ratings/accommodation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accommodationId, rating } = await request.json();
    if (typeof accommodationId !== "number" || typeof rating !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: "Rating must be integer 1-5" }, { status: 400 });
    }

    const now = new Date().toISOString();
    await db
      .insert(userAccommodationRatings)
      .values({
        userId: session.user.id,
        accommodationId,
        rating,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          userAccommodationRatings.userId,
          userAccommodationRatings.accommodationId,
        ],
        set: { rating, updatedAt: now },
      });

    return NextResponse.json({ success: true, rating });
  } catch (error) {
    console.error("POST /api/user/ratings/accommodation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accommodationId } = await request.json();
    if (typeof accommodationId !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await db
      .delete(userAccommodationRatings)
      .where(
        and(
          eq(userAccommodationRatings.userId, session.user.id),
          eq(userAccommodationRatings.accommodationId, accommodationId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/user/ratings/accommodation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
