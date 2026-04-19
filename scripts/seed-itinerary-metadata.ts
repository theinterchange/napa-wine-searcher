/**
 * Enrich existing curated itineraries (day_trip_routes) with metadata
 * introduced in Phase 0: group_vibe, duration, editorial_pull, seo_keywords,
 * faq_json, and hero_image_url (left null by default — falls back to first
 * stop's hero image on the trip page).
 *
 * Idempotent: updates by slug, so safe to re-run.
 *
 * Run: npx tsx scripts/seed-itinerary-metadata.ts
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { dayTripRoutes } from "../src/db/schema/day-trips";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
});
const db = drizzle(client);

type Enrichment = {
  slug: string;
  groupVibe: string;
  duration: "half" | "full" | "weekend";
  editorialPull: string;
  seoKeywords: string;
  faqJson: string;
};

const ENRICHMENTS: Enrichment[] = [
  {
    slug: "napa-cabernet-trail",
    groupVibe: "Cabernet enthusiasts",
    duration: "full",
    editorialPull:
      "A full day through Napa's Cabernet heartland — from Oakville to St. Helena, with estate tours, library pours, and cellar-aged icons.",
    seoKeywords:
      "napa cabernet itinerary, oakville wineries, st helena cabernet, napa day trip",
    faqJson: JSON.stringify([
      {
        question: "How many days do I need?",
        answer:
          "This is a full-day itinerary, roughly six hours including tastings and drive time. Add an overnight at a Napa or St. Helena hotel to make it a weekend.",
      },
      {
        question: "Are reservations required?",
        answer:
          "Most Cabernet-focused estates in Napa require reservations. Book 2–3 weeks ahead, especially for weekends.",
      },
    ]),
  },
  {
    slug: "budget-friendly-sonoma",
    groupVibe: "Budget-conscious tasters",
    duration: "full",
    editorialPull:
      "Sonoma's best-value tasting rooms — family-owned, biodynamic, historic — all under $40 per flight, with room to linger.",
    seoKeywords:
      "sonoma wineries on a budget, cheap wine tasting sonoma, affordable sonoma tours",
    faqJson: JSON.stringify([
      {
        question: "What counts as budget here?",
        answer:
          "Each stop on this route charges $40 or less per flight, with several offering fee-waivers with purchase.",
      },
    ]),
  },
  {
    slug: "dog-friendly-tour",
    groupVibe: "Traveling with a dog",
    duration: "full",
    editorialPull:
      "Water bowls at the host stand, treats on the bar, shade under the oaks — a day of wine tasting your dog will enjoy too.",
    seoKeywords:
      "dog friendly wineries napa sonoma, bring your dog wine tasting",
    faqJson: JSON.stringify([
      {
        question: "Do dogs need to stay on leash?",
        answer:
          "Yes — every stop requires leashed dogs outdoors. Most do not allow dogs inside tasting rooms.",
      },
      {
        question: "Are these dog policies verified?",
        answer:
          "Every dog-friendly claim on this route is sourced from the winery's own public materials — look for the verified badge on each stop.",
      },
    ]),
  },
  {
    slug: "luxury-tasting-experience",
    groupVibe: "Special occasion / splurge",
    duration: "full",
    editorialPull:
      "Private cave tastings, library pours, and reserve-only flights at Napa's most storied addresses — a full day of indulgence.",
    seoKeywords:
      "luxury napa wine tasting, private tasting napa, reserve wineries napa",
    faqJson: JSON.stringify([
      {
        question: "What's the budget?",
        answer:
          "Expect $100–$300 per person per stop. Food-and-wine pairings and reserve tastings are standard at this tier.",
      },
    ]),
  },
  {
    slug: "historic-wineries",
    groupVibe: "History & heritage",
    duration: "full",
    editorialPull:
      "Estates with decades of winemaking heritage — founding-era properties and classic California icons that shaped the region.",
    seoKeywords:
      "historic napa wineries, historic sonoma wineries, oldest wineries wine country",
    faqJson: JSON.stringify([
      {
        question: "Does historic mean old?",
        answer:
          "This route favors estates founded before 1985 with continuing family or legacy ownership — the producers who built wine country's reputation.",
      },
    ]),
  },
  {
    slug: "carneros-pinot-chardonnay",
    groupVibe: "Cool-climate explorers",
    duration: "full",
    editorialPull:
      "Cool Carneros fog meets Burgundy-inspired winemaking — a loop through both the Napa and Sonoma sides of the appellation.",
    seoKeywords:
      "carneros wineries, carneros pinot noir, napa sparkling wine, carneros chardonnay",
    faqJson: JSON.stringify([
      {
        question: "Is Carneros part of Napa or Sonoma?",
        answer:
          "Both. Carneros straddles the southern end of Napa Valley and Sonoma County, with a marine-influenced climate that makes it ideal for Pinot Noir and Chardonnay.",
      },
    ]),
  },
];

async function main() {
  console.log(`Enriching ${ENRICHMENTS.length} curated itineraries...`);
  const curatedAt = new Date().toISOString();

  for (const e of ENRICHMENTS) {
    const result = await db
      .update(dayTripRoutes)
      .set({
        groupVibe: e.groupVibe,
        duration: e.duration,
        editorialPull: e.editorialPull,
        seoKeywords: e.seoKeywords,
        faqJson: e.faqJson,
        curatedAt,
      })
      .where(eq(dayTripRoutes.slug, e.slug))
      .returning({ id: dayTripRoutes.id });

    if (result.length === 0) {
      console.warn(`  ✗ Route not found: ${e.slug}`);
    } else {
      console.log(`  ✓ ${e.slug}`);
    }
  }
  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
