"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  Flag,
} from "lucide-react";
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export interface WizardParams {
  originLat?: number;
  originLng?: number;
  originLabel?: string;
  originAddress?: string;
  endLat?: number;
  endLng?: number;
  endLabel?: string;
  endAddress?: string;
  dayOfWeek?: string;
  wineTypes?: string[];
  priceLevels?: number[];
  amenities?: string[];
  timeBudget?: "half" | "full" | "extended";
  anchorIds?: number[];
  anchorNames?: string[];
}

interface TripWizardProps {
  onComplete: (params: WizardParams) => void;
  onSkip: () => void;
  onSaveStep?: (params: WizardParams) => void;
  initialStep?: number;
  initialParams?: WizardParams;
}

const TOTAL_STEPS = 8;

const AMENITY_OPTIONS = [
  { key: "dog", label: "Dog-Friendly" },
  { key: "kid", label: "Kid-Friendly" },
  { key: "picnic", label: "Picnic-Friendly" },
  { key: "walkin", label: "Walk-in (No Reservation)" },
];

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

export function TripWizard(props: TripWizardProps) {
  if (GOOGLE_MAPS_API_KEY) {
    return (
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={["places"]}>
        <TripWizardInner {...props} />
      </APIProvider>
    );
  }
  return <TripWizardInner {...props} />;
}

