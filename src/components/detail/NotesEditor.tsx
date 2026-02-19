"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Save, Pencil } from "lucide-react";

export function NotesEditor({ wineryId }: { wineryId: number }) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/user/notes?wineryId=${wineryId}`)
      .then((r) => r.json())
      .then((data) => setContent(data.content || ""))
      .catch(() => {});
  }, [session, wineryId]);

  if (!session) return null;

  const save = async () => {
    setLoading(true);
    try {
      await fetch("/api/user/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wineryId, content }),
      });
      setSaved(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
          <Pencil className="h-4 w-4" />
          My Notes
        </h3>
        {!saved && (
          <button
            onClick={save}
            disabled={loading}
            className="flex items-center gap-1 text-sm text-burgundy-700 dark:text-burgundy-400 hover:underline"
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </button>
        )}
      </div>
      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setSaved(false);
        }}
        onBlur={() => !saved && save()}
        placeholder="Add your tasting notes, visit reminders..."
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-sm min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-burgundy-500"
      />
    </div>
  );
}
