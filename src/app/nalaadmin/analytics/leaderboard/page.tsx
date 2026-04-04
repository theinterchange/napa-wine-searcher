import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAllWineriesWithStats } from "@/lib/analytics-queries";
import { calculateListingScore } from "@/lib/listing-score";
import { DateRangeFilter } from "../components/DateRangeFilter";
import { StatCard } from "../components/StatCard";
import { LeaderboardTable } from "./LeaderboardTable";

function getStartDate(range: string): string | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  return new Date(Date.now() - days * 86400000).toISOString();
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range = "30d" } = await searchParams;
  const startDate = getStartDate(range);

  const allWineries = await getAllWineriesWithStats(startDate);

  const rows = allWineries.map((w) => {
    const { score } = calculateListingScore(w, {
      tastingCount: w.tastingCount,
      photoCount: w.photoCount,
    });
    return {
      id: w.id,
      slug: w.slug,
      name: w.name,
      valley: w.valley,
      city: w.city,
      email: w.email,
      clicks: w.clicks,
      score,
      lastPitchedAt: w.lastPitchedAt,
    };
  });

  const avgScore = rows.length > 0
    ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length)
    : 0;
  const withClicks = rows.filter((r) => r.clicks > 0).length;
  const hotLeads = rows.filter((r) => r.clicks > 0 && r.score >= 60 && r.email).length;
  const withEmail = rows.filter((r) => r.email).length;

  return (
    <div>
      <Link
        href="/nalaadmin/analytics"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Analytics
      </Link>

      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold">Winery Leaderboard</h1>
        <Suspense>
          <DateRangeFilter />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          label="Average Listing Score"
          value={`${avgScore}/100`}
          subtitle="Across all wineries"
        />
        <StatCard
          label="Wineries with Clicks"
          value={withClicks}
          subtitle={`of ${rows.length} total`}
        />
        <StatCard
          label="Hot Leads"
          value={hotLeads}
          subtitle="Clicks + good listing + has email"
        />
        <StatCard
          label="Have Email"
          value={withEmail}
          subtitle={`${rows.length - withEmail} missing`}
        />
      </div>

      <LeaderboardTable wineries={rows} />
    </div>
  );
}
