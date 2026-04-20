import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pageImpressions } from "@/db/schema";

interface BatchEvent {
  path?: string;
  pageType?: string;
  entityType?: string;
  entityId?: number;
  wineryId?: number;
  accommodationId?: number;
  referrer?: string;
  viewedAt?: string;
  durationMs?: number;
}

interface BatchBody {
  sessionId?: string;
  events?: BatchEvent[];
}

const MAX_BATCH = 50;

export async function POST(request: NextRequest) {
  try {
    let body: BatchBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const events = Array.isArray(body.events) ? body.events : [];
    if (events.length === 0 || events.length > MAX_BATCH) {
      return NextResponse.json(
        { error: `events must be 1-${MAX_BATCH} items` },
        { status: 400 }
      );
    }

    const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
    const now = new Date().toISOString();

    const rows = events
      .filter((e) => typeof e.path === "string" && e.path.length > 0)
      .map((e) => ({
        path: e.path!.slice(0, 500),
        pageType: e.pageType?.slice(0, 50) ?? null,
        entityType: e.entityType?.slice(0, 50) ?? null,
        entityId: typeof e.entityId === "number" ? e.entityId : null,
        wineryId: typeof e.wineryId === "number" ? e.wineryId : null,
        accommodationId:
          typeof e.accommodationId === "number" ? e.accommodationId : null,
        sessionId,
        referrer: e.referrer?.slice(0, 500) ?? null,
        durationMs: typeof e.durationMs === "number" ? e.durationMs : null,
        viewedAt:
          typeof e.viewedAt === "string" && e.viewedAt.length > 0
            ? e.viewedAt
            : now,
        createdAt: now,
      }));

    if (rows.length === 0) {
      return NextResponse.json({ received: 0 });
    }

    await db.insert(pageImpressions).values(rows);
    return NextResponse.json({ received: rows.length });
  } catch (error) {
    console.error("POST /api/impressions/batch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
