"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Filter, X, ChevronDown, ArrowUpDown } from "lucide-react";
import { MultiSelectDropdown } from "@/components/ui/MultiSelectDropdown";
import type { DropdownOption } from "@/components/ui/MultiSelectDropdown";

const VALLEY_OPTIONS: DropdownOption[] = [
  { value: "napa", label: "Napa Valley" },
  { value: "sonoma", label: "Sonoma County" },
];

const TYPE_OPTIONS: DropdownOption[] = [
  { value: "hotel", label: "Hotel" },
  { value: "inn", label: "Inn" },
  { value: "resort", label: "Resort" },
  { value: "bed_and_breakfast", label: "B&B" },
  { value: "vacation_rental", label: "Vacation Rental" },
];

const STAR_OPTIONS: DropdownOption[] = [
  { value: "5", label: "5-Star" },
  { value: "4", label: "4-Star" },
  { value: "3", label: "3-Star" },
  { value: "2", label: "2-Star" },
];

const FEATURE_OPTIONS: DropdownOption[] = [
  { value: "dog", label: "Pet Friendly" },
  { value: "adultsOnly", label: "Adults Only" },
];

const SORT_OPTIONS: DropdownOption[] = [
  { value: "rating", label: "Highest Rated" },
  { value: "name", label: "Name A-Z" },
  { value: "reviews", label: "Most Reviews" },
];

export function AccommodationFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const valley = searchParams.get("valley") || "";
  const type = searchParams.get("type") || "";
  const stars = searchParams.get("stars") || "";
  const features = searchParams.get("features") || "";
  const sort = searchParams.get("sort") || "";

  const selectedValleys = valley ? valley.split(",") : [];
  const selectedTypes = type ? type.split(",") : [];
  const selectedStars = stars ? stars.split(",") : [];
  const selectedFeatures = features ? features.split(",") : [];
  const selectedSort = sort ? [sort] : [];

  const updateParam = useCallback(
    (key: string, values: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (values.length > 0) {
        params.set(key, values.join(","));
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/where-to-stay?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = () => {
    router.push("/where-to-stay");
  };

  const hasFilters = valley || type || stars || features;

  // Active filter tags
  const activeFilters: { key: string; label: string; paramValue?: string }[] = [];

  for (const v of selectedValleys) {
    const opt = VALLEY_OPTIONS.find((o) => o.value === v);
    activeFilters.push({ key: "valley", label: opt?.label || v, paramValue: v });
  }
  for (const t of selectedTypes) {
    const opt = TYPE_OPTIONS.find((o) => o.value === t);
    activeFilters.push({ key: "type", label: opt?.label || t, paramValue: t });
  }
  for (const s of selectedStars) {
    const opt = STAR_OPTIONS.find((o) => o.value === s);
    activeFilters.push({ key: "stars", label: opt?.label || `${s}-Star`, paramValue: s });
  }
  for (const f of selectedFeatures) {
    const opt = FEATURE_OPTIONS.find((o) => o.value === f);
    activeFilters.push({ key: "features", label: opt?.label || f, paramValue: f });
  }

  const removeFilter = (key: string, paramValue?: string) => {
    if (!paramValue) {
      updateParam(key, []);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    const current = params.get(key)?.split(",").filter(Boolean) || [];
    const updated = current.filter((v) => v !== paramValue);
    if (updated.length > 0) {
      params.set(key, updated.join(","));
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/where-to-stay?${params.toString()}`);
  };

  const filterControls = (
    <div className="flex flex-wrap items-center gap-2">
      <MultiSelectDropdown
        label="Region"
        options={VALLEY_OPTIONS}
        selected={selectedValleys}
        onChange={(v) => updateParam("valley", v)}
      />
      <MultiSelectDropdown
        label="Type"
        options={TYPE_OPTIONS}
        selected={selectedTypes}
        onChange={(v) => updateParam("type", v)}
      />
      <MultiSelectDropdown
        label="Star Rating"
        options={STAR_OPTIONS}
        selected={selectedStars}
        onChange={(v) => updateParam("stars", v)}
      />
      <MultiSelectDropdown
        label="Features"
        options={FEATURE_OPTIONS}
        selected={selectedFeatures}
        onChange={(v) => updateParam("features", v)}
      />
      <MultiSelectDropdown
        label="Sort"
        options={SORT_OPTIONS}
        selected={selectedSort}
        onChange={(v) => updateParam("sort", v.length > 0 ? v : [])}
        multiSelect={false}
        icon={ArrowUpDown}
        variant="sort"
      />
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Clear all
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-3 mb-8">
      {/* Desktop: always visible */}
      <div className="hidden md:block">{filterControls}</div>

      {/* Mobile: collapsible */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex w-full items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-medium"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[var(--muted-foreground)]" />
            <span>Filters</span>
            {activeFilters.length > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-burgundy-700 px-2 py-0.5 text-xs font-medium text-white">
                {activeFilters.length}
              </span>
            )}
          </div>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${mobileOpen ? "rotate-180" : ""}`}
          />
        </button>
        {mobileOpen && <div className="mt-3">{filterControls}</div>}
      </div>

      {/* Active filter tags */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map(({ key, label, paramValue }, i) => (
            <button
              key={`${key}-${paramValue || i}`}
              onClick={() => removeFilter(key, paramValue)}
              className="inline-flex items-center gap-1 rounded-full bg-burgundy-100 dark:bg-burgundy-900 px-3 py-1 text-xs font-medium text-burgundy-800 dark:text-burgundy-200 hover:bg-burgundy-200 dark:hover:bg-burgundy-800 transition-colors"
            >
              {label}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
