# Tasting-Reservation Affiliate Research

**Date:** 2026-04-14
**Driver:** Week 1 weekly-stats ritual Action 4 — 75% of outbound clicks are "Book Tasting," but no affiliate program monetizes them.
**Scope:** 30-min research spike. No applications submitted.

## TL;DR

**None of the four platforms are a slam-dunk fit today.** The blocker is architectural, not access: our site sends Book Tasting clicks to `{winery}.com` (with UTM params), not to Tock/CellarPass/OpenTable/Resy booking pages directly. Even if we signed up for OpenTable's affiliate program today, none of our current links would attribute.

**Realistic path forward:**
1. **Tock Referral Program** ($500/winery signed up) — piggyback on the September 2026 winery outreach already planned for sponsorship. B2B, not publisher. **This is the only path found.**
2. Tock's `exploretock.com/join/partnerships/` page was manually checked by Michael on 2026-04-14 — **no publisher/CPA track exists.** Tock only offers B2B (sell software to restaurants/wineries) and the referral program above. Confirmed.
3. **Deep-link infrastructure work is not worth doing.** With no publisher program on any of the four platforms, scraping booking URLs and bypassing winery websites would earn $0. Closed.

## Platform-by-platform

### Tock (exploretock.com) — **best signal, but B2B**
- **Referral Program:** $500 flat bonus per business (winery, restaurant, hotel) that signs up for a Tock subscription within 6 months of your referral link. Up to $5,000/referred business. Paid via Impact network. 8-week payout delay. No fees to participate. [[source](https://www.exploretock.com/join/referral-program/)]
- **Structure:** Pays to refer the *winery* to Tock, not to send diners to reservations. This is sales-team-style, not publisher-style.
- **Fit:** Good for the September 2026 winery sponsorship outreach already planned in CLAUDE.md. Pitch layer: "If you're not on Tock yet, here's a referral link — we get $500, you get standard onboarding." Stackable with sponsorship conversations.
- **Publisher program?** The Tock "Partnerships" page exists at `exploretock.com/join/partnerships/` but blocked automated fetch. **Michael should open this in a browser and check — may be the actual publisher/CPA track.**
- **Napa prevalence:** Dominant. 738 `exploretock.com` mentions in the amenity-audit JSON (noisy count — likely repeated per winery), plus explicit Tock URLs in scraper data. Most high-end Napa wineries use Tock.

### CellarPass — **unknown, requires direct outreach**
- No public affiliate/referral program discoverable via web search.
- Would need to email CellarPass partnerships team directly.
- **Napa prevalence:** Mid-tier. Present in the scraper data but less common than Tock.
- **Action:** Low priority until Tock is ruled in or out.

### OpenTable — **formal program exists, but poor Napa fit**
- Has an official affiliate program with ~60,000 restaurants globally. Commission rates *not* publicly disclosed — revealed after acceptance. Payment via ACH/direct deposit. [[source](https://help.opentable.com/s/article/OpenTable-Affiliate-Program-1505261059868)]
- Application required; approval timeline unclear.
- **Napa prevalence:** Low. Napa/Sonoma wineries rarely use OpenTable (it's restaurant-heavy). Of the 225+ wineries in the DB, almost none route through OpenTable.
- **Fit:** Mismatched. Even if approved, the number of OpenTable-routed wineries on our site is too small for meaningful GMV.

### Resy — **no publisher program**
- No direct affiliate program for publishers/bloggers. Partnership model is B2B + Amex cardholder perks. [[source](https://resy.knoji.com/questions/resy-affiliate-programs/)]
- Indirect path: American Express affiliate program (Amex Gold/Platinum cards include Resy statement credits). Not relevant to Napa tasting reservations.
- **Napa prevalence:** Near zero.
- **Fit:** None.

## Architectural blocker

Current `BookTastingCTA` component (`src/components/monetization/BookTastingCTA.tsx:27-34`) sends users to the winery's own website with UTM params:
```
{winery}.com?utm_source=winecountryguide&utm_medium=referral&utm_campaign=book_tasting
```

For any of these platforms to attribute a booking to us, we'd need to:
1. Store a per-winery reservation-platform URL (e.g., `https://www.exploretock.com/silver-oak/experience/xxx`) on the winery record.
2. Change `BookTastingCTA` to prefer that URL over the winery's homepage.
3. Append each platform's affiliate parameter once we have accounts.

Scraping 225 winery booking URLs is the expensive part. Google Places doesn't expose it. Each winery's website structure differs. Conservative estimate: 1–2 weeks of AI-assisted scraping + QA.

**Don't do this work until we've confirmed at least one platform will actually pay us per booking.**

## Final recommendation (post-browser-check 2026-04-14)

**The tasting-reservation affiliate lane is closed for pure publishers.** No platform pays per-booking commissions to content sites. Confirmed across Tock, Resy, CellarPass, OpenTable.

1. **Layer Tock referral onto the September 2026 winery outreach.** Add to the sponsorship pitch template when we draft outreach messages. $500 × 3–5 winery signups = $1,500–$2,500 one-time, no engineering. This is the only concrete revenue path from the 75% Book-Tasting click share.
2. **Do not build deep-link infrastructure.** Scraping per-winery booking URLs and bypassing `{winery}.com` would yield $0 without a publisher program to attribute.
3. **Redirect monetization focus:** Stay22 (hotels, CTA already wired) and Wine.com remain the primary activation targets. Adsense for pageview-based floor revenue. Sponsorship ($75–150/winery/month after traffic proves out) remains the biggest ceiling.

## Open question for Michael

- Are you comfortable pitching Tock referral during the September winery outreach, or does it muddy the sponsorship ask?
