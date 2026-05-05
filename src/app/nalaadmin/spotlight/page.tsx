import Link from "next/link";
import { db } from "@/db";
import { wineries, accommodations, subRegions } from "@/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";
import { wineryRankingDesc } from "@/lib/winery-ranking";
import { Calendar } from "lucide-react";
import { SpotlightCalendar } from "./SpotlightCalendar";

export const dynamic = "force-dynamic";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function next12Months(): Array<{ ym: string; label: string; monthIdx: number }> {
  const now = new Date();
  const items: Array<{ ym: string; label: string; monthIdx: number }> = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const ym = `${y}-${String(m + 1).padStart(2, "0")}`;
    items.push({ ym, label: `${MONTH_LABELS[m]} ${y}`, monthIdx: m + y * 12 });
  }
  return items;
}

async function getData() {
  const [wineryAssignments, wineryPool, accommodationAssignments, accommodationPool] =
    await Promise.all([
      db
        .select({
          id: wineries.id,
          slug: wineries.slug,
          name: wineries.name,
          spotlightYearMonth: wineries.spotlightYearMonth,
        })
        .from(wineries)
        .where(isNotNull(wineries.spotlightYearMonth)),
      db
        .select({
          id: wineries.id,
          slug: wineries.slug,
          name: wineries.name,
          subRegion: subRegions.name,
        })
        .from(wineries)
        .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
        .where(and(eq(wineries.curated, true), isNotNull(wineries.heroImageUrl)))
        .orderBy(wineryRankingDesc)
        .limit(40),
      db
        .select({
          id: accommodations.id,
          slug: accommodations.slug,
          name: accommodations.name,
          spotlightYearMonth: accommodations.spotlightYearMonth,
        })
        .from(accommodations)
        .where(isNotNull(accommodations.spotlightYearMonth)),
      db
        .select({
          id: accommodations.id,
          slug: accommodations.slug,
          name: accommodations.name,
          subRegion: subRegions.name,
        })
        .from(accommodations)
        .leftJoin(subRegions, eq(accommodations.subRegionId, subRegions.id))
        .where(
          and(eq(accommodations.curated, true), isNotNull(accommodations.heroImageUrl))
        )
        .limit(40),
    ]);

  return {
    wineryAssignments,
    wineryPool,
    accommodationAssignments,
    accommodationPool,
  };
}

export default async function SpotlightDashboard() {
  const { wineryAssignments, wineryPool, accommodationAssignments, accommodationPool } =
    await getData();

  const months = next12Months();

  return (
    <div>
      <header className="mb-6 pb-5 border-b border-[var(--rule)]">
        <span className="kicker flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-[var(--brass)]" />
          Schedule
        </span>
        <div className="flex items-end justify-between gap-4 mt-2">
          <h1 className="editorial-h2 text-[28px] sm:text-[36px]">
            Spotlight <em>schedule.</em>
          </h1>
          <div className="flex gap-3">
            <Link
              href="/nalaadmin/wineries"
              className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
            >
              Edit wineries →
            </Link>
            <Link
              href="/nalaadmin/accommodations"
              className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
            >
              Edit hotels →
            </Link>
          </div>
        </div>
        <p className="font-[var(--font-serif-text)] text-[15px] text-[var(--ink-2)] mt-3 max-w-[60ch]">
          Click any month to assign or change a winery or hotel directly. Manual
          assignments win when set; otherwise the homepage rotates deterministically
          through the curated pool.
        </p>
      </header>

      <SpotlightCalendar
        months={months}
        wineryAssignments={wineryAssignments}
        wineryPool={wineryPool}
        accommodationAssignments={accommodationAssignments}
        accommodationPool={accommodationPool}
      />
    </div>
  );
}
