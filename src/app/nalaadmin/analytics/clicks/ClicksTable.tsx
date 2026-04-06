"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ExternalLink } from "lucide-react";
import { formatClickType } from "../components/BarChart";

interface Destination {
  destinationUrl: string | null;
  clickType: string;
  total: number;
  lastClicked: string | null;
}

interface RecentClick {
  id: number;
  createdAt: string;
  clickType: string;
  destinationUrl: string | null;
  sourcePage: string | null;
  sourceComponent: string | null;
  wineryId: number | null;
  wineryName: string | null;
  winerySlug: string | null;
  accommodationId: number | null;
  accommodationName: string | null;
  accommodationSlug: string | null;
}

type Tab = "destinations" | "recent";

export function ClicksTable({
  destinations,
  recent,
}: {
  destinations: Destination[];
  recent: RecentClick[];
}) {
  const [tab, setTab] = useState<Tab>("destinations");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const clickTypes = useMemo(() => {
    const set = new Set<string>();
    destinations.forEach((d) => set.add(d.clickType));
    recent.forEach((r) => set.add(r.clickType));
    return Array.from(set).sort();
  }, [destinations, recent]);

  const filteredDestinations = useMemo(() => {
    let result = destinations;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((d) =>
        (d.destinationUrl || "").toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") {
      result = result.filter((d) => d.clickType === typeFilter);
    }
    return result;
  }, [destinations, search, typeFilter]);

  const filteredRecent = useMemo(() => {
    let result = recent;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          (r.destinationUrl || "").toLowerCase().includes(q) ||
          (r.wineryName || "").toLowerCase().includes(q) ||
          (r.accommodationName || "").toLowerCase().includes(q) ||
          (r.sourcePage || "").toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") {
      result = result.filter((r) => r.clickType === typeFilter);
    }
    return result;
  }, [recent, search, typeFilter]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 border-b border-[var(--border)]">
        <button
          onClick={() => setTab("destinations")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "destinations"
              ? "border-burgundy-900 text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          By Destination ({destinations.length})
        </button>
        <button
          onClick={() => setTab("recent")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "recent"
              ? "border-burgundy-900 text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          Recent Clicks ({recent.length})
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              tab === "destinations"
                ? "Search URLs..."
                : "Search URL, winery, source page..."
            }
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
        >
          <option value="all">All types</option>
          {clickTypes.map((t) => (
            <option key={t} value={t}>
              {formatClickType(t)}
            </option>
          ))}
        </select>
      </div>

      {tab === "destinations" ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                  <th className="text-left px-4 py-3 font-medium">
                    Destination URL
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-right px-4 py-3 font-medium">Clicks</th>
                  <th className="text-left px-4 py-3 font-medium">
                    Last Clicked
                  </th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredDestinations.map((d, i) => (
                  <tr
                    key={`${d.destinationUrl}-${d.clickType}-${i}`}
                    className="hover:bg-[var(--muted)]/30"
                  >
                    <td className="px-4 py-3 font-mono text-xs break-all max-w-md">
                      {d.destinationUrl || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs">
                        {formatClickType(d.clickType)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {d.total}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--muted-foreground)] tabular-nums">
                      {d.lastClicked
                        ? new Date(d.lastClicked).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {d.destinationUrl && (
                        <a
                          href={d.destinationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          title="Open URL"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredDestinations.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]"
                    >
                      No destinations match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                  <th className="text-left px-4 py-3 font-medium">When</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">
                    Winery / Property
                  </th>
                  <th className="text-left px-4 py-3 font-medium">From Page</th>
                  <th className="text-left px-4 py-3 font-medium">
                    Destination
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredRecent.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--muted)]/30">
                    <td className="px-4 py-3 text-xs text-[var(--muted-foreground)] tabular-nums whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs">
                        {formatClickType(r.clickType)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.wineryName && r.winerySlug ? (
                        <Link
                          href={`/nalaadmin/analytics/winery/${r.wineryId}`}
                          className="hover:underline"
                        >
                          {r.wineryName}
                        </Link>
                      ) : r.accommodationName ? (
                        <span>{r.accommodationName}</span>
                      ) : (
                        <span className="text-[var(--muted-foreground)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--muted-foreground)] break-all max-w-xs">
                      {r.sourcePage || "—"}
                      {r.sourceComponent && (
                        <div className="text-[10px] opacity-70">
                          {r.sourceComponent}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs break-all max-w-xs">
                      {r.destinationUrl ? (
                        <a
                          href={r.destinationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {r.destinationUrl}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
                {filteredRecent.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]"
                    >
                      No recent clicks match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
