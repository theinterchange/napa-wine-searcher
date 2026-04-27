import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL || "file:./data/winery.db",
    authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
  });
  console.log("Target:", process.env.DATABASE_URL ?? "file:./data/winery.db");
  const r = await client.execute("PRAGMA table_info(accommodations)");
  for (const row of r.rows) {
    console.log(" -", row.name, row.type);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
