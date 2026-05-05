"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
  icon?: LucideIcon;
  variant?: "filter" | "sort";
  alwaysShowCount?: boolean;
}

export function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  multiSelect = true,
  icon: Icon,
  alwaysShowCount = false,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        onChange(selected.includes(value) ? [] : [value]);
        setOpen(false);
      }
    },
    [selected, onChange, multiSelect]
  );

  const clear = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const isActive = selected.length > 0;
  const showCount =
    (alwaysShowCount && selected.length >= 1) || selected.length > 1;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`shrink-0 inline-flex items-center gap-2 border px-3.5 py-2 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:ring-offset-2 ${
          isActive
            ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--brass)] hover:border-[var(--brass)]"
            : "border-[var(--ink)] bg-transparent text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
        }`}
      >
        {Icon && <Icon className="h-3 w-3" />}
        <span className="whitespace-nowrap">{label}</span>
        {showCount && (
          <span
            className={`inline-flex items-center justify-center px-1.5 text-[9.5px] tracking-normal min-w-[1.1rem] h-[1.1rem] ${
              isActive
                ? "bg-[var(--brass)] text-[var(--ink)]"
                : "bg-[var(--ink)] text-[var(--paper)]"
            }`}
          >
            {selected.length}
          </span>
        )}
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 min-w-[220px] max-h-[320px] overflow-y-auto border border-[var(--ink)] bg-[var(--paper)]">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="flex w-full items-center gap-2 border-b border-[var(--rule)] px-3.5 py-2.5 font-mono text-[10px] tracking-[0.18em] uppercase font-semibold text-[var(--ink-2)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)] transition-colors"
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
                className="flex w-full items-center gap-3 px-3.5 py-2.5 text-[14px] hover:bg-[var(--paper-2)] transition-colors text-left"
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center border transition-colors ${
                    isSelected
                      ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                      : "border-[var(--ink-3)]"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </span>
                <span className="flex-1 text-[var(--ink)]">
                  {opt.label}
                  {opt.sublabel && (
                    <span className="ml-1.5 text-[12px] text-[var(--ink-3)] font-[var(--font-serif-text)]">
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
