import type { RatingProvider } from "./provider";
import { vivinoProvider } from "./vivino";
import { cellarTrackerProvider } from "./cellartracker";
import { wineSearcherProvider } from "./wine-searcher";

const providers: Record<string, RatingProvider> = {
  vivino: vivinoProvider,
  cellartracker: cellarTrackerProvider,
  "wine-searcher": wineSearcherProvider,
};

export function getRatingProvider(name: string): RatingProvider | undefined {
  return providers[name];
}

export function getActiveProviders(): RatingProvider[] {
  return [vivinoProvider, cellarTrackerProvider];
}

export type { RatingProvider, WineRatingResult, WineryRatingResult } from "./provider";
