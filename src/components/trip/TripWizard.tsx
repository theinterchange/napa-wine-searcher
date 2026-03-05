"use client";

import { useState, useCallback } from "react";
import {
  MapPin,
  Calendar,
  Wine,
  DollarSign,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Navigation,
  Loader2,
  Check,
} from "lucide-react";

export interface WizardParams {
  originLat?: number;
  originLng?: number;
  originLabel?: string;
  dayOfWeek?: string;
  wineTypes?: string[];
  maxPriceLevel?: number;
  timeBudget?: "half" | "full" | "extended";
  anchorIds?: number[];
  anchorNames?: string[];
}

interface TripWizardProps {
  onComplete: (params: WizardParams) => void;
  onSkip: () => void;
}

const TOTAL_STEPS = 6;

const DAY_OPTIONS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const WINE_CATEGORIES = [
  { key: "Cabernet Sauvignon", label: "Cabernet Sauvignon", emoji: "red" },
  { key: "Pinot Noir", label: "Pinot Noir", emoji: "red" },
  { key: "Chardonnay", label: "Chardonnay", emoji: "white" },
  { key: "Sparkling", label: "Sparkling", emoji: "sparkling" },
  { key: "Rosé", label: "Rosé", emoji: "rosé" },
  { key: "Zinfandel", label: "Zinfandel", emoji: "red" },
  { key: "Red Blends", label: "Red Blends", emoji: "red" },
  { key: "White & Other", label: "White & Other", emoji: "white" },
];

const PRICE_OPTIONS = [
  { level: 1, label: "$", desc: "Budget-friendly" },
  { level: 2, label: "$$", desc: "Moderate" },
  { level: 3, label: "$$$", desc: "Premium" },
  { level: 4, label: "$$$$", desc: "Luxury" },
];

const TIME_OPTIONS = [
  {
    key: "half" as const,
    label: "Half Day",
    desc: "~3 hours, 2-3 stops",
    detail: "Perfect for a morning or afternoon",
  },
  {
    key: "full" as const,
    label: "Full Day",
    desc: "~6 hours, 3-5 stops",
    detail: "A complete wine country experience",
  },
  {
    key: "extended" as const,
    label: "Extended",
    desc: "~8 hours, 5-6 stops",
    detail: "The ultimate tasting marathon",
  },
];

interface AnchorWinery {
  id: number;
  name: string;
}

