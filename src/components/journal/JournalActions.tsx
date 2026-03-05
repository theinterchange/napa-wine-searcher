"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { JournalEntryForm } from "./JournalEntryForm";

export function JournalActions() {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
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
    </>
  );
}
