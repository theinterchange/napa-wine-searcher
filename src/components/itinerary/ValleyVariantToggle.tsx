"use client";

import { Mountain, TreePine, Globe } from "lucide-react";

type Variant = "napa" | "sonoma" | "both";

interface ValleyVariantToggleProps {
  value: Variant;
  available: Variant[];
  onChange: (next: Variant) => void;
  disabled?: boolean;
}

const OPTIONS: Array<{ id: Variant; label: string; icon: React.ReactNode }> = [
  { id: "napa", label: "Napa", icon: <Mountain className="h-3.5 w-3.5" /> },
  { id: "sonoma", label: "Sonoma", icon: <TreePine className="h-3.5 w-3.5" /> },
  { id: "both", label: "Both", icon: <Globe className="h-3.5 w-3.5" /> },
];

export function ValleyVariantToggle({
  value,
  available,
  onChange,
  disabled,
}: ValleyVariantToggleProps) {
  if (available.length <= 1) return null;

  return (
    <div
      className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--card)] p-0.5"
      role="tablist"
      aria-label="Valley variant"
    >
      {OPTIONS.map((opt) => {
        const enabled = available.includes(opt.id);
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled || !enabled}
            onClick={() => onChange(opt.id)}
            title={enabled ? "" : `No stops curated for ${opt.label}`}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-burgundy-900 text-white"
                : enabled
                ? "text-[var(--foreground)] hover:bg-[var(--muted)]"
                : "cursor-not-allowed text-[var(--muted-foreground)] opacity-40"
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
