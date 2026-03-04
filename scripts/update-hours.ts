import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries } from "../src/db/schema";
import { isNotNull, eq } from "drizzle-orm";

// --- CLI args ---
const useTurso = process.argv.includes("--turso");
const dryRun = process.argv.includes("--dry-run");
const onlyBroken = process.argv.includes("--only-broken");

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
if (onlyBroken) console.log("ONLY BROKEN — targeting NULL/all-Closed hours");
console.log();

const client = createClient({ url: dbUrl, authToken: dbAuthToken });
const db = drizzle(client);

const DELAY_MS = 200;
const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

type HoursMap = Record<string, string>;

interface GooglePeriod {
  open: { day: number; hour: number; minute: number };
  close?: { day: number; hour: number; minute: number };
}

function isAllClosed(hours: HoursMap): boolean {
  return Object.values(hours).every((v) => v === "Closed");
}

function convertGoogleHours(periods: GooglePeriod[]): HoursMap {
  // Build a map of day → time ranges
  const dayRanges: Record<string, string[]> = {};
  for (const day of DAY_NAMES) {
    dayRanges[day] = [];
  }

  for (const period of periods) {
    const dayName = DAY_NAMES[period.open.day];
    if (!period.close) {
      // 24-hour open (open without close)
      dayRanges[dayName].push("Open 24 hours");
      continue;
    }
    const openTime = `${pad(period.open.hour)}:${pad(period.open.minute)}`;
    const closeTime = `${pad(period.close.hour)}:${pad(period.close.minute)}`;
    dayRanges[dayName].push(`${openTime}-${closeTime}`);
  }

  const result: HoursMap = {};
  for (const day of DAY_NAMES) {
    result[day] = dayRanges[day].length > 0 ? dayRanges[day].join(", ") : "Closed";
  }
  return result;
}

