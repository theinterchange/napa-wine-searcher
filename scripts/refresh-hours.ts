/**
 * Refresh winery hours from Google Places API.
 *
 * Fetches current opening hours for all wineries and updates the database.
 * Validates hours before writing — rejects "Open 24 hours", all-Closed, etc.
 *
 * Usage:
 *   npx tsx scripts/refresh-hours.ts --turso
 *   npx tsx scripts/refresh-hours.ts --turso --dry-run
 *   npx tsx scripts/refresh-hours.ts --turso --winery=opus-one
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries } from "../src/db/schema";
import { eq, isNotNull } from "drizzle-orm";

const useTurso = process.argv.includes("--turso");
const dryRun = process.argv.includes("--dry-run");
const winerySlugArg = process.argv
  .find((a) => a.startsWith("--winery="))
  ?.split("=")[1];

let dbUrl: string;
let dbAuthToken: string | undefined;

if (useTurso) {
  dbUrl = "libsql://napa-winery-search-theinterchange.aws-us-west-2.turso.io";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  if (!dbAuthToken) {
    const { execSync } =
      require("child_process") as typeof import("child_process");
    dbAuthToken = execSync(`turso db tokens create napa-winery-search`, {
      encoding: "utf-8",
    }).trim();
  }
  console.log("Using Turso production database");
} else {
  dbUrl = process.env.DATABASE_URL || "file:./data/winery.db";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  console.log("Using local database");
}

const client = createClient({ url: dbUrl, authToken: dbAuthToken });
const db = drizzle(client);

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY && !dryRun) {
  console.error("Missing GOOGLE_PLACES_API_KEY");
  process.exit(1);
}

const DELAY_MS = 200;
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface PlaceHours {
  openNow?: boolean;
  weekdayDescriptions?: string[];
  periods?: {
    open: { day: number; hour: number; minute: number };
    close?: { day: number; hour: number; minute: number };
  }[];
}

const DAY_MAP: Record<number, string> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

function parseHoursToJson(
  hours: PlaceHours
): Record<string, string> | null {
  if (!hours.periods || hours.periods.length === 0) return null;

  const result: Record<string, string> = {
    mon: "Closed",
    tue: "Closed",
    wed: "Closed",
    thu: "Closed",
    fri: "Closed",
    sat: "Closed",
    sun: "Closed",
  };

  for (const period of hours.periods) {
    const dayKey = DAY_MAP[period.open.day];
    if (!dayKey) continue;

    // Skip "Open 24 hours" (open at 0:00, no close)
    if (!period.close) continue;

    const openTime = `${String(period.open.hour).padStart(2, "0")}:${String(period.open.minute).padStart(2, "0")}`;
    const closeTime = `${String(period.close.hour).padStart(2, "0")}:${String(period.close.minute).padStart(2, "0")}`;
    result[dayKey] = `${openTime}-${closeTime}`;
  }

  // Validate: at least 2 days should be open (not all Closed)
  const openDays = Object.values(result).filter((v) => v !== "Closed").length;
  if (openDays < 2) return null;

  // Validate: no "Open 24 hours" style entries
  const has24h = Object.values(result).some(
    (v) => v.includes("24") || v === "00:00-00:00"
  );
  if (has24h) return null;

  return result;
}

async function fetchHours(
  placeId: string
): Promise<Record<string, string> | null> {
  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=regularOpeningHours&key=${API_KEY}`;
  const res = await fetch(url);

  if (!res.ok) {
    console.error(`  API error: ${res.status}`);
    return null;
  }

  const data = await res.json();
  if (!data.regularOpeningHours) return null;

  return parseHoursToJson(data.regularOpeningHours);
}

async function main() {
  console.log(
    `Flags: ${dryRun ? "--dry-run " : ""}${winerySlugArg ? `--winery=${winerySlugArg}` : ""}\n`
  );

  const allWineries = await db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      googlePlaceId: wineries.googlePlaceId,
      hoursJson: wineries.hoursJson,
    })
    .from(wineries)
    .where(isNotNull(wineries.googlePlaceId));

  let toProcess = allWineries;
  if (winerySlugArg) {
    toProcess = toProcess.filter((w) => w.slug === winerySlugArg);
    if (toProcess.length === 0) {
      console.error(`No winery found with slug "${winerySlugArg}"`);
      process.exit(1);
    }
  }

  console.log(`${toProcess.length} wineries to refresh\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const w = toProcess[i];
    const progress = `[${i + 1}/${toProcess.length}]`;

    if (dryRun) {
      console.log(`${progress} ${w.name} (dry run)`);
      continue;
    }

    const hours = await fetchHours(w.googlePlaceId!);

    if (!hours) {
      // Check if existing hours are also bad — clear them
      if (w.hoursJson) {
        try {
          const existing = JSON.parse(w.hoursJson);
          const hasInvalid =
            Object.values(existing).some(
              (v) =>
                v === "Open 24 hours" ||
                v === "Temporarily Closed" ||
                (typeof v === "string" && v.includes("24 hours"))
            ) ||
            Object.values(existing).filter((v) => v === "Closed").length >= 6;

          if (hasInvalid) {
            await db
              .update(wineries)
              .set({ hoursJson: null })
              .where(eq(wineries.id, w.id));
            console.log(
              `${progress} ${w.name} — cleared bad hours data`
            );
            updated++;
            await sleep(DELAY_MS);
            continue;
          }
        } catch {}
      }
      console.log(`${progress} ${w.name} — no valid hours from API, keeping existing`);
      skipped++;
      await sleep(DELAY_MS);
      continue;
    }

    const hoursJson = JSON.stringify(hours);
    if (hoursJson === w.hoursJson) {
      console.log(`${progress} ${w.name} — unchanged`);
      skipped++;
      await sleep(DELAY_MS);
      continue;
    }

    await db
      .update(wineries)
      .set({ hoursJson })
      .where(eq(wineries.id, w.id));

    const sample = hours.mon !== "Closed" ? hours.mon : hours.tue !== "Closed" ? hours.tue : hours.sat;
    console.log(`${progress} ${w.name} — updated (${sample})`);
    updated++;
    await sleep(DELAY_MS);
  }

  console.log(`\n=== Summary ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Unchanged/skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
