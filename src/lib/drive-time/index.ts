import { freeEstimateProvider } from "./free-estimate";
import type { DriveTimeProvider, DriveTimeResult } from "./types";

const USE_LIVE = process.env.NEXT_PUBLIC_USE_LIVE_DRIVE_TIMES === "1";

export function getDriveTimeProvider(): DriveTimeProvider {
  if (USE_LIVE) {
    // Phase 8: swap in paid provider. Until then, fall back silently.
    return freeEstimateProvider;
  }
  return freeEstimateProvider;
}

export function formatDriveTimeLabel(result: DriveTimeResult): string {
  const m = Math.round(result.minutes);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function formatDriveTimeRange(result: DriveTimeResult): string {
  const lo = Math.round(result.minRangeMinutes);
  const hi = Math.round(result.maxRangeMinutes);
  return `${lo}–${hi} min`;
}

export function driveTimeSourceLabel(result: DriveTimeResult): string {
  switch (result.source) {
    case "free_estimate":
      return "Estimated";
    case "distance_matrix_live":
      return "Live traffic";
    case "distance_matrix_cached":
      return "Live traffic (cached)";
  }
}

export type { DriveTimeProvider, DriveTimeResult, DriveTimePoint } from "./types";
