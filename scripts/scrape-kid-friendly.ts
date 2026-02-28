import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries } from "../src/db/schema";
import { eq, isNotNull } from "drizzle-orm";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  console.error("Missing GOOGLE_PLACES_API_KEY in environment");
  process.exit(1);
}

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
});
const db = drizzle(client);

const DELAY_MS = 200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getGoodForChildren(placeId: string): Promise<boolean | null> {
  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=goodForChildren&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  API error: ${res.status} ${res.statusText}`);
    return null;
  }
  const data = await res.json();
  return data.goodForChildren ?? null;
}

async function main() {
  const allWineries = await db
    .select({
      id: wineries.id,
      name: wineries.name,
      googlePlaceId: wineries.googlePlaceId,
    })
    .from(wineries)
    .where(isNotNull(wineries.googlePlaceId));

  console.log(`Found ${allWineries.length} wineries with Google Place IDs\n`);

  let updated = 0;
  let kidFriendlyCount = 0;
  let processed = 0;

  for (const winery of allWineries) {
    processed++;
    const placeId = winery.googlePlaceId!;
    console.log(`[${processed}/${allWineries.length}] ${winery.name}`);

    const result = await getGoodForChildren(placeId);

    if (result === null) {
      console.log("  No data, skipping");
    } else {
      await db
        .update(wineries)
        .set({ kidFriendly: result })
        .where(eq(wineries.id, winery.id));
      updated++;
      if (result) {
        kidFriendlyCount++;
        console.log("  Kid friendly!");
      } else {
        console.log("  Not kid friendly");
      }
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nDone! Updated ${updated} wineries. ${kidFriendlyCount} are kid-friendly.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
