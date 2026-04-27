/**
 * Read the Turso table_info for a named table so we can see exactly which
 * columns exist (the dev server points at Turso, not local SQLite, so
 * schema drift between local and prod manifests as 500 errors on insert).
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@libsql/client";

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
  });

  for (const table of ["saved_trips", "saved_trip_stops", "anonymous_trips"]) {
    console.log(`\n=== ${table} ===`);
    const res = await client.execute(`PRAGMA table_info(${table})`);
    for (const row of res.rows) {
      console.log(
        `  ${String(row.cid).padStart(2)} ${String(row.name).padEnd(25)} ${row.type}${
          row.notnull === 1 ? " NOT NULL" : ""
        }${row.pk ? " PK" : ""}`
      );
    }
    const fk = await client.execute(`PRAGMA foreign_key_list(${table})`);
    if (fk.rows.length > 0) {
      console.log("  FKs:");
      for (const row of fk.rows) {
        console.log(`    ${row.from} -> ${row.table}.${row.to}`);
      }
    }
  }
  console.log("\n=== users (count + sample) ===");
  const uCount = await client.execute("SELECT COUNT(*) as c FROM users");
  console.log("  users count:", uCount.rows[0].c);
  const sample = await client.execute(
    "SELECT id, email FROM users ORDER BY id LIMIT 5"
  );
  for (const r of sample.rows) console.log("  ", r.id, r.email);
  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
