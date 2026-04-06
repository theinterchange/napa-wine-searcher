import { Suspense } from "react";
import Link from "next/link";
import {
  MousePointerClick,
  Wine,
  Users,
  UserPlus,
  Trophy,
  AlertTriangle,
  ArrowRight,
  Mail,
  ExternalLink,
  TrendingUp,
  Clock,
} from "lucide-react";
import {
  getTotalClicks,
  getUniqueWineriesClicked,
  getClicksByType,
  getClickTrend,
  getTopWineries,
  getTopAccommodations,
  getSubscriberStats,
  getSubscriberTrend,
  getTopSourcePages,
  getTopSourceComponents,
  getClicksByHourOfWeek,
  getWeekOverWeekStats,
  getZeroClickWineryCount,
} from "@/lib/analytics-queries";
import { StatCard } from "./components/StatCard";
import { BarChart, formatClickType } from "./components/BarChart";
import { LineChart } from "./components/LineChart";
import { Heatmap } from "./components/Heatmap";
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
    subscriberTrend,
    topSourcePages,
    topSourceComponents,
    hourOfWeek,
    wow,
    zeroClickCount,
  ] = await Promise.all([
    getTotalClicks(startDate),
    getUniqueWineriesClicked(startDate),
    getClicksByType(startDate),
    getClickTrend(startDate),
    getTopWineries(startDate, 10),
    getTopAccommodations(startDate, 5),
    getSubscriberStats(startDate),
    getSubscriberTrend(startDate),
    getTopSourcePages(startDate, 10),
    getTopSourceComponents(startDate, 10),
    getClicksByHourOfWeek(startDate),
    getWeekOverWeekStats(),
    getZeroClickWineryCount(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold">Analytics</h1>
        <Suspense>
          <DateRangeFilter />
        </Suspense>
      </div>

      {/* Top-line KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
          subtitle={`${zeroClickCount} wineries have never been clicked`}
        />
        <Link href="/nalaadmin/analytics/subscribers" className="block">
          <StatCard
            label="Subscribers"
            value={subscribers.total}
            icon={<Users className="h-4 w-4" />}
            subtitle="View full list →"
          />
        </Link>
        <StatCard
          label="New Subscribers"
          value={subscribers.newInPeriod}
          icon={<UserPlus className="h-4 w-4" />}
          subtitle={rangeLabel}
        />
      </div>

      {/* Week-over-week quick scan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-2">
            <TrendingUp className="h-4 w-4" />
            Clicks: This Week vs Last Week
          </div>
          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-bold">{wow.clicks.current}</p>
            <span className="text-[var(--muted-foreground)] text-sm">
              vs {wow.clicks.previous}
            </span>
            {wow.clicks.previous > 0 && (
              <span
                className={`text-sm font-medium ${wow.clicks.changePercent >= 0 ? "text-green-600" : "text-red-500"}`}
              >
                {wow.clicks.changePercent >= 0 ? "+" : ""}
                {wow.clicks.changePercent}%
              </span>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-2">
            <UserPlus className="h-4 w-4" />
            New Subscribers: This Week vs Last Week
          </div>
          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-bold">{wow.subscribers.current}</p>
            <span className="text-[var(--muted-foreground)] text-sm">
              vs {wow.subscribers.previous}
            </span>
            {wow.subscribers.previous > 0 && (
              <span
                className={`text-sm font-medium ${wow.subscribers.changePercent >= 0 ? "text-green-600" : "text-red-500"}`}
              >
                {wow.subscribers.changePercent >= 0 ? "+" : ""}
                {wow.subscribers.changePercent}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Deep-dive links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Link
          href="/nalaadmin/analytics/leaderboard"
          className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 hover:bg-[var(--muted)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-amber-500" />
            <div>
              <h2 className="font-heading text-sm font-bold">Leaderboard</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Scores & hot leads
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/nalaadmin/analytics/content-gaps"
          className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 hover:bg-[var(--muted)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <h2 className="font-heading text-sm font-bold">Content Gaps</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Missing data
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/nalaadmin/analytics/subscribers"
          className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 hover:bg-[var(--muted)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-blue-500" />
            <div>
              <h2 className="font-heading text-sm font-bold">Subscribers</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Email list
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/nalaadmin/analytics/clicks"
          className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 hover:bg-[var(--muted)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <ExternalLink className="h-5 w-5 text-green-600" />
            <div>
              <h2 className="font-heading text-sm font-bold">
                Click Destinations
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Outbound URLs
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Trend charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-heading text-lg font-bold mb-4">Click Trend</h2>
          <LineChart data={clickTrend} color="#7f1d1d" />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-heading text-lg font-bold mb-4">
            New Subscribers Trend
          </h2>
          <LineChart data={subscriberTrend} color="#1e40af" />
        </div>
      </div>

      {/* Activity heatmap */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 mb-10">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-5 w-5" />
          <h2 className="font-heading text-lg font-bold">
            When Do People Click?
          </h2>
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mb-4">
          Day-of-week × hour. Brighter = more clicks. Use this to time email
          sends.
        </p>
        <Heatmap data={hourOfWeek} />
      </div>

      {/* Click type + source pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-heading text-lg font-bold mb-1">
            Clicks by Type
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">
            What action are people taking?
          </p>
          <BarChart
            data={clicksByType.map((c) => ({
              label: formatClickType(c.clickType),
              value: c.total,
            }))}
          />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-heading text-lg font-bold mb-1">
            Traffic Sources
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">
            Which pages drive outbound clicks?
          </p>
          <BarChart
            data={topSourcePages.map((s) => ({
              label: s.sourcePage || "unknown",
              value: s.total,
            }))}
          />
        </div>
      </div>

      {/* Top CTAs */}
      {topSourceComponents.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 mb-10">
          <h2 className="font-heading text-lg font-bold mb-1">
            Top Converting CTAs
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">
            Which buttons/components are actually getting clicked?
          </p>
          <BarChart
            data={topSourceComponents.map((c) => ({
              label: c.sourceComponent || "unknown",
              value: c.total,
            }))}
          />
        </div>
      )}

      {/* Top wineries + top accommodations */}
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
              label:
                s.source.charAt(0).toUpperCase() +
                s.source.slice(1).replace("_", " "),
              value: s.total,
            }))}
          />
        </div>
      )}
    </div>
  );
}
