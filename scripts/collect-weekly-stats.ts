/**
 * Weekly analytics collector — auto-fills the "Weekly Stats Review Ritual"
 * paste template (see CLAUDE.md) from the sources we can reach programmatically:
 *
 *   • Google Search Console  (28d)  — read from the Turso `gsc_daily_queries`
 *     table that the daily /api/cron/gsc-import job already populates. No live
 *     GSC API call needed here.
 *   • Admin dashboard        (30d)  — read from Turso: outbound_clicks,
 *     email_subscribers.  Mirrors /nalaadmin/analytics.
 *   • Cloudflare Web Analytics (7d) — read from the Cloudflare GraphQL
 *     Analytics API (RUM dataset). Requires CLOUDFLARE_API_TOKEN +
 *     CLOUDFLARE_ZONE_TAG in .env.local. Degrades gracefully if absent.
 *
 * Vercel Web Analytics is intentionally omitted — it has no official API and
 * Cloudflare measures the same visitors/pageviews.
 *
 * Run:   npx tsx scripts/collect-weekly-stats.ts
 *        npx tsx scripts/collect-weekly-stats.ts --json   (machine-readable)
 *
 * READ-ONLY. Never writes to the DB or any external system.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@libsql/client";

const asJson = process.argv.includes("--json");

const db = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
});

// --- date helpers (compute cutoffs in JS so formats match stored values) ---
const now = new Date();
const isoDaysAgo = (n: number) =>
  new Date(now.getTime() - n * 86_400_000).toISOString(); // matches created_at (ISO)
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const ymdDaysAgo = (n: number) =>
  ymd(new Date(now.getTime() - n * 86_400_000)); // matches gsc_daily_queries.date
const num = (v: unknown) => (v == null ? 0 : Number(v));
const pct = (n: number, d: number) => (d ? (n / d) * 100 : 0);

type Row = Record<string, unknown>;
async function q(sql: string, args: unknown[] = []): Promise<Row[]> {
  const rs = await db.execute({ sql, args: args as never[] });
  return rs.rows as unknown as Row[];
}

// ============================ GSC (28 days) ============================
async function gsc() {
  const since = ymdDaysAgo(28);
  const [tot] = await q(
    `SELECT SUM(impressions) imp, SUM(clicks) clk,
            CASE WHEN SUM(impressions) > 0
                 THEN SUM(position * impressions) * 1.0 / SUM(impressions) END pos,
            COUNT(DISTINCT page) pages
       FROM gsc_daily_queries WHERE date >= ?`,
    [since]
  );
  const topQueries = await q(
    `SELECT query, SUM(clicks) c, SUM(impressions) i
       FROM gsc_daily_queries WHERE date >= ?
       GROUP BY query ORDER BY c DESC, i DESC LIMIT 5`,
    [since]
  );
  const topPages = await q(
    `SELECT page, SUM(clicks) c, SUM(impressions) i
       FROM gsc_daily_queries WHERE date >= ?
       GROUP BY page ORDER BY c DESC, i DESC LIMIT 5`,
    [since]
  );
  const imp = num(tot?.imp);
  const clk = num(tot?.clk);
  return {
    since,
    impressions: imp,
    clicks: clk,
    ctr: pct(clk, imp),
    avgPosition: tot?.pos == null ? null : Number(tot.pos),
    pagesWithImpressions: num(tot?.pages),
    topQueries: topQueries.map((r) => ({
      query: String(r.query),
      clicks: num(r.c),
      impressions: num(r.i),
    })),
    topPages: topPages.map((r) => ({
      page: String(r.page),
      clicks: num(r.c),
      impressions: num(r.i),
    })),
  };
}

// ======================= Admin dashboard (30 days) =======================
async function admin() {
  const since = isoDaysAgo(30);
  const [tot] = await q(
    `SELECT COUNT(*) n FROM outbound_clicks WHERE created_at >= ?`,
    [since]
  );
  const byType = await q(
    `SELECT click_type, COUNT(*) n FROM outbound_clicks
      WHERE created_at >= ? GROUP BY click_type ORDER BY n DESC`,
    [since]
  );
  const topWineries = await q(
    `SELECT w.name, COUNT(*) n
       FROM outbound_clicks oc JOIN wineries w ON w.id = oc.winery_id
      WHERE oc.created_at >= ? AND oc.winery_id IS NOT NULL
      GROUP BY oc.winery_id ORDER BY n DESC LIMIT 5`,
    [since]
  );
  const [subs] = await q(
    `SELECT COUNT(*) total,
            SUM(CASE WHEN subscribed_at >= ? THEN 1 ELSE 0 END) recent
       FROM email_subscribers`,
    [since]
  );
  return {
    since,
    totalOutboundClicks: num(tot?.n),
    byType: byType.map((r) => ({ type: String(r.click_type), n: num(r.n) })),
    topWineries: topWineries.map((r) => ({ name: String(r.name), n: num(r.n) })),
    newSubscribers: num(subs?.recent),
    totalSubscribers: num(subs?.total),
  };
}

// ==================== Cloudflare Web Analytics (7 days) ====================
// NOTE: Cloudflare's RUM/Web Analytics dataset (rumPageloadEventsAdaptiveGroups)
// lives under viewer.accounts, NOT viewer.zones — confirmed via schema
// introspection on 2026-07-25 (zone-scoped query returned "unknown field").
// Requires the Cloudflare *Account ID* (dashboard → napasonomaguide.com →
// Overview → right sidebar "API" section → Account ID), not the Zone ID.
// CLOUDFLARE_SITE_TAG is optional — only needed if this Cloudflare account has
// more than one site with a Web Analytics beacon (scopes the query to just
// napasonomaguide.com so numbers from other properties don't blend in).
async function cloudflare() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountTag = process.env.CLOUDFLARE_ACCOUNT_TAG;
  const siteTag = process.env.CLOUDFLARE_SITE_TAG; // optional
  if (!token || !accountTag) {
    return {
      configured: false as const,
      reason: "CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_TAG not set in .env.local (Account ID, not Zone ID — see Cloudflare dashboard Overview page)",
    };
  }
  const sinceDate = ymdDaysAgo(7);
  const filter = (extra?: string) => {
    const parts = [`date_geq: "${sinceDate}"`];
    if (siteTag) parts.push(`siteTag: "${siteTag}"`);
    if (extra) parts.push(extra);
    return `{ ${parts.join(", ")} }`;
  };
  const query = `{
    viewer {
      accounts(filter: { accountTag: "${accountTag}" }) {
        totals: rumPageloadEventsAdaptiveGroups(limit: 1, filter: ${filter()}) { count sum { visits } }
        pages: rumPageloadEventsAdaptiveGroups(limit: 5, filter: ${filter()}, orderBy: [count_DESC]) { count dimensions { requestPath } }
        referers: rumPageloadEventsAdaptiveGroups(limit: 6, filter: ${filter(`refererHost_neq: ""`)}, orderBy: [count_DESC]) { count dimensions { refererHost } }
        countries: rumPageloadEventsAdaptiveGroups(limit: 5, filter: ${filter()}, orderBy: [count_DESC]) { count dimensions { countryName } }
      }
    }
  }`;
  try {
    const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });
    const json = (await res.json()) as {
      data?: { viewer?: { accounts?: Array<Record<string, any>> } };
      errors?: Array<{ message: string }>;
    };
    if (json.errors?.length) {
      return { configured: true as const, error: json.errors.map((e) => e.message).join("; ") };
    }
    const acct = json.data?.viewer?.accounts?.[0];
    if (!acct) return { configured: true as const, error: "No account returned — check CLOUDFLARE_ACCOUNT_TAG" };
    const totals = acct.totals?.[0];
    return {
      configured: true as const,
      since: sinceDate,
      pageviews: num(totals?.count),
      visits: num(totals?.sum?.visits),
      topPages: (acct.pages ?? []).map((r: any) => ({
        path: r.dimensions?.requestPath ?? "(unknown)",
        views: num(r.count),
      })),
      topReferrers: (acct.referers ?? []).map((r: any) => ({
        host: r.dimensions?.refererHost ?? "(direct)",
        views: num(r.count),
      })),
      topCountries: (acct.countries ?? []).map((r: any) => ({
        country: r.dimensions?.countryName ?? "(unknown)",
        views: num(r.count),
      })),
    };
  } catch (e) {
    return { configured: true as const, error: e instanceof Error ? e.message : String(e) };
  }
}

// ================================ render ================================
function fmt(n: number) {
  return n.toLocaleString("en-US");
}
function renderTemplate(g: any, a: any, cf: any) {
  const end = ymd(now);
  const start = ymd(new Date(now.getTime() - 6 * 86_400_000));
  const L: string[] = [];
  L.push(`Week of: ${start} to ${end}`);
  L.push(`(auto-generated ${now.toISOString()} — READ-ONLY pull)`);
  L.push("");

  L.push("CLOUDFLARE WEB ANALYTICS (last 7 days)  [primary traffic source]");
  if (!cf.configured) {
    L.push(`- ⚠️  Not configured: ${cf.reason}`);
    L.push("- (see the Cloudflare token setup note; falls back to manual paste until then)");
  } else if (cf.error) {
    L.push(`- ⚠️  Cloudflare query error: ${cf.error}`);
  } else {
    L.push(`- Unique visitors (visits): ${fmt(cf.visits)}`);
    L.push(`- Pageviews: ${fmt(cf.pageviews)}`);
    L.push(`- Top 5 pages: ${cf.topPages.map((p: any) => `${p.path} (${p.views})`).join(", ") || "—"}`);
    L.push(`- Top referrers: ${cf.topReferrers.map((r: any) => `${r.host} (${r.views})`).join(", ") || "—"}`);
    L.push(`- Top countries: ${cf.topCountries.map((c: any) => `${c.country} (${c.views})`).join(", ") || "—"}`);
  }
  L.push("");

  L.push("GOOGLE SEARCH CONSOLE (last 28 days)  [from gsc_daily_queries]");
  L.push(`- Impressions: ${fmt(g.impressions)}`);
  L.push(`- Clicks: ${fmt(g.clicks)}`);
  L.push(`- Site-wide CTR: ${g.ctr.toFixed(3)}%`);
  L.push(`- Avg position: ${g.avgPosition == null ? "—" : g.avgPosition.toFixed(1)} (impression-weighted approx.)`);
  L.push(`- Pages with impressions: ${fmt(g.pagesWithImpressions)}  (proxy for "visible in Google"; exact indexed-of-642 count still needs the GSC UI)`);
  L.push(`- Top 5 queries: ${g.topQueries.map((x: any) => `"${x.query}" (${x.clicks}c/${x.impressions}i)`).join(", ") || "—"}`);
  L.push(`- Top 5 pages: ${g.topPages.map((x: any) => `${x.page} (${x.clicks}c/${x.impressions}i)`).join(", ") || "—"}`);
  L.push("- GSC caveat: last 2–3 days are incomplete due to data lag");
  L.push("");

  L.push("ADMIN DASHBOARD /nalaadmin/analytics (last 30 days)  [from Turso]");
  L.push(`- Total outbound clicks: ${fmt(a.totalOutboundClicks)}`);
  L.push(`- Clicks by type: ${a.byType.map((t: any) => `${t.type} ${t.n}`).join(", ") || "—"}`);
  L.push(`- Top 5 wineries by clicks: ${a.topWineries.map((w: any) => `${w.name} (${w.n})`).join(", ") || "—"}`);
  L.push(`- New email subscribers: ${fmt(a.newSubscribers)} (total: ${fmt(a.totalSubscribers)})`);
  L.push("");
  L.push("NOTE: Vercel Web Analytics intentionally omitted (no official API; Cloudflare covers the same visitors/pageviews).");
  return L.join("\n");
}

(async () => {
  const [g, a, cf] = await Promise.all([gsc(), admin(), cloudflare()]);
  if (asJson) {
    console.log(JSON.stringify({ generatedAt: now.toISOString(), gsc: g, admin: a, cloudflare: cf }, null, 2));
  } else {
    console.log(renderTemplate(g, a, cf));
  }
  process.exit(0);
})().catch((e) => {
  console.error("collect-weekly-stats failed:", e);
  process.exit(1);
});
