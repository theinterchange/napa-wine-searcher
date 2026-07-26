import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Weekly analytics report — server-side collection that runs on Vercel (which,
 * unlike a laptop or a Cowork sandbox, can always reach Turso + Cloudflare).
 *
 * Assembles the "Weekly Stats Review Ritual" numbers (see CLAUDE.md) from:
 *   • GSC (28d)        — Turso gsc_daily_queries (populated by /api/cron/gsc-import)
 *   • Admin (30d)      — Turso outbound_clicks + email_subscribers
 *   • Cloudflare (7d)  — Cloudflare GraphQL Analytics API (RUM dataset)
 * Vercel Web Analytics is intentionally omitted (no official API).
 *
 * Behavior:
 *   • On the weekly Vercel Cron run, emails the filled template to ADMIN_EMAIL
 *     via Resend (so you have the numbers even if nothing else runs).
 *   • ?format=text  → returns the ready-to-paste template as text/plain
 *     (this is what the weekly Cowork analysis task fetches).
 *   • ?format=json  → returns structured JSON.
 *
 * READ-ONLY: never writes to the DB.
 *
 * Auth: Vercel Cron header, OR  Authorization: Bearer <CRON_SECRET>,
 *       OR  ?token=<CRON_SECRET>  (so the Cowork task can WebFetch it).
 */

const num = (v: unknown) => (v == null ? 0 : Number(v));
const pct = (n: number, d: number) => (d ? (n / d) * 100 : 0);
const fmt = (n: number) => n.toLocaleString("en-US");
const ymd = (d: Date) => d.toISOString().slice(0, 10);

function isAuthorized(req: NextRequest): boolean {
  if (req.headers.get("x-vercel-cron")) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (req.headers.get("authorization") === `Bearer ${secret}`) return true;
  return req.nextUrl.searchParams.get("token") === secret;
}

async function collectGsc(now: Date) {
  const since = ymd(new Date(now.getTime() - 28 * 86_400_000));
  const tot = (await db.get(sql`
    SELECT SUM(impressions) imp, SUM(clicks) clk,
           CASE WHEN SUM(impressions) > 0
                THEN SUM(position * impressions) * 1.0 / SUM(impressions) END pos,
           COUNT(DISTINCT page) pages
      FROM gsc_daily_queries WHERE date >= ${since}`)) as any;
  const topQueries = (await db.all(sql`
    SELECT query, SUM(clicks) c, SUM(impressions) i
      FROM gsc_daily_queries WHERE date >= ${since}
      GROUP BY query ORDER BY c DESC, i DESC LIMIT 5`)) as any[];
  const topPages = (await db.all(sql`
    SELECT page, SUM(clicks) c, SUM(impressions) i
      FROM gsc_daily_queries WHERE date >= ${since}
      GROUP BY page ORDER BY c DESC, i DESC LIMIT 5`)) as any[];
  const imp = num(tot?.imp), clk = num(tot?.clk);
  return {
    since, impressions: imp, clicks: clk, ctr: pct(clk, imp),
    avgPosition: tot?.pos == null ? null : Number(tot.pos),
    pagesWithImpressions: num(tot?.pages),
    topQueries: topQueries.map((r) => ({ query: String(r.query), clicks: num(r.c), impressions: num(r.i) })),
    topPages: topPages.map((r) => ({ page: String(r.page), clicks: num(r.c), impressions: num(r.i) })),
  };
}

