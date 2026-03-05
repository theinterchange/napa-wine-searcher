import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { wineJournalEntries } from "@/db/schema";
import { eq, desc, like, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const search = request.nextUrl.searchParams.get("search");
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");

    if (isNaN(page) || page < 1) {
      return NextResponse.json({ error: "Invalid page" }, { status: 400 });
    }
    const clampedLimit = isNaN(limit) ? 50 : Math.min(Math.max(1, limit), 100);
    const offset = (page - 1) * clampedLimit;

    let query = db
      .select()
      .from(wineJournalEntries)
      .where(eq(wineJournalEntries.userId, session.user.id))
      .orderBy(desc(wineJournalEntries.dateTried))
      .limit(clampedLimit)
      .offset(offset);

    if (search) {
      query = db
        .select()
        .from(wineJournalEntries)
        .where(
          or(
            like(wineJournalEntries.wineName, `%${search}%`),
            like(wineJournalEntries.wineryName, `%${search}%`)
          )
        )
        .orderBy(desc(wineJournalEntries.dateTried))
        .limit(clampedLimit)
        .offset(offset);
    }

    const entries = await query;
    return NextResponse.json(entries);
  } catch (error) {
    console.error("GET /api/user/journal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { wineId, wineryId, wineName, wineryName, vintage, rating, tastingNotes, dateTried } = body;

    if (!wineName || !dateTried) {
      return NextResponse.json(
        { error: "Wine name and date are required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const [entry] = await db
      .insert(wineJournalEntries)
      .values({
        userId: session.user.id,
        wineId: wineId || null,
        wineryId: wineryId || null,
        wineName,
        wineryName: wineryName || null,
        vintage: vintage || null,
        rating: rating || null,
        tastingNotes: tastingNotes || null,
        dateTried,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(entry);
  } catch (error) {
    console.error("POST /api/user/journal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
