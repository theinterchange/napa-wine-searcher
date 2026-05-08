"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, X } from "lucide-react";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function toYearMonth(year: number, monthZeroBased: number): string {
  return `${year}-${String(monthZeroBased + 1).padStart(2, "0")}`;
}

function nextMonths(count: number): { ym: string; year: number; month: number }[] {
  const out: { ym: string; year: number; month: number }[] = [];
  const now = new Date();
  let y = now.getUTCFullYear();
  let m = now.getUTCMonth();
  for (let i = 0; i < count; i++) {
    out.push({ ym: toYearMonth(y, m), year: y, month: m });
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return out;
}

interface Props {
  current: string | null;
  occupied: Record<string, string>;
  ownerName: string;
  onSelect: (ym: string | null) => void | Promise<void>;
}

export function SpotlightMonthPicker({ current, occupied, ownerName, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function pick(ym: string) {
    const occupiedBy = occupied[ym];
    if (occupiedBy && occupiedBy !== ownerName) {
      const ok = window.confirm(
        `${ym} is already assigned to ${occupiedBy}. Reassign it to ${ownerName}? This will leave ${occupiedBy} unscheduled.`
      );
      if (!ok) return;
    }
    setOpen(false);
    await onSelect(ym === current ? null : ym);
  }

  async function clear() {
    setOpen(false);
    await onSelect(null);
  }

  const months = nextMonths(12);

  return (
    <div className="relative inline-block" ref={ref}>
      {current ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] uppercase font-semibold bg-[var(--brass)] text-[var(--paper)] hover:bg-[var(--brass-2)] transition-colors"
          >
            <Calendar className="h-3 w-3" />
            {current}
          </button>
          <button
            type="button"
            onClick={clear}
            className="p-1 text-[var(--ink-3)] hover:text-red-700 rounded"
            title="Clear assignment"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[var(--ink-3)] hover:text-[var(--brass-2)] transition-colors"
        >
          + Assign
        </button>
      )}

      {open && (
        <div
          className="absolute z-50 mt-2 left-0 w-[280px] bg-[var(--paper)] border border-[var(--ink)] shadow-lg p-3"
          role="dialog"
        >
          <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--ink-3)] mb-2 flex items-center justify-between">
            <span>Pick spotlight month</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[var(--ink-3)] hover:text-[var(--ink)]"
              aria-label="Close"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {months.map(({ ym, year, month }, i) => {
              const isCurrent = current === ym;
              const owner = occupied[ym];
              const taken = !!owner && owner !== ownerName;
              const showYear = i === 0 || month === 0;
              return (
                <button
                  key={ym}
                  type="button"
                  onClick={() => pick(ym)}
                  className={`flex flex-col items-center justify-center px-2 py-2 text-xs transition-colors border ${
                    isCurrent
                      ? "bg-[var(--brass)] text-[var(--paper)] border-[var(--brass-2)]"
                      : taken
                      ? "border-[var(--rule)] text-[var(--ink-3)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)]"
                      : "border-transparent hover:border-[var(--ink)] text-[var(--ink)]"
                  }`}
                  title={taken ? `Currently: ${owner}` : isCurrent ? "Current assignment — click to clear" : ""}
                >
                  <span className="font-mono tabular-nums tracking-tight">
                    {MONTH_LABELS[month]}
                    {showYear ? ` ${String(year).slice(2)}` : ""}
                  </span>
                  {taken && (
                    <span className="mt-0.5 text-[9px] tracking-[0.08em] uppercase truncate max-w-[70px]">
                      {owner}
                    </span>
                  )}
                  {isCurrent && (
                    <span className="mt-0.5 text-[9px] tracking-[0.08em] uppercase">current</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-2 pt-2 border-t border-[var(--rule-soft)] flex items-center justify-between font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--ink-3)]">
            <span>
              <span className="inline-block w-2 h-2 bg-[var(--brass)] mr-1 align-middle" />
              current
            </span>
            <span>
              <span className="inline-block w-2 h-2 border border-[var(--rule)] mr-1 align-middle" />
              taken
            </span>
            {current && (
              <button
                type="button"
                onClick={clear}
                className="text-red-700 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
