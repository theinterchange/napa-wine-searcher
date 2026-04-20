/**
 * Client-side impression beacon. Batches page-view events and flushes to
 * /api/impressions/batch on a timer, on visibility change, and on page hide.
 *
 * Session ID lives in sessionStorage (tab-lifetime) so multiple views inside
 * the same session group together for uniqueness math without requiring cookies
 * or cross-tab correlation.
 */

export interface ImpressionEvent {
  path: string;
  pageType?: string;
  entityType?: string;
  entityId?: number;
  wineryId?: number;
  accommodationId?: number;
  referrer?: string;
  viewedAt: string;
  durationMs?: number;
}

const ENDPOINT = "/api/impressions/batch";
const FLUSH_INTERVAL_MS = 10_000;
const MAX_BATCH_SIZE = 20;
const SESSION_KEY = "nsg_session_id";

let queue: ImpressionEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let listenersAttached = false;

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

function serialize(events: ImpressionEvent[]): string {
  const sessionId = getSessionId();
  return JSON.stringify({
    sessionId,
    events,
  });
}

function flush(useBeacon = false): void {
  if (queue.length === 0) return;
  const batch = queue.splice(0, queue.length);
  const body = serialize(batch);

  if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
    // sendBeacon sends on unload reliably. Blob type must be parseable as JSON
    // by the server.
    const blob = new Blob([body], { type: "application/json" });
    const sent = navigator.sendBeacon(ENDPOINT, blob);
    if (sent) return;
    // Fall through to fetch if beacon refused the payload
  }

  // keepalive: true keeps fetch alive past page unload up to ~64KB
  fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Silently drop; re-queuing could create memory pressure in bad-network
    // conditions. Analytics is best-effort.
  });
}

function attachListeners(): void {
  if (listenersAttached || typeof window === "undefined") return;
  listenersAttached = true;

  // Flush on tab hide or close so counts are captured even if the user
  // navigates away before the timer fires.
  const handleHide = () => flush(true);
  window.addEventListener("pagehide", handleHide);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });
}

function startTimer(): void {
  if (flushTimer || typeof window === "undefined") return;
  flushTimer = setInterval(() => flush(false), FLUSH_INTERVAL_MS);
}

export function recordImpression(event: ImpressionEvent): void {
  if (typeof window === "undefined") return;
  attachListeners();
  startTimer();
  queue.push(event);
  if (queue.length >= MAX_BATCH_SIZE) flush(false);
}
