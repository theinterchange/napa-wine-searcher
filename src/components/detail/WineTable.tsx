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
        <span className="kicker">The Pour</span>
        <h2 className="editorial-h2 text-[26px] sm:text-[32px] mt-2">
          Wine <em>list.</em>
        </h2>
        <hr className="rule-brass mt-3" style={{ marginInline: 0 }} />
        <div className="mt-6 border border-dashed border-[var(--rule)] bg-[var(--paper-2)]/40 px-6 py-12 text-center">
          <WineIcon className="mx-auto h-10 w-10 text-[var(--brass)]/50" />
          <p className="mt-3 font-[var(--font-serif-text)] text-[15px] text-[var(--ink-2)]">
            Wine details aren&apos;t available online.
          </p>
          {(websiteUrl || phone) && (
            <p className="mt-2 font-[var(--font-serif-text)] text-[14px] text-[var(--ink-2)]">
              Contact {wineryName || "the winery"} directly for current
              offerings
              {" \u2014 "}
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--ink)] underline decoration-[var(--brass)] underline-offset-4 font-medium"
                >
                  visit their website
                </a>
              )}
              {websiteUrl && phone && " or "}
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="text-[var(--ink)] underline decoration-[var(--brass)] underline-offset-4 font-medium"
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
      <span className="kicker">The Pour</span>
      <h2 className="editorial-h2 text-[26px] sm:text-[32px] mt-2">
        Wine <em>list.</em>{" "}
        <span className="font-[var(--font-serif-text)] text-[16px] text-[var(--ink-3)]">
          ({wines.length})
        </span>
      </h2>
      <hr className="rule-brass mt-3" style={{ marginInline: 0 }} />
      {!curated && (
        <p className="mt-4 font-[var(--font-serif-text)] text-[12.5px] text-[var(--ink-3)]">
          Prices are approximate and may not reflect current offerings.
        </p>
      )}
      <div className="mt-6 space-y-3">
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
