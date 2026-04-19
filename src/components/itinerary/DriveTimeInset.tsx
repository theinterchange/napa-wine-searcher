"use client";

import type { DriveTimeResult } from "@/lib/drive-time";
import {
  driveTimeSourceLabel,
  formatDriveTimeLabel,
  formatDriveTimeRange,
} from "@/lib/drive-time";

interface DriveTimeInsetProps {
  result: DriveTimeResult;
}

export function DriveTimeInset({ result }: DriveTimeInsetProps) {
  const mid = formatDriveTimeLabel(result);
  const range = formatDriveTimeRange(result);
  const source = driveTimeSourceLabel(result);
  const miles = result.miles;

  return (
    <div className="relative flex items-center gap-3 pl-[60px] py-3 text-xs text-[var(--muted-foreground)]">
      <span aria-hidden className="absolute left-[28px] top-0 h-full w-px bg-[var(--border)]" />
      <span className="group relative inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
          <circle cx="6.5" cy="16.5" r="2.5" />
          <circle cx="16.5" cy="16.5" r="2.5" />
        </svg>
        <span className="font-medium text-[var(--foreground)]">{mid}</span>
        <span className="opacity-60">· {miles.toFixed(1)} mi</span>
        <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max -translate-x-1/2 rounded-md bg-[var(--foreground)] px-3 py-2 text-[11px] text-[var(--background)] shadow-lg group-hover:block group-focus-within:block">
          {range} — {source}
        </span>
      </span>
    </div>
  );
}
