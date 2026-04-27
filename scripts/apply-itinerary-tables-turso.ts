/**
 * Create the itinerary foundation tables (anonymous_trips, route_cache,
 * itinerary_analytics_events) on whichever DB DATABASE_URL points at.
 *
 * These were part of drizzle/0013_itinerary_foundations.sql but the
 * existing apply-migration-0013-turso.ts only ran the ALTERs — the
 * CREATE TABLE statements never made it to Turso, so anonymous trip
 * forks 500'd on insert.
 *
 * Safe: CREATE TABLE IF NOT EXISTS + idempotent index creation.
 *
 * Run: npx tsx scripts/apply-itinerary-tables-turso.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
});

const STATEMENTS: Array<{ sql: string; label: string }> = [
  {
    label: "CREATE anonymous_trips",
    sql: `CREATE TABLE IF NOT EXISTS anonymous_trips (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      share_code text NOT NULL,
      name text,
      theme text,
      valley text,
      forked_from_route_id integer,
      origin_lat real,
      origin_lng real,
      origin_label text,
      created_at text NOT NULL,
      updated_at text NOT NULL,
      last_viewed_at text,
      FOREIGN KEY (forked_from_route_id) REFERENCES day_trip_routes(id) ON UPDATE no action ON DELETE set null
    )`,
  },
  {
    label: "INDEX anonymous_trips_share_code_unique",
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS anonymous_trips_share_code_unique ON anonymous_trips (share_code)`,
  },
  {
    label: "INDEX idx_anon_trips_share_code",
    sql: `CREATE INDEX IF NOT EXISTS idx_anon_trips_share_code ON anonymous_trips (share_code)`,
  },
  {
    label: "CREATE anonymous_trip_stops",
    sql: `CREATE TABLE IF NOT EXISTS anonymous_trip_stops (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      trip_id integer NOT NULL,
      winery_id integer NOT NULL,
      stop_order integer NOT NULL,
      notes text,
      FOREIGN KEY (trip_id) REFERENCES anonymous_trips(id) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (winery_id) REFERENCES wineries(id) ON UPDATE no action ON DELETE cascade
    )`,
  },
  {
    label: "INDEX idx_anon_trip_stops_trip_id",
    sql: `CREATE INDEX IF NOT EXISTS idx_anon_trip_stops_trip_id ON anonymous_trip_stops (trip_id)`,
  },
  {
    label: "CREATE route_cache",
    sql: `CREATE TABLE IF NOT EXISTS route_cache (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      cache_key text NOT NULL,
      from_lat real NOT NULL,
      from_lng real NOT NULL,
      to_lat real NOT NULL,
      to_lng real NOT NULL,
      miles real NOT NULL,
      minutes real NOT NULL,
      min_range_minutes real NOT NULL,
      max_range_minutes real NOT NULL,
      source text NOT NULL,
      polyline_encoded text,
      computed_at text NOT NULL,
      expires_at text
    )`,
  },
  {
    label: "INDEX route_cache_cache_key_unique",
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS route_cache_cache_key_unique ON route_cache (cache_key)`,
  },
  {
    label: "INDEX idx_route_cache_key",
    sql: `CREATE INDEX IF NOT EXISTS idx_route_cache_key ON route_cache (cache_key)`,
  },
  {
    label: "CREATE itinerary_analytics_events",
    sql: `CREATE TABLE IF NOT EXISTS itinerary_analytics_events (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      event_name text NOT NULL,
      trip_id integer,
      share_code text,
      mode text,
      payload_json text,
      session_id text,
      user_id text,
      created_at text NOT NULL
    )`,
  },
  {
    label: "INDEX idx_itin_events_event_name",
    sql: `CREATE INDEX IF NOT EXISTS idx_itin_events_event_name ON itinerary_analytics_events (event_name)`,
  },
  {
    label: "INDEX idx_itin_events_created_at",
    sql: `CREATE INDEX IF NOT EXISTS idx_itin_events_created_at ON itinerary_analytics_events (created_at)`,
  },
];

async function main() {
  console.log("Target:", process.env.DATABASE_URL);
  for (const { label, sql } of STATEMENTS) {
    try {
      await client.execute(sql);
      console.log("  ✓", label);
    } catch (err) {
      console.log("  ✗", label, "=>", (err as Error).message);
    }
  }
  console.log("\nVerifying anonymous_trips schema:");
  const rs = await client.execute("PRAGMA table_info(anonymous_trips)");
  for (const row of rs.rows) {
    console.log(
      `  ${String(row.cid).padStart(2)} ${String(row.name).padEnd(25)} ${row.type}`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
