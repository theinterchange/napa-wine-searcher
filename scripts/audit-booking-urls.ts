import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@libsql/client";

const dbUrl = "libsql://napa-winery-search-theinterchange.aws-us-west-2.turso.io";
let dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
if (!dbAuthToken) {
  const { execSync } = require("child_process");
  dbAuthToken = execSync("turso db tokens create napa-winery-search", { encoding: "utf-8" }).trim();
}
const client = createClient({ url: dbUrl, authToken: dbAuthToken });

(async () => {
  const rs = await client.execute(`
    SELECT slug, name, booking_url, booking_provider
    FROM accommodations
    ORDER BY slug
  `);

  type Row = { slug: string; name: string; booking_url: string | null; booking_provider: string | null };
  const rows = rs.rows as unknown as Row[];

  const total = rows.length;
  const withUrl = rows.filter(r => r.booking_url && r.booking_url.trim() !== "");
  const withoutUrl = rows.filter(r => !r.booking_url || r.booking_url.trim() === "");

  const domainCounts: Record<string, number> = {};
  const stay22Tagged: Row[] = [];
  const rawOta: Row[] = [];
  const other: Row[] = [];

  for (const r of withUrl) {
    try {
      const u = new URL(r.booking_url!);
      const host = u.hostname.replace(/^www\./, "");
      domainCounts[host] = (domainCounts[host] || 0) + 1;

      const url = r.booking_url!;
      const hasStay22Aid = url.includes("stay22.com") || /[?&]aid=/.test(url);
      const isOta = /expedia\.com|booking\.com|hotels\.com|agoda\.com|marriott\.com|hilton\.com|hyatt\.com|ihg\.com/.test(host);

      if (hasStay22Aid) stay22Tagged.push(r);
      else if (isOta) rawOta.push(r);
      else other.push(r);
    } catch {
      other.push(r);
    }
  }

  console.log("=== Booking URL Audit ===");
  console.log(`Total accommodations: ${total}`);
  console.log(`  With booking_url:    ${withUrl.length}`);
  console.log(`  Without booking_url: ${withoutUrl.length}  (→ these fall through to Stay22 Allez — affiliate OK)`);
  console.log();
  console.log("--- Breakdown of accommodations WITH booking_url ---");
  console.log(`  Stay22-tagged (has ?aid= or stay22.com):  ${stay22Tagged.length}  ✓ affiliate attributed`);
  console.log(`  Raw OTA (Expedia/Booking/Hotels/etc):     ${rawOta.length}  ⚠  NOT Stay22-affiliated — revenue leak`);
  console.log(`  Other (direct hotel sites, etc):          ${other.length}  (falls through to UTM-tagged, not affiliated)`);
  console.log();
  console.log("--- Top domains in booking_url ---");
  Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([host, n]) => console.log(`  ${host.padEnd(35)} ${n}`));

  if (rawOta.length > 0) {
    console.log();
    console.log("--- Raw OTA links (revenue leak candidates) ---");
    rawOta.slice(0, 20).forEach(r => {
      console.log(`  ${r.slug.padEnd(45)} ${r.booking_url?.slice(0, 120)}`);
    });
    if (rawOta.length > 20) console.log(`  ...and ${rawOta.length - 20} more`);
  }

  console.log();
  console.log("--- booking_provider column distribution ---");
  const providerCounts: Record<string, number> = {};
  for (const r of rows) {
    const p = r.booking_provider || "(null)";
    providerCounts[p] = (providerCounts[p] || 0) + 1;
  }
  Object.entries(providerCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([p, n]) => console.log(`  ${p.padEnd(25)} ${n}`));
})();
