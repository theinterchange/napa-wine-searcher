/**
 * Reproduce the Drizzle saved_trips insert path from the fork endpoint.
 * Isolates whether the bug is in Drizzle vs. libsql vs. the endpoint.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { savedTrips, savedTripStops } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
  });
  const db = drizzle(client);

  const userId = "40f92746-707a-4503-b719-04624a2e9d0a";
  const shareCode = `DRIZ${Date.now()}`;

  console.log("Drizzle insert savedTrips...");
  try {
    const [inserted] = await db
      .insert(savedTrips)
      .values({
        userId,
        name: "Test trip via drizzle",
        shareCode,
        theme: "luxury",
        valley: "napa",
        forkedFromRouteId: null,
        originLat: null,
        originLng: null,
        originLabel: null,
      })
      .returning({ id: savedTrips.id });
    console.log("  ✓ inserted:", inserted);

    if (inserted?.id) {
      await db.insert(savedTripStops).values([
        { tripId: inserted.id, wineryId: 1, stopOrder: 0 },
        { tripId: inserted.id, wineryId: 2, stopOrder: 1 },
      ]);
      console.log("  ✓ stops inserted");
      // cleanup
      await db.delete(savedTripStops).where(eq(savedTripStops.tripId, inserted.id));
      await db.delete(savedTrips).where(eq(savedTrips.id, inserted.id));
      console.log("  ✓ cleaned up");
    }
  } catch (err) {
    console.error("Drizzle insert FAILED:");
    console.error(err);
  }

  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
