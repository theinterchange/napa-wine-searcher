/**
 * Bucket D cleanup based on Michael's per-row verification:
 *  - Chateau Diana "Tasting Reservation for 1-6 Guests" → update price 0 → 10
 *    (per https://www.chateaud.com — "$10.00 / per guest")
 *  - Backstage Winery "Tastings at Backstage Winery" → delete
 *    (real tastings live on Tock; existing row is a stale placeholder)
 *  - Etude Wines "Join Us for a Tasting" → delete
 *    (description is regional copy, not a real tasting menu item)
 *  - Odette Estate "Odette Preview" → delete
 *    (not a tasting per Michael)
 *
 * Then recomputes wineries.tasting_price_min.
 *
 * Run: npx tsx scripts/fix-bucket-d-tastings.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@libsql/client";

const CHATEAU_DIANA_ID = 2180;
const DELETE_IDS = [
  818, // Backstage Winery — Tastings at Backstage Winery
  2195, // Etude Wines — Join Us for a Tasting
  2108, // Odette Estate Winery — Odette Preview
];

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
  });
  console.log("Target:", process.env.DATABASE_URL);

  // Snapshot before
  const allTouched = [CHATEAU_DIANA_ID, ...DELETE_IDS];
  const { rows: before } = await client.execute(`
    SELECT DISTINCT w.id, w.name, w.tasting_price_min as old_min
    FROM tasting_experiences te
    JOIN wineries w ON w.id = te.winery_id
    WHERE te.id IN (${allTouched.join(",")})
    ORDER BY w.name
  `);

  // Update Chateau Diana
  const upd = await client.execute({
    sql: "UPDATE tasting_experiences SET price = 10 WHERE id = ?",
    args: [CHATEAU_DIANA_ID],
  });
  console.log(`Chateau Diana: updated price 0 → $10 (${upd.rowsAffected} row)`);

  // Deletes
  const del = await client.execute(
    `DELETE FROM tasting_experiences WHERE id IN (${DELETE_IDS.join(",")})`
  );
  console.log(`Deleted ${del.rowsAffected} rows (Backstage, Etude, Odette)`);

  // Recompute min
  console.log("\nRecomputing wineries.tasting_price_min...");
  const recomp = await client.execute(`
    UPDATE wineries
    SET tasting_price_min = (
      SELECT MIN(price) FROM tasting_experiences
      WHERE tasting_experiences.winery_id = wineries.id
        AND price IS NOT NULL
    )
  `);
  console.log(`  ✓ updated ${recomp.rowsAffected} winery rows`);

  // Diff
  const ids = before.map((r: any) => r.id);
  if (ids.length > 0) {
    const { rows: after } = await client.execute(
      `SELECT id, name, tasting_price_min FROM wineries WHERE id IN (${ids.join(",")})`
    );
    const newByid = new Map(after.map((r: any) => [r.id, r.tasting_price_min]));
    console.log("\nPer-winery min-price diff:");
    before.forEach((r: any) => {
      const newMin = newByid.get(r.id);
      const oldStr = r.old_min == null ? "—" : `$${r.old_min}`;
      const newStr = newMin == null ? "(no priced experiences left)" : `$${newMin}`;
      const arrow = String(r.old_min) === String(newMin) ? "·" : "→";
      console.log(`  ${r.name}: ${oldStr} ${arrow} ${newStr}`);
    });
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
