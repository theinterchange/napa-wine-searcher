"use client";

import { Route, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTripBuilder } from "@/components/trip/TripBuilderContext";

export function AddToTripDetailButton({
  wineryId,
  winerySlug,
  wineryName,
  compact,
}: {
  wineryId: number;
  winerySlug: string;
  wineryName: string;
  compact?: boolean;
}) {
  const { toggle, isSelected, isFull } = useTripBuilder();
  const selected = isSelected(wineryId);

  return (
    <button
      onClick={() => {
        if (!selected && isFull) return;
        toggle(wineryId, winerySlug, wineryName);
      }}
      title={
        compact
          ? selected
            ? "In your trip"
            : isFull
              ? "Trip is full (5 max)"
              : "Add to Trip"
          : undefined
      }
      className={cn(
        "flex items-center gap-2 rounded-lg text-sm font-medium transition-colors",
        compact ? "px-2.5 py-2" : "px-4 py-2",
        selected
          ? "bg-burgundy-100 text-burgundy-700 dark:bg-burgundy-900 dark:text-burgundy-300"
          : isFull
            ? "border border-[var(--border)] opacity-50 cursor-not-allowed"
            : "border border-[var(--border)] hover:bg-[var(--muted)]"
      )}
    >
      <Route className={cn("h-4 w-4", selected && "text-burgundy-600")} />
      {!compact && (selected ? "In Your Trip" : "Add to Trip")}
    </button>
  );
}
