"use client";

import { useState } from "react";
import { Plus, MapPin } from "lucide-react";
import { JournalEntryForm } from "./JournalEntryForm";
import { JournalVisitForm } from "./JournalVisitForm";

export function JournalActions() {
  const [showForm, setShowForm] = useState(false);
  const [showVisitForm, setShowVisitForm] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowVisitForm(true)}
        className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
      >
        <MapPin className="h-4 w-4" />
        Log Visit
      </button>

      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 rounded-lg bg-burgundy-700 px-4 py-2 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Log Wine
      </button>

      {showForm && (
        <JournalEntryForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            window.location.reload();
          }}
        />
      )}

      {showVisitForm && (
        <JournalVisitForm
          onClose={() => setShowVisitForm(false)}
          onSaved={() => {
            setShowVisitForm(false);
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
