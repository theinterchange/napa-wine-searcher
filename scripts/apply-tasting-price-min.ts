/**
 * Adds a denormalized `tasting_price_min` column on `wineries` and backfills
 * it from `tasting_experiences`. Lets every WineryCard surface select the
 * field directly without a subquery per page.
 *
 * Idempotent: ALTER TABLE skipped if column exists; backfill UPDATE runs
 * each time and overwrites with the current MIN. Re-run after seeding new
 * tasting experiences.
 *
 * Run: npx tsx scripts/apply-tasting-price-min.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
});

async function main() {
  console.log("Target:", process.env.DATABASE_URL ?? "file:./data/winery.db");

  try {
    await client.execute("ALTER TABLE wineries ADD COLUMN tasting_price_min real");
    console.log("  ✓ added wineries.tasting_price_min");
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes("duplicate column name")) {
      console.log("  − already applied: wineries.tasting_price_min");
    } else {
      throw err;
    }
  }

  console.log("Backfilling from tasting_experiences...");
  const result = await client.execute(`
    UPDATE wineries
    SET tasting_price_min = (
      SELECT MIN(price)
      FROM tasting_experiences
      WHERE tasting_experiences.winery_id = wineries.id
        AND price IS NOT NULL
    )
  `);
  console.log(`  ✓ updated ${result.rowsAffected} rows`);

  const { rows } = await client.execute(
    "SELECT COUNT(*) as total, COUNT(tasting_price_min) as with_price FROM wineries"
  );
  const total = Number(rows[0].total);
  const withPrice = Number(rows[0].with_price);
  console.log(`Coverage: ${withPrice}/${total} (${((withPrice / total) * 100).toFixed(1)}%)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
