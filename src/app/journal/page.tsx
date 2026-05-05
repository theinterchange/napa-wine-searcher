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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 pb-5 border-b border-[var(--rule)]">
        <div>
          <span className="kicker flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-[var(--brass)]" />
            Tasting log
          </span>
          <h1 className="editorial-h2 text-[28px] sm:text-[36px] mt-2">
            Wine <em>journal.</em>
          </h1>
          <div className="flex items-center gap-4 mt-3 font-mono text-[11px] tracking-[0.12em] uppercase text-[var(--ink-3)] flex-wrap">
            <span>{total} {total === 1 ? "wine" : "wines"} logged</span>
            {visitedCount > 0 && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[var(--brass)]" />
                {visitedCount} {visitedCount === 1 ? "winery" : "wineries"} visited
              </span>
            )}
            {avgRating && (
              <span className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-[var(--brass)] text-[var(--brass)]" />
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
        <div className="card-flat p-8 sm:p-12">
          <div className="text-center mb-8">
            <BookOpen className="mx-auto h-9 w-9 text-[var(--brass)]" />
            <span className="block kicker mt-4">Start here</span>
            <h2 className="mt-2 editorial-h2 text-[24px] sm:text-[28px]">
              Welcome to your <em>journal.</em>
            </h2>
            <p className="mt-3 font-[var(--font-serif-text)] text-[15px] text-[var(--ink-2)] max-w-[55ch] mx-auto">
              Keep track of wines you&apos;ve tasted, rate your favorites, and build a personal record of your wine country adventures.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-[var(--paper)] border-t-2 border-[var(--brass)] p-5">
              <Wine className="h-6 w-6 text-[var(--brass)] mb-3" />
              <h3 className="font-[var(--font-heading)] text-[16px] text-[var(--ink)]">Log Wines</h3>
              <p className="mt-1.5 text-xs text-[var(--ink-3)]">
                Use the &ldquo;Tried it&rdquo; button on any winery page, or add wines manually with &ldquo;Log Wine&rdquo; above.
              </p>
            </div>
            <div className="bg-[var(--paper)] border-t-2 border-[var(--brass)] p-5">
              <CheckCircle2 className="h-6 w-6 text-[var(--brass)] mb-3" />
              <h3 className="font-[var(--font-heading)] text-[16px] text-[var(--ink)]">Track Visits</h3>
              <p className="mt-1.5 text-xs text-[var(--ink-3)]">
                Click &ldquo;Mark Visited&rdquo; on winery pages to record where you&apos;ve been and when.
              </p>
            </div>
            <div className="bg-[var(--paper)] border-t-2 border-[var(--brass)] p-5">
              <Mail className="h-6 w-6 text-[var(--brass)] mb-3" />
              <h3 className="font-[var(--font-heading)] text-[16px] text-[var(--ink)]">Trip Recaps</h3>
              <p className="mt-1.5 text-xs text-[var(--ink-3)]">
                After a saved trip, mark it complete on My Trips to get an email recap of your visit.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/wineries" className="btn-ink">
              Browse Wineries
            </Link>
            <Link href="/itineraries" className="btn-paper">
              Plan a Trip
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
