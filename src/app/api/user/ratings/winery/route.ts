import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { userWineryRatings } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wineryId = request.nextUrl.searchParams.get("wineryId");
    if (!wineryId) {
      return NextResponse.json({ error: "wineryId required" }, { status: 400 });
    }
    const parsed = parseInt(wineryId);
    if (isNaN(parsed)) {
      return NextResponse.json({ error: "Invalid wineryId" }, { status: 400 });
    }

    const [row] = await db
      .select()
      .from(userWineryRatings)
      .where(
        and(
          eq(userWineryRatings.userId, session.user.id),
          eq(userWineryRatings.wineryId, parsed)
        )
      );

    return NextResponse.json({ rating: row?.rating ?? 0 });
  } catch (error) {
    console.error("GET /api/user/ratings/winery error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { wineryId, rating } = await request.json();
    if (typeof wineryId !== "number" || typeof rating !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: "Rating must be integer 1-5" }, { status: 400 });
    }

    const now = new Date().toISOString();
    await db
      .insert(userWineryRatings)
      .values({
        userId: session.user.id,
        wineryId,
        rating,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [userWineryRatings.userId, userWineryRatings.wineryId],
        set: { rating, updatedAt: now },
      });

    return NextResponse.json({ success: true, rating });
  } catch (error) {
    console.error("POST /api/user/ratings/winery error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { wineryId } = await request.json();
    if (typeof wineryId !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await db
      .delete(userWineryRatings)
      .where(
        and(
          eq(userWineryRatings.userId, session.user.id),
          eq(userWineryRatings.wineryId, wineryId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/user/ratings/winery error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
