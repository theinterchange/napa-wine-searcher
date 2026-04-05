"use client";

import { CheckCircle2, Circle, Check } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AuthGateModal } from "@/components/auth/AuthGateModal";

export function VisitedButton({ wineryId, compact }: { wineryId: number; compact?: boolean }) {
  const { data: session } = useSession();
  const [isVisited, setIsVisited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/user/visited?wineryId=${wineryId}`)
      .then((r) => r.json())
      .then((data) => setIsVisited(data.isVisited))
      .catch(() => {});
  }, [session, wineryId]);

  const toggle = async () => {
    if (!session) {
      setShowAuthModal(true);
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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Visited toggle failed:", res.status, data);
        setIsVisited(prev);
        setToast(data.error || "Something went wrong");
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast(prev ? "Removed from visited" : "Marked as visited");
        setTimeout(() => setToast(null), 2000);
      }
    } catch {
      setIsVisited(prev);
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
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2.5 text-sm text-white dark:text-gray-900 shadow-lg animate-in slide-in-from-bottom-4">
          <Check className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          {toast}
        </div>
      )}
      {showAuthModal && (
        <AuthGateModal
          message="Track which wineries have been visited and build a personal map of wine country discoveries."
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </>
  );
}
