"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";

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
}

type SortKey = "name" | "rating" | "reviews" | "price";
type SortDir = "asc" | "desc";
type ContentFilter = "all" | "has-rooms" | "has-dining" | "has-spa" | "missing";

export function AccommodationTable({ accommodations }: { accommodations: AccRow[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rating");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [valley, setValley] = useState<"all" | "napa" | "sonoma">("all");
  const [content, setContent] = useState<ContentFilter>("all");

  const filtered = useMemo(() => {
    let result = accommodations;

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
  }, [accommodations, search, valley, content, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "name" ? "asc" : "desc"); }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 text-gray-300" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  }

  const withRooms = accommodations.filter((a) => a.roomsJson).length;
  const withDining = accommodations.filter((a) => a.diningJson).length;
  const withSpa = accommodations.filter((a) => a.spaJson).length;
  const pct = (n: number) => Math.round((n / accommodations.length) * 100);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search properties..." className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500" />
        </div>

        <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-sm">
          {(["all", "napa", "sonoma"] as const).map((v) => (
            <button key={v} onClick={() => setValley(v)} className={`px-3 py-1.5 transition-colors ${valley === v ? "bg-burgundy-900 text-white" : "bg-[var(--card)] hover:bg-[var(--muted)]"}`}>
              {v === "all" ? "All" : v === "napa" ? "Napa" : "Sonoma"}
            </button>
          ))}
        </div>

        <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-sm">
          {(["all", "has-rooms", "has-dining", "has-spa", "missing"] as const).map((c) => (
            <button key={c} onClick={() => setContent(c)} className={`px-3 py-1.5 transition-colors ${content === c ? "bg-burgundy-900 text-white" : "bg-[var(--card)] hover:bg-[var(--muted)]"}`}>
              {c === "all" ? "All" : c === "has-rooms" ? "Rooms" : c === "has-dining" ? "Dining" : c === "has-spa" ? "Spa" : "Missing"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 mb-4 text-xs text-[var(--muted-foreground)]">
        <span>Showing <strong>{filtered.length}</strong> of {accommodations.length}</span>
        <span>Rooms: <strong>{withRooms}</strong> ({pct(withRooms)}%)</span>
        <span>Dining: <strong>{withDining}</strong> ({pct(withDining)}%)</span>
        <span>Spa: <strong>{withSpa}</strong> ({pct(withSpa)}%)</span>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[8%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
              <col className="w-[7%]" />
              <col className="w-[6%]" />
              <col className="w-[6%]" />
              <col className="w-[6%]" />
              <col className="w-[6%]" />
              <col className="w-[6%]" />
              <col className="w-[5%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                <th className="text-left px-4 py-3"><button onClick={() => handleSort("name")} className="flex items-center gap-1 font-medium hover:text-burgundy-700">Property <SortIcon col="name" /></button></th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Location</th>
                <th className="text-left px-4 py-3"><button onClick={() => handleSort("rating")} className="flex items-center gap-1 font-medium hover:text-burgundy-700">Rating <SortIcon col="rating" /></button></th>
                <th className="text-left px-4 py-3"><button onClick={() => handleSort("price")} className="flex items-center gap-1 font-medium hover:text-burgundy-700">Price <SortIcon col="price" /></button></th>
                <th className="text-center px-4 py-3 font-medium">Rooms</th>
                <th className="text-center px-4 py-3 font-medium">Dining</th>
                <th className="text-center px-4 py-3 font-medium">Spa</th>
                <th className="text-center px-4 py-3 font-medium">Dog</th>
                <th className="text-center px-4 py-3 font-medium">Kid</th>
                <th className="text-left px-4 py-3 font-medium">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-[var(--muted)]/30">
                  <td className="px-4 py-3 font-medium break-words">{a.name}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)] capitalize">{a.type.replace("_", " ")}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{a.subRegion || a.city || "—"}</td>
                  <td className="px-4 py-3">{a.googleRating ? <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />{a.googleRating.toFixed(1)}<span className="text-xs text-[var(--muted-foreground)]">({a.googleReviewCount})</span></span> : "—"}</td>
                  <td className="px-4 py-3">{a.priceTier ? "$".repeat(a.priceTier) : "—"}</td>
                  <td className="px-4 py-3 text-center">{a.roomsJson ? <Check className="h-4 w-4 text-emerald-600 mx-auto" /> : <X className="h-4 w-4 text-gray-300 mx-auto" />}</td>
                  <td className="px-4 py-3 text-center">{a.diningJson ? <Check className="h-4 w-4 text-emerald-600 mx-auto" /> : <X className="h-4 w-4 text-gray-300 mx-auto" />}</td>
                  <td className="px-4 py-3 text-center">{a.spaJson ? <Check className="h-4 w-4 text-emerald-600 mx-auto" /> : <X className="h-4 w-4 text-gray-300 mx-auto" />}</td>
                  <td className="px-4 py-3 text-center">{a.dogFriendly === true ? <span className="text-xs text-gold-600">Yes</span> : a.dogFriendly === false ? <span className="text-xs text-gray-400">No</span> : <span className="text-xs text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-center">{a.adultsOnly ? <span className="text-xs text-burgundy-600">21+</span> : a.kidFriendly === true ? <span className="text-xs text-emerald-600">Yes</span> : a.kidFriendly === false ? <span className="text-xs text-gray-400">No</span> : <span className="text-xs text-gray-300">—</span>}</td>
                  <td className="px-4 py-3"><Link href={`/where-to-stay/${a.slug}`} className="text-burgundy-600 hover:underline"><ExternalLink className="h-3.5 w-3.5" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
