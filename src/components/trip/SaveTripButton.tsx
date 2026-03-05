"use client";

import { Save, Check } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";

interface SaveTripButtonProps {
  stopIds: number[];
  theme?: string;
  valley?: string;
}

export function SaveTripButton({ stopIds, theme, valley }: SaveTripButtonProps) {
  const { data: session } = useSession();
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!session) return null;

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);

    try {
      const res = await fetch("/api/user/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          stops: stopIds,
          theme,
          valley,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setShowInput(false);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 dark:border-emerald-700 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
        <Check className="h-4 w-4" />
        Saved!
      </div>
    );
  }

  if (showInput) {
    return (
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Trip name..."
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
        />
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="rounded-lg bg-burgundy-700 px-3 py-2 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors disabled:opacity-50"
        >
          {saving ? "..." : "Save"}
        </button>
        <button
          onClick={() => setShowInput(false)}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowInput(true)}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium hover:border-burgundy-400 dark:hover:border-burgundy-600 transition-colors"
    >
      <Save className="h-4 w-4" />
      Save Trip
    </button>
  );
}
