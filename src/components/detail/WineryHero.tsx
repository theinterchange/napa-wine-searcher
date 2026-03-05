import { Star, MapPin, Clock, Phone, Globe, Wine as WineIcon } from "lucide-react";
import { StarRating } from "@/components/ratings/StarRating";
import { BookTastingCTA } from "@/components/monetization/BookTastingCTA";

interface WineryHeroProps {
  id: number;
  slug: string;
  name: string;
  subRegion: string | null;
  valley: string | null;
  city: string | null;
  aggregateRating: number | null;
  totalRatings: number | null;
  priceLevel: number | null;
  shortDescription: string | null;
  heroImageUrl: string | null;
  websiteUrl: string | null;
}

export function WineryHero({ winery }: { winery: WineryHeroProps }) {
  return (
    <div className="relative bg-burgundy-900 dark:bg-burgundy-950 text-white">
      {winery.heroImageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${winery.heroImageUrl})` }}
        >
          <div className="absolute inset-0 bg-burgundy-950/75" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-burgundy-800 via-burgundy-900 to-burgundy-950">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <WineIcon className="h-48 w-48" />
          </div>
        </div>
      )}
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {(winery.subRegion || winery.valley || winery.city) && (
          <div className="flex items-center gap-2 text-burgundy-300 text-sm mb-4">
            <MapPin className="h-4 w-4" />
            <span>
              {[winery.subRegion, winery.valley === "napa" ? "Napa Valley" : winery.valley === "sonoma" ? "Sonoma County" : null, winery.city].filter(Boolean).join(" · ")}
            </span>
          </div>
        )}
        <h1 className="font-heading text-4xl sm:text-5xl font-bold">
          {winery.name}
        </h1>
        {winery.shortDescription && (
          <p className="mt-4 max-w-2xl text-lg text-burgundy-100">
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
            <span className="text-gold-200 font-medium" aria-label={`Price level ${winery.priceLevel} of 4`}>
              {"$".repeat(winery.priceLevel)}
            </span>
          )}
          {winery.websiteUrl && (
            <BookTastingCTA
              websiteUrl={winery.websiteUrl}
              wineryId={winery.id}
              winerySlug={winery.slug}
              sourceComponent="WineryHero"
            />
          )}
        </div>
      </div>
    </div>
  );
}
