import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { visited, wineries, subRegions } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { WineryCard } from "@/components/directory/WineryCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Visits | Wine Country Guide",
  description: "Wineries you've visited in Napa and Sonoma Valleys.",
};

export default async function MyVisitsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [visitedWineries, [{ total }], [{ allWineries }]] = await Promise.all([
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
        kidFriendly: wineries.kidFriendly,
        kidFriendlyConfidence: wineries.kidFriendlyConfidence,
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
    db.select({ total: count() }).from(visited).where(eq(visited.userId, session.user.id)),
    db.select({ allWineries: count() }).from(wineries),
  ]);

  const pct = allWineries > 0 ? Math.round((total / allWineries) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">My Visits</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          {total} {total === 1 ? "winery" : "wineries"} visited &middot; {pct}%
          of all wineries
        </p>
      </div>

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
        <div className="text-center py-16">
          <p className="text-lg text-[var(--muted-foreground)]">
            No visits yet. Browse wineries and mark the ones you&apos;ve
            visited!
          </p>
        </div>
      )}
    </div>
  );
}
