import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { visited } from "@/db/schema";
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
      const [v] = await db
        .select()
        .from(visited)
        .where(
          and(
            eq(visited.userId, session.user.id),
            eq(visited.wineryId, parsed)
          )
        );
      return NextResponse.json({ isVisited: !!v, visitedDate: v?.visitedDate });
    }

    const userVisited = await db
      .select()
      .from(visited)
      .where(eq(visited.userId, session.user.id));

    return NextResponse.json(userVisited);
  } catch (error) {
    console.error("GET /api/user/visited error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { wineryId, visitedDate } = await request.json();
    if (typeof wineryId !== "number") {
      return NextResponse.json({ error: "Invalid wineryId" }, { status: 400 });
    }
    await db
      .insert(visited)
      .values({
        userId: session.user.id,
        wineryId,
        visitedDate: visitedDate || new Date().toISOString().split("T")[0],
      })
      .onConflictDoNothing();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/user/visited error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
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
      return NextResponse.json({ error: "Invalid wineryId" }, { status: 400 });
    }
    await db
      .delete(visited)
      .where(
        and(eq(visited.userId, session.user.id), eq(visited.wineryId, wineryId))
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/user/visited error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
