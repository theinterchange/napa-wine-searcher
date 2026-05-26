import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
});

async function main() {
  console.log("Target:", process.env.DATABASE_URL);
  const rows = await client.execute(
    `SELECT w.slug, w.name, sr.name AS sub_region,
            (w.why_visit IS NOT NULL) AS has_why,
            (w.the_setting IS NOT NULL) AS has_setting,
            (w.why_this_winery IS NOT NULL) AS has_wtw,
            (w.hero_image_url IS NOT NULL) AS has_hero,
            w.curated, w.google_review_count
     FROM wineries w
     LEFT JOIN sub_regions sr ON sr.id = w.sub_region_id
     WHERE LOWER(w.name) LIKE '%hamel%' OR LOWER(w.name) LIKE '%donum%'
        OR LOWER(w.name) LIKE '%frog%' OR LOWER(w.name) LIKE '%hall%'
        OR LOWER(w.name) LIKE '%castello%' OR LOWER(w.name) LIKE '%stag%'
        OR LOWER(w.name) LIKE '%iron horse%' OR LOWER(w.name) LIKE '%jordan%'
     ORDER BY w.name`
  );
  for (const r of rows.rows) console.log(r);
  console.log(`\n${rows.rows.length} matches`);
}
main().catch((e) => { console.error(e); process.exit(1); });
