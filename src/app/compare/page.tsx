import { db } from "@/db";
import { wineries, subRegions, wines, wineTypes, tastingExperiences } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { Star, MapPin } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { ShareCompareButton } from "@/components/compare/ShareCompareButton";
import { CompareManager } from "@/components/compare/CompareManager";
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

  // Fetch all wineries for the search/add dropdown
  const allWineries = await db
    .select({ id: wineries.id, name: wineries.name })
    .from(wineries)
    .orderBy(wineries.name);

  if (ids.length < 2) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-heading text-3xl font-bold mb-6">Compare Wineries</h1>
        <CompareManager currentIds={ids} allWineries={allWineries} />
        <p className="mt-6 text-sm text-[var(--muted-foreground)] text-center">
          Select at least 2 wineries to compare side-by-side.
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

  const wineryWines = await db
    .select({
      id: wines.id,
      wineryId: wines.wineryId,
      name: wines.name,
      price: wines.price,
      wineType: wineTypes.name,
    })
    .from(wines)
    .leftJoin(wineTypes, eq(wines.wineTypeId, wineTypes.id))
    .where(inArray(wines.wineryId, ids));

  const wineryTastings = await db
    .select()
    .from(tastingExperiences)
    .where(inArray(tastingExperiences.wineryId, ids));

  const rows: { label: string; render: (w: typeof compareWineries[number]) => React.ReactNode }[] = [
    {
      label: "Rating",
      render: (w) => (
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-gold-500 text-gold-500" />
          <span className="font-semibold">{w.aggregateRating?.toFixed(1)}</span>
          <span className="text-xs text-[var(--muted-foreground)]">({w.totalRatings})</span>
        </div>
      ),
    },
    {
      label: "Price Level",
      render: (w) => <span>{"$".repeat(w.priceLevel || 2)}</span>,
    },
    {
      label: "Location",
      render: (w) => (
        <span className="text-sm">
          {w.city} · {w.valley === "napa" ? "Napa" : "Sonoma"}
        </span>
      ),
    },
    {
      label: "Walk-ins",
      render: (w) => (
        <span className="text-sm">{w.reservationRequired ? "Reservation Required" : "Walk-ins Welcome"}</span>
      ),
    },
    {
      label: "Dog Friendly",
      render: (w) => <span className="text-sm">{w.dogFriendly ? "Yes" : "No"}</span>,
    },
    {
      label: "Picnic Friendly",
      render: (w) => <span className="text-sm">{w.picnicFriendly ? "Yes" : "No"}</span>,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-bold">Compare Wineries</h1>
        <ShareCompareButton ids={ids} />
      </div>

      <div className="mb-8">
        <CompareManager currentIds={ids} allWineries={allWineries} />
      </div>

      {/* Desktop: grid table */}
      <div className="hidden md:block overflow-x-auto">
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
              <p className="text-sm text-burgundy-300 mt-1">{w.subRegion}</p>
            </div>
          ))}

          {rows.map(({ label, render }) => (
            <div key={label} className="contents">
              <div className="flex items-center p-3 font-medium text-sm bg-[var(--muted)] rounded-l-lg">
                {label}
              </div>
              {compareWineries.map((w) => (
                <div key={w.id} className="flex items-center justify-center p-3 border-x border-[var(--border)] bg-[var(--card)]">
                  {render(w)}
                </div>
              ))}
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
                  {ww.length === 0 && (
                    <li className="text-[var(--muted-foreground)]">—</li>
                  )}
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
                  {tt.length === 0 && (
                    <li className="text-[var(--muted-foreground)]">—</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-6">
        {compareWineries.map((w) => {
          const ww = wineryWines.filter((wine) => wine.wineryId === w.id);
          const tt = wineryTastings.filter((t) => t.wineryId === w.id);
          return (
            <div
              key={w.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden"
            >
              <div className="bg-burgundy-900 dark:bg-burgundy-950 p-4 text-white">
                <h2 className="font-heading text-lg font-semibold">{w.name}</h2>
                <p className="text-sm text-burgundy-300 mt-1">{w.subRegion}</p>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {rows.map(({ label, render }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-medium text-[var(--muted-foreground)]">{label}</span>
                    {render(w)}
                  </div>
                ))}
                {ww.length > 0 && (
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium text-[var(--muted-foreground)] mb-2">Wines</p>
                    <ul className="space-y-1 text-sm">
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
                )}
                {tt.length > 0 && (
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium text-[var(--muted-foreground)] mb-2">Tastings</p>
                    <ul className="space-y-2 text-sm">
                      {tt.map((t) => (
                        <li key={t.id}>
                          <div className="flex justify-between">
                            <span className="font-medium">{t.name}</span>
                            <span className="text-burgundy-700 dark:text-burgundy-400">
                              {t.price ? formatPrice(t.price) : "—"}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
