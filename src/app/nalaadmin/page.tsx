import { db } from "@/db";
import { wineries, accommodations, outboundClicks } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import Link from "next/link";
import { Wine, BedDouble, BarChart3, ArrowRight, MousePointerClick } from "lucide-react";

export default async function AdminDashboard() {
  const [
    [{ totalWineries }],
    [{ curatedWineries }],
    [{ totalAccommodations }],
    [{ withRooms }],
    [{ totalClicks }],
  ] = await Promise.all([
    db.select({ totalWineries: count() }).from(wineries),
    db
      .select({ curatedWineries: count() })
      .from(wineries)
      .where(eq(wineries.curated, true)),
    db.select({ totalAccommodations: count() }).from(accommodations),
    db
      .select({ withRooms: count() })
      .from(accommodations)
      .where(
        // rooms_json IS NOT NULL
        eq(accommodations.roomsJson, accommodations.roomsJson)
      ),
    db.select({ totalClicks: count() }).from(outboundClicks),
  ]);

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-2">
            <Wine className="h-4 w-4" />
            Total Wineries
          </div>
          <p className="text-3xl font-bold">{totalWineries}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-2">
            <Wine className="h-4 w-4" />
            Curated
          </div>
          <p className="text-3xl font-bold">{curatedWineries}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Appear in homepage carousel + ranking boost
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-2">
            <BedDouble className="h-4 w-4" />
            Accommodations
          </div>
          <p className="text-3xl font-bold">{totalAccommodations}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-2">
            <BedDouble className="h-4 w-4" />
            With Room Data
          </div>
          <p className="text-3xl font-bold">{withRooms}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-2">
            <MousePointerClick className="h-4 w-4" />
            Total Clicks
          </div>
          <p className="text-3xl font-bold">{totalClicks}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            All time outbound clicks tracked
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link
          href="/nalaadmin/wineries"
          className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 hover:bg-[var(--muted)] transition-colors"
        >
          <div>
            <h2 className="font-heading text-xl font-bold">Manage Wineries</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Toggle curated status, manage featured carousel
            </p>
          </div>
          <ArrowRight className="h-5 w-5" />
        </Link>
        <Link
          href="/nalaadmin/accommodations"
          className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 hover:bg-[var(--muted)] transition-colors"
        >
          <div>
            <h2 className="font-heading text-xl font-bold">
              Manage Accommodations
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              View content coverage, property details
            </p>
          </div>
          <ArrowRight className="h-5 w-5" />
        </Link>
        <Link
          href="/nalaadmin/analytics"
          className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 hover:bg-[var(--muted)] transition-colors"
        >
          <div>
            <h2 className="font-heading text-xl font-bold">Analytics</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Click tracking, winery engagement, sponsorship data
            </p>
          </div>
          <BarChart3 className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
