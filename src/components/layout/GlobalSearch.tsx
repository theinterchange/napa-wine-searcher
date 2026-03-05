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

  for (const dt of data.dayTrips) {
    items.push({
      id: `daytrip-${dt.slug}`,
      label: dt.title,
      sublabel: dt.theme ?? undefined,
      href: `/day-trips/${dt.slug}`,
      icon: Route,
      category: "Day Trips",
    });
  }

  return items;
}

const SUGGESTED_LINKS: ResultItem[] = [
  { id: "s-browse", label: "Browse All Wineries", href: "/wineries", icon: Wine, category: "Suggestions" },
  { id: "s-napa", label: "Napa Valley Wineries", href: "/napa-valley", icon: Map, category: "Suggestions" },
  { id: "s-sonoma", label: "Sonoma County Wineries", href: "/sonoma-county", icon: Map, category: "Suggestions" },
  { id: "s-toprated", label: "Top Rated Wineries", href: "/wineries?rating=4.5", icon: Wine, category: "Suggestions" },
  { id: "s-dog", label: "Dog-Friendly Wineries", href: "/wineries?amenities=dog", icon: SlidersHorizontal, category: "Suggestions" },
  { id: "s-daytrips", label: "Day Trip Routes", href: "/day-trips", icon: Route, category: "Suggestions" },
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
          className="hidden md:flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--muted)]/50 px-4 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
        >
          <Search className="h-4 w-4" />
          <span className="max-w-[180px] truncate">Search wineries, wines...</span>
          <kbd className="ml-2 hidden lg:inline-flex items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--card)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        {/* Mobile trigger */}
        <button
          onClick={() => setOpen(true)}
          className="md:hidden p-2 text-[var(--foreground)]"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>
      </>
    );
  }

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      {/* Dialog */}
      <div className="relative w-full max-w-xl rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
          <Search className="h-5 w-5 text-[var(--muted-foreground)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search wineries, wines, regions, filters..."
            className="flex-1 bg-transparent py-4 text-base outline-none placeholder:text-[var(--muted-foreground)]"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            className="shrink-0 rounded border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
          {loading && !results && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
            </div>
          )}

          {hasNoResults && (
            <div className="py-12 text-center text-sm text-[var(--muted-foreground)]">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {groups.length > 0 && (
            <div className="py-2">
              {groups.map((group) => (
                <div key={group.category}>
                  <div className="px-4 py-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    {group.category}
                  </div>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.href)}
                        onMouseEnter={() => setActiveIndex(item.globalIndex)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                          activeIndex === item.globalIndex
                            ? "bg-burgundy-50 dark:bg-burgundy-950/50 text-burgundy-900 dark:text-burgundy-100"
                            : "text-[var(--foreground)] hover:bg-[var(--muted)]/50"
                        )}
                      >
                        <Icon className={cn(
                          "h-4 w-4 shrink-0",
                          activeIndex === item.globalIndex
                            ? "text-burgundy-600 dark:text-burgundy-400"
                            : "text-[var(--muted-foreground)]"
                        )} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{item.label}</div>
                          {item.sublabel && (
                            <div className="truncate text-xs text-[var(--muted-foreground)]">
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
            <div className="border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--muted-foreground)]">
              Search wineries by name, region, or feature (e.g. &ldquo;dog friendly&rdquo;, &ldquo;St Helena&rdquo;, &ldquo;cabernet&rdquo;)
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop trigger (hidden when open since modal is showing) */}
      <div className="hidden md:block w-[260px] lg:w-[300px]" />
      {/* Mobile trigger placeholder */}
      <div className="md:hidden w-9" />
      {typeof window !== "undefined" && createPortal(modal, document.body)}
    </>
  );
}
