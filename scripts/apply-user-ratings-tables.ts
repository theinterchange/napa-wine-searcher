/**
 * Create user_winery_ratings and user_accommodation_ratings tables on Turso.
 * Idempotent — uses CREATE TABLE/INDEX IF NOT EXISTS.
 *
 * Run: tsx scripts/apply-user-ratings-tables.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
});

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS user_winery_ratings (
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    winery_id integer NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
    rating integer NOT NULL,
    created_at text NOT NULL,
    updated_at text NOT NULL,
    PRIMARY KEY (user_id, winery_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_user_winery_ratings_winery_id
    ON user_winery_ratings(winery_id)`,
  `CREATE TABLE IF NOT EXISTS user_accommodation_ratings (
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    accommodation_id integer NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
    rating integer NOT NULL,
    created_at text NOT NULL,
    updated_at text NOT NULL,
    PRIMARY KEY (user_id, accommodation_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_user_accom_ratings_accom_id
    ON user_accommodation_ratings(accommodation_id)`,
];

async function main() {
  for (const sql of STATEMENTS) {
    try {
      await client.execute(sql);
      const preview = sql.replace(/\s+/g, " ").slice(0, 80);
      console.log(`✓ ${preview}${preview.length >= 80 ? "…" : ""}`);
    } catch (err) {
      console.error(`✗ Failed:`, sql.replace(/\s+/g, " ").slice(0, 100));
      console.error(err);
      process.exit(1);
    }
  }
  console.log("\nDone. Rating tables ready.");
}

main();
