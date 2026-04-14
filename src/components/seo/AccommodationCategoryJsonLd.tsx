/**
 * JSON-LD for accommodation category pages.
 *
 * Emits CollectionPage wrapping an ItemList, where each item is a
 * LodgingBusiness with amenity-specific properties (petsAllowed, audience).
 */
import { BASE_URL } from "@/lib/constants";
import type { AccommodationAmenity } from "@/lib/category-data";

interface AccommodationItem {
  slug: string;
  name: string;
  city: string | null;
  valley: string;
  googleRating: number | null;
  googleReviewCount: number | null;
  heroImageUrl: string | null;
}

interface Props {
  amenity: AccommodationAmenity;
  pageUrl: string;
  pageName: string;
  pageDescription: string;
  accommodations: AccommodationItem[];
}

export function AccommodationCategoryJsonLd({
  amenity: _amenity,
  pageUrl,
  pageName,
  pageDescription,
  accommodations,
}: Props) {
  const itemList = accommodations.map((a, i) => {
    const accomUrl = `${BASE_URL}/where-to-stay/${a.slug}`;
    const item: Record<string, unknown> = {
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LodgingBusiness",
        "@id": accomUrl,
        name: a.name,
        url: accomUrl,
        petsAllowed: true,
        ...(a.googleRating != null && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: a.googleRating,
            ...(a.googleReviewCount != null && {
              reviewCount: a.googleReviewCount,
            }),
            bestRating: 5,
          },
        }),
        ...(a.city && {
          address: {
            "@type": "PostalAddress",
            addressLocality: a.city,
            addressRegion: "CA",
            addressCountry: "US",
          },
        }),
        ...(a.heroImageUrl && { image: a.heroImageUrl }),
      },
    };
    return item;
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageName,
    description: pageDescription,
    url: pageUrl,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: accommodations.length,
      itemListElement: itemList,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
