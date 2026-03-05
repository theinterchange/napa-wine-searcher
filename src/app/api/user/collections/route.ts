import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { collections, collectionItems } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { generateShareCode } from "@/lib/share-codes";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userCollections = await db
    .select({
      id: collections.id,
      name: collections.name,
      description: collections.description,
      shareCode: collections.shareCode,
      isPublic: collections.isPublic,
      createdAt: collections.createdAt,
      itemCount: count(collectionItems.wineryId),
    })
    .from(collections)
    .leftJoin(
      collectionItems,
      eq(collections.id, collectionItems.collectionId)
    )
    .where(eq(collections.userId, session.user.id))
    .groupBy(collections.id)
    .orderBy(desc(collections.createdAt));

  return NextResponse.json(userCollections);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }

  const shareCode = generateShareCode();

  const [collection] = await db
    .insert(collections)
    .values({
      userId: session.user.id,
      name: name.trim(),
      description: description?.trim() || null,
      shareCode,
    })
    .returning();

  return NextResponse.json(collection);
}
