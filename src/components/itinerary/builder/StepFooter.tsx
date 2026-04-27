"use client";

import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";

interface StepFooterProps {
  activeStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  submitting?: boolean;
}

export function StepFooter({
  activeStep,
  totalSteps,
  onBack,
  onNext,
  submitting = false,
}: StepFooterProps) {
  const isLast = activeStep === totalSteps - 1;
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-12 border-t border-[var(--border)] bg-[var(--background)]/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={activeStep === 0 || submitting}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-burgundy-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-burgundy-800 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Building your trip…
            </>
          ) : isLast ? (
            <>
              <Sparkles className="h-4 w-4" />
              Build my trip
            </>
          ) : (
            <>
              Next
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
