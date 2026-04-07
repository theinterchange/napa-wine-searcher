"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

const STORAGE_KEY = "trip-builder-wineries";
const MAX_TRIP_STOPS = 5;

interface TripWinery {
  id: number;
  slug: string;
  name: string;
}

interface TripBuilderContextValue {
  selectedWineries: TripWinery[];
  selectedIds: number[];
  toggle: (id: number, slug: string, name: string) => void;
  remove: (id: number) => void;
  clear: () => void;
  isSelected: (id: number) => boolean;
  isFull: boolean;
  count: number;
}

const TripBuilderContext = createContext<TripBuilderContextValue | null>(null);

function loadFromStorage(): TripWinery[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TripWinery[];
  } catch {
    return [];
  }
}

function saveToStorage(wineries: TripWinery[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wineries));
  } catch {}
}

export function TripBuilderProvider({ children }: { children: ReactNode }) {
  const [selectedWineries, setSelectedWineries] = useState<TripWinery[]>([]);
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
  const isFull = selectedWineries.length >= MAX_TRIP_STOPS;
  const count = selectedWineries.length;

  const isSelected = useCallback(
    (id: number) => selectedWineries.some((w) => w.id === id),
    [selectedWineries]
  );

  const toggle = useCallback(
    (id: number, slug: string, name: string) => {
      setSelectedWineries((prev) => {
        const exists = prev.some((w) => w.id === id);
        if (exists) return prev.filter((w) => w.id !== id);
        if (prev.length >= MAX_TRIP_STOPS) return prev;
        return [...prev, { id, slug, name }];
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
    <TripBuilderContext.Provider
      value={{ selectedWineries, selectedIds, toggle, remove, clear, isSelected, isFull, count }}
    >
      {children}
    </TripBuilderContext.Provider>
  );
}

export function useTripBuilder() {
  const ctx = useContext(TripBuilderContext);
  if (!ctx) throw new Error("useTripBuilder must be used within TripBuilderProvider");
  return ctx;
}
