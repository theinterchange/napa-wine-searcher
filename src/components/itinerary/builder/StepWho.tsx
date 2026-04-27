"use client";

import { Minus, Plus } from "lucide-react";
import type { BuilderState } from "./types";

interface StepWhoProps {
  state: BuilderState;
  update: (patch: Partial<BuilderState>) => void;
}

export function StepWho({ state, update }: StepWhoProps) {
  return (
    <div className="divide-y divide-[var(--border)]">
      <FieldRow
        label="How many of you?"
        hint="Tunes pacing and stop count."
      >
        <div className="inline-flex h-10 items-center rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <button
            type="button"
            aria-label="Decrease group size"
            onClick={() =>
              update({ groupSize: Math.max(1, state.groupSize - 1) })
            }
            disabled={state.groupSize <= 1}
            className="flex h-full w-10 items-center justify-center rounded-l-lg text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-sm font-semibold tabular-nums">
            {state.groupSize}
          </span>
          <button
            type="button"
            aria-label="Increase group size"
            onClick={() =>
              update({ groupSize: Math.min(20, state.groupSize + 1) })
            }
            disabled={state.groupSize >= 20}
            className="flex h-full w-10 items-center justify-center rounded-r-lg text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </FieldRow>

      <FieldRow label="Kids coming?" hint="We'll prioritize family-welcoming estates.">
        <YesNoSegment
          value={state.withKids}
          onChange={(v) => update({ withKids: v })}
        />
      </FieldRow>

      <FieldRow label="Dog coming?" hint="We'll flag dog-friendly patios and grounds.">
        <YesNoSegment
          value={state.withDogs}
          onChange={(v) => update({ withDogs: v })}
        />
      </FieldRow>
    </div>
  );
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{label}</div>
        <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">
          {hint}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/**
 * Tray-style segmented control — 40px total height to match the number
 * stepper and other inline inputs in this wizard. Accepts `boolean | null`
 * so tri-state questions (like "need a place to stay") can show unset.
 */
export function YesNoSegment({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      role="radiogroup"
      className="inline-flex h-10 items-center rounded-lg bg-[var(--muted)] p-1"
    >
      <SegmentButton active={value === true} onClick={() => onChange(true)}>
        Yes
      </SegmentButton>
      <SegmentButton active={value === false} onClick={() => onChange(false)}>
        No
      </SegmentButton>
    </div>
  );
}

function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`inline-flex h-8 items-center justify-center rounded-md px-4 text-xs font-semibold transition-all ${
        active
          ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      }`}
    >
      {children}
    </button>
  );
}
