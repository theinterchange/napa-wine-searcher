"use client";

import { Scale } from "lucide-react";
import { useCompare } from "./CompareContext";
import { cn } from "@/lib/utils";

export function AddToCompareButton({
  wineryId,
  wineryName,
}: {
  wineryId: number;
  wineryName: string;
}) {
  const { toggle, isSelected, isFull } = useCompare();
  const selected = isSelected(wineryId);
  const disabled = !selected && isFull;

  return (
    <button
      onClick={() => toggle(wineryId, wineryName)}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        selected
          ? "bg-burgundy-100 text-burgundy-700 dark:bg-burgundy-900 dark:text-burgundy-300"
          : disabled
            ? "border border-[var(--border)] opacity-50 cursor-not-allowed"
            : "border border-[var(--border)] hover:bg-[var(--muted)]"
      )}
    >
      <Scale className={cn("h-4 w-4", selected && "text-burgundy-600")} />
      {selected ? "In Compare \u2713" : disabled ? "Compare Full" : "Add to Compare"}
    </button>
  );
}
