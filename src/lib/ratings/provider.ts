export interface WineRatingResult {
  score: number;
  maxScore: number;
  reviewCount: number;
  criticName?: string;
}

export interface WineryRatingResult {
  score: number;
  maxScore: number;
  reviewCount: number;
}

export interface RatingProvider {
  name: string;
  fetchWineRating(wineName: string, wineryName: string): Promise<WineRatingResult | null>;
  fetchWineryRating(wineryName: string): Promise<WineryRatingResult | null>;
  normalizeScore(score: number, maxScore: number): number;
}
