"use client";

import { useState } from "react";
import { MapPin, CheckCircle2, Mail, Loader2, Check } from "lucide-react";
import Link from "next/link";
import { CopyShareLink } from "@/components/trip/CopyShareLink";

interface TripStop {
  tripId: number;
  stopOrder: number;
  wineryId: number;
  wineryName: string;
}

interface Trip {
  id: number;
  name: string;
  theme: string | null;
  shareCode: string | null;
  createdAt: string;
  stops: TripStop[];
}

export function TripCard({
  trip,
  isCompleted: initialCompleted,
}: {
  trip: Trip;
  isCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [recapState, setRecapState] = useState<
    "idle" | "loading" | "sent" | "error"
  >("idle");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string, duration = 3000) => {
    setToast(msg);
    setTimeout(() => setToast(null), duration);
  };

  const handleComplete = async () => {
    setCompleteLoading(true);
    try {
      const res = await fetch(`/api/user/trips/${trip.id}/complete`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "Something went wrong");
        return;
      }
      const data = await res.json();
      setCompleted(true);
      showToast(
        `Trip completed! ${data.markedCount} ${data.markedCount === 1 ? "winery" : "wineries"} marked as visited.`
      );
    } catch {
      showToast("Something went wrong");
    } finally {
      setCompleteLoading(false);
    }
  };

  const handleRecap = async () => {
    if (recapState === "loading" || recapState === "sent") return;
    setRecapState("loading");
    try {
      const res = await fetch("/api/user/trip-recap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId: trip.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "Failed to send recap");
        setRecapState("error");
        setTimeout(() => setRecapState("idle"), 3000);
        return;
      }
      setRecapState("sent");
      showToast("Recap sent! Check your email.", 5000);
      setTimeout(() => setRecapState("idle"), 5000);
    } catch {
      showToast("Failed to send recap");
      setRecapState("error");
      setTimeout(() => setRecapState("idle"), 3000);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="font-heading font-semibold text-lg">{trip.name}</h3>
        <div className="mt-2 space-y-1">
          {trip.stops.map((stop, i) => (
            <p
              key={i}
              className="text-sm text-[var(--muted-foreground)] flex items-center gap-1.5"
            >
              <MapPin className="h-3 w-3 shrink-0" />
              {stop.wineryName}
            </p>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
          {trip.theme && (
            <span className="rounded-full bg-[var(--muted)] px-2 py-0.5">
              {trip.theme}
            </span>
          )}
          <span>
            {new Date(trip.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          <Link
            href={`/plan-trip?stops=${trip.stops.map((s) => s.wineryId).join(",")}`}
            className="text-sm text-[var(--foreground)] hover:underline"
          >
            View Route
          </Link>
          {trip.shareCode && (
            <CopyShareLink path={`/shared/trip/${trip.shareCode}`} />
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          {completed ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Completed
              </span>
              <button
                onClick={handleRecap}
                disabled={recapState === "loading" || recapState === "sent"}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1 text-xs font-medium hover:bg-[var(--muted)] transition-colors disabled:opacity-60"
              >
                {recapState === "loading" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : recapState === "sent" ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Mail className="h-3.5 w-3.5" />
                )}
                {recapState === "sent" ? "Sent!" : "Email Recap"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleComplete}
              disabled={completeLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--muted)] transition-colors disabled:opacity-60"
            >
              {completeLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              I went on this trip
            </button>
          )}
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2.5 text-sm text-white dark:text-gray-900 shadow-lg animate-in slide-in-from-bottom-4">
          <Check className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          {toast}
        </div>
      )}
    </>
  );
}
