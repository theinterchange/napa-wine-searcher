"use client";

import { Bookmark } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function WantToVisitButton({ wineryId, compact }: { wineryId: number; compact?: boolean }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isWantToVisit, setIsWantToVisit] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/user/want-to-visit?wineryId=${wineryId}`)
      .then((r) => r.json())
      .then((data) => setIsWantToVisit(data.isWantToVisit))
      .catch(() => {});
  }, [session, wineryId]);

  const toggle = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setLoading(true);
    try {
      const method = isWantToVisit ? "DELETE" : "POST";
      await fetch("/api/user/want-to-visit", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wineryId }),
      });
      setIsWantToVisit(!isWantToVisit);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={compact ? (isWantToVisit ? "Want to Visit" : "Add to Wish List") : undefined}
      className={cn(
        "flex items-center gap-2 rounded-lg text-sm font-medium transition-colors",
        compact ? "px-2.5 py-2" : "px-4 py-2",
        isWantToVisit
          ? "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300"
          : "border border-[var(--border)] hover:bg-[var(--muted)]"
      )}
    >
      <Bookmark
        className={cn(
          "h-4 w-4",
          isWantToVisit && "fill-sky-600 text-sky-600"
        )}
      />
      {!compact && (isWantToVisit ? "Want to Visit" : "Add to Wish List")}
    </button>
  );
}
