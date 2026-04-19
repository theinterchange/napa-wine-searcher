/**
 * Manual, idempotent migration for Phase C social slides.
 *
 * Adds three nullable columns to `social_posts`:
 *   - slides (text, JSON)
 *   - reel_mp4_url (text)
 *   - carousel_zip_url (text)
 *
 * Why manual (not drizzle-kit generate): the local Drizzle schema has drifted
 * from production Turso (accommodations.sustainable, etc.), so running
 * `drizzle-kit generate` produces a DROP+RECREATE migration that would wipe
 * production data. This script only performs safe additive ALTER TABLE ADD
 * COLUMN statements and checks existence first.
 *
 * Usage:
 *   npx tsx scripts/migrate-add-slide-columns.ts
 *
 * Safe to run multiple times — all statements are idempotent.
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";

const dbUrl = process.env.DATABASE_URL;
const dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");

if (!dbUrl) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const client = createClient({ url: dbUrl, authToken: dbAuthToken });

async function columnExists(table: string, column: string): Promise<boolean> {
  const res = await client.execute(`PRAGMA table_info(${table})`);
  return res.rows.some((r) => (r.name as string) === column);
}

async function addColumn(table: string, column: string, type: string) {
  if (await columnExists(table, column)) {
    console.log(`✓ ${table}.${column} already exists`);
    return;
  }
  await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  console.log(`+ ${table}.${column} added`);
}

async function main() {
  console.log(`DB: ${dbUrl}\n`);
  await addColumn("social_posts", "slides", "text");
  await addColumn("social_posts", "reel_mp4_url", "text");
  await addColumn("social_posts", "carousel_zip_url", "text");
  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => client.close());
