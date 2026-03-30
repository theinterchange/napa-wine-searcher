"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Star,
  BadgeCheck,
  ExternalLink,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface WineryRow {
  id: number;
  slug: string;
  name: string;
  city: string | null;
  subRegion: string | null;
  valley: string | null;
  googleRating: number | null;
  totalRatings: number | null;
  priceLevel: number | null;
  curated: boolean | null;
  curatedAt: string | null;
}

type SortKey = "name" | "rating" | "reviews" | "price" | "curated";
type SortDir = "asc" | "desc";

export function WineryTable({ wineries }: { wineries: WineryRow[] }) {
  const [search, setSearch] = useState("");
  const [data, setData] = useState(wineries);
  const [isPending, startTransition] = useTransition();
  const [sortKey, setSortKey] = useState<SortKey>("rating");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [valley, setValley] = useState<"all" | "napa" | "sonoma">("all");
  const [curatedFilter, setCuratedFilter] = useState<"all" | "curated" | "not-curated">("all");

  const filtered = useMemo(() => {
    let result = data;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.city?.toLowerCase().includes(q) ||
          w.subRegion?.toLowerCase().includes(q)
      );
    }

    if (valley !== "all") result = result.filter((w) => w.valley === valley);
    if (curatedFilter === "curated") result = result.filter((w) => w.curated);
    else if (curatedFilter === "not-curated") result = result.filter((w) => !w.curated);

    return [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "rating": cmp = (a.googleRating || 0) - (b.googleRating || 0); break;
        case "reviews": cmp = (a.totalRatings || 0) - (b.totalRatings || 0); break;
        case "price": cmp = (a.priceLevel || 0) - (b.priceLevel || 0); break;
        case "curated": cmp = (a.curated ? 1 : 0) - (b.curated ? 1 : 0); break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [data, search, valley, curatedFilter, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "name" ? "asc" : "desc"); }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 text-gray-300" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  }

  async function toggleCurated(id: number, current: boolean) {
    setData((prev) => prev.map((w) => w.id === id ? { ...w, curated: !current, curatedAt: !current ? new Date().toISOString() : null } : w));
    startTransition(async () => {
      const res = await fetch(`/api/admin/wineries/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ curated: !current }) });
      if (!res.ok) setData((prev) => prev.map((w) => w.id === id ? { ...w, curated: current } : w));
    });
  }

  async function bulkSetCurated(value: boolean) {
    const ids = filtered.map((w) => w.id);
    setData((prev) => prev.map((w) => ids.includes(w.id) ? { ...w, curated: value, curatedAt: value ? new Date().toISOString() : null } : w));
    startTransition(async () => {
      for (const id of ids) {
        await fetch(`/api/admin/wineries/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ curated: value }) });
      }
    });
  }

  const curatedCount = data.filter((w) => w.curated).length;
  const filteredCurated = filtered.filter((w) => w.curated).length;
  const avgRating = filtered.length > 0
    ? (filtered.reduce((s, w) => s + (w.googleRating || 0), 0) / filtered.length).toFixed(2)
    : "—";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search wineries..." className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500" />
        </div>

        <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-sm">
          {(["all", "napa", "sonoma"] as const).map((v) => (
            <button key={v} onClick={() => setValley(v)} className={`px-3 py-1.5 transition-colors ${valley === v ? "bg-burgundy-700 text-white" : "bg-[var(--card)] hover:bg-[var(--muted)]"}`}>
              {v === "all" ? "All" : v === "napa" ? "Napa" : "Sonoma"}
            </button>
          ))}
        </div>

        <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-sm">
          {(["all", "curated", "not-curated"] as const).map((c) => (
            <button key={c} onClick={() => setCuratedFilter(c)} className={`px-3 py-1.5 transition-colors ${curatedFilter === c ? "bg-burgundy-700 text-white" : "bg-[var(--card)] hover:bg-[var(--muted)]"}`}>
              {c === "all" ? "All" : c === "curated" ? "Curated" : "Not Curated"}
            </button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          <button onClick={() => bulkSetCurated(true)} disabled={isPending} className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
            Curate All ({filtered.length})
          </button>
          <button onClick={() => bulkSetCurated(false)} disabled={isPending} className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            Uncurate All
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-4 text-xs text-[var(--muted-foreground)]">
        <span>Showing <strong>{filtered.length}</strong> of {data.length}</span>
        <span>Curated: <strong>{filteredCurated}</strong></span>
        <span>Avg rating: <strong>{avgRating}</strong></span>
        <span>Total curated: <strong>{curatedCount}</strong>/{data.length}</span>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[20%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[8%]" />
              <col className="w-[15%]" />
              <col className="w-[7%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                <th className="text-left px-4 py-3"><button onClick={() => handleSort("name")} className="flex items-center gap-1 font-medium hover:text-burgundy-700">Winery <SortIcon col="name" /></button></th>
                <th className="text-left px-4 py-3 font-medium">Location</th>
                <th className="text-left px-4 py-3"><button onClick={() => handleSort("rating")} className="flex items-center gap-1 font-medium hover:text-burgundy-700">Rating <SortIcon col="rating" /></button></th>
                <th className="text-left px-4 py-3"><button onClick={() => handleSort("reviews")} className="flex items-center gap-1 font-medium hover:text-burgundy-700">Reviews <SortIcon col="reviews" /></button></th>
                <th className="text-left px-4 py-3"><button onClick={() => handleSort("price")} className="flex items-center gap-1 font-medium hover:text-burgundy-700">Price <SortIcon col="price" /></button></th>
                <th className="text-center px-4 py-3"><button onClick={() => handleSort("curated")} className="flex items-center gap-1 font-medium hover:text-burgundy-700 mx-auto">Curated <SortIcon col="curated" /></button></th>
                <th className="text-left px-4 py-3 font-medium">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((w) => (
                <tr key={w.id} className="hover:bg-[var(--muted)]/30">
                  <td className="px-4 py-3 font-medium">{w.name}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{w.subRegion || w.city || "—"}</td>
                  <td className="px-4 py-3">{w.googleRating ? <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />{w.googleRating.toFixed(1)}</span> : "—"}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{w.totalRatings?.toLocaleString() || "—"}</td>
                  <td className="px-4 py-3">{w.priceLevel ? "$".repeat(w.priceLevel) : "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleCurated(w.id, !!w.curated)} disabled={isPending} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${w.curated ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 hover:bg-emerald-200" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200"}`}>
                      <BadgeCheck className="h-3.5 w-3.5" />{w.curated ? "Curated" : "Not Curated"}
                    </button>
                  </td>
                  <td className="px-4 py-3"><Link href={`/wineries/${w.slug}`} className="text-burgundy-600 hover:underline"><ExternalLink className="h-3.5 w-3.5" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