function TripWizardInner({ onComplete, onSkip, onSaveStep, initialStep, initialParams }: TripWizardProps) {
  const [step, setStep] = useState(initialStep ?? 1);

  // Step 1: Starting point
  const [originLabel, setOriginLabel] = useState(initialParams?.originLabel ?? "");
  const [originLat, setOriginLat] = useState<number | undefined>(initialParams?.originLat);
  const [originLng, setOriginLng] = useState<number | undefined>(initialParams?.originLng);
  const [originAddress, setOriginAddress] = useState(initialParams?.originAddress ?? "");
  const [geoLoading, setGeoLoading] = useState(false);

  // Step 2: Ending point
  const [endLabel, setEndLabel] = useState(initialParams?.endLabel ?? "");
  const [endLat, setEndLat] = useState<number | undefined>(initialParams?.endLat);
  const [endLng, setEndLng] = useState<number | undefined>(initialParams?.endLng);
  const [endAddress, setEndAddress] = useState(initialParams?.endAddress ?? "");

  // Step 3: Day of week (multi-select)
  const [selectedDays, setSelectedDays] = useState<string[]>(
    initialParams?.dayOfWeek ? initialParams.dayOfWeek.split(",") : []
  );

  // Step 4: Wine preferences
  const [selectedWines, setSelectedWines] = useState<string[]>(initialParams?.wineTypes ?? []);

  // Step 5: Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialParams?.amenities ?? []);

  // Step 6: Budget
  const [priceLevels, setPriceLevels] = useState<number[]>(initialParams?.priceLevels ?? []);

  // Step 7: Time budget
  const [timeBudget, setTimeBudget] = useState<"half" | "full" | "extended" | undefined>(initialParams?.timeBudget);

  // Step 8: Must-visit anchors
  const [anchors, setAnchors] = useState<AnchorWinery[]>(
    initialParams?.anchorIds && initialParams?.anchorNames
      ? initialParams.anchorIds.map((id, i) => ({ id, name: initialParams.anchorNames![i] }))
      : []
  );
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

  const handleDayToggle = (key: string) => {
    setSelectedDays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

  const handleWineToggle = (key: string) => {
    setSelectedWines((prev) =>
      prev.includes(key) ? prev.filter((w) => w !== key) : [...prev, key]
    );
  };

  const handleAmenityToggle = (key: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    );
  };

  const handlePriceLevelToggle = (level: number) => {
    setPriceLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
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

  const buildParams = (): WizardParams => {
    const params: WizardParams = {};
    if (originLat != null && originLng != null) {
      params.originLat = originLat;
      params.originLng = originLng;
      params.originLabel = originLabel;
      if (originAddress) params.originAddress = originAddress;
    }
    if (endLat != null && endLng != null) {
      params.endLat = endLat;
      params.endLng = endLng;
      params.endLabel = endLabel;
      if (endAddress) params.endAddress = endAddress;
    }
    if (selectedDays.length > 0) params.dayOfWeek = selectedDays.join(",");
    if (selectedWines.length > 0) params.wineTypes = selectedWines;
    if (selectedAmenities.length > 0) params.amenities = selectedAmenities;
    if (priceLevels.length > 0) params.priceLevels = priceLevels;
    if (timeBudget) params.timeBudget = timeBudget;
    if (anchors.length > 0) {
      params.anchorIds = anchors.map((a) => a.id);
      params.anchorNames = anchors.map((a) => a.name);
    }
    return params;
  };

  const handleBuild = () => {
    onComplete(buildParams());
  };

  const stepIcons = [MapPin, Flag, Calendar, Wine, Check, DollarSign, Clock, Star];
  const stepTitles = [
    "Starting Point",
    "Ending Point",
    "Day of Visit",
    "Wine Preferences",
    "Amenities",
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
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:border-burgundy-400 dark:hover:border-burgundy-600 hover:text-[var(--foreground)] transition-colors"
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
            endLabel={endLabel}
            endLat={endLat}
            endLng={endLng}
            selectedDays={selectedDays}
            selectedWines={selectedWines}
            selectedAmenities={selectedAmenities}
            priceLevels={priceLevels}
            timeBudget={timeBudget}
            anchors={anchors}
          />
        ) : step === 1 ? (
          <StepStartingPoint
            originLabel={originLabel}
            setOriginLabel={setOriginLabel}
            originLat={originLat}
            originLng={originLng}
            setOriginLat={setOriginLat}
            setOriginLng={setOriginLng}
            originAddress={originAddress}
            setOriginAddress={setOriginAddress}
            geoLoading={geoLoading}
            onGeolocate={handleGeolocate}
          />
        ) : step === 2 ? (
          <StepEndingPoint
            endLabel={endLabel}
            setEndLabel={setEndLabel}
            endLat={endLat}
            endLng={endLng}
            setEndLat={setEndLat}
            setEndLng={setEndLng}
            endAddress={endAddress}
            setEndAddress={setEndAddress}
            originLabel={originLabel}
            originLat={originLat}
            originLng={originLng}
          />
        ) : step === 3 ? (
          <StepDayOfWeek
            selectedDays={selectedDays}
            onToggle={handleDayToggle}
            onClearAll={() => setSelectedDays([])}
          />
        ) : step === 4 ? (
          <StepWinePreferences
            selectedWines={selectedWines}
            onToggle={handleWineToggle}
            onClearAll={() => setSelectedWines([])}
          />
        ) : step === 5 ? (
          <StepAmenities
            selectedAmenities={selectedAmenities}
            onToggle={handleAmenityToggle}
            onClearAll={() => setSelectedAmenities([])}
          />
        ) : step === 6 ? (
          <StepBudget
            priceLevels={priceLevels}
            onToggle={handlePriceLevelToggle}
            onClearAll={() => setPriceLevels([])}
          />
        ) : step === 7 ? (
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
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:border-burgundy-400 dark:hover:border-burgundy-600 hover:text-[var(--foreground)] disabled:opacity-30 transition-colors"
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
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted-foreground)] hover:border-burgundy-400 dark:hover:border-burgundy-600 hover:text-[var(--foreground)] transition-colors"
            >
              Skip
            </button>
            {initialStep != null && step === initialStep && onSaveStep ? (
              <button
                onClick={() => onSaveStep(buildParams())}
                className="inline-flex items-center gap-2 rounded-lg bg-burgundy-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors"
              >
                Save & Update Route
              </button>
            ) : (
              <button
                onClick={goNext}
                className="inline-flex items-center gap-1 rounded-lg bg-burgundy-700 px-4 py-2 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Places Autocomplete Input ───────────────────────────── */
function PlacesAutocompleteInput({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (label: string, lat: number, lng: number, address?: string) => void;
}) {
  const places = useMapsLibrary("places");
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const dummyDiv = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!places) return;
    autocompleteService.current = new places.AutocompleteService();
    if (!dummyDiv.current) {
      dummyDiv.current = document.createElement("div");
    }
    placesService.current = new places.PlacesService(dummyDiv.current);
  }, [places]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInput = (text: string) => {
    onChange(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!autocompleteService.current || text.length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      autocompleteService.current!.getPlacePredictions(
        {
          input: text,
          locationBias: {
            center: { lat: 38.5, lng: -122.4 },
            radius: 50000,
          } as google.maps.places.LocationBias,
        },
        (results) => {
          setPredictions(results || []);
          setShowDropdown((results || []).length > 0);
        }
      );
    }, 300);
  };

  const handleSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return;
    placesService.current.getDetails(
      { placeId: prediction.place_id, fields: ["geometry", "formatted_address", "name"] },
      (place) => {
        if (place?.geometry?.location) {
          const label = place.name || place.formatted_address || prediction.description;
          onSelect(label, place.geometry.location.lat(), place.geometry.location.lng(), place.formatted_address || undefined);
        }
      }
    );
    setShowDropdown(false);
    setPredictions([]);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
      <input
        type="text"
        value={value}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => predictions.length > 0 && setShowDropdown(true)}
        placeholder="Hotel name or address..."
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2.5 pl-10 pr-4 text-sm placeholder:text-[var(--muted-foreground)] focus:border-burgundy-500 focus:outline-none focus:ring-1 focus:ring-burgundy-500"
      />
      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg overflow-hidden">
          {predictions.map((p) => (
            <button
              key={p.place_id}
              onClick={() => handleSelect(p)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--accent)] transition-colors border-b border-[var(--border)] last:border-0"
            >
              <span className="font-medium">{p.structured_formatting.main_text}</span>
              <span className="text-[var(--muted-foreground)] ml-1 text-xs">
                {p.structured_formatting.secondary_text}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Step 1: Starting Point ──────────────────────────────── */
function StepStartingPoint({
  originLabel,
  setOriginLabel,
  originLat,
  originLng,
  setOriginLat,
  setOriginLng,
  originAddress,
  setOriginAddress,
  geoLoading,
  onGeolocate,
}: {
  originLabel: string;
  setOriginLabel: (v: string) => void;
  originLat?: number;
  originLng?: number;
  setOriginLat: (v: number | undefined) => void;
  setOriginLng: (v: number | undefined) => void;
  originAddress: string;
  setOriginAddress: (v: string) => void;
  geoLoading: boolean;
  onGeolocate: () => void;
}) {
  const hasLocation = originLat != null && originLng != null;

  const handlePlaceSelect = (label: string, lat: number, lng: number, address?: string) => {
    setOriginLabel(label);
    setOriginLat(lat);
    setOriginLng(lng);
    setOriginAddress(address ?? "");
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Where are you staying?</h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-6">
        We&apos;ll optimize your route starting from your location. You can skip
        this if you prefer.
      </p>

      <div className="max-w-md space-y-3">
        {GOOGLE_MAPS_API_KEY ? (
          <PlacesAutocompleteInput
            value={originLabel}
            onChange={(v) => {
              setOriginLabel(v);
              // Clear coordinates when manually editing
              if (hasLocation) {
                setOriginLat(undefined);
                setOriginLng(undefined);
                setOriginAddress("");
              }
            }}
            onSelect={handlePlaceSelect}
          />
        ) : (
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
        )}

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
          <div className="text-sm text-burgundy-700 dark:text-burgundy-400 flex items-center gap-1">
            <Check className="h-4 w-4 shrink-0" />
            <span>
              Location set: {originLabel || `${originLat!.toFixed(4)}, ${originLng!.toFixed(4)}`}
              {originAddress && (
                <span className="text-[var(--muted-foreground)]"> · {originAddress}</span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Step 2: Ending Point ────────────────────────────────── */
function StepEndingPoint({
  endLabel,
  setEndLabel,
  endLat,
  endLng,
  setEndLat,
  setEndLng,
  endAddress,
  setEndAddress,
  originLabel,
  originLat,
  originLng,
}: {
  endLabel: string;
  setEndLabel: (v: string) => void;
  endLat?: number;
  endLng?: number;
  setEndLat: (v: number | undefined) => void;
  setEndLng: (v: number | undefined) => void;
  endAddress: string;
  setEndAddress: (v: string) => void;
  originLabel: string;
  originLat?: number;
  originLng?: number;
}) {
  const hasEnd = endLat != null && endLng != null;
  const hasOrigin = originLat != null && originLng != null;

  const handlePlaceSelect = (label: string, lat: number, lng: number, address?: string) => {
    setEndLabel(label);
    setEndLat(lat);
    setEndLng(lng);
    setEndAddress(address ?? "");
  };

  const handleReturnToStart = () => {
    if (hasOrigin) {
      setEndLabel(originLabel || "Starting point");
      setEndLat(originLat);
      setEndLng(originLng);
    }
  };

  const handleClear = () => {
    setEndLabel("");
    setEndLat(undefined);
    setEndLng(undefined);
    setEndAddress("");
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Where are you headed after?</h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-6">
        Optional — hotel, restaurant, or next destination. We&apos;ll optimize the route to end nearby.
      </p>

      <div className="max-w-md space-y-3">
        {GOOGLE_MAPS_API_KEY ? (
          <PlacesAutocompleteInput
            value={endLabel}
            onChange={(v) => {
              setEndLabel(v);
              if (hasEnd) {
                setEndLat(undefined);
                setEndLng(undefined);
                setEndAddress("");
              }
            }}
            onSelect={handlePlaceSelect}
          />
        ) : (
          <div className="relative">
            <Flag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={endLabel}
              onChange={(e) => setEndLabel(e.target.value)}
              placeholder="Hotel, restaurant, or address..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2.5 pl-10 pr-4 text-sm placeholder:text-[var(--muted-foreground)] focus:border-burgundy-500 focus:outline-none focus:ring-1 focus:ring-burgundy-500"
            />
          </div>
        )}

        {hasOrigin && !hasEnd && (
          <button
            onClick={handleReturnToStart}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium hover:border-burgundy-400 dark:hover:border-burgundy-600 transition-colors"
          >
            <Navigation className="h-4 w-4" />
            Return to starting point
          </button>
        )}

        {hasEnd && (
          <div className="flex items-center gap-2">
            <div className="text-sm text-burgundy-700 dark:text-burgundy-400 flex items-center gap-1">
              <Check className="h-4 w-4 shrink-0" />
              <span>
                Ending at: {endLabel || `${endLat!.toFixed(4)}, ${endLng!.toFixed(4)}`}
                {endAddress && (
                  <span className="text-[var(--muted-foreground)]"> · {endAddress}</span>
                )}
              </span>
            </div>
            <button
              onClick={handleClear}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Step 3: Day of Week ─────────────────────────────────── */
function StepDayOfWeek({
  selectedDays,
  onToggle,
  onClearAll,
}: {
  selectedDays: string[];
  onToggle: (key: string) => void;
  onClearAll: () => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">What day(s) are you visiting?</h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-6">
        Select one or more days. We&apos;ll only include wineries open on at least one of your chosen days.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onClearAll}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            selectedDays.length === 0
              ? "bg-burgundy-700 text-white"
              : "border border-[var(--border)] hover:border-burgundy-400 dark:hover:border-burgundy-600"
          }`}
        >
          Any day
        </button>
        {DAY_OPTIONS.map((d) => (
          <button
            key={d.key}
            onClick={() => onToggle(d.key)}
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
              selectedDays.includes(d.key)
                ? "bg-burgundy-700 text-white"
                : "border border-[var(--border)] hover:border-burgundy-400 dark:hover:border-burgundy-600"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {selectedDays.length > 0 && (
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">
          Selected: <strong>{selectedDays.map((k) => DAY_OPTIONS.find((d) => d.key === k)?.label).join(", ")}</strong>
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

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onClearAll}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            selectedWines.length === 0
              ? "bg-burgundy-700 text-white"
              : "border border-[var(--border)] hover:border-burgundy-400 dark:hover:border-burgundy-600"
          }`}
        >
          No preference
        </button>
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

      {selectedWines.length > 0 && (
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">
          Selected: {selectedWines.join(", ")}
        </p>
      )}
    </div>
  );
}

/* ── Step 4: Amenities ───────────────────────────────────── */
function StepAmenities({
  selectedAmenities,
  onToggle,
  onClearAll,
}: {
  selectedAmenities: string[];
  onToggle: (key: string) => void;
  onClearAll: () => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Any must-have amenities?</h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-6">
        We&apos;ll only show wineries that match your requirements.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onClearAll}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            selectedAmenities.length === 0
              ? "bg-burgundy-700 text-white"
              : "border border-[var(--border)] hover:border-burgundy-400 dark:hover:border-burgundy-600"
          }`}
        >
          No preference
        </button>
        {AMENITY_OPTIONS.map((a) => (
          <button
            key={a.key}
            onClick={() => onToggle(a.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selectedAmenities.includes(a.key)
                ? "bg-burgundy-700 text-white"
                : "border border-[var(--border)] hover:border-burgundy-400 dark:hover:border-burgundy-600"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {selectedAmenities.length > 0 && (
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">
          Selected: {selectedAmenities.map((k) => AMENITY_OPTIONS.find((a) => a.key === k)?.label).join(", ")}
        </p>
      )}
    </div>
  );
}

/* ── Step 5: Budget ──────────────────────────────────────── */
function StepBudget({
  priceLevels,
  onToggle,
  onClearAll,
}: {
  priceLevels: number[];
  onToggle: (level: number) => void;
  onClearAll: () => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">What type of experience?</h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-6">
        Select one or more tasting price tiers. You can pick multiple.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {PRICE_OPTIONS.map((p) => (
          <button
            key={p.level}
            onClick={() => onToggle(p.level)}
            className={`rounded-xl border p-4 text-center transition-colors ${
              priceLevels.includes(p.level)
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
        onClick={onClearAll}
        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
          priceLevels.length === 0
            ? "bg-burgundy-700 text-white"
            : "border border-[var(--border)] hover:border-burgundy-400 dark:hover:border-burgundy-600"
        }`}
      >
        No preference
      </button>

      {priceLevels.length > 0 && (
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">
          Selected: {priceLevels.sort((a, b) => a - b).map((l) => "$".repeat(l)).join(", ")}
        </p>
      )}
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
  endLabel,
  endLat,
  endLng,
  selectedDays,
  selectedWines,
  selectedAmenities,
  priceLevels,
  timeBudget,
  anchors,
}: {
  originLabel: string;
  endLabel: string;
  endLat?: number;
  endLng?: number;
  selectedDays: string[];
  selectedWines: string[];
  selectedAmenities: string[];
  priceLevels: number[];
  timeBudget?: "half" | "full" | "extended";
  anchors: AnchorWinery[];
}) {
  const items: { icon: typeof MapPin; label: string; value: string }[] = [];

  if (originLabel) {
    items.push({ icon: MapPin, label: "Starting from", value: originLabel });
  }
  if (endLat != null && endLng != null && endLabel) {
    items.push({ icon: Flag, label: "Ending at", value: endLabel });
  }
  if (selectedDays.length > 0) {
    items.push({
      icon: Calendar,
      label: selectedDays.length === 1 ? "Day" : "Days",
      value: selectedDays.map((k) => DAY_OPTIONS.find((d) => d.key === k)?.label).join(", "),
    });
  }
  if (selectedWines.length > 0) {
    items.push({ icon: Wine, label: "Wines", value: selectedWines.join(", ") });
  }
  if (selectedAmenities.length > 0) {
    items.push({
      icon: Check,
      label: "Amenities",
      value: selectedAmenities.map((k) => AMENITY_OPTIONS.find((a) => a.key === k)?.label).join(", "),
    });
  }
  if (priceLevels.length > 0) {
    items.push({
      icon: DollarSign,
      label: "Budget",
      value: priceLevels.sort((a, b) => a - b).map((l) => {
        const p = PRICE_OPTIONS.find((p) => p.level === l);
        return `${p?.label} (${p?.desc})`;
      }).join(", "),
    });
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
