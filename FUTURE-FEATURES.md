# Future Features — Napa & Sonoma Winery Search

> Last updated: 2026-02-26
> App: [napa-winery-search.vercel.app](https://napa-winery-search.vercel.app)

## Current State

The app currently has 225+ wineries with Google Places data, wine lists, tasting experiences, an interactive Google Maps view with sub-region color coding and clustering, a side-by-side compare feature (up to 4 wineries), auth-gated favorites and notes, a directory with search and filters (valley, sub-region, price level, rating, reservation required, dog-friendly, picnic-friendly), and static generation of winery detail pages. The stack is Next.js 16 + Drizzle ORM + libSQL (Turso) + NextAuth + Google Maps API, deployed on Vercel.

---

## 1. Data & Ratings

### 1.1 Wine-Searcher Score Overlays

Display aggregated critic scores (Wine Spectator, Robert Parker, James Suckling) on individual wine listings within each winery detail page. Scores appear as badges next to each wine.

- **Effort:** Medium — requires API integration, score normalization across 100-point scales, and a caching layer to stay within rate limits.
- **User Value:** High — critic scores are the single most-requested data point for serious wine buyers.
- **Revenue Potential:** Medium — enables premium tier gating (see Section 8).
- **APIs/Services:** [Wine-Searcher API](https://www.wine-searcher.com/trade/api) (trial key available on request; historically offered ~100 free lookups/day on basic plans). Scores aggregate Wine Spectator, Parker, Suckling, and others. The existing `wineRatings` table in the schema already has `provider`, `score`, `maxScore`, and `criticName` columns — this is ready for multi-source scores.

### 1.2 CellarTracker Community Ratings

Show community-sourced ratings alongside critic scores for a "wisdom of the crowd" perspective. Display average community score + number of tasting notes.

- **Effort:** Medium — CellarTracker does not have a formal public REST API, but supports XML/CSV export via authenticated URLs. Would need to build a server-side fetcher and cache.
- **User Value:** High — CellarTracker has 13M+ reviews and is the most-used community wine database. Many wines from smaller Napa/Sonoma producers have CellarTracker data but no critic coverage.
- **Revenue Potential:** Low — commodity data, better as a free differentiator.
- **APIs/Services:** [CellarTracker](https://www.cellartracker.com/) data export endpoints (XML/CSV via crafted URLs). May require a partnership agreement for commercial use at scale.

### 1.3 Vivino Ratings Integration

Pull Vivino's crowd-sourced ratings (1-5 scale, millions of scans) for wines listed on winery pages. Useful as a "casual drinker" counterpoint to critic scores.

- **Effort:** Medium — Vivino has undocumented API endpoints (`/api/wines/{id}/reviews`) but no official developer program. Alternatively, use [Apify's Vivino scraper](https://apify.com/tropical_quince/vivino-wine-scraper/api) for structured extraction.
- **User Value:** Medium — Vivino is widely known but less trusted by serious collectors than CellarTracker or critic scores.
- **Revenue Potential:** Low.
- **APIs/Services:** Vivino internal API (undocumented, fragile), Apify scrapers (~$5/1000 results). Risk of breaking changes.

### 1.4 Price Comparison Across Retailers

For each wine on a winery detail page, show where it can be purchased online and at what price — highlighting whether the winery's direct price is competitive.

- **Effort:** High — requires matching wine names/vintages to external databases (fuzzy matching on wine names is notoriously hard).
- **User Value:** High — visitors often want to buy wines they tasted, and knowing price context is valuable.
- **Revenue Potential:** High — natural affiliate revenue opportunity (see Section 8).
- **APIs/Services:** [Wine-Searcher API](https://www.wine-searcher.com/trade/api) returns retail listings with prices. [WineVybe API](https://winevybe.com/wine-api/) provides pricing data. Wine.com affiliate program for purchase links.

---

## 2. Personalization

### 2.1 Taste Profile Builder

Onboarding quiz or progressive profiling that captures a user's preferences: red vs. white, body preference (light to full), sweetness tolerance, favorite varietals, price range, and experience level (beginner to enthusiast).

- **Effort:** Medium — UI for quiz, schema additions for user preferences, scoring algorithm to rank wineries/wines by profile fit.
- **User Value:** High — the #1 pain point for wine country visitors is "which of 225+ wineries should I actually go to?" A taste profile directly answers this.
- **Revenue Potential:** Medium — premium feature candidate; also improves engagement and return visits.
- **APIs/Services:** Custom implementation. Could use OpenAI (already in `package.json` dependencies) for natural-language preference extraction from free-text input.

### 2.2 Personalized Winery Recommendations

Based on the taste profile, rank and surface "Top 5 wineries for you" on the homepage and directory. Factor in varietals offered, price level, tasting style, and ratings.

- **Effort:** Medium — scoring function against existing data (wine types, price levels, tasting descriptions). No ML needed initially — weighted scoring on known attributes works well.
- **User Value:** High — transforms the app from a directory into a personal concierge.
- **Revenue Potential:** Medium — strong retention driver; can be gated behind auth.
- **APIs/Services:** Custom scoring algorithm. Could enhance later with collaborative filtering once user visit/favorite data accumulates.

### 2.3 Wine Journal / Tasting Notes History

Expand the existing per-winery `wineryNotes` into a structured tasting journal: wine name, date tasted, aroma/palate/finish notes, personal score (1-5), photo upload. Viewable as a chronological feed.

- **Effort:** Medium — new `tasting_journal` table, image upload to Vercel Blob or S3, journal list UI.
- **User Value:** High — replaces the paper cards people scribble on during tastings. Directly useful during a trip.
- **Revenue Potential:** Medium — compelling premium feature that users would pay for, especially with export/share.
- **APIs/Services:** Vercel Blob for image storage. Could offer CSV/PDF export.

### 2.4 Visited Winery Tracking with History

The `visited` table already exists in the schema. Build the UI: a "Mark as Visited" button on winery detail pages, a "My Visits" dashboard showing visited wineries on a map with dates, and visit statistics.

- **Effort:** Low — the database schema is already in place (`visited` table with `visitedDate`). Just needs UI components and a dashboard page.
- **User Value:** Medium — satisfying for repeat visitors who want to track their wine country exploration.
- **Revenue Potential:** Low — better as a free engagement feature.
- **APIs/Services:** None needed beyond existing stack.

---

## 3. Trip Planning

### 3.1 Itinerary Builder with Route Optimization

Drag-and-drop interface where users add wineries to a day plan, then auto-optimize the visit order to minimize driving time. Show estimated drive times between stops and total trip duration.

- **Effort:** High — requires drag-and-drop UI, Google Routes API integration, time-window constraints (winery hours from `hoursJson`), and state management for multi-day trips.
- **User Value:** High — the single most valuable feature for trip planners. Napa/Sonoma geography means route order dramatically affects drive time.
- **Revenue Potential:** High — strong premium feature candidate. Trip planning is the "killer app" for wine country visitors.
- **APIs/Services:** [Google Routes API](https://developers.google.com/maps/documentation/routes) — Compute Routes with waypoint optimization ($10/1000 requests at Advanced tier). Already using Google Maps API key. The Routes API supports up to 25 waypoints per request, more than enough for a day of tastings (3-5 stops typical).

### 3.2 Time & Distance Matrix Between Wineries

On the compare page and map, show driving time/distance between selected wineries. "Opus One to Domaine Carneros: 22 min, 14 miles."

- **Effort:** Medium — Google Routes API Compute Route Matrix endpoint. Cache results aggressively (winery locations don't change).
- **User Value:** High — essential context for planning. Currently users have to open Google Maps separately.
- **Revenue Potential:** Low — should be free; relatively cheap API calls when cached.
- **APIs/Services:** [Google Routes API — Compute Route Matrix](https://developers.google.com/maps/documentation/routes/compute_route_matrix) ($5/1000 elements at Basic tier). Pre-compute and cache the full matrix for all 225 wineries (~50K pairs) — one-time cost under $3.

### 3.3 Day-Trip Templates

Pre-built itineraries: "First-Timer's Napa Day" (3 iconic wineries + lunch), "Sonoma on a Budget" (walk-in friendly, $-$$ wineries), "Sparkling Wine Trail", "Dog-Friendly Day Out", "Cab Sauv Deep Dive". Each template is a curated route with timing suggestions.

- **Effort:** Low — editorial content backed by existing data. Could auto-generate initial templates from winery attributes (filter by dog-friendly, price level, varietal focus).
- **User Value:** High — reduces decision paralysis, especially for first-time visitors who don't know the region.
- **Revenue Potential:** Medium — great free content for SEO; premium templates could include insider tips.
- **APIs/Services:** None — editorial + existing data. Could use OpenAI to generate template descriptions from winery data.

### 3.4 Reservation Booking Integration

Deep-link or embed booking for tasting reservations directly from winery detail pages. Start with outbound links to each winery's booking system; evolve to embedded booking if APIs allow.

- **Effort:** Low (links) to High (embedded booking) — Phase 1 is just adding booking URLs to winery data. Phase 2 would integrate with Tock's API.
- **User Value:** High — reduces friction from "I want to go" to "I'm booked."
- **Revenue Potential:** Medium — referral fees from booking platforms; wineries may pay for premium placement.
- **APIs/Services:** [Tock](https://www.exploretock.com/join/wineries/) (dominant in Napa/Sonoma; integrates with WineDirect and Commerce7). Many wineries also use [CellarPass](https://www.cellarpass.com/) for bookings. Direct website links as fallback.

---

## 4. Social Features

### 4.1 Shareable Winery Lists

Let users create named lists ("Our Anniversary Trip", "Dad's 60th Birthday Picks") with selected wineries, add notes, and share via URL. Recipients see the list without needing an account.

- **Effort:** Low — new `lists` and `list_items` tables, public share URL with a unique slug. The compare feature's `ShareCompareButton` component already demonstrates the URL-sharing pattern.
- **User Value:** High — groups visiting wine country together need a shared planning surface.
- **Revenue Potential:** Low — free feature that drives viral growth and new signups.
- **APIs/Services:** None beyond existing stack.

### 4.2 Group Trip Coordination

Extend shareable lists into collaborative planning: multiple users can vote on wineries (thumbs up/down), comment on choices, and see a consensus ranking.

- **Effort:** Medium — real-time collaboration adds complexity (polling or WebSockets), permission model for list editors vs. viewers.
- **User Value:** Medium — useful for groups of 4+ planning together, but most wine country groups are couples or small parties who can text each other.
- **Revenue Potential:** Low.
- **APIs/Services:** Could use Vercel's serverless WebSocket support or simple polling. [Liveblocks](https://liveblocks.io/) for real-time collaboration if needed.

### 4.3 User Reviews & Ratings

Allow authenticated users to leave star ratings and short reviews on winery pages. Show user ratings alongside Google ratings (already displayed from `aggregateRating`).

- **Effort:** Medium — review table, moderation workflow (spam, abuse), display logic blending user and Google ratings.
- **User Value:** Medium — user reviews are more wine-specific than Google reviews (which often focus on venue/service). However, building review volume from scratch is a cold-start problem.
- **Revenue Potential:** Low — reviews improve SEO and engagement but don't directly monetize.
- **APIs/Services:** Custom implementation. Consider Perspective API (Google) for toxicity filtering.

### 4.4 Friend Activity Feed

Show what friends have favorited, visited, or reviewed. "Sarah just visited Opus One and rated it 5 stars."

- **Effort:** High — requires friend/follow system, activity tracking, feed generation, privacy controls.
- **User Value:** Low-Medium — fun but not essential. Wine country visits are infrequent (1-2x/year for most users), so the feed would be sparse.
- **Revenue Potential:** Low.
- **APIs/Services:** Custom implementation.

---

## 5. Commerce

### 5.1 Wine Club Comparison Tool

Side-by-side comparison of wine club offerings across wineries: bottles per shipment, frequency, price, discount percentage, member perks (free tastings, event access), and cancellation terms.

- **Effort:** Medium — requires scraping/curating wine club data (not currently in schema), new `wine_clubs` table, comparison UI similar to existing winery compare.
- **User Value:** High — wine clubs are a major purchase decision after visiting. Annual club memberships range from $200-$2000+, so comparison data has real dollar value to users.
- **Revenue Potential:** Medium — wineries would pay for featured placement; users might pay for detailed club analysis.
- **APIs/Services:** Data would need to be scraped/curated manually or via the existing scraper pipeline. No known API for wine club terms.

### 5.2 Direct Purchase Links

For each wine on a winery detail page, link to the winery's online store where the wine can be purchased for shipping. Show availability and shipping states.

- **Effort:** Low-Medium — Phase 1 is linking to the winery's website (URLs already in `websiteUrl`). Phase 2 is deep-linking to specific wine product pages.
- **User Value:** High — "buy the wine you just tasted" is a high-intent action.
- **Revenue Potential:** High — affiliate commissions on direct purchases. Wineries may pay for featured "Buy Now" placement.
- **APIs/Services:** [WineDirect](https://www.winedirect.com/) and [Commerce7](https://commerce7.com/) power most Napa/Sonoma DTC stores. Could negotiate referral tracking with individual wineries.

### 5.3 Deal Alerts

Notify users when wineries they've favorited run sales, offer free shipping, or release new vintages. Email digest or push notifications.

- **Effort:** High — requires monitoring winery websites/emails for deals (scraping or partnership), notification infrastructure, user preference management.
- **User Value:** Medium — useful for wine club members and repeat buyers, but deal frequency is low (wineries rarely discount).
- **Revenue Potential:** Medium — high-intent purchase channel; could charge wineries to promote deals.
- **APIs/Services:** Email via Resend or Postmark. Would likely need winery partnerships for deal data — scraping promotional pages is brittle.

### 5.4 Shipping Cost Calculator

Estimate shipping costs for wine orders by state, accounting for state-by-state DTC shipping laws (some states prohibit wine shipping entirely). "Can I ship to Texas? Yes — estimated $15-25 for 6 bottles."

- **Effort:** Medium — curate state shipping legality data (changes periodically), estimate costs by carrier weight tables.
- **User Value:** Medium — practically useful but only relevant post-visit.
- **Revenue Potential:** Low.
- **APIs/Services:** [Ship Compliant by Sovos](https://www.sovos.com/shipcompliant/) for state-by-state DTC shipping compliance data. UPS/FedEx rate APIs for cost estimates.

---

## 6. Content

### 6.1 Seasonal Event Calendar

Aggregated calendar of winery events: harvest parties (August-October), barrel tastings, winemaker dinners, release parties, concerts, and holiday events. Filterable by date range, type, and sub-region.

- **Effort:** Medium — new `events` table, scraping or manual curation, calendar UI. Napa Valley Vintners and Visit Napa Valley publish event listings but have no public API.
- **User Value:** High — event timing drives visit planning. Harvest season events sell out quickly; early awareness is valuable.
- **Revenue Potential:** Medium — wineries would pay to promote events; could charge for "early access" alerts.
- **APIs/Services:** Scrape [napavintners.com/events](https://napavintners.com/events/index.asp) and [visitnapavalley.com/events](https://www.visitnapavalley.com/events/). Could partner with these organizations for data access. Eventbrite API for wineries that use it.

### 6.2 Harvest Reports & Vintage Guides

Annual and seasonal content: vintage quality assessments, harvest progress updates, what to expect from the current vintage. "2025 was a warm, early harvest — expect ripe, concentrated reds."

- **Effort:** Low — editorial content. Could pull from public sources (UC Davis, Napa Valley Vintners harvest reports) and summarize.
- **User Value:** Medium — educational for enthusiasts, helps with buying decisions.
- **Revenue Potential:** Low — SEO value, establishes authority.
- **APIs/Services:** Public data from [UC Davis Viticulture & Enology](https://wineserver.ucdavis.edu/) and Napa Valley Vintners harvest reports. OpenAI for summarization.

### 6.3 Winemaker Interviews & Profiles

Short-form profiles of winemakers at featured wineries: background, philosophy, signature wines, what makes them unique.

- **Effort:** Medium — requires original content creation (interviews, writing, editing). Cannot be easily automated.
- **User Value:** Medium — adds depth and personality to winery listings. Wine enthusiasts care about who makes the wine.
- **Revenue Potential:** Medium — wineries may sponsor profiles; premium content candidate.
- **APIs/Services:** None — this is editorial work.

### 6.4 Educational Content Hub

Guides on varietals ("Understanding Napa Cab Sauv vs. Sonoma Pinot"), tasting techniques, wine terminology, regional appellations (AVAs), and food pairing basics. Integrated with winery data — e.g., "Learn about Rutherford Dust" links to Rutherford wineries.

- **Effort:** Low-Medium — content creation + linking to existing winery/region data.
- **User Value:** Medium — especially valuable for newcomers. Differentiation from competitors that are pure directories.
- **Revenue Potential:** Low — SEO traffic driver, keeps users on-site longer.
- **APIs/Services:** OpenAI for draft content generation. [Winedata.io](https://winedata.io/) for structured varietal and appellation data.

---

## 7. Advanced Search

### 7.1 Search by Grape Varietal

Filter the winery directory by grape varietal: "Show me all wineries that make Pinot Noir." Uses the existing `wineTypes` table data.

- **Effort:** Low — the `wine_types` table already captures varietal data (`name` field like "Cabernet Sauvignon"), and `wines` links to `winery_id`. Add a varietal filter dropdown to `WineryFilters`, joining through wines to find matching wineries.
- **User Value:** High — one of the most natural ways people search for wineries. "I love Zinfandel, where should I go?"
- **Revenue Potential:** Low — should be free; improves core utility.
- **APIs/Services:** None needed — existing data supports this.

### 7.2 Food Pairing Suggestions

For each wine or varietal on a winery page, suggest food pairings. "This Cabernet Sauvignon pairs well with grilled ribeye, aged cheddar, or mushroom risotto."

- **Effort:** Low-Medium — can start with a static pairing database keyed by varietal/category, then enhance with API data.
- **User Value:** Medium — useful for visitors planning meals around tastings, or buying wine for dinner.
- **Revenue Potential:** Low.
- **APIs/Services:** [Spoonacular API](https://spoonacular.com/food-api) (wine pairing endpoint, free tier available). [Wine-Searcher API](https://www.wine-searcher.com/trade/api) includes food pairing data. [Winedata.io](https://winedata.io/) has structured pairing algorithms. Or build a static lookup table from open data — varietal-to-food pairings are well-established and don't change often.

### 7.3 "Wines Similar To X"

"I liked the 2021 Caymus Special Selection — what else would I enjoy?" Recommend similar wines from other wineries based on varietal, style, price range, and region.

- **Effort:** Medium — similarity scoring based on wine attributes (varietal, price, rating, region). More sophisticated version could use tasting note NLP.
- **User Value:** High — directly actionable for purchase decisions and visit planning.
- **Revenue Potential:** Medium — premium feature candidate; also drives cross-winery discovery.
- **APIs/Services:** Custom implementation using existing wine data. [Wine Food Pairing NLP project](https://github.com/RoaldSchuring/wine_food_pairing) demonstrates NLP on wine descriptions. OpenAI embeddings on wine descriptions for semantic similarity.

### 7.4 Price Range Filtering on Wines

Filter wines across all wineries by price: "Show me all Cabernet Sauvignons between $30-$60." The `wines` table already has a `price` column.

- **Effort:** Low — add price range slider/inputs to a new "Browse Wines" page. Query already supported by schema.
- **User Value:** Medium — useful for budget-conscious buyers and gift shoppers.
- **Revenue Potential:** Low — free feature; improves core search utility.
- **APIs/Services:** None needed — existing data supports this.

### 7.5 Natural Language Search

"dog-friendly wineries near Calistoga with good Pinot under $30 per tasting" — parse natural language queries into structured filters using an LLM.

- **Effort:** Medium — use OpenAI (already a dependency) to extract structured filters from free-text input, then apply to existing query logic.
- **User Value:** High — dramatically lowers the barrier to finding the right winery, especially on mobile.
- **Revenue Potential:** Medium — differentiating feature; could gate advanced queries behind premium.
- **APIs/Services:** OpenAI API (already in `package.json`). Use function calling to map natural language to existing filter parameters.

---

## 8. Premium & Monetization

### Tier Structure

| Tier | Price | Target User |
|------|-------|-------------|
| **Free** | $0 | Casual browsers, first-time visitors |
| **Explorer** | $4.99/month or $29.99/year | Repeat visitors, trip planners |
| **Connoisseur** | $9.99/month or $69.99/year | Wine enthusiasts, collectors |

### Free Tier Features
- Full winery directory with search and filters
- Interactive map with sub-region overlays
- Winery detail pages with basic wine lists and tasting info
- Google ratings display
- Compare up to 4 wineries
- Save up to 10 favorites
- Basic day-trip templates (2-3 curated routes)
- Varietal search and price range filtering
- Educational content hub

### Explorer Tier Features
- Unlimited favorites and custom lists
- Visited winery tracking with map visualization
- Wine journal with up to 50 entries per year
- Itinerary builder with route optimization (up to 3 trips/month)
- Time/distance matrix on compare page
- Shareable trip plans with group voting
- Deal alerts (email digest)
- All day-trip templates
- Critic score overlays (Wine-Searcher / CellarTracker)

### Connoisseur Tier Features
- Everything in Explorer
- Unlimited wine journal entries with photo storage
- Unlimited itinerary builder usage
- "Wines Similar To X" recommendations
- Personalized winery recommendations via taste profile
- Wine club comparison tool
- Price comparison across retailers
- Natural language search
- Priority access to event calendar updates
- Export data (journal entries, visit history) to CSV/PDF

### 8.1 Winery Partnership Program

Wineries pay for enhanced listings: verified data badge, featured photos, direct booking integration, promoted placement in search results and recommendations.

- **Effort:** Medium — tiered winery profiles, payment/billing system, admin dashboard for winery managers to update their listings.
- **Revenue Potential:** High — even at $50-200/month per winery, 50 partners = $30K-120K/year. Napa/Sonoma wineries already spend heavily on marketing.
- **Model:** Freemium listings (basic data is free; verified/enhanced is paid). Similar to Yelp Business or TripAdvisor Premium.

### 8.2 Affiliate Revenue

Earn commissions on wine purchases, bookings, and related services driven from the app.

- **Effort:** Low — add affiliate links to existing outbound links (winery websites, booking platforms).
- **Revenue Potential:** Medium-High — wine is a high-AOV category.
- **Opportunities:**
  - [Wine.com Affiliate Program](https://www.wine.com/content/business-dev/affiliate-program) — commissions on purchases
  - [NapaCabs Affiliate Program](https://www.napacabs.com/affiliate-program/) — 5% commission, 90-day cookie
  - [Plonk Wine Club](https://www.plonkwineclub.com/pages/affiliate-program) — 15-40% commission on subscriptions
  - [California Wine Club](https://www.cawineclub.com/) — 15% commission, strong conversion
  - Individual winery DTC referral partnerships via WineDirect/Commerce7

### 8.3 Sponsored Content & Promoted Listings

Wineries or regional tourism boards pay for sponsored placements: featured winery on homepage, promoted day-trip templates, sponsored event listings.

- **Effort:** Low — add `sponsored` flag to winery/content models, simple admin interface.
- **Revenue Potential:** Medium — depends on traffic volume. More viable once app has consistent traffic (10K+ monthly visitors).
- **Model:** CPM or flat monthly fee. Napa Valley Vintners, Visit Napa Valley, and Sonoma County Tourism could be anchor sponsors.

### 8.4 Data Licensing

License aggregated, anonymized data to wineries and tourism boards: popular search queries, most-compared wineries, regional visit patterns, price sensitivity analysis.

- **Effort:** Low — analytics pipeline on existing user behavior data, reporting dashboard.
- **Revenue Potential:** Low-Medium — requires significant user scale to be valuable. More of a long-term play.
- **Model:** Annual data reports sold to tourism boards or wine industry associations.

---

## Implementation Priority Matrix

Features ranked by a combination of user value, revenue potential, and effort-adjusted ROI:

### Phase 1 — Quick Wins (1-2 months)
High value, low effort — ship these first.

1. **Varietal search filter** (7.1) — Low effort, uses existing data
2. **Visited winery tracking UI** (2.4) — Low effort, schema already exists
3. **Price range filtering** (7.4) — Low effort, uses existing data
4. **Day-trip templates** (3.3) — Low effort, editorial + existing data
5. **Shareable winery lists** (4.1) — Low effort, high viral potential

### Phase 2 — Core Value (2-4 months)
Features that define the premium product.

6. **Itinerary builder with route optimization** (3.1) — High effort but highest user value
7. **Taste profile builder + recommendations** (2.1, 2.2) — Differentiating feature
8. **Wine journal** (2.3) — Strong premium upsell
9. **Wine-Searcher score overlays** (1.1) — Schema is ready, high perceived value
10. **Time/distance matrix** (3.2) — Complements itinerary builder

### Phase 3 — Growth & Revenue (4-6 months)
Features that drive monetization and retention.

11. **Winery partnership program** (8.1) — Primary B2B revenue channel
12. **Affiliate links** (8.2) — Low effort, ongoing revenue
13. **Wine club comparison** (5.1) — High purchase-intent feature
14. **Seasonal event calendar** (6.1) — SEO and engagement driver
15. **Reservation booking integration** (3.4) — Completes the planning funnel

### Phase 4 — Differentiation (6-12 months)
Features that build competitive moat.

16. **Natural language search** (7.5) — "Wow" feature, leverages existing OpenAI dependency
17. **"Wines Similar To X"** (7.3) — Discovery engine
18. **CellarTracker integration** (1.2) — Community data depth
19. **Price comparison** (1.4) — Commerce enabler
20. **Educational content hub** (6.4) — SEO long-tail play

### Deprioritized
Features with lower ROI or higher risk — build only with demonstrated demand.

- Friend activity feed (4.4) — requires social graph; sparse activity for infrequent visitors
- Group trip coordination (4.2) — most groups are small enough to text
- Deal alerts (5.3) — requires winery partnerships for reliable data
- Shipping calculator (5.4) — niche use case, complex compliance
- Data licensing (8.4) — requires significant scale
- Vivino integration (1.3) — fragile undocumented API, legal risk
