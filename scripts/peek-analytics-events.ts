import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@libsql/client";

async function main() {
  const c = createClient({
    url: process.env.DATABASE_URL || "file:./data/winery.db",
    authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
  });
  const r = await c.execute(
    "SELECT id, event_name, mode, payload_json, created_at FROM itinerary_analytics_events ORDER BY id DESC LIMIT 10"
  );
  console.log(`Total recent events: ${r.rows.length}`);
  for (const row of r.rows) {
    console.log(
      `#${row.id}  ${row.event_name}  mode=${row.mode ?? "—"}  ${row.created_at}`
    );
    if (row.payload_json) console.log(`     ${row.payload_json}`);
  }
}
main();
