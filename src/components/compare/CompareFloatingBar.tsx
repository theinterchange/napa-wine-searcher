"use client";

import { usePathname, useRouter } from "next/navigation";
import { X, Scale } from "lucide-react";
import { useCompare } from "./CompareContext";

export function CompareFloatingBar() {
  const { selectedWineries, remove, clear } = useCompare();
  const pathname = usePathname();
  const router = useRouter();

  // Hide on compare page or when nothing selected
  if (pathname === "/compare" || selectedWineries.length === 0) return null;

  const handleCompare = () => {
    const ids = selectedWineries.map((w) => w.id).join(",");
    router.push(`/compare?ids=${ids}`);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="mx-auto max-w-4xl px-4 pb-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Scale className="h-4 w-4 shrink-0 text-burgundy-600" />

            <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0">
              {selectedWineries.map((w) => (
                <span
                  key={w.id}
                  className="inline-flex items-center gap-1 rounded-full bg-burgundy-100 dark:bg-burgundy-900 px-2.5 py-1 text-xs font-medium text-burgundy-800 dark:text-burgundy-200 max-w-[140px]"
                >
                  <span className="truncate">{w.name}</span>
                  <button
                    onClick={() => remove(w.id)}
                    aria-label={`Remove ${w.name}`}
                    className="rounded-full p-0.5 hover:bg-burgundy-200 dark:hover:bg-burgundy-800 transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-burgundy-500 focus-visible:ring-offset-2"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={clear}
                aria-label="Clear all wineries from comparison"
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors focus-visible:ring-2 focus-visible:ring-burgundy-500 focus-visible:ring-offset-2 rounded"
              >
                Clear
              </button>
              <button
                onClick={handleCompare}
                className="rounded-lg bg-burgundy-700 px-4 py-2 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors focus-visible:ring-2 focus-visible:ring-burgundy-500 focus-visible:ring-offset-2"
              >
                Compare ({selectedWineries.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
