"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Copy,
  Check,
  Download,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface Subscriber {
  id: number;
  email: string;
  source: string;
  subscribedAt: string;
}

type SortKey = "email" | "source" | "date";
type SortDir = "asc" | "desc";

export function SubscribersTable({
  subscribers,
}: {
  subscribers: Subscriber[];
}) {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const sources = useMemo(() => {
    const set = new Set(subscribers.map((s) => s.source));
    return Array.from(set).sort();
  }, [subscribers]);

  const filtered = useMemo(() => {
    let result = subscribers;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.email.toLowerCase().includes(q));
    }
    if (sourceFilter !== "all") {
      result = result.filter((s) => s.source === sourceFilter);
    }
    return [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "email":
          cmp = a.email.localeCompare(b.email);
          break;
        case "source":
          cmp = a.source.localeCompare(b.source);
          break;
        case "date":
          cmp = a.subscribedAt.localeCompare(b.subscribedAt);
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [subscribers, search, sourceFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "email" || key === "source" ? "asc" : "desc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col)
      return <ArrowUpDown className="h-3 w-3 text-gray-300" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  }

  async function copyOne(id: number, email: string) {
    await navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  async function copyAll() {
    const text = filtered.map((s) => s.email).join(", ");
    await navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  }

  function downloadCsv() {
    const header = "email,source,subscribed_at\n";
    const rows = filtered
      .map(
        (s) =>
          `${escapeCsv(s.email)},${escapeCsv(s.source)},${escapeCsv(s.subscribedAt)}`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emails..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
          />
        </div>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
        >
          <option value="all">All sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={copyAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm hover:bg-[var(--muted)]"
          >
            {copiedAll ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            Copy all
          </button>
          <button
            onClick={downloadCsv}
            className="inline-flex items-center gap-1.5 rounded-lg bg-burgundy-900 text-white px-3 py-2 text-sm hover:bg-burgundy-800"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="text-xs text-[var(--muted-foreground)] mb-4">
        Showing <strong>{filtered.length}</strong> of {subscribers.length}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                <th className="text-left px-4 py-3">
                  <button
                    onClick={() => toggleSort("email")}
                    className="flex items-center gap-1 font-medium hover:text-burgundy-700"
                  >
                    Email <SortIcon col="email" />
                  </button>
                </th>
                <th className="text-left px-4 py-3">
                  <button
                    onClick={() => toggleSort("source")}
                    className="flex items-center gap-1 font-medium hover:text-burgundy-700"
                  >
                    Source <SortIcon col="source" />
                  </button>
                </th>
                <th className="text-left px-4 py-3">
                  <button
                    onClick={() => toggleSort("date")}
                    className="flex items-center gap-1 font-medium hover:text-burgundy-700"
                  >
                    Subscribed <SortIcon col="date" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium w-20">Copy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-[var(--muted)]/30">
                  <td className="px-4 py-3 font-mono text-xs">{s.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs">
                      {s.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--muted-foreground)] tabular-nums">
                    {new Date(s.subscribedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => copyOne(s.id, s.email)}
                      className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      title="Copy email"
                    >
                      {copiedId === s.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]"
                  >
                    No subscribers match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
