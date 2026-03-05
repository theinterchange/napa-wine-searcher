import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { favorites } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wineryId = request.nextUrl.searchParams.get("wineryId");
    if (wineryId) {
      const parsed = parseInt(wineryId);
      if (isNaN(parsed)) {
        return NextResponse.json({ error: "Invalid wineryId" }, { status: 400 });
      }
      const [fav] = await db
        .select()
        .from(favorites)
        .where(
          and(
            eq(favorites.userId, session.user.id),
            eq(favorites.wineryId, parsed)
          )
        );
      return NextResponse.json({ isFavorite: !!fav });
    }

    const userFavorites = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, session.user.id));

    return NextResponse.json(userFavorites);
  } catch (error) {
    console.error("GET /api/user/favorites error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { wineryId } = await request.json();
    await db.insert(favorites).values({
      userId: session.user.id,
      wineryId,
    }).onConflictDoNothing();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/user/favorites error:", error);
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
    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, session.user.id),
          eq(favorites.wineryId, wineryId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/user/favorites error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
