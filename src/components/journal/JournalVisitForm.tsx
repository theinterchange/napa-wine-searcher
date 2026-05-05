"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { InteractiveStarRating } from "./InteractiveStarRating";

interface WineryResult {
  slug: string;
  name: string;
  city: string | null;
  subRegion: string | null;
  valley: string | null;
  aggregateRating: number | null;
  googleRating: number | null;
  priceLevel: number | null;
}

interface JournalVisitFormProps {
  onClose: () => void;
  onSaved: () => void;
}

export function JournalVisitForm({ onClose, onSaved }: JournalVisitFormProps) {
  const [wineryQuery, setWineryQuery] = useState("");
  const [wineryResults, setWineryResults] = useState<WineryResult[]>([]);
  const [selectedWinery, setSelectedWinery] = useState<{ id: number; slug: string; name: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [dateTried, setDateTried] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchWineries = useCallback(async (q: string) => {
    if (q.length < 2) {
      setWineryResults([]);
      setSearching(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSearching(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setWineryResults(data.wineries || []);
      setShowDropdown(true);
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    } finally {
      if (!controller.signal.aborted) setSearching(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!wineryQuery.trim() || selectedWinery) {
      setWineryResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    timerRef.current = setTimeout(() => fetchWineries(wineryQuery.trim()), 250);
    return () => clearTimeout(timerRef.current);
  }, [wineryQuery, fetchWineries, selectedWinery]);

  function handleSelectWinery(winery: WineryResult) {
    // We need the winery ID — fetch it from the slug-based winery page or use the search API
    // The search API returns slug but not id. We'll look up the id via the visited API's winery slug.
    // For now, store slug and name. We'll resolve the id on submit.
    setSelectedWinery({ id: 0, slug: winery.slug, name: winery.name });
    setWineryQuery(winery.name);
    setShowDropdown(false);
  }

  function handleClearWinery() {
    setSelectedWinery(null);
    setWineryQuery("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wineryQuery.trim()) {
      setError("Winery name is required");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // If we have a selected winery with slug, resolve the wineryId
      let wineryId: number | null = null;
      let wineryName = wineryQuery.trim();

      if (selectedWinery?.slug) {
        // Fetch winery id by slug
        const wineryRes = await fetch(`/api/wineries/by-slug/${selectedWinery.slug}`);
        if (wineryRes.ok) {
          const wineryData = await wineryRes.json();
          wineryId = wineryData.id;
          wineryName = wineryData.name || wineryName;
        }
      }

      // Create journal entry with entryType: "visit"
      const journalRes = await fetch("/api/user/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryType: "visit",
          wineryId,
          wineName: "Winery Visit",
          wineryName,
          rating: rating || null,
          tastingNotes: notes.trim() || null,
          dateTried,
        }),
      });

      if (!journalRes.ok) {
        const data = await journalRes.json();
        setError(data.error || "Failed to save");
        setLoading(false);
        return;
      }

      // Also sync the visited table if we have a wineryId
      if (wineryId) {
        await fetch("/api/user/visited", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wineryId, visitedDate: dateTried }),
        });
      }

      onSaved();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-[var(--font-heading)] text-[18px] font-normal tracking-[-0.005em] text-[var(--ink)]">Log a Winery Visit</h3>
          <button onClick={onClose} className="p-1 hover:bg-[var(--muted)] rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Winery autocomplete */}
          <div ref={dropdownRef} className="relative">
            <label className="block text-sm font-medium mb-1">Winery</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
              <input
                type="text"
                required
                value={wineryQuery}
                onChange={(e) => {
                  setWineryQuery(e.target.value);
                  if (selectedWinery) setSelectedWinery(null);
                }}
                onFocus={() => {
                  if (wineryResults.length > 0 && !selectedWinery) setShowDropdown(true);
                }}
                placeholder="Search for a winery..."
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
              {selectedWinery && (
                <button
                  type="button"
                  onClick={handleClearWinery}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {searching && (
                <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[var(--muted-foreground)]" />
              )}
            </div>

            {showDropdown && wineryResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg max-h-48 overflow-y-auto">
                {wineryResults.map((w) => (
                  <button
                    key={w.slug}
                    type="button"
                    onClick={() => handleSelectWinery(w)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors"
                  >
                    <div className="font-medium">{w.name}</div>
                    {(w.city || w.subRegion) && (
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {w.subRegion || w.city}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date Visited</label>
            <input
              type="date"
              required
              value={dateTried}
              onChange={(e) => setDateTried(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Rating</label>
            <InteractiveStarRating value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How was the experience? Atmosphere, service, tastings..."
              rows={3}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-burgundy-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-burgundy-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Visit"}
          </button>
        </form>
      </div>
    </div>
  );
}
