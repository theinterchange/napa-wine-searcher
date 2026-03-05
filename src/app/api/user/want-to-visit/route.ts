import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { wantToVisit } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wineryId = request.nextUrl.searchParams.get("wineryId");
  if (wineryId) {
    const [entry] = await db
      .select()
      .from(wantToVisit)
      .where(
        and(
          eq(wantToVisit.userId, session.user.id),
          eq(wantToVisit.wineryId, parseInt(wineryId))
        )
      );
    return NextResponse.json({ isWantToVisit: !!entry });
  }

  const list = await db
    .select()
    .from(wantToVisit)
    .where(eq(wantToVisit.userId, session.user.id));

  return NextResponse.json(list);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { wineryId } = await request.json();
  await db
    .insert(wantToVisit)
    .values({
      userId: session.user.id,
      wineryId,
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
    .delete(wantToVisit)
    .where(
      and(
        eq(wantToVisit.userId, session.user.id),
        eq(wantToVisit.wineryId, wineryId)
      )
    );

  return NextResponse.json({ success: true });
}
