/**
 * Audit accommodation monetization coverage.
 *
 * For every accommodation, classify which booking path `hotelBookingUrl()`
 * will actually return:
 *
 *   A. DIRECT    — Booking.com / partner affiliate link (highest commission)
 *   B. STAY22    — Stay22 Allez deep-link (lat + lng present, commission via Stay22)
 *   C. WEBSITE   — hotel's own site with UTM params (no commission, but user reaches hotel)
 *   D. DEAD      — none of the above (button renders nothing; actively broken UX)
 *
 * Run:
 *   set -a; source .env.local; set +a
 *   npx tsx scripts/audit-stay22-coverage.ts
 *
 * Reads production Turso (per project memory: always audit against prod data).
 */
import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { accommodations } from "../src/db/schema";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
});
const db = drizzle(client);

type Tier = "DIRECT" | "STAY22" | "WEBSITE" | "DEAD";

function classify(row: {
  bookingUrl: string | null;
  lat: number | null;
  lng: number | null;
  websiteUrl: string | null;
}): Tier {
  if (row.bookingUrl) return "DIRECT";
  if (row.lat != null && row.lng != null) return "STAY22";
  if (row.websiteUrl) return "WEBSITE";
  return "DEAD";
}

async function main() {
  console.log("Target:", process.env.DATABASE_URL);

  const rows = await db
    .select({
      id: accommodations.id,
      slug: accommodations.slug,
      name: accommodations.name,
      valley: accommodations.valley,
      bookingUrl: accommodations.bookingUrl,
      lat: accommodations.lat,
      lng: accommodations.lng,
      websiteUrl: accommodations.websiteUrl,
    })
    .from(accommodations);

  const tally: Record<Tier, typeof rows> = {
    DIRECT: [],
    STAY22: [],
    WEBSITE: [],
    DEAD: [],
  };
  for (const r of rows) {
    tally[classify(r)].push(r);
  }

  const total = rows.length;
  console.log(`\nTotal accommodations: ${total}\n`);
  for (const tier of ["DIRECT", "STAY22", "WEBSITE", "DEAD"] as const) {
    const pct = ((tally[tier].length / total) * 100).toFixed(1);
    console.log(`${tier.padEnd(8)} ${tally[tier].length.toString().padStart(3)}  (${pct}%)`);
  }

  if (tally.DEAD.length > 0) {
    console.log(`\n--- DEAD (no booking path at all) ---`);
    for (const r of tally.DEAD) {
      console.log(`  ${r.valley.padEnd(6)}  ${r.slug.padEnd(40)}  ${r.name}`);
    }
  }

  if (tally.WEBSITE.length > 0) {
    console.log(`\n--- WEBSITE-ONLY (no commission; backfill candidates) ---`);
    for (const r of tally.WEBSITE) {
      console.log(`  ${r.valley.padEnd(6)}  ${r.slug.padEnd(40)}  ${r.name}`);
    }
  }

  console.log(
    `\nActionable: ${tally.DEAD.length} DEAD (fix lat/lng or booking_url) + ${tally.WEBSITE.length} WEBSITE-only (add lat/lng → Stay22 kicks in).`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
