"use client";

import { useState } from "react";
import { Shuffle, Loader2 } from "lucide-react";
import type { TripStop } from "@/lib/trip-state/types";

interface ShuffleButtonProps {
  theme: string | null;
  valley: string | null;
  currentStopIds: number[];
  onReplaceStops: (stops: TripStop[]) => void;
  disabled?: boolean;
}

/**
 * "Try a different set" — hits /api/itineraries/pool, replaces all non-anchor
 * stops. The caller handles the silent fork via onReplaceStops.
 */
export function ShuffleButton({
  theme,
  valley,
  currentStopIds,
  onReplaceStops,
  disabled,
}: ShuffleButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShuffle = async () => {
    if (!theme) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        theme,
        excludeIds: currentStopIds.join(","),
        limit: String(Math.max(currentStopIds.length, 4)),
      });
      if (valley) params.set("valley", valley);
      const res = await fetch(`/api/itineraries/pool?${params.toString()}`);
      if (!res.ok) throw new Error(`Pool fetch failed (${res.status})`);
      const data = await res.json();
      const pool: TripStop[] = data.pool ?? [];
      if (pool.length < currentStopIds.length) {
        setError("Not enough alternatives — broaden the theme to shuffle.");
        return;
      }
      const nextStops = pool.slice(0, currentStopIds.length);
      onReplaceStops(nextStops);
    } catch (err) {
      console.error(err);
      setError("Couldn't shuffle. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleShuffle}
        disabled={disabled || loading || !theme}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-burgundy-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Shuffle className="h-4 w-4" />
        )}
        Try a different set
      </button>
      {error && (
        <p className="text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
