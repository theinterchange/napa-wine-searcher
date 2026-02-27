import { Wine as WineIcon } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Wine {
  id: number;
  name: string;
  wineType: string | null;
  category: string | null;
  vintage: number | null;
  price: number | null;
  description: string | null;
  rating: number | null;
  ratingSource: string | null;
  ratingCount: number | null;
}

const categoryColors: Record<string, string> = {
  red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  white: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  rosé: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  sparkling: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  dessert: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
};

const categoryIcons: Record<string, string> = {
  red: "🍷",
  white: "🥂",
  rosé: "🌸",
  sparkling: "✨",
  dessert: "🍯",
};

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
}: {
  wines: Wine[];
  curated?: boolean;
  websiteUrl?: string | null;
  phone?: string | null;
}) {
  if (wines.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="font-heading text-2xl font-semibold mb-4">Wines</h2>
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/30 px-6 py-12 text-center">
          <WineIcon className="mx-auto h-10 w-10 text-[var(--muted-foreground)]/50" />
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            Wine details aren&apos;t available online.
            {(websiteUrl || phone) && (
              <>
                {" "}
                {websiteUrl && (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-burgundy-700 dark:text-burgundy-400 underline"
                  >
                    Visit their website
                  </a>
                )}
                {websiteUrl && phone && " or "}
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="text-burgundy-700 dark:text-burgundy-400 underline"
                  >
                    call {phone}
                  </a>
                )}
                {" "}for current offerings.
              </>
            )}
          </p>
        </div>
      </div>
    );
  }

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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
