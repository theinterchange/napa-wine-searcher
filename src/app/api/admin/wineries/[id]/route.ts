import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { wineries } from "@/db/schema";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const wineryId = parseInt(id);
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if ("curated" in body) {
    updates.curated = body.curated;
    updates.curatedAt = body.curated ? new Date().toISOString() : null;
  }

  if ("spotlightTeaser" in body) {
    const t = body.spotlightTeaser;
    if (t !== null && typeof t !== "string") {
      return NextResponse.json(
        { error: "INVALID_TYPE", message: "spotlightTeaser must be a string or null." },
        { status: 400 }
      );
    }
    updates.spotlightTeaser = t === null || t.trim() === "" ? null : t.trim();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  await db.update(wineries).set(updates).where(eq(wineries.id, wineryId));

  // Hero carousel pulls from `curated`; flip it and the homepage should
  // reflect it on the very next visit, not 24h from now.
  if ("curated" in updates) {
    revalidatePath("/");
  }

  return NextResponse.json({ ok: true });
}
