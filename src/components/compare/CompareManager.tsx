"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { X, Search, Plus, Clock, Loader2 } from "lucide-react";

interface WineryBasic {
  id: number;
  name: string;
}

interface SearchWinery {
  id: number;
  slug: string;
  name: string;
  city: string | null;
  googleRating: number | null;
  aggregateRating: number | null;
  priceLevel: number | null;
}

interface RecommendedGroup {
  label: string;
  wineries: WineryBasic[];
}

const RECENT_KEY = "compare-recent-wineries";
const MAX_RECENT = 6;

function loadRecent(): WineryBasic[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WineryBasic[];
  } catch {
    return [];
  }
}

function saveRecent(wineries: WineryBasic[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(wineries.slice(0, MAX_RECENT)));
  } catch {}
}

export function CompareManager({
  currentIds,
  selectedWineries,
  recommendedGroups,
}: {
  currentIds: number[];
  selectedWineries: WineryBasic[];
  recommendedGroups: RecommendedGroup[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [results, setResults] = useState<SearchWinery[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<WineryBasic[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const canAdd = currentIds.length < 4;

  // Load recent from localStorage on mount
  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced API search
  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(
        (data.wineries || []).filter(
          (w: SearchWinery) => !currentIds.includes(w.id)
        )
      );
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [currentIds]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(() => fetchResults(query.trim()), 200);
    return () => clearTimeout(timerRef.current);
  }, [query, fetchResults]);

  const updateIds = (newIds: number[]) => {
    if (newIds.length === 0) {
      router.push("/compare");
    } else {
      router.push(`/compare?ids=${newIds.join(",")}`);
    }
  };

  const addWinery = (id: number, name: string) => {
    if (currentIds.length >= 4) return;
    // Save to recent
    const updated = [{ id, name }, ...recent.filter((r) => r.id !== id)].slice(0, MAX_RECENT);
    setRecent(updated);
    saveRecent(updated);
    // Navigate
    updateIds([...currentIds, id]);
    setQuery("");
    setShowDropdown(false);
  };

  const removeWinery = (id: number) => {
    updateIds(currentIds.filter((i) => i !== id));
  };

  const hasQuery = query.trim().length > 0;
  const showResults = hasQuery && results.length > 0;
  const showEmpty = hasQuery && !loading && results.length === 0 && query.trim().length >= 2;
  const showRecommendations = !hasQuery && showDropdown;

  // Filter recent to exclude already-selected
  const availableRecent = recent.filter((r) => !currentIds.includes(r.id));
  // Filter recommended to exclude already-selected
  const filteredGroups = recommendedGroups
    .map((g) => ({
      ...g,
      wineries: g.wineries.filter((w) => !currentIds.includes(w.id)),
    }))
    .filter((g) => g.wineries.length > 0);

  return (
    <div className="space-y-3">
      {/* Selected wineries tags */}
      <div className="flex flex-wrap gap-2">
        {selectedWineries.map((w) => (
          <span
            key={w.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-burgundy-100 dark:bg-burgundy-900 px-3 py-1.5 text-sm font-medium text-burgundy-800 dark:text-burgundy-200"
          >
            {w.name}
            <button
              onClick={() => removeWinery(w.id)}
              className="rounded-full p-0.5 hover:bg-burgundy-200 dark:hover:bg-burgundy-800 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>

      {/* Search to add */}
      {canAdd && (
        <div className="relative max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search to add a winery..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 py-2 text-sm placeholder:text-[var(--muted-foreground)]"
            />
          </div>

          {showDropdown && (showResults || showEmpty || showRecommendations) && (
            <div
              ref={dropdownRef}
              className="absolute z-20 mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg max-h-72 overflow-y-auto"
            >
              {/* Loading */}
              {loading && hasQuery && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--muted-foreground)]" />
                </div>
              )}

              {/* Search results */}
              {showResults && !loading && results.map((w) => {
                const rating = w.googleRating ?? w.aggregateRating;
                const parts: string[] = [];
                if (w.city) parts.push(w.city);
                if (rating) parts.push(`${rating.toFixed(1)}★`);
                if (w.priceLevel) parts.push("$".repeat(w.priceLevel));

                return (
                  <button
                    key={w.id}
                    onClick={() => addWinery(w.id, w.name)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors text-left"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{w.name}</div>
                      {parts.length > 0 && (
                        <div className="truncate text-xs text-[var(--muted-foreground)]">
                          {parts.join(" · ")}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* No results */}
              {showEmpty && (
                <div className="px-3 py-4 text-center text-sm text-[var(--muted-foreground)]">
                  No wineries found
                </div>
              )}

              {/* Recommendations (empty state) */}
              {showRecommendations && (
                <>
                  {availableRecent.length > 0 && (
                    <div className="px-3 pt-2 pb-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                        <Clock className="h-3 w-3" />
                        Recent
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {availableRecent.map((w) => (
                          <button
                            key={w.id}
                            onClick={() => addWinery(w.id, w.name)}
                            className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--muted)]/50 px-2.5 py-1 text-xs hover:bg-[var(--muted)] transition-colors"
                          >
                            <Plus className="h-3 w-3 text-[var(--muted-foreground)]" />
                            {w.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {filteredGroups.map((group) => (
                    <div key={group.label} className="px-3 pt-2 pb-1">
                      <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                        {group.label}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {group.wineries.map((w) => (
                          <button
                            key={w.id}
                            onClick={() => addWinery(w.id, w.name)}
                            className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--muted)]/50 px-2.5 py-1 text-xs hover:bg-[var(--muted)] transition-colors"
                          >
                            <Plus className="h-3 w-3 text-[var(--muted-foreground)]" />
                            {w.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {availableRecent.length === 0 && filteredGroups.length === 0 && (
                    <div className="px-3 py-4 text-center text-sm text-[var(--muted-foreground)]">
                      Type to search wineries
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {!canAdd && (
        <p className="text-xs text-[var(--muted-foreground)]">
          Maximum 4 wineries for comparison
        </p>
      )}
    </div>
  );
}
