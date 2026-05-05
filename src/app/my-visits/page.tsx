import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { visited, wineries, subRegions } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { MapPin } from "lucide-react";
import { WineryCard } from "@/components/directory/WineryCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Visits | Napa Sonoma Guide",
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
        tastingPriceMin: wineries.tastingPriceMin,
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
      <header className="mb-8 pb-5 border-b border-[var(--rule)]">
        <span className="kicker flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-[var(--brass)]" />
          Logbook
        </span>
        <h1 className="editorial-h2 text-[28px] sm:text-[36px] mt-2">
          My <em>visits.</em>
        </h1>
        <p className="mt-3 font-mono text-[11px] tracking-[0.12em] uppercase text-[var(--ink-3)]">
          {total} {total === 1 ? "winery" : "wineries"} visited &middot; {pct}%
          of all wineries
        </p>
      </header>

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
        <div className="card-flat p-12 text-center">
          <MapPin className="mx-auto h-9 w-9 text-[var(--brass)] opacity-70" />
          <p className="mt-4 font-[var(--font-serif-text)] text-[15px] text-[var(--ink-2)] max-w-[50ch] mx-auto">
            No visits yet. Browse wineries and mark the ones you&apos;ve visited.
          </p>
        </div>
      )}
    </div>
  );
}
