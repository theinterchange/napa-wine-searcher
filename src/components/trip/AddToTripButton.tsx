"use client";

import { Plus, Check } from "lucide-react";
import { useTripBuilder } from "./TripBuilderContext";

interface AddToTripButtonProps {
  wineryId: number;
  winerySlug: string;
  wineryName: string;
  showLabel?: boolean;
}

export function AddToTripButton({ wineryId, winerySlug, wineryName, showLabel }: AddToTripButtonProps) {
  const { toggle, isSelected, isFull } = useTripBuilder();
  const selected = isSelected(wineryId);

  if (showLabel) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!selected && isFull) return;
          toggle(wineryId, winerySlug, wineryName);
        }}
        className={`absolute top-2 left-2 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-md transition-all ${
          selected
            ? "bg-burgundy-900 text-white hover:bg-burgundy-800"
            : isFull
              ? "bg-white/80 text-gray-400 cursor-not-allowed"
              : "bg-white/95 text-gray-700 hover:bg-white hover:text-burgundy-700"
        }`}
        aria-label={selected ? `Remove ${wineryName} from trip` : `Add ${wineryName} to trip`}
      >
        {selected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        {selected ? "Added" : "Add to trip"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selected && isFull) return;
        toggle(wineryId, winerySlug, wineryName);
      }}
      className={`absolute top-2 left-2 z-20 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all ${
        selected
          ? "bg-burgundy-900 text-white hover:bg-burgundy-800"
          : isFull
            ? "bg-white/80 text-gray-400 cursor-not-allowed"
            : "bg-white/90 text-gray-600 hover:bg-white hover:text-burgundy-700 hover:scale-110"
      }`}
      title={selected ? "Remove from trip" : isFull ? "Trip is full (5 max)" : "Add to trip"}
      aria-label={selected ? `Remove ${wineryName} from trip` : `Add ${wineryName} to trip`}
    >
      {selected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
    </button>
  );
}
