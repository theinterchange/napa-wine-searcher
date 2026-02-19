import { Star } from "lucide-react";
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

export function WineTable({ wines, curated = false }: { wines: Wine[]; curated?: boolean }) {
  if (wines.length === 0) return null;

  const categoryColors: Record<string, string> = {
    red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    white: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    rosé: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    sparkling: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    dessert: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  };

  return (
    <div className="mb-8">
      <h2 className="font-heading text-2xl font-semibold mb-4">Wines</h2>
      {!curated && (
        <p className="mb-3 text-xs text-[var(--muted-foreground)] italic">
          Prices and ratings are approximate and may not reflect current offerings.
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--muted)]">
            <tr>
              <th className="text-left p-4 font-medium">Wine</th>
              <th className="text-left p-4 font-medium">Type</th>
              <th className="text-left p-4 font-medium">Vintage</th>
              <th className="text-left p-4 font-medium">Price</th>
              <th className="text-left p-4 font-medium">Rating</th>
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
                  {wine.wineType && (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        categoryColors[wine.category || ""] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {wine.wineType}
                    </span>
                  )}
                </td>
                <td className="p-4 text-[var(--muted-foreground)]">
                  {wine.vintage || "NV"}
                </td>
                <td className="p-4">
                  {wine.price ? formatPrice(wine.price) : "—"}
                </td>
                <td className="p-4">
                  {wine.rating ? (
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
                      <span className="font-medium">{wine.rating.toFixed(1)}</span>
                      {wine.ratingCount != null && (
                        <span className="text-xs text-[var(--muted-foreground)]">
                          ({wine.ratingCount})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[var(--muted-foreground)]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
