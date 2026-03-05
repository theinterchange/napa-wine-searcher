import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { wineryNotes } from "@/db/schema";
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

    const [note] = await db
      .select()
      .from(wineryNotes)
      .where(
        and(
          eq(wineryNotes.userId, session.user.id),
          eq(wineryNotes.wineryId, parsed)
        )
      );

    return NextResponse.json({ content: note?.content || "" });
  } catch (error) {
    console.error("GET /api/user/notes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { wineryId, content } = await request.json();

    await db
      .insert(wineryNotes)
      .values({
        userId: session.user.id,
        wineryId,
        content,
      })
      .onConflictDoUpdate({
        target: [wineryNotes.userId, wineryNotes.wineryId],
        set: { content },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/user/notes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
