/**
 * Read-only audit of /guides content quality.
 *
 * For each guide type (experience, varietal, amenity), runs the same
 * queries the live pages use against production Turso and produces a
 * markdown report flagging results that look like mismatches.
 *
 * Usage:
 *   npx tsx scripts/audit-guides.ts              # production Turso (default)
 *   npx tsx scripts/audit-guides.ts --local      # local SQLite
 *
 * Output: /tmp/guides-audit-report.md (ephemeral, not committed).
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { writeFileSync } from "fs";
import {
  getWineriesByExperience,
  getWineriesByAmenity,
  getWineriesByVarietal,
} from "../src/lib/guide-data";

const OUT_PATH = "/tmp/guides-audit-report.md";

const lines: string[] = [];
function p(...s: string[]) {
  for (const line of s) lines.push(line);
}

function truncate(s: string | null, n = 120) {
  if (!s) return "(no description)";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

async function auditGroups() {
  p("## 2. Experience — Groups & Celebrations", "");
  const scopes: Array<{
    label: string;
    valley?: "napa" | "sonoma";
    subRegionSlug?: string;
  }> = [
    { label: "Napa Valley (valley-wide)", valley: "napa" },
    { label: "Sonoma County (valley-wide)", valley: "sonoma" },
    { label: "Yountville", valley: "napa", subRegionSlug: "yountville" },
  ];

  for (const s of scopes) {
    const rows = await getWineriesByExperience("groups", s.valley, s.subRegionSlug);
    const top10 = rows.slice(0, 10);
    p(`### ${s.label} (${rows.length} total, top 10)`, "");
    p("| # | Winery | Reviews | Rating | Description |", "|---|---|---|---|---|");
    for (const [i, w] of top10.entries()) {
      p(
        `| ${i + 1} | **${w.name}** (\`${w.slug}\`) | ${w.totalRatings ?? "?"} | ${w.aggregateRating ?? "?"} | ${truncate(w.shortDescription, 90)} |`,
      );
    }
    p("");
  }
  p("**Assessment:** Filter is just `reservation_required=false`. Any walk-in winery qualifies regardless of group suitability (some are tiny rooms with no bachelorette-party capacity). Low-confidence content.", "");
}

async function auditFirstTime() {
  p("## 3. Experience — First-Time Visitor", "");
  const scopes: Array<{ label: string; valley?: "napa" | "sonoma" }> = [
    { label: "Napa Valley", valley: "napa" },
    { label: "Sonoma County", valley: "sonoma" },
  ];

  for (const s of scopes) {
    const rows = await getWineriesByExperience("first-time", s.valley);
    const top10 = rows.slice(0, 10);
    p(`### ${s.label} (${rows.length} total, top 10)`, "");
    p("| # | Winery | Price lvl | Reviews | Description |", "|---|---|---|---|---|");
    for (const [i, w] of top10.entries()) {
      p(
        `| ${i + 1} | **${w.name}** (\`${w.slug}\`) | ${w.priceLevel ?? "?"} | ${w.totalRatings ?? "?"} | ${truncate(w.shortDescription, 90)} |`,
      );
    }
    p("");
  }
  p("**Assessment:** Filter is `walk-in + price_level≤2`. No signal for actually being beginner-friendly (welcoming staff, basic education, approachable wines). Low-confidence content.", "");
}

async function auditVarietal() {
  p("## 4. Varietal — specialization score", "");

  const scopes: Array<{
    varietal: string;
    valley: "napa" | "sonoma";
  }> = [
    { varietal: "Cabernet Sauvignon", valley: "napa" },
    { varietal: "Pinot Noir", valley: "sonoma" },
    { varietal: "Chardonnay", valley: "napa" },
    { varietal: "Zinfandel", valley: "sonoma" },
    { varietal: "Merlot", valley: "napa" },
  ];

  for (const s of scopes) {
    const rows = await getWineriesByVarietal(s.varietal, s.valley);
    const top10 = rows.slice(0, 10);
    p(`### Best ${s.varietal} in ${s.valley === "napa" ? "Napa Valley" : "Sonoma County"} (top 10 of ${rows.length})`, "");
    p("| # | Winery | Rating | Reviews | Description |", "|---|---|---|---|---|");
    for (const [i, w] of top10.entries()) {
      p(
        `| ${i + 1} | **${w.name}** (\`${w.slug}\`) | ${w.aggregateRating ?? "?"} | ${w.totalRatings ?? "?"} | ${truncate(w.shortDescription, 90)} |`,
      );
    }
    p("");
  }
  p("**Assessment:** Specialization score is `(varietal_count / total_wines) × varietal_count × rating`. Wineries with only 1–2 wines total can appear above genuine specialists. Recommend adding `HAVING varietal_count >= 3` threshold.", "");
}

async function auditAmenity() {
  p("## 5. Amenity — Picnic", "");
  const picnicNapa = await getWineriesByAmenity("picnicFriendly", "napa");
  const picnicSonoma = await getWineriesByAmenity("picnicFriendly", "sonoma");
  p(`Napa picnic-friendly: ${picnicNapa.length} | Sonoma picnic-friendly: ${picnicSonoma.length}`, "");
  p("### Sample 10 — Napa Valley picnic-friendly", "");
  p("| # | Winery | Description (does it mention picnic?) |", "|---|---|---|");
  for (const [i, w] of picnicNapa.slice(0, 10).entries()) {
    const mentionsPicnic = /picnic|blanket|lunch|grounds|lawn/i.test(
      w.shortDescription ?? "",
    );
    p(
      `| ${i + 1} | **${w.name}** (\`${w.slug}\`) ${mentionsPicnic ? "✅" : "⚠️"} | ${truncate(w.shortDescription, 140)} |`,
    );
  }
  p("");

  p("## 6. Amenity — Walk-in", "");
  const walkinNapa = await getWineriesByAmenity("walkIn", "napa");
  const walkinSonoma = await getWineriesByAmenity("walkIn", "sonoma");
  p(`Napa walk-in: ${walkinNapa.length} | Sonoma walk-in: ${walkinSonoma.length}`, "");
  p("### Top 15 by ranking — Napa walk-in (flagging price_level=4 as suspect)", "");
  p("| # | Winery | price_level | Reservation required | Description |", "|---|---|---|---|---|");
  let luxuryFlagged = 0;
  for (const [i, w] of walkinNapa.slice(0, 15).entries()) {
    const flag = w.priceLevel === 4 ? "❌ LUXURY" : "";
    if (w.priceLevel === 4) luxuryFlagged++;
    p(
      `| ${i + 1} | **${w.name}** ${flag} | ${w.priceLevel ?? "?"} | ${w.reservationRequired ? "T" : "F"} | ${truncate(w.shortDescription, 80)} |`,
    );
  }
  p("");
  p(`**Assessment:** ${luxuryFlagged} luxury (price_level=4) wineries in the top 15 walk-in listings. These are almost always appointment-only in practice regardless of column value. Recommend excluding price_level=4.`, "");
}

async function main() {
  p("# Guides Content Quality Audit", "");
  p(`Generated: ${new Date().toISOString()}`, "");
  p(`Database: ${process.env.DATABASE_URL?.startsWith("libsql") ? "production Turso" : "local SQLite"}`, "");
  p("---", "");

  await auditGroups();
  await auditFirstTime();
  await auditVarietal();
  await auditAmenity();

  writeFileSync(OUT_PATH, lines.join("\n"));
  console.log(`Audit report written to ${OUT_PATH} (${lines.length} lines)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
