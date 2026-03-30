import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { wineJournalEntries, wineries, visited } from "@/db/schema";
import { eq, desc, count, avg } from "drizzle-orm";
import { BookOpen, Star, Wine, CheckCircle2, Mail, MapPin } from "lucide-react";
import { JournalActions } from "@/components/journal/JournalActions";
import { JournalView } from "@/components/journal/JournalView";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wine Journal | Napa Sonoma Guide",
  description: "Your personal wine journal — track wines you've tried with ratings and tasting notes.",
};

export default async function JournalPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [entries, [{ total }], [{ avgRating }], visitedWineries, [{ visitedCount }]] = await Promise.all([
    db
      .select({
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
      })
      .from(wineJournalEntries)
      .leftJoin(wineries, eq(wineJournalEntries.wineryId, wineries.id))
      .where(eq(wineJournalEntries.userId, session.user.id))
      .orderBy(desc(wineJournalEntries.dateTried)),
    db
      .select({ total: count() })
      .from(wineJournalEntries)
      .where(eq(wineJournalEntries.userId, session.user.id)),
    db
      .select({ avgRating: avg(wineJournalEntries.rating) })
      .from(wineJournalEntries)
      .where(eq(wineJournalEntries.userId, session.user.id)),
    db
      .select({
        wineryId: visited.wineryId,
        wineryName: wineries.name,
        winerySlug: wineries.slug,
        visitedDate: visited.visitedDate,
      })
      .from(visited)
      .innerJoin(wineries, eq(visited.wineryId, wineries.id))
      .where(eq(visited.userId, session.user.id)),
    db
      .select({ visitedCount: count() })
      .from(visited)
      .where(eq(visited.userId, session.user.id)),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-burgundy-600" />
            Wine Journal
          </h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-[var(--muted-foreground)]">
            <span>{total} {total === 1 ? "wine" : "wines"} logged</span>
            {visitedCount > 0 && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {visitedCount} {visitedCount === 1 ? "winery" : "wineries"} visited
              </span>
            )}
            {avgRating && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
                {parseFloat(String(avgRating)).toFixed(1)} avg rating
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <JournalActions />
        </div>
      </div>

      {entries.length > 0 ? (
        <JournalView entries={entries} visitedWineries={visitedWineries} />
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 sm:p-12">
          <div className="text-center mb-8">
            <BookOpen className="mx-auto h-10 w-10 text-burgundy-600" />
            <h2 className="mt-4 font-heading text-xl font-semibold">
              Welcome to Your Wine Journal
            </h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)] max-w-lg mx-auto">
              Keep track of wines you&apos;ve tasted, rate your favorites, and build a personal record of your wine country adventures.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="rounded-lg border border-[var(--border)] p-5">
              <Wine className="h-6 w-6 text-burgundy-600 mb-3" />
              <h3 className="font-heading font-semibold text-sm">Log Wines</h3>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Use the &ldquo;Tried it&rdquo; button on any winery page, or add wines manually with &ldquo;Log Wine&rdquo; above.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-5">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 mb-3" />
              <h3 className="font-heading font-semibold text-sm">Track Visits</h3>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Click &ldquo;Mark Visited&rdquo; on winery pages to record where you&apos;ve been and when.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-5">
              <Mail className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="font-heading font-semibold text-sm">Trip Recaps</h3>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                After a saved trip, mark it complete on My Trips to get an email recap of your visit.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Link
              href="/wineries"
              className="rounded-lg bg-burgundy-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors"
            >
              Browse Wineries
            </Link>
            <Link
              href="/plan-trip"
              className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
            >
              Plan a Trip
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
