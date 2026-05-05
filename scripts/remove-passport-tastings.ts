import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@libsql/client";

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
  });

  console.log("Target:", process.env.DATABASE_URL);

  const del = await client.execute(
    `DELETE FROM tasting_experiences
     WHERE LOWER(name) LIKE '%passport%' OR LOWER(description) LIKE '%passport%'`
  );
  console.log(`Deleted ${del.rowsAffected} passport tasting experience(s)`);

  console.log("\nRecomputing wineries.tasting_price_min...");
  const update = await client.execute(`
    UPDATE wineries
    SET tasting_price_min = (
      SELECT MIN(price) FROM tasting_experiences
      WHERE tasting_experiences.winery_id = wineries.id
        AND price IS NOT NULL
    )
  `);
  console.log(`  ✓ updated ${update.rowsAffected} winery rows`);

  const { rows } = await client.execute(
    "SELECT name, tasting_price_min FROM wineries WHERE name LIKE '%Tank Garage%'"
  );
  rows.forEach((r: any) =>
    console.log(`Verify: ${r.name} → $${r.tasting_price_min}`)
  );
}

main().catch((e) => { console.error(e); process.exit(1); });
