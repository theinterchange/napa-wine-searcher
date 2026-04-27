"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import type { AnchorWinery } from "./types";

interface MustVisitPickerProps {
  selected: AnchorWinery[];
  onChange: (next: AnchorWinery[]) => void;
  maxPicks?: number;
}

type SearchRow = {
  id: number;
  name: string;
  subRegion: string | null;
  city: string | null;
  googleRating: number | null;
};

export function MustVisitPicker({
  selected,
  onChange,
  maxPicks = 3,
}: MustVisitPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const atCap = selected.length >= maxPicks;

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/wineries/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then((data) => {
          setResults(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          if (err.name !== "AbortError") console.error(err);
        })
        .finally(() => setLoading(false));
    }, 200);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const pickedIds = new Set(selected.map((s) => s.id));
  const filtered = results.filter((r) => !pickedIds.has(r.id));

  const add = (r: SearchRow) => {
    if (atCap) return;
    onChange([
      ...selected,
      { id: r.id, name: r.name, subRegion: r.subRegion ?? r.city },
    ]);
    setQuery("");
    setResults([]);
  };

  const remove = (id: number) => {
    onChange(selected.filter((s) => s.id !== id));
  };

  return (
    <div>
      {selected.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-2">
          {selected.map((s) => (
            <li key={s.id}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-burgundy-900 bg-[var(--card)] px-3 py-1 text-xs font-medium">
                {s.name}
                <button
                  type="button"
                  aria-label={`Remove ${s.name}`}
                  onClick={() => remove(s.id)}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          type="search"
          placeholder={
            atCap
              ? `Max ${maxPicks} reached — remove one to add another`
              : "Search a winery you want to include"
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={atCap}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2 pl-9 pr-3 text-sm outline-none focus:border-burgundy-900 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>

      {loading && (
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">Searching…</p>
      )}

      {!loading && query.trim().length >= 2 && filtered.length === 0 && (
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">
          No wineries match.
        </p>
      )}

      {filtered.length > 0 && (
        <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--card)] p-1">
          {filtered.slice(0, 8).map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => add(r)}
                className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-[var(--muted)]"
              >
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-semibold">{r.name}</span>
                  <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                    {r.subRegion ?? r.city ?? ""}
                    {r.googleRating != null
                      ? ` · ★ ${r.googleRating.toFixed(1)}`
                      : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
