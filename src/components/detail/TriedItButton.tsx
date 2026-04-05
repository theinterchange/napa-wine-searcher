"use client";

import { Check, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { JournalEntryForm } from "@/components/journal/JournalEntryForm";
import { AuthGateModal } from "@/components/auth/AuthGateModal";

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

  const handleClick = () => {
    if (!session) {
      setShowAuthModal(true);
      return;
    }
    setShowForm(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors whitespace-nowrap bg-burgundy-50 text-burgundy-700 hover:bg-burgundy-100 dark:bg-burgundy-900/30 dark:text-burgundy-400 dark:hover:bg-burgundy-900/50"
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
