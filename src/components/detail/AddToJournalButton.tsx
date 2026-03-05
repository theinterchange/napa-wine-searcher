"use client";

import { BookOpen } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { JournalEntryForm } from "@/components/journal/JournalEntryForm";

interface AddToJournalButtonProps {
  wineryId: number;
  wineryName: string;
  prefilledWine?: { id: number; name: string; vintage: number | null };
  compact?: boolean;
}

export function AddToJournalButton({
  wineryId,
  wineryName,
  prefilledWine,
  compact,
}: AddToJournalButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  const handleClick = () => {
    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setShowForm(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        title={compact ? "Log Wine" : undefined}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)] transition-colors",
          compact ? "px-2.5 py-2" : "px-4 py-2"
        )}
      >
        <BookOpen className="h-4 w-4" />
        {!compact && "Log Wine"}
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
