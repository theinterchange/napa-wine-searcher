import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  wineries,
  outboundClicks,
  savedTripStops,
  anonymousTripStops,
  dayTripStops,
  itineraryAnalyticsEvents,
} from "@/db/schema";

/**
 * Planner Impact dashboard. Per winery, surfaces:
 *   - tripCount         user trips that include this winery (saved + anon)
 *   - curatedFeatures   curated trip stops that feature this winery
 *   - plannerClicks     outbound clicks from the trip planner surface
 *   - swapsOut          times a user swapped this winery OUT of their trip
 *
 * 25-trip threshold (per plan) before tripCount is surfaced — protects
 * against single-user signal until volume builds. Sortable by trip count
 * (default) or planner clicks via ?sort=clicks.
 */

interface ImpactRow {
  wineryId: number;
  slug: string;
  name: string;
  city: string | null;
  tripCount: number;
  curatedFeatures: number;
  plannerClicks: number;
  swapsOut: number;
}

const TRIP_COUNT_THRESHOLD = 25;
const PAGE_SIZE = 60;

async function loadImpact(): Promise<ImpactRow[]> {
  // User-trip stops (saved + anonymous), grouped by winery
  const savedAgg = await db
    .select({
      wineryId: savedTripStops.wineryId,
      n: sql<number>`count(*)`.as("n"),
    })
    .from(savedTripStops)
    .groupBy(savedTripStops.wineryId);

  const anonAgg = await db
    .select({
      wineryId: anonymousTripStops.wineryId,
      n: sql<number>`count(*)`.as("n"),
    })
    .from(anonymousTripStops)
    .groupBy(anonymousTripStops.wineryId);

  // Curated stops grouped by winery
  const curatedAgg = await db
    .select({
      wineryId: dayTripStops.wineryId,
      n: sql<number>`count(*)`.as("n"),
    })
    .from(dayTripStops)
    .groupBy(dayTripStops.wineryId);

  // Outbound clicks attributed to trip-planner surfaces
  const clickAgg = await db
    .select({
      wineryId: outboundClicks.wineryId,
      n: sql<number>`count(*)`.as("n"),
    })
    .from(outboundClicks)
    .where(sql`${outboundClicks.sourceComponent} LIKE 'trip_%'`)
    .groupBy(outboundClicks.wineryId);

  // stop_swapped events keyed by the winery that was swapped OUT
  const swapAgg = await db
    .select({
      wineryId: sql<number>`CAST(json_extract(${itineraryAnalyticsEvents.payloadJson}, '$.fromWineryId') AS INTEGER)`.as(
        "winery_id"
      ),
      n: sql<number>`count(*)`.as("n"),
    })
    .from(itineraryAnalyticsEvents)
    .where(sql`${itineraryAnalyticsEvents.eventName} = 'stop_swapped'`)
    .groupBy(
      sql`json_extract(${itineraryAnalyticsEvents.payloadJson}, '$.fromWineryId')`
    );

  const wineryRows = await db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      city: wineries.city,
    })
    .from(wineries);

  const tripMap = new Map<number, number>();
  for (const r of savedAgg) {
    if (r.wineryId == null) continue;
    tripMap.set(r.wineryId, (tripMap.get(r.wineryId) ?? 0) + Number(r.n));
  }
  for (const r of anonAgg) {
    if (r.wineryId == null) continue;
    tripMap.set(r.wineryId, (tripMap.get(r.wineryId) ?? 0) + Number(r.n));
  }
  const curatedMap = new Map(curatedAgg.map((r) => [r.wineryId, Number(r.n)]));
  const clickMap = new Map<number, number>();
  for (const r of clickAgg) {
    if (r.wineryId == null) continue;
    clickMap.set(r.wineryId, Number(r.n));
  }
  const swapMap = new Map<number, number>();
  for (const r of swapAgg) {
    if (r.wineryId == null) continue;
    swapMap.set(Number(r.wineryId), Number(r.n));
  }

  return wineryRows.map((w) => ({
    wineryId: w.id,
    slug: w.slug,
    name: w.name,
    city: w.city,
    tripCount: tripMap.get(w.id) ?? 0,
    curatedFeatures: curatedMap.get(w.id) ?? 0,
    plannerClicks: clickMap.get(w.id) ?? 0,
    swapsOut: swapMap.get(w.id) ?? 0,
  }));
}

