/**
 * Fixes sub-region assignments:
 *   1. Corrects 2 confirmed-wrong wineries.
 *   2. Backfills missing sub-regions for 42 accommodations.
 *
 * Each update is scoped by slug. Prints before/after verification.
 * Skips Sonoma Coast Vineyards (Bodega Bay) — no matching sub-region exists.
 */
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '/Users/michaelchen/Claude/napa-winery-search/.env.local' });

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

// Build slug → id lookup for sub-regions
const srRes = await client.execute({ sql: 'SELECT id, slug FROM sub_regions' });
const srId = new Map(srRes.rows.map((r) => [r.slug, r.id]));

function getSrId(slug) {
  const id = srId.get(slug);
  if (!id) throw new Error(`Unknown sub-region slug: ${slug}`);
  return id;
}

// --- 1. WINERY CORRECTIONS ---
const WINERY_FIXES = [
  // [slug, new_sub_region_slug, rationale]
  ['the-duckhorn-collection-at-paraduxx', 'stags-leap-district',
    '7257 Silverado Trail, Napa — Stags Leap District AVA (was yountville)'],
];

// --- 2. ACCOMMODATION CORRECTIONS (Resort at Sonoma County was non-null, fix) ---
const ACCOMMODATION_FIXES = [
  ['resort-at-sonoma-county', 'russian-river-valley',
    'Windsor is in Russian River Valley (was sonoma-valley)'],
];

// --- 3. ACCOMMODATION BACKFILLS (sub_region_id was NULL) ---
// Picks based on address; downtown-Healdsburg hotels default to russian-river-valley
// (Healdsburg plaza sits in the RRV AVA; no Healdsburg-town sub-region exists).
const ACCOMMODATION_BACKFILLS = [
  // Napa side
  ['andaz-napa-by-hyatt',                          'downtown-napa'],
  ['archer-hotel-napa',                            'downtown-napa'],
  ['candlelight-inn-napa-valley',                  'downtown-napa'],
  ['carneros-resort-and-spa',                      'carneros-napa'],
  ['grand-reserve-meritage-resort',                'carneros-napa'],
  ['hotel-napa-valley-an-ascend-collection-hotel', 'downtown-napa'],
  ['milliken-creek-inn',                           'downtown-napa'],
  ['napa-river-inn',                               'downtown-napa'],
  ['r-inn-napa',                                   'downtown-napa'],
  ['river-terrace-inn',                            'downtown-napa'],
  ['senza-hotel',                                  'oak-knoll-district'], // 4066 Howard Ln
  ['silverado-resort',                             'atlas-peak'],         // 1600 Atlas Peak Rd
  ['stanly-ranch-auberge-collection',              'carneros-napa'],      // Stanly Crossroad
  ['sttupa-estate-napa-valley',                    'stags-leap-district'],// 6380 Silverado Trail
  ['the-cottages-of-napa-valley',                  'oak-knoll-district'], // Darms Ln
  ['the-george',                                   'downtown-napa'],
  ['the-meritage-resort-and-spa',                  'carneros-napa'],
  ['the-setting-inn-napa-valley',                  'downtown-napa'],
  ['the-westin-verasa-napa',                       'downtown-napa'],
  ['vino-bello-resort',                            'carneros-napa'],
  ['vista-collina-resort',                         'carneros-napa'],
  ['white-house-napa',                             'downtown-napa'],

  // Sonoma side — downtown Healdsburg → russian-river-valley (no Healdsburg sub-region)
  ['27-north',                                     'russian-river-valley'],
  ['appellation-healdsburg',                       'russian-river-valley'],
  ['bella-luna-inn',                               'russian-river-valley'],
  ['boho-manor',                                   'russian-river-valley'], // Monte Rio
  ['calderwood-inn',                               'russian-river-valley'],
  ['camellia-inn',                                 'russian-river-valley'],
  ['duchamp-healdsburg',                           'russian-river-valley'],
  ['grape-leaf-inn',                               'russian-river-valley'],
  ['harmon-guest-house',                           'russian-river-valley'],
  ['healdsburg-inn-a-four-sisters-inn',            'russian-river-valley'],
  ['hotel-healdsburg',                             'russian-river-valley'],
  ['hotel-trio-healdsburg',                        'russian-river-valley'],
  ['inn-on-the-russian-river',                     'russian-river-valley'], // Monte Rio
  ['johnsons-beach-cabins-and-campground',         'russian-river-valley'], // Guerneville
  ['montage-healdsburg',                           'russian-river-valley'],
  ['singlethread-farm-restaurant-inn',             'russian-river-valley'],
  ['the-madrona',                                  'russian-river-valley'], // Westside Rd = RRV AVA
  ['two-thirty-five-luxury-suites',                'russian-river-valley'],
  ['wildhaven-sonoma-glamping',                    'alexander-valley'],    // Alexander Valley Rd
  ['h2hotel',                                      'russian-river-valley'],
];

// --- RUN ---
let updateCount = 0;

async function applyFix(table, fixes, label) {
  console.log('');
  console.log('='.repeat(80));
  console.log(`${label}: ${fixes.length} update${fixes.length === 1 ? '' : 's'}`);
  console.log('='.repeat(80));
  for (const [slug, targetSlug, note] of fixes) {
    const srIdVal = getSrId(targetSlug);
    // before
    const before = await client.execute({
      sql: `SELECT t.slug, t.name, t.city, t.address, sr.slug AS sub_region_slug
            FROM ${table} t LEFT JOIN sub_regions sr ON sr.id = t.sub_region_id
            WHERE t.slug = ?`,
      args: [slug],
    });
    if (before.rows.length === 0) {
      console.log(`  SKIP  ${slug} — not found`);
      continue;
    }
    const b = before.rows[0];
    const res = await client.execute({
      sql: `UPDATE ${table} SET sub_region_id = ? WHERE slug = ?`,
      args: [srIdVal, slug],
    });
    const after = await client.execute({
      sql: `SELECT sr.slug AS sub_region_slug
            FROM ${table} t LEFT JOIN sub_regions sr ON sr.id = t.sub_region_id
            WHERE t.slug = ?`,
      args: [slug],
    });
    const a = after.rows[0];
    updateCount += res.rowsAffected;
    const noteStr = note ? `  — ${note}` : '';
    console.log(`  ✓ ${b.name}`);
    console.log(`      ${b.sub_region_slug || '(null)'} → ${a.sub_region_slug}${noteStr}`);
  }
}

await applyFix('wineries', WINERY_FIXES, '1. Winery corrections');
await applyFix('accommodations', ACCOMMODATION_FIXES, '2. Accommodation corrections');
await applyFix('accommodations', ACCOMMODATION_BACKFILLS, '3. Accommodation backfills');

console.log('');
console.log('='.repeat(80));
console.log(`TOTAL rows updated: ${updateCount}`);
console.log('='.repeat(80));
console.log('');
console.log('NOTE: 1 winery skipped — Sonoma Coast Vineyards (Bodega Bay).');
console.log('      No sonoma-coast sub-region exists; needs a new row or different handling.');

process.exit(0);
