"use client";

import type { BuilderState, Vibe } from "./types";

/**
 * Six vibes — 2×3 grid, single-select. The set mixes occasion (friends,
 * bachelorette, celebration) and style (luxury, romantic, casual) so
 * users can speak to either how they're traveling or why they're out.
 * Amenity-like vibes (picnic, sustainable, family) moved to Step 1/5
 * to prevent the earlier overlap problem.
 */
const VIBES: Array<{ id: Vibe; label: string; blurb: string }> = [
  {
    id: "luxury",
    label: "Luxury",
    blurb: "High-end estates, reserved tastings, premium pricing.",
  },
  {
    id: "friends",
    label: "Friends weekend",
    blurb: "Easygoing rooms, walk-ins welcome, big-group-friendly.",
  },
  {
    id: "bachelorette",
    label: "Bachelor(ette)",
    blurb: "Lively tastings built for bigger parties.",
  },
  {
    id: "celebration",
    label: "Celebration",
    blurb: "Birthdays, anniversaries, and big-moment days.",
  },
  {
    id: "romantic",
    label: "Romantic",
    blurb: "Quieter rooms, slow afternoons, scenic views.",
  },
  {
    id: "casual",
    label: "Casual day",
    blurb: "Relaxed pacing, no pressure, walk-in friendly.",
  },
];

interface StepVibeProps {
  state: BuilderState;
  update: (patch: Partial<BuilderState>) => void;
}

export function StepVibe({ state, update }: StepVibeProps) {
  return (
    <ul className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {VIBES.map((v) => {
        const active = state.vibe === v.id;
        return (
          <li key={v.id}>
            <button
              type="button"
              onClick={() => update({ vibe: active ? null : v.id })}
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
  );
}
