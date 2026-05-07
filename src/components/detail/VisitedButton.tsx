"use client";

import { Check } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { AuthGateModal } from "@/components/auth/AuthGateModal";
import { setPendingAction, consumePendingAction } from "@/lib/pending-action";

export function VisitedButton({ wineryId }: { wineryId: number }) {
  const { data: session } = useSession();
  const [isVisited, setIsVisited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const pendingHandled = useRef(false);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/user/visited?wineryId=${wineryId}`)
      .then((r) => r.json())
      .then((data) => setIsVisited(data.isVisited))
      .catch(() => {});
  }, [session, wineryId]);

  // Auto-execute pending action after signup/login
  useEffect(() => {
    if (!session || pendingHandled.current) return;
    pendingHandled.current = true;
    if (consumePendingAction("visited", wineryId)) {
      setTimeout(() => toggleAction(), 500);
    }
  }, [session, wineryId]);

  const toggle = () => {
    if (!session) {
      setPendingAction("visited", wineryId);
      setShowAuthModal(true);
      return;
    }
    toggleAction();
  };

  const toggleAction = async () => {
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
        className={cn(
          "inline-flex items-center gap-2 px-3.5 py-2.5 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold transition-colors",
          isVisited
            ? "border border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800"
            : "border border-[var(--rule)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--brass)] hover:text-[var(--brass-2)]"
        )}
      >
        <Check
          className={cn("h-3.5 w-3.5", isVisited ? "text-white" : "text-[var(--brass)]")}
        />
        {isVisited ? "Visited" : "Visited?"}
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
