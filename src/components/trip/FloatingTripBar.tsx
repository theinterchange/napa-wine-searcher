"use client";

import { usePathname, useRouter } from "next/navigation";
import { X, Route } from "lucide-react";
import { useTripBuilder } from "./TripBuilderContext";

export function FloatingTripBar() {
  const { selectedWineries, remove, clear, count } = useTripBuilder();
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/plan-trip" || count === 0) return null;

  const handlePlanTrip = () => {
    const ids = selectedWineries.map((w) => w.id).join(",");
    router.push(`/plan-trip?stops=${ids}`);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="mx-auto max-w-4xl px-4 pb-4 sm:pb-4 pb-safe">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg px-5 py-3.5">
          <div className="flex items-center gap-4">
            <Route className="h-4 w-4 shrink-0 text-burgundy-700 dark:text-burgundy-400" />

            <div className="flex flex-1 items-center gap-2 min-w-0 overflow-x-auto">
              {selectedWineries.map((w) => (
                <span
                  key={w.id}
                  className="inline-flex items-center gap-1 shrink-0 rounded-full bg-burgundy-50 dark:bg-burgundy-950 border border-burgundy-200 dark:border-burgundy-800 px-2.5 py-1 text-xs font-medium text-burgundy-800 dark:text-burgundy-200"
                >
                  <span className="truncate max-w-[120px]">{w.name}</span>
                  <button
                    onClick={() => remove(w.id)}
                    aria-label={`Remove ${w.name}`}
                    className="rounded-full p-0.5 hover:bg-burgundy-200 dark:hover:bg-burgundy-800 transition-colors shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            {count > 6 && (
              <span className="hidden sm:inline text-xs text-amber-600 dark:text-amber-400 shrink-0">
                Most visitors do 3–4
              </span>
            )}

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={clear}
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handlePlanTrip}
                className="rounded-lg bg-burgundy-900 px-4 py-2 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors whitespace-nowrap"
              >
                Plan Trip ({count})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
