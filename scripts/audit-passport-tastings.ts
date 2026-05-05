import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@libsql/client";

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
  });

  console.log("Target:", process.env.DATABASE_URL);

  const { rows: count } = await client.execute(
    `SELECT COUNT(*) as n FROM tasting_experiences WHERE LOWER(name) LIKE '%passport%' OR LOWER(description) LIKE '%passport%'`
  );
  console.log(`\nTasting experiences mentioning "passport": ${count[0].n}`);

  const { rows: samples } = await client.execute(
    `SELECT te.id, w.name as winery, te.name, te.price, te.description
     FROM tasting_experiences te
     JOIN wineries w ON w.id = te.winery_id
     WHERE LOWER(te.name) LIKE '%passport%' OR LOWER(te.description) LIKE '%passport%'
     ORDER BY w.name, te.price
     LIMIT 30`
  );
  console.log(`\nSamples:`);
  samples.forEach((r: any) => {
    const desc = r.description ? String(r.description).slice(0, 80) : "";
    console.log(`  [${r.id}] ${r.winery} · "${r.name}" · $${r.price ?? "—"}`);
    if (desc) console.log(`         ${desc}${desc.length === 80 ? "..." : ""}`);
  });

  // Also: any other $0 tastings that aren't passport — those would still render "COMPLIMENTARY"
  const { rows: otherZero } = await client.execute(
    `SELECT te.id, w.name as winery, te.name, te.description
     FROM tasting_experiences te
     JOIN wineries w ON w.id = te.winery_id
     WHERE te.price = 0
       AND LOWER(te.name) NOT LIKE '%passport%'
       AND (te.description IS NULL OR LOWER(te.description) NOT LIKE '%passport%')
     ORDER BY w.name`
  );
  console.log(`\n$0 tastings NOT matching passport (these stay): ${otherZero.length}`);
  otherZero.forEach((r: any) => console.log(`  ${r.winery} · "${r.name}"`));

  // Wineries that would lose their min-price if we delete passports
  const { rows: affectedWineries } = await client.execute(
    `WITH passport_ids AS (
       SELECT id FROM tasting_experiences
       WHERE LOWER(name) LIKE '%passport%' OR LOWER(description) LIKE '%passport%'
     )
     SELECT w.id, w.name,
            w.tasting_price_min as current_min,
            (SELECT MIN(price) FROM tasting_experiences te
              WHERE te.winery_id = w.id
                AND te.price IS NOT NULL
                AND te.id NOT IN (SELECT id FROM passport_ids)) as new_min
     FROM wineries w
     WHERE w.id IN (
       SELECT winery_id FROM tasting_experiences
       WHERE LOWER(name) LIKE '%passport%' OR LOWER(description) LIKE '%passport%'
     )
     ORDER BY w.name`
  );
  console.log(`\nWineries whose min-price will recompute (n=${affectedWineries.length}):`);
  affectedWineries.forEach((r: any) =>
    console.log(`  ${r.name}: $${r.current_min} → $${r.new_min ?? "(no priced experiences left)"}`)
  );
}

main().catch((e) => { console.error(e); process.exit(1); });