export default async function PlannerImpactPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort = "trips" } = await searchParams;
  const rows = await loadImpact();

  const compare = (a: ImpactRow, b: ImpactRow) => {
    if (sort === "clicks") return b.plannerClicks - a.plannerClicks;
    if (sort === "curated") return b.curatedFeatures - a.curatedFeatures;
    if (sort === "swaps") return b.swapsOut - a.swapsOut;
    return b.tripCount - a.tripCount;
  };
  const sorted = [...rows].sort(compare).slice(0, PAGE_SIZE);

  const totals = rows.reduce(
    (acc, r) => ({
      tripCount: acc.tripCount + r.tripCount,
      plannerClicks: acc.plannerClicks + r.plannerClicks,
      curatedFeatures: acc.curatedFeatures + r.curatedFeatures,
      swapsOut: acc.swapsOut + r.swapsOut,
      featuredWineries:
        acc.featuredWineries + (r.curatedFeatures > 0 ? 1 : 0),
    }),
    {
      tripCount: 0,
      plannerClicks: 0,
      curatedFeatures: 0,
      swapsOut: 0,
      featuredWineries: 0,
    }
  );

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-2">Planner Impact</h1>
      <p className="mb-6 max-w-2xl text-sm text-[var(--muted-foreground)]">
        Per-winery exposure and engagement on the trip planner. Use this to
        size sponsorship pitches and spot wineries that get swapped out
        often (a fit-mismatch signal). Counts below the {TRIP_COUNT_THRESHOLD}-trip
        threshold are shown but flagged as low-volume.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Trip-stop instances" value={totals.tripCount} />
        <Stat label="Planner clicks" value={totals.plannerClicks} />
        <Stat label="Wineries in curated trips" value={totals.featuredWineries} />
        <Stat label="Total swap-outs" value={totals.swapsOut} />
      </div>

      <nav className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[var(--muted-foreground)]">Sort by</span>
        <SortChip current={sort} value="trips" label="Trips" />
        <SortChip current={sort} value="clicks" label="Planner clicks" />
        <SortChip current={sort} value="curated" label="Curated features" />
        <SortChip current={sort} value="swaps" label="Swaps out" />
      </nav>

      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--muted)]/50 text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
            <tr>
              <th className="px-4 py-2 text-left">Winery</th>
              <th className="px-4 py-2 text-right">Trips</th>
              <th className="px-4 py-2 text-right">Curated</th>
              <th className="px-4 py-2 text-right">Planner clicks</th>
              <th className="px-4 py-2 text-right">Swaps out</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const lowVolume = r.tripCount < TRIP_COUNT_THRESHOLD;
              return (
                <tr
                  key={r.wineryId}
                  className="border-t border-[var(--border)]"
                >
                  <td className="px-4 py-2">
                    <Link
                      href={`/wineries/${r.slug}`}
                      className="font-medium text-[var(--foreground)] hover:underline"
                    >
                      {r.name}
                    </Link>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {r.city ?? ""}
                    </div>
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-mono ${
                      lowVolume
                        ? "text-[var(--muted-foreground)]"
                        : "text-[var(--foreground)]"
                    }`}
                  >
                    {r.tripCount}
                    {lowVolume && r.tripCount > 0 && (
                      <span className="ml-1 text-[10px] uppercase">low</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {r.curatedFeatures}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {r.plannerClicks}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {r.swapsOut}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sorted.length === PAGE_SIZE && (
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          Showing top {PAGE_SIZE}. Sort or filter to see more.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="text-xs text-[var(--muted-foreground)]">{label}</div>
      <div className="mt-1 text-2xl font-bold">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function SortChip({
  current,
  value,
  label,
}: {
  current: string;
  value: string;
  label: string;
}) {
  const active = current === value;
  return (
    <Link
      href={`/nalaadmin/planner-impact?sort=${value}`}
      className={`rounded-full border px-3 py-1 transition-colors ${
        active
          ? "border-burgundy-900 bg-burgundy-900 text-white"
          : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-burgundy-900"
      }`}
    >
      {label}
    </Link>
  );
}
