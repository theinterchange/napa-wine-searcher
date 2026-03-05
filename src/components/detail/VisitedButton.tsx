"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function VisitedButton({ wineryId, compact }: { wineryId: number; compact?: boolean }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isVisited, setIsVisited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/user/visited?wineryId=${wineryId}`)
      .then((r) => r.json())
      .then((data) => setIsVisited(data.isVisited))
      .catch(() => {});
  }, [session, wineryId]);

  const toggle = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setLoading(true);
    const prev = isVisited;
    setIsVisited(!prev);
    try {
      const method = prev ? "DELETE" : "POST";
      const res = await fetch("/api/user/visited", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wineryId }),
      });
      if (!res.ok) setIsVisited(prev);
    } catch {
      setIsVisited(prev);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={compact ? (isVisited ? "Visited" : "Mark Visited") : undefined}
      className={cn(
        "flex items-center gap-2 rounded-lg text-sm font-medium transition-colors",
        compact ? "px-2.5 py-2" : "px-4 py-2",
        isVisited
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
          : "border border-[var(--border)] hover:bg-[var(--muted)]"
      )}
    >
      {isVisited ? (
        <CheckCircle2 className="h-4 w-4 fill-emerald-600 text-emerald-600 dark:fill-emerald-400 dark:text-emerald-400" />
      ) : (
        <Circle className="h-4 w-4" />
      )}
      {!compact && (isVisited ? "Visited" : "Mark Visited")}
    </button>
  );
}
