import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { wineJournalEntries } from "@/db/schema";
import { eq, desc, count, avg } from "drizzle-orm";
import { BookOpen, Star } from "lucide-react";
import { JournalEntryCard } from "@/components/journal/JournalEntryCard";
import { JournalActions } from "@/components/journal/JournalActions";
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

  const [entries, [{ total }], [{ avgRating }]] = await Promise.all([
    db
      .select()
      .from(wineJournalEntries)
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
            {avgRating && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
                {parseFloat(String(avgRating)).toFixed(1)} avg rating
              </span>
            )}
          </div>
        </div>
        <JournalActions />
      </div>

      {entries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((entry) => (
            <JournalEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-[var(--muted-foreground)] opacity-50" />
          <h2 className="mt-4 font-heading text-lg font-semibold">
            No wines logged yet
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)] max-w-md mx-auto">
            Visit a winery page and click &ldquo;Log Wine&rdquo; or use the
            &ldquo;Tried it&rdquo; button next to any wine to start your journal.
          </p>
          <Link
            href="/wineries"
            className="mt-4 inline-block rounded-lg bg-burgundy-700 px-4 py-2 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors"
          >
            Browse Wineries
          </Link>
        </div>
      )}
    </div>
  );
}
