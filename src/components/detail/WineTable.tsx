import { Wine as WineIcon } from "lucide-react";
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

const GROUPING_THRESHOLD = 8;

function WineTypeBadge({ wineType, category }: { wineType: string | null; category: string | null }) {
  if (!wineType) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
        categoryColors[category || ""] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      }`}
    >
      <span className="text-[10px]">{categoryIcons[category || ""] || "🍇"}</span>
      {wineType}
    </span>
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
  if (wines.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="font-heading text-2xl font-semibold mb-4">Wines</h2>
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/30 px-6 py-12 text-center">
          <WineIcon className="mx-auto h-10 w-10 text-[var(--muted-foreground)]/50" />
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            Wine details aren&apos;t available online.
          </p>
          {(websiteUrl || phone) && (
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Contact {wineryName || "the winery"} directly for current offerings
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

  // Grouped layout for large wine lists
  if (wines.length >= GROUPING_THRESHOLD) {
    // Group wines by category
    const groups = new Map<string, Wine[]>();
    for (const wine of wines) {
      const cat = wine.category || "other";
      const list = groups.get(cat);
      if (list) {
        list.push(wine);
      } else {
        groups.set(cat, [wine]);
      }
    }

    // Order groups by CATEGORY_ORDER
    const orderedGroups = CATEGORY_ORDER
      .filter((cat) => groups.has(cat))
      .map((cat) => ({ category: cat, wines: groups.get(cat)! }));

    // Find the largest category to default-open
    let largestCat = orderedGroups[0]?.category;
    let largestCount = 0;
    for (const g of orderedGroups) {
      if (g.wines.length > largestCount) {
        largestCount = g.wines.length;
        largestCat = g.category;
      }
    }

    return (
      <div className="mb-8">
        <h2 className="font-heading text-2xl font-semibold mb-4">
          Wines{" "}
          <span className="text-base font-normal text-[var(--muted-foreground)]">
            ({wines.length})
          </span>
        </h2>
        {!curated && (
          <p className="mb-3 text-xs text-[var(--muted-foreground)] italic">
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

  // Flat layout for small wine lists
  return (
    <div className="mb-8">
      <h2 className="font-heading text-2xl font-semibold mb-4">Wines</h2>
      {!curated && (
        <p className="mb-3 text-xs text-[var(--muted-foreground)] italic">
          Prices are approximate and may not reflect current offerings.
        </p>
      )}

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--muted)]">
            <tr>
              <th className="text-left p-4 font-medium">Wine</th>
              <th className="text-left p-4 font-medium min-w-[160px]">Type</th>
              <th className="text-left p-4 font-medium">Vintage</th>
              <th className="text-left p-4 font-medium">Price</th>
              {wineryId && <th className="p-4 font-medium" />}
              {affiliateUrl && <th className="text-left p-4 font-medium" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {wines.map((wine) => (
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
                {wineryId && (
                  <td className="p-4">
                    <TriedItButton
                      wineId={wine.id}
                      wineName={wine.name}
                      vintage={wine.vintage}
                      wineryId={wineryId}
                      wineryName={wineryName || ""}
                    />
                  </td>
                )}
                {affiliateUrl && (
                  <td className="p-4">
                    <AffiliateWineLink
                      url={affiliateUrl}
                      wineryId={wineryId}
                      winerySlug={winerySlug}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {wines.map((wine) => (
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
    </div>
  );
}
