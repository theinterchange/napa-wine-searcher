import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  favorites,
  visited,
  wineJournalEntries,
  savedTrips,
  collections,
  collectionItems,
  wineries,
  subRegions,
} from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { WineryCard } from "@/components/directory/WineryCard";
import { SignOutButton } from "@/components/profile/SignOutButton";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import {
  Heart,
  MapPin,
  BookOpen,
  Route,
  FolderOpen,
  Star,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile | Napa Sonoma Guide",
  description:
    "Your Napa Sonoma Guide profile, favorites, and visit history.",
};

// Shared winery select shape
const winerySelect = {
  id: wineries.id,
  slug: wineries.slug,
  name: wineries.name,
  shortDescription: wineries.shortDescription,
  city: wineries.city,
  priceLevel: wineries.priceLevel,
  aggregateRating: wineries.aggregateRating,
  totalRatings: wineries.totalRatings,
  reservationRequired: wineries.reservationRequired,
  dogFriendly: wineries.dogFriendly,
  picnicFriendly: wineries.picnicFriendly,
  kidFriendly: wineries.kidFriendly,
  kidFriendlyConfidence: wineries.kidFriendlyConfidence,
  heroImageUrl: wineries.heroImageUrl,
  subRegion: subRegions.name,
  valley: subRegions.valley,
  curated: wineries.curated,
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [
    favoriteWineries,
    visitedWineries,
    recentJournal,
    userCollections,
    userTrips,
    [{ favCount }],
    [{ visitCount }],
    [{ journalCount }],
  ] = await Promise.all([
    db
      .select(winerySelect)
      .from(favorites)
      .innerJoin(wineries, eq(favorites.wineryId, wineries.id))
      .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
      .where(eq(favorites.userId, session.user.id)),
    db
      .select({
        ...winerySelect,
        visitedDate: visited.visitedDate,
      })
      .from(visited)
      .innerJoin(wineries, eq(visited.wineryId, wineries.id))
      .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
      .where(eq(visited.userId, session.user.id))
      .orderBy(desc(visited.visitedDate)),
    db
      .select()
      .from(wineJournalEntries)
      .where(eq(wineJournalEntries.userId, session.user.id))
      .orderBy(desc(wineJournalEntries.dateTried))
      .limit(6),
    db
      .select({
        id: collections.id,
        name: collections.name,
        itemCount: count(collectionItems.wineryId),
      })
      .from(collections)
      .leftJoin(
        collectionItems,
        eq(collections.id, collectionItems.collectionId)
      )
      .where(eq(collections.userId, session.user.id))
      .groupBy(collections.id)
      .orderBy(desc(collections.createdAt))
      .limit(6),
    db
      .select()
      .from(savedTrips)
      .where(eq(savedTrips.userId, session.user.id))
      .orderBy(desc(savedTrips.createdAt))
      .limit(6),
    db
      .select({ favCount: count() })
      .from(favorites)
      .where(eq(favorites.userId, session.user.id)),
    db
      .select({ visitCount: count() })
      .from(visited)
      .where(eq(visited.userId, session.user.id)),
    db
      .select({ journalCount: count() })
      .from(wineJournalEntries)
      .where(eq(wineJournalEntries.userId, session.user.id)),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          {session.user.image && (
            <img
              src={session.user.image}
              alt=""
              className="h-16 w-16 rounded-full"
            />
          )}
          <div>
            <h1 className="font-heading text-2xl font-bold">
              {session.user.name}
            </h1>
            {session.user.email && (
              <p className="text-sm text-[var(--muted-foreground)]">
                {session.user.email}
              </p>
            )}
            <div className="flex items-center gap-4 mt-1 text-sm text-[var(--muted-foreground)] flex-wrap">
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {favCount} {favCount === 1 ? "favorite" : "favorites"}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {visitCount} {visitCount === 1 ? "visit" : "visits"}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {journalCount} {journalCount === 1 ? "wine" : "wines"} logged
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <ProfileSettings />
          <SignOutButton />
        </div>
      </div>

      {/* Getting Started — shown for new users with no activity */}
      {favCount === 0 && visitCount === 0 && journalCount === 0 && (
        <section className="mb-10 rounded-xl border border-burgundy-200 dark:border-burgundy-800 bg-burgundy-50 dark:bg-burgundy-950/50 p-6">
          <h2 className="font-heading text-lg font-bold flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-gold-500" />
            Getting Started
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Welcome to Napa Sonoma Guide! Here are a few things to try:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/wineries"
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 hover:border-burgundy-400 dark:hover:border-burgundy-600 transition-colors"
            >
              <Heart className="h-5 w-5 text-burgundy-600 shrink-0" />
              <div>
                <p className="text-sm font-medium">Browse wineries</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Add your favorites
                </p>
              </div>
            </Link>
            <Link
              href="/plan-trip"
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 hover:border-burgundy-400 dark:hover:border-burgundy-600 transition-colors"
            >
              <Route className="h-5 w-5 text-burgundy-600 shrink-0" />
              <div>
                <p className="text-sm font-medium">Plan your first trip</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Build a winery route
                </p>
              </div>
            </Link>
            <Link
              href="/journal"
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 hover:border-burgundy-400 dark:hover:border-burgundy-600 transition-colors"
            >
              <BookOpen className="h-5 w-5 text-burgundy-600 shrink-0" />
              <div>
                <p className="text-sm font-medium">Start a journal entry</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Log wines you&apos;ve tasted
                </p>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Favorites */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
          <Heart className="h-5 w-5 text-burgundy-600" />
          Favorites
        </h2>
        {favoriteWineries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteWineries.map((w) => (
              <WineryCard key={w.id} winery={w} />
            ))}
          </div>
        ) : (
          <EmptySection icon={Heart} message="No favorites yet. Browse wineries and tap the heart to save your favorites!" actionLabel="Browse Wineries" actionHref="/wineries" />
        )}
      </section>

      {/* Visited */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-emerald-600" />
          Visited
        </h2>
        {visitedWineries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visitedWineries.map((w) => (
              <div key={w.id} className="relative">
                <WineryCard winery={w} />
                {w.visitedDate && (
                  <span className="absolute top-2 left-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                    Visited{" "}
                    {new Date(w.visitedDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptySection icon={MapPin} message="No visits recorded yet. Mark wineries as visited to track your wine country journey!" actionLabel="Browse Wineries" actionHref="/wineries" />
        )}
      </section>

      {/* Recent Journal Entries */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-burgundy-600" />
            Wine Journal
          </h2>
          {recentJournal.length > 0 && (
            <Link
              href="/journal"
              className="text-sm text-burgundy-700 dark:text-burgundy-400 hover:underline"
            >
              View All
            </Link>
          )}
        </div>
        {recentJournal.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentJournal.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <h3 className="font-medium truncate">
                  {entry.wineName}
                  {entry.vintage && (
                    <span className="text-[var(--muted-foreground)] ml-1">
                      ({entry.vintage})
                    </span>
                  )}
                </h3>
                {entry.wineryName && (
                  <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                    {entry.wineryName}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {entry.rating && (
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${
                            s <= entry.rating!
                              ? "fill-gold-500 text-gold-500"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {new Date(entry.dateTried).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptySection icon={BookOpen} message='No wines logged yet. Visit a winery page and click "Log Wine" to start your journal.' actionLabel="Browse Wineries" actionHref="/wineries" />
        )}
      </section>

      {/* Collections */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-burgundy-600" />
            Collections
          </h2>
          {userCollections.length > 0 && (
            <Link
              href="/collections"
              className="text-sm text-burgundy-700 dark:text-burgundy-400 hover:underline"
            >
              View All
            </Link>
          )}
        </div>
        {userCollections.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userCollections.map((col) => (
              <Link
                key={col.id}
                href={`/collections/${col.id}`}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 hover:border-burgundy-400 dark:hover:border-burgundy-600 transition-colors"
              >
                <h3 className="font-medium">{col.name}</h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  {col.itemCount}{" "}
                  {col.itemCount === 1 ? "winery" : "wineries"}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptySection icon={FolderOpen} message='No collections yet. Use "Add to List" on winery pages to create collections.' actionLabel="Browse Wineries" actionHref="/wineries" />
        )}
      </section>

      {/* Saved Trips */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold flex items-center gap-2">
            <Route className="h-5 w-5 text-burgundy-600" />
            Saved Trips
          </h2>
          {userTrips.length > 0 && (
            <Link
              href="/my-trips"
              className="text-sm text-burgundy-700 dark:text-burgundy-400 hover:underline"
            >
              View All
            </Link>
          )}
        </div>
        {userTrips.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userTrips.map((trip) => (
              <Link
                key={trip.id}
                href="/my-trips"
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 hover:border-burgundy-400 dark:hover:border-burgundy-600 transition-colors"
              >
                <h3 className="font-medium">{trip.name}</h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  {new Date(trip.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptySection icon={Route} message="No saved trips yet. Use the trip planner to create and save routes." actionLabel="Plan a Trip" actionHref="/plan-trip" />
        )}
      </section>
    </div>
  );
}

function EmptySection({ icon: Icon, message, actionLabel, actionHref }: {
  icon?: React.ComponentType<{ className?: string }>;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
      {Icon && <Icon className="mx-auto h-8 w-8 text-[var(--muted-foreground)] opacity-50 mb-3" />}
      <p className="text-[var(--muted-foreground)]">{message}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-3 inline-block rounded-lg bg-burgundy-700 px-4 py-2 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
