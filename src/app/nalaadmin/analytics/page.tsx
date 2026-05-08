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
  Search,
  Map,
  Eye,
  Star,
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
  getAccountStats,
  getAccountTrend,
  getGscSiteStats,
  getGscSiteTrend,
  getGscTopQueriesSiteWide,
  getGscTopPagesSiteWide,
  getTripPlannerStats,
  getTripPlannerByTheme,
  getTripPlannerByValley,
  getTripPlannerTrend,
  getPageImpressionStats,
  getPageImpressionsByType,
  getTopReferrers,
  getTopImpressionPages,
  getSpotlightPerformance,
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
    accountStats,
    accountTrend,
    gscStats,
    gscTrend,
    gscTopQueries,
    gscTopPages,
    tripStats,
    tripByTheme,
    tripByValley,
    tripTrend,
    impressionStats,
    impressionsByType,
    topReferrers,
    topImpressionPages,
    spotlightPerf,
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
    getAccountStats(startDate),
    getAccountTrend(startDate),
    getGscSiteStats(startDate),
    getGscSiteTrend(startDate),
    getGscTopQueriesSiteWide(startDate, 10),
    getGscTopPagesSiteWide(startDate, 10),
    getTripPlannerStats(startDate),
    getTripPlannerByTheme(startDate),
    getTripPlannerByValley(startDate),
    getTripPlannerTrend(startDate),
    getPageImpressionStats(startDate),
    getPageImpressionsByType(startDate),
    getTopReferrers(startDate, 10),
    getTopImpressionPages(startDate, 10),
    getSpotlightPerformance(24),
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
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 max-w-lg mb-10">
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

      {/* ===== Accounts ===== */}
      <h2 className="font-heading text-2xl font-bold mt-12 mb-4 flex items-center gap-2">
        <Users className="h-6 w-6" />
        Accounts
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <StatCard
          label="Total Accounts"
          value={accountStats.total}
          subtitle={`${accountStats.newInPeriod} new in ${rangeLabel}`}
        />
        <StatCard
          label="Password Signups"
          value={accountStats.withPassword}
          subtitle="Credentials provider"
        />
        <StatCard
          label="OAuth Linked"
          value={accountStats.withOAuth}
          subtitle="Google / etc."
        />
        <StatCard
          label="Public Profiles"
          value={accountStats.publicProfiles}
          subtitle={`${accountStats.withUsername} have a username`}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h3 className="font-heading text-lg font-bold mb-1">Account Engagement</h3>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">
            How many accounts are using each feature?
          </p>
          <BarChart
            data={[
              { label: "Favorited a winery", value: accountStats.withFavorites },
              { label: "Logged a wine journal entry", value: accountStats.withJournal },
              { label: "Saved a trip plan", value: accountStats.withSavedTrips },
            ]}
          />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h3 className="font-heading text-lg font-bold mb-1">New Accounts Trend</h3>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">
            Backfilled before 2026-05-07; real signups tracked daily after.
          </p>
          <LineChart data={accountTrend} color="#0f766e" />
        </div>
      </div>

      {/* ===== Google Search Console ===== */}
      <h2 className="font-heading text-2xl font-bold mt-12 mb-4 flex items-center gap-2">
        <Search className="h-6 w-6" />
        Google Search ({rangeLabel})
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Impressions"
          value={gscStats.impressions.toLocaleString()}
          subtitle={`${gscStats.uniquePages} pages indexed`}
        />
        <StatCard
          label="Clicks"
          value={gscStats.clicks.toLocaleString()}
          subtitle={`${(gscStats.ctr * 100).toFixed(2)}% CTR`}
        />
        <StatCard
          label="Avg Position"
          value={gscStats.avgPosition ? gscStats.avgPosition.toFixed(1) : "—"}
          subtitle="Lower = better"
        />
        <StatCard
          label="Unique Queries"
          value={gscStats.uniqueQueries.toLocaleString()}
          subtitle="People searched and saw us"
        />
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 mb-6">
        <h3 className="font-heading text-lg font-bold mb-1">GSC Click Trend</h3>
        <p className="text-xs text-[var(--muted-foreground)] mb-4">
          Clicks per day from Google search results.
        </p>
        <LineChart
          data={gscTrend.map((d) => ({ date: d.date, total: d.total }))}
          color="#1e40af"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h3 className="font-heading text-lg font-bold mb-1">Top Queries</h3>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">
            Search terms that surface this site, sorted by impressions.
          </p>
          {gscTopQueries.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] py-4">No GSC data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[var(--muted-foreground)]">
                    <th className="pb-2 pr-3 font-medium">Query</th>
                    <th className="pb-2 pr-3 text-right font-medium">Impr.</th>
                    <th className="pb-2 pr-3 text-right font-medium">Clicks</th>
                    <th className="pb-2 text-right font-medium">Pos.</th>
                  </tr>
                </thead>
                <tbody>
                  {gscTopQueries.map((q) => (
                    <tr key={q.query} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-2 pr-3 truncate max-w-[200px]">{q.query}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{Number(q.impressions ?? 0).toLocaleString()}</td>
                      <td className="py-2 pr-3 text-right tabular-nums font-medium">{Number(q.clicks ?? 0)}</td>
                      <td className="py-2 text-right tabular-nums text-[var(--muted-foreground)]">{q.avgPosition ? Number(q.avgPosition).toFixed(1) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h3 className="font-heading text-lg font-bold mb-1">Top Pages (GSC)</h3>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">
            Pages that earn the most search impressions.
          </p>
          {gscTopPages.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] py-4">No GSC data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[var(--muted-foreground)]">
                    <th className="pb-2 pr-3 font-medium">Page</th>
                    <th className="pb-2 pr-3 text-right font-medium">Impr.</th>
                    <th className="pb-2 text-right font-medium">Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {gscTopPages.map((p) => {
                    const short = p.page.replace(/^https?:\/\/(www\.)?napasonomaguide\.com/, "") || "/";
                    return (
                      <tr key={p.page} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-2 pr-3 truncate max-w-[260px] font-mono text-xs">{short}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{Number(p.impressions ?? 0).toLocaleString()}</td>
                        <td className="py-2 text-right tabular-nums font-medium">{Number(p.clicks ?? 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ===== Trip Planner ===== */}
      <h2 className="font-heading text-2xl font-bold mt-12 mb-4 flex items-center gap-2">
        <Map className="h-6 w-6" />
        Trip Planner
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Trips Created"
          value={tripStats.totalTrips}
          subtitle={`${tripStats.totalStops} total stops`}
        />
        <StatCard
          label="Avg Stops / Trip"
          value={tripStats.avgStopsPerTrip}
          subtitle="Higher = more engaged"
        />
        <StatCard
          label="With Origin Set"
          value={tripStats.withOrigin}
          subtitle={
            tripStats.totalTrips > 0
              ? `${Math.round((tripStats.withOrigin / tripStats.totalTrips) * 100)}% of trips`
              : "—"
          }
        />
        <StatCard
          label="With Home Base"
          value={tripStats.withHomeBase}
          subtitle="Phase 5.5 adoption"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h3 className="font-heading text-lg font-bold mb-1">Trips by Theme</h3>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">
            What kind of trips are people building?
          </p>
          {tripByTheme.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] py-4">No themed trips yet</p>
          ) : (
            <BarChart
              data={tripByTheme.map((t) => ({
                label: t.theme || "—",
                value: t.total,
              }))}
            />
          )}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h3 className="font-heading text-lg font-bold mb-1">Trips by Valley</h3>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">
            Napa vs. Sonoma trip popularity.
          </p>
          {tripByValley.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] py-4">No valley-tagged trips yet</p>
          ) : (
            <BarChart
              data={tripByValley.map((t) => ({
                label: t.valley || "—",
                value: t.total,
              }))}
            />
          )}
        </div>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 mb-10">
        <h3 className="font-heading text-lg font-bold mb-1">Trip Creation Trend</h3>
        <p className="text-xs text-[var(--muted-foreground)] mb-4">
          Anonymous trips created per day.
        </p>
        <LineChart data={tripTrend} color="#9a3412" />
      </div>

      {/* ===== Page Impressions ===== */}
      <h2 className="font-heading text-2xl font-bold mt-12 mb-4 flex items-center gap-2">
        <Eye className="h-6 w-6" />
        On-Site Page Impressions ({rangeLabel})
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Pageviews"
          value={impressionStats.total.toLocaleString()}
          subtitle="Beacon-tracked"
        />
        <StatCard
          label="Sessions"
          value={impressionStats.uniqueSessions.toLocaleString()}
          subtitle={`${impressionStats.pagesPerSession} pages/session`}
        />
        <StatCard
          label="Page Types"
          value={impressionsByType.length}
          subtitle="Distinct surfaces tracked"
        />
        <StatCard
          label="Top Referrer"
          value={
            topReferrers[0]?.referrer
              ? truncateReferrer(topReferrers[0].referrer)
              : "—"
          }
          subtitle={topReferrers[0] ? `${topReferrers[0].total} hits` : "No referrers yet"}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h3 className="font-heading text-lg font-bold mb-1">Pageviews by Page Type</h3>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">
            Which surface gets the most attention?
          </p>
          {impressionsByType.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] py-4">No impression data yet</p>
          ) : (
            <BarChart
              data={impressionsByType.map((t) => ({
                label: t.pageType || "unknown",
                value: t.total,
              }))}
            />
          )}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h3 className="font-heading text-lg font-bold mb-1">Top Referrers</h3>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">
            Where visitors are arriving from.
          </p>
          {topReferrers.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] py-4">No referrers logged yet</p>
          ) : (
            <BarChart
              data={topReferrers.map((r) => ({
                label: truncateReferrer(r.referrer || ""),
                value: r.total,
              }))}
            />
          )}
        </div>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 mb-10">
        <h3 className="font-heading text-lg font-bold mb-1">Top Pages (On-Site)</h3>
        <p className="text-xs text-[var(--muted-foreground)] mb-4">
          Most-viewed pages by our own beacon (separate from GSC).
        </p>
        {topImpressionPages.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] py-4">No impression data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--muted-foreground)]">
                  <th className="pb-2 pr-3 font-medium">Path</th>
                  <th className="pb-2 text-right font-medium">Views</th>
                </tr>
              </thead>
              <tbody>
                {topImpressionPages.map((p) => (
                  <tr key={p.path} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-2 pr-3 font-mono text-xs truncate max-w-[400px]">{p.path}</td>
                    <td className="py-2 text-right tabular-nums font-medium">{p.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== Spotlight Performance ===== */}
      <h2 className="font-heading text-2xl font-bold mt-12 mb-4 flex items-center gap-2">
        <Star className="h-6 w-6" />
        Spotlight Performance
      </h2>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 mb-10">
        <p className="text-xs text-[var(--muted-foreground)] mb-4">
          Outbound clicks attributed to each spotlighted entity during its assigned month. Use this to judge whether the rotation is paying off.
        </p>
        {spotlightPerf.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] py-4">No spotlights assigned yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--muted-foreground)]">
                  <th className="pb-2 pr-3 font-medium">Month</th>
                  <th className="pb-2 pr-3 font-medium">Type</th>
                  <th className="pb-2 pr-3 font-medium">Entity</th>
                  <th className="pb-2 text-right font-medium">Clicks in month</th>
                </tr>
              </thead>
              <tbody>
                {spotlightPerf.map((s) => (
                  <tr key={`${s.kind}-${s.id}`} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-2 pr-3 font-mono text-xs">{s.yearMonth}</td>
                    <td className="py-2 pr-3 text-[var(--muted-foreground)] text-xs uppercase tracking-wide">{s.kind}</td>
                    <td className="py-2 pr-3">
                      <Link
                        href={s.kind === "winery" ? `/wineries/${s.slug}` : `/where-to-stay/${s.slug}`}
                        target="_blank"
                        className="hover:underline"
                      >
                        {s.name}
                      </Link>
                    </td>
                    <td className="py-2 text-right tabular-nums font-medium">{s.clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function truncateReferrer(ref: string): string {
  if (!ref) return "—";
  try {
    const u = new URL(ref);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return ref.length > 40 ? ref.slice(0, 40) + "…" : ref;
  }
}
