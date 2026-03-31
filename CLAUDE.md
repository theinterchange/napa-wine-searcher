# Napa Sonoma Guide — Project Context

## What This Is
Napa/Sonoma winery discovery platform. 225+ wineries, trip planning, day trips, journal, accommodations. Deployed at napasonomaguide.com. 97+ commits.

## Owner
Michael Chen — PM at DoorDash, building passive income projects with Claude Code. This is his #2 priority passive income project.

## Revenue Status
- Monetization code is BUILT but NOT activated:
  - Wine.com affiliate: ❌ not applied yet
  - NapaCabs affiliate: ❌ not applied yet
  - Stay22 hotel booking widget: ❌ not applied yet
  - Google Adsense: ❌ not applied yet
  - Click tracking: ✅ live (outbound_clicks table)
  - Email list: ✅ 128 subscribers
  - Affiliate link builders: ✅ coded in `/src/lib/affiliate.ts`
- Plausible analytics: configured but env var NOT set

## Immediate Priorities (Week 1)
1. **Enable Plausible analytics** — set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` env var. Need real traffic data. 5 min.
2. **Submit sitemap to Google Search Console.** 15 min.
3. **Michael applies for Wine.com affiliate** (manual, 15 min).

## PEAK SEASON SPRINT — 5 Weeks to May (BottleRock May 22-24)

People are planning Napa trips RIGHT NOW. April is peak booking month for May-June travel. The 642 pages need to be indexed and seasonal content needs to be live before May.

**Week 1 (now): Code fixes in Claude Code**
- Fix H1 tag on homepage
- Verify SSR on all page types
- Add Winery + Accommodation structured data (JSON-LD)
- Improve internal linking (winery → guides → accommodations)
- Set Plausible analytics env var

**Week 2: Seasonal content blitz (Claude Code drafts, Michael reviews)**
- "BottleRock 2026 Winery Guide: Best Tastings Near the Festival"
- "Memorial Day Weekend in Napa: Complete Wine Tasting Itinerary"
- "Best Napa Wineries to Visit in Summer 2026"
- "Where to Stay for BottleRock 2026: Hotels Near Napa Valley Expo"
- "First Time in Napa? 2026 Complete Planning Guide"
These target year-specific keywords with LOW competition. Each ~30 min with Claude Code.

**Week 3: Accommodation push**
- Activate Stay22 affiliate (apply NOW, takes days/weeks)
- Add "Book Now" CTAs to all 127 accommodation pages
- Create 3 "Where to Stay" guides (Yountville, St. Helena, Healdsburg)
- Cross-link accommodations from winery pages

**Week 4: Email + backlinks**
- "Peak Season Preview" email to 128 subscribers
- Submit to wine/travel directories (5-10 backlinks)
- **Outreach to 5-10 wineries: "Link to your listing on our site?"** ← highest-value backlinks
- Apply for Adsense

**Week 5: Pre-season check**
- Check GSC indexing (expect 100-300+ pages)
- Check Plausible traffic data
- Publish "May in Napa Valley" guide
- Verify all affiliate links tracking
- Send "Memorial Day Planning" email

## ⚠️ CRITICAL: Only 7 of 642 Pages Indexed by Google (as of March 31, 2026)
Google has indexed the homepage, 2 region pages, a map page, 2 guide pages, and 1 winery — that's it. 235 winery pages, 148 guides, 127 accommodation pages are invisible. GSC sitemap submitted 3/31. Fixes needed:
1. **Add H1 tag to homepage** — currently missing, uses h2 only. Critical SEO signal. 5-minute fix.
2. **Verify SSR** — test with `curl -s https://www.napasonomaguide.com/wineries/silver-oak | grep -i "silver oak"`. If content appears, SSR works. If not, pages need server-rendering fix.
3. **Add LocalBusiness/Winery structured data (JSON-LD)** to individual winery pages — enables rich search results.
4. **Enable Plausible analytics** — set NEXT_PUBLIC_PLAUSIBLE_DOMAIN env var in Vercel. Need traffic data.
5. **Build 5-10 backlinks** — wine directories, Napa tourism sites, TripAdvisor listing, LinkedIn profile.

