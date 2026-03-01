"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface MultiSelectDropdownProps {
  label: string;
  options: DropdownOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  multiSelect?: boolean;
}

export function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  multiSelect = true,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const toggle = useCallback(
    (value: string) => {
      if (multiSelect) {
        const next = selected.includes(value)
          ? selected.filter((v) => v !== value)
          : [...selected, value];
        onChange(next);
      } else {
        // Single-select: toggle off or select new value
        onChange(selected.includes(value) ? [] : [value]);
        setOpen(false);
      }
    },
    [selected, onChange, multiSelect]
  );

  const clear = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const selectedLabel =
    selected.length === 1
      ? options.find((o) => o.value === selected[0])?.label || label
      : label;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          selected.length > 0
            ? "border-burgundy-600 bg-burgundy-50 text-burgundy-700 dark:border-burgundy-700 dark:bg-burgundy-950 dark:text-burgundy-300"
            : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]"
        }`}
      >
        <span className="whitespace-nowrap">
          {selected.length > 1 ? label : selectedLabel}
        </span>
        {selected.length > 1 && (
          <span className="inline-flex items-center justify-center rounded-full bg-burgundy-700 px-1.5 text-xs font-medium text-white min-w-[1.25rem] h-5 dark:bg-burgundy-600">
            {selected.length}
          </span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 text-[var(--muted-foreground)] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] max-h-[320px] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="flex w-full items-center gap-1.5 border-b border-[var(--border)] px-3 py-2 text-xs text-burgundy-700 dark:text-burgundy-400 hover:bg-[var(--muted)] transition-colors"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
          {options.map((opt) => {
            const isSelected = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors text-left"
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                    isSelected
                      ? "border-burgundy-600 bg-burgundy-600 text-white dark:border-burgundy-500 dark:bg-burgundy-500"
                      : "border-[var(--border)]"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </span>
                <span className="flex-1">
                  {opt.label}
                  {opt.sublabel && (
                    <span className="ml-1.5 text-xs text-[var(--muted-foreground)]">
                      {opt.sublabel}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
