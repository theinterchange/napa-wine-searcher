"use client";

import { useState } from "react";
import { Sparkles, ChevronRight } from "lucide-react";
import { TripPlanner } from "@/components/trip/TripPlanner";
import { TripWizard, type WizardParams } from "@/components/trip/TripWizard";

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
  const [showWizard, setShowWizard] = useState(autoWizard);
  const [wizardParams, setWizardParams] = useState<WizardParams | undefined>();
  const [wizardCompleted, setWizardCompleted] = useState(false);

  const handleWizardComplete = (params: WizardParams) => {
    setWizardParams(params);
    setWizardCompleted(true);
    setShowWizard(false);
  };

  const handleWizardSkip = () => {
    setShowWizard(false);
  };

  // If the wizard was completed, show the TripPlanner with wizard params
  // and don't show the CTA or quick-start label
  if (wizardCompleted) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-[var(--muted-foreground)]">
            Route personalized with your preferences.
          </p>
          <button
            onClick={() => {
              setWizardCompleted(false);
              setWizardParams(undefined);
              setShowWizard(true);
            }}
            className="text-sm text-burgundy-700 dark:text-burgundy-400 hover:underline"
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
          key="wizard-result"
        />
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
          />
        </div>
      ) : (
        /* Wizard CTA card */
        <button
          onClick={() => setShowWizard(true)}
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
