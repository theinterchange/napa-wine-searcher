/**
 * Seeds Etude Wines's tasting menu from their tastings page, provided
 * by Michael:
 *   https://www.etudewines.com/pages/tastings
 *
 * Wipes existing Etude tasting rows first (only the stale "Join Us for
 * a Tasting" placeholder existed and we already deleted it). Skips the
 * "Club Member Tasting" row since Bucket A policy excludes member-only
 * complimentary tastings from the public min-price calc.
 *
 * Prices captured = standard (non-member) per-person rates.
 * Run: npx tsx scripts/seed-etude-tastings.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@libsql/client";

const SOURCE_URL = "https://www.etudewines.com/pages/tastings";

interface Tasting {
  name: string;
  description: string;
  price: number;
  durationMinutes: number | null;
  reservationRequired: boolean;
  minGroupSize: number | null;
  maxGroupSize: number | null;
}

const TASTINGS: Tasting[] = [
  {
    name: "The Study of Pinot",
    description:
      "A 75–90 minute private, seated experience featuring single-vineyard Pinot Noirs from the Grace Benoist Ranch in Carneros. Wine educator-guided.",
    price: 95,
    durationMinutes: 90,
    reservationRequired: true,
    minGroupSize: null,
    maxGroupSize: null,
  },
  {
    name: "The Cabernet Collection",
    description:
      "A 60-minute seated tasting of single-vineyard Cabernet Sauvignon wines from past vintages and multiple Napa Valley appellations. Indoor and outdoor seating.",
    price: 85,
    durationMinutes: 60,
    reservationRequired: true,
    minGroupSize: null,
    maxGroupSize: null,
  },
  {
    name: "Etude Tour & Tasting",
    description:
      "A walking experience through the property, Wellness garden, outdoor plaza, tasting room, and winery mezzanine. Four wines staged across the tour. 21+.",
    price: 65,
    durationMinutes: null,
    reservationRequired: true,
    minGroupSize: null,
    maxGroupSize: null,
  },
  {
    name: "The Terroir Experience",
    description:
      "A 60-minute seated tasting exploring single-vineyard Pinot Noir and Cabernet Sauvignon to compare regional and soil-based flavor differences. Indoor and outdoor seating.",
    price: 55,
    durationMinutes: 60,
    reservationRequired: true,
    minGroupSize: null,
    maxGroupSize: null,
  },
  {
    name: "Midweek Escape to Etude",
    description:
      "Relaxed midweek tasting (Monday–Thursday) of wines from Etude's Carneros portfolio, paired with a complimentary artisanal cheese and charcuterie plate. 21+.",
    price: 45,
    durationMinutes: null,
    reservationRequired: true,
    minGroupSize: null,
    maxGroupSize: null,
  },
  {
    name: "Group Tasting",
    description:
      "Reception-style tasting of four signature wines for groups of 15 or more, with hosted commentary on Carneros, Oregon, and Santa Rita Hills Pinot Noir. Pricing starts at $60 plus tax per person.",
    price: 60,
    durationMinutes: null,
    reservationRequired: true,
    minGroupSize: 15,
    maxGroupSize: null,
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
    args: ["Etude Wines"],
  });
  if (w.length === 0) throw new Error("Etude Wines not found");
  const wineryId = Number(w[0].id);
  console.log(`Etude Wines id = ${wineryId}`);

  const wipe = await client.execute({
    sql: "DELETE FROM tasting_experiences WHERE winery_id = ?",
    args: [wineryId],
  });
  console.log(`Cleared ${wipe.rowsAffected} existing tasting rows`);

  const now = new Date().toISOString();
  for (const t of TASTINGS) {
    await client.execute({
      sql: `INSERT INTO tasting_experiences
            (winery_id, name, description, price, duration_minutes,
             reservation_required, min_group_size, max_group_size,
             source_url, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        wineryId,
        t.name,
        t.description,
        t.price,
        t.durationMinutes,
        t.reservationRequired ? 1 : 0,
        t.minGroupSize,
        t.maxGroupSize,
        SOURCE_URL,
        now,
      ],
    });
    console.log(`  ✓ ${t.name} — $${t.price}`);
  }

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
  console.log(`\nEtude Wines tasting_price_min → $${after[0].tasting_price_min}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
