"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  X,
  Wine,
  Grape,
  MapPin,
  Map,
  Route,
  SlidersHorizontal,
  Loader2,
  Command,
  BedDouble,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/utils";

interface SearchResults {
  wineries: {
    slug: string;
    name: string;
    city: string | null;
    subRegion: string | null;
    valley: string | null;
    aggregateRating: number | null;
    googleRating: number | null;
    priceLevel: number | null;
  }[];
  wineTypes: {
    name: string;
    category: string;
    wineryCount: number;
  }[];
  cities: {
    city: string | null;
    valley: string | null;
    count: number;
  }[];
  regions: {
    slug: string;
    name: string;
    valley: string;
  }[];
  dayTrips: {
    slug: string;
    title: string;
    theme: string | null;
  }[];
  accommodations: {
    slug: string;
    name: string;
    city: string | null;
    type: string;
    valley: string;
    googleRating: number | null;
    priceTier: number | null;
  }[];
  filters: {
    label: string;
    href: string;
    type: string;
  }[];
}

type ResultItem = {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  icon: typeof Wine;
  category: string;
};

function flattenResults(data: SearchResults): ResultItem[] {
  const items: ResultItem[] = [];

  for (const f of data.filters) {
    items.push({
      id: `filter-${f.href}`,
      label: f.label,
      sublabel: f.type,
      href: f.href,
      icon: SlidersHorizontal,
      category: "Quick Filters",
    });
  }

  // Regions first — best landing page for location searches
  for (const r of data.regions) {
    const valleyPrefix = r.valley === "napa" ? "/napa-valley" : "/sonoma-county";
    items.push({
      id: `region-${r.slug}`,
      label: r.name,
      sublabel: r.valley === "napa" ? "Napa Valley" : "Sonoma County",
      href: `${valleyPrefix}/${r.slug}`,
      icon: Map,
      category: "Regions",
    });
  }

  // Wineries — primary content
  for (const w of data.wineries) {
    const rating = w.googleRating ?? w.aggregateRating;
    const parts: string[] = [];
    if (w.subRegion) parts.push(w.subRegion);
    else if (w.city) parts.push(w.city);
    if (rating) parts.push(`${rating.toFixed(1)} ★`);
    if (w.priceLevel) parts.push("$".repeat(w.priceLevel));

    items.push({
      id: `winery-${w.slug}`,
      label: w.name,
      sublabel: parts.join(" · "),
      href: `/wineries/${w.slug}`,
      icon: Wine,
      category: "Wineries",
    });
  }

  // Where to Stay — trip planning companion
  for (const acc of data.accommodations) {
    items.push({
      id: `acc-${acc.slug}`,
      label: acc.name,
      sublabel: [acc.city, acc.valley === "napa" ? "Napa Valley" : "Sonoma County"]
        .filter(Boolean)
        .join(" · "),
      href: `/where-to-stay/${acc.slug}`,
      icon: BedDouble,
      category: "Where to Stay",
    });
  }

  // Day Trips
  for (const dt of data.dayTrips) {
    items.push({
      id: `daytrip-${dt.slug}`,
      label: dt.title,
      sublabel: dt.theme ?? undefined,
      href: `/itineraries/${dt.slug}`,
      icon: Route,
      category: "Itineraries",
    });
  }

  // Wine Types — discovery
  for (const wt of data.wineTypes) {
    items.push({
      id: `winetype-${wt.name}`,
      label: wt.name,
      sublabel: `${wt.category} · ${wt.wineryCount} ${wt.wineryCount === 1 ? "winery" : "wineries"}`,
      href: `/wineries?varietal=${slugify(wt.name)}`,
      icon: Grape,
      category: "Wine Types",
    });
  }

  // Cities
  for (const c of data.cities) {
    if (!c.city) continue;
    items.push({
      id: `city-${c.city}`,
      label: c.city,
      sublabel: `${c.count} ${c.count === 1 ? "winery" : "wineries"}${c.valley ? ` · ${c.valley === "napa" ? "Napa Valley" : "Sonoma County"}` : ""}`,
      href: `/wineries?q=${encodeURIComponent(c.city)}`,
      icon: MapPin,
      category: "Cities",
    });
  }

  return items;
}

const SUGGESTED_LINKS: ResultItem[] = [
  { id: "s-browse", label: "Browse All Wineries", href: "/wineries", icon: Wine, category: "Suggestions" },
  { id: "s-stay", label: "Where to Stay", href: "/where-to-stay", icon: BedDouble, category: "Suggestions" },
  { id: "s-napa", label: "Napa Valley", href: "/napa-valley", icon: Map, category: "Suggestions" },
  { id: "s-sonoma", label: "Sonoma County", href: "/sonoma-county", icon: Map, category: "Suggestions" },
  { id: "s-plan", label: "Plan a Trip", href: "/itineraries/build", icon: Route, category: "Suggestions" },
  { id: "s-toprated", label: "Top Rated Wineries", href: "/wineries?rating=4.5", icon: Wine, category: "Suggestions" },
  { id: "s-daytrips", label: "Curated Itineraries", href: "/itineraries", icon: Route, category: "Suggestions" },
];

