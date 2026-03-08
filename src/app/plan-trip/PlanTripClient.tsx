"use client";

import { useState, useEffect } from "react";
import { Sparkles, ChevronRight } from "lucide-react";
import { TripPlanner } from "@/components/trip/TripPlanner";
import { TripWizard, type WizardParams } from "@/components/trip/TripWizard";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const REQUIRE_AUTH_FOR_WIZARD = false;

function encodeWizardParams(params: WizardParams): string {
  return btoa(JSON.stringify(params));
}

function decodeWizardParams(encoded: string): WizardParams | null {
  try {
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
}

interface PlanTripClientProps {
  initialFrom?: string;
  initialTheme?: string;
  initialStops?: string;
  initialValley?: string;
  autoWizard?: boolean;
}

export function PlanTripClient({
  initialFrom,
  initialTheme,
  initialStops,
  initialValley,
  autoWizard = false,
}: PlanTripClientProps) {
  const { data: session } = useSession();
  const router = useRouter();

  // Restore wizard params from URL on mount
  const [restoredFromUrl] = useState<{ params?: WizardParams; completed: boolean }>(() => {
    if (typeof window === "undefined") return { completed: false };
    const url = new URL(window.location.href);
    const wp = url.searchParams.get("wp");
    if (wp) {
      const decoded = decodeWizardParams(wp);
      if (decoded) return { params: decoded, completed: true };
    }
    return { completed: false };
  });

  const [showWizard, setShowWizard] = useState(
    autoWizard && !restoredFromUrl.completed
  );
  const [wizardParams, setWizardParams] = useState<WizardParams | undefined>(
    restoredFromUrl.params
  );
  const [wizardCompleted, setWizardCompleted] = useState(
    restoredFromUrl.completed
  );
  const [editStep, setEditStep] = useState<number | undefined>();

  const handleWizardComplete = (params: WizardParams) => {
    setWizardParams(params);
    setWizardCompleted(true);
    setShowWizard(false);
    setEditStep(undefined);
    // Persist to URL for browser back navigation
    const encoded = encodeWizardParams(params);
    const url = new URL(window.location.href);
    url.searchParams.set("wp", encoded);
    window.history.replaceState({}, "", url.toString());
  };

  const handleWizardSkip = () => {
    setShowWizard(false);
  };

  const handleWizardCTAClick = () => {
    if (REQUIRE_AUTH_FOR_WIZARD && !session) {
      router.push("/login?callbackUrl=" + encodeURIComponent("/plan-trip?wizard=1"));
      return;
    }
    setShowWizard(true);
  };

  // If the wizard was completed, show the TripPlanner with wizard params
  // and don't show the CTA or quick-start label
  if (wizardCompleted) {
    return (
      <div>
        {showWizard ? (
          <div className="mb-8">
            <TripWizard
              onComplete={handleWizardComplete}
              onSkip={() => {
                setShowWizard(false);
                setEditStep(undefined);
              }}
              onSaveStep={handleWizardComplete}
              initialStep={editStep}
              initialParams={wizardParams}
            />
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-[var(--muted-foreground)]">
                Route personalized with your preferences.
              </p>
              <button
                onClick={() => {
                  setWizardCompleted(false);
                  setWizardParams(undefined);
                  setEditStep(undefined);
                  setShowWizard(true);
                  // Clear URL state
                  const url = new URL(window.location.href);
                  url.searchParams.delete("wp");
                  window.history.replaceState({}, "", url.toString());
                  // Clear session cache
                  try { sessionStorage.removeItem("trip-planner-route"); } catch {}
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:border-burgundy-400 dark:hover:border-burgundy-600 transition-colors"
              >
                Start over with wizard
              </button>
            </div>
            <TripPlanner
              initialFrom={initialFrom}
              initialTheme={initialTheme}
              initialStops={initialStops}
              initialValley={initialValley}
              wizardParams={wizardParams}
              onEditPreference={(step: number) => {
                setEditStep(step);
                setShowWizard(true);
              }}
              key="wizard-result"
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Wizard view */}
      {showWizard ? (
        <div className="mb-8">
          <TripWizard
            onComplete={handleWizardComplete}
            onSkip={handleWizardSkip}
            initialStep={editStep}
          />
        </div>
      ) : (
        /* Wizard CTA card */
        <button
          onClick={handleWizardCTAClick}
          className="w-full mb-8 group rounded-xl border border-burgundy-200 dark:border-burgundy-800 bg-gradient-to-r from-burgundy-50 to-burgundy-100/50 dark:from-burgundy-950/40 dark:to-burgundy-900/20 p-6 text-left hover:border-burgundy-400 dark:hover:border-burgundy-600 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-burgundy-100 dark:bg-burgundy-900/50 text-burgundy-700 dark:text-burgundy-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--foreground)]">
                  Plan My Perfect Day
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Answer a few quick questions and we&apos;ll build a personalized route just for you
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-[var(--muted-foreground)] group-hover:text-burgundy-600 dark:group-hover:text-burgundy-400 transition-colors" />
          </div>
        </button>
      )}

      {/* Quick-start label + controls */}
      {!showWizard && (
        <>
          <p className="text-sm font-medium text-[var(--muted-foreground)] mb-3">
            Or jump right in:
          </p>
          <TripPlanner
            initialFrom={initialFrom}
            initialTheme={initialTheme}
            initialStops={initialStops}
            initialValley={initialValley}
          />
        </>
      )}
    </div>
  );
}
