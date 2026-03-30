import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  users,
  favorites,
  visited,
  wineryNotes,
  wineJournalEntries,
  savedTripStops,
  savedTrips,
  wantToVisit,
} from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Delete all user data (order matters for FK constraints)
  await db.delete(wineJournalEntries).where(eq(wineJournalEntries.userId, userId));
  await db.delete(wineryNotes).where(eq(wineryNotes.userId, userId));
  await db.delete(favorites).where(eq(favorites.userId, userId));
  await db.delete(visited).where(eq(visited.userId, userId));
  await db.delete(wantToVisit).where(eq(wantToVisit.userId, userId));

  // Delete trip stops first, then trips
  const userTrips = await db
    .select({ id: savedTrips.id })
    .from(savedTrips)
    .where(eq(savedTrips.userId, userId));

  for (const trip of userTrips) {
    await db.delete(savedTripStops).where(eq(savedTripStops.tripId, trip.id));
  }
  await db.delete(savedTrips).where(eq(savedTrips.userId, userId));

  // Finally delete the user
  await db.delete(users).where(eq(users.id, userId));

  return NextResponse.json({ ok: true, message: "Account and all data deleted." });
}
