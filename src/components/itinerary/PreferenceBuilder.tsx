"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StepHeader } from "./builder/StepHeader";
import { StepFooter } from "./builder/StepFooter";
import { StepWho } from "./builder/StepWho";
import { StepVibe } from "./builder/StepVibe";
import { StepRegion } from "./builder/StepRegion";
import { StepWhen } from "./builder/StepWhen";
import { StepPreferences } from "./builder/StepPreferences";
import {
  DEFAULT_STATE,
  STEP_HINTS,
  STEP_TITLES,
  type BuilderState,
  type Valley,
  type Vibe,
} from "./builder/types";

interface PreferenceBuilderProps {
  defaultValley?: string;
}

/**
 * Vibe → amenity mapping. Single-select. Friends/casual/bachelorette all
 * suggest walk-ins (easier for groups, less rigid day). Luxury applies
 * a hard priceLevel filter separately in runGenerate. Romantic and
 * celebration are cosmetic — they shape the trip name and feel but
 * don't constrain the winery pool.
 */
const VIBE_AMENITIES: Partial<Record<Vibe, string[]>> = {
  friends: ["walkin"],
  bachelorette: ["walkin"],
  casual: ["walkin"],
};

export function PreferenceBuilder({
  defaultValley = "",
}: PreferenceBuilderProps) {
  const router = useRouter();

  const [state, setState] = useState<BuilderState>(() => ({
    ...DEFAULT_STATE,
    valley:
      defaultValley === "napa" || defaultValley === "sonoma"
        ? (defaultValley as Valley)
        : "",
  }));
  const [activeStep, setActiveStep] = useState(0);
  const [completedThrough, setCompletedThrough] = useState(-1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(
    (patch: Partial<BuilderState>) => setState((s) => ({ ...s, ...patch })),
    []
  );

  const amenityParam = useMemo(() => {
    const set = new Set<string>(state.amenities);
    if (state.withKids) set.add("kid");
    if (state.withDogs) set.add("dog");
    if (state.vibe) {
      for (const a of VIBE_AMENITIES[state.vibe] ?? []) set.add(a);
    }
    return Array.from(set).join(",");
  }, [state.amenities, state.withKids, state.withDogs, state.vibe]);

  const runGenerate = async (strict: boolean): Promise<{
    stops: Array<{ id: number }>;
  }> => {
    const params = new URLSearchParams();
    params.set("timeBudget", state.duration);
    if (amenityParam) params.set("amenities", amenityParam);
    if (state.valley) params.set("valley", state.valley);
    if (state.subRegions.size > 0) {
      params.set("subRegion", Array.from(state.subRegions).join(","));
    }
    if (state.origin) {
      params.set("originLat", String(state.origin.lat));
      params.set("originLng", String(state.origin.lng));
    }
    if (state.vibe === "luxury") {
      params.set("priceLevels", "3,4");
    }
    if (state.mustVisits.length > 0) {
      params.set("anchorIds", state.mustVisits.map((m) => m.id).join(","));
    }
    if (strict) params.set("strictSources", "1");

    const res = await fetch(`/api/routes/generate?${params.toString()}`);
    if (!res.ok) throw new Error(`Route generation failed (${res.status})`);
    return res.json();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const forceStrict = state.vibe === "luxury";
      let gen = await runGenerate(true);
      if ((!gen.stops || gen.stops.length < 2) && !forceStrict) {
        gen = await runGenerate(false);
      }

      if (!gen.stops || gen.stops.length === 0) {
        setError(
          "No matching wineries — try a different vibe or a broader region."
        );
        setSubmitting(false);
        return;
      }

      const stopIds: number[] = gen.stops.map((s) => s.id);
      const tripName = deriveTripName(state);
      const forkBody = {
        stops: stopIds,
        name: tripName,
        theme: state.vibe ?? null,
        valley: state.valley || null,
        origin: state.origin
          ? {
              lat: state.origin.lat,
              lng: state.origin.lng,
              label: state.origin.label ?? null,
            }
          : null,
      };
      const forkRes = await fetch("/api/itineraries/fork", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(forkBody),
      });
      if (!forkRes.ok) {
        const bodyText = await forkRes.text().catch(() => "");
        console.error("Fork failed:", forkRes.status, bodyText, forkBody);
        throw new Error(
          `Fork failed (${forkRes.status}): ${bodyText}`
        );
      }
      const fork = await forkRes.json();

      // Signal the trip page to open the stay picker AND encode builder
      // context (dogs / kids / vibe) so the picker can score and pre-filter
      // matches without re-fetching state.
      const params = new URLSearchParams();
      if (state.needsStay === true) params.set("stay", "1");
      if (state.withDogs) params.set("dogs", "1");
      if (state.withKids) params.set("kids", "1");
      if (state.vibe) params.set("vibe", state.vibe);
      const qs = params.toString();
      router.push(`/trips/${fork.shareCode}/edit${qs ? `?${qs}` : ""}`);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setSubmitting(false);
    }
  };

  const advance = () => {
    setCompletedThrough((c) => Math.max(c, activeStep));
    if (activeStep < STEP_TITLES.length - 1) {
      setActiveStep(activeStep + 1);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      void handleSubmit();
    }
  };

  const goBack = () => {
    if (activeStep > 0) setActiveStep(activeStep - 1);
  };

  const jump = (next: number) => {
    if (next <= completedThrough + 1) setActiveStep(next);
  };

  return (
    <div>
      <header className="mb-10">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-[2.25rem]">
          Build your trip
        </h1>
      </header>

      <StepHeader
        activeStep={activeStep}
        completedThrough={completedThrough}
        onJump={jump}
      />

      <section className="mt-10">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            Step {activeStep + 1} of {STEP_TITLES.length}
          </p>
          <h2 className="mt-2 font-serif text-2xl font-semibold leading-tight tracking-tight">
            {STEP_TITLES[activeStep]}
          </h2>
          <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
            {STEP_HINTS[activeStep]}
          </p>
        </header>

        {activeStep === 0 && <StepWho state={state} update={update} />}
        {activeStep === 1 && <StepVibe state={state} update={update} />}
        {activeStep === 2 && <StepRegion state={state} update={update} />}
        {activeStep === 3 && <StepWhen state={state} update={update} />}
        {activeStep === 4 && (
          <StepPreferences state={state} update={update} />
        )}

        {error && (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            {error}
          </p>
        )}
      </section>

      <StepFooter
        activeStep={activeStep}
        totalSteps={STEP_TITLES.length}
        onBack={goBack}
        onNext={advance}
        submitting={submitting}
      />
    </div>
  );
}

function deriveTripName(state: BuilderState): string {
  if (state.origin?.label) return `Trip from ${state.origin.label}`;
  if (state.originLabel) return `Trip from ${state.originLabel}`;
  const region =
    state.valley === "napa"
      ? "Napa"
      : state.valley === "sonoma"
      ? "Sonoma"
      : "Wine Country";
  const durationLabel =
    state.duration === "half"
      ? "Half day"
      : state.duration === "extended"
      ? "Overnight"
      : "Full day";
  return `${durationLabel} in ${region}`;
}
