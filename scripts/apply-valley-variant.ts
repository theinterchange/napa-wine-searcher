/**
 * Migration 0015: add valley_variant to day_trip_stops, backfill existing
 * rows based on the parent route's region.
 *
 * Semantics: each stop is tagged with ONE variant — 'napa' | 'sonoma' | 'both'.
 * The user-facing route page shows one variant at a time via a Napa/Sonoma/Both
 * toggle. Admin can curate a different list for each variant.
 *
 * Backfill:
 *  - Routes tagged "Napa & Sonoma" or "Carneros" → stops tagged 'both'
 *  - Routes tagged "Napa Valley" (or similar) → stops tagged 'napa'
 *  - Routes tagged "Sonoma County" (or similar) → stops tagged 'sonoma'
 *
 * Idempotent: ALTER is wrapped in try/catch; UPDATE is safe to re-run.
 */
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
});

function variantFor(region: string | null): "napa" | "sonoma" | "both" {
  if (!region) return "both";
  const r = region.toLowerCase();
  const hasNapa = r.includes("napa");
  const hasSonoma = r.includes("sonoma");
  if (hasNapa && hasSonoma) return "both";
  if (r.includes("carneros")) return "both";
  if (hasNapa) return "napa";
  if (hasSonoma) return "sonoma";
  return "both";
}

async function main() {
  console.log("Target:", process.env.DATABASE_URL);

  try {
    await client.execute("ALTER TABLE day_trip_stops ADD valley_variant text DEFAULT 'both'");
    console.log("  ✓ ALTER applied");
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes("duplicate column name")) {
      console.log("  − column already exists");
    } else {
      console.log("  ✗", msg);
      return;
    }
  }

  const routes = await client.execute(
    "SELECT id, slug, region FROM day_trip_routes"
  );
  console.log(`\nBackfilling ${routes.rows.length} routes...`);

  for (const r of routes.rows) {
    const variant = variantFor((r.region as string | null) ?? null);
    const result = await client.execute({
      sql: "UPDATE day_trip_stops SET valley_variant = ? WHERE route_id = ?",
      args: [variant, r.id as number],
    });
    console.log(`  ${r.slug} (region=${r.region}) → ${variant}  [${result.rowsAffected} stops]`);
  }

  const counts = await client.execute(
    `SELECT valley_variant, COUNT(*) as n FROM day_trip_stops GROUP BY valley_variant`
  );
  console.log("\nVariant distribution:");
  for (const c of counts.rows) console.log(`  ${c.valley_variant}: ${c.n}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
