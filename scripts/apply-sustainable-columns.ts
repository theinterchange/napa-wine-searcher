/**
 * Adds sustainable / sustainable_note / sustainable_source columns to
 * the accommodations table. Generated in the cryptic-riding-fern plan
 * but never pushed, so Turso was missing them and trip-page queries
 * selecting `sustainable` fail.
 *
 * Idempotent — re-runs no-op.
 *
 * Run: npx tsx scripts/apply-sustainable-columns.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";

const STATEMENTS: Array<{ label: string; sql: string }> = [
  {
    label: "accommodations.sustainable",
    sql: "ALTER TABLE accommodations ADD COLUMN sustainable integer",
  },
  {
    label: "accommodations.sustainable_note",
    sql: "ALTER TABLE accommodations ADD COLUMN sustainable_note text",
  },
  {
    label: "accommodations.sustainable_source",
    sql: "ALTER TABLE accommodations ADD COLUMN sustainable_source text",
  },
];

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL || "file:./data/winery.db",
    authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
  });
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
        console.error("  ✗", label, "—", msg);
        throw err;
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
