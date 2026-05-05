/**
 * Read-only audit of every `tasting_experiences` row with price = 0.
 * Groups output by bucket (A/B/C/D from the cleanup plan) so each row
 * can be confirmed before delete.
 *
 * Run: npx tsx scripts/audit-zero-dollar-tastings.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@libsql/client";

const BUCKET_A_NAMES = [
  "BV Club Member Tasting",
  "Chateau St. Jean Club Member Tasting",
  "Chimney Rock Wine Club Member Tasting",
  "Hendry Club Tasting",
  "Hendry Club Classic Tasting",
  "Hendry Club Winemaker's Reserve Flight",
  "The Captain Flight – Club Member",
  "Club Tasting",
  "Wine Club Tasting",
  "Wine Club Members Experience",
  "Members Tasting",
  "First Taste Member Vineyard View Tasting",
];

const BUCKET_B_NAMES = [
  "Complimentary Walking Tour",
  "Winery Picnic",
  "Locals & Industry Night",
  "Vineyard Walk With Cabell",
  "The Theater of Nature",
];

const BUCKET_C_NAMES = [
  "Complimentary Wine Flight at DeLoach",
  "Complimentary Welcome Flight at Raymond",
  "Fridays Uncorked",
  "Winemaker Wednesday",
];

const BUCKET_D_NAMES = [
  "Tastings at Backstage Winery",
  "Tasting Reservation for 1-6 Guests",
  "Join Us for a Tasting",
  "Odette Preview",
  "Splash of Paradise",
];

function bucketOf(name: string): "A" | "B" | "C" | "D" | "?" {
  if (BUCKET_A_NAMES.includes(name)) return "A";
  if (BUCKET_B_NAMES.includes(name)) return "B";
  if (BUCKET_C_NAMES.includes(name)) return "C";
  if (BUCKET_D_NAMES.includes(name)) return "D";
  return "?";
}

function fmt(r: any) {
  const lines: string[] = [];
  lines.push(`  [id ${r.id}] ${r.winery} — "${r.name}"`);
  if (r.duration_minutes != null) lines.push(`    Duration: ${r.duration_minutes} min`);
  if (r.reservation_required != null)
    lines.push(`    Reservation: ${r.reservation_required ? "required" : "walk-in"}`);
  if (r.includes) lines.push(`    Includes: ${String(r.includes).slice(0, 200)}`);
  if (r.description) {
    const d = String(r.description).replace(/\s+/g, " ").trim();
    lines.push(`    Desc: ${d.slice(0, 320)}${d.length > 320 ? "…" : ""}`);
  }
  if (r.source_url) lines.push(`    Source: ${r.source_url}`);
  return lines.join("\n");
}

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
  });
  console.log("Target:", process.env.DATABASE_URL);

  const { rows } = await client.execute(
    `SELECT te.id, w.name as winery, te.name, te.description, te.duration_minutes,
            te.reservation_required, te.includes, te.source_url
     FROM tasting_experiences te
     JOIN wineries w ON w.id = te.winery_id
     WHERE te.price = 0
     ORDER BY w.name, te.name`
  );

  const by: Record<string, any[]> = { A: [], B: [], C: [], D: [], "?": [] };
  rows.forEach((r: any) => by[bucketOf(r.name)].push(r));

  const labels: Record<string, string> = {
    A: "BUCKET A — Wine-club-member tastings (recommend DELETE)",
    B: "BUCKET B — Not actually a tasting (recommend DELETE)",
    C: "BUCKET C — Legitimate complimentary tastings (KEEP)",
    D: "BUCKET D — Placeholder / unclear (verify case-by-case)",
    "?": "UNCATEGORIZED — not in any bucket (likely new data, review)",
  };

  for (const k of ["A", "B", "C", "D", "?"]) {
    if (by[k].length === 0) continue;
    console.log(`\n\n═══ ${labels[k]} (${by[k].length}) ═══`);
    by[k].forEach((r) => console.log(`\n${fmt(r)}`));
  }

  console.log(`\n\nTotals — A:${by.A.length} B:${by.B.length} C:${by.C.length} D:${by.D.length} ?:${by["?"].length} (total $0 rows: ${rows.length})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
