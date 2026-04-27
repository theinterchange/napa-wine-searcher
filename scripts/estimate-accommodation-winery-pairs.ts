import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";

function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL || "file:./data/winery.db",
    authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
  });
  const hotels = await client.execute(
    "SELECT id, lat, lng FROM accommodations WHERE lat IS NOT NULL AND lng IS NOT NULL"
  );
  const wineries = await client.execute(
    "SELECT id, lat, lng FROM wineries WHERE lat IS NOT NULL AND lng IS NOT NULL"
  );
  console.log(
    `Hotels: ${hotels.rows.length}, wineries: ${wineries.rows.length}`
  );

  for (const radius of [10, 15, 20, 25, 30]) {
    let count = 0;
    const perHotel: number[] = [];
    for (const h of hotels.rows) {
      let n = 0;
      for (const w of wineries.rows) {
        const d = haversineMiles(
          Number(h.lat),
          Number(h.lng),
          Number(w.lat),
          Number(w.lng)
        );
        if (d <= radius) n++;
      }
      count += n;
      perHotel.push(n);
    }
    const avg = Math.round((count / hotels.rows.length) * 10) / 10;
    console.log(
      `  Radius ${radius}mi → ${count} pairs, avg ${avg}/hotel (min ${Math.min(...perHotel)}, max ${Math.max(...perHotel)})`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
