import { Star, MapPin, Clock, Phone, Globe, Wine as WineIcon } from "lucide-react";
import { StarRating } from "@/components/ratings/StarRating";

interface WineryHeroProps {
  name: string;
  subRegion: string | null;
  valley: string | null;
  city: string | null;
  aggregateRating: number | null;
  totalRatings: number | null;
  priceLevel: number | null;
  shortDescription: string | null;
  heroImageUrl: string | null;
}

export function WineryHero({ winery }: { winery: WineryHeroProps }) {
  return (
    <div className="relative bg-burgundy-900 dark:bg-burgundy-950 text-white">
      {winery.heroImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${winery.heroImageUrl})` }}
        >
          <div className="absolute inset-0 bg-burgundy-950/75" />
        </div>
      )}
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-burgundy-300 text-sm mb-4">
          <MapPin className="h-4 w-4" />
          <span>
            {winery.subRegion} &middot;{" "}
            {winery.valley === "napa" ? "Napa Valley" : "Sonoma County"}
            {winery.city && ` · ${winery.city}`}
          </span>
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold">
          {winery.name}
        </h1>
        {winery.shortDescription && (
          <p className="mt-4 max-w-2xl text-lg text-burgundy-200">
            {winery.shortDescription}
          </p>
        )}
        <div className="mt-6 flex items-center gap-4">
          {winery.aggregateRating && (
            <div className="flex items-center gap-2">
              <StarRating rating={winery.aggregateRating} size="md" />
              <span className="font-semibold">
                {winery.aggregateRating.toFixed(1)}
              </span>
              {winery.totalRatings != null && (
                <span className="text-burgundy-300">
                  ({winery.totalRatings.toLocaleString()} reviews)
                </span>
              )}
            </div>
          )}
          {winery.priceLevel && (
            <span className="text-gold-400 font-medium">
              {"$".repeat(winery.priceLevel)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
