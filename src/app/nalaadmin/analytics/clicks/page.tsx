import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, MousePointerClick, ExternalLink, Activity } from "lucide-react";
import {
  getClicksByDestination,
  getRecentClicks,
  getTotalClicks,
  getUniqueWineriesClicked,
} from "@/lib/analytics-queries";
import { StatCard } from "../components/StatCard";
import { DateRangeFilter } from "../components/DateRangeFilter";
import { ClicksTable } from "./ClicksTable";

function getStartDate(range: string): string | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  return new Date(Date.now() - days * 86400000).toISOString();
}

export default async function ClicksPage({
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

  const [totalClicks, uniqueWineries, byDestination, recent] =
    await Promise.all([
      getTotalClicks(startDate),
      getUniqueWineriesClicked(startDate),
      getClicksByDestination(startDate, 200),
      getRecentClicks(200),
    ]);

  const uniqueDestinations = new Set(byDestination.map((d) => d.destinationUrl))
    .size;

  return (
    <div>
      <Link
        href="/nalaadmin/analytics"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Analytics
      </Link>

      <div className="flex items-center justify-between mb-2">
        <h1 className="font-heading text-3xl font-bold">Click Destinations</h1>
        <Suspense>
          <DateRangeFilter />
        </Suspense>
      </div>
      <p className="text-sm text-[var(--muted-foreground)] mb-8">
        Every outbound URL visitors clicked on, plus a live feed of recent
        clicks.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <StatCard
          label="Total Clicks"
          value={totalClicks}
          icon={<MousePointerClick className="h-4 w-4" />}
          subtitle={rangeLabel}
        />
        <StatCard
          label="Unique Destinations"
          value={uniqueDestinations}
          icon={<ExternalLink className="h-4 w-4" />}
          subtitle="Distinct outbound URLs"
        />
        <StatCard
          label="Wineries Clicked"
          value={uniqueWineries}
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      <ClicksTable destinations={byDestination} recent={recent} />
    </div>
  );
}
