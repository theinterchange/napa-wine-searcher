import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { accommodations } from "../src/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { writeFileSync } from "fs";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  console.error("Missing GOOGLE_PLACES_API_KEY in environment");
  process.exit(1);
}

// --- CLI args ---
const DRY_RUN = process.argv.includes("--dry-run");
const useTurso = process.argv.includes("--turso");

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
  console.log("Using Turso production database\n");
} else {
  dbUrl = process.env.DATABASE_URL || "file:./data/winery.db";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  console.log("Using local database\n");
}

const client = createClient({ url: dbUrl, authToken: dbAuthToken });
const db = drizzle(client);

const DELAY_MS = 200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface PlacePolicies {
  allowsDogs: boolean | null;
  goodForChildren: boolean | null;
}

async function getPlacePolicies(placeId: string): Promise<PlacePolicies> {
  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=allowsDogs,goodForChildren&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  API error: ${res.status} ${res.statusText}`);
    return { allowsDogs: null, goodForChildren: null };
  }
  const data = await res.json();
  return {
    allowsDogs: data.allowsDogs ?? null,
    goodForChildren: data.goodForChildren ?? null,
  };
}

async function main() {
  if (DRY_RUN) {
    console.log("=== DRY RUN — no changes will be written ===\n");
  }

  const allAccommodations = await db
    .select({
      id: accommodations.id,
      name: accommodations.name,
      slug: accommodations.slug,
      googlePlaceId: accommodations.googlePlaceId,
      dogFriendly: accommodations.dogFriendly,
      kidFriendly: accommodations.kidFriendly,
      adultsOnly: accommodations.adultsOnly,
    })
    .from(accommodations)
    .where(isNotNull(accommodations.googlePlaceId));

  console.log(`Found ${allAccommodations.length} accommodations with Google Place IDs\n`);

  let updated = 0;
  let noData = 0;
  let errors = 0;
  const results: Array<{
    name: string;
    slug: string;
    allowsDogs: boolean | null;
    goodForChildren: boolean | null;
    dogFriendly: boolean | null;
    kidFriendly: boolean | null;
    adultsOnly: boolean | null;
  }> = [];

  for (let i = 0; i < allAccommodations.length; i++) {
    const acc = allAccommodations[i];
    const placeId = acc.googlePlaceId!;
    console.log(`[${i + 1}/${allAccommodations.length}] ${acc.name}`);

    const { allowsDogs, goodForChildren } = await getPlacePolicies(placeId);

    if (allowsDogs === null && goodForChildren === null) {
      console.log("  No policy data returned");
      noData++;
      await sleep(DELAY_MS);
      continue;
    }

    // Map Google fields to our schema
    const dogFriendly = allowsDogs;
    const kidFriendly = goodForChildren;
    // Infer adults-only: if Google explicitly says NOT good for children
    const adultsOnly = goodForChildren === false ? true : null;

    const tags = [
      dogFriendly === true ? "🐕 Dog OK" : dogFriendly === false ? "🚫 No Dogs" : null,
      kidFriendly === true ? "👨‍👩‍👧 Kid Friendly" : kidFriendly === false ? "🔞 Adults Only" : null,
    ]
      .filter(Boolean)
      .join(", ");

    console.log(`  ${tags || "Partial data"} (allowsDogs=${allowsDogs}, goodForChildren=${goodForChildren})`);

    results.push({
      name: acc.name,
      slug: acc.slug,
      allowsDogs,
      goodForChildren,
      dogFriendly,
      kidFriendly,
      adultsOnly,
    });

    if (!DRY_RUN) {
      const updates: Record<string, boolean | null> = {};
      if (dogFriendly !== null) updates.dogFriendly = dogFriendly;
      if (kidFriendly !== null) updates.kidFriendly = kidFriendly;
      if (adultsOnly !== null) updates.adultsOnly = adultsOnly;

      if (Object.keys(updates).length > 0) {
        await db
          .update(accommodations)
          .set(updates)
          .where(eq(accommodations.id, acc.id));
      }
    }

    updated++;
    await sleep(DELAY_MS);
  }

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Results:`);
  console.log(`  Total queried:       ${allAccommodations.length}`);
  console.log(`  With policy data:    ${updated}`);
  console.log(`  No data returned:    ${noData}`);
  console.log(`  Dog-friendly:        ${results.filter((r) => r.dogFriendly === true).length}`);
  console.log(`  No dogs:             ${results.filter((r) => r.dogFriendly === false).length}`);
  console.log(`  Kid-friendly:        ${results.filter((r) => r.kidFriendly === true).length}`);
  console.log(`  Adults-only (inferred): ${results.filter((r) => r.adultsOnly === true).length}`);
  if (DRY_RUN) {
    console.log(`  Mode:                DRY RUN (no DB writes)`);
  }
  console.log(`${"=".repeat(60)}`);

  // Write preview JSON
  if (results.length > 0) {
    const outputPath = "data/accommodation-google-policies.json";
    writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\nPreview written to ${outputPath}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
