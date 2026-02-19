import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { visited } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wineryId = request.nextUrl.searchParams.get("wineryId");
  if (wineryId) {
    const [v] = await db
      .select()
      .from(visited)
      .where(
        and(
          eq(visited.userId, session.user.id),
          eq(visited.wineryId, parseInt(wineryId))
        )
      );
    return NextResponse.json({ isVisited: !!v, visitedDate: v?.visitedDate });
  }

  const userVisited = await db
    .select()
    .from(visited)
    .where(eq(visited.userId, session.user.id));

  return NextResponse.json(userVisited);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { wineryId, visitedDate } = await request.json();
  await db
    .insert(visited)
    .values({
      userId: session.user.id,
      wineryId,
      visitedDate: visitedDate || new Date().toISOString().split("T")[0],
    })
    .onConflictDoNothing();

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { wineryId } = await request.json();
  await db
    .delete(visited)
    .where(
      and(eq(visited.userId, session.user.id), eq(visited.wineryId, wineryId))
    );

  return NextResponse.json({ success: true });
}
