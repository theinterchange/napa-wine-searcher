/**
 * Apply migration 0013 column additions to whichever DB DATABASE_URL points at
 * (Turso in dev/prod). Idempotent — each ALTER is wrapped in a try/catch and
 * ignored if the column already exists.
 *
 * Run: npx dotenv -e .env.local -- tsx scripts/apply-migration-0013-turso.ts
 */
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
});

const STATEMENTS = [
  "ALTER TABLE day_trip_routes ADD hero_image_url text",
  "ALTER TABLE day_trip_routes ADD group_vibe text",
  "ALTER TABLE day_trip_routes ADD duration text",
  "ALTER TABLE day_trip_routes ADD seo_keywords text",
  "ALTER TABLE day_trip_routes ADD faq_json text",
  "ALTER TABLE day_trip_routes ADD editorial_pull text",
  "ALTER TABLE day_trip_routes ADD curated_at text",
  "ALTER TABLE day_trip_stops ADD pre_computed_drive_minutes_to_next real",
  "ALTER TABLE day_trip_stops ADD pre_computed_miles_to_next real",
  "ALTER TABLE saved_trips ADD forked_from_route_id integer",
  "ALTER TABLE saved_trips ADD origin_lat real",
  "ALTER TABLE saved_trips ADD origin_lng real",
  "ALTER TABLE saved_trips ADD origin_label text",
];

async function main() {
  console.log("Target:", process.env.DATABASE_URL);
  for (const sql of STATEMENTS) {
    try {
      await client.execute(sql);
      console.log("  ✓", sql);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("duplicate column name")) {
        console.log("  − already applied:", sql);
      } else {
        console.log("  ✗", sql, "=>", msg);
      }
    }
  }

  const rs = await client.execute("PRAGMA table_info(day_trip_routes)");
  console.log("\nday_trip_routes columns:", rs.rows.map((r: any) => r.name).join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
