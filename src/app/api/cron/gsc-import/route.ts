import { NextRequest, NextResponse } from "next/server";
import { and, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { gscDailyQueries } from "@/db/schema";
import { fetchQueryPageRows } from "@/lib/gsc";

// Import the last 7 days on each run — GSC has a 2-3 day data lag, so today's
// and yesterday's rows will be backfilled on subsequent runs. Older rows are
// idempotent via the unique (date, page, query) constraint.
const WINDOW_DAYS = 7;

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isAuthorized(request: NextRequest): boolean {
  // Vercel Cron sets a user-agent of "vercel-cron/1.0" AND includes the
  // x-vercel-cron header. For manual triggers, accept a bearer token that
  // matches CRON_SECRET.
  const cronHeader = request.headers.get("x-vercel-cron");
  if (cronHeader) return true;

  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - WINDOW_DAYS);

  try {
    const rows = await fetchQueryPageRows({
      startDate: formatDate(start),
      endDate: formatDate(end),
    });

    if (rows.length === 0) {
      return NextResponse.json({
        fetched: 0,
        written: 0,
        window: { start: formatDate(start), end: formatDate(end) },
      });
    }

    const now = new Date().toISOString();
    const startDate = formatDate(start);
    const endDate = formatDate(end);

    // Delete-then-insert for the window. Simpler and fully correct vs. trying
    // to upsert per-row — GSC numbers for a given (date, page, query) only
    // change in the 2-3 day lag window anyway, and we re-fetch that window
    // every run.
    await db
      .delete(gscDailyQueries)
      .where(
        and(
          gte(gscDailyQueries.date, startDate),
          lte(gscDailyQueries.date, endDate)
        )
      );

    const batch = rows.map((r) => ({
      date: r.date,
      page: r.page,
      query: r.query,
      impressions: r.impressions,
      clicks: r.clicks,
      ctr: r.ctr,
      position: r.position,
      fetchedAt: now,
    }));

    // libsql has a parameter cap; chunk inserts. 9 fields × 3000 = 27K params.
    const CHUNK = 3_000;
    let written = 0;
    for (let i = 0; i < batch.length; i += CHUNK) {
      const slice = batch.slice(i, i + CHUNK);
      await db.insert(gscDailyQueries).values(slice);
      written += slice.length;
    }

    return NextResponse.json({
      fetched: rows.length,
      written,
      window: { start: startDate, end: endDate },
    });
  } catch (error) {
    console.error("GSC import failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
