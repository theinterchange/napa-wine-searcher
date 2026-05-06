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
import { TriedItButton } from "./TriedItButton";

function WineTypeBadge({ wineType }: { wineType: string | null; category: string | null }) {
  if (!wineType) return null;
  return (
    <span
      className="inline-block whitespace-nowrap border border-[var(--rule)] bg-[var(--paper)] px-2 py-0.5 font-mono text-[10px] tracking-[0.08em] uppercase text-[var(--ink-2)]"
      title={wineType}
    >
      {wineType}
    </span>
  );
}

export function WineCategory({
  category,
  wines,
  defaultOpen = false,
  wineryId,
  wineryName,
}: {
  category: string;
  wines: Wine[];
  defaultOpen?: boolean;
  wineryId?: number;
  wineryName?: string;
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
    <div className="rounded-xl border border-[var(--rule)] bg-[var(--paper-2)] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--paper)]/60 ${
          open ? "bg-[var(--paper)]/40" : ""
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
          <div className="hidden md:block border-t border-[var(--rule-soft)] bg-[var(--paper)]">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col />
                <col className="w-[200px]" />
                <col className="w-[72px]" />
                <col className="w-[72px]" />
                {wineryId && <col className="w-[90px]" />}
              </colgroup>
              <thead className="bg-[var(--paper-2)]">
                <tr className="text-xs text-[var(--ink-3)] uppercase tracking-wider">
                  <th className="text-left px-3 py-2 font-medium">Wine</th>
                  <th className="text-left px-3 py-2 font-medium">Type</th>
                  <th className="text-left px-3 py-2 font-medium">Vintage</th>
                  <th className="text-left px-3 py-2 font-medium">Price</th>
                  {wineryId && <th className="px-3 py-2 font-medium" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule-soft)]">
                {sorted.map((wine) => (
                  <tr key={wine.id} className="hover:bg-[var(--paper-2)]/60">
                    <td className="px-3 py-2.5" title={wine.name}>
                      <div className="font-medium truncate">{wine.name}</div>
                      {wine.description && (
                        <div className="mt-0.5 text-xs text-[var(--muted-foreground)] truncate">
                          {wine.description}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <WineTypeBadge wineType={wine.wineType} category={wine.category} />
                    </td>
                    <td className="px-3 py-2.5 text-[var(--muted-foreground)]">
                      {wine.vintage || "NV"}
                    </td>
                    <td className="px-3 py-2.5 font-medium">
                      {wine.price != null && formatPrice(wine.price)}
                    </td>
                    {wineryId && (
                      <td className="px-3 py-2.5">
                        <TriedItButton
                          wineId={wine.id}
                          wineName={wine.name}
                          vintage={wine.vintage}
                          wineryId={wineryId}
                          wineryName={wineryName || ""}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card layout */}
          <div className="md:hidden border-t border-[var(--rule-soft)] p-3 space-y-3">
            {sorted.map((wine) => (
              <div
                key={wine.id}
                className="rounded-xl border border-[var(--rule-soft)] bg-[var(--paper)] p-4"
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
                    <span className="shrink-0 text-sm font-semibold text-[var(--foreground)]">
                      {formatPrice(wine.price)}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <WineTypeBadge wineType={wine.wineType} category={wine.category} />
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {wine.vintage || "NV"}
                  </span>
                  {wineryId && (
                    <TriedItButton
                      wineId={wine.id}
                      wineName={wine.name}
                      vintage={wine.vintage}
                      wineryId={wineryId}
                      wineryName={wineryName || ""}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
