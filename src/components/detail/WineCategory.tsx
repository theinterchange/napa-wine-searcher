"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import {
  categoryColors,
  categoryIcons,
  categoryLabels,
  type Wine,
} from "./wine-constants";

function WineTypeBadge({ wineType, category }: { wineType: string | null; category: string | null }) {
  if (!wineType) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
        categoryColors[category || ""] || categoryColors.other
      }`}
    >
      {wineType}
    </span>
  );
}

export function WineCategory({
  category,
  wines,
  defaultOpen = false,
}: {
  category: string;
  wines: Wine[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const icon = categoryIcons[category] || categoryIcons.other;
  const label = categoryLabels[category] || `${category.charAt(0).toUpperCase() + category.slice(1)} Wines`;
  const color = categoryColors[category] || categoryColors.other;

  // Sort wines within category by wineType then name
  const sorted = [...wines].sort((a, b) => {
    const typeA = a.wineType || "";
    const typeB = b.wineType || "";
    if (typeA !== typeB) return typeA.localeCompare(typeB);
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--muted)]/50 ${
          open ? "bg-[var(--muted)]/30" : ""
        }`}
      >
        <span className="flex items-center gap-2 font-medium text-sm">
          <span className="text-base">{icon}</span>
          <span>{label}</span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
            {wines.length}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[var(--muted-foreground)] shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <>
          {/* Desktop table */}
          <div className="hidden md:block border-t border-[var(--border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--muted)]">
                <tr>
                  <th className="text-left p-4 font-medium">Wine</th>
                  <th className="text-left p-4 font-medium min-w-[160px]">Type</th>
                  <th className="text-left p-4 font-medium">Vintage</th>
                  <th className="text-left p-4 font-medium">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {sorted.map((wine) => (
                  <tr key={wine.id} className="hover:bg-[var(--muted)]/50">
                    <td className="p-4">
                      <div className="font-medium">{wine.name}</div>
                      {wine.description && (
                        <div className="mt-1 text-xs text-[var(--muted-foreground)] line-clamp-1">
                          {wine.description}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <WineTypeBadge wineType={wine.wineType} category={wine.category} />
                    </td>
                    <td className="p-4 text-[var(--muted-foreground)]">
                      {wine.vintage || "NV"}
                    </td>
                    <td className="p-4">
                      {wine.price != null && formatPrice(wine.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card layout */}
          <div className="md:hidden border-t border-[var(--border)] p-3 space-y-3">
            {sorted.map((wine) => (
              <div
                key={wine.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{wine.name}</p>
                    {wine.description && (
                      <p className="mt-1 text-xs text-[var(--muted-foreground)] line-clamp-2">
                        {wine.description}
                      </p>
                    )}
                  </div>
                  {wine.price != null && (
                    <span className="shrink-0 text-sm font-semibold text-burgundy-700 dark:text-burgundy-400">
                      {formatPrice(wine.price)}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <WineTypeBadge wineType={wine.wineType} category={wine.category} />
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {wine.vintage || "NV"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
