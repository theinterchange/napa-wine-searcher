import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { accommodations } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const YEAR_MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const accId = parseInt(id);
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if ("curated" in body) {
    updates.curated = body.curated;
    updates.curatedAt = body.curated ? new Date().toISOString() : null;
  }

  if ("spotlightYearMonth" in body) {
    const ym = body.spotlightYearMonth;
    if (ym !== null && (typeof ym !== "string" || !YEAR_MONTH_RE.test(ym))) {
      return NextResponse.json(
        { error: "INVALID_FORMAT", message: "Use YYYY-MM (e.g., 2026-08) or null." },
        { status: 400 }
      );
    }

    if (ym !== null) {
      const [conflict] = await db
        .select({ id: accommodations.id, name: accommodations.name })
        .from(accommodations)
        .where(
          and(eq(accommodations.spotlightYearMonth, ym), ne(accommodations.id, accId))
        )
        .limit(1);

      if (conflict) {
        return NextResponse.json(
          {
            error: "MONTH_TAKEN",
            existing: conflict,
            message: `${ym} is already assigned to ${conflict.name}.`,
          },
          { status: 409 }
        );
      }
    }

    updates.spotlightYearMonth = ym;
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

  await db.update(accommodations).set(updates).where(eq(accommodations.id, accId));

  return NextResponse.json({ ok: true });
}
