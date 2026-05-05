"use client";

import { useEffect } from "react";
import { recordImpression } from "@/lib/impression-beacon";

interface Props {
  path: string;
  pageType?: string;
  entityType?: string;
  entityId?: number;
  wineryId?: number;
  accommodationId?: number;
}

/**
 * Drop this into any page to record a client-side impression. The beacon
 * batches these and POSTs to /api/impressions/batch. Fires once on mount;
 * React strict-mode double-invocation is handled by the beacon queue itself
 * (same session/path hits dedupe client-side only — server accepts all).
 */
export function ImpressionBeacon({
  path,
  pageType,
  entityType,
  entityId,
  wineryId,
  accommodationId,
}: Props) {
  useEffect(() => {
    const viewedAt = new Date().toISOString();
    const referrer =
      typeof document !== "undefined" ? document.referrer || undefined : undefined;

    const fire = () =>
      recordImpression({
        path,
        pageType,
        entityType,
        entityId,
        wineryId,
        accommodationId,
        referrer,
        viewedAt,
      });

    // Defer to idle so the beacon doesn't compete with critical paint resources
    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const w = window as IdleWindow;
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(fire, { timeout: 2000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = setTimeout(fire, 0);
    return () => clearTimeout(id);
  }, [path, pageType, entityType, entityId, wineryId, accommodationId]);

  return null;
}