## Revenue Target (honest)
- $30-100/month by September 2026 (Adsense + early affiliate clicks if approved)
- $100-300/month by March 2027 (SEO compounding + peak season)
- Peak season: May-October (revenue will be lumpy and seasonal)

## Critical Shortcomings to Keep in Mind
1. **NO ANALYTICS ENABLED.** Cannot make strategy decisions without knowing actual traffic. Enable Plausible FIRST before any other optimization. If traffic is <1K/month, the affiliate strategy needs rethinking.
2. **Wine affiliate commissions are low.** 5-8% on $60-80 orders = $3-6/sale. Need 80+ sales/month for $500/month. That requires massive, sustained traffic.
3. **Seasonal revenue.** Napa tourism peaks May-Oct. Plan for $0-low revenue Nov-March. Don't make commitments based on peak-season numbers.
4. **128 email subscribers is small.** At 20% open rate × 2% click rate = 0.5 affiliate clicks per send. Build the list before investing in email monetization.
5. **Adsense is realistic but small.** At $1-5 per 1,000 pageviews, expect $10-50/month if traffic is 10K pageviews/month. Supplemental, not transformative.
6. **Don't spend money on paid traffic here.** Wine country keywords are expensive. Rely on organic SEO from the 225+ content pages. Focus ad budget on Encore instead.

## Sponsorship Revenue Roadmap (B2B — highest ceiling)

**Not yet — need traffic data first. Target: pitch wineries September-October 2026 after summer proves traffic.**

Potential: 5-15 wineries at $75-150/month = $375-2,250/month. This is likely bigger than affiliates + Adsense combined.

**Build now (so it's ready when we pitch):**
1. Add "Featured" badge system + enhanced listing capability (more photos, tasting menu detail, video embed, priority placement). Don't sell it yet — have it code-ready.
2. Track per-winery pageviews (Plausible or outbound_clicks table). When pitching: "Your listing got 200 views last month from people planning Napa trips."
3. Week 4 winery outreach for backlinks = relationship building. These become warm leads for sponsorship in September.

**The pitch (September 2026):**
"Hi [Winery], since we connected in April, your listing on Napa Sonoma Guide has received [X] views from wine country visitors. We're now offering Featured Listings — priority placement in search, enhanced photos, inclusion in our weekly email to [X] subscribers, and a 'Featured Winery' badge. $100/month, cancel anytime. Want to try it for the fall season?"

**Pricing tiers to build:**
- Free: current listing (name, hours, basic info, 1-2 photos)
- Featured ($100/mo): priority placement, enhanced photos (5-10), tasting menu, video, "Featured" badge, included in 1 email/month
- Premium ($200/mo): everything above + dedicated blog post/guide feature, social media mention, homepage spotlight rotation

## Build Principles
- Enable analytics before anything else — decisions need data
- Every feature should drive traffic (SEO) or monetize existing traffic (affiliate CTAs, email capture)
- Content is king for this site — blog posts, guides, seasonal content drive organic traffic
- Don't over-build features — the product is mature. Focus on traffic and monetization.
- Build sponsorship infrastructure NOW so it's ready when traffic proves the model

## Master Strategy
Full financial plan and passive income strategy is in: `/Users/michaelchen/Claude/mc-portfolio-analysis/`

## Tech Stack
Next.js 16, TypeScript, Tailwind, Drizzle ORM, Turso/libSQL, Google Maps/Places API, Resend, Plausible Analytics, Vercel

## Key Files
- `src/lib/affiliate.ts` — affiliate URL builders (Wine.com, NapaCabs, hotel booking)
- `src/lib/track-click.ts` — outbound click tracking
- `src/components/monetization/` — monetization UI components
- `src/db/schema/monetization.ts` — monetization tables
- `src/app/api/subscribe/` — email capture endpoint
- `src/app/api/clicks/` — click tracking endpoint
