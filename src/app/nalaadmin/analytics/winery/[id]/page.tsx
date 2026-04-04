import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MousePointerClick,
  TrendingUp,
  TrendingDown,
  Star,
  ArrowLeft,
} from "lucide-react";
import {
  getWineryInfo,
  getWineryClickTotal,
  getWineryClicksByType,
  getWineryClickTrend,
  getWinerySourcePages,
  getWineryPeriodComparison,
  getWineryPitchHistory,
} from "@/lib/analytics-queries";
import { StatCard } from "../../components/StatCard";
import { BarChart, formatClickType } from "../../components/BarChart";
import { ClickTrendChart } from "../../components/ClickTrendChart";
import { DateRangeFilter } from "../../components/DateRangeFilter";
import { PitchEmailPanel } from "./PitchEmailPanel";

function getStartDate(range: string): string | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  return new Date(Date.now() - days * 86400000).toISOString();
}

function getDays(range: string): number {
  return range === "7d" ? 7 : range === "90d" ? 90 : 30;
}

export default async function WineryAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { id } = await params;
  const { range = "30d" } = await searchParams;
  const wineryId = parseInt(id, 10);
  if (isNaN(wineryId)) notFound();

  const winery = await getWineryInfo(wineryId);
  if (!winery) notFound();

  const startDate = getStartDate(range);
  const rangeLabel =
    range === "all"
      ? "all time"
      : range === "7d"
        ? "last 7 days"
        : range === "90d"
          ? "last 90 days"
          : "last 30 days";

  // For period comparison (not available for "all time")
  const days = getDays(range);
  const currentStart = startDate ?? new Date(0).toISOString();
  const previousStart =
    range !== "all"
      ? new Date(Date.now() - days * 2 * 86400000).toISOString()
      : null;

  const [totalClicks, clicksByType, clickTrend, sourcePages, comparison, pitchHistory] =
    await Promise.all([
      getWineryClickTotal(wineryId, startDate),
      getWineryClicksByType(wineryId, startDate),
      getWineryClickTrend(wineryId, startDate),
      getWinerySourcePages(wineryId, startDate),
      previousStart
        ? getWineryPeriodComparison(
            wineryId,
            currentStart,
            previousStart,
            currentStart
          )
        : Promise.resolve(null),
      getWineryPitchHistory(wineryId),
    ]);

  return (
    <div>
      <Link
        href="/nalaadmin/analytics"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Analytics
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">{winery.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-[var(--muted-foreground)]">
            {winery.city && <span>{winery.city}</span>}
            {winery.valley && (
              <span className="capitalize">{winery.valley} Valley</span>
            )}
            {winery.googleRating && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {winery.googleRating}
                {winery.googleReviewCount && (
                  <span>({winery.googleReviewCount})</span>
                )}
              </span>
            )}
          </div>
        </div>
        <Suspense>
          <DateRangeFilter />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <StatCard
          label="Total Clicks"
          value={totalClicks}
          icon={<MousePointerClick className="h-4 w-4" />}
          subtitle={rangeLabel}
          trend={comparison?.changePercent ?? null}
        />
        <StatCard
          label="Most Popular Action"
          value={
            clicksByType[0]
              ? formatClickType(clicksByType[0].clickType)
              : "N/A"
          }
          icon={
            comparison && comparison.changePercent >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )
          }
          subtitle={
            clicksByType[0]
              ? `${clicksByType[0].total} clicks`
              : "No clicks yet"
          }
        />
        <StatCard
          label="Top Traffic Source"
          value={sourcePages[0]?.sourcePage ?? "N/A"}
          subtitle={
            sourcePages[0]
              ? `${sourcePages[0].total} clicks from this page`
              : "No source data"
          }
        />
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

      {sourcePages.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 mb-10">
          <h2 className="font-heading text-lg font-bold mb-4">
            Traffic Sources
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--muted-foreground)]">
                  <th className="pb-2 pr-3 font-medium">Page</th>
                  <th className="pb-2 text-right font-medium">Clicks</th>
                </tr>
              </thead>
              <tbody>
                {sourcePages.map((sp) => (
                  <tr
                    key={sp.sourcePage}
                    className="border-b border-[var(--border)] last:border-0"
                  >
                    <td className="py-2 pr-3 font-mono text-xs">
                      {sp.sourcePage}
                    </td>
                    <td className="py-2 text-right tabular-nums font-medium">
                      {sp.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {comparison && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 max-w-md">
          <h2 className="font-heading text-lg font-bold mb-4">
            Period Comparison
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Current period
              </span>
              <span className="font-medium">{comparison.current} clicks</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Previous period
              </span>
              <span className="font-medium">{comparison.previous} clicks</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-2">
              <span className="text-[var(--muted-foreground)]">Change</span>
              <span
                className={`font-medium ${
                  comparison.changePercent > 0
                    ? "text-green-600"
                    : comparison.changePercent < 0
                      ? "text-red-500"
                      : ""
                }`}
              >
                {comparison.changePercent > 0 ? "+" : ""}
                {comparison.changePercent}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Pitch Email */}
      <div className="mb-10">
        <PitchEmailPanel
          wineryId={wineryId}
          wineryName={winery.name}
          wineryEmail={winery.email ?? null}
          totalClicks={totalClicks}
          periodLabel={rangeLabel}
        />
      </div>

      {/* Pitch History */}
      {pitchHistory.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 mb-10">
          <h2 className="font-heading text-lg font-bold mb-4">Pitch History</h2>
          <div className="space-y-2">
            {pitchHistory.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-sm border-b border-[var(--border)] last:border-0 pb-2 last:pb-0"
              >
                <div>
                  <span className="font-medium">{p.subject}</span>
                  <span className="text-[var(--muted-foreground)] ml-2">
                    → {p.recipientEmail}
                  </span>
                </div>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {new Date(p.sentAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          href={`/wineries/${winery.slug}`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          View public listing &rarr;
        </Link>
      </div>
    </div>
  );
}