async function collectAdmin(now: Date) {
  const since = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  const tot = (await db.get(sql`SELECT COUNT(*) n FROM outbound_clicks WHERE created_at >= ${since}`)) as any;
  const byType = (await db.all(sql`
    SELECT click_type, COUNT(*) n FROM outbound_clicks
     WHERE created_at >= ${since} GROUP BY click_type ORDER BY n DESC`)) as any[];
  const topWineries = (await db.all(sql`
    SELECT w.name, COUNT(*) n FROM outbound_clicks oc JOIN wineries w ON w.id = oc.winery_id
     WHERE oc.created_at >= ${since} AND oc.winery_id IS NOT NULL
     GROUP BY oc.winery_id ORDER BY n DESC LIMIT 5`)) as any[];
  const subs = (await db.get(sql`
    SELECT COUNT(*) total,
           SUM(CASE WHEN subscribed_at >= ${since} THEN 1 ELSE 0 END) recent
      FROM email_subscribers`)) as any;
  return {
    since,
    totalOutboundClicks: num(tot?.n),
    byType: byType.map((r) => ({ type: String(r.click_type), n: num(r.n) })),
    topWineries: topWineries.map((r) => ({ name: String(r.name), n: num(r.n) })),
    newSubscribers: num(subs?.recent),
    totalSubscribers: num(subs?.total),
  };
}

// NOTE: Cloudflare's RUM/Web Analytics dataset lives under viewer.accounts,
// NOT viewer.zones (confirmed via schema introspection 2026-07-25). Needs the
// Cloudflare *Account ID* (dashboard → napasonomaguide.com → Overview →
// right sidebar "API" section → Account ID), not the Zone ID.
// CLOUDFLARE_SITE_TAG is optional — only set it if this Cloudflare account
// has more than one site with a Web Analytics beacon.
async function collectCloudflare(now: Date) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountTag = process.env.CLOUDFLARE_ACCOUNT_TAG;
  const siteTag = process.env.CLOUDFLARE_SITE_TAG;
  if (!token || !accountTag) {
    return { configured: false as const, reason: "CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_TAG not set (Account ID, not Zone ID)" };
  }
  const since = ymd(new Date(now.getTime() - 7 * 86_400_000));
  const filter = (extra?: string) => {
    const parts = [`date_geq: "${since}"`];
    if (siteTag) parts.push(`siteTag: "${siteTag}"`);
    if (extra) parts.push(extra);
    return `{ ${parts.join(", ")} }`;
  };
  const query = `{
    viewer { accounts(filter: { accountTag: "${accountTag}" }) {
      totals: rumPageloadEventsAdaptiveGroups(limit: 1, filter: ${filter()}) { count sum { visits } }
      pages: rumPageloadEventsAdaptiveGroups(limit: 5, filter: ${filter()}, orderBy: [count_DESC]) { count dimensions { requestPath } }
      referers: rumPageloadEventsAdaptiveGroups(limit: 6, filter: ${filter(`refererHost_neq: ""`)}, orderBy: [count_DESC]) { count dimensions { refererHost } }
      countries: rumPageloadEventsAdaptiveGroups(limit: 5, filter: ${filter()}, orderBy: [count_DESC]) { count dimensions { countryName } }
    } }
  }`;
  try {
    const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const j = (await res.json()) as any;
    if (j.errors?.length) return { configured: true as const, error: j.errors.map((e: any) => e.message).join("; ") };
    const acct = j.data?.viewer?.accounts?.[0];
    if (!acct) return { configured: true as const, error: "No account returned — check CLOUDFLARE_ACCOUNT_TAG" };
    const t = acct.totals?.[0];
    return {
      configured: true as const, since,
      pageviews: num(t?.count), visits: num(t?.sum?.visits),
      topPages: (acct.pages ?? []).map((r: any) => ({ path: r.dimensions?.requestPath ?? "(unknown)", views: num(r.count) })),
      topReferrers: (acct.referers ?? []).map((r: any) => ({ host: r.dimensions?.refererHost ?? "(direct)", views: num(r.count) })),
      topCountries: (acct.countries ?? []).map((r: any) => ({ country: r.dimensions?.countryName ?? "(unknown)", views: num(r.count) })),
    };
  } catch (e) {
    return { configured: true as const, error: e instanceof Error ? e.message : String(e) };
  }
}

