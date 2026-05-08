"use client";

import { useState, useMemo, useTransition, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Star,
  ExternalLink,
  Check,
  X,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  BadgeCheck,
} from "lucide-react";
import { SpotlightMonthPicker } from "../_components/SpotlightMonthPicker";

interface AccRow {
  id: number;
  slug: string;
  name: string;
  city: string | null;
  type: string;
  valley: string;
  subRegion: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  priceTier: number | null;
  dogFriendly: boolean | null;
  kidFriendly: boolean | null;
  adultsOnly: boolean | null;
  roomsJson: string | null;
  diningJson: string | null;
  spaJson: string | null;
  activitiesJson: string | null;
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

type SortKey = "name" | "rating" | "reviews" | "price";
type SortDir = "asc" | "desc";
type ContentFilter = "all" | "has-rooms" | "has-dining" | "has-spa" | "missing";
type CurationFilter =
  | "all"
  | "curated"
  | "not-curated"
  | "missing-teaser"
  | "has-spotlight"
  | "spotlight-this-month";

export function AccommodationTable({ accommodations }: { accommodations: AccRow[] }) {
  const searchParams = useSearchParams();
  const highlightSlug = searchParams.get("highlight");
  const rowRefs = useRef<Map<string, HTMLTableRowElement | null>>(new Map());

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rating");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [valley, setValley] = useState<"all" | "napa" | "sonoma">("all");
  const [content, setContent] = useState<ContentFilter>("all");
  const [curationFilter, setCurationFilter] = useState<CurationFilter>("all");
  const [data, setData] = useState(accommodations);
  const [isPending, startTransition] = useTransition();
  const thisMonth = currentYearMonth();

  async function toggleCurated(id: number, current: boolean) {
    setData((prev) => prev.map((a) => a.id === id ? { ...a, curated: !current, curatedAt: !current ? new Date().toISOString() : null } : a));
    startTransition(async () => {
      const res = await fetch(`/api/admin/accommodations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ curated: !current }) });
      if (!res.ok) setData((prev) => prev.map((a) => a.id === id ? { ...a, curated: current } : a));
    });
  }

  async function setSpotlightMonth(id: number, next: string | null) {
    if (next !== null && !YEAR_MONTH_RE.test(next)) return;

    const collidingId = next
      ? data.find((a) => a.id !== id && a.spotlightYearMonth === next)?.id ?? null
      : null;

    const previous = data.find((a) => a.id === id)?.spotlightYearMonth ?? null;
    const previousColliding = collidingId
      ? data.find((a) => a.id === collidingId)?.spotlightYearMonth ?? null
      : null;

    setData((prev) =>
      prev.map((a) => {
        if (a.id === id) return { ...a, spotlightYearMonth: next };
        if (collidingId && a.id === collidingId) return { ...a, spotlightYearMonth: null };
        return a;
      })
    );

    const res = await fetch(`/api/admin/accommodations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spotlightYearMonth: next }),
    });

    if (!res.ok) {
      setData((prev) =>
        prev.map((a) => {
          if (a.id === id) return { ...a, spotlightYearMonth: previous };
          if (collidingId && a.id === collidingId) return { ...a, spotlightYearMonth: previousColliding };
          return a;
        })
      );
      return;
    }

    if (collidingId) {
      const colRes = await fetch(`/api/admin/accommodations/${collidingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotlightYearMonth: null }),
      });
      if (!colRes.ok) {
        setData((prev) =>
          prev.map((a) => (a.id === collidingId ? { ...a, spotlightYearMonth: previousColliding } : a))
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
    const previous = data.find((a) => a.id === id)?.spotlightTeaser ?? null;
    setData((prev) => prev.map((a) => a.id === id ? { ...a, spotlightTeaser: next } : a));
    setEditingTeaser(null);

    const res = await fetch(`/api/admin/accommodations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spotlightTeaser: next }),
    });

    if (!res.ok) {
      setData((prev) => prev.map((a) => a.id === id ? { ...a, spotlightTeaser: previous } : a));
    }
  }

  const filtered = useMemo(() => {
    let result = data;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.city?.toLowerCase().includes(q) ||
          a.subRegion?.toLowerCase().includes(q)
      );
    }

    if (valley !== "all") result = result.filter((a) => a.valley === valley);

    if (content === "has-rooms") result = result.filter((a) => a.roomsJson);
    else if (content === "has-dining") result = result.filter((a) => a.diningJson);
    else if (content === "has-spa") result = result.filter((a) => a.spaJson);
    else if (content === "missing") result = result.filter((a) => !a.roomsJson && !a.diningJson && !a.spaJson);

    switch (curationFilter) {
      case "curated":
        result = result.filter((a) => a.curated);
        break;
      case "not-curated":
        result = result.filter((a) => !a.curated);
        break;
      case "missing-teaser":
        result = result.filter((a) => !a.spotlightTeaser);
        break;
      case "has-spotlight":
        result = result.filter((a) => !!a.spotlightYearMonth);
        break;
      case "spotlight-this-month":
        result = result.filter((a) => a.spotlightYearMonth === thisMonth);
        break;
    }

    return [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "rating": cmp = (a.googleRating || 0) - (b.googleRating || 0); break;
        case "reviews": cmp = (a.googleReviewCount || 0) - (b.googleReviewCount || 0); break;
        case "price": cmp = (a.priceTier || 0) - (b.priceTier || 0); break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [data, search, valley, content, curationFilter, sortKey, sortDir, thisMonth]);

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

  const withRooms = data.filter((a) => a.roomsJson).length;
  const withDining = data.filter((a) => a.diningJson).length;
  const withSpa = data.filter((a) => a.spaJson).length;
  const curatedCount = data.filter((a) => a.curated).length;
  const missingTeaserCount = data.filter((a) => !a.spotlightTeaser).length;
  const spotlightCount = data.filter((a) => !!a.spotlightYearMonth).length;
  const thisMonthCount = data.filter((a) => a.spotlightYearMonth === thisMonth).length;
  const pct = (n: number) => Math.round((n / data.length) * 100);

  const occupiedMonths = useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of data) {
      if (a.spotlightYearMonth) map[a.spotlightYearMonth] = a.name;
    }
    return map;
  }, [data]);

  return (
    <div>
      {/* Search + valley + content filters */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-3)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties..."
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

        <div className="flex border border-[var(--ink)] overflow-hidden text-sm">
          {(["all", "has-rooms", "has-dining", "has-spa", "missing"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setContent(c)}
              className={`px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors ${
                content === c ? "bg-[var(--ink)] text-[var(--paper)]" : "bg-transparent hover:bg-[var(--paper-2)] text-[var(--ink)]"
              }`}
            >
              {c === "all" ? "All" : c === "has-rooms" ? "Rooms" : c === "has-dining" ? "Dining" : c === "has-spa" ? "Spa" : "Missing"}
            </button>
          ))}
        </div>
      </div>

      {/* Curation filter chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        <FilterChip active={curationFilter === "all"} onClick={() => setCurationFilter("all")} label={`All · ${data.length}`} />
        <FilterChip active={curationFilter === "curated"} onClick={() => setCurationFilter("curated")} label={`Curated · ${curatedCount}`} />
        <FilterChip active={curationFilter === "not-curated"} onClick={() => setCurationFilter("not-curated")} label={`Uncurated · ${data.length - curatedCount}`} />
        <FilterChip active={curationFilter === "missing-teaser"} onClick={() => setCurationFilter("missing-teaser")} label={`Missing teaser · ${missingTeaserCount}`} />
        <FilterChip active={curationFilter === "has-spotlight"} onClick={() => setCurationFilter("has-spotlight")} label={`Has spotlight · ${spotlightCount}`} />
        <FilterChip active={curationFilter === "spotlight-this-month"} onClick={() => setCurationFilter("spotlight-this-month")} label={`This month (${thisMonth}) · ${thisMonthCount}`} />
      </div>

      <div className="flex gap-4 mb-4 font-mono text-[10.5px] tracking-[0.12em] uppercase text-[var(--ink-3)]">
        <span>Showing <strong className="text-[var(--ink)]">{filtered.length}</strong> of {data.length}</span>
        <span>Curated: <strong className="text-[var(--ink)]">{curatedCount}</strong></span>
        <span>Rooms: <strong className="text-[var(--ink)]">{withRooms}</strong> ({pct(withRooms)}%)</span>
        <span>Dining: <strong className="text-[var(--ink)]">{withDining}</strong> ({pct(withDining)}%)</span>
        <span>Spa: <strong className="text-[var(--ink)]">{withSpa}</strong> ({pct(withSpa)}%)</span>
      </div>

      <div className="border-t-2 border-[var(--brass)] bg-[var(--paper-2)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: "1300px" }}>
            <thead>
              <tr className="border-b border-[var(--rule)] bg-[var(--paper)]">
                <th className="text-left px-4 py-3 sticky left-0 bg-[var(--paper)] z-10 min-w-[200px]">
                  <button onClick={() => handleSort("name")} className="flex items-center gap-1 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)] hover:text-[var(--brass-2)]">Property <SortIcon col="name" /></button>
                </th>
                <th className="text-center px-3 py-3 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)]">Curated</th>
                <th className="text-left px-3 py-3 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)]">Spotlight</th>
                <th className="text-left px-3 py-3 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)]" style={{ minWidth: "300px" }}>Teaser</th>
                <th className="text-left px-3 py-3 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)]">Type</th>
                <th className="text-left px-3 py-3 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)]">Location</th>
                <th className="text-left px-3 py-3"><button onClick={() => handleSort("rating")} className="flex items-center gap-1 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)] hover:text-[var(--brass-2)]">Rating <SortIcon col="rating" /></button></th>
                <th className="text-left px-3 py-3"><button onClick={() => handleSort("price")} className="flex items-center gap-1 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)] hover:text-[var(--brass-2)]">Price <SortIcon col="price" /></button></th>
                <th className="text-center px-2 py-3 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)]">Rooms</th>
                <th className="text-center px-2 py-3 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)]">Dine</th>
                <th className="text-center px-2 py-3 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)]">Spa</th>
                <th className="text-center px-2 py-3 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)]">Dog</th>
                <th className="text-center px-2 py-3 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)]">Kid</th>
                <th className="text-left px-3 py-3 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)]">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rule-soft)]">
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  ref={(el) => { rowRefs.current.set(a.slug, el); }}
                  className="hover:bg-[var(--paper)] transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-[var(--ink)] sticky left-0 bg-[var(--paper-2)] z-10 break-words">{a.name}</td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => toggleCurated(a.id, !!a.curated)}
                      disabled={isPending}
                      className={`inline-flex items-center gap-1 px-3 py-1 font-mono text-[10px] tracking-[0.14em] uppercase font-semibold transition-colors ${
                        a.curated
                          ? "bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--brass)]"
                          : "border border-[var(--ink)] bg-transparent text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
                      }`}
                    >
                      <BadgeCheck className="h-3 w-3" />
                      {a.curated ? "Curated" : "—"}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <SpotlightMonthPicker
                      current={a.spotlightYearMonth}
                      occupied={occupiedMonths}
                      ownerName={a.name}
                      onSelect={(ym) => setSpotlightMonth(a.id, ym)}
                    />
                  </td>
                  <td className="px-3 py-3 align-top">
                    {editingTeaser === a.id ? (
                      <div className="flex flex-col gap-1">
                        <textarea
                          value={draftTeaser}
                          onChange={(e) => setDraftTeaser(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveTeaser(a.id);
                            else if (e.key === "Escape") cancelEditTeaser();
                          }}
                          autoFocus
                          rows={4}
                          placeholder="2-3 sentence editorial dek..."
                          className="input-editorial py-1.5 px-2 text-xs"
                        />
                        <div className="flex gap-1.5">
                          <button onClick={() => saveTeaser(a.id)} className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-0.5 bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--brass)] transition-colors">
                            Save (⌘+Enter)
                          </button>
                          <button onClick={cancelEditTeaser} className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-0.5 border border-[var(--ink)] hover:bg-[var(--paper)] transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : a.spotlightTeaser ? (
                      <button onClick={() => startEditTeaser(a.id, a.spotlightTeaser)} className="text-left font-[var(--font-serif-text)] text-[13px] leading-relaxed text-[var(--ink-2)] hover:text-[var(--ink)] line-clamp-3">
                        {a.spotlightTeaser}
                      </button>
                    ) : (
                      <button onClick={() => startEditTeaser(a.id, null)} className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[var(--ink-3)] hover:text-[var(--brass-2)] transition-colors">
                        + Write teaser
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-3 text-[var(--ink-2)] capitalize">{a.type.replace("_", " ")}</td>
                  <td className="px-3 py-3 text-[var(--ink-2)]">{a.subRegion || a.city || "—"}</td>
                  <td className="px-3 py-3">
                    {a.googleRating ? (
                      <span className="flex items-center gap-1 font-mono tabular-nums text-[var(--ink)]">
                        <Star className="h-3.5 w-3.5 fill-[var(--brass)] text-[var(--brass)]" />
                        {a.googleRating.toFixed(1)}
                        <span className="text-[var(--ink-3)] text-[11px]">({a.googleReviewCount})</span>
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-3 font-mono text-[var(--ink-2)]">{a.priceTier ? "$".repeat(a.priceTier) : "—"}</td>
                  <td className="px-2 py-3 text-center">{a.roomsJson ? <Check className="h-4 w-4 text-[var(--brass)] mx-auto" /> : <X className="h-4 w-4 text-[var(--rule)] mx-auto" />}</td>
                  <td className="px-2 py-3 text-center">{a.diningJson ? <Check className="h-4 w-4 text-[var(--brass)] mx-auto" /> : <X className="h-4 w-4 text-[var(--rule)] mx-auto" />}</td>
                  <td className="px-2 py-3 text-center">{a.spaJson ? <Check className="h-4 w-4 text-[var(--brass)] mx-auto" /> : <X className="h-4 w-4 text-[var(--rule)] mx-auto" />}</td>
                  <td className="px-2 py-3 text-center text-[11px] font-mono tracking-[0.1em] uppercase">{a.dogFriendly === true ? <span className="text-[var(--brass-2)]">Yes</span> : a.dogFriendly === false ? <span className="text-[var(--ink-3)]">No</span> : <span className="text-[var(--rule)]">—</span>}</td>
                  <td className="px-2 py-3 text-center text-[11px] font-mono tracking-[0.1em] uppercase">{a.adultsOnly ? <span className="text-[var(--color-burgundy-900)]">21+</span> : a.kidFriendly === true ? <span className="text-[var(--brass-2)]">Yes</span> : a.kidFriendly === false ? <span className="text-[var(--ink-3)]">No</span> : <span className="text-[var(--rule)]">—</span>}</td>
                  <td className="px-3 py-3"><Link href={`/where-to-stay/${a.slug}`} target="_blank" className="text-[var(--brass-2)] hover:text-[var(--ink)] transition-colors"><ExternalLink className="h-3.5 w-3.5" /></Link></td>
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
