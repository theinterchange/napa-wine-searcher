"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Save, Pencil, Lock } from "lucide-react";
import { AuthGateModal } from "@/components/auth/AuthGateModal";

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

  const [showAuthModal, setShowAuthModal] = useState(false);

  if (!session) {
    return (
      <>
        <button
          onClick={() => setShowAuthModal(true)}
          className="w-full rounded-xl border border-dashed border-[var(--rule)] bg-[var(--paper-2)] p-6 text-left hover:border-[var(--brass)] transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-[var(--font-heading)] text-[18px] sm:text-[20px] font-normal tracking-[-0.01em] text-[var(--ink)] flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Tasting Notes
            </h3>
            <Lock className="h-4 w-4 text-[var(--ink-3)]" />
          </div>
          <p className="text-sm text-[var(--ink-2)]">
            Create a free account to keep personal notes on every winery visited.
          </p>
        </button>
        {showAuthModal && (
          <AuthGateModal
            message="Keep personal notes on every winery — remember what stood out, what to try next time, and tips for future visits."
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </>
    );
  }

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
    <div className="rounded-xl border border-[var(--rule)] bg-[var(--paper-2)] p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-[var(--font-heading)] text-[18px] sm:text-[20px] font-normal tracking-[-0.01em] text-[var(--ink)] flex items-center gap-2">
          <Pencil className="h-4 w-4" />
          My Notes
        </h3>
        {!saved && (
          <button
            onClick={save}
            disabled={loading}
            className="flex items-center gap-1 text-sm text-[var(--ink)] hover:underline"
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
        className="w-full rounded-lg border border-[var(--rule-soft)] bg-[var(--paper)] p-3 text-sm min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-[var(--brass)]"
      />
    </div>
  );
}
