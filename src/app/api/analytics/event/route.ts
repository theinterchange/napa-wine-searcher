import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { itineraryAnalyticsEvents } from "@/db/schema";

/**
 * Batched event ingestion for the trip planner.
 *
 * Posts shape:
 *   { events: [{ eventName, tripId?, shareCode?, mode?, payload?, sessionId? }] }
 *
 * Accepts up to 50 events per call. Trusted client surface — no auth, but
 * we bound the payload, validate event names, and clip strings so a noisy
 * client can't run away with the table.
 */

const ALLOWED_EVENTS = new Set([
  "trip_mode_chosen",
  "trip_builder_input",
  "trip_describe_submitted",
  "trip_generated",
  "stop_swapped",
  "stop_removed",
  "stop_added",
  "stop_reordered",
  "trip_saved",
  "trip_shared",
  "trip_exported",
  "home_base_picked",
  "home_base_changed",
  "origin_set",
  "shuffle_clicked",
]);

const MAX_EVENTS_PER_REQUEST = 50;
const MAX_PAYLOAD_BYTES = 4_000;

interface IncomingEvent {
  eventName: string;
  tripId?: number;
  shareCode?: string;
  mode?: string;
  payload?: unknown;
  sessionId?: string;
}

function clip(s: unknown, max: number): string | null {
  if (typeof s !== "string") return null;
  return s.length > max ? s.slice(0, max) : s;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body == null ||
    !Array.isArray((body as { events?: unknown }).events)
  ) {
    return NextResponse.json(
      { error: "Expected { events: [...] }" },
      { status: 400 }
    );
  }

  const events = (body as { events: IncomingEvent[] }).events;
  if (events.length === 0) {
    return NextResponse.json({ accepted: 0 });
  }
  if (events.length > MAX_EVENTS_PER_REQUEST) {
    return NextResponse.json(
      { error: `Max ${MAX_EVENTS_PER_REQUEST} events per request` },
      { status: 413 }
    );
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  if (userAgent.toLowerCase().includes("bot")) {
    return NextResponse.json({ accepted: 0, skipped: events.length });
  }

  const rows: typeof itineraryAnalyticsEvents.$inferInsert[] = [];
  for (const e of events) {
    if (!ALLOWED_EVENTS.has(e.eventName)) continue;
    let payloadJson: string | null = null;
    if (e.payload !== undefined) {
      try {
        const serialized = JSON.stringify(e.payload);
        if (serialized.length > MAX_PAYLOAD_BYTES) continue;
        payloadJson = serialized;
      } catch {
        continue;
      }
    }
    rows.push({
      eventName: e.eventName,
      tripId: typeof e.tripId === "number" ? e.tripId : null,
      shareCode: clip(e.shareCode, 32),
      mode: clip(e.mode, 32),
      payloadJson,
      sessionId: clip(e.sessionId, 64),
      userId: null,
    });
  }

  if (rows.length === 0) {
    return NextResponse.json({ accepted: 0 });
  }

  try {
    await db.insert(itineraryAnalyticsEvents).values(rows);
    return NextResponse.json({ accepted: rows.length });
  } catch (err) {
    console.error("POST /api/analytics/event:", err);
    return NextResponse.json(
      { error: "Insert failed" },
      { status: 500 }
    );
  }
}
