"use client";

import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function FavoriteButton({ wineryId }: { wineryId: number }) {
  const { data: session } = useSession();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/user/favorites?wineryId=${wineryId}`)
      .then((r) => r.json())
      .then((data) => setIsFavorite(data.isFavorite))
      .catch(() => {});
  }, [session, wineryId]);

  if (!session) return null;

  const toggle = async () => {
    setLoading(true);
    try {
      const method = isFavorite ? "DELETE" : "POST";
      await fetch("/api/user/favorites", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wineryId }),
      });
      setIsFavorite(!isFavorite);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        isFavorite
          ? "bg-burgundy-100 text-burgundy-700 dark:bg-burgundy-900 dark:text-burgundy-300"
          : "border border-[var(--border)] hover:bg-[var(--muted)]"
      )}
    >
      <Heart
        className={cn("h-4 w-4", isFavorite && "fill-burgundy-600 text-burgundy-600")}
      />
      {isFavorite ? "Favorited" : "Add to Favorites"}
    </button>
  );
}
