import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { wineJournalEntries } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const entryId = parseInt(id);
    if (isNaN(entryId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const [entry] = await db
      .select()
      .from(wineJournalEntries)
      .where(
        and(
          eq(wineJournalEntries.id, entryId),
          eq(wineJournalEntries.userId, session.user.id)
        )
      );

    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("GET /api/user/journal/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const entryId = parseInt(id);
    if (isNaN(entryId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const { wineName, vintage, rating, tastingNotes, dateTried } = body;

    await db
      .update(wineJournalEntries)
      .set({
        wineName,
        vintage: vintage || null,
        rating: rating || null,
        tastingNotes: tastingNotes || null,
        dateTried,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(wineJournalEntries.id, entryId),
          eq(wineJournalEntries.userId, session.user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/user/journal/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const entryId = parseInt(id);
    if (isNaN(entryId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await db
      .delete(wineJournalEntries)
      .where(
        and(
          eq(wineJournalEntries.id, entryId),
          eq(wineJournalEntries.userId, session.user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/user/journal/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
