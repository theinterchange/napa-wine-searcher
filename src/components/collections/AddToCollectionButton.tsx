"use client";

import { ListPlus, Check, Plus, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { AuthGateModal } from "@/components/auth/AuthGateModal";
import { setPendingAction, consumePendingAction } from "@/lib/pending-action";

interface Collection {
  id: number;
  name: string;
  itemCount: number;
}

export function AddToCollectionButton({ wineryId, compact }: { wineryId: number; compact?: boolean }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [memberOf, setMemberOf] = useState<Set<number>>(new Set());
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pendingHandled = useRef(false);

  // Auto-open dropdown after signup/login
  useEffect(() => {
    if (!session || pendingHandled.current) return;
    pendingHandled.current = true;
    if (consumePendingAction("collection", wineryId)) {
      setOpen(true);
    }
  }, [session, wineryId]);

  useEffect(() => {
    if (!session || !open) return;
    fetch("/api/user/collections")
      .then((r) => r.json())
      .then(async (cols: Collection[]) => {
        setCollections(cols);
      })
      .catch(() => {});
  }, [session, open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleClick = () => {
    if (!session) {
      setPendingAction("collection", wineryId);
      setShowAuthModal(true);
      return;
    }
    setOpen(!open);
  };

  async function toggleCollection(collectionId: number) {
    const isMember = memberOf.has(collectionId);
    const method = isMember ? "DELETE" : "POST";

    await fetch(`/api/user/collections/${collectionId}/items`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wineryId }),
    });

    setMemberOf((prev) => {
      const next = new Set(prev);
      if (isMember) next.delete(collectionId);
      else next.add(collectionId);
      return next;
    });
  }

  async function createAndAdd() {
    if (!newName.trim()) return;
    setCreating(true);

    try {
      const res = await fetch("/api/user/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const col = await res.json();

      await fetch(`/api/user/collections/${col.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wineryId }),
      });

      setCollections((prev) => [
        { id: col.id, name: col.name, itemCount: 1 },
        ...prev,
      ]);
      setMemberOf((prev) => new Set(prev).add(col.id));
      setNewName("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleClick}
        title={compact ? "Add to List" : undefined}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)] transition-colors",
          compact ? "px-2.5 py-2" : "px-4 py-2"
        )}
      >
        <ListPlus className="h-4 w-4" />
        {!compact && "Add to List"}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg z-50">
          <div className="p-3 border-b border-[var(--border)]">
            <p className="text-sm font-medium">Add to Collection</p>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {collections.length > 0 ? (
              collections.map((col) => (
                <button
                  key={col.id}
                  onClick={() => toggleCollection(col.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors text-left"
                >
                  <div
                    className={cn(
                      "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                      memberOf.has(col.id)
                        ? "bg-burgundy-900 border-burgundy-700"
                        : "border-[var(--border)]"
                    )}
                  >
                    {memberOf.has(col.id) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className="truncate">{col.name}</span>
                  <span className="ml-auto text-xs text-[var(--muted-foreground)]">
                    {col.itemCount}
                  </span>
                </button>
              ))
            ) : (
              <p className="px-3 py-4 text-sm text-center text-[var(--muted-foreground)]">
                No collections yet
              </p>
            )}
          </div>

          <div className="p-3 border-t border-[var(--border)]">
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New collection..."
                onKeyDown={(e) => e.key === "Enter" && createAndAdd()}
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
              <button
                onClick={createAndAdd}
                disabled={creating || !newName.trim()}
                className="rounded-lg bg-burgundy-900 px-2 py-1.5 text-white disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      {showAuthModal && (
        <AuthGateModal
          message="Organize wineries into collections — group by region, style, or any theme that fits the trip."
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
