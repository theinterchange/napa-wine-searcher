"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { X, Search, Plus } from "lucide-react";

interface Winery {
  id: number;
  name: string;
}

export function CompareManager({
  currentIds,
  allWineries,
}: {
  currentIds: number[];
  allWineries: Winery[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedWineries = allWineries.filter((w) => currentIds.includes(w.id));
  const canAdd = currentIds.length < 4;

  const filtered = query.trim()
    ? allWineries
        .filter(
          (w) =>
            !currentIds.includes(w.id) &&
            w.name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 8)
    : [];

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

  const updateIds = (newIds: number[]) => {
    if (newIds.length === 0) {
      router.push("/compare");
    } else {
      router.push(`/compare?ids=${newIds.join(",")}`);
    }
  };

  const addWinery = (id: number) => {
    if (currentIds.length >= 4) return;
    updateIds([...currentIds, id]);
    setQuery("");
    setShowDropdown(false);
  };

  const removeWinery = (id: number) => {
    updateIds(currentIds.filter((i) => i !== id));
  };

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
          {showDropdown && filtered.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-20 mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg max-h-60 overflow-y-auto"
            >
              {filtered.map((w) => (
                <button
                  key={w.id}
                  onClick={() => addWinery(w.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors text-left"
                >
                  <Plus className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                  {w.name}
                </button>
              ))}
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
