import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL || "file:./data/winery.db",
    authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
  });
  console.log("Target:", process.env.DATABASE_URL ?? "file:./data/winery.db");

  const total = await client.execute("SELECT COUNT(*) as n FROM accommodations");
  console.log("Total accommodations:", total.rows[0].n);

  const withCoords = await client.execute(
    "SELECT COUNT(*) as n FROM accommodations WHERE lat IS NOT NULL AND lng IS NOT NULL"
  );
  console.log("With coords:", withCoords.rows[0].n);

  const nearby = await client.execute(
    "SELECT COUNT(DISTINCT accommodation_id) as n FROM accommodation_nearby_wineries"
  );
  console.log("Indexed in accommodation_nearby_wineries:", nearby.rows[0].n);

  const pairCount = await client.execute(
    "SELECT COUNT(*) as n FROM accommodation_nearby_wineries"
  );
  console.log("Total (accom, winery) pairs:", pairCount.rows[0].n);

  const missing = await client.execute(`
    SELECT a.id, a.name, a.valley
    FROM accommodations a
    WHERE a.lat IS NOT NULL AND a.lng IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM accommodation_nearby_wineries anw
        WHERE anw.accommodation_id = a.id
      )
    LIMIT 20
  `);
  console.log("\nAccommodations with coords but no nearby-winery rows:",
    missing.rows.length);
  for (const r of missing.rows) {
    console.log(`  - [${r.id}] ${r.name} (${r.valley})`);
  }

  // Check distances in the junction — is maxMiles=20 cutting off many?
  const distBuckets = await client.execute(`
    SELECT
      SUM(CASE WHEN distance_miles <= 5 THEN 1 ELSE 0 END) as d5,
      SUM(CASE WHEN distance_miles <= 10 THEN 1 ELSE 0 END) as d10,
      SUM(CASE WHEN distance_miles <= 20 THEN 1 ELSE 0 END) as d20,
      SUM(CASE WHEN distance_miles <= 30 THEN 1 ELSE 0 END) as d30,
      MAX(distance_miles) as maxDist
    FROM accommodation_nearby_wineries
  `);
  console.log("\nDistance buckets in junction:", distBuckets.rows[0]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
