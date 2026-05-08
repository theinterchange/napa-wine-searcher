"use client";

import { useState, useTransition, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Star,
  BadgeCheck,
  ExternalLink,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import { SpotlightMonthPicker } from "../_components/SpotlightMonthPicker";

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
  spotlightYearMonth: string | null;
  spotlightTeaser: string | null;
}

const YEAR_MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

type SortKey = "name" | "rating" | "reviews" | "price" | "curated";
type SortDir = "asc" | "desc";
type CurationFilter =
  | "all"
  | "curated"
  | "not-curated"
  | "missing-teaser"
  | "has-spotlight"
  | "spotlight-this-month";

export function WineryTable({ wineries }: { wineries: WineryRow[] }) {
  const searchParams = useSearchParams();
  const highlightSlug = searchParams.get("highlight");
  const rowRefs = useRef<Map<string, HTMLTableRowElement | null>>(new Map());

  const [search, setSearch] = useState("");
  const [data, setData] = useState(wineries);
  const [isPending, startTransition] = useTransition();
  const [sortKey, setSortKey] = useState<SortKey>("rating");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [valley, setValley] = useState<"all" | "napa" | "sonoma">("all");
  const [curationFilter, setCurationFilter] = useState<CurationFilter>("all");
  const thisMonth = currentYearMonth();

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

    switch (curationFilter) {
      case "curated":
        result = result.filter((w) => w.curated);
        break;
      case "not-curated":
        result = result.filter((w) => !w.curated);
        break;
      case "missing-teaser":
        result = result.filter((w) => !w.spotlightTeaser);
        break;
      case "has-spotlight":
        result = result.filter((w) => !!w.spotlightYearMonth);
        break;
      case "spotlight-this-month":
        result = result.filter((w) => w.spotlightYearMonth === thisMonth);
        break;
    }

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
  }, [data, search, valley, curationFilter, sortKey, sortDir, thisMonth]);

  // Scroll to highlighted row + flash
  useEffect(() => {
    if (!highlightSlug) return;
    const row = rowRefs.current.get(highlightSlug);
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      row.classList.add("bg-[var(--paper-2)]");
      const t = setTimeout(() => row.classList.remove("bg-[var(--paper-2)]"), 2500);
      return () => clearTimeout(t);
    }
  }, [highlightSlug, filtered]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "name" ? "asc" : "desc"); }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 text-[var(--ink-3)]" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  }

  async function toggleCurated(id: number, current: boolean) {
    setData((prev) => prev.map((w) => w.id === id ? { ...w, curated: !current, curatedAt: !current ? new Date().toISOString() : null } : w));
    startTransition(async () => {
      const res = await fetch(`/api/admin/wineries/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ curated: !current }) });
      if (!res.ok) setData((prev) => prev.map((w) => w.id === id ? { ...w, curated: current } : w));
    });
  }

  async function setSpotlightMonth(id: number, next: string | null) {
    if (next !== null && !YEAR_MONTH_RE.test(next)) return;

    // If reassigning a month already taken by another winery, unassign that one first locally.
    const collidingId = next
      ? data.find((w) => w.id !== id && w.spotlightYearMonth === next)?.id ?? null
      : null;

    const previous = data.find((w) => w.id === id)?.spotlightYearMonth ?? null;
    const previousColliding = collidingId
      ? data.find((w) => w.id === collidingId)?.spotlightYearMonth ?? null
      : null;

    setData((prev) =>
      prev.map((w) => {
        if (w.id === id) return { ...w, spotlightYearMonth: next };
        if (collidingId && w.id === collidingId) return { ...w, spotlightYearMonth: null };
        return w;
      })
    );

    const res = await fetch(`/api/admin/wineries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spotlightYearMonth: next }),
    });

    if (!res.ok) {
      setData((prev) =>
        prev.map((w) => {
          if (w.id === id) return { ...w, spotlightYearMonth: previous };
          if (collidingId && w.id === collidingId) return { ...w, spotlightYearMonth: previousColliding };
          return w;
        })
      );
      return;
    }

    if (collidingId) {
      const colRes = await fetch(`/api/admin/wineries/${collidingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotlightYearMonth: null }),
      });
      if (!colRes.ok) {
        setData((prev) =>
          prev.map((w) => (w.id === collidingId ? { ...w, spotlightYearMonth: previousColliding } : w))
        );
      }
    }
  }

  const [editingTeaser, setEditingTeaser] = useState<number | null>(null);
  const [draftTeaser, setDraftTeaser] = useState("");

  function startEditTeaser(id: number, current: string | null) {
    setEditingTeaser(id);
    setDraftTeaser(current ?? "");
  }

  function cancelEditTeaser() {
    setEditingTeaser(null);
    setDraftTeaser("");
  }

  async function saveTeaser(id: number) {
    const value = draftTeaser.trim();
    const next = value === "" ? null : value;
    const previous = data.find((w) => w.id === id)?.spotlightTeaser ?? null;
    setData((prev) => prev.map((w) => w.id === id ? { ...w, spotlightTeaser: next } : w));
    setEditingTeaser(null);

    const res = await fetch(`/api/admin/wineries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spotlightTeaser: next }),
    });

    if (!res.ok) {
      setData((prev) => prev.map((w) => w.id === id ? { ...w, spotlightTeaser: previous } : w));
    }
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
  const missingTeaserCount = data.filter((w) => !w.spotlightTeaser).length;
  const spotlightCount = data.filter((w) => !!w.spotlightYearMonth).length;
  const thisMonthCount = data.filter((w) => w.spotlightYearMonth === thisMonth).length;

  const occupiedMonths = useMemo(() => {
    const map: Record<string, string> = {};
    for (const w of data) {
      if (w.spotlightYearMonth) map[w.spotlightYearMonth] = w.name;
    }
    return map;
  }, [data]);
  const avgRating = filtered.length > 0
    ? (filtered.reduce((s, w) => s + (w.googleRating || 0), 0) / filtered.length).toFixed(2)
    : "—";

  return (
    <div>
      {/* Search + valley + bulk actions */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-3)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search wineries..."
            className="input-editorial pl-9 py-2 text-sm"
          />
        </div>

        <div className="flex border border-[var(--ink)] overflow-hidden text-sm">
          {(["all", "napa", "sonoma"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setValley(v)}
              className={`px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors ${
                valley === v ? "bg-[var(--ink)] text-[var(--paper)]" : "bg-transparent hover:bg-[var(--paper-2)] text-[var(--ink)]"
              }`}
            >
              {v === "all" ? "All" : v === "napa" ? "Napa" : "Sonoma"}
            </button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => bulkSetCurated(true)}
            disabled={isPending}
            className="font-mono text-[10.5px] tracking-[0.14em] uppercase border border-[var(--ink)] px-3 py-1.5 hover:bg-[var(--ink)] hover:text-[var(--paper)] transition-colors disabled:opacity-50"
          >
            Curate filtered ({filtered.length})
          </button>
          <button
            onClick={() => bulkSetCurated(false)}
            disabled={isPending}
            className="font-mono text-[10.5px] tracking-[0.14em] uppercase border border-[var(--ink)] px-3 py-1.5 hover:bg-[var(--ink)] hover:text-[var(--paper)] transition-colors disabled:opacity-50"
          >
            Uncurate filtered
          </button>
        </div>
      </div>

      {/* Curation filter chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        <FilterChip
          active={curationFilter === "all"}
          onClick={() => setCurationFilter("all")}
          label={`All · ${data.length}`}
        />
        <FilterChip
          active={curationFilter === "curated"}
          onClick={() => setCurationFilter("curated")}
          label={`Curated · ${curatedCount}`}
        />
        <FilterChip
          active={curationFilter === "not-curated"}
          onClick={() => setCurationFilter("not-curated")}
          label={`Uncurated · ${data.length - curatedCount}`}
        />
        <FilterChip
          active={curationFilter === "missing-teaser"}
          onClick={() => setCurationFilter("missing-teaser")}
          label={`Missing teaser · ${missingTeaserCount}`}
        />
        <FilterChip
          active={curationFilter === "has-spotlight"}
          onClick={() => setCurationFilter("has-spotlight")}
          label={`Has spotlight · ${spotlightCount}`}
        />
        <FilterChip
          active={curationFilter === "spotlight-this-month"}
          onClick={() => setCurationFilter("spotlight-this-month")}
          label={`This month (${thisMonth}) · ${thisMonthCount}`}
        />
      </div>

      <div className="flex gap-4 mb-4 font-mono text-[10.5px] tracking-[0.12em] uppercase text-[var(--ink-3)]">
        <span>Showing <strong className="text-[var(--ink)]">{filtered.length}</strong> of {data.length}</span>
        <span>Curated in view: <strong className="text-[var(--ink)]">{filteredCurated}</strong></span>
        <span>Avg rating: <strong className="text-[var(--ink)]">{avgRating}</strong></span>
      </div>

      <div className="border-t-2 border-[var(--brass)] bg-[var(--paper-2)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: "1200px" }}>
            <thead>
              <tr className="border-b border-[var(--rule)] bg-[var(--paper)]">
                <th className="text-left px-4 py-3 sticky left-0 bg-[var(--paper)] z-10 min-w-[200px]">
                  <button onClick={() => handleSort("name")} className="flex items-center gap-1 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)] hover:text-[var(--brass-2)]">Winery <SortIcon col="name" /></button>
                </th>
                <th className="text-center px-3 py-3 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)]">
                  <button onClick={() => handleSort("curated")} className="flex items-center gap-1 mx-auto hover:text-[var(--brass-2)]">Curated <SortIcon col="curated" /></button>
                </th>
                <th className="text-left px-3 py-3 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)]">Spotlight</th>
                <th className="text-left px-3 py-3 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)]" style={{ minWidth: "300px" }}>Teaser</th>
                <th className="text-left px-3 py-3 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)]">Location</th>
                <th className="text-left px-3 py-3"><button onClick={() => handleSort("rating")} className="flex items-center gap-1 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)] hover:text-[var(--brass-2)]">Rating <SortIcon col="rating" /></button></th>
                <th className="text-left px-3 py-3"><button onClick={() => handleSort("reviews")} className="flex items-center gap-1 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)] hover:text-[var(--brass-2)]">Reviews <SortIcon col="reviews" /></button></th>
                <th className="text-left px-3 py-3"><button onClick={() => handleSort("price")} className="flex items-center gap-1 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)] hover:text-[var(--brass-2)]">Price <SortIcon col="price" /></button></th>
                <th className="text-left px-3 py-3 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)]">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rule-soft)]">
              {filtered.map((w) => (
                <tr
                  key={w.id}
                  ref={(el) => { rowRefs.current.set(w.slug, el); }}
                  className="hover:bg-[var(--paper)] transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-[var(--ink)] sticky left-0 bg-[var(--paper-2)] z-10">{w.name}</td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => toggleCurated(w.id, !!w.curated)}
                      disabled={isPending}
                      className={`inline-flex items-center gap-1 px-3 py-1 font-mono text-[10px] tracking-[0.14em] uppercase font-semibold transition-colors ${
                        w.curated
                          ? "bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--brass)]"
                          : "border border-[var(--ink)] bg-transparent text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
                      }`}
                    >
                      <BadgeCheck className="h-3 w-3" />
                      {w.curated ? "Curated" : "—"}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <SpotlightMonthPicker
                      current={w.spotlightYearMonth}
                      occupied={occupiedMonths}
                      ownerName={w.name}
                      onSelect={(ym) => setSpotlightMonth(w.id, ym)}
                    />
                  </td>
                  <td className="px-3 py-3 align-top">
                    {editingTeaser === w.id ? (
                      <div className="flex flex-col gap-1">
                        <textarea
                          value={draftTeaser}
                          onChange={(e) => setDraftTeaser(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveTeaser(w.id);
                            else if (e.key === "Escape") cancelEditTeaser();
                          }}
                          autoFocus
                          rows={4}
                          placeholder="2-3 sentence editorial dek..."
                          className="input-editorial py-1.5 px-2 text-xs"
                        />
                        <div className="flex gap-1.5">
                          <button onClick={() => saveTeaser(w.id)} className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-0.5 bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--brass)] transition-colors">
                            Save (⌘+Enter)
                          </button>
                          <button onClick={cancelEditTeaser} className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-0.5 border border-[var(--ink)] hover:bg-[var(--paper)] transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : w.spotlightTeaser ? (
                      <button onClick={() => startEditTeaser(w.id, w.spotlightTeaser)} className="text-left font-[var(--font-serif-text)] text-[13px] leading-relaxed text-[var(--ink-2)] hover:text-[var(--ink)] line-clamp-3">
                        {w.spotlightTeaser}
                      </button>
                    ) : (
                      <button onClick={() => startEditTeaser(w.id, null)} className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[var(--ink-3)] hover:text-[var(--brass-2)] transition-colors">
                        + Write teaser
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-3 text-[var(--ink-2)]">{w.subRegion || w.city || "—"}</td>
                  <td className="px-3 py-3">
                    {w.googleRating ? (
                      <span className="flex items-center gap-1 font-mono tabular-nums text-[var(--ink)]">
                        <Star className="h-3.5 w-3.5 fill-[var(--brass)] text-[var(--brass)]" />
                        {w.googleRating.toFixed(1)}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-3 font-mono tabular-nums text-[var(--ink-2)]">{w.totalRatings?.toLocaleString() || "—"}</td>
                  <td className="px-3 py-3 font-mono text-[var(--ink-2)]">{w.priceLevel ? "$".repeat(w.priceLevel) : "—"}</td>
                  <td className="px-3 py-3"><Link href={`/wineries/${w.slug}`} target="_blank" className="text-[var(--brass-2)] hover:text-[var(--ink)] transition-colors"><ExternalLink className="h-3.5 w-3.5" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`font-mono text-[10.5px] tracking-[0.14em] uppercase px-3 py-1.5 transition-colors ${
        active
          ? "bg-[var(--ink)] text-[var(--paper)]"
          : "border border-[var(--ink)] bg-transparent text-[var(--ink)] hover:bg-[var(--paper-2)]"
      }`}
    >
      {label}
    </button>
  );
}
