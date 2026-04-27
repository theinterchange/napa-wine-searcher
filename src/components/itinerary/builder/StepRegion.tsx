"use client";

import { SUB_REGIONS } from "@/lib/itinerary/sub-regions";
import type { BuilderState, Valley } from "./types";

const VALLEYS: Array<{ id: Valley; label: string; blurb: string }> = [
  {
    id: "",
    label: "Napa + Sonoma",
    blurb: "Anywhere in Wine Country works.",
  },
  {
    id: "napa",
    label: "Napa Valley",
    blurb: "Silverado Trail, Highway 29, the classic valley floor.",
  },
  {
    id: "sonoma",
    label: "Sonoma County",
    blurb: "Russian River, Dry Creek, Healdsburg, and the coast.",
  },
];

interface StepRegionProps {
  state: BuilderState;
  update: (patch: Partial<BuilderState>) => void;
}

export function StepRegion({ state, update }: StepRegionProps) {
  const eligibleSubRegions =
    state.valley === "napa" || state.valley === "sonoma"
      ? SUB_REGIONS.filter((r) => r.valley === state.valley)
      : [];

  const toggleSubRegion = (slug: string) => {
    const next = new Set(state.subRegions);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    update({ subRegions: next });
  };

  return (
    <div className="space-y-8">
      <ul className="grid auto-rows-fr gap-3 sm:grid-cols-3">
        {VALLEYS.map((v) => {
          const active = state.valley === v.id;
          return (
            <li key={v.id || "any"}>
              <button
                type="button"
                onClick={() =>
                  update({
                    valley: v.id,
                    // Clear sub-regions when switching valleys.
                    subRegions: new Set<string>(),
                  })
                }
                aria-pressed={active}
                className={`flex h-full w-full flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-colors ${
                  active
                    ? "border-burgundy-900 bg-[var(--card)] ring-1 ring-burgundy-900"
                    : "border-[var(--border)] bg-[var(--card)] hover:border-burgundy-900/60"
                }`}
              >
                <span className="font-serif text-base font-semibold">
                  {v.label}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {v.blurb}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {eligibleSubRegions.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">
                Pin one or more sub-regions
                <span className="ml-2 text-xs font-normal text-[var(--muted-foreground)]">
                  optional
                </span>
              </h3>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                Focus your day on specific AVAs. Leave empty for the full
                valley.
              </p>
            </div>
            {state.subRegions.size > 0 && (
              <button
                type="button"
                onClick={() => update({ subRegions: new Set<string>() })}
                className="text-xs font-medium text-[var(--muted-foreground)] underline-offset-2 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <ul className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {eligibleSubRegions.map((r) => {
              const active = state.subRegions.has(r.slug);
              return (
                <li key={r.slug}>
                  <button
                    type="button"
                    onClick={() => toggleSubRegion(r.slug)}
                    aria-pressed={active}
                    className={`flex h-full w-full flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-colors ${
                      active
                        ? "border-burgundy-900 bg-[var(--card)] ring-1 ring-burgundy-900"
                        : "border-[var(--border)] bg-[var(--card)] hover:border-burgundy-900/60"
                    }`}
                  >
                    <span className="text-sm font-semibold">{r.name}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {r.blurb}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
