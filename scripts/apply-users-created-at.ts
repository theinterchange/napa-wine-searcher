/**
 * Add `created_at` to users table for account-creation analytics.
 *
 * Idempotent: skips ALTER if column already exists. Backfills existing rows
 * with their emailVerified timestamp (if set) or "now" so historical accounts
 * have a non-null value and can appear in the trend.
 *
 * Run: npx tsx scripts/apply-users-created-at.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
});

async function main() {
  console.log("Target:", process.env.DATABASE_URL ?? "file:./data/winery.db");

  // 1. Add column.
  try {
    await client.execute("ALTER TABLE users ADD COLUMN created_at TEXT");
    console.log("  ✓ users.created_at column added");
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes("duplicate column name") || msg.includes("already exists")) {
      console.log("  − users.created_at already exists");
    } else {
      throw err;
    }
  }

  // 2. Backfill existing rows. emailVerified is INTEGER seconds-since-epoch
  //    when set; otherwise stamp with now so rows aren't NULL.
  const nowIso = new Date().toISOString();
  const result = await client.execute({
    sql: `
      UPDATE users
      SET created_at = COALESCE(
        created_at,
        CASE
          WHEN emailVerified IS NOT NULL
            THEN strftime('%Y-%m-%dT%H:%M:%fZ', emailVerified, 'unixepoch')
          ELSE ?
        END
      )
      WHERE created_at IS NULL
    `,
    args: [nowIso],
  });
  console.log(`  ✓ Backfilled ${result.rowsAffected} existing rows`);

  // 3. Index for fast trend queries.
  try {
    await client.execute(
      "CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at)"
    );
    console.log("  ✓ idx_users_created_at");
  } catch (err) {
    console.log("  ✗ idx_users_created_at:", (err as Error).message);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
