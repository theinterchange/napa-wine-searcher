"use client";

import { Settings, X, Check } from "lucide-react";
import { useState, useEffect } from "react";

export function ProfileSettings() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/user/settings")
      .then((r) => r.json())
      .then((data) => {
        setUsername(data.username || "");
        setIsPublic(data.isPublic || false);
      })
      .catch(() => {});
  }, [open]);

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username || null, isPublic }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        setSaving(false);
        return;
      }

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setOpen(false);
      }, 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors"
      >
        <Settings className="h-4 w-4" />
        Settings
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-bold">
                Profile Settings
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-[var(--muted)] rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="your-username"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                />
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  3-30 characters, letters, numbers, hyphens, underscores
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Public Profile</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Others can see your collections at /u/{username || "username"}
                  </p>
                </div>
                <button
                  onClick={() => setIsPublic(!isPublic)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isPublic
                      ? "bg-burgundy-700"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isPublic ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-lg bg-burgundy-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saved ? (
                  <>
                    <Check className="h-4 w-4" /> Saved!
                  </>
                ) : saving ? (
                  "Saving..."
                ) : (
                  "Save Settings"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
