// Adds the reverse-lookup index on accommodation_nearby_wineries(winery_id) to
// production Turso. The composite PK (accommodation_id, winery_id) only serves
// accommodation_id-first lookups; "hotels near this winery" filters on
// winery_id alone and was full-scanning all ~10K rows on every call.
//
// Idempotent (CREATE INDEX IF NOT EXISTS). Verifies with EXPLAIN QUERY PLAN.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
});

async function main() {
  console.log("Creating index idx_anw_winery_id ...");
  await client.execute(
    "CREATE INDEX IF NOT EXISTS idx_anw_winery_id ON accommodation_nearby_wineries(winery_id)"
  );
  console.log("Done.");

  // Confirm the planner now uses the index for a winery_id filter.
  const plan = await client.execute(
    "EXPLAIN QUERY PLAN SELECT * FROM accommodation_nearby_wineries WHERE winery_id = 1"
  );
  console.log("\nEXPLAIN QUERY PLAN (winery_id = 1):");
  for (const row of plan.rows) {
    console.log("  " + String(row.detail));
  }

  // List indexes on the table for a final sanity check.
  const idx = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='accommodation_nearby_wineries'"
  );
  console.log("\nIndexes on accommodation_nearby_wineries:");
  for (const row of idx.rows) console.log("  " + String(row.name));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
