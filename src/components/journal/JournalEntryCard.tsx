import { Star, Trash2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface JournalEntry {
  id: number;
  wineName: string;
  wineryName: string | null;
  vintage: number | null;
  rating: number | null;
  tastingNotes: string | null;
  dateTried: string;
}

interface JournalEntryCardProps {
  entry: JournalEntry;
  onDelete?: (id: number) => void;
}

export function JournalEntryCard({ entry, onDelete }: JournalEntryCardProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium truncate">
            {entry.wineName}
            {entry.vintage && (
              <span className="text-[var(--muted-foreground)] ml-1">
                ({entry.vintage})
              </span>
            )}
          </h3>
          {entry.wineryName && (
            <p className="text-sm text-[var(--muted-foreground)] flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" />
              {entry.wineryName}
            </p>
          )}
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(entry.id)}
            className="p-1 text-[var(--muted-foreground)] hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
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
    </div>
  );
}
