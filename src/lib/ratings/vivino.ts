import type { RatingProvider, WineRatingResult, WineryRatingResult } from "./provider";

export const vivinoProvider: RatingProvider = {
  name: "vivino",

  async fetchWineRating(wineName: string, wineryName: string): Promise<WineRatingResult | null> {
    // Stub: In production, this would scrape Vivino's public pages
    // or use their unofficial API endpoints
    console.log(`[Vivino] Would fetch rating for: ${wineryName} ${wineName}`);
    return null;
  },

  async fetchWineryRating(wineryName: string): Promise<WineryRatingResult | null> {
    console.log(`[Vivino] Would fetch winery rating for: ${wineryName}`);
    return null;
  },

  normalizeScore(score: number, maxScore: number): number {
    // Vivino uses 1-5 scale, normalize to 0-100
    return (score / maxScore) * 100;
  },
};
