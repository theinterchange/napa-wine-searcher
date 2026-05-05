"use client";

import { usePathname, useRouter } from "next/navigation";
import { X, Route } from "lucide-react";
import { useTripBuilder } from "./TripBuilderContext";

export function FloatingTripBar() {
  const { selectedWineries, remove, clear, count } = useTripBuilder();
  const pathname = usePathname();
  const router = useRouter();

  if (
    pathname === "/itineraries" ||
    pathname.startsWith("/itineraries/") ||
    pathname.startsWith("/trips/") ||
    count === 0
  )
    return null;

  const handlePlanTrip = () => {
    const ids = selectedWineries.map((w) => w.id).join(",");
    router.push(`/itineraries/build?stops=${ids}`);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="mx-auto max-w-4xl px-4 pb-4 sm:pb-4 pb-safe">
        <div className="border border-[var(--rule)] bg-[var(--paper)] shadow-lg px-5 py-3.5">
          <div className="flex items-center gap-4">
            <Route className="h-4 w-4 shrink-0 text-[var(--brass)]" />

            <div className="flex flex-1 items-center gap-2 min-w-0 overflow-x-auto">
              {selectedWineries.map((w) => (
                <span
                  key={w.id}
                  className="inline-flex items-center gap-1 shrink-0 border border-[var(--rule)] bg-[var(--paper-2)] px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--ink-2)]"
                >
                  <span className="truncate max-w-[120px] normal-case tracking-normal font-[var(--font-serif-text)] text-[12px] text-[var(--ink)]">{w.name}</span>
                  <button
                    onClick={() => remove(w.id)}
                    aria-label={`Remove ${w.name}`}
                    className="p-0.5 hover:text-burgundy-900 transition-colors shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            {count > 6 && (
              <span className="hidden sm:inline font-[var(--font-serif-text)] text-[12px] text-[var(--brass-2)] shrink-0">
                Most visitors do 3–4
              </span>
            )}

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={clear}
                className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handlePlanTrip}
                className="bg-burgundy-900 px-4 py-2.5 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-white hover:bg-burgundy-800 transition-colors whitespace-nowrap"
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
