"use client";

import { BookOpen } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { JournalEntryForm } from "@/components/journal/JournalEntryForm";

interface AddToJournalButtonProps {
  wineryId: number;
  wineryName: string;
  prefilledWine?: { id: number; name: string; vintage: number | null };
}

export function AddToJournalButton({
  wineryId,
  wineryName,
  prefilledWine,
}: AddToJournalButtonProps) {
  const { data: session } = useSession();
  const [showForm, setShowForm] = useState(false);

  if (!session) return null;

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
      >
        <BookOpen className="h-4 w-4" />
        Log Wine
      </button>

      {showForm && (
        <JournalEntryForm
          wineryId={wineryId}
          wineryName={wineryName}
          prefilledWine={prefilledWine}
          onClose={() => setShowForm(false)}
          onSaved={() => setShowForm(false)}
        />
      )}
    </>
  );
}
