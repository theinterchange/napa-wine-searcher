"use client";

import { Info } from "lucide-react";

interface SourceTooltipProps {
  label: string;
  source: string | null;
  note?: string | null;
}

export function SourceTooltip({ label, source, note }: SourceTooltipProps) {
  if (!source && !note) return null;
  return (
    <span className="group relative inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)] px-2.5 py-1 text-xs text-[var(--foreground)]">
      {label}
      <Info className="h-3 w-3 text-[var(--muted-foreground)]" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max max-w-xs -translate-x-1/2 rounded-md bg-[var(--foreground)] px-3 py-2 text-[11px] text-[var(--background)] shadow-lg group-hover:block group-focus-within:block">
        {note && <span className="block">{note}</span>}
        {source && (
          <a
            href={source}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto mt-1 block underline"
          >
            View source
          </a>
        )}
      </span>
    </span>
  );
}
