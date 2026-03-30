"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, MapPin, CheckCircle2 } from "lucide-react";
import { JournalEntryCard } from "./JournalEntryCard";
import { JournalEditForm } from "./JournalEditForm";
import Link from "next/link";

interface JournalEntry {
  id: number;
  entryType?: string;
  wineName: string;
  wineryName: string | null;
  wineryId: number | null;
  winerySlug: string | null;
  vintage: number | null;
  rating: number | null;
  tastingNotes: string | null;
  dateTried: string;
}

interface VisitedWinery {
  wineryId: number;
  wineryName: string;
  winerySlug: string | null;
  visitedDate: string | null;
}

interface WineryGroup {
  wineryName: string;
  winerySlug: string | null;
  wineryId: number | null;
  entries: JournalEntry[];
  latestDate: string;
  earliestDate: string;
  isVisited: boolean;
  visitedDate: string | null;
}

function groupByWinery(entries: JournalEntry[], visitedWineries: VisitedWinery[]): WineryGroup[] {
  const groups = new Map<string, WineryGroup>();

  // Build a lookup for visited wineries by wineryId
  const visitedMap = new Map<number, VisitedWinery>();
  for (const v of visitedWineries) {
    visitedMap.set(v.wineryId, v);
  }

  // Group journal entries by winery
  for (const entry of entries) {
    const key = entry.wineryName || "Unknown Winery";
    const existing = groups.get(key);
    if (existing) {
      existing.entries.push(entry);
      if (entry.dateTried > existing.latestDate) existing.latestDate = entry.dateTried;
      if (entry.dateTried < existing.earliestDate) existing.earliestDate = entry.dateTried;
    } else {
      const visited = entry.wineryId ? visitedMap.get(entry.wineryId) : undefined;
      groups.set(key, {
        wineryName: key,
        winerySlug: entry.winerySlug,
        wineryId: entry.wineryId,
        entries: [entry],
        latestDate: entry.dateTried,
        earliestDate: entry.dateTried,
        isVisited: !!visited,
        visitedDate: visited?.visitedDate ?? null,
      });
    }
  }

  // Mark visited status for groups that matched by wineryId
  for (const group of groups.values()) {
    if (!group.isVisited && group.wineryId) {
      const visited = visitedMap.get(group.wineryId);
      if (visited) {
        group.isVisited = true;
        group.visitedDate = visited.visitedDate;
      }
    }
  }

  // Add visit-only wineries (no journal entries)
  const groupedWineryIds = new Set<number>();
  for (const group of groups.values()) {
    if (group.wineryId) groupedWineryIds.add(group.wineryId);
  }

  for (const v of visitedWineries) {
    if (!groupedWineryIds.has(v.wineryId)) {
      groups.set(`visited-${v.wineryId}`, {
        wineryName: v.wineryName,
        winerySlug: v.winerySlug,
        wineryId: v.wineryId,
        entries: [],
        latestDate: v.visitedDate || "",
        earliestDate: v.visitedDate || "",
        isVisited: true,
        visitedDate: v.visitedDate,
      });
    }
  }

  return Array.from(groups.values()).sort(
    (a, b) => new Date(b.latestDate || 0).getTime() - new Date(a.latestDate || 0).getTime()
  );
}

function formatDateRange(earliest: string, latest: string): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (!earliest || !latest) return "";
  if (earliest === latest) return fmt(earliest);
  return `${fmt(earliest)} – ${fmt(latest)}`;
}

