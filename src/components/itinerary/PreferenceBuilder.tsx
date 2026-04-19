"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Heart, Baby, Dog, User, GlassWater, Loader2 } from "lucide-react";

type WhoOption = {
  id: string;
  label: string;
  description: string;
  Icon: typeof Users;
  amenities: string[];
  stopBias?: number;
};

const WHO_OPTIONS: WhoOption[] = [
  {
    id: "couple",
    label: "Couple's weekend",
    description: "Two people, savoring the pace",
    Icon: Heart,
    amenities: [],
  },
  {
    id: "friends",
    label: "Group of friends",
    description: "Bigger group, relaxed tastings",
    Icon: Users,
    amenities: ["walkin"],
  },
  {
    id: "family",
    label: "Family with kids",
    description: "Kid-welcoming stops with space",
    Icon: Baby,
    amenities: ["kid"],
  },
  {
    id: "dog",
    label: "Traveling with a dog",
    description: "Wineries that roll out the water bowls",
    Icon: Dog,
    amenities: ["dog"],
  },
  {
    id: "solo",
    label: "Solo",
    description: "A quiet, unhurried day",
    Icon: User,
    amenities: [],
  },
  {
    id: "bachelorette",
    label: "Bachelor(ette)",
    description: "Group celebration, bigger parties",
    Icon: GlassWater,
    amenities: ["walkin"],
  },
];

type DurationOption = {
  id: "half" | "full" | "extended";
  label: string;
  subline: string;
  timeBudget: "half" | "full" | "extended";
};

const DURATION_OPTIONS: DurationOption[] = [
  { id: "half", label: "Afternoon", subline: "2 stops", timeBudget: "half" },
  { id: "full", label: "Full day", subline: "3–4 stops", timeBudget: "full" },
  {
    id: "extended",
    label: "Weekend",
    subline: "4–5 stops + a place to stay",
    timeBudget: "extended",
  },
];

const MUST_HAVES = [
  { id: "dog", label: "Dog-friendly" },
  { id: "kid", label: "Kid-friendly" },
  { id: "picnic", label: "Picnic area" },
  { id: "walkin", label: "Walk-ins welcome" },
];

const VALLEYS = [
  { id: "", label: "Either" },
  { id: "napa", label: "Napa Valley" },
  { id: "sonoma", label: "Sonoma County" },
];

interface PreferenceBuilderProps {
  defaultValley?: string;
}

export function PreferenceBuilder({ defaultValley = "" }: PreferenceBuilderProps) {
  const router = useRouter();
  const [who, setWho] = useState<string | null>(null);
  const [duration, setDuration] = useState<DurationOption["id"] | null>(null);
  const [origin, setOrigin] = useState("");
  const [valley, setValley] = useState(defaultValley);
  const [mustHaves, setMustHaves] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedWho = WHO_OPTIONS.find((w) => w.id === who);
  const selectedDuration = DURATION_OPTIONS.find((d) => d.id === duration);

  const toggleMustHave = (id: string) => {
    setMustHaves((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canSubmit = !!selectedWho && !!selectedDuration && !submitting;

  const handleSubmit = async () => {
    if (!selectedWho || !selectedDuration) return;
    setSubmitting(true);
    setError(null);

    const amenities = Array.from(
      new Set([...selectedWho.amenities, ...mustHaves])
    ).join(",");
    const params = new URLSearchParams();
    params.set("timeBudget", selectedDuration.timeBudget);
    if (amenities) params.set("amenities", amenities);
    if (valley) params.set("valley", valley);

    try {
      const genRes = await fetch(`/api/routes/generate?${params.toString()}`);
      if (!genRes.ok) throw new Error(`Route generation failed (${genRes.status})`);
      const gen = await genRes.json();

      if (!gen.stops || gen.stops.length === 0) {
        setError(
          "No matching wineries — try broadening must-haves or picking the other valley."
        );
        setSubmitting(false);
        return;
      }

      const stopIds: number[] = gen.stops.map((s: { id: number }) => s.id);
      const forkRes = await fetch("/api/itineraries/fork", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          stops: stopIds,
          name: `${selectedWho.label}: ${selectedDuration.label}`,
          theme: selectedWho.id,
          valley: valley || null,
          origin: origin ? { lat: 0, lng: 0, label: origin } : null,
        }),
      });
      if (!forkRes.ok) throw new Error(`Fork failed (${forkRes.status})`);
      const fork = await forkRes.json();

      router.push(`/trips/${fork.shareCode}/edit`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <section className="mb-8">
        <h2 className="mb-4 font-serif text-xl font-semibold">Who's going?</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {WHO_OPTIONS.map((w) => {
            const Icon = w.Icon;
            const active = who === w.id;
            return (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => setWho(w.id)}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                    active
                      ? "border-burgundy-900 bg-[var(--card)] ring-1 ring-burgundy-900"
                      : "border-[var(--border)] bg-[var(--card)] hover:border-burgundy-900/60"
                  }`}
                >
                  <Icon
                    className={`mt-0.5 h-5 w-5 shrink-0 ${
                      active ? "text-burgundy-900" : "text-[var(--muted-foreground)]"
                    }`}
                  />
                  <div>
                    <div className="font-semibold">{w.label}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {w.description}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 font-serif text-xl font-semibold">How long?</h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {DURATION_OPTIONS.map((d) => {
            const active = duration === d.id;
            return (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => setDuration(d.id)}
                  className={`flex w-full flex-col rounded-2xl border p-4 text-left transition-colors ${
                    active
                      ? "border-burgundy-900 bg-[var(--card)] ring-1 ring-burgundy-900"
                      : "border-[var(--border)] bg-[var(--card)] hover:border-burgundy-900/60"
                  }`}
                >
                  <span className="font-semibold">{d.label}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {d.subline}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 font-serif text-xl font-semibold">Where are you starting?</h2>
        <div className="space-y-3">
          <input
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="Napa, Healdsburg, or the hotel where you're staying (optional)"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm outline-none focus:border-burgundy-900"
          />
          <div className="flex flex-wrap gap-2">
            {VALLEYS.map((v) => (
              <button
                key={v.id || "any"}
                type="button"
                onClick={() => setValley(v.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  valley === v.id
                    ? "border-burgundy-900 bg-burgundy-900 text-white"
                    : "border-[var(--border)] bg-[var(--card)] hover:border-burgundy-900"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-serif text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Must-haves (optional)
        </h2>
        <div className="flex flex-wrap gap-2">
          {MUST_HAVES.map((m) => {
            const active = mustHaves.has(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMustHave(m.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-burgundy-900 bg-burgundy-900 text-white"
                    : "border-[var(--border)] bg-[var(--card)] hover:border-burgundy-900"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </section>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </p>
      )}

      <div className="sticky bottom-4 flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-xl bg-burgundy-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-burgundy-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Building your trip…
            </>
          ) : (
            <>Build my trip</>
          )}
        </button>
      </div>
    </div>
  );
}
