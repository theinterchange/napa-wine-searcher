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
  }, [path, pageType, entityType, entityId, wineryId, accommodationId]);

  return null;
}
