import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  users,
  favorites,
  visited,
  wineryNotes,
  wineJournalEntries,
  savedTrips,
  savedTripStops,
  wantToVisit,
  wineries,
} from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Fetch all user data
  const [profile] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId));

  const userFavorites = await db
    .select({ wineryName: wineries.name, winerySlug: wineries.slug })
    .from(favorites)
    .innerJoin(wineries, eq(favorites.wineryId, wineries.id))
    .where(eq(favorites.userId, userId));

  const userVisited = await db
    .select({
      wineryName: wineries.name,
      winerySlug: wineries.slug,
      visitedDate: visited.visitedDate,
    })
    .from(visited)
    .innerJoin(wineries, eq(visited.wineryId, wineries.id))
    .where(eq(visited.userId, userId));

  const userNotes = await db
    .select({
      wineryName: wineries.name,
      content: wineryNotes.content,
    })
    .from(wineryNotes)
    .innerJoin(wineries, eq(wineryNotes.wineryId, wineries.id))
    .where(eq(wineryNotes.userId, userId));

  const userJournal = await db
    .select()
    .from(wineJournalEntries)
    .where(eq(wineJournalEntries.userId, userId));

  const userTrips = await db
    .select()
    .from(savedTrips)
    .where(eq(savedTrips.userId, userId));

  const userWantToVisit = await db
    .select({ wineryName: wineries.name, winerySlug: wineries.slug })
    .from(wantToVisit)
    .innerJoin(wineries, eq(wantToVisit.wineryId, wineries.id))
    .where(eq(wantToVisit.userId, userId));

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile,
    favorites: userFavorites,
    visited: userVisited,
    wantToVisit: userWantToVisit,
    notes: userNotes,
    journal: userJournal,
    trips: userTrips,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="napa-sonoma-guide-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
