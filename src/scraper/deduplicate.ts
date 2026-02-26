/**
 * One-time migration: merge 17 duplicate winery rows.
 *
 * Curated entries use short slugs (e.g. "baldacci-family") while the scraper
 * created new rows with longer slugs (e.g. "baldacci-family-vineyards").
 *
 * For each pair this script:
 *   1. Deletes stale curated wines/tastings
 *   2. Moves scraped wines/tastings to the curated row
 *   3. Moves user data (favorites, visited, notes) with conflict handling
 *   4. Copies non-null scraped metadata into the curated row
 *   5. Moves scrape_log and winery_photos
 *   6. Moves winery_ratings
 *   7. Deletes the scraped winery row
 */

import "dotenv/config";
import { createClient } from "@libsql/client";

const DUPLICATE_PAIRS: [curatedSlug: string, scrapedSlug: string][] = [
  ["baldacci-family", "baldacci-family-vineyards"],
  ["benziger-family", "benziger-family-winery"],
  ["charles-krug", "charles-krug-winery"],
  ["chimney-rock", "chimney-rock-winery"],
  ["cliff-lede", "cliff-lede-vineyards"],
  ["cline-cellars", "cline-family-cellars"],
  ["francis-ford-coppola", "francis-ford-coppola-winery"],
  ["frogs-leap", "frogs-leap-winery"],
  ["imagery-estate", "imagery-estate-winery"],
  ["iron-horse", "iron-horse-vineyards"],
  ["jordan-winery", "jordan-vineyard-winery"],
  ["matanzas-creek", "matanzas-creek-winery"],
  ["rams-gate", "rams-gate-winery"],
  ["rutherford-hill", "rutherford-hill-winery"],
  ["seghesio-family", "seghesio-family-vineyards"],
  ["silver-oak-alexander", "silver-oak-alexander-valley"],
  ["v-sattui", "v-sattui-winery"],
  // Round 2
  ["opus-one", "opus-one-winery"],
  ["gloria-ferrer", "gloria-ferrer-wines"],
  ["ridge-lytton-springs", "ridge-vineyards-lytton-springs"],
  ["artesa-vineyards", "artesa-vineyards-winery"],
  ["far-niente", "far-niente-winery"],
  ["ferrari-carano", "ferrari-carano-vineyards-and-winery"],
  ["gary-farrell", "gary-farrell-vineyards-winery"],
  ["gundlach-bundschu", "gundlach-bundschu-winery"],
  ["lynmar-estate", "lynmar-estate-winery"],
  ["plumpjack", "plumpjack-estate-winery"],
];

