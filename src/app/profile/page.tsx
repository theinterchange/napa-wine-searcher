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
  tastingPriceMin: wineries.tastingPriceMin,
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 pb-6 border-b border-[var(--rule)]">
        <div className="flex items-center gap-4">
          {session.user.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt=""
              className="h-16 w-16 rounded-full"
            />
          )}
          <div>
            <span className="kicker">Account</span>
            <h1 className="editorial-h2 text-[28px] sm:text-[34px] mt-1">
              {session.user.name}
            </h1>
            {session.user.email && (
              <p className="font-[var(--font-serif-text)] text-[14px] text-[var(--ink-2)] mt-1">
                {session.user.email}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 font-mono text-[11px] tracking-[0.12em] uppercase text-[var(--ink-3)] flex-wrap">
              <span className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-[var(--brass)]" />
                {favCount} {favCount === 1 ? "favorite" : "favorites"}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[var(--brass)]" />
                {visitCount} {visitCount === 1 ? "visit" : "visits"}
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-[var(--brass)]" />
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
        <section className="card-flat mb-10 p-6">
          <span className="kicker flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[var(--brass)]" />
            Getting started
          </span>
          <h2 className="editorial-h2 text-[22px] sm:text-[26px] mt-2 mb-3">
            Welcome to Napa Sonoma <em>Guide.</em>
          </h2>
          <p className="font-[var(--font-serif-text)] text-[15px] text-[var(--ink-2)] mb-5">
            A few things to try first:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/wineries"
              className="flex items-center gap-3 bg-[var(--paper)] border-t-2 border-[var(--rule)] hover:border-[var(--brass)] p-3 transition-colors"
            >
              <Heart className="h-5 w-5 text-[var(--brass)] shrink-0" />
              <div>
                <p className="font-[var(--font-heading)] text-[15px] text-[var(--ink)]">Browse wineries</p>
                <p className="text-xs text-[var(--ink-3)]">
                  Add your favorites
                </p>
              </div>
            </Link>
            <Link
              href="/itineraries"
              className="flex items-center gap-3 bg-[var(--paper)] border-t-2 border-[var(--rule)] hover:border-[var(--brass)] p-3 transition-colors"
            >
              <Route className="h-5 w-5 text-[var(--brass)] shrink-0" />
              <div>
                <p className="font-[var(--font-heading)] text-[15px] text-[var(--ink)]">Plan your first trip</p>
                <p className="text-xs text-[var(--ink-3)]">
                  Build a winery route
                </p>
              </div>
            </Link>
            <Link
              href="/journal"
              className="flex items-center gap-3 bg-[var(--paper)] border-t-2 border-[var(--rule)] hover:border-[var(--brass)] p-3 transition-colors"
            >
              <BookOpen className="h-5 w-5 text-[var(--brass)] shrink-0" />
              <div>
                <p className="font-[var(--font-heading)] text-[15px] text-[var(--ink)]">Start a journal entry</p>
                <p className="text-xs text-[var(--ink-3)]">
                  Log wines you&apos;ve tasted
                </p>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Favorites */}
      <section className="mb-12">
        <h2 className="editorial-h2 text-[22px] sm:text-[26px] mb-5 flex items-center gap-2">
          <Heart className="h-5 w-5 text-[var(--brass)]" />
          Favorites
        </h2>
        {favoriteWineries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteWineries.map((w) => (
              <WineryCard key={w.id} winery={w} />
            ))}
          </div>
        ) : (
          <EmptySection icon={Heart} message="No favorites yet. Browse wineries and tap the heart to save your favorites." actionLabel="Browse Wineries" actionHref="/wineries" />
        )}
      </section>

      {/* Visited */}
      <section className="mb-12">
        <h2 className="editorial-h2 text-[22px] sm:text-[26px] mb-5 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[var(--brass)]" />
          Visited
        </h2>
        {visitedWineries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visitedWineries.map((w) => (
              <div key={w.id} className="relative">
                <WineryCard winery={w} />
                {w.visitedDate && (
                  <span className="absolute top-3 left-3 z-20 bg-[var(--ink)] px-2 py-1 font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--paper)]">
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
          <EmptySection icon={MapPin} message="No visits recorded yet. Mark wineries as visited to track your wine country journey." actionLabel="Browse Wineries" actionHref="/wineries" />
        )}
      </section>

      {/* Recent Journal Entries */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="editorial-h2 text-[22px] sm:text-[26px] flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[var(--brass)]" />
            Wine Journal
          </h2>
          {recentJournal.length > 0 && (
            <Link
              href="/journal"
              className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
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
                className="bg-[var(--paper-2)] border-t-2 border-[var(--rule)] p-4"
              >
                <h3 className="font-[var(--font-heading)] text-[16px] leading-tight text-[var(--ink)] truncate">
                  {entry.wineName}
                  {entry.vintage && (
                    <span className="text-[var(--ink-3)] ml-1">
                      ({entry.vintage})
                    </span>
                  )}
                </h3>
                {entry.wineryName && (
                  <p className="text-sm text-[var(--ink-2)] mt-0.5 truncate">
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
                              ? "fill-[var(--brass)] text-[var(--brass)]"
                              : "text-[var(--rule)]"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase text-[var(--ink-3)]">
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
        <div className="flex items-center justify-between mb-5">
          <h2 className="editorial-h2 text-[22px] sm:text-[26px] flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-[var(--brass)]" />
            Collections
          </h2>
          {userCollections.length > 0 && (
            <Link
              href="/collections"
              className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
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
                className="bg-[var(--paper-2)] border-t-2 border-[var(--rule)] hover:border-[var(--brass)] p-4 transition-colors"
              >
                <h3 className="font-[var(--font-heading)] text-[17px] leading-tight text-[var(--ink)]">{col.name}</h3>
                <p className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[var(--ink-3)] mt-2">
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
        <div className="flex items-center justify-between mb-5">
          <h2 className="editorial-h2 text-[22px] sm:text-[26px] flex items-center gap-2">
            <Route className="h-5 w-5 text-[var(--brass)]" />
            Saved Trips
          </h2>
          {userTrips.length > 0 && (
            <Link
              href="/my-trips"
              className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
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
                className="bg-[var(--paper-2)] border-t-2 border-[var(--rule)] hover:border-[var(--brass)] p-4 transition-colors"
              >
                <h3 className="font-[var(--font-heading)] text-[17px] leading-tight text-[var(--ink)]">{trip.name}</h3>
                <p className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[var(--ink-3)] mt-2">
                  {new Date(trip.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptySection icon={Route} message="No saved trips yet. Use the trip planner to create and save routes." actionLabel="Plan a Trip" actionHref="/itineraries" />
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
    <div className="card-flat p-8 text-center">
      {Icon && <Icon className="mx-auto h-7 w-7 text-[var(--brass)] opacity-70 mb-3" />}
      <p className="font-[var(--font-serif-text)] text-[15px] text-[var(--ink-2)]">{message}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-ink mt-5 inline-flex">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
