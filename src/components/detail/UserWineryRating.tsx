"use client";

import { useState, useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { useSession } from "next-auth/react";
import { InteractiveStarRating } from "@/components/journal/InteractiveStarRating";
import { AuthGateModal } from "@/components/auth/AuthGateModal";
import { setPendingAction, consumePendingAction } from "@/lib/pending-action";

export function UserWineryRating({
  wineryId,
  wineryName,
  size = "md",
}: {
  wineryId: number;
  wineryName: string;
  size?: "sm" | "md";
}) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const pendingHandled = useRef(false);

  useEffect(() => {
    if (!session) {
      setLoaded(true);
      return;
    }
    fetch(`/api/user/ratings/winery?wineryId=${wineryId}`)
      .then((r) => r.json())
      .then((data) => setRating(data.rating ?? 0))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [session, wineryId]);

  useEffect(() => {
    if (!session || pendingHandled.current) return;
    pendingHandled.current = true;
    const pending = consumePendingAction("rate-winery", wineryId);
    if (pending && typeof pending.payload?.rating === "number") {
      setTimeout(() => persist(pending.payload!.rating as number), 500);
    }
  }, [session, wineryId]);

  const handleChange = (next: number) => {
    if (!session) {
      setPendingAction("rate-winery", wineryId, { rating: next });
      setShowAuthModal(true);
      return;
    }
    persist(next);
  };

  const persist = async (next: number) => {
    setLoading(true);
    const prev = rating;
    setRating(next);
    try {
      const res = await fetch("/api/user/ratings/winery", {
        method: next === 0 ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          next === 0 ? { wineryId } : { wineryId, rating: next }
        ),
      });
      if (!res.ok) {
        setRating(prev);
        setToast("Couldn't save rating");
        setTimeout(() => setToast(null), 3000);
        return;
      }
      setToast(next === 0 ? "Rating cleared" : `Rated ${next}/5`);
      setTimeout(() => setToast(null), 2000);
    } catch {
      setRating(prev);
      setToast("Couldn't save rating");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = session
    ? loaded && rating > 0
      ? "Your rating"
      : "Rate this winery"
    : "Rate this winery";

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="text-sm text-[var(--muted-foreground)]">
          {statusLabel}
        </span>
        <div aria-busy={loading} className={loading ? "opacity-70" : undefined}>
          <InteractiveStarRating
            value={rating}
            onChange={handleChange}
            size={size}
          />
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2.5 text-sm text-white dark:text-gray-900 shadow-lg animate-in slide-in-from-bottom-4">
          <Check className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          {toast}
        </div>
      )}
      {showAuthModal && (
        <AuthGateModal
          message={`Sign in to save your rating for ${wineryName}.`}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </>
  );
}
