import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { wineJournalEntries, wineries } from "@/db/schema";
import { eq, desc, like, or, and } from "drizzle-orm";

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

    const selectFields = {
      id: wineJournalEntries.id,
      userId: wineJournalEntries.userId,
      wineId: wineJournalEntries.wineId,
      wineryId: wineJournalEntries.wineryId,
      entryType: wineJournalEntries.entryType,
      wineName: wineJournalEntries.wineName,
      wineryName: wineJournalEntries.wineryName,
      vintage: wineJournalEntries.vintage,
      rating: wineJournalEntries.rating,
      tastingNotes: wineJournalEntries.tastingNotes,
      dateTried: wineJournalEntries.dateTried,
      createdAt: wineJournalEntries.createdAt,
      updatedAt: wineJournalEntries.updatedAt,
      winerySlug: wineries.slug,
    };

    const whereClause = search
      ? and(
          eq(wineJournalEntries.userId, session.user.id),
          or(
            like(wineJournalEntries.wineName, `%${search}%`),
            like(wineJournalEntries.wineryName, `%${search}%`)
          )
        )
      : eq(wineJournalEntries.userId, session.user.id);

    const entries = await db
      .select(selectFields)
      .from(wineJournalEntries)
      .leftJoin(wineries, eq(wineJournalEntries.wineryId, wineries.id))
      .where(whereClause)
      .orderBy(desc(wineJournalEntries.dateTried))
      .limit(clampedLimit)
      .offset(offset);

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
    const { wineId, wineryId, wineName, wineryName, vintage, rating, tastingNotes, dateTried, entryType } = body;

    const type = entryType === "visit" ? "visit" : "wine";
    const resolvedWineName = type === "visit" ? (wineName || "Winery Visit") : wineName;

    if (!resolvedWineName || !dateTried) {
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
        entryType: type,
        wineName: resolvedWineName,
        wineryName: wineryName || null,
        vintage: type === "visit" ? null : (vintage || null),
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
