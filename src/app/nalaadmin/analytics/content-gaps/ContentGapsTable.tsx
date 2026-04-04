"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ExternalLink } from "lucide-react";
import { scoreBadgeClasses } from "@/lib/listing-score";

interface GapRow {
  id: number;
  slug: string;
  name: string;
  score: number;
  missing: string[];
}

const COMMON_GAPS = [
  "Email",
  "Phone number",
  "Hero image",
  "Tasting experiences",
  "Why Visit description",
  "Description",
  "Hours",
] as const;

export function ContentGapsTable({ wineries }: { wineries: GapRow[] }) {
  const [search, setSearch] = useState("");
  const [gapFilter, setGapFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    let result = wineries;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((w) => w.name.toLowerCase().includes(q));
    }

    if (gapFilter !== "all") {
      result = result.filter((w) => w.missing.includes(gapFilter));
    }

    return result;
  }, [wineries, search, gapFilter]);

  // Count how many wineries are missing each field
  const gapCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of wineries) {
      for (const m of w.missing) {
        counts[m] = (counts[m] || 0) + 1;
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [wineries]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search wineries..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
          />
        </div>

        <select
          value={gapFilter}
          onChange={(e) => setGapFilter(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
        >
          <option value="all">All gaps</option>
          {COMMON_GAPS.map((gap) => (
            <option key={gap} value={gap}>
              Missing: {gap}
            </option>
          ))}
        </select>
      </div>

      {/* Gap summary */}
      <div className="flex flex-wrap gap-2 mb-6">
        {gapCounts.slice(0, 10).map(([gap, gapCount]) => (
          <button
            key={gap}
            onClick={() => setGapFilter(gapFilter === gap ? "all" : gap)}
            className={`text-xs rounded-full px-3 py-1 border transition-colors ${
              gapFilter === gap
                ? "bg-burgundy-900 text-white border-burgundy-700"
                : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"
            }`}
          >
            {gap} ({gapCount})
          </button>
        ))}
      </div>

      <div className="text-xs text-[var(--muted-foreground)] mb-4">
        Showing <strong>{filtered.length}</strong> wineries
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                <th className="text-left px-4 py-3 font-medium">Winery</th>
                <th className="text-left px-4 py-3 font-medium">Score</th>
                <th className="text-left px-4 py-3 font-medium">Missing</th>
                <th className="text-left px-4 py-3 font-medium w-16">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((w) => (
                <tr key={w.id} className="hover:bg-[var(--muted)]/30">
                  <td className="px-4 py-3 font-medium">{w.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${scoreBadgeClasses(w.score)}`}>
                      {w.score}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {w.missing.map((m) => (
                        <span
                          key={m}
                          className="text-xs rounded bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 px-1.5 py-0.5"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/wineries/${w.slug}`}
                      className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      title="View listing"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