async function getHours(placeId: string): Promise<GooglePeriod[] | null> {
  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=regularOpeningHours&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  API error: ${res.status} ${res.statusText}`);
    return null;
  }
  const data = await res.json();
  return data.regularOpeningHours?.periods ?? null;
}

// --- findWinery helper ---
function findWinery(name: string, allWineryRows: { id: number; name: string }[]) {
  let match = allWineryRows.find((w) => w.name === name);
  if (match) return match;
  match = allWineryRows.find((w) => w.name.toLowerCase() === name.toLowerCase());
  if (match) return match;
  match = allWineryRows.find((w) => w.name.toLowerCase().startsWith(name.toLowerCase()));
  if (match) return match;
  match = allWineryRows.find((w) => w.name.toLowerCase().includes(name.toLowerCase()));
  if (match) return match;
  return null;
}

// --- Place ID fixes ---
const PLACE_ID_FIXES: Record<string, string> = {
  "Robert Mondavi Winery": "ChIJ-26DZgpVhIARpynsTQvfIVI",
  "Hall Wines": "ChIJ67OodtFQhIARxX4NvdNweqo",
  "Oakville Grocery & Wine": "ChIJ_TbDQUtUhIARyRuVBXN6CEc",
  "Hess Collection": "ChIJOxh2Yk-qhYARNNy8b_5j6zU",
  "Fontanella Family Winery": "ChIJU26cEPSphYARbq5CrabATmw",
  "Etude Wines": "ChIJFZs_3GMIhYAR0_zCiH_b2qY",
  "Burgess Cellars": "ChIJ6a1p4rZbhIAR37-yMp1_Jx4",
  "Korbel Champagne Cellars": "ChIJYy6scqAYhIARf29RvmsQrtg",
  "Hartford Family Winery": "ChIJz3SDZi8jhIAReL10MVQUa5E",
  "Pedroncelli Winery": "ChIJK4WqtqkFhIARUYtVQAfUD3Q",
  "Mauritson Wines": "ChIJC69FRpAahIARioiuZ55KtVQ",
  "Trentadue Winery": "ChIJby68rxkQhIAR_9FCvXPPutg",
  "Keller Estate": "ChIJF96adQGwhYAR53wraw9aTpQ",
};

// --- Manual hours overrides ---
const byAppointment: HoursMap = {
  mon: "By Appointment", tue: "By Appointment", wed: "By Appointment",
  thu: "By Appointment", fri: "By Appointment", sat: "By Appointment", sun: "By Appointment",
};
const tempClosed: HoursMap = {
  mon: "Temporarily Closed", tue: "Temporarily Closed", wed: "Temporarily Closed",
  thu: "Temporarily Closed", fri: "Temporarily Closed", sat: "Temporarily Closed", sun: "Temporarily Closed",
};

const MANUAL_HOURS: Record<string, HoursMap> = {
  "Bella Union Winery": {
    mon: "11:30-18:00", tue: "11:30-18:00", wed: "11:30-18:00",
    thu: "11:30-18:00", fri: "11:30-18:00", sat: "11:30-18:00", sun: "11:30-18:00",
  },
  "Williams Selyem": byAppointment,
  "Palmaz Vineyards": byAppointment,
  "Vermeil Wines": tempClosed,
  "Robert Mondavi Winery": {
    mon: "10:00-17:00", tue: "10:00-17:00", wed: "10:00-17:00",
    thu: "10:00-17:00", fri: "10:00-17:00", sat: "10:00-17:00", sun: "10:00-17:00",
  },
};

async function main() {
  const allWineries = await db
    .select({
      id: wineries.id,
      name: wineries.name,
      slug: wineries.slug,
      googlePlaceId: wineries.googlePlaceId,
      hoursJson: wineries.hoursJson,
    })
    .from(wineries)
    .where(isNotNull(wineries.googlePlaceId));

  // --- Step 1: Fix place IDs ---
  console.log("=== Fixing Place IDs ===\n");
  for (const [name, newPlaceId] of Object.entries(PLACE_ID_FIXES)) {
    const match = findWinery(name, allWineries);
    if (!match) {
      console.log(`  NOT FOUND: ${name}`);
      continue;
    }
    console.log(`  ${match.name} → ${newPlaceId}`);
    if (!dryRun) {
      await db.update(wineries).set({ googlePlaceId: newPlaceId }).where(eq(wineries.id, match.id));
    }
    // Also update the in-memory record so the main loop uses the new ID
    const inMemory = allWineries.find((w) => w.id === match.id);
    if (inMemory) inMemory.googlePlaceId = newPlaceId;
  }

  // --- Step 2: Apply manual hours overrides ---
  console.log("\n=== Applying Manual Hours Overrides ===\n");
  const manualOverrideIds = new Set<number>();
  for (const [name, hours] of Object.entries(MANUAL_HOURS)) {
    const match = findWinery(name, allWineries);
    if (!match) {
      console.log(`  NOT FOUND: ${name}`);
      continue;
    }
    const newJson = JSON.stringify(hours);
    const existing = allWineries.find((w) => w.id === match.id);
    if (existing?.hoursJson === newJson) {
      console.log(`  ${match.name}: unchanged`);
    } else {
      console.log(`  ${match.name}: ${Object.values(hours)[0]}`);
      if (!dryRun) {
        await db.update(wineries).set({ hoursJson: newJson }).where(eq(wineries.id, match.id));
      }
    }
    manualOverrideIds.add(match.id);
  }

  // --- Step 3: Filter targets ---
  // Exclude empty-string place IDs and manually-overridden wineries
  let targets = allWineries.filter(
    (w) => w.googlePlaceId && w.googlePlaceId !== "" && !manualOverrideIds.has(w.id)
  );

  if (onlyBroken) {
    targets = targets.filter((w) => {
      if (!w.hoursJson) return true;
      try {
        const hours = JSON.parse(w.hoursJson) as HoursMap;
        return isAllClosed(hours);
      } catch {
        return true;
      }
    });
    console.log(
      `\nFound ${targets.length} broken wineries out of ${allWineries.length} total\n`
    );
  } else {
    console.log(`\nFound ${targets.length} wineries to fetch from Google\n`);
  }

  let updated = 0;
  let unchanged = 0;
  let noGoogleHours = 0;
  let errors = 0;

  for (let i = 0; i < targets.length; i++) {
    const winery = targets[i];
    const placeId = winery.googlePlaceId!;
    console.log(`[${i + 1}/${targets.length}] ${winery.name}`);

    const periods = await getHours(placeId);

    if (periods === null) {
      console.log("  No hours data from Google, skipping");
      noGoogleHours++;
      await sleep(DELAY_MS);
      continue;
    }

    const newHours = convertGoogleHours(periods);
    const newJson = JSON.stringify(newHours);

    // Check if hours actually changed
    const oldJson = winery.hoursJson;
    if (oldJson === newJson) {
      console.log("  Unchanged");
      unchanged++;
      await sleep(DELAY_MS);
      continue;
    }

    // Print diff
    const oldHours: HoursMap = oldJson ? JSON.parse(oldJson) : {};
    for (const day of DAY_NAMES) {
      const oldVal = oldHours[day] ?? "N/A";
      const newVal = newHours[day];
      if (oldVal !== newVal) {
        console.log(`  ${day}: ${oldVal} → ${newVal}`);
      }
    }

    if (!dryRun) {
      await db
        .update(wineries)
        .set({ hoursJson: newJson })
        .where(eq(wineries.id, winery.id));
    }

    updated++;
    await sleep(DELAY_MS);
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Updated:         ${updated}`);
  console.log(`Unchanged:       ${unchanged}`);
  console.log(`No Google hours: ${noGoogleHours}`);
  console.log(`Errors:          ${errors}`);
  console.log(`Total processed: ${targets.length}`);
  if (dryRun) console.log("\n(DRY RUN — no changes written)");
  console.log("=".repeat(50));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
