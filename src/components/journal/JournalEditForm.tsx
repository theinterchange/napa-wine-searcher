"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { InteractiveStarRating } from "./InteractiveStarRating";

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

interface JournalEditFormProps {
  entry: JournalEntry;
  onClose: () => void;
  onSaved: () => void;
}

export function JournalEditForm({ entry, onClose, onSaved }: JournalEditFormProps) {
  const isVisit = entry.entryType === "visit";
  const [wineName, setWineName] = useState(entry.wineName);
  const [vintage, setVintage] = useState<string>(entry.vintage?.toString() ?? "");
  const [rating, setRating] = useState(entry.rating ?? 0);
  const [tastingNotes, setTastingNotes] = useState(entry.tastingNotes ?? "");
  const [dateTried, setDateTried] = useState(entry.dateTried.split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isVisit && !wineName.trim()) {
      setError("Wine name is required");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/user/journal/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wineName: wineName.trim(),
          vintage: vintage ? parseInt(vintage) : null,
          rating: rating || null,
          tastingNotes: tastingNotes.trim() || null,
          dateTried,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        setLoading(false);
        return;
      }

      onSaved();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-[var(--font-heading)] text-[18px] font-normal tracking-[-0.005em] text-[var(--ink)]">{isVisit ? "Edit Visit" : "Edit Journal Entry"}</h3>
          <button onClick={onClose} className="p-1 hover:bg-[var(--muted)] rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          {!isVisit && (
            <div>
              <label className="block text-sm font-medium mb-1">Wine Name</label>
              <input
                type="text"
                required
                value={wineName}
                onChange={(e) => setWineName(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
          )}

          {entry.wineryName && (
            <div className="text-sm text-[var(--muted-foreground)]">
              at {entry.wineryName}
            </div>
          )}

          {isVisit ? (
            <div>
              <label className="block text-sm font-medium mb-1">Date Visited</label>
              <input
                type="date"
                required
                value={dateTried}
                onChange={(e) => setDateTried(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Vintage</label>
                <input
                  type="number"
                  value={vintage}
                  onChange={(e) => setVintage(e.target.value)}
                  placeholder="2022"
                  min={1900}
                  max={2030}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date Tried</label>
                <input
                  type="date"
                  required
                  value={dateTried}
                  onChange={(e) => setDateTried(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Rating</label>
            <InteractiveStarRating value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{isVisit ? "Visit Notes" : "Tasting Notes"}</label>
            <textarea
              value={tastingNotes}
              onChange={(e) => setTastingNotes(e.target.value)}
              placeholder="What did you think? Flavors, aromas, pairings..."
              rows={3}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-burgundy-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-burgundy-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
