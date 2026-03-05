import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { collections } from "@/db/schema";
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
    const collectionId = parseInt(id);
    if (isNaN(collectionId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const [collection] = await db
      .select()
      .from(collections)
      .where(
        and(
          eq(collections.id, collectionId),
          eq(collections.userId, session.user.id)
        )
      );

    if (!collection) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error("GET /api/user/collections/[id] error:", error);
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
    const collectionId = parseInt(id);
    if (isNaN(collectionId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const { name, description, isPublic } = await request.json();

    await db
      .update(collections)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isPublic !== undefined && { isPublic }),
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(collections.id, collectionId),
          eq(collections.userId, session.user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/user/collections/[id] error:", error);
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
    const collectionId = parseInt(id);
    if (isNaN(collectionId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await db
      .delete(collections)
      .where(
        and(
          eq(collections.id, collectionId),
          eq(collections.userId, session.user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/user/collections/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
