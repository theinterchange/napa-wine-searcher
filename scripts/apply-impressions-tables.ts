/**
 * Create page_impressions and gsc_daily_queries tables on Turso.
 * Idempotent — uses CREATE TABLE/INDEX IF NOT EXISTS.
 *
 * Run: tsx scripts/apply-impressions-tables.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
});

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS page_impressions (
    id integer PRIMARY KEY AUTOINCREMENT,
    path text NOT NULL,
    page_type text,
    entity_type text,
    entity_id integer,
    winery_id integer,
    accommodation_id integer,
    session_id text,
    referrer text,
    duration_ms integer,
    viewed_at text NOT NULL,
    created_at text NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_page_impressions_path ON page_impressions(path)`,
  `CREATE INDEX IF NOT EXISTS idx_page_impressions_winery_id ON page_impressions(winery_id)`,
  `CREATE INDEX IF NOT EXISTS idx_page_impressions_accommodation_id ON page_impressions(accommodation_id)`,
  `CREATE INDEX IF NOT EXISTS idx_page_impressions_viewed_at ON page_impressions(viewed_at)`,
  `CREATE TABLE IF NOT EXISTS gsc_daily_queries (
    id integer PRIMARY KEY AUTOINCREMENT,
    date text NOT NULL,
    page text NOT NULL,
    query text NOT NULL,
    impressions integer NOT NULL,
    clicks integer NOT NULL,
    ctr real NOT NULL,
    position real NOT NULL,
    fetched_at text NOT NULL,
    UNIQUE(date, page, query)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_gsc_daily_date ON gsc_daily_queries(date)`,
  `CREATE INDEX IF NOT EXISTS idx_gsc_daily_page ON gsc_daily_queries(page)`,
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
  console.log("\nDone. Impression tables ready.");
}

main();
