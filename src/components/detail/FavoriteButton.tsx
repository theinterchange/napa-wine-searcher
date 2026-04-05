"use client";

import { Heart, Check } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AuthGateModal } from "@/components/auth/AuthGateModal";

export function FavoriteButton({ wineryId, compact }: { wineryId: number; compact?: boolean }) {
  const { data: session } = useSession();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/user/favorites?wineryId=${wineryId}`)
      .then((r) => r.json())
      .then((data) => setIsFavorite(data.isFavorite))
      .catch(() => {});
  }, [session, wineryId]);

  const toggle = async () => {
    if (!session) {
      setShowAuthModal(true);
      return;
    }
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
          "flex items-center gap-2 rounded-lg text-sm font-medium transition-colors",
          compact ? "px-2.5 py-2" : "px-4 py-2",
          isFavorite
            ? "bg-burgundy-100 text-burgundy-700 dark:bg-burgundy-900 dark:text-burgundy-300"
            : "border border-[var(--border)] hover:bg-[var(--muted)]"
        )}
      >
        <Heart
          className={cn("h-4 w-4", isFavorite && "fill-burgundy-600 text-burgundy-600")}
        />
        {!compact && (isFavorite ? "Favorited" : "Add to Favorites")}
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
