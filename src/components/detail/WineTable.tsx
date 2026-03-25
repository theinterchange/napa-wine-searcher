"use client";

import { useState } from "react";
import { Wine as WineIcon, ChevronDown } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { WineCategory } from "./WineCategory";
import {
  CATEGORY_ORDER,
  categoryColors,
  categoryIcons,
  type Wine,
} from "./wine-constants";
import { AffiliateWineLink } from "@/components/monetization/AffiliateWineLink";
import { TriedItButton } from "./TriedItButton";

const INITIAL_SHOW = 6;
const GROUPING_THRESHOLD = 8;

function WineTypeBadge({
  wineType,
  category,
}: {
  wineType: string | null;
  category: string | null;
}) {
  if (!wineType) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
        categoryColors[category || ""] ||
        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      }`}
    >
      <span className="text-[10px]">
        {categoryIcons[category || ""] || "🍇"}
      </span>
      {wineType}
    </span>
  );
}

function WineListItem({
  wine,
  wineryId,
  wineryName,
  winerySlug,
  affiliateUrl,
}: {
  wine: Wine;
  wineryId?: number;
  wineryName?: string;
  winerySlug?: string;
  affiliateUrl?: string | null;
}) {
  return (
    <div className="py-4 first:pt-0">
      <div className="flex items-baseline gap-3">
        <h4 className="font-heading text-base font-semibold shrink-0">
          {wine.name}
        </h4>
        <WineTypeBadge wineType={wine.wineType} category={wine.category} />
        {wine.vintage && (
          <span className="text-xs text-[var(--muted-foreground)]">
            {wine.vintage}
          </span>
        )}
        <span className="flex-1" />
        {wine.price != null && (
          <span className="text-sm font-semibold text-burgundy-700 dark:text-burgundy-400 shrink-0">
            {formatPrice(wine.price)}
          </span>
        )}
      </div>
      {wine.description && (
        <p className="mt-1 text-sm text-[var(--muted-foreground)] line-clamp-2 max-w-2xl">
          {wine.description}
        </p>
      )}
      <div className="mt-2 flex items-center gap-3">
        {wineryId && (
          <TriedItButton
            wineId={wine.id}
            wineName={wine.name}
            vintage={wine.vintage}
            wineryId={wineryId}
            wineryName={wineryName || ""}
          />
        )}
        {affiliateUrl && (
          <AffiliateWineLink
            url={affiliateUrl}
            wineryId={wineryId}
            winerySlug={winerySlug}
            size="sm"
          />
        )}
      </div>
    </div>
  );
}

export function WineTable({
  wines,
  curated = false,
  websiteUrl,
  phone,
  affiliateUrl,
  wineryId,
  wineryName,
  winerySlug,
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
  const [expanded, setExpanded] = useState(false);

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
                  className="text-burgundy-700 dark:text-burgundy-400 underline font-medium"
                >
                  visit their website
                </a>
              )}
              {websiteUrl && phone && " or "}
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="text-burgundy-700 dark:text-burgundy-400 underline font-medium"
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

  // Large lists: grouped by category
  if (wines.length >= GROUPING_THRESHOLD) {
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

  // Small lists: condensed with progressive disclosure
  const sortedWines = [...wines].sort((a, b) => {
    // Sort by price ascending (cheapest first)
    return (a.price || 999) - (b.price || 999);
  });

  const visibleWines = expanded
    ? sortedWines
    : sortedWines.slice(0, INITIAL_SHOW);
  const hasMore = sortedWines.length > INITIAL_SHOW;

  return (
    <div>
      <h2 className="font-heading text-2xl font-semibold mb-2">Wine List</h2>
      {!curated && (
        <p className="mb-4 text-xs text-[var(--muted-foreground)] italic">
          Prices are approximate and may not reflect current offerings.
        </p>
      )}

      <div className="divide-y divide-[var(--border)]">
        {visibleWines.map((wine) => (
          <WineListItem
            key={wine.id}
            wine={wine}
            wineryId={wineryId}
            wineryName={wineryName}
            winerySlug={winerySlug}
            affiliateUrl={affiliateUrl}
          />
        ))}
      </div>

      {hasMore && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-4 flex items-center gap-2 text-sm font-medium text-burgundy-700 dark:text-burgundy-400 hover:text-burgundy-800 dark:hover:text-burgundy-300 transition-colors"
        >
          <ChevronDown className="h-4 w-4" />
          View All {sortedWines.length} Wines
        </button>
      )}
    </div>
  );
}
