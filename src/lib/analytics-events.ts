/**
 * Client-side event firing for the trip planner. Fire-and-forget: events
 * are buffered locally and flushed in small batches to /api/analytics/event.
 * Failures are silent — analytics must never block UX or surface errors.
 *
 * Server-only callers should NOT import this module; insert into the
 * `itineraryAnalyticsEvents` table directly.
 */

export type TripEventName =
  | "trip_mode_chosen"
  | "trip_builder_input"
  | "trip_describe_submitted"
  | "trip_generated"
  | "stop_swapped"
  | "stop_removed"
  | "stop_added"
  | "stop_reordered"
  | "trip_saved"
  | "trip_shared"
  | "trip_exported"
  | "home_base_picked"
  | "home_base_changed"
  | "origin_set"
  | "shuffle_clicked";

interface TripEvent {
  eventName: TripEventName;
  tripId?: number;
  shareCode?: string;
  mode?: string;
  payload?: Record<string, unknown>;
}

const SESSION_KEY = "napa_session_id";
const FLUSH_DELAY_MS = 1500;
const MAX_BATCH = 25;

let queue: TripEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)) + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}

async function flush() {
  flushTimer = null;
  if (queue.length === 0) return;
  const batch = queue.splice(0, MAX_BATCH);
  const sessionId = getSessionId();
  try {
    await fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        events: batch.map((e) => ({ ...e, sessionId })),
      }),
    });
  } catch {
    // Silent — analytics is best-effort.
  }
  if (queue.length > 0 && !flushTimer) {
    flushTimer = setTimeout(flush, FLUSH_DELAY_MS);
  }
}

/**
 * Enqueue an event. Buffered ~1.5 s so multiple fires within a single
 * user interaction (e.g., swap → reorder) hit the server together.
 */
export function trackTripEvent(e: TripEvent): void {
  if (typeof window === "undefined") return;
  queue.push(e);
  if (!flushTimer) {
    flushTimer = setTimeout(flush, FLUSH_DELAY_MS);
  }
}
