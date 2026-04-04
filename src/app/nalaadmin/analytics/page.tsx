import { Suspense } from "react";
import Link from "next/link";
import { MousePointerClick, Wine, Users, UserPlus, Trophy, AlertTriangle, ArrowRight } from "lucide-react";
import {
  getTotalClicks,
  getUniqueWineriesClicked,
  getClicksByType,
  getClickTrend,
  getTopWineries,
  getTopAccommodations,
  getSubscriberStats,
} from "@/lib/analytics-queries";
import { StatCard } from "./components/StatCard";
import { BarChart, formatClickType } from "./components/BarChart";
import { ClickTrendChart } from "./components/ClickTrendChart";
import { DateRangeFilter } from "./components/DateRangeFilter";

function getStartDate(range: string): string | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  return new Date(Date.now() - days * 86400000).toISOString();
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range = "30d" } = await searchParams;
  const startDate = getStartDate(range);
  const rangeLabel =
    range === "all"
      ? "all time"
      : range === "7d"
        ? "last 7 days"
        : range === "90d"
          ? "last 90 days"
          : "last 30 days";

  const [
    totalClicks,
    uniqueWineries,
    clicksByType,
    clickTrend,
    topWineries,
    topAccommodations,
    subscribers,
  ] = await Promise.all([
    getTotalClicks(startDate),
    getUniqueWineriesClicked(startDate),
    getClicksByType(startDate),
    getClickTrend(startDate),
    getTopWineries(startDate, 10),
    getTopAccommodations(startDate, 5),
    getSubscriberStats(startDate),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold">Analytics</h1>
        <Suspense>
          <DateRangeFilter />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          label="Total Clicks"
          value={totalClicks}
          icon={<MousePointerClick className="h-4 w-4" />}
          subtitle={rangeLabel}
        />
        <StatCard
          label="Wineries Clicked"
          value={uniqueWineries}
          icon={<Wine className="h-4 w-4" />}
          subtitle="Unique wineries with clicks"
        />
        <StatCard
          label="Subscribers"
          value={subscribers.total}
          icon={<Users className="h-4 w-4" />}
          subtitle="Total email list"
        />
        <StatCard
          label="New Subscribers"
          value={subscribers.newInPeriod}
          icon={<UserPlus className="h-4 w-4" />}
          subtitle={rangeLabel}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <Link
          href="/nalaadmin/analytics/leaderboard"
          className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 hover:bg-[var(--muted)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-amber-500" />
            <div>
              <h2 className="font-heading text-lg font-bold">Winery Leaderboard</h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                Scores, engagement, hot leads for sponsorship
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5" />
        </Link>
        <Link
          href="/nalaadmin/analytics/content-gaps"
          className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 hover:bg-[var(--muted)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <h2 className="font-heading text-lg font-bold">Content Gaps</h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                Missing data, incomplete listings to improve
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-heading text-lg font-bold mb-4">Click Trend</h2>
          <ClickTrendChart data={clickTrend} />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-heading text-lg font-bold mb-4">
            Clicks by Type
          </h2>
          <BarChart
            data={clicksByType.map((c) => ({
              label: formatClickType(c.clickType),
              value: c.total,
            }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-heading text-lg font-bold mb-4">
            Top Wineries by Clicks
          </h2>
          {topWineries.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] py-4">
              No winery clicks yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[var(--muted-foreground)]">
                    <th className="pb-2 pr-3 font-medium">#</th>
                    <th className="pb-2 pr-3 font-medium">Winery</th>
                    <th className="pb-2 text-right font-medium">Clicks</th>
                    <th className="pb-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {topWineries.map((w, i) => (
                    <tr
                      key={w.wineryId}
                      className="border-b border-[var(--border)] last:border-0"
                    >
                      <td className="py-2 pr-3 text-[var(--muted-foreground)]">
                        {i + 1}
                      </td>
                      <td className="py-2 pr-3">
                        <Link
                          href={`/nalaadmin/analytics/winery/${w.wineryId}`}
                          className="hover:underline font-medium"
                        >
                          {w.name}
                        </Link>
                      </td>
                      <td className="py-2 text-right tabular-nums font-medium">
                        {w.total}
                      </td>
                      <td className="py-2 pl-2">
                        <Link
                          href={`/nalaadmin/analytics/winery/${w.wineryId}`}
                          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        >
                          &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-heading text-lg font-bold mb-4">
            Top Accommodations (Hotel Bookings)
          </h2>
          {topAccommodations.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] py-4">
              No hotel booking clicks yet
            </p>
          ) : (
            <BarChart
              data={topAccommodations.map((a) => ({
                label: a.name,
                value: a.total,
                href: a.slug ? `/where-to-stay/${a.slug}` : undefined,
              }))}
            />
          )}
        </div>
      </div>

      {subscribers.bySource.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 max-w-lg">
          <h2 className="font-heading text-lg font-bold mb-4">
            Subscribers by Source
          </h2>
          <BarChart
            data={subscribers.bySource.map((s) => ({
              label: s.source.charAt(0).toUpperCase() + s.source.slice(1).replace("_", " "),
              value: s.total,
            }))}
          />
        </div>
      )}
    </div>
  );
}
