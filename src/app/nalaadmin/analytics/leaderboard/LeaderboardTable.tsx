"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Mail,
  MailX,
  ExternalLink,
  Flame,
} from "lucide-react";
import { scoreBadgeClasses } from "@/lib/listing-score";

interface WineryRow {
  id: number;
  slug: string;
  name: string;
  valley: string | null;
  city: string | null;
  email: string | null;
  clicks: number;
  score: number;
  lastPitchedAt: string | null;
}

type SortKey = "name" | "score" | "clicks" | "pitched";
type SortDir = "asc" | "desc";

export function LeaderboardTable({ wineries }: { wineries: WineryRow[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("clicks");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [valley, setValley] = useState<"all" | "napa" | "sonoma">("all");
  const [scoreFilter, setScoreFilter] = useState<"all" | "high" | "mid" | "low">("all");

  const filtered = useMemo(() => {
    let result = wineries;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.city?.toLowerCase().includes(q)
      );
    }

    if (valley !== "all") result = result.filter((w) => w.valley === valley);
    if (scoreFilter === "high") result = result.filter((w) => w.score >= 80);
    else if (scoreFilter === "mid") result = result.filter((w) => w.score >= 50 && w.score < 80);
    else if (scoreFilter === "low") result = result.filter((w) => w.score < 50);

    return [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "score": cmp = a.score - b.score; break;
        case "clicks": cmp = a.clicks - b.clicks; break;
        case "pitched":
          cmp = (a.lastPitchedAt || "").localeCompare(b.lastPitchedAt || "");
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [wineries, search, valley, scoreFilter, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "name" ? "asc" : "desc"); }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 text-gray-300" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  }

  const hotLeads = filtered.filter((w) => w.clicks > 0 && w.score >= 60 && w.email);
  const withEmail = filtered.filter((w) => w.email).length;

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

        <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-sm">
          {(["all", "napa", "sonoma"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setValley(v)}
              className={`px-3 py-1.5 transition-colors ${valley === v ? "bg-burgundy-900 text-white" : "bg-[var(--card)] hover:bg-[var(--muted)]"}`}
            >
              {v === "all" ? "All" : v === "napa" ? "Napa" : "Sonoma"}
            </button>
          ))}
        </div>

        <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-sm">
          {([
            ["all", "All Scores"],
            ["high", "80+"],
            ["mid", "50-79"],
            ["low", "<50"],
          ] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setScoreFilter(val as typeof scoreFilter)}
              className={`px-3 py-1.5 transition-colors ${scoreFilter === val ? "bg-burgundy-900 text-white" : "bg-[var(--card)] hover:bg-[var(--muted)]"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 mb-4 text-xs text-[var(--muted-foreground)]">
        <span>Showing <strong>{filtered.length}</strong> of {wineries.length}</span>
        <span>With email: <strong>{withEmail}</strong></span>
        {hotLeads.length > 0 && (
          <span className="flex items-center gap-1 text-orange-600">
            <Flame className="h-3 w-3" />
            <strong>{hotLeads.length}</strong> hot leads (clicks + good listing + email)
          </span>
        )}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                <th className="text-left px-4 py-3 font-medium w-8">#</th>
                <th className="text-left px-4 py-3">
                  <button onClick={() => handleSort("name")} className="flex items-center gap-1 font-medium hover:text-burgundy-700">
                    Winery <SortIcon col="name" />
                  </button>
                </th>
                <th className="text-left px-4 py-3">
                  <button onClick={() => handleSort("score")} className="flex items-center gap-1 font-medium hover:text-burgundy-700">
                    Score <SortIcon col="score" />
                  </button>
                </th>
                <th className="text-left px-4 py-3">
                  <button onClick={() => handleSort("clicks")} className="flex items-center gap-1 font-medium hover:text-burgundy-700">
                    Clicks <SortIcon col="clicks" />
                  </button>
                </th>
                <th className="text-center px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3">
                  <button onClick={() => handleSort("pitched")} className="flex items-center gap-1 font-medium hover:text-burgundy-700">
                    Pitched <SortIcon col="pitched" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((w, i) => {
                const isHot = w.clicks > 0 && w.score >= 60 && w.email;
                return (
                  <tr
                    key={w.id}
                    className={`hover:bg-[var(--muted)]/30 ${isHot ? "bg-orange-50/50 dark:bg-orange-900/10" : ""}`}
                  >
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">
                      {isHot && <Flame className="h-3 w-3 text-orange-500 inline mr-1" />}
                      {i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/nalaadmin/analytics/winery/${w.id}`}
                        className="font-medium hover:underline"
                      >
                        {w.name}
                      </Link>
                      {w.city && (
                        <span className="text-xs text-[var(--muted-foreground)] ml-2">
                          {w.city}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${scoreBadgeClasses(w.score)}`}>
                        {w.score}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium">
                      {w.clicks}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {w.email ? (
                        <Mail className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <MailX className="h-4 w-4 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
                      {w.lastPitchedAt
                        ? new Date(w.lastPitchedAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/nalaadmin/analytics/winery/${w.id}`}
                          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          title="View analytics"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
