"use client";

import { Wine as WineIcon } from "lucide-react";
import { WineCategory } from "./WineCategory";
import {
  CATEGORY_ORDER,
  type Wine,
} from "./wine-constants";

export function WineTable({
  wines,
  curated = false,
  websiteUrl,
  phone,
  wineryId,
  wineryName,
}: {
  wines: Wine[];
  curated?: boolean;
  websiteUrl?: string | null;
  phone?: string | null;
  affiliateUrl?: string | null;
  wineryId?: number;
  wineryName?: string;
  winerySlug?: string;
}) {
  if (wines.length === 0) {
    return (
      <div>
        <h2 className="font-heading text-2xl font-semibold mb-4">Wine List</h2>
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/30 px-6 py-12 text-center">
          <WineIcon className="mx-auto h-10 w-10 text-[var(--muted-foreground)]/50" />
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            Wine details aren&apos;t available online.
          </p>
          {(websiteUrl || phone) && (
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Contact {wineryName || "the winery"} directly for current
              offerings
              {" \u2014 "}
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--foreground)] underline font-medium"
                >
                  visit their website
                </a>
              )}
              {websiteUrl && phone && " or "}
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="text-[var(--foreground)] underline font-medium"
                >
                  call {phone}
                </a>
              )}
              .
            </p>
          )}
        </div>
      </div>
    );
  }

  // Group wines by category
  const groups = new Map<string, Wine[]>();
  for (const wine of wines) {
    const cat = wine.category || "other";
    const list = groups.get(cat);
    if (list) list.push(wine);
    else groups.set(cat, [wine]);
  }

  const orderedGroups = CATEGORY_ORDER.filter((cat) => groups.has(cat)).map(
    (cat) => ({ category: cat, wines: groups.get(cat)! })
  );

  let largestCat = orderedGroups[0]?.category;
  let largestCount = 0;
  for (const g of orderedGroups) {
    if (g.wines.length > largestCount) {
      largestCount = g.wines.length;
      largestCat = g.category;
    }
  }

  return (
    <div>
      <h2 className="font-heading text-2xl font-semibold mb-2">
        Wine List{" "}
        <span className="text-base font-normal text-[var(--muted-foreground)]">
          ({wines.length})
        </span>
      </h2>
      {!curated && (
        <p className="mb-4 text-xs text-[var(--muted-foreground)] italic">
          Prices are approximate and may not reflect current offerings.
        </p>
      )}
      <div className="space-y-3">
        {orderedGroups.map((g) => (
          <WineCategory
            key={g.category}
            category={g.category}
            wines={g.wines}
            defaultOpen={g.category === largestCat}
            wineryId={wineryId}
            wineryName={wineryName}
          />
        ))}
      </div>
    </div>
  );
}
