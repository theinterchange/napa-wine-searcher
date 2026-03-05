"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

const STORAGE_KEY = "compare-selected-wineries";
const MAX_COMPARE = 4;

interface CompareWinery {
  id: number;
  name: string;
}

interface CompareContextValue {
  selectedWineries: CompareWinery[];
  selectedIds: number[];
  toggle: (id: number, name: string) => void;
  remove: (id: number) => void;
  clear: () => void;
  isSelected: (id: number) => boolean;
  isFull: boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

function loadFromStorage(): CompareWinery[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CompareWinery[];
  } catch {
    return [];
  }
}

function saveToStorage(wineries: CompareWinery[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wineries));
  } catch {}
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [selectedWineries, setSelectedWineries] = useState<CompareWinery[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSelectedWineries(loadFromStorage());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      saveToStorage(selectedWineries);
    }
  }, [selectedWineries, mounted]);

  const selectedIds = selectedWineries.map((w) => w.id);
  const isFull = selectedWineries.length >= MAX_COMPARE;

  const isSelected = useCallback(
    (id: number) => selectedWineries.some((w) => w.id === id),
    [selectedWineries]
  );

  const toggle = useCallback(
    (id: number, name: string) => {
      setSelectedWineries((prev) => {
        const exists = prev.some((w) => w.id === id);
        if (exists) return prev.filter((w) => w.id !== id);
        if (prev.length >= MAX_COMPARE) return prev;
        return [...prev, { id, name }];
      });
    },
    []
  );

  const remove = useCallback((id: number) => {
    setSelectedWineries((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const clear = useCallback(() => {
    setSelectedWineries([]);
  }, []);

  return (
    <CompareContext.Provider
      value={{ selectedWineries, selectedIds, toggle, remove, clear, isSelected, isFull }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
