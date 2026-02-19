import type { RatingProvider, WineRatingResult, WineryRatingResult } from "./provider";

export const wineSearcherProvider: RatingProvider = {
  name: "wine-searcher",

  async fetchWineRating(wineName: string, wineryName: string): Promise<WineRatingResult | null> {
    // Stub: Requires Wine-Searcher Pro API key
    // Would use their REST API with authentication
    if (!process.env.WINE_SEARCHER_API_KEY) {
      return null;
    }
    console.log(`[Wine-Searcher] Would fetch rating for: ${wineryName} ${wineName}`);
    return null;
  },

  async fetchWineryRating(wineryName: string): Promise<WineryRatingResult | null> {
    if (!process.env.WINE_SEARCHER_API_KEY) {
      return null;
    }
    console.log(`[Wine-Searcher] Would fetch winery rating for: ${wineryName}`);
    return null;
  },

  normalizeScore(score: number, maxScore: number): number {
    return (score / maxScore) * 100;
  },
};
