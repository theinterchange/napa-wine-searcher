"use client";

import { Plus } from "lucide-react";

interface AddStopSlotProps {
  onClick: () => void;
  label?: string;
}

export function AddStopSlot({ onClick, label = "Add a stop" }: AddStopSlotProps) {
  return (
    <div className="relative flex items-center pl-[60px] py-1">
      <span aria-hidden className="absolute left-[28px] top-0 h-full w-px bg-[var(--border)]" />
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs text-[var(--muted-foreground)] transition-colors hover:border-burgundy-900 hover:text-burgundy-900"
      >
        <Plus className="h-3.5 w-3.5" />
        {label}
      </button>
    </div>
  );
}
