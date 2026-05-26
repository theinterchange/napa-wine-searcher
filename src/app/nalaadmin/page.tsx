import { db } from "@/db";
import { wineries, accommodations, outboundClicks } from "@/db/schema";
import { count, eq, isNotNull, desc, and } from "drizzle-orm";
import Link from "next/link";
import {
  Wine,
  BedDouble,
  BarChart3,
  ArrowRight,
  Calendar,
  Sparkles,
  Clock,
  AlertCircle,
} from "lucide-react";
import { wineryRankingDesc } from "@/lib/winery-ranking";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function next6Months(): Array<{ ym: string; label: string }> {
  const now = new Date();
  const items: Array<{ ym: string; label: string }> = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    items.push({
      ym: `${y}-${String(m + 1).padStart(2, "0")}`,
      label: `${MONTH_LABELS[m]} ${y}`,
    });
  }
  return items;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function AdminDashboard() {
  const [
    [{ totalWineries }],
    [{ curatedWineries }],
    [{ totalAccommodations }],
    [{ curatedAccommodations }],
    [{ totalClicks }],
    wineryAssignments,
    accommodationAssignments,
    recentWineryCurations,
    recentAccommodationCurations,
    uncuratedTopWineries,
  ] = await Promise.all([
    db.select({ totalWineries: count() }).from(wineries),
    db.select({ curatedWineries: count() }).from(wineries).where(eq(wineries.curated, true)),
    db.select({ totalAccommodations: count() }).from(accommodations),
    db.select({ curatedAccommodations: count() }).from(accommodations).where(eq(accommodations.curated, true)),
    db.select({ totalClicks: count() }).from(outboundClicks),
    db
      .select({ id: wineries.id, name: wineries.name, slug: wineries.slug, rank: wineries.editorsPickRank })
      .from(wineries)
      .where(eq(wineries.editorsPick, true))
      .orderBy(wineries.editorsPickRank),
    db
      .select({ ym: accommodations.spotlightYearMonth, name: accommodations.name, slug: accommodations.slug })
      .from(accommodations)
      .where(isNotNull(accommodations.spotlightYearMonth)),
    db
      .select({
        id: wineries.id,
        slug: wineries.slug,
        name: wineries.name,
        curatedAt: wineries.curatedAt,
      })
      .from(wineries)
      .where(and(eq(wineries.curated, true), isNotNull(wineries.curatedAt)))
      .orderBy(desc(wineries.curatedAt))
      .limit(10),
    db
      .select({
        id: accommodations.id,
        slug: accommodations.slug,
        name: accommodations.name,
        curatedAt: accommodations.curatedAt,
      })
      .from(accommodations)
      .where(and(eq(accommodations.curated, true), isNotNull(accommodations.curatedAt)))
      .orderBy(desc(accommodations.curatedAt))
      .limit(10),
    db
      .select({
        id: wineries.id,
        slug: wineries.slug,
        name: wineries.name,
        googleRating: wineries.googleRating,
        totalRatings: wineries.totalRatings,
      })
      .from(wineries)
      .where(eq(wineries.curated, false))
      .orderBy(wineryRankingDesc)
      .limit(5),
  ]);

  const accommodationYmSet = new Set(accommodationAssignments.map((a) => a.ym!));

  const months = next6Months();
  const accommodationGaps = months.filter((m) => !accommodationYmSet.has(m.ym));
  const editorsPicks = wineryAssignments; // 8 rows ordered by rank

  // Combine recent edits, sort by date desc, limit 12
  type Recent = {
    type: "winery" | "hotel";
    slug: string;
    name: string;
    curatedAt: string | null;
  };
  const allRecent: Recent[] = [
    ...recentWineryCurations.map((r) => ({ type: "winery" as const, slug: r.slug, name: r.name, curatedAt: r.curatedAt })),
    ...recentAccommodationCurations.map((r) => ({ type: "hotel" as const, slug: r.slug, name: r.name, curatedAt: r.curatedAt })),
  ]
    .sort((a, b) => (b.curatedAt ?? "").localeCompare(a.curatedAt ?? ""))
    .slice(0, 12);

  return (
    <div>
      <header className="mb-8 pb-5 border-b border-[var(--rule)]">
        <span className="kicker">Admin</span>
        <h1 className="editorial-h2 text-[32px] sm:text-[38px] mt-2">
          Content <em>workbench.</em>
        </h1>
      </header>

      {/* Compact stat strip */}
      <div className="flex flex-wrap gap-x-8 gap-y-3 mb-10 pb-4 border-b border-[var(--rule-soft)] text-sm">
        <Stat icon={Wine} label="Wineries" value={totalWineries} sub={`${curatedWineries} curated`} />
        <Stat icon={BedDouble} label="Hotels" value={totalAccommodations} sub={`${curatedAccommodations} curated`} />
        <Stat icon={BarChart3} label="Clicks (all-time)" value={totalClicks} />
      </div>

      {/* 3 action panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Spotlight gaps */}
        <section className="card-flat p-5">
          <div className="flex items-start justify-between gap-2 mb-4">
            <span className="kicker flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-[var(--brass)]" />
              Spotlight gaps
            </span>
            <Link
              href="/wineries/editors-picks"
              className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
            >
              View →
            </Link>
          </div>
          <h2 className="font-[var(--font-heading)] text-[16px] text-[var(--ink)] mb-3">
            Editor&apos;s Picks ({editorsPicks.length}/8)
          </h2>
          {editorsPicks.length === 0 ? (
            <p className="font-[var(--font-serif-text)] text-[14px] text-[var(--ink-2)]">
              No picks set. Run <code>apply-editors-picks-data.ts</code>.
            </p>
          ) : (
            <ul className="space-y-1 mb-4">
              {editorsPicks.map((p) => (
                <li key={p.slug} className="font-mono text-[12px] text-[var(--ink-2)] flex items-baseline gap-2">
                  <span className="text-[var(--ink-3)] tabular-nums w-5 shrink-0">#{p.rank}</span>
                  <Link href={`/wineries/${p.slug}`} target="_blank" className="text-[var(--ink)] hover:text-[var(--brass-2)] transition-colors truncate">
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {accommodationGaps.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--rule-soft)]">
              <p className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[var(--ink-3)] mb-1.5">
                Hotel spotlight gaps — {accommodationGaps.length}
              </p>
              <ul className="space-y-1">
                {accommodationGaps.map((m) => (
                  <li key={m.ym} className="font-mono text-[12px] text-[var(--ink-2)] flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-[var(--brass)]" />
                    {m.label} · auto-pick
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Recent edits */}
        <section className="card-flat p-5">
          <div className="flex items-start justify-between gap-2 mb-4">
            <span className="kicker flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-[var(--brass)]" />
              Recent edits
            </span>
          </div>
          <h2 className="font-[var(--font-heading)] text-[16px] text-[var(--ink)] mb-3">
            Latest curations
          </h2>
          {allRecent.length === 0 ? (
            <p className="font-[var(--font-serif-text)] text-[14px] text-[var(--ink-2)]">
              No recent curations.
            </p>
          ) : (
            <ul className="space-y-2">
              {allRecent.map((r) => (
                <li key={`${r.type}-${r.slug}`} className="text-[13px] flex items-baseline gap-2">
                  <span className={`font-mono text-[9px] tracking-[0.18em] uppercase shrink-0 ${r.type === "winery" ? "text-[var(--brass-2)]" : "text-[var(--ink-3)]"}`}>
                    {r.type === "winery" ? "WIN" : "HTL"}
                  </span>
                  <Link
                    href={r.type === "winery" ? `/wineries/${r.slug}` : `/where-to-stay/${r.slug}`}
                    target="_blank"
                    className="text-[var(--ink)] hover:text-[var(--brass-2)] transition-colors flex-1 truncate"
                  >
                    {r.name}
                  </Link>
                  <span className="font-mono text-[10.5px] text-[var(--ink-3)] shrink-0">
                    {relativeTime(r.curatedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Uncurated candidates */}
        <section className="card-flat p-5">
          <div className="flex items-start justify-between gap-2 mb-4">
            <span className="kicker flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[var(--brass)]" />
              Triage queue
            </span>
            <Link
              href="/nalaadmin/wineries"
              className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
            >
              All →
            </Link>
          </div>
          <h2 className="font-[var(--font-heading)] text-[16px] text-[var(--ink)] mb-3">
            Top uncurated wineries
          </h2>
          {uncuratedTopWineries.length === 0 ? (
            <p className="font-[var(--font-serif-text)] text-[14px] text-[var(--ink-2)]">
              All ranked wineries already curated.
            </p>
          ) : (
            <ul className="space-y-2">
              {uncuratedTopWineries.map((w) => (
                <li key={w.id} className="text-[13px]">
                  <Link
                    href={`/nalaadmin/wineries?highlight=${encodeURIComponent(w.slug)}`}
                    className="block group"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[var(--ink)] group-hover:text-[var(--brass-2)] transition-colors truncate">
                        {w.name}
                      </span>
                      {w.googleRating && (
                        <span className="font-mono text-[10.5px] text-[var(--ink-3)] shrink-0 tabular-nums">
                          {w.googleRating.toFixed(1)} · {w.totalRatings?.toLocaleString() ?? "—"}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Quick navigation row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NavCard href="/nalaadmin/wineries" title="Manage Wineries" subtitle="Curate properties, write editor's notes" />
        <NavCard href="/nalaadmin/accommodations" title="Manage Hotels" subtitle="Curate properties, schedule spotlights" />
        <NavCard href="/wineries/editors-picks" title="Editor's Picks" subtitle="Public rotation of 8 — homepage spotlight cycles weekly" icon={Calendar} />
        <NavCard href="/nalaadmin/analytics" title="Analytics" subtitle="Click tracking, engagement, sponsorship" icon={BarChart3} />
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-[var(--brass)]" />
      <div>
        <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[var(--ink-3)]">{label}</span>
        <p className="font-[var(--font-heading)] text-[20px] text-[var(--ink)] leading-none mt-0.5">
          {value.toLocaleString()}
          {sub && (
            <span className="font-mono text-[11px] text-[var(--ink-3)] ml-2 normal-case tracking-normal">
              {sub}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

function NavCard({
  href,
  title,
  subtitle,
  icon: Icon = ArrowRight,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between bg-[var(--paper-2)] border-t-2 border-[var(--rule)] hover:border-[var(--brass)] p-5 transition-colors"
    >
      <div>
        <h3 className="font-[var(--font-heading)] text-[16px] text-[var(--ink)] leading-tight">{title}</h3>
        <p className="text-[12px] text-[var(--ink-3)] mt-1.5">{subtitle}</p>
      </div>
      <Icon className="h-5 w-5 text-[var(--brass)] shrink-0 ml-3" />
    </Link>
  );
}
