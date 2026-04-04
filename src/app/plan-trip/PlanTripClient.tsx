"use client";

import { useState, useEffect, useMemo } from "react";
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

export interface HomeBase {
  name: string;
  slug: string;
  lat?: number;
  lng?: number;
  bookingUrl: string | null;
  websiteUrl: string | null;
}

interface PlanTripClientProps {
  initialFrom?: string;
  initialTheme?: string;
  initialStops?: string;
  initialValley?: string;
  autoWizard?: boolean;
  startLat?: string;
  startLng?: string;
  startName?: string;
  startSlug?: string;
  startBookingUrl?: string;
  startWebsiteUrl?: string;
}

export function PlanTripClient({
  initialFrom,
  initialTheme,
  initialStops,
  initialValley,
  autoWizard = false,
  startLat,
  startLng,
  startName,
  startSlug,
  startBookingUrl,
  startWebsiteUrl,
}: PlanTripClientProps) {
  const { data: session } = useSession();
  const router = useRouter();

  // Build home base from accommodation params
  const [homeBase] = useState<HomeBase | null>(() => {
    if (startName && startSlug) {
      return {
        name: decodeURIComponent(startName),
        slug: startSlug,
        lat: startLat ? parseFloat(startLat) : undefined,
        lng: startLng ? parseFloat(startLng) : undefined,
        bookingUrl: startBookingUrl ? decodeURIComponent(startBookingUrl) : null,
        websiteUrl: startWebsiteUrl ? decodeURIComponent(startWebsiteUrl) : null,
      };
    }
    return null;
  });

  // Build initial wizard params from accommodation starting point
  const accommodationWizardParams = useMemo<WizardParams | undefined>(() => {
    if (startLat && startLng && startName) {
      return {
        originLat: parseFloat(startLat),
        originLng: parseFloat(startLng),
        originLabel: decodeURIComponent(startName),
      };
    }
    return undefined;
  }, [startLat, startLng, startName]);

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
    const encoded = encodeWizardParams(params);
    const url = new URL(window.location.href);
    url.searchParams.set("wp", encoded);
    window.history.replaceState({}, "", url.toString());
  };

  const handleOpenWizard = () => {
    if (REQUIRE_AUTH_FOR_WIZARD && !session) {
      router.push("/login?callbackUrl=" + encodeURIComponent("/plan-trip?wizard=1"));
      return;
    }
    setShowWizard(true);
  };

  // Wizard-completed view
  if (wizardCompleted) {
    return (
      <div>
        {showWizard && (
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
        )}
        {!showWizard && (
          <TripPlanner
            initialFrom={initialFrom}
            initialTheme={initialTheme}
            initialStops={initialStops}
            initialValley={initialValley}
            wizardParams={wizardParams}
            homeBase={homeBase}
            onOpenWizard={() => {
              setWizardCompleted(false);
              setWizardParams(undefined);
              setEditStep(undefined);
              setShowWizard(true);
              const url = new URL(window.location.href);
              url.searchParams.delete("wp");
              window.history.replaceState({}, "", url.toString());
              try { sessionStorage.removeItem("trip-planner-route"); } catch {}
            }}
            onEditPreference={(step: number) => {
              setEditStep(step);
              setShowWizard(true);
            }}
            key="wizard-result"
          />
        )}
      </div>
    );
  }

  // Default view — controls + route immediately, wizard opens as overlay
  return (
    <div>
      {showWizard && (
        <div className="mb-8">
          <TripWizard
            onComplete={handleWizardComplete}
            onSkip={() => setShowWizard(false)}
            initialStep={editStep}
            initialParams={accommodationWizardParams}
          />
        </div>
      )}
      {!showWizard && (
        <TripPlanner
          initialFrom={initialFrom}
          initialTheme={initialTheme}
          initialStops={initialStops}
          initialValley={initialValley}
          homeBase={homeBase}
          onOpenWizard={handleOpenWizard}
        />
      )}
    </div>
  );
}
