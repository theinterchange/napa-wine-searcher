"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { InteractiveStarRating } from "./InteractiveStarRating";

interface WineOption {
  id: number;
  name: string;
  vintage: number | null;
}

interface JournalEntryFormProps {
  wineryId?: number;
  wineryName?: string;
  prefilledWine?: { id: number; name: string; vintage: number | null };
  onClose: () => void;
  onSaved: () => void;
}

export function JournalEntryForm({
  wineryId,
  wineryName,
  prefilledWine,
  onClose,
  onSaved,
}: JournalEntryFormProps) {
  const [wines, setWines] = useState<WineOption[]>([]);
  const [selectedWineId, setSelectedWineId] = useState<number | null>(
    prefilledWine?.id ?? null
  );
  const [wineName, setWineName] = useState(prefilledWine?.name ?? "");
  const [vintage, setVintage] = useState<string>(
    prefilledWine?.vintage?.toString() ?? ""
  );
  const [rating, setRating] = useState(0);
  const [tastingNotes, setTastingNotes] = useState("");
  const [dateTried, setDateTried] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch winery's wines for the picker
  useEffect(() => {
    if (!wineryId) return;
    fetch(`/api/wineries/${wineryId}/wines`)
      .then((r) => r.json())
      .then((data) => setWines(data))
      .catch(() => {});
  }, [wineryId]);

  function handleWineSelect(id: string) {
    if (id === "custom") {
      setSelectedWineId(null);
      setWineName("");
      setVintage("");
      return;
    }
    const wineId = parseInt(id);
    const wine = wines.find((w) => w.id === wineId);
    if (wine) {
      setSelectedWineId(wine.id);
      setWineName(wine.name);
      setVintage(wine.vintage?.toString() ?? "");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wineName.trim()) {
      setError("Wine name is required");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wineId: selectedWineId,
          wineryId: wineryId || null,
          wineName: wineName.trim(),
          wineryName: wineryName || null,
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
          <h3 className="font-heading text-lg font-bold">Log a Wine</h3>
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

          {/* Wine picker (if on a winery page with wines) */}
          {wines.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Select Wine
              </label>
              <select
                value={selectedWineId?.toString() ?? "custom"}
                onChange={(e) => handleWineSelect(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              >
                <option value="custom">Enter custom wine...</option>
                {wines.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                    {w.vintage ? ` (${w.vintage})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Wine name (editable, or hidden if selected from picker) */}
          {(!selectedWineId || wines.length === 0) && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Wine Name
              </label>
              <input
                type="text"
                required
                value={wineName}
                onChange={(e) => setWineName(e.target.value)}
                placeholder="e.g. Estate Cabernet Sauvignon"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
          )}

          {wineryName && (
            <div className="text-sm text-[var(--muted-foreground)]">
              at {wineryName}
            </div>
          )}

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
              <label className="block text-sm font-medium mb-1">
                Date Tried
              </label>
              <input
                type="date"
                required
                value={dateTried}
                onChange={(e) => setDateTried(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Rating</label>
            <InteractiveStarRating value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tasting Notes
            </label>
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
            {loading ? "Saving..." : "Save to Journal"}
          </button>
        </form>
      </div>
    </div>
  );
}
