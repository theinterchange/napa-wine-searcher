import type { RatingProvider, WineRatingResult, WineryRatingResult } from "./provider";

export const cellarTrackerProvider: RatingProvider = {
  name: "cellartracker",

  async fetchWineRating(wineName: string, wineryName: string): Promise<WineRatingResult | null> {
    console.log(`[CellarTracker] Would fetch rating for: ${wineryName} ${wineName}`);
    return null;
  },

  async fetchWineryRating(wineryName: string): Promise<WineryRatingResult | null> {
    console.log(`[CellarTracker] Would fetch winery rating for: ${wineryName}`);
    return null;
  },

  normalizeScore(score: number, maxScore: number): number {
    // CellarTracker uses 0-100 scale
    return (score / maxScore) * 100;
  },
};
