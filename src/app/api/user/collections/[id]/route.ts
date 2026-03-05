import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { collections } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [collection] = await db
    .select()
    .from(collections)
    .where(
      and(
        eq(collections.id, parseInt(id)),
        eq(collections.userId, session.user.id)
      )
    );

  if (!collection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(collection);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
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
        eq(collections.id, parseInt(id)),
        eq(collections.userId, session.user.id)
      )
    );

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await db
    .delete(collections)
    .where(
      and(
        eq(collections.id, parseInt(id)),
        eq(collections.userId, session.user.id)
      )
    );

  return NextResponse.json({ success: true });
}
