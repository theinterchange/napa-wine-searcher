"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Filter, X } from "lucide-react";

interface SubRegion {
  slug: string;
  name: string;
  valley: string;
}

export function WineryFilters({ subRegions }: { subRegions: SubRegion[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const sort = searchParams.get("sort") || "rating";

  const hasFilters = valley || region || price || rating || reservation || dogFriendly || picnic;

  const filteredRegions = valley
    ? subRegions.filter((r) => r.valley === valley)
    : subRegions;

  return (
    <div className="space-y-4">
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
      </div>
    </div>
  );
}
