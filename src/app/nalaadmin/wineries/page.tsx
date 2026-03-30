import { db } from "@/db";
import { wineries, subRegions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { WineryTable } from "./WineryTable";

export default async function AdminWineriesPage() {
  const allWineries = await db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      city: wineries.city,
      subRegion: subRegions.name,
      valley: subRegions.valley,
      googleRating: wineries.googleRating,
      totalRatings: wineries.totalRatings,
      priceLevel: wineries.priceLevel,
      curated: wineries.curated,
      curatedAt: wineries.curatedAt,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .orderBy(wineries.name);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-bold">Wineries</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {allWineries.filter((w) => w.curated).length} curated /{" "}
          {allWineries.length} total
        </p>
      </div>
      <WineryTable wineries={allWineries} />
    </div>
  );
}
