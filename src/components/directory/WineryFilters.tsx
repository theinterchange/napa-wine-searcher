"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Filter, X, ChevronDown, ArrowUpDown } from "lucide-react";
import { MultiSelectDropdown } from "@/components/ui/MultiSelectDropdown";
import { TASTING_PRICE_TIERS, AMENITY_OPTIONS } from "@/lib/filters";
import type { DropdownOption } from "@/components/ui/MultiSelectDropdown";

interface SubRegion {
  slug: string;
  name: string;
  valley: string;
}

interface WineType {
  id: number;
  name: string;
  count: number;
}

const VALLEY_OPTIONS: DropdownOption[] = [
  { value: "napa", label: "Napa Valley" },
  { value: "sonoma", label: "Sonoma County" },
];

const RATING_OPTIONS: DropdownOption[] = [
  { value: "4.5", label: "4.5+ Stars" },
  { value: "4.0", label: "4.0+ Stars" },
  { value: "3.5", label: "3.5+ Stars" },
];

const SORT_OPTIONS: DropdownOption[] = [
  { value: "rating", label: "Highest Rated" },
  { value: "name", label: "Name A-Z" },
  { value: "price-asc", label: "Price Low\u2192High" },
  { value: "price-desc", label: "Price High\u2192Low" },
  { value: "reviews", label: "Most Reviews" },
];

export function WineryFilters({
  subRegions,
  wineTypes = [],
}: {
  subRegions: SubRegion[];
  wineTypes?: WineType[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Read current params
  const valley = searchParams.get("valley") || "";
  const region = searchParams.get("region") || "";
  const rating = searchParams.get("rating") || "";
  const sort = searchParams.get("sort") || "rating";
  const varietal = searchParams.get("varietal") || "";
  const tastingPrice = searchParams.get("tastingPrice") || "";
  const amenities = searchParams.get("amenities") || "";

  const selectedValleys = valley ? valley.split(",") : [];
  const selectedRegions = region ? region.split(",") : [];
  const selectedRating = rating ? [rating] : [];
  const selectedSort = sort ? [sort] : ["rating"];
  const selectedVarietals = varietal ? varietal.split(",") : [];
  const selectedTastingPrices = tastingPrice ? tastingPrice.split(",") : [];
  const selectedAmenities = amenities ? amenities.split(",") : [];

  const updateParam = useCallback(
    (key: string, values: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (values.length > 0) {
        params.set(key, values.join(","));
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/wineries?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = () => {
    router.push("/wineries");
  };

  const hasFilters =
    valley || region || rating || varietal || tastingPrice || amenities;

  // Filter regions by selected valley(s)
  const filteredRegions =
    selectedValleys.length > 0
      ? subRegions.filter((r) => selectedValleys.includes(r.valley))
      : subRegions;

  const regionOptions: DropdownOption[] = filteredRegions.map((r) => ({
    value: r.slug,
    label: r.name,
  }));

  const priceOptions: DropdownOption[] = TASTING_PRICE_TIERS.map((t) => ({
    value: t.key,
    label: t.label,
    sublabel: t.sublabel,
  }));

  const varietalOptions: DropdownOption[] = wineTypes.map((wt) => ({
    value: wt.name.toLowerCase().replace(/\s+/g, "-"),
    label: wt.name,
    sublabel: `(${wt.count})`,
  }));

  const amenityOptions: DropdownOption[] = AMENITY_OPTIONS.map((a) => ({
    value: a.value,
    label: a.label,
  }));

  // When valley changes, clear regions that are no longer valid
  const handleValleyChange = useCallback(
    (values: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (values.length > 0) {
        params.set("valley", values.join(","));
        // Clear invalid regions
        const validSlugs = subRegions
          .filter((r) => values.includes(r.valley))
          .map((r) => r.slug);
        const currentRegions =
          params.get("region")?.split(",").filter(Boolean) || [];
        const stillValid = currentRegions.filter((r) =>
          validSlugs.includes(r)
        );
        if (stillValid.length > 0) {
          params.set("region", stillValid.join(","));
        } else {
          params.delete("region");
        }
      } else {
        params.delete("valley");
      }
      params.delete("page");
      router.push(`/wineries?${params.toString()}`);
    },
    [router, searchParams, subRegions]
  );

  // Build active filter tags
  const activeFilters: { key: string; label: string; paramValue?: string }[] =
    [];

  for (const v of selectedValleys) {
    const opt = VALLEY_OPTIONS.find((o) => o.value === v);
    activeFilters.push({ key: "valley", label: opt?.label || v, paramValue: v });
  }
  for (const r of selectedRegions) {
    const sr = subRegions.find((s) => s.slug === r);
    activeFilters.push({ key: "region", label: sr?.name || r, paramValue: r });
  }
  for (const tp of selectedTastingPrices) {
    const tier = TASTING_PRICE_TIERS.find((t) => t.key === tp);
    activeFilters.push({
      key: "tastingPrice",
      label: tier ? `${tier.label} ${tier.sublabel}` : tp,
      paramValue: tp,
    });
  }
  if (rating) {
    activeFilters.push({ key: "rating", label: `${rating}+ Stars` });
  }
  for (const v of selectedVarietals) {
    const wt = wineTypes.find(
      (w) => w.name.toLowerCase().replace(/\s+/g, "-") === v
    );
    activeFilters.push({
      key: "varietal",
      label: wt?.name || v,
      paramValue: v,
    });
  }
  for (const a of selectedAmenities) {
    const opt = AMENITY_OPTIONS.find((o) => o.value === a);
    activeFilters.push({
      key: "amenities",
      label: opt?.label || a,
      paramValue: a,
    });
  }

  const filterCount = activeFilters.length;

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
    router.push(`/wineries?${params.toString()}`);
  };

  const filterControls = (
    <div className="flex flex-wrap items-center gap-2">
      <MultiSelectDropdown
        label="Valley"
        options={VALLEY_OPTIONS}
        selected={selectedValleys}
        onChange={handleValleyChange}
      />
      <MultiSelectDropdown
        label="Region"
        options={regionOptions}
        selected={selectedRegions}
        onChange={(v) => updateParam("region", v)}
      />
      <MultiSelectDropdown
        label="Price"
        options={priceOptions}
        selected={selectedTastingPrices}
        onChange={(v) => updateParam("tastingPrice", v)}
      />
      <MultiSelectDropdown
        label="Rating"
        options={RATING_OPTIONS}
        selected={selectedRating}
        onChange={(v) => updateParam("rating", v)}
        multiSelect={false}
      />
      {wineTypes.length > 0 && (
        <MultiSelectDropdown
          label="Varietals"
          options={varietalOptions}
          selected={selectedVarietals}
          onChange={(v) => updateParam("varietal", v)}
        />
      )}
      <MultiSelectDropdown
        label="Amenities"
        options={amenityOptions}
        selected={selectedAmenities}
        onChange={(v) => updateParam("amenities", v)}
      />
      <MultiSelectDropdown
        label="Sort"
        options={SORT_OPTIONS}
        selected={selectedSort}
        onChange={(v) => updateParam("sort", v.length > 0 ? v : ["rating"])}
        multiSelect={false}
        icon={ArrowUpDown}
        variant="sort"
      />
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-burgundy-700 dark:text-burgundy-400 hover:bg-[var(--muted)] transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Clear all
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
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
            {filterCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-burgundy-700 px-2 py-0.5 text-xs font-medium text-white">
                {filterCount}
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
