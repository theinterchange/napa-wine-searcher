import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

export const config = {
  // API Keys (from environment)
  googlePlacesApiKey:
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    "",
  openaiApiKey: process.env.OPENAI_API_KEY || "",

  // Google Places API
  googlePlaces: {
    searchQueries: [
      "wineries in Napa Valley",
      "wine tasting Napa Valley",
      "wineries in Sonoma County",
      "wine tasting Sonoma County",
      // Sub-region specific queries
      "wineries in Rutherford Napa",
      "wineries in Oakville Napa",
      "wineries in St Helena Napa",
      "wineries in Yountville Napa",
      "wineries in Calistoga Napa",
      "wineries in Stags Leap District",
      "wineries in Howell Mountain Napa",
      "wineries in Mount Veeder Napa",
      "wineries in Atlas Peak Napa",
      "wineries in Carneros wine",
      "wineries in Russian River Valley",
      "wineries in Dry Creek Valley",
      "wineries in Alexander Valley",
      "wineries in Sonoma Valley",
      "wineries in Bennett Valley Sonoma",
      "wineries in Petaluma Gap",
    ],
    // Bounding box for Napa/Sonoma
    searchBounds: {
      south: 38.1,
      north: 38.8,
      west: -123.1,
      east: -122.1,
    },
    maxPhotosPerWinery: 3,
    targetWineryCount: 200,
  },

  // Rate limiting
  rateLimiting: {
    maxConcurrentBrowsers: 3,
    minDelayBetweenRequestsMs: 2000,
    maxDelayBetweenRequestsMs: 5000,
    maxConcurrentPerDomain: 1,
    maxRetries: 3,
    initialRetryDelayMs: 1000,
  },

  // LLM extraction
  llm: {
    model: "gpt-4o-mini" as const,
    maxTokensPerRequest: 4096,
    temperature: 0,
  },

  // Validation bounds
  validation: {
    winePriceMin: 5,
    winePriceMax: 5000,
    tastingPriceMin: 10,
    tastingPriceMax: 1000,
    latBounds: { min: 38.1, max: 38.8 },
    lngBounds: { min: -123.1, max: -122.1 },
  },

  // File paths
  paths: {
    wineryTargets: "src/scraper/data/winery-targets.json",
    wineryUrls: "src/scraper/data/winery-urls.json",
  },
};
