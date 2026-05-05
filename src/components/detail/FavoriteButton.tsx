"use client";

import { Heart, Check } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { AuthGateModal } from "@/components/auth/AuthGateModal";
import { setPendingAction, consumePendingAction } from "@/lib/pending-action";

export function FavoriteButton({ wineryId, compact }: { wineryId: number; compact?: boolean }) {
  const { data: session } = useSession();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const pendingHandled = useRef(false);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/user/favorites?wineryId=${wineryId}`)
      .then((r) => r.json())
      .then((data) => setIsFavorite(data.isFavorite))
      .catch(() => {});
  }, [session, wineryId]);

  // Auto-execute pending action after signup/login
  useEffect(() => {
    if (!session || pendingHandled.current) return;
    pendingHandled.current = true;
    if (consumePendingAction("favorite", wineryId)) {
      // Small delay to let initial state fetch complete
      setTimeout(() => toggleAction(), 500);
    }
  }, [session, wineryId]);

  const toggle = () => {
    if (!session) {
      setPendingAction("favorite", wineryId);
      setShowAuthModal(true);
      return;
    }
    toggleAction();
  };

  const toggleAction = async () => {
    setLoading(true);
    const prev = isFavorite;
    setIsFavorite(!prev);
    try {
      const method = prev ? "DELETE" : "POST";
      const res = await fetch("/api/user/favorites", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wineryId }),
      });
      if (!res.ok) {
        console.error("Favorite toggle failed:", res.status);
        setIsFavorite(prev);
        setToast("Something went wrong");
        setTimeout(() => setToast(null), 3000);
        return;
      }
      setToast(prev ? "Removed from favorites" : "Added to favorites");
      setTimeout(() => setToast(null), 2000);
    } catch {
      setIsFavorite(prev);
      setToast("Something went wrong");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={toggle}
        disabled={loading}
        title={compact ? (isFavorite ? "Favorited" : "Add to Favorites") : undefined}
        className={cn(
          "inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold transition-colors",
          compact ? "px-3 py-2.5" : "px-4 py-2.5",
          isFavorite
            ? "border border-burgundy-900 bg-burgundy-900 text-white hover:bg-burgundy-800"
            : "border border-[var(--rule)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--brass)] hover:text-[var(--brass-2)]"
        )}
      >
        <Heart
          className={cn("h-3.5 w-3.5", isFavorite ? "fill-white text-white" : "text-[var(--brass)]")}
        />
        {!compact && (isFavorite ? "Favorited" : "Favorite")}
      </button>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2.5 text-sm text-white dark:text-gray-900 shadow-lg animate-in slide-in-from-bottom-4">
          <Check className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          {toast}
        </div>
      )}
      {showAuthModal && (
        <AuthGateModal
          message="Save favorite wineries and build collections to plan the perfect visit."
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </>
  );
}
