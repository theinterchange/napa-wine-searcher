import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries } from "../src/db/schema";
import { eq } from "drizzle-orm";

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

if (dryRun) console.log("DRY RUN — no DB writes");
console.log();

const client = createClient({ url: dbUrl, authToken: dbAuthToken });
const db = drizzle(client);

// --- Corrections ---

// Dog notes to update (winery name → new note)
const dogNoteUpdates: Record<string, string> = {
  "Alpha Omega": "Leashed dogs on patio",
  "Amista Vineyards": "Dogs welcome",
  "Bennett Lane": "Dogs welcome",
  "Bouchaine Vineyards": "Leashed dogs welcome; garden area",
  "Bricoleur Vineyards": "Dogs welcome on property",
  "Castello di Amorosa": "Dogs welcome; treats and water provided",
  "Chimney Rock": "Leashed dogs; water bowls provided",
  "Clif Family Winery": "Dog-friendly patio",
  "Cuvaison Estate": "Dogs welcome; treats available",
  "Deerfield Ranch": "Dogs welcome in caves",
  "Dry Creek Vineyard": "Leashed dogs on picnic grounds",
  "Emeritus Vineyards": "Leashed dogs on terrace",
  "Fontanella Family": "Leashed dogs on patio",
  "Frog's Leap": "Dogs on Back Porch and Garden Bar",
  "Jessup Cellars": "Dogs welcome inside and outside",
  "Kendall-Jackson": "Leashed dogs welcome",
  "Kunde Family": "Dog hike experience available",
  "Monticello Vineyards": "Dogs welcome",
  "Rodney Strong": "Leashed dogs welcome",
  "St. Francis": "Select experiences only; confirm when booking",
  "St. Supéry": "Dogs welcome; treats available",
  "Tamber Bey": "Leashed dogs welcome",
  "Three Fat Guys": "Dog-friendly backyard",
  "Viansa": "Leashed dogs welcome outdoors",
};

// Dog notes to NULL (too generic)
const dogNoteNulls = [
  "Black Stallion",
  "Buena Vista",
  "Grgich Hills",
  "Imagery",
  "Larson",
  "Ledson",
  "MacRostie",
  "Merryvale",
  "Raymond",
  "Roche",
  "Scribe",
  "Trattore",
  "aesthete",
];

// Kid notes to update (winery name → new note)
const kidNoteUpdates: Record<string, string | null> = {
  "Aonair Winery": null, // data error — "Dogs welcome" was in kid field
  "Beringer": "Kids free on Sip & Stroll; $10 ages 12-20",
  "Castello di Amorosa": "Ages 5+; grape juice, coloring, farm animals",
  "Charles Krug": "$10 child fee; bocce, picnic, tours",
  "Buena Vista": "Hedge maze, museum, tours",
  "Frog's Leap": "Families welcome",
  "Kendall-Jackson": "Grape juice, bocce, garden, chicken coop",
  "Raymond": "Farm animals; self-guided tour",
  "Bennett Lane": "Outdoor garden area",
  "Emeritus": "Families welcome",
  "Pedroncelli": "Families welcome",
  "Tedeschi Family": "Families welcome",
  "Francis Ford Coppola": "Family-oriented experiences",
  "Bricoleur": "Families welcome",
  "Hook & Ladder": "Kids and pets welcome",
  "St. Francis": "Select experiences only; confirm when booking",
  "Chateau Diana": "Outdoor games and food",
};

// Kid notes to NULL (redundant with "Kid Friendly" label)
const kidNoteNulls = [
  "Bartholomew Estate",
  "Cline Family Cellars",
  "DaVero Farms",
  "Girard",
  "Grgich Hills",
  "Harvest Moon",
  "Honig",
  "Jacuzzi",
  "Keller Estate",
  "Kivelstadt",
  "La Crema",
  "Larson",
  "PEJU",
  "Paradise Ridge",
  "Robledo",
  "Russian River Vineyards",
  "Soda Rock",
  "Wilson",
  "Zialena",
  "aesthete",
];

// --- Helpers ---

async function findWinery(name: string) {
  // Try exact match first, then startsWith via LIKE
  const all = await db
    .select({ id: wineries.id, name: wineries.name, slug: wineries.slug })
    .from(wineries);

  // Exact match
  let match = all.find((w) => w.name === name);
  if (match) return match;

  // Case-insensitive exact
  match = all.find((w) => w.name.toLowerCase() === name.toLowerCase());
  if (match) return match;

  // Starts with (for partial names like "Emeritus" matching "Emeritus Vineyards")
  match = all.find((w) => w.name.toLowerCase().startsWith(name.toLowerCase()));
  if (match) return match;

  // Contains
  match = all.find((w) => w.name.toLowerCase().includes(name.toLowerCase()));
  if (match) return match;

  return null;
}

// --- Main ---
async function main() {
  let totalUpdates = 0;
  let notFound = 0;

  console.log("=== Dog Note Updates ===\n");
  for (const [name, newNote] of Object.entries(dogNoteUpdates)) {
    const winery = await findWinery(name);
    if (!winery) {
      console.log(`  NOT FOUND: ${name}`);
      notFound++;
      continue;
    }
    console.log(`  ${winery.name} → "${newNote}"`);
    if (!dryRun) {
      await db.update(wineries).set({ dogFriendlyNote: newNote }).where(eq(wineries.id, winery.id));
    }
    totalUpdates++;
  }

  console.log("\n=== Dog Notes → NULL ===\n");
  for (const name of dogNoteNulls) {
    const winery = await findWinery(name);
    if (!winery) {
      console.log(`  NOT FOUND: ${name}`);
      notFound++;
      continue;
    }
    console.log(`  ${winery.name} → NULL`);
    if (!dryRun) {
      await db.update(wineries).set({ dogFriendlyNote: null }).where(eq(wineries.id, winery.id));
    }
    totalUpdates++;
  }

  console.log("\n=== Kid Note Updates ===\n");
  for (const [name, newNote] of Object.entries(kidNoteUpdates)) {
    const winery = await findWinery(name);
    if (!winery) {
      console.log(`  NOT FOUND: ${name}`);
      notFound++;
      continue;
    }
    if (newNote === null) {
      console.log(`  ${winery.name} → NULL (data error fix)`);
    } else {
      console.log(`  ${winery.name} → "${newNote}"`);
    }
    if (!dryRun) {
      await db
        .update(wineries)
        .set({ kidFriendlyNote: newNote })
        .where(eq(wineries.id, winery.id));
    }
    totalUpdates++;
  }

  console.log("\n=== Kid Notes → NULL ===\n");
  for (const name of kidNoteNulls) {
    const winery = await findWinery(name);
    if (!winery) {
      console.log(`  NOT FOUND: ${name}`);
      notFound++;
      continue;
    }
    console.log(`  ${winery.name} → NULL`);
    if (!dryRun) {
      await db
        .update(wineries)
        .set({ kidFriendlyNote: null })
        .where(eq(wineries.id, winery.id));
    }
    totalUpdates++;
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Total updates: ${totalUpdates}`);
  console.log(`Not found:     ${notFound}`);
  if (dryRun) console.log("\n(DRY RUN — no changes written)");
  console.log("=".repeat(50));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
