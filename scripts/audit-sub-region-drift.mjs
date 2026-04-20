/**
 * Audit sub-region assignments in Turso. Produces three lists:
 *
 *   1. IMPOSSIBLE — the city named in the address is itself a different sub-region
 *      (e.g., Napa address tagged as Yountville, or Healdsburg address tagged as
 *      Calistoga). These are almost certainly wrong.
 *
 *   2. SEED DRIFT — Turso sub-region differs from the seed `winery-targets.json`.
 *      Not necessarily wrong (Turso may be more accurate than seed), but worth
 *      reviewing.
 *
 *   3. MISSING — no sub-region assigned at all.
 */
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import { readFileSync } from 'node:fs';

dotenv.config({ path: '/Users/michaelchen/Claude/napa-winery-search/.env.local' });

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const seed = JSON.parse(
  readFileSync('/Users/michaelchen/Claude/napa-winery-search/src/scraper/data/winery-targets.json', 'utf8'),
);
const seedBySlug = new Map(seed.map((s) => [s.slug, s]));

const wineries = await client.execute({
  sql: `SELECT w.slug, w.name, w.city, w.address, w.lat, w.lng,
               sr.slug AS sub_region_slug, sr.name AS sub_region_name,
               sr.valley AS valley
        FROM wineries w
        LEFT JOIN sub_regions sr ON sr.id = w.sub_region_id
        ORDER BY w.name`,
});

const accommodations = await client.execute({
  sql: `SELECT a.slug, a.name, a.city, a.address, a.lat, a.lng, a.valley,
               sr.slug AS sub_region_slug, sr.name AS sub_region_name
        FROM accommodations a
        LEFT JOIN sub_regions sr ON sr.id = a.sub_region_id
        ORDER BY a.name`,
});

// Town → sub-region(s) it is unambiguously in.
// If the address CITY is one of these keys, the assigned sub-region MUST be in
// the associated list. If not, flag it.
const CITY_CONSTRAINT = {
  yountville:   ['yountville'],
  rutherford:   ['rutherford'],
  oakville:     ['oakville'],
  calistoga:    ['calistoga', 'mount-veeder'], // Diamond Mtn side technically in Calistoga
  angwin:       ['howell-mountain'],
  // St Helena ZIP is ambiguous (spring-mountain, howell-mountain both use it) so skip
  // Napa is ambiguous (many AVAs) — skip as a city constraint
  geyserville:  ['alexander-valley', 'dry-creek-valley'],
  cloverdale:   ['alexander-valley'],
  forestville:  ['russian-river-valley'],
  windsor:      ['russian-river-valley'],
  'glen ellen': ['sonoma-valley', 'glen-ellen'],
  kenwood:      ['sonoma-valley', 'kenwood'],
  petaluma:     ['petaluma-gap'],
};

// Sub-regions that are definitely a specific town — if the address city is a
// DIFFERENT known town, that's impossible.
const SUBREGION_TOWN = {
  yountville:   'yountville',
  rutherford:   'rutherford',
  oakville:     'oakville',
  calistoga:    'calistoga',
  'downtown-napa': 'napa',
};

function cityKey(city) {
  if (!city) return null;
  return city.toLowerCase().replace(/\./g, '').trim();
}

// Address → city substring (some rows have city field mismatched)
function addressCity(address) {
  if (!address) return null;
  // Parse ", City, CA" pattern
  const m = address.match(/,\s*([^,]+?),\s*CA\b/i);
  return m ? cityKey(m[1]) : null;
}

const issues = {
  impossible: [],
  drift: [],
  missing: [],
};

function auditRow(kind, row) {
  const turso = row.sub_region_slug;
  const rowCity = cityKey(row.city) || addressCity(row.address);

  // 1. Impossible: city is a specific town, sub-region is a different specific town
  if (rowCity && turso) {
    const allowed = CITY_CONSTRAINT[rowCity];
    if (allowed && !allowed.includes(turso)) {
      issues.impossible.push({
        kind,
        slug: row.slug,
        name: row.name,
        city: row.city,
        address: row.address,
        turso,
        rowCity,
        allowed,
        reason: `City "${rowCity}" must be in sub-region ${allowed.join(' or ')}, got ${turso}`,
      });
      return;
    }
    // Also impossible: sub-region is a specific town, city is a different specific town
    const subregionTown = SUBREGION_TOWN[turso];
    if (subregionTown && rowCity !== subregionTown && CITY_CONSTRAINT[rowCity]) {
      issues.impossible.push({
        kind,
        slug: row.slug,
        name: row.name,
        city: row.city,
        address: row.address,
        turso,
        rowCity,
        reason: `Sub-region "${turso}" = town ${subregionTown}, but address is in ${rowCity}`,
      });
      return;
    }
  }

  // 2. Drift vs seed (only warn; might be intentional correction)
  const seedRow = seedBySlug.get(row.slug);
  if (seedRow && seedRow.subRegion && turso && seedRow.subRegion !== turso) {
    issues.drift.push({
      kind,
      slug: row.slug,
      name: row.name,
      city: row.city,
      address: row.address,
      turso,
      seed: seedRow.subRegion,
    });
  }

  // 3. Missing
  if (!turso) {
    issues.missing.push({
      kind,
      slug: row.slug,
      name: row.name,
      city: row.city,
      address: row.address,
    });
  }
}

for (const row of wineries.rows) auditRow('winery', row);
for (const row of accommodations.rows) auditRow('accommodation', row);

console.log('='.repeat(80));
console.log('AUDIT: sub-region assignments');
console.log('='.repeat(80));
console.log(`Wineries:       ${wineries.rows.length}`);
console.log(`Accommodations: ${accommodations.rows.length}`);
console.log('');
console.log(`IMPOSSIBLE  (city ≠ sub-region town): ${issues.impossible.length}`);
console.log(`SEED DRIFT  (Turso ≠ seed, review):   ${issues.drift.length}`);
console.log(`MISSING     (no sub-region):          ${issues.missing.length}`);
console.log('');

function printList(title, rows, formatter) {
  if (!rows.length) return;
  console.log('-'.repeat(80));
  console.log(title);
  console.log('-'.repeat(80));
  for (const r of rows) {
    console.log(`  [${r.kind}] ${r.name}`);
    console.log(`    slug:    ${r.slug}`);
    console.log(`    address: ${r.address || '(none)'}`);
    console.log(`    city:    ${r.city || '(none)'}`);
    console.log(`    ${formatter(r)}`);
    console.log('');
  }
}

printList(
  'IMPOSSIBLE — city in address contradicts sub-region (FIX THESE)',
  issues.impossible,
  (r) => `REASON: ${r.reason}`,
);
printList(
  'SEED DRIFT — review whether Turso or seed is correct',
  issues.drift,
  (r) => `Turso=${r.turso} | Seed=${r.seed}`,
);
printList(
  'MISSING — no sub-region assigned (FIX THESE)',
  issues.missing,
  () => '(none)',
);

process.exit(0);
