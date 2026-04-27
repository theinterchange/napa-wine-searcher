"use client";

import { Check } from "lucide-react";
import { STEP_TITLES } from "./types";

interface StepHeaderProps {
  activeStep: number;
  completedThrough: number;
  onJump: (step: number) => void;
}

/**
 * Horizontal progress stepper — flex-wraps gracefully on narrow screens
 * instead of horizontally scrolling. Labels are short single words that
 * always fit on desktop; on mobile the full row wraps to two lines.
 */
export function StepHeader({
  activeStep,
  completedThrough,
  onJump,
}: StepHeaderProps) {
  return (
    <nav aria-label="Trip builder progress">
      <ol className="flex flex-wrap items-center gap-y-2">
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
