"use client";

import { Route, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTripBuilder } from "@/components/trip/TripBuilderContext";

export function AddToTripDetailButton({
  wineryId,
  winerySlug,
  wineryName,
}: {
  wineryId: number;
  winerySlug: string;
  wineryName: string;
}) {
  const { toggle, isSelected, isFull } = useTripBuilder();
  const selected = isSelected(wineryId);

  return (
    <button
      onClick={() => {
        if (!selected && isFull) return;
        toggle(wineryId, winerySlug, wineryName);
      }}
      title={isFull && !selected ? "Trip is full (5 max)" : undefined}
      className={cn(
        "inline-flex items-center gap-2 px-3.5 py-2.5 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold transition-colors",
        selected
          ? "border border-burgundy-900 bg-burgundy-900 text-white hover:bg-burgundy-800"
          : isFull
            ? "border border-[var(--rule)] bg-[var(--paper)] text-[var(--ink-3)] opacity-50 cursor-not-allowed"
            : "border border-[var(--rule)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--brass)] hover:text-[var(--brass-2)]"
      )}
    >
      <Route className={cn("h-3.5 w-3.5", selected ? "text-white" : "text-[var(--brass)]")} />
      {selected ? "In Trip" : "Add Trip"}
    </button>
  );
}
