/**
 * Phase 5.5 — Home Base as Stop Zero.
 *
 * Adds `home_base_accommodation_id` and `nights` columns to both trip
 * tables so a chosen hotel can persist as Stop 0 with nights metadata.
 *
 * Idempotent: each ALTER is wrapped so re-runs no-op. Runs against
 * whichever DB `DATABASE_URL` points at — so you can run it twice
 * (once pointing at local, once at Turso).
 *
 * Run: npx tsx scripts/apply-home-base-columns.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
});

const STATEMENTS: Array<{ label: string; sql: string }> = [
  {
    label: "anonymous_trips.home_base_accommodation_id",
    sql: "ALTER TABLE anonymous_trips ADD COLUMN home_base_accommodation_id integer",
  },
  {
    label: "anonymous_trips.nights",
    sql: "ALTER TABLE anonymous_trips ADD COLUMN nights integer",
  },
  {
    label: "saved_trips.home_base_accommodation_id",
    sql: "ALTER TABLE saved_trips ADD COLUMN home_base_accommodation_id integer",
  },
  {
    label: "saved_trips.nights",
    sql: "ALTER TABLE saved_trips ADD COLUMN nights integer",
  },
  {
    label: "index on anonymous_trips.home_base_accommodation_id",
    sql: "CREATE INDEX IF NOT EXISTS idx_anon_trips_home_base ON anonymous_trips (home_base_accommodation_id)",
  },
  {
    label: "index on saved_trips.home_base_accommodation_id",
    sql: "CREATE INDEX IF NOT EXISTS idx_saved_trips_home_base ON saved_trips (home_base_accommodation_id)",
  },
];

async function main() {
  console.log("Target:", process.env.DATABASE_URL ?? "file:./data/winery.db");
  for (const { label, sql } of STATEMENTS) {
    try {
      await client.execute(sql);
      console.log("  ✓", label);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("duplicate column name") || msg.includes("already exists")) {
        console.log("  − already applied:", label);
      } else {
        console.log("  ✗", label, "=>", msg);
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