// Fields to copy from scraped row when the curated row has NULL
const METADATA_FIELDS = [
  "description",
  "short_description",
  "hero_image_url",
  "thumbnail_url",
  "address",
  "city",
  "state",
  "zip",
  "lat",
  "lng",
  "phone",
  "email",
  "website_url",
  "hours_json",
  "reservation_required",
  "dog_friendly",
  "picnic_friendly",
  "price_level",
  "aggregate_rating",
  "total_ratings",
  "data_source",
  "last_scraped_at",
  "google_place_id",
  "google_review_count",
  "google_rating",
];

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL || "file:./data/winery.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  // Get initial count
  const before = await client.execute("SELECT COUNT(*) as cnt FROM wineries");
  const countBefore = before.rows[0].cnt as number;
  console.log(`Wineries before: ${countBefore}`);

  let merged = 0;
  let skipped = 0;

  for (const [curatedSlug, scrapedSlug] of DUPLICATE_PAIRS) {
    const curatedRow = await client.execute({
      sql: "SELECT id FROM wineries WHERE slug = ?",
      args: [curatedSlug],
    });
    const scrapedRow = await client.execute({
      sql: "SELECT id FROM wineries WHERE slug = ?",
      args: [scrapedSlug],
    });

    if (curatedRow.rows.length === 0 || scrapedRow.rows.length === 0) {
      const missing = curatedRow.rows.length === 0 ? curatedSlug : scrapedSlug;
      console.log(`  SKIP ${curatedSlug}: "${missing}" not found`);
      skipped++;
      continue;
    }

    const keepId = curatedRow.rows[0].id as number;
    const dropId = scrapedRow.rows[0].id as number;

    console.log(
      `  Merging "${scrapedSlug}" (id=${dropId}) → "${curatedSlug}" (id=${keepId})`
    );

    // Run all steps in a transaction
    const tx = await client.transaction("write");

    try {
      // 1-2. Replace curated wines/tastings with scraped ones — but only
      //       when the scraped row actually has data to replace with.
      const scrapedWineCount = await tx.execute({
        sql: "SELECT COUNT(*) as cnt FROM wines WHERE winery_id = ?",
        args: [dropId],
      });
      if ((scrapedWineCount.rows[0].cnt as number) > 0) {
        await tx.execute({
          sql: "DELETE FROM wine_ratings WHERE wine_id IN (SELECT id FROM wines WHERE winery_id = ?)",
          args: [keepId],
        });
        await tx.execute({
          sql: "DELETE FROM wines WHERE winery_id = ?",
          args: [keepId],
        });
        await tx.execute({
          sql: "UPDATE wines SET winery_id = ? WHERE winery_id = ?",
          args: [keepId, dropId],
        });
      }

      const scrapedTastingCount = await tx.execute({
        sql: "SELECT COUNT(*) as cnt FROM tasting_experiences WHERE winery_id = ?",
        args: [dropId],
      });
      if ((scrapedTastingCount.rows[0].cnt as number) > 0) {
        await tx.execute({
          sql: "DELETE FROM tasting_experiences WHERE winery_id = ?",
          args: [keepId],
        });
        await tx.execute({
          sql: "UPDATE tasting_experiences SET winery_id = ? WHERE winery_id = ?",
          args: [keepId, dropId],
        });
      }

      // 3. Move user data with conflict handling
      //    (user_id, winery_id) is the PK — if user has data for both, keep curated
      for (const table of ["favorites", "visited", "winery_notes"]) {
        // Delete scraped rows that would conflict with existing curated rows
        await tx.execute({
          sql: `DELETE FROM ${table} WHERE winery_id = ? AND user_id IN (SELECT user_id FROM ${table} WHERE winery_id = ?)`,
          args: [dropId, keepId],
        });
        // Move remaining scraped rows to curated
        await tx.execute({
          sql: `UPDATE ${table} SET winery_id = ? WHERE winery_id = ?`,
          args: [keepId, dropId],
        });
      }

      // 4. Copy non-null scraped metadata into curated row
      //    - "overwrite" fields: always take scraped value (fresher)
      //    - "fill" fields: only set if curated value is NULL
      const OVERWRITE_FIELDS = new Set([
        "description",
        "hours_json",
        "data_source",
        "last_scraped_at",
        "google_place_id",
        "google_review_count",
        "google_rating",
      ]);

      const scraped = await tx.execute({
        sql: `SELECT ${METADATA_FIELDS.join(", ")} FROM wineries WHERE id = ?`,
        args: [dropId],
      });
      const scrapedData = scraped.rows[0];

      const setClauses: string[] = [];
      const setArgs: (string | number | null)[] = [];

      for (const field of METADATA_FIELDS) {
        const val = scrapedData[field];
        if (val === null || val === undefined) continue;

        if (OVERWRITE_FIELDS.has(field)) {
          setClauses.push(`${field} = ?`);
        } else {
          setClauses.push(`${field} = COALESCE(${field}, ?)`);
        }
        setArgs.push(val as string | number);
      }

      if (setClauses.length > 0) {
        setArgs.push(keepId);
        await tx.execute({
          sql: `UPDATE wineries SET ${setClauses.join(", ")} WHERE id = ?`,
          args: setArgs,
        });
      }

      // 5. Move scrape_log and winery_photos
      await tx.execute({
        sql: "UPDATE scrape_log SET winery_id = ? WHERE winery_id = ?",
        args: [keepId, dropId],
      });
      await tx.execute({
        sql: "UPDATE winery_photos SET winery_id = ? WHERE winery_id = ?",
        args: [keepId, dropId],
      });

      // 6. Move winery_ratings
      await tx.execute({
        sql: "DELETE FROM winery_ratings WHERE winery_id = ? AND provider IN (SELECT provider FROM winery_ratings WHERE winery_id = ?)",
        args: [dropId, keepId],
      });
      await tx.execute({
        sql: "UPDATE winery_ratings SET winery_id = ? WHERE winery_id = ?",
        args: [keepId, dropId],
      });

      // 7. Delete the scraped winery row
      await tx.execute({
        sql: "DELETE FROM wineries WHERE id = ?",
        args: [dropId],
      });

      await tx.commit();
      merged++;
    } catch (err) {
      await tx.rollback();
      console.error(`  FAILED for ${curatedSlug}:`, err);
    }
  }

  // Final count
  const after = await client.execute("SELECT COUNT(*) as cnt FROM wineries");
  const countAfter = after.rows[0].cnt as number;

  console.log(`\nDone. Merged: ${merged}, Skipped: ${skipped}`);
  console.log(`Wineries: ${countBefore} → ${countAfter}`);

  // Verify no orphaned wines/tastings
  const orphanedWines = await client.execute(
    "SELECT COUNT(*) as cnt FROM wines WHERE winery_id NOT IN (SELECT id FROM wineries)"
  );
  const orphanedTastings = await client.execute(
    "SELECT COUNT(*) as cnt FROM tasting_experiences WHERE winery_id NOT IN (SELECT id FROM wineries)"
  );
  console.log(`Orphaned wines: ${orphanedWines.rows[0].cnt}`);
  console.log(`Orphaned tastings: ${orphanedTastings.rows[0].cnt}`);

  client.close();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
