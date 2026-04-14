import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@libsql/client";

async function main() {
  const db = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN!,
  });
  const before = await db.execute({
    sql: "SELECT slug, dog_friendly_note FROM wineries WHERE slug = ?",
    args: ["kunde-family"],
  });
  console.log("BEFORE:", before.rows[0]);
  const res = await db.execute({
    sql: "UPDATE wineries SET dog_friendly_note = ? WHERE slug = ?",
    args: [
      "Dogs welcome at Kinneybrook tasting. Check winery for details",
      "kunde-family",
    ],
  });
  console.log("rowsAffected:", res.rowsAffected);
  const after = await db.execute({
    sql: "SELECT slug, dog_friendly_note FROM wineries WHERE slug = ?",
    args: ["kunde-family"],
  });
  console.log("AFTER:", after.rows[0]);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
