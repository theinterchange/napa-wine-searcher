"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import { TASTING_PRICE_TIERS, WINE_PRICE_TIERS } from "@/lib/filters";

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
  const [showAllVarietals, setShowAllVarietals] = useState(false);

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/wineries?${params.toString()}`);
    },
    [router, searchParams]
  );

  const toggleMultiParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.get(key)?.split(",").filter(Boolean) || [];
      const idx = current.indexOf(value);
      if (idx >= 0) {
        current.splice(idx, 1);
      } else {
        current.push(value);
      }
      if (current.length > 0) {
        params.set(key, current.join(","));
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

  const valley = searchParams.get("valley") || "";
  const region = searchParams.get("region") || "";
  const price = searchParams.get("price") || "";
  const rating = searchParams.get("rating") || "";
  const reservation = searchParams.get("reservation") || "";
  const dogFriendly = searchParams.get("dog") || "";
  const picnic = searchParams.get("picnic") || "";
  const kidFriendly = searchParams.get("kid") || "";
  const sort = searchParams.get("sort") || "rating";
  const varietal = searchParams.get("varietal") || "";
  const tastingPrice = searchParams.get("tastingPrice") || "";
  const winePrice = searchParams.get("winePrice") || "";

  const selectedVarietals = varietal ? varietal.split(",") : [];
  const selectedTastingPrices = tastingPrice ? tastingPrice.split(",") : [];
  const selectedWinePrices = winePrice ? winePrice.split(",") : [];

  const hasFilters =
    valley ||
    region ||
    price ||
    rating ||
    reservation ||
    dogFriendly ||
    picnic ||
    kidFriendly ||
    varietal ||
    tastingPrice ||
    winePrice;

  const filteredRegions = valley
    ? subRegions.filter((r) => r.valley === valley)
    : subRegions;

  // Build active filter labels for tags
  const activeFilters: { key: string; label: string; paramValue?: string }[] =
    [];
  if (valley)
    activeFilters.push({
      key: "valley",
      label: valley === "napa" ? "Napa Valley" : "Sonoma County",
    });
  if (region) {
    const r = subRegions.find((r) => r.slug === region);
    activeFilters.push({ key: "region", label: r?.name || region });
  }
  if (price) {
    const labels: Record<string, string> = {
      "1": "$ Budget",
      "2": "$$ Moderate",
      "3": "$$$ Premium",
      "4": "$$$$ Luxury",
    };
    activeFilters.push({ key: "price", label: labels[price] || price });
  }
  if (rating)
    activeFilters.push({ key: "rating", label: `${rating}+ Stars` });
  if (reservation)
    activeFilters.push({ key: "reservation", label: "Walk-ins OK" });
  if (dogFriendly)
    activeFilters.push({ key: "dog", label: "Dog Friendly" });
  if (picnic)
    activeFilters.push({ key: "picnic", label: "Picnic Friendly" });
  if (kidFriendly)
    activeFilters.push({ key: "kid", label: "Kid Friendly" });
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
  for (const tp of selectedTastingPrices) {
    const tier = TASTING_PRICE_TIERS.find((t) => t.key === tp);
    activeFilters.push({
      key: "tastingPrice",
      label: `Tasting: ${tier?.label || tp}`,
      paramValue: tp,
    });
  }
  for (const wp of selectedWinePrices) {
    const tier = WINE_PRICE_TIERS.find((t) => t.key === wp);
    activeFilters.push({
      key: "winePrice",
      label: `Wine: ${tier?.label || wp}`,
      paramValue: wp,
    });
  }

  const filterCount = activeFilters.length;

  const removeMultiFilter = (key: string, paramValue?: string) => {
    if (!paramValue) {
      setParam(key, "");
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

  // Show top 8 varietals, expandable
  const displayedVarietals = showAllVarietals
    ? wineTypes
    : wineTypes.slice(0, 8);

  const filterControls = (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select
          value={valley}
          onChange={(e) => {
            setParam("valley", e.target.value);
            if (e.target.value !== valley) setParam("region", "");
          }}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
        >
          <option value="">All Valleys</option>
          <option value="napa">Napa Valley</option>
          <option value="sonoma">Sonoma County</option>
        </select>

        <select
          value={region}
          onChange={(e) => setParam("region", e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
        >
          <option value="">All Regions</option>
          {filteredRegions.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.name}
            </option>
          ))}
        </select>

        <select
          value={price}
          onChange={(e) => setParam("price", e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
        >
          <option value="">Any Price</option>
          <option value="1">$ Budget</option>
          <option value="2">$$ Moderate</option>
          <option value="3">$$$ Premium</option>
          <option value="4">$$$$ Luxury</option>
        </select>

        <select
          value={rating}
          onChange={(e) => setParam("rating", e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
        >
          <option value="">Any Rating</option>
          <option value="4.5">4.5+ Stars</option>
          <option value="4.0">4.0+ Stars</option>
          <option value="3.5">3.5+ Stars</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
        >
          <option value="rating">Highest Rated</option>
          <option value="name">Name A-Z</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="reviews">Most Reviews</option>
        </select>

        <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={reservation === "false"}
            onChange={(e) =>
              setParam("reservation", e.target.checked ? "false" : "")
            }
            className="rounded"
          />
          Walk-ins OK
        </label>

        <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={dogFriendly === "true"}
            onChange={(e) =>
              setParam("dog", e.target.checked ? "true" : "")
            }
            className="rounded"
          />
          Dog Friendly
        </label>

        <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={picnic === "true"}
            onChange={(e) =>
              setParam("picnic", e.target.checked ? "true" : "")
            }
            className="rounded"
          />
          Picnic Friendly
        </label>

        <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={kidFriendly === "true"}
            onChange={(e) =>
              setParam("kid", e.target.checked ? "true" : "")
            }
            className="rounded"
          />
          Kid Friendly
        </label>
      </div>

      {/* Tasting Price Range */}
      <div>
        <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
          Tasting Price
        </p>
        <div className="flex flex-wrap gap-2">
          {TASTING_PRICE_TIERS.map((tier) => (
            <button
              key={tier.key}
              onClick={() => toggleMultiParam("tastingPrice", tier.key)}
              aria-pressed={selectedTastingPrices.includes(tier.key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedTastingPrices.includes(tier.key)
                  ? "border-burgundy-600 bg-burgundy-100 text-burgundy-700 dark:bg-burgundy-900 dark:text-burgundy-300 dark:border-burgundy-700"
                  : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"
              }`}
            >
              {tier.label}{" "}
              <span className="text-[var(--muted-foreground)]">
                {tier.sublabel}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Wine Price Range */}
      <div>
        <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
          Wine Price
        </p>
        <div className="flex flex-wrap gap-2">
          {WINE_PRICE_TIERS.map((tier) => (
            <button
              key={tier.key}
              onClick={() => toggleMultiParam("winePrice", tier.key)}
              aria-pressed={selectedWinePrices.includes(tier.key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedWinePrices.includes(tier.key)
                  ? "border-burgundy-600 bg-burgundy-100 text-burgundy-700 dark:bg-burgundy-900 dark:text-burgundy-300 dark:border-burgundy-700"
                  : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"
              }`}
            >
              {tier.label}
            </button>
          ))}
        </div>
      </div>

      {/* Varietal Filter */}
      {wineTypes.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
            Grape Varietal
          </p>
          <div className="flex flex-wrap gap-2">
            {displayedVarietals.map((wt) => {
              const slug = wt.name.toLowerCase().replace(/\s+/g, "-");
              return (
                <button
                  key={wt.id}
                  onClick={() => toggleMultiParam("varietal", slug)}
                  aria-pressed={selectedVarietals.includes(slug)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedVarietals.includes(slug)
                      ? "border-burgundy-600 bg-burgundy-100 text-burgundy-700 dark:bg-burgundy-900 dark:text-burgundy-300 dark:border-burgundy-700"
                      : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"
                  }`}
                >
                  {wt.name}{" "}
                  <span className="text-[var(--muted-foreground)]">
                    ({wt.count})
                  </span>
                </button>
              );
            })}
            {wineTypes.length > 8 && (
              <button
                onClick={() => setShowAllVarietals(!showAllVarietals)}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-burgundy-700 dark:text-burgundy-400 hover:bg-[var(--muted)] transition-colors"
              >
                {showAllVarietals
                  ? "Show less"
                  : `+${wineTypes.length - 8} more`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Desktop: always visible */}
      <div className="hidden md:block space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[var(--muted-foreground)]" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-burgundy-700 dark:text-burgundy-400 hover:underline"
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>
        {filterControls}
      </div>

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
        {mobileOpen && (
          <div className="mt-3 space-y-4">
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-burgundy-700 dark:text-burgundy-400 hover:underline"
              >
                <X className="h-3 w-3" />
                Clear all
              </button>
            )}
            {filterControls}
          </div>
        )}
      </div>

      {/* Active filter tags */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map(({ key, label, paramValue }, i) => (
            <button
              key={`${key}-${paramValue || i}`}
              onClick={() => removeMultiFilter(key, paramValue)}
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
