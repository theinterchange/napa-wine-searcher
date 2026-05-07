"use client";

import { Check } from "lucide-react";
import { STEP_TITLES } from "./types";

interface StepHeaderProps {
  activeStep: number;
  completedThrough: number;
  onJump: (step: number) => void;
}

/**
 * Mobile: compact "Step N of 5" label + thin brass progress bar — keeps the
 * top of the wizard readable instead of a 5-chip flex-wrap mess. Desktop
 * keeps the editorial chip-row with dividers and clickable completed steps.
 */
export function StepHeader({
  activeStep,
  completedThrough,
  onJump,
}: StepHeaderProps) {
  const total = STEP_TITLES.length;
  const progressPct = ((activeStep + 1) / total) * 100;

  return (
    <nav aria-label="Trip builder progress">
      {/* Mobile compact stepper */}
      <div className="sm:hidden">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--brass-2)]">
            Step {activeStep + 1} of {total}
          </span>
          <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
            {STEP_TITLES[activeStep]}
          </span>
        </div>
        <div className="mt-2 h-[3px] w-full bg-[var(--rule-soft)] overflow-hidden">
          <div
            className="h-full bg-[var(--brass)] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Desktop full chip stepper */}
      <ol className="hidden sm:flex flex-wrap items-center gap-y-2">
        {STEP_TITLES.map((title, i) => {
          const isActive = i === activeStep;
          const isDone = i <= completedThrough && !isActive;
          const isClickable = isDone;
          return (
            <li key={title} className="flex items-center">
              <button
                type="button"
                onClick={() => isClickable && onJump(i)}
                disabled={!isClickable && !isActive}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors ${
                  isActive
                    ? "bg-burgundy-900 text-white"
                    : isDone
                    ? "text-[var(--foreground)] hover:bg-[var(--muted)]"
                    : "text-[var(--muted-foreground)]"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : isDone
                      ? "bg-burgundy-900 text-white"
                      : "border border-[var(--border)] text-[var(--muted-foreground)]"
                  }`}
                >
                  {isDone ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className="text-xs font-semibold">{title}</span>
              </button>
              {i < STEP_TITLES.length - 1 && (
                <span
                  aria-hidden
                  className={`mx-1 h-px w-4 sm:w-8 ${
                    i < activeStep ? "bg-burgundy-900" : "bg-[var(--border)]"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
