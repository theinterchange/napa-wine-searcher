/**
 * Reproduce the exact savedTrips insert the fork endpoint performs, so we
 * see the real SQLite error (Drizzle's "Failed query" wrapping hides it).
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
  });

  // Michael's user id from the earlier schema dump
  const userId = "40f92746-707a-4503-b719-04624a2e9d0a";
  const shareCode = `TEST${Date.now()}`;

  console.log("Inserting into saved_trips...");
  try {
    const res = await client.execute({
      sql: `INSERT INTO saved_trips
        (user_id, name, share_code, theme, valley, forked_from_route_id, origin_lat, origin_lng, origin_label, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING id`,
      args: [
        userId,
        "Test trip",
        shareCode,
        "luxury",
        "napa",
        null,
        null,
        null,
        null,
        new Date().toISOString(),
        new Date().toISOString(),
      ],
    });
    console.log("  ✓ inserted id:", res.rows[0]?.id);
    // Clean up
    await client.execute({
      sql: "DELETE FROM saved_trips WHERE share_code = ?",
      args: [shareCode],
    });
    console.log("  ✓ cleaned up");
  } catch (err) {
    console.error("INSERT failed:", err);
    if (err instanceof Error) {
      console.error("  name:", err.name);
      console.error("  message:", err.message);
      console.error("  stack:", err.stack);
    }
  }

  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