export function TripWizard({ onComplete, onSkip }: TripWizardProps) {
  const [step, setStep] = useState(1);

  // Step 1: Starting point
  const [originLabel, setOriginLabel] = useState("");
  const [originLat, setOriginLat] = useState<number | undefined>();
  const [originLng, setOriginLng] = useState<number | undefined>();
  const [geoLoading, setGeoLoading] = useState(false);

  // Step 2: Day of week
  const [dayOfWeek, setDayOfWeek] = useState<string | undefined>();

  // Step 3: Wine preferences
  const [selectedWines, setSelectedWines] = useState<string[]>([]);

  // Step 4: Budget
  const [maxPriceLevel, setMaxPriceLevel] = useState<number | undefined>();

  // Step 5: Time budget
  const [timeBudget, setTimeBudget] = useState<"half" | "full" | "extended" | undefined>();

  // Step 6: Must-visit anchors
  const [anchors, setAnchors] = useState<AnchorWinery[]>([]);
  const [anchorSearch, setAnchorSearch] = useState("");
  const [anchorResults, setAnchorResults] = useState<AnchorWinery[]>([]);
  const [anchorSearching, setAnchorSearching] = useState(false);

  // Summary view
  const [showSummary, setShowSummary] = useState(false);

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOriginLat(pos.coords.latitude);
        setOriginLng(pos.coords.longitude);
        setOriginLabel("Current location");
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
      }
    );
  }, []);

  const handleWineToggle = (key: string) => {
    setSelectedWines((prev) =>
      prev.includes(key) ? prev.filter((w) => w !== key) : [...prev, key]
    );
  };

  const handleAnchorSearch = useCallback(async (query: string) => {
    setAnchorSearch(query);
    if (query.length < 2) {
      setAnchorResults([]);
      return;
    }
    setAnchorSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setAnchorResults(
        (data.wineries || []).slice(0, 5).map((w: { id: number; name: string }) => ({
          id: w.id,
          name: w.name,
        }))
      );
    } catch {
      setAnchorResults([]);
    } finally {
      setAnchorSearching(false);
    }
  }, []);

  const addAnchor = (winery: AnchorWinery) => {
    if (anchors.length >= 2 || anchors.some((a) => a.id === winery.id)) return;
    setAnchors((prev) => [...prev, winery]);
    setAnchorSearch("");
    setAnchorResults([]);
  };

  const removeAnchor = (id: number) => {
    setAnchors((prev) => prev.filter((a) => a.id !== id));
  };

  const goNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      setShowSummary(true);
    }
  };

  const goBack = () => {
    if (showSummary) {
      setShowSummary(false);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleBuild = () => {
    const params: WizardParams = {};
    if (originLat != null && originLng != null) {
      params.originLat = originLat;
      params.originLng = originLng;
      params.originLabel = originLabel;
    }
    if (dayOfWeek) params.dayOfWeek = dayOfWeek;
    if (selectedWines.length > 0) params.wineTypes = selectedWines;
    if (maxPriceLevel != null) params.maxPriceLevel = maxPriceLevel;
    if (timeBudget) params.timeBudget = timeBudget;
    if (anchors.length > 0) {
      params.anchorIds = anchors.map((a) => a.id);
      params.anchorNames = anchors.map((a) => a.name);
    }
    onComplete(params);
  };

  const stepIcons = [MapPin, Calendar, Wine, DollarSign, Clock, Star];
  const stepTitles = [
    "Starting Point",
    "Day of Visit",
    "Wine Preferences",
    "Budget",
    "Time",
    "Must-Visit",
  ];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      {/* Progress bar */}
      <div className="border-b border-[var(--border)] px-5 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {showSummary ? "Review Your Preferences" : `Step ${step} of ${TOTAL_STEPS}`}
          </span>
          <button
            onClick={onSkip}
            className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Skip wizard
          </button>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < step || showSummary
                  ? "bg-burgundy-600 dark:bg-burgundy-500"
                  : "bg-[var(--border)]"
              }`}
            />
          ))}
        </div>
        {/* Step indicators */}
        <div className="flex justify-between mt-2">
          {stepIcons.map((Icon, i) => (
            <div
              key={i}
              className={`flex items-center gap-1 text-xs transition-colors ${
                i + 1 === step && !showSummary
                  ? "text-burgundy-700 dark:text-burgundy-400 font-medium"
                  : i + 1 < step || showSummary
                    ? "text-burgundy-600/60 dark:text-burgundy-500/60"
                    : "text-[var(--muted-foreground)]"
              }`}
            >
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{stepTitles[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="p-5 sm:p-8 min-h-[280px]">
        {showSummary ? (
          <SummaryPanel
            originLabel={originLabel}
            dayOfWeek={dayOfWeek}
            selectedWines={selectedWines}
            maxPriceLevel={maxPriceLevel}
            timeBudget={timeBudget}
            anchors={anchors}
          />
        ) : step === 1 ? (
          <StepStartingPoint
            originLabel={originLabel}
            setOriginLabel={setOriginLabel}
            originLat={originLat}
            originLng={originLng}
            geoLoading={geoLoading}
            onGeolocate={handleGeolocate}
          />
        ) : step === 2 ? (
          <StepDayOfWeek dayOfWeek={dayOfWeek} setDayOfWeek={setDayOfWeek} />
        ) : step === 3 ? (
          <StepWinePreferences
            selectedWines={selectedWines}
            onToggle={handleWineToggle}
            onClearAll={() => setSelectedWines([])}
          />
        ) : step === 4 ? (
          <StepBudget
            maxPriceLevel={maxPriceLevel}
            setMaxPriceLevel={setMaxPriceLevel}
          />
        ) : step === 5 ? (
          <StepTimeBudget timeBudget={timeBudget} setTimeBudget={setTimeBudget} />
        ) : (
          <StepAnchors
            anchors={anchors}
            anchorSearch={anchorSearch}
            anchorResults={anchorResults}
            anchorSearching={anchorSearching}
            onSearch={handleAnchorSearch}
            onAdd={addAnchor}
            onRemove={removeAnchor}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="border-t border-[var(--border)] px-5 py-3 flex items-center justify-between">
        <button
          onClick={goBack}
          disabled={step === 1 && !showSummary}
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        {showSummary ? (
          <button
            onClick={handleBuild}
            className="inline-flex items-center gap-2 rounded-lg bg-burgundy-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors"
          >
            Build My Route
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={goNext}
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Skip
            </button>
            <button
              onClick={goNext}
              className="inline-flex items-center gap-1 rounded-lg bg-burgundy-700 px-4 py-2 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Step 1: Starting Point ──────────────────────────────── */
function StepStartingPoint({
  originLabel,
  setOriginLabel,
  originLat,
  originLng,
  geoLoading,
  onGeolocate,
}: {
  originLabel: string;
  setOriginLabel: (v: string) => void;
  originLat?: number;
  originLng?: number;
  geoLoading: boolean;
  onGeolocate: () => void;
}) {
  const hasLocation = originLat != null && originLng != null;

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Where are you staying?</h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-6">
        We&apos;ll optimize your route starting from your location. You can skip
        this if you prefer.
      </p>

      <div className="max-w-md space-y-3">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={originLabel}
            onChange={(e) => setOriginLabel(e.target.value)}
            placeholder="Hotel name or address..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2.5 pl-10 pr-4 text-sm placeholder:text-[var(--muted-foreground)] focus:border-burgundy-500 focus:outline-none focus:ring-1 focus:ring-burgundy-500"
          />
        </div>

        <button
          onClick={onGeolocate}
          disabled={geoLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium hover:border-burgundy-400 dark:hover:border-burgundy-600 disabled:opacity-50 transition-colors"
        >
          {geoLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
          Use my location
        </button>

        {hasLocation && (
          <p className="text-sm text-burgundy-700 dark:text-burgundy-400 flex items-center gap-1">
            <Check className="h-4 w-4" />
            Location set: {originLabel || `${originLat!.toFixed(4)}, ${originLng!.toFixed(4)}`}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Step 2: Day of Week ─────────────────────────────────── */
function StepDayOfWeek({
  dayOfWeek,
  setDayOfWeek,
}: {
  dayOfWeek?: string;
  setDayOfWeek: (v: string | undefined) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">What day are you visiting?</h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-6">
        We&apos;ll only include wineries that are open on your chosen day.
      </p>

      <div className="flex flex-wrap gap-2">
        {DAY_OPTIONS.map((d) => (
          <button
            key={d.key}
            onClick={() => setDayOfWeek(dayOfWeek === d.key ? undefined : d.key)}
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
              dayOfWeek === d.key
                ? "bg-burgundy-700 text-white"
                : "border border-[var(--border)] hover:border-burgundy-400 dark:hover:border-burgundy-600"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {dayOfWeek && (
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">
          Selected: <strong>{DAY_OPTIONS.find((d) => d.key === dayOfWeek)?.label}</strong>
        </p>
      )}
    </div>
  );
}

/* ── Step 3: Wine Preferences ────────────────────────────── */
function StepWinePreferences({
  selectedWines,
  onToggle,
  onClearAll,
}: {
  selectedWines: string[];
  onToggle: (key: string) => void;
  onClearAll: () => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">What wines do you enjoy?</h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-6">
        Select your favorites and we&apos;ll prioritize wineries known for those varietals.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {WINE_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onToggle(cat.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selectedWines.includes(cat.key)
                ? "bg-burgundy-700 text-white"
                : "border border-[var(--border)] hover:border-burgundy-400 dark:hover:border-burgundy-600"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <button
        onClick={onClearAll}
        className={`text-sm transition-colors ${
          selectedWines.length === 0
            ? "text-burgundy-700 dark:text-burgundy-400 font-medium"
            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        }`}
      >
        No preference
      </button>

      {selectedWines.length > 0 && (
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">
          Selected: {selectedWines.join(", ")}
        </p>
      )}
    </div>
  );
}

/* ── Step 4: Budget ──────────────────────────────────────── */
function StepBudget({
  maxPriceLevel,
  setMaxPriceLevel,
}: {
  maxPriceLevel?: number;
  setMaxPriceLevel: (v: number | undefined) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">What&apos;s your budget?</h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-6">
        We&apos;ll filter wineries by tasting price range.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {PRICE_OPTIONS.map((p) => (
          <button
            key={p.level}
            onClick={() =>
              setMaxPriceLevel(maxPriceLevel === p.level ? undefined : p.level)
            }
            className={`rounded-xl border p-4 text-center transition-colors ${
              maxPriceLevel === p.level
                ? "border-burgundy-600 bg-burgundy-50 dark:bg-burgundy-950/30"
                : "border-[var(--border)] hover:border-burgundy-400 dark:hover:border-burgundy-600"
            }`}
          >
            <div className="text-lg font-bold">{p.label}</div>
            <div className="text-xs text-[var(--muted-foreground)]">{p.desc}</div>
          </button>
        ))}
      </div>

      <button
        onClick={() => setMaxPriceLevel(undefined)}
        className={`text-sm transition-colors ${
          maxPriceLevel == null
            ? "text-burgundy-700 dark:text-burgundy-400 font-medium"
            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        }`}
      >
        No preference
      </button>
    </div>
  );
}

/* ── Step 5: Time Budget ─────────────────────────────────── */
function StepTimeBudget({
  timeBudget,
  setTimeBudget,
}: {
  timeBudget?: "half" | "full" | "extended";
  setTimeBudget: (v: "half" | "full" | "extended" | undefined) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">How much time do you have?</h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-6">
        We&apos;ll adjust the number of stops to fit your schedule.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {TIME_OPTIONS.map((t) => (
          <button
            key={t.key}
            onClick={() =>
              setTimeBudget(timeBudget === t.key ? undefined : t.key)
            }
            className={`rounded-xl border p-5 text-left transition-colors ${
              timeBudget === t.key
                ? "border-burgundy-600 bg-burgundy-50 dark:bg-burgundy-950/30"
                : "border-[var(--border)] hover:border-burgundy-400 dark:hover:border-burgundy-600"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-burgundy-600 dark:text-burgundy-400" />
              <span className="font-bold">{t.label}</span>
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">{t.desc}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">{t.detail}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Step 6: Must-Visit Anchors ──────────────────────────── */
function StepAnchors({
  anchors,
  anchorSearch,
  anchorResults,
  anchorSearching,
  onSearch,
  onAdd,
  onRemove,
}: {
  anchors: AnchorWinery[];
  anchorSearch: string;
  anchorResults: AnchorWinery[];
  anchorSearching: boolean;
  onSearch: (q: string) => void;
  onAdd: (w: AnchorWinery) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Any must-visit wineries?</h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-6">
        Pin up to 2 wineries that you definitely want to include in your route.
      </p>

      {/* Selected anchors */}
      {anchors.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {anchors.map((a) => (
            <span
              key={a.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-burgundy-100 dark:bg-burgundy-900/30 px-3 py-1.5 text-sm font-medium text-burgundy-800 dark:text-burgundy-300"
            >
              <Star className="h-3.5 w-3.5" />
              {a.name}
              <button
                onClick={() => onRemove(a.id)}
                className="ml-0.5 hover:text-burgundy-600 dark:hover:text-burgundy-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      {anchors.length < 2 && (
        <div className="max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={anchorSearch}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search wineries..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2.5 pl-10 pr-4 text-sm placeholder:text-[var(--muted-foreground)] focus:border-burgundy-500 focus:outline-none focus:ring-1 focus:ring-burgundy-500"
            />
            {anchorSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[var(--muted-foreground)]" />
            )}
          </div>

          {/* Search results dropdown */}
          {anchorResults.length > 0 && (
            <div className="mt-1 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg overflow-hidden">
              {anchorResults.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onAdd(r)}
                  disabled={anchors.some((a) => a.id === r.id)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--accent)] disabled:opacity-50 transition-colors border-b border-[var(--border)] last:border-0"
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Summary Panel ───────────────────────────────────────── */
function SummaryPanel({
  originLabel,
  dayOfWeek,
  selectedWines,
  maxPriceLevel,
  timeBudget,
  anchors,
}: {
  originLabel: string;
  dayOfWeek?: string;
  selectedWines: string[];
  maxPriceLevel?: number;
  timeBudget?: "half" | "full" | "extended";
  anchors: AnchorWinery[];
}) {
  const items: { icon: typeof MapPin; label: string; value: string }[] = [];

  if (originLabel) {
    items.push({ icon: MapPin, label: "Starting from", value: originLabel });
  }
  if (dayOfWeek) {
    items.push({
      icon: Calendar,
      label: "Day",
      value: DAY_OPTIONS.find((d) => d.key === dayOfWeek)?.label || dayOfWeek,
    });
  }
  if (selectedWines.length > 0) {
    items.push({ icon: Wine, label: "Wines", value: selectedWines.join(", ") });
  }
  if (maxPriceLevel != null) {
    const p = PRICE_OPTIONS.find((p) => p.level === maxPriceLevel);
    items.push({ icon: DollarSign, label: "Budget", value: `${p?.label} (${p?.desc})` });
  }
  if (timeBudget) {
    const t = TIME_OPTIONS.find((t) => t.key === timeBudget);
    items.push({ icon: Clock, label: "Time", value: t?.label || timeBudget });
  }
  if (anchors.length > 0) {
    items.push({
      icon: Star,
      label: "Must-visit",
      value: anchors.map((a) => a.name).join(", "),
    });
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Your Preferences</h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-6">
        Review your selections below, then click &quot;Build My Route&quot; to generate your
        personalized itinerary.
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          No preferences set — we&apos;ll generate a great default route for you.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <item.icon className="h-4 w-4 mt-0.5 text-burgundy-600 dark:text-burgundy-400 shrink-0" />
              <div>
                <span className="text-sm font-medium">{item.label}: </span>
                <span className="text-sm text-[var(--muted-foreground)]">
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
