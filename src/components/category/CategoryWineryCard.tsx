/**
 * Category-page winery card.
 *
 * Currently a thin pass-through to the directory WineryCard. Source URLs
 * deliberately do NOT appear here — the intended user flow is:
 *   category page  →  click into winery detail  →  see source on detail page
 * Surfacing source pills on the category card short-circuits that flow
 * (and clutters the layout).
 *
 * The wrapper is preserved as the integration point for session 2's kid
 * and sustainable variants, in case those amenities need per-card treatments
 * the base WineryCard doesn't carry.
 */
import { WineryCard } from "@/components/directory/WineryCard";
import type { WineryAmenity } from "@/lib/category-data";

interface CategoryWineryCardProps {
  amenity: WineryAmenity;
  winery: {
    id: number;
    slug: string;
    name: string;
    shortDescription: string | null;
    city: string | null;
    subRegion: string | null;
    subRegionSlug: string | null;
    valley: string | null;
    priceLevel: number | null;
    aggregateRating: number | null;
    totalRatings: number | null;
    reservationRequired: boolean | null;
    dogFriendly: boolean | null;
    dogFriendlyNote: string | null;
    dogFriendlySource: string | null;
    picnicFriendly: boolean | null;
    kidFriendly: boolean | null;
    kidFriendlyNote: string | null;
    kidFriendlySource: string | null;
    kidFriendlyConfidence: string | null;
    sustainableFarming: boolean | null;
    sustainableNote: string | null;
    sustainableSource: string | null;
    heroImageUrl: string | null;
    curated: boolean | null;
    curatedAt: string | null;
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CategoryWineryCard({ amenity: _amenity, winery }: CategoryWineryCardProps) {
  return (
    <WineryCard
      winery={{
        id: winery.id,
        slug: winery.slug,
        name: winery.name,
        shortDescription: winery.shortDescription,
        city: winery.city,
        subRegion: winery.subRegion,
        subRegionSlug: winery.subRegionSlug,
        valley: winery.valley,
        priceLevel: winery.priceLevel,
        aggregateRating: winery.aggregateRating,
        totalRatings: winery.totalRatings,
        reservationRequired: winery.reservationRequired,
        dogFriendly: winery.dogFriendly,
        picnicFriendly: winery.picnicFriendly,
        kidFriendly: winery.kidFriendly,
        kidFriendlyConfidence: winery.kidFriendlyConfidence,
        curated: winery.curated,
        heroImageUrl: winery.heroImageUrl,
      }}
    />
  );
}
