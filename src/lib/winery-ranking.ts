import { sql } from "drizzle-orm";
import { wineries } from "@/db/schema";

/**
 * Standard winery ranking score used across all listing pages.
 * Score = log10(reviews) × 25 + rating × 40 + curated × 30 + price × 5
 *
 * This balances popularity (review count), quality (rating), editorial
 * curation, and price tier to surface the best wineries first.
 */
export const wineryRankingScore = sql`(
  (CASE WHEN ${wineries.totalRatings} > 0
    THEN log(${wineries.totalRatings} + 1) / log(10) * 25
    ELSE 0 END)
  + COALESCE(${wineries.googleRating}, COALESCE(${wineries.aggregateRating}, 0)) * 40
  + (CASE WHEN ${wineries.curated} = 1 THEN 30 ELSE 0 END)
  + COALESCE(${wineries.priceLevel}, 2) * 5
)`;

/** ORDER BY clause: ranking score descending */
export const wineryRankingDesc = sql`${wineryRankingScore} DESC`;
