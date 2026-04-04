"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const RANGES = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
  { label: "All Time", value: "all" },
] as const;

export function DateRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("range") || "30d";

  const setRange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "30d") {
        params.delete("range");
      } else {
        params.set("range", value);
      }
      const qs = params.toString();
      router.push(qs ? `?${qs}` : "?", { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <div className="flex items-center gap-1 rounded-lg bg-[var(--muted)] p-1">
      {RANGES.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => setRange(value)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            current === value
              ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
