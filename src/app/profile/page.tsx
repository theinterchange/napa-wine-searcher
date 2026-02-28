import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { favorites, visited, wineries, subRegions } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { WineryCard } from "@/components/directory/WineryCard";
import { SignOutButton } from "@/components/profile/SignOutButton";
import { Heart, MapPin } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile | Wine Country Guide",
  description: "Your Wine Country Guide profile, favorites, and visit history.",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [favoriteWineries, visitedWineries, [{ favCount }], [{ visitCount }]] =
    await Promise.all([
      db
        .select({
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
          heroImageUrl: wineries.heroImageUrl,
          subRegion: subRegions.name,
          valley: subRegions.valley,
          curated: wineries.curated,
        })
        .from(favorites)
        .innerJoin(wineries, eq(favorites.wineryId, wineries.id))
        .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
        .where(eq(favorites.userId, session.user.id)),
      db
        .select({
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
          heroImageUrl: wineries.heroImageUrl,
          subRegion: subRegions.name,
          valley: subRegions.valley,
          curated: wineries.curated,
          visitedDate: visited.visitedDate,
        })
        .from(visited)
        .innerJoin(wineries, eq(visited.wineryId, wineries.id))
        .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
        .where(eq(visited.userId, session.user.id))
        .orderBy(desc(visited.visitedDate)),
      db
        .select({ favCount: count() })
        .from(favorites)
        .where(eq(favorites.userId, session.user.id)),
      db
        .select({ visitCount: count() })
        .from(visited)
        .where(eq(visited.userId, session.user.id)),
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
            <div className="flex items-center gap-4 mt-1 text-sm text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {favCount} {favCount === 1 ? "favorite" : "favorites"}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {visitCount} {visitCount === 1 ? "visit" : "visits"}
              </span>
            </div>
          </div>
        </div>
        <SignOutButton />
      </div>

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
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
            <p className="text-[var(--muted-foreground)]">
              No favorites yet. Browse wineries and tap the heart to save your
              favorites!
            </p>
          </div>
        )}
      </section>

      {/* Visited */}
      <section>
        <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-burgundy-600" />
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
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
            <p className="text-[var(--muted-foreground)]">
              No visits recorded yet. Mark wineries as visited to track your
              wine country journey!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