function WineryGroupSection({
  group,
  onDelete,
  onEdit,
}: {
  group: WineryGroup;
  onDelete: (id: number) => void;
  onEdit: (entry: JournalEntry) => void;
}) {
  const [expanded, setExpanded] = useState(group.entries.length > 0);
  const hasEntries = group.entries.length > 0;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <button
        onClick={() => hasEntries && setExpanded(!expanded)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${hasEntries ? "hover:bg-[var(--muted)]/50 cursor-pointer" : "cursor-default"}`}
      >
        {hasEntries ? (
          expanded ? (
            <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
          )
        ) : (
          <div className="h-4 w-4 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {group.winerySlug ? (
              <Link
                href={`/wineries/${group.winerySlug}`}
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-burgundy-700 dark:text-burgundy-400 hover:underline"
              >
                {group.wineryName}
              </Link>
            ) : (
              <span className="font-medium">{group.wineryName}</span>
            )}
            {group.isVisited && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                Visited
              </span>
            )}
            {hasEntries && (
              <span className="text-xs text-[var(--muted-foreground)]">
                {group.entries.length} {group.entries.length === 1 ? "wine" : "wines"}
              </span>
            )}
          </div>
          {hasEntries ? (
            <p className="text-xs text-[var(--muted-foreground)]">
              {formatDateRange(group.earliestDate, group.latestDate)}
            </p>
          ) : group.visitedDate ? (
            <p className="text-xs text-[var(--muted-foreground)]">
              Visited on {new Date(group.visitedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          ) : (
            <p className="text-xs text-[var(--muted-foreground)]">Visited</p>
          )}
        </div>
      </button>

      {expanded && hasEntries && (
        <div className="border-t border-[var(--border)] p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {group.entries.map((entry) => (
            <JournalEntryCard
              key={entry.id}
              entry={entry}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VisitCard({ visit }: { visit: VisitedWinery }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-start gap-2">
        <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <h3 className="font-medium truncate">
            {visit.winerySlug ? (
              <Link
                href={`/wineries/${visit.winerySlug}`}
                className="text-burgundy-700 dark:text-burgundy-400 hover:underline"
              >
                {visit.wineryName}
              </Link>
            ) : (
              visit.wineryName
            )}
          </h3>
          {visit.visitedDate && (
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Visited {new Date(visit.visitedDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-full shrink-0">
          <CheckCircle2 className="h-3 w-3" />
          Visited
        </span>
      </div>
    </div>
  );
}

// Merge journal entries and visit-only wineries into a date-sorted list
type DateViewItem =
  | { type: "entry"; entry: JournalEntry }
  | { type: "visit"; visit: VisitedWinery };

function buildDateView(entries: JournalEntry[], visitedWineries: VisitedWinery[]): DateViewItem[] {
  const items: DateViewItem[] = [];

  for (const entry of entries) {
    items.push({ type: "entry", entry });
  }

  // Add visit-only wineries (those without any journal entries)
  const journalWineryIds = new Set(entries.filter(e => e.wineryId).map(e => e.wineryId!));
  for (const v of visitedWineries) {
    if (!journalWineryIds.has(v.wineryId)) {
      items.push({ type: "visit", visit: v });
    }
  }

  items.sort((a, b) => {
    const dateA = a.type === "entry" ? a.entry.dateTried : (a.visit.visitedDate || "");
    const dateB = b.type === "entry" ? b.entry.dateTried : (b.visit.visitedDate || "");
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return items;
}

export function JournalView({
  entries: initialEntries,
  visitedWineries = [],
}: {
  entries: JournalEntry[];
  visitedWineries?: VisitedWinery[];
}) {
  const router = useRouter();
  const [view, setView] = useState<"winery" | "date">("winery");
  const [entries, setEntries] = useState(initialEntries);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  const wineryGroups = groupByWinery(entries, visitedWineries);
  const dateItems = buildDateView(entries, visitedWineries);

  async function handleDelete(id: number) {
    if (!confirm("Delete this journal entry?")) return;

    const res = await fetch(`/api/user/journal/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
  }

  function handleEdit(entry: JournalEntry) {
    setEditingEntry(entry);
  }

  function handleEditSaved() {
    setEditingEntry(null);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center gap-1 mb-6 rounded-lg bg-[var(--muted)] p-1 w-fit text-sm">
        <button
          onClick={() => setView("winery")}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            view === "winery"
              ? "bg-[var(--card)] font-medium shadow-sm"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          By winery
        </button>
        <button
          onClick={() => setView("date")}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            view === "date"
              ? "bg-[var(--card)] font-medium shadow-sm"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          By date
        </button>
      </div>

      {view === "winery" ? (
        <div className="space-y-4">
          {wineryGroups.map((group) => (
            <WineryGroupSection
              key={group.wineryId ? `winery-${group.wineryId}` : group.wineryName}
              group={group}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dateItems.map((item) =>
            item.type === "entry" ? (
              <JournalEntryCard
                key={`entry-${item.entry.id}`}
                entry={item.entry}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ) : (
              <VisitCard
                key={`visit-${item.visit.wineryId}`}
                visit={item.visit}
              />
            )
          )}
        </div>
      )}

      {editingEntry && (
        <JournalEditForm
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
}
