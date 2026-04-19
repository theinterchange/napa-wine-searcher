import "server-only";
import { db } from "@/db";
import { wineries, subRegions } from "@/db/schema";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { loadStopsByWineryIds } from "./load-trip";
import type { TripStop } from "@/lib/trip-state/types";

export interface PoolParams {
  theme: string | null;
  valley: string | null;
  excludeIds?: number[];
  limit?: number;
}

/**
 * Wine-type keywords that expand a theme into a list of wine_type names.
 * Matched against `wine_types.name` via a correlated subquery so wineries that
 * don't make the relevant wine category are excluded. Without this the pool
 * falls back to the generic quality gate and e.g. Carneros Pinot/Chardonnay
 * shows Calistoga Cabernet producers.
 */
const THEME_WINE_TYPES: Record<string, string[]> = {
  cabernet: ["Cabernet Sauvignon", "Cabernet Franc"],
  "pinot-chardonnay": [
    "Pinot Noir",
    "Pinot Noir Blanc",
    "Chardonnay",
    "Sparkling Wine",
    "Sparkling Rosé",
    "Blanc de Blancs",
    "Brut",
  ],
};

/**
 * Returns wineries that match a curated route's theme + valley, filtered to
 * strict-source quality (curated=true OR (reviewCount≥50 AND rating≥4.0)).
 * Used by the "More wineries that fit this theme" section on curated trip
 * pages — surfaces the ~50+ candidates the hand-picked 4 were chosen from.
 */
export async function getPoolForTheme({
  theme,
  valley,
  excludeIds = [],
  limit = 12,
}: PoolParams): Promise<TripStop[]> {
  const conds = [
    sql`${wineries.lat} IS NOT NULL AND ${wineries.lng} IS NOT NULL`,
    sql`(${wineries.curated} = 1 OR (COALESCE(${wineries.googleReviewCount}, 0) >= 50 AND COALESCE(${wineries.googleRating}, ${wineries.aggregateRating}, 0) >= 4.0))`,
  ];

  const mappedValley = mapValley(valley);
  if (mappedValley) {
    conds.push(eq(subRegions.valley, mappedValley));
  }

  // Hard column filters for amenity / price-based themes.
  switch (theme) {
    case "luxury":
      conds.push(sql`${wineries.priceLevel} >= 3`);
      conds.push(
        sql`COALESCE(${wineries.googleRating}, ${wineries.aggregateRating}, 0) >= 4.5`
      );
      break;
    case "budget":
      conds.push(
        sql`(${wineries.priceLevel} <= 2 OR ${wineries.priceLevel} IS NULL)`
      );
      break;
    case "dog-friendly":
      conds.push(eq(wineries.dogFriendly, true));
      break;
    case "kid-friendly":
      conds.push(eq(wineries.kidFriendly, true));
      break;
  }

  // Wine-type filter via subquery — require the winery to produce at least one
  // of the theme's wine types. Carried out as EXISTS so wineries with no wines
  // catalogued are excluded (rather than false-positive).
  const wineTypes = theme ? THEME_WINE_TYPES[theme] : undefined;
  if (wineTypes && wineTypes.length > 0) {
    const literals = sql.join(
      wineTypes.map((t) => sql`${t}`),
      sql`, `
    );
    conds.push(
      sql`EXISTS (
        SELECT 1 FROM wines w
        JOIN wine_types wt ON wt.id = w.wine_type_id
        WHERE w.winery_id = ${wineries.id}
          AND wt.name IN (${literals})
      )`
    );
  }

  if (excludeIds.length > 0) {
    conds.push(notInArray(wineries.id, excludeIds));
  }

  // For wine-type themes, rank by the share of the winery's portfolio that
  // matches — a Pinot specialist (80%+) outranks a generalist who happens to
  // also make Pinot. Blends with popularity via rating × ln(1+reviews).
  const matchRatioExpr = wineTypes
    ? sql`(
        SELECT CAST(SUM(CASE WHEN wt.name IN (${sql.join(
          wineTypes.map((t) => sql`${t}`),
          sql`, `
        )}) THEN 1 ELSE 0 END) AS REAL) / NULLIF(COUNT(*), 0)
        FROM wines w
        JOIN wine_types wt ON wt.id = w.wine_type_id
        WHERE w.winery_id = ${wineries.id}
      )`
    : null;

  const orderClauses = [
    sql`COALESCE(${wineries.curated}, 0) DESC`,
    ...(matchRatioExpr ? [sql`COALESCE((${matchRatioExpr}), 0) DESC`] : []),
    // Rating × ln(1 + reviews) — popularity-weighted quality.
    sql`(COALESCE(${wineries.googleRating}, ${wineries.aggregateRating}, 0) * LN(1 + COALESCE(${wineries.googleReviewCount}, 0))) DESC`,
    sql`COALESCE(${wineries.googleRating}, ${wineries.aggregateRating}, 0) DESC`,
  ];

  const rows = await db
    .select({ id: wineries.id })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(and(...conds))
    .orderBy(...orderClauses)
    .limit(limit);

  return loadStopsByWineryIds(rows.map((r) => r.id));
}

/**
 * Map a free-text region/valley label into the valleys table enum.
 * Cross-valley ("Napa & Sonoma") and Carneros regions return null so no
 * valley filter is applied — otherwise a substring match on "sonoma" would
 * silently exclude every Napa winery from a cross-valley pool.
 */
function mapValley(valley: string | null): "napa" | "sonoma" | null {
  if (!valley) return null;
  const v = valley.toLowerCase();
  const hasNapa = v.includes("napa");
  const hasSonoma = v.includes("sonoma");
  if (hasNapa && hasSonoma) return null;
  if (v.includes("carneros")) return null;
  if (hasNapa) return "napa";
  if (hasSonoma) return "sonoma";
  return null;
}