function renderTemplate(now: Date, g: any, a: any, cf: any) {
  const end = ymd(now), start = ymd(new Date(now.getTime() - 6 * 86_400_000));
  const L: string[] = [];
  L.push(`Week of: ${start} to ${end}`, `(auto-generated ${now.toISOString()} — READ-ONLY pull)`, "");
  L.push("CLOUDFLARE WEB ANALYTICS (last 7 days)  [primary traffic source]");
  if (!cf.configured) L.push(`- ⚠️  Not configured: ${cf.reason}`);
  else if (cf.error) L.push(`- ⚠️  Cloudflare query error: ${cf.error}`);
  else {
    L.push(`- Unique visitors (visits): ${fmt(cf.visits)}`);
    L.push(`- Pageviews: ${fmt(cf.pageviews)}`);
    L.push(`- Top 5 pages: ${cf.topPages.map((p: any) => `${p.path} (${p.views})`).join(", ") || "—"}`);
    L.push(`- Top referrers: ${cf.topReferrers.map((r: any) => `${r.host} (${r.views})`).join(", ") || "—"}`);
    L.push(`- Top countries: ${cf.topCountries.map((c: any) => `${c.country} (${c.views})`).join(", ") || "—"}`);
  }
  L.push("");
  L.push("GOOGLE SEARCH CONSOLE (last 28 days)  [from gsc_daily_queries]");
  L.push(`- Impressions: ${fmt(g.impressions)}`, `- Clicks: ${fmt(g.clicks)}`, `- Site-wide CTR: ${g.ctr.toFixed(3)}%`);
  L.push(`- Avg position: ${g.avgPosition == null ? "—" : g.avgPosition.toFixed(1)} (impression-weighted approx.)`);
  L.push(`- Pages with impressions: ${fmt(g.pagesWithImpressions)}  (proxy; exact indexed-of-642 still needs GSC UI)`);
  L.push(`- Top 5 queries: ${g.topQueries.map((x: any) => `"${x.query}" (${x.clicks}c/${x.impressions}i)`).join(", ") || "—"}`);
  L.push(`- Top 5 pages: ${g.topPages.map((x: any) => `${x.page} (${x.clicks}c/${x.impressions}i)`).join(", ") || "—"}`);
  L.push("- GSC caveat: last 2–3 days are incomplete due to data lag", "");
  L.push("ADMIN DASHBOARD /nalaadmin/analytics (last 30 days)  [from Turso]");
  L.push(`- Total outbound clicks: ${fmt(a.totalOutboundClicks)}`);
  L.push(`- Clicks by type: ${a.byType.map((t: any) => `${t.type} ${t.n}`).join(", ") || "—"}`);
  L.push(`- Top 5 wineries by clicks: ${a.topWineries.map((w: any) => `${w.name} (${w.n})`).join(", ") || "—"}`);
  L.push(`- New email subscribers: ${fmt(a.newSubscribers)} (total: ${fmt(a.totalSubscribers)})`, "");
  L.push("NOTE: Vercel Web Analytics omitted (no official API; Cloudflare covers visitors/pageviews).");
  return L.join("\n");
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const now = new Date();
  try {
    const [g, a, cf] = await Promise.all([collectGsc(now), collectAdmin(now), collectCloudflare(now)]);
    const text = renderTemplate(now, g, a, cf);

    // Email on the scheduled cron run (or whenever ?email=1 is passed).
    const isCron = !!request.headers.get("x-vercel-cron");
    const wantEmail = isCron || request.nextUrl.searchParams.get("email") === "1";
    let emailed = false;
    if (wantEmail && process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.STATS_EMAIL_FROM || `Napa Sonoma Guide <onboarding@resend.dev>`,
          to: process.env.ADMIN_EMAIL,
          subject: `Weekly analytics — ${ymd(now)}`,
          text,
        });
        emailed = true;
      } catch (e) {
        console.error("weekly-stats email failed:", e);
      }
    }

    const format = request.nextUrl.searchParams.get("format");
    if (format === "json") return NextResponse.json({ generatedAt: now.toISOString(), emailed, gsc: g, admin: a, cloudflare: cf });
    return new NextResponse(text + (emailed ? "\n\n(emailed to ADMIN_EMAIL)" : ""), {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("weekly-stats failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
