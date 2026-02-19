import { db } from "@/db";
import { wineries, subRegions, wines, wineTypes, tastingExperiences } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { Star, MapPin, Wine as WineIcon, Clock, Share2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { ShareCompareButton } from "@/components/compare/ShareCompareButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Wineries | Wine Country Guide",
  description: "Compare wineries side-by-side to plan your wine country visit.",
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const idsParam = params.ids || "";
  const ids = idsParam
    .split(",")
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n))
    .slice(0, 4);

  if (ids.length < 2) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <h1 className="font-heading text-3xl font-bold">Compare Wineries</h1>
        <p className="mt-4 text-[var(--muted-foreground)] max-w-md mx-auto">
          Select 2-4 wineries to compare side-by-side. Add wineries from the
          directory or map, then visit this page with their IDs.
        </p>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Example: /compare?ids=1,5,23
        </p>
      </div>
    );
  }

  const compareWineries = await db
    .select({
      id: wineries.id,
      name: wineries.name,
      slug: wineries.slug,
      shortDescription: wineries.shortDescription,
      city: wineries.city,
      priceLevel: wineries.priceLevel,
      aggregateRating: wineries.aggregateRating,
      totalRatings: wineries.totalRatings,
      reservationRequired: wineries.reservationRequired,
      dogFriendly: wineries.dogFriendly,
      picnicFriendly: wineries.picnicFriendly,
      websiteUrl: wineries.websiteUrl,
      subRegion: subRegions.name,
      valley: subRegions.valley,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(inArray(wineries.id, ids));

  // Fetch wines and tastings for each
  const wineryWines = await db
    .select({
      id: wines.id,
      wineryId: wines.wineryId,
      name: wines.name,
      price: wines.price,
      rating: wines.rating,
      wineType: wineTypes.name,
    })
    .from(wines)
    .leftJoin(wineTypes, eq(wines.wineTypeId, wineTypes.id))
    .where(inArray(wines.wineryId, ids));

  const wineryTastings = await db
    .select()
    .from(tastingExperiences)
    .where(inArray(tastingExperiences.wineryId, ids));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold">Compare Wineries</h1>
        <ShareCompareButton ids={ids} />
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid gap-4 min-w-[640px]"
          style={{
            gridTemplateColumns: `200px repeat(${compareWineries.length}, 1fr)`,
          }}
        >
          {/* Header Row */}
          <div />
          {compareWineries.map((w) => (
            <div
              key={w.id}
              className="rounded-t-xl border border-[var(--border)] bg-burgundy-900 dark:bg-burgundy-950 p-4 text-white text-center"
            >
              <h2 className="font-heading text-lg font-semibold">{w.name}</h2>
              <p className="text-sm text-burgundy-300 mt-1">
                {w.subRegion}
              </p>
            </div>
          ))}

          {/* Rating */}
          <div className="flex items-center p-3 font-medium text-sm bg-[var(--muted)] rounded-l-lg">
            Rating
          </div>
          {compareWineries.map((w) => (
            <div key={w.id} className="flex items-center justify-center p-3 border-x border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-gold-500 text-gold-500" />
                <span className="font-semibold">{w.aggregateRating?.toFixed(1)}</span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  ({w.totalRatings})
                </span>
              </div>
            </div>
          ))}

          {/* Price Level */}
          <div className="flex items-center p-3 font-medium text-sm bg-[var(--muted)] rounded-l-lg">
            Price Level
          </div>
          {compareWineries.map((w) => (
            <div key={w.id} className="flex items-center justify-center p-3 border-x border-[var(--border)] bg-[var(--card)]">
              {"$".repeat(w.priceLevel || 2)}
            </div>
          ))}

          {/* Location */}
          <div className="flex items-center p-3 font-medium text-sm bg-[var(--muted)] rounded-l-lg">
            Location
          </div>
          {compareWineries.map((w) => (
            <div key={w.id} className="flex items-center justify-center p-3 text-sm text-center border-x border-[var(--border)] bg-[var(--card)]">
              {w.city} · {w.valley === "napa" ? "Napa" : "Sonoma"}
            </div>
          ))}

          {/* Reservation */}
          <div className="flex items-center p-3 font-medium text-sm bg-[var(--muted)] rounded-l-lg">
            Walk-ins
          </div>
          {compareWineries.map((w) => (
            <div key={w.id} className="flex items-center justify-center p-3 text-sm border-x border-[var(--border)] bg-[var(--card)]">
              {w.reservationRequired ? "Reservation Required" : "Walk-ins Welcome"}
            </div>
          ))}

          {/* Dog Friendly */}
          <div className="flex items-center p-3 font-medium text-sm bg-[var(--muted)] rounded-l-lg">
            Dog Friendly
          </div>
          {compareWineries.map((w) => (
            <div key={w.id} className="flex items-center justify-center p-3 text-sm border-x border-[var(--border)] bg-[var(--card)]">
              {w.dogFriendly ? "Yes" : "No"}
            </div>
          ))}

          {/* Picnic */}
          <div className="flex items-center p-3 font-medium text-sm bg-[var(--muted)] rounded-l-lg">
            Picnic Friendly
          </div>
          {compareWineries.map((w) => (
            <div key={w.id} className="flex items-center justify-center p-3 text-sm border-x border-[var(--border)] bg-[var(--card)]">
              {w.picnicFriendly ? "Yes" : "No"}
            </div>
          ))}

          {/* Wines */}
          <div className="flex items-center p-3 font-medium text-sm bg-[var(--muted)] rounded-l-lg">
            Wines
          </div>
          {compareWineries.map((w) => {
            const ww = wineryWines.filter((wine) => wine.wineryId === w.id);
            return (
              <div key={w.id} className="p-3 text-sm border-x border-[var(--border)] bg-[var(--card)]">
                <ul className="space-y-1">
                  {ww.map((wine) => (
                    <li key={wine.id} className="flex justify-between">
                      <span className="truncate">{wine.name}</span>
                      <span className="shrink-0 ml-2 text-[var(--muted-foreground)]">
                        {wine.price ? formatPrice(wine.price) : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* Tastings */}
          <div className="flex items-center p-3 font-medium text-sm bg-[var(--muted)] rounded-l-lg">
            Tastings
          </div>
          {compareWineries.map((w) => {
            const tt = wineryTastings.filter((t) => t.wineryId === w.id);
            return (
              <div key={w.id} className="p-3 text-sm border-x border-b border-[var(--border)] bg-[var(--card)] rounded-b-xl">
                <ul className="space-y-2">
                  {tt.map((t) => (
                    <li key={t.id}>
                      <div className="flex justify-between">
                        <span className="font-medium">{t.name}</span>
                        <span className="text-burgundy-700 dark:text-burgundy-400">
                          {t.price ? formatPrice(t.price) : "—"}
                        </span>
                      </div>
                      {t.durationMinutes && (
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {t.durationMinutes} min
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
