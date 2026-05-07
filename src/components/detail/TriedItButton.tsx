"use client";

import { Check, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { JournalEntryForm } from "@/components/journal/JournalEntryForm";
import { AuthGateModal } from "@/components/auth/AuthGateModal";
import { setPendingAction, consumePendingAction } from "@/lib/pending-action";

interface TriedItButtonProps {
  wineId: number;
  wineName: string;
  vintage: number | null;
  wineryId: number;
  wineryName: string;
}

export function TriedItButton({
  wineId,
  wineName,
  vintage,
  wineryId,
  wineryName,
}: TriedItButtonProps) {
  const { data: session } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [logged, setLogged] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Auto-open form after signup/login
  useEffect(() => {
    if (!session) return;
    if (consumePendingAction("tried-it", wineId)) {
      setShowForm(true);
    }
  }, [session, wineId]);

  const handleClick = () => {
    if (!session) {
      setPendingAction("tried-it", wineId);
      setShowAuthModal(true);
      return;
    }
    setShowForm(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10.5px] tracking-[0.14em] uppercase font-semibold transition-colors whitespace-nowrap border ${
          logged
            ? "border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800"
            : "border-[var(--brass)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--brass)] hover:text-[var(--paper)]"
        }`}
      >
        {logged ? (
          <>
            <Check className="h-3 w-3" /> Logged
          </>
        ) : (
          <>
            <Plus className="h-3 w-3" /> Tried it
          </>
        )}
      </button>

      {showForm && (
        <JournalEntryForm
          wineryId={wineryId}
          wineryName={wineryName}
          prefilledWine={{ id: wineId, name: wineName, vintage }}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            setLogged(true);
          }}
        />
      )}
      {showAuthModal && (
        <AuthGateModal
          message="Track wines and build a personal tasting journal that grows with every visit."
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </>
  );
}
