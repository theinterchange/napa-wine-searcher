/**
 * Seed script for day trip routes.
 * Run with: npx tsx src/db/schema/seed/seed-day-trips.ts
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { dayTripRoutes, dayTripStops } from "../day-trips";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
});
const db = drizzle(client);

const routes = [
  {
    slug: "napa-cabernet-trail",
    title: "Napa Valley Cabernet Trail",
    description:
      "Explore Napa's finest Cabernet Sauvignon producers, from Oakville to St. Helena. This route takes you through the heart of Cab country with stops at world-class estates.",
    region: "Napa Valley",
    theme: "cabernet",
    estimatedHours: 6,
    stops: [
      { wineryId: 220, notes: "Start in Napa with bold, small-lot Cabs", suggestedDuration: 60 },
      { wineryId: 216, notes: "Estate wines from the Oakville appellation", suggestedDuration: 75 },
      { wineryId: 209, notes: "Iconic Pritchard Hill Cabernets", suggestedDuration: 75 },
      { wineryId: 154, notes: "Boutique estate with stunning views", suggestedDuration: 60 },
    ],
  },
  {
    slug: "budget-friendly-sonoma",
    title: "Budget-Friendly Sonoma Day",
    description:
      "Great wines don't have to break the bank. This route features Sonoma's best-value tasting rooms with affordable flights and relaxed atmospheres.",
    region: "Sonoma County",
    theme: "budget",
    estimatedHours: 5,
    stops: [
      { wineryId: 83, notes: "Free tastings and beautiful grounds", suggestedDuration: 60 },
      { wineryId: 59, notes: "Family-owned biodynamic winery with tram tour", suggestedDuration: 75 },
      { wineryId: 67, notes: "Russian River Valley Pinots at great prices", suggestedDuration: 60 },
      { wineryId: 71, notes: "Historic Dry Creek winery — approachable and affordable", suggestedDuration: 60 },
    ],
  },
  {
    slug: "dog-friendly-tour",
    title: "Dog-Friendly Wine Tour",
    description:
      "Bring your furry friend along for a day of wine tasting! These welcoming wineries provide water bowls, shady spots, and a warm welcome for your four-legged companion.",
    region: "Napa & Sonoma",
    theme: "dog-friendly",
    estimatedHours: 5,
    stops: [
      { wineryId: 83, notes: "Spacious grounds perfect for dogs", suggestedDuration: 60 },
      { wineryId: 175, notes: "Dog-friendly patio with Carneros views", suggestedDuration: 60 },
      { wineryId: 169, notes: "Historic Sonoma estate with open grounds", suggestedDuration: 60 },
      { wineryId: 102, notes: "Iconic Rutherford winery, dogs welcome on the patio", suggestedDuration: 75 },
    ],
  },
  {
    slug: "luxury-tasting-experience",
    title: "Luxury Tasting Experience",
    description:
      "Indulge in the finest wine country has to offer. Private tastings, reserve wines, and estate tours at Napa's most prestigious addresses.",
    region: "Napa Valley",
    theme: "luxury",
    estimatedHours: 7,
    stops: [
      { wineryId: 198, notes: "Elevated food and wine pairing in a stunning cave", suggestedDuration: 90 },
      { wineryId: 120, notes: "Single-vineyard tastings at this Oakville jewel", suggestedDuration: 90 },
      { wineryId: 42, notes: "Intimate estate with Stags Leap character", suggestedDuration: 75 },
      { wineryId: 209, notes: "Spectacular hilltop setting and legendary wines", suggestedDuration: 90 },
    ],
  },
  {
    slug: "historic-wineries",
    title: "Historic Wineries of Wine Country",
    description:
      "Journey through wine country's storied past. Visit estates with decades of winemaking heritage, from founding-era properties to classic California icons.",
    region: "Napa & Sonoma",
    theme: "historic",
    estimatedHours: 6,
    stops: [
      { wineryId: 96, notes: "Napa's first winery to achieve carbon-neutral status, family since 1968", suggestedDuration: 75 },
      { wineryId: 25, notes: "A Napa classic since 1978 with beautiful stone winery", suggestedDuration: 60 },
      { wineryId: 6, notes: "French-inspired sparkling wine house in Carneros", suggestedDuration: 75 },
      { wineryId: 82, notes: "Carneros pioneer founded by Walter Schug in 1980", suggestedDuration: 60 },
    ],
  },
  {
    slug: "carneros-pinot-chardonnay",
    title: "Carneros Pinot & Chardonnay Loop",
    description:
      "The cool Carneros region spans both Napa and Sonoma, producing exceptional Pinot Noir and Chardonnay. This loop explores the best of this unique appellation.",
    region: "Carneros",
    theme: "pinot-chardonnay",
    estimatedHours: 5,
    stops: [
      { wineryId: 6, notes: "Stunning château producing world-class sparkling wine and Pinot", suggestedDuration: 75 },
      { wineryId: 51, notes: "Carneros pioneer specializing in Pinot Noir and Chardonnay", suggestedDuration: 60 },
      { wineryId: 204, notes: "Family estate with exceptional cool-climate wines", suggestedDuration: 60 },
      { wineryId: 82, notes: "German-style Pinots from the Carneros master", suggestedDuration: 60 },
    ],
  },
];

async function seed() {
  console.log("Seeding day trip routes...");

  // Create tables if they don't exist
  await client.execute(`
    CREATE TABLE IF NOT EXISTS day_trip_routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      region TEXT,
      theme TEXT,
      estimated_hours REAL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS day_trip_stops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER NOT NULL REFERENCES day_trip_routes(id) ON DELETE CASCADE,
      winery_id INTEGER NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
      stop_order INTEGER NOT NULL,
      notes TEXT,
      suggested_duration INTEGER
    )
  `);

  // Clear existing data
  await db.delete(dayTripStops);
  await db.delete(dayTripRoutes);

  for (const route of routes) {
    const { stops, ...routeData } = route;
    const [inserted] = await db
      .insert(dayTripRoutes)
      .values(routeData)
      .returning({ id: dayTripRoutes.id });

    for (let i = 0; i < stops.length; i++) {
      await db.insert(dayTripStops).values({
        routeId: inserted.id,
        wineryId: stops[i].wineryId,
        stopOrder: i + 1,
        notes: stops[i].notes,
        suggestedDuration: stops[i].suggestedDuration,
      });
    }
    console.log(`  Created route: ${route.title} (${stops.length} stops)`);
  }

  console.log("Done!");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
