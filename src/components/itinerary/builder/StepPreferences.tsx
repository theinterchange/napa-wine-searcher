"use client";

import { Check } from "lucide-react";
import { MustVisitPicker } from "./MustVisitPicker";
import type { BuilderState } from "./types";

/**
 * Amenities a user can toggle here. Dog/kid are handled separately —
 * they were already answered in Step 1, so we surface them as locked
 * "Confirmed from Step 1" chips rather than a second source of truth.
 */
const OPTIONAL_AMENITIES: Array<{ id: string; label: string; blurb: string }> = [
  {
    id: "sustainable",
    label: "Sustainable",
    blurb: "Biodynamic, organic, and regenerative estates.",
  },
  {
    id: "picnic",
    label: "Picnic-friendly",
    blurb: "Lawns and patios where you can bring a blanket.",
  },
  {
    id: "walkin",
    label: "Walk-ins welcome",
    blurb: "No reservation required.",
  },
];

interface StepPreferencesProps {
  state: BuilderState;
  update: (patch: Partial<BuilderState>) => void;
}

export function StepPreferences({ state, update }: StepPreferencesProps) {
  const toggle = (id: string) => {
    const next = new Set(state.amenities);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    update({ amenities: next });
  };

  const confirmed: Array<{ id: string; label: string }> = [];
  if (state.withDogs) confirmed.push({ id: "dog", label: "Dog-friendly" });
  if (state.withKids) confirmed.push({ id: "kid", label: "Kid-friendly" });

  return (
    <div className="space-y-8">
      {confirmed.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-semibold">
            Confirmed from Step 1
          </label>
          <p className="mb-3 text-xs text-[var(--muted-foreground)]">
            We&apos;ll prioritize wineries that have these — toggle them in
            Step 1 if this isn&apos;t right.
          </p>
          <ul className="flex flex-wrap gap-2">
            {confirmed.map((c) => (
              <li key={c.id}>
                <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-burgundy-900 bg-burgundy-900 px-3 text-xs font-semibold text-white">
                  <Check className="h-3 w-3" />
                  {c.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-semibold">
          Any other must-haves?
          <span className="ml-2 text-xs font-normal text-[var(--muted-foreground)]">
            optional
          </span>
        </label>
        <p className="mb-3 text-xs text-[var(--muted-foreground)]">
          Narrow the winery pool beyond what your vibe picked up.
        </p>
        <ul className="grid auto-rows-fr gap-3 sm:grid-cols-3">
          {OPTIONAL_AMENITIES.map((a) => {
            const active = state.amenities.has(a.id);
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => toggle(a.id)}
                  aria-pressed={active}
                  className={`flex h-full w-full flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-colors ${
                    active
                      ? "border-burgundy-900 bg-[var(--card)] ring-1 ring-burgundy-900"
                      : "border-[var(--border)] bg-[var(--card)] hover:border-burgundy-900/60"
                  }`}
                >
                  <span className="text-sm font-semibold">{a.label}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {a.blurb}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold">
          Must-visit wineries?
          <span className="ml-2 text-xs font-normal text-[var(--muted-foreground)]">
            up to 3, optional
          </span>
        </label>
        <p className="mb-3 text-xs text-[var(--muted-foreground)]">
          Pin up to three and we&apos;ll lock them in — the rest of the
          route fills in around them.
        </p>
        <MustVisitPicker
          selected={state.mustVisits}
          onChange={(next) => update({ mustVisits: next })}
        />
      </div>
    </div>
  );
}
