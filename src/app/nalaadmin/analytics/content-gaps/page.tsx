import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { getAllWineriesWithStats } from "@/lib/analytics-queries";
import { calculateListingScore } from "@/lib/listing-score";
import { StatCard } from "../components/StatCard";
import { ContentGapsTable } from "./ContentGapsTable";

export default async function ContentGapsPage() {
  const allWineries = await getAllWineriesWithStats(null);

  const rows = allWineries
    .map((w) => {
      const { score, missing } = calculateListingScore(w, {
        tastingCount: w.tastingCount,
        photoCount: w.photoCount,
      });
      return {
        id: w.id,
        slug: w.slug,
        name: w.name,
        score,
        missing,
      };
    })
    .sort((a, b) => a.score - b.score);

  const below50 = rows.filter((r) => r.score < 50).length;
  const missingEmail = rows.filter((r) => r.missing.includes("Email")).length;
  const missingTastings = rows.filter((r) =>
    r.missing.includes("Tasting experiences")
  ).length;
  const missingHero = rows.filter((r) =>
    r.missing.includes("Hero image")
  ).length;

  return (
    <div>
      <Link
        href="/nalaadmin/analytics"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Analytics
      </Link>

      <h1 className="font-heading text-3xl font-bold mb-8">Content Gaps</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          label="Score Below 50"
          value={below50}
          icon={<AlertTriangle className="h-4 w-4" />}
          subtitle={`of ${rows.length} wineries`}
        />
        <StatCard
          label="Missing Email"
          value={missingEmail}
          subtitle="Can't send pitch emails"
        />
        <StatCard
          label="Missing Tastings"
          value={missingTastings}
          subtitle="No tasting experience data"
        />
        <StatCard
          label="Missing Hero Image"
          value={missingHero}
          subtitle="No main photo"
        />
      </div>

      <ContentGapsTable wineries={rows} />
    </div>
  );
}
