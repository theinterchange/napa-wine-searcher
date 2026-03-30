"use client";

import { Star, Trash2, Pencil, MapPin, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { wineSearchUrl } from "@/lib/affiliate";
import { TrackedLink } from "@/components/monetization/TrackedLink";
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

interface JournalEntryCardProps {
  entry: JournalEntry;
  onDelete?: (id: number) => void;
  onEdit?: (entry: JournalEntry) => void;
}

export function JournalEntryCard({ entry, onDelete, onEdit }: JournalEntryCardProps) {
  const isVisit = entry.entryType === "visit";
  const searchUrl = !isVisit && entry.wineryName
    ? wineSearchUrl(entry.wineryName, entry.wineName, entry.vintage)
    : null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {isVisit ? (
            <h3 className="font-medium truncate flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
              Winery Visit
            </h3>
          ) : (
            <h3 className="font-medium truncate">
              {entry.wineName}
              {entry.vintage && (
                <span className="text-[var(--muted-foreground)] ml-1">
                  ({entry.vintage})
                </span>
              )}
            </h3>
          )}
          {entry.wineryName && (
            <p className="text-sm text-[var(--muted-foreground)] flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" />
              {entry.winerySlug ? (
                <Link
                  href={`/wineries/${entry.winerySlug}`}
                  className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors"
                >
                  {entry.wineryName}
                </Link>
              ) : (
                entry.wineryName
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(entry)}
              className="p-1 text-[var(--muted-foreground)] hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(entry.id)}
              className="p-1 text-[var(--muted-foreground)] hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2">
        {entry.rating && (
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-3.5 w-3.5",
                  star <= entry.rating!
                    ? "fill-gold-500 text-gold-500"
                    : "text-gray-300 dark:text-gray-600"
                )}
              />
            ))}
          </div>
        )}
        <span className="text-xs text-[var(--muted-foreground)]">
          {new Date(entry.dateTried).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>

      {entry.tastingNotes && (
        <p className="mt-2 text-sm text-[var(--muted-foreground)] line-clamp-3">
          {entry.tastingNotes}
        </p>
      )}

      {searchUrl && (
        <TrackedLink
          href={searchUrl}
          clickType="buy_wine"
          wineryId={entry.wineryId}
          sourcePage="/journal"
          sourceComponent="JournalEntryCard"
          className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          Find online
          <ExternalLink className="h-3 w-3" />
        </TrackedLink>
      )}
    </div>
  );
}
