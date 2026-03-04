import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries } from "../src/db/schema";
import { isNull, or, eq } from "drizzle-orm";

// --- CLI args ---
const useTurso = process.argv.includes("--turso");
const dryRun = process.argv.includes("--dry-run");

// --- DB setup ---
let dbUrl: string;
let dbAuthToken: string | undefined;

if (useTurso) {
  dbUrl = "libsql://napa-winery-search-theinterchange.aws-us-west-2.turso.io";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  if (!dbAuthToken) {
    console.log("No DATABASE_AUTH_TOKEN in env, generating via Turso CLI...");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { execSync } = require("child_process") as typeof import("child_process");
    dbAuthToken = execSync(
      `${process.env.HOME}/.turso/turso db tokens create napa-winery-search`,
      { encoding: "utf-8" }
    ).trim();
  }
  console.log("Using Turso production database");
} else {
  dbUrl = process.env.DATABASE_URL || "file:./data/winery.db";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  console.log("Using local database");
}

// --- API key ---
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  console.error("Missing GOOGLE_PLACES_API_KEY in environment");
  process.exit(1);
}

if (dryRun) console.log("DRY RUN — no DB writes");
console.log();

const client = createClient({ url: dbUrl, authToken: dbAuthToken });
const db = drizzle(client);

const DELAY_MS = 200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface PlaceData {
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  editorialSummary?: { text: string };
}

async function getPlaceData(placeId: string): Promise<PlaceData | null> {
  const fields = "formattedAddress,nationalPhoneNumber,editorialSummary";
  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=${fields}&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  API error: ${res.status} ${res.statusText}`);
    return null;
  }
  return res.json();
}

async function main() {
  // Find wineries missing address, phone, or description
  const targets = await db
    .select({
      id: wineries.id,
      name: wineries.name,
      googlePlaceId: wineries.googlePlaceId,
      address: wineries.address,
      phone: wineries.phone,
      description: wineries.description,
    })
    .from(wineries)
    .where(
      or(
        isNull(wineries.address),
        isNull(wineries.phone),
        isNull(wineries.description)
      )
    );

  // Filter to only those with a google_place_id
  const eligible = targets.filter((w) => w.googlePlaceId && w.googlePlaceId !== "");

  console.log(`Found ${eligible.length} wineries with missing data:\n`);

  const missingAddress = eligible.filter((w) => !w.address);
  const missingPhone = eligible.filter((w) => !w.phone);
  const missingDescription = eligible.filter((w) => !w.description);

  console.log(`  Missing address:     ${missingAddress.length} (${missingAddress.map((w) => w.name).join(", ")})`);
  console.log(`  Missing phone:       ${missingPhone.length} (${missingPhone.map((w) => w.name).join(", ")})`);
  console.log(`  Missing description: ${missingDescription.length} (${missingDescription.map((w) => w.name).join(", ")})`);
  console.log();

  let updated = 0;
  let errors = 0;

  for (let i = 0; i < eligible.length; i++) {
    const winery = eligible[i];
    console.log(`[${i + 1}/${eligible.length}] ${winery.name}`);

    const data = await getPlaceData(winery.googlePlaceId!);
    if (!data) {
      console.log("  API returned no data, skipping");
      errors++;
      await sleep(DELAY_MS);
      continue;
    }

    const updates: Record<string, string> = {};

    if (!winery.address && data.formattedAddress) {
      updates.address = data.formattedAddress;
      console.log(`  address: ${data.formattedAddress}`);
    }

    if (!winery.phone && data.nationalPhoneNumber) {
      updates.phone = data.nationalPhoneNumber;
      console.log(`  phone: ${data.nationalPhoneNumber}`);
    }

    if (!winery.description && data.editorialSummary?.text) {
      updates.description = data.editorialSummary.text;
      console.log(`  description: ${data.editorialSummary.text.slice(0, 80)}...`);
    }

    if (Object.keys(updates).length === 0) {
      console.log("  No data available from Google for missing fields");
      await sleep(DELAY_MS);
      continue;
    }

    if (!dryRun) {
      await db.update(wineries).set(updates).where(eq(wineries.id, winery.id));
    }

    updated++;
    await sleep(DELAY_MS);
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Updated: ${updated}`);
  console.log(`Errors:  ${errors}`);
  console.log(`Total:   ${eligible.length}`);
  if (dryRun) console.log("\n(DRY RUN — no changes written)");
  console.log("=".repeat(50));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
