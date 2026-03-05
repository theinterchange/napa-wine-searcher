import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { collections, collectionItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";

async function verifyOwnership(collectionId: number, userId: string) {
  const [collection] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(
      and(
        eq(collections.id, collectionId),
        eq(collections.userId, userId)
      )
    );
  return !!collection;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const collectionId = parseInt(id);
    if (isNaN(collectionId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    if (!(await verifyOwnership(collectionId, session.user.id))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { wineryId, notes } = await request.json();

    await db
      .insert(collectionItems)
      .values({
        collectionId,
        wineryId,
        notes: notes || null,
        addedAt: new Date().toISOString(),
      })
      .onConflictDoNothing();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/user/collections/[id]/items error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const collectionId = parseInt(id);
    if (isNaN(collectionId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    if (!(await verifyOwnership(collectionId, session.user.id))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { wineryId } = await request.json();

    await db
      .delete(collectionItems)
      .where(
        and(
          eq(collectionItems.collectionId, collectionId),
          eq(collectionItems.wineryId, wineryId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/user/collections/[id]/items error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
