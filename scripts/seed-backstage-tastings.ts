/**
 * Seeds Backstage Winery's real tasting menu from their Tock page,
 * provided by Michael:
 *   https://www.exploretock.com/backstagewines
 *
 * Wipes any existing Backstage tasting rows first (safe — only one
 * stale placeholder remained, which we already deleted), then inserts
 * the 4 reservations. Re-runs `tasting_price_min` backfill at the end.
 *
 * Run: npx tsx scripts/seed-backstage-tastings.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@libsql/client";

const SOURCE_URL = "https://www.exploretock.com/backstagewines";

interface Tasting {
  name: string;
  description: string;
  price: number;
  reservationRequired: boolean;
  minGroupSize: number | null;
  maxGroupSize: number | null;
}

const TASTINGS: Tasting[] = [
  {
    name: "The Estate Tasting",
    description:
      "Reservations inside our tasting room are available everyday from 11AM to 5PM. A flight of five handcrafted, small-batch wines.",
    price: 45,
    reservationRequired: true,
    minGroupSize: 1,
    maxGroupSize: 25,
  },
  {
    name: "The Backstage Flight",
    description:
      "Reservations inside our tasting room are available everyday from 11AM to 5PM. A flight of five wines.",
    price: 45,
    reservationRequired: true,
    minGroupSize: 1,
    maxGroupSize: 25,
  },
  {
    name: "Bar Seating Indoor Tasting Reservation",
    description:
      "Bar seating inside our tasting room, available everyday from 11AM to 5PM. A flight of five wines.",
    price: 45,
    reservationRequired: true,
    minGroupSize: 1,
    maxGroupSize: 4,
  },
  {
    name: "ATV Vineyard Tour & Tasting",
    description:
      "Experience our wines at the source with an immersive vineyard education tour followed by a guided tasting. Prepaid reservation. 20% gratuity and $5 order fee additional.",
    price: 140,
    reservationRequired: true,
    minGroupSize: 2,
    maxGroupSize: 5,
  },
];

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
  });
  console.log("Target:", process.env.DATABASE_URL);

  const { rows: w } = await client.execute({
    sql: "SELECT id, name FROM wineries WHERE LOWER(name) = LOWER(?)",
    args: ["Backstage Winery"],
  });
  if (w.length === 0) throw new Error("Backstage Winery not found");
  const wineryId = Number(w[0].id);
  console.log(`Backstage Winery id = ${wineryId}`);

  const wipe = await client.execute({
    sql: "DELETE FROM tasting_experiences WHERE winery_id = ?",
    args: [wineryId],
  });
  console.log(`Cleared ${wipe.rowsAffected} existing tasting rows`);

  const now = new Date().toISOString();
  for (const t of TASTINGS) {
    await client.execute({
      sql: `INSERT INTO tasting_experiences
            (winery_id, name, description, price, reservation_required,
             min_group_size, max_group_size, source_url, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        wineryId,
        t.name,
        t.description,
        t.price,
        t.reservationRequired ? 1 : 0,
        t.minGroupSize,
        t.maxGroupSize,
        SOURCE_URL,
        now,
      ],
    });
    console.log(`  ✓ ${t.name} — $${t.price}`);
  }

  // Recompute tasting_price_min for Backstage
  await client.execute({
    sql: `UPDATE wineries
          SET tasting_price_min = (
            SELECT MIN(price) FROM tasting_experiences
            WHERE winery_id = ? AND price IS NOT NULL
          )
          WHERE id = ?`,
    args: [wineryId, wineryId],
  });
  const { rows: after } = await client.execute({
    sql: "SELECT tasting_price_min FROM wineries WHERE id = ?",
    args: [wineryId],
  });
  console.log(`\nBackstage Winery tasting_price_min → $${after[0].tasting_price_min}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
