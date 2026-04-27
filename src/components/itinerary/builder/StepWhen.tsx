"use client";

import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { BuilderOriginInput } from "./BuilderOriginInput";
import { YesNoSegment } from "./StepWho";
import type { BuilderState, Duration } from "./types";

const DURATIONS: Array<{ id: Duration; label: string; blurb: string }> = [
  { id: "half", label: "Half day", blurb: "2 stops, afternoon pour." },
  { id: "full", label: "Full day", blurb: "3–4 stops with lunch." },
  {
    id: "extended",
    label: "Overnight",
    blurb: "Multi-day with a place to stay.",
  },
];

interface StepWhenProps {
  state: BuilderState;
  update: (patch: Partial<BuilderState>) => void;
}

export function StepWhen({ state, update }: StepWhenProps) {
  // Overnight implies needing a stay — pre-answer it for smoother flow.
  useEffect(() => {
    if (state.duration === "extended" && state.needsStay === null) {
      update({ needsStay: true });
    }
  }, [state.duration, state.needsStay, update]);

  return (
    <div className="space-y-8">
      <div>
        <label className="mb-3 block text-sm font-semibold">
          How long is the trip?
        </label>
        <ul className="grid auto-rows-fr gap-3 sm:grid-cols-3">
          {DURATIONS.map((d) => {
            const active = state.duration === d.id;
            return (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => update({ duration: d.id })}
                  aria-pressed={active}
                  className={`flex h-full w-full flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-colors ${
                    active
                      ? "border-burgundy-900 bg-[var(--card)] ring-1 ring-burgundy-900"
                      : "border-[var(--border)] bg-[var(--card)] hover:border-burgundy-900/60"
                  }`}
                >
                  <span className="font-serif text-base font-semibold">
                    {d.label}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {d.blurb}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <label className="mb-3 block text-sm font-semibold">
          Where are you starting from?
        </label>
        <BuilderOriginInput
          value={state.origin}
          label={state.originLabel}
          onChange={(origin, label) => update({ origin, originLabel: label })}
        />
      </div>

      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">
              Need a place to stay?
            </div>
            <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              We&apos;ll weave hotel picks into the trip and handle booking
              through our partners.
            </div>
          </div>
          <div className="shrink-0">
            <YesNoSegment
              value={state.needsStay}
              onChange={(v) => update({ needsStay: v })}
            />
          </div>
        </div>
        {state.needsStay === true && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-burgundy-900/30 bg-[color-mix(in_srgb,var(--muted)_35%,transparent)] p-4">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-burgundy-900" />
            <p className="text-xs text-[var(--foreground)]">
              <span className="font-semibold">
                We&apos;ll pick hotels for you.
              </span>{" "}
              Once your wineries are drafted, we&apos;ll surface hotels near
              your stops — rated, vetted, and bookable with one tap.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