export function GlobalSearch({ hideButton }: { hideButton?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const router = useRouter();
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  // Close on route change
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      setOpen(false);
    }
    prevPathname.current = pathname;
  }, [pathname]);

  // Cmd+K handler
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Custom event listener for homepage trigger
  useEffect(() => {
    function onOpenSearch() {
      setOpen(true);
    }
    window.addEventListener("open-global-search", onOpenSearch);
    return () => window.removeEventListener("open-global-search", onOpenSearch);
  }, []);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      // Focus input on next tick
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults(null);
      setActiveIndex(0);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Debounced search
  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data);
      setActiveIndex(0);
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(() => fetchResults(query.trim()), 200);
    return () => clearTimeout(timerRef.current);
  }, [query, fetchResults]);

  const items = results ? flattenResults(results) : (!query.trim() ? SUGGESTED_LINKS : []);
  const hasNoResults = results && items.length === 0 && query.trim().length >= 2;

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % Math.max(items.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + items.length) % Math.max(items.length, 1));
    } else if (e.key === "Enter" && items[activeIndex]) {
      e.preventDefault();
      navigate(items[activeIndex].href);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // Group items by category for display
  const groups: { category: string; items: (ResultItem & { globalIndex: number })[] }[] = [];
  let idx = 0;
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.category === item.category) {
      last.items.push({ ...item, globalIndex: idx });
    } else {
      groups.push({ category: item.category, items: [{ ...item, globalIndex: idx }] });
    }
    idx++;
  }

  if (!open) {
    if (hideButton) return null;
    return (
      <>
        {/* Desktop trigger */}
        <button
          onClick={() => setOpen(true)}
          className="hidden md:flex w-full items-center gap-2.5 border border-[var(--rule)] bg-[var(--paper-2)]/40 px-3.5 py-2 text-[13px] text-[var(--ink-3)] hover:border-[var(--brass)] hover:bg-[var(--paper-2)]/70 transition-colors"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span
            className="flex-1 text-left italic"
            style={{ fontFamily: "var(--font-serif-text)" }}
          >
            Search wineries, regions, accommodations
          </span>
          <kbd className="shrink-0 inline-flex items-center gap-0.5 border border-[var(--rule)] bg-[var(--paper)] px-1.5 py-0.5 font-mono text-[10px] tracking-[0.06em] text-[var(--ink-3)]">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        {/* Mobile trigger */}
        <button
          onClick={() => setOpen(true)}
          className="md:hidden p-2 text-[var(--ink-2)]"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>
      </>
    );
  }

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[6vh] sm:pt-[12vh] px-3 sm:px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-[var(--ink)]/40 backdrop-blur-sm" aria-hidden="true" onClick={() => setOpen(false)} />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the site"
        className="relative w-full max-w-xl md:max-w-2xl border border-[var(--rule)] bg-[var(--paper)] shadow-[0_8px_40px_rgba(0,0,0,0.18)] overflow-hidden"
      >
        {/* Search input */}
        <div className="flex items-center gap-2 sm:gap-3 border-b border-[var(--rule)] px-3 sm:px-4">
          <Search className="h-4 w-4 text-[var(--ink-3)] shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search wineries, wines, regions"
            aria-label="Search wineries, regions, and accommodations"
            className="flex-1 min-w-0 bg-transparent py-4 text-[15px] italic outline-none text-[var(--ink)] placeholder:text-[var(--ink-3)]"
            style={{ fontFamily: "var(--font-serif-text)" }}
          />
          {query && (
            <button
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              aria-label="Clear search"
              className="p-2 -mr-1 text-[var(--ink-3)] hover:text-[var(--ink)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            aria-label="Close search"
            className="shrink-0 border border-[var(--rule)] bg-[var(--paper-2)] px-2.5 py-1.5 font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
          {loading && !results && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--brass)]" />
            </div>
          )}

          {hasNoResults && (
            <div
              className="py-12 text-center text-[13px] italic text-[var(--ink-3)]"
              style={{ fontFamily: "var(--font-serif-text)" }}
            >
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {groups.length > 0 && (
            <div className="py-2">
              {groups.map((group) => (
                <div key={group.category}>
                  <div className="px-4 py-2 font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--brass-2)]">
                    {group.category}
                  </div>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const selected = activeIndex === item.globalIndex;
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.href)}
                        onMouseEnter={() => setActiveIndex(item.globalIndex)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors border-l-2",
                          selected
                            ? "bg-[var(--paper-2)] text-[var(--ink)] border-[var(--brass)]"
                            : "text-[var(--ink-2)] hover:bg-[var(--paper-2)]/60 border-transparent"
                        )}
                      >
                        <Icon className={cn(
                          "h-4 w-4 shrink-0",
                          selected ? "text-[var(--brass)]" : "text-[var(--ink-3)]"
                        )} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px] font-medium text-[var(--ink)]">{item.label}</div>
                          {item.sublabel && (
                            <div className="truncate text-[12px] text-[var(--ink-3)]">
                              {item.sublabel}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Hint when no query */}
          {!query.trim() && (
            <div
              className="border-t border-[var(--rule-soft)] px-4 py-3 text-[12.5px] italic text-[var(--ink-3)]"
              style={{ fontFamily: "var(--font-serif-text)" }}
            >
              Search wineries by name, region, or feature (e.g. &ldquo;dog friendly&rdquo;, &ldquo;St Helena&rdquo;, &ldquo;cabernet&rdquo;)
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Placeholder to prevent layout shift while modal is open */}
      <div className="hidden md:block w-full" />
      <div className="md:hidden w-9" />
      {typeof window !== "undefined" && createPortal(modal, document.body)}
    </>
  );
}
