/**
 * JSON-LD for category landing pages.
 *
 * Emits a CollectionPage that wraps an ItemList of every winery on the
 * page. Each ListItem references the winery detail page's canonical URL
 * via @id, so Google can knit the entities together. Per-item amenity
 * properties (petsAllowed, audience, additionalProperty for sustainability)
 * are included in the inline LocalBusiness reference.
 */
import { BASE_URL } from "@/lib/constants";
import type { WineryAmenity } from "@/lib/category-data";

interface CategoryWineryItem {
  slug: string;
  name: string;
  city: string | null;
  subRegion: string | null;
  valley: string | null;
  aggregateRating: number | null;
  totalRatings: number | null;
  dogFriendlySource: string | null;
  kidFriendlySource: string | null;
  sustainableSource: string | null;
}

interface CategoryJsonLdProps {
  amenity: WineryAmenity;
  pageUrl: string; // canonical URL of the landing page
  pageName: string; // h1 of the page
  pageDescription: string;
  wineries: CategoryWineryItem[];
  lastModified?: Date | null;
}

function amenityProperty(amenity: WineryAmenity) {
  if (amenity === "dog") {
    return { petsAllowed: true };
  }
  if (amenity === "kid") {
    return {
      audience: {
        "@type": "Audience",
        audienceType: "Family",
      },
    };
  }
  return {
    additionalProperty: {
      "@type": "PropertyValue",
      name: "Sustainability",
      value: "Sustainable, organic, or biodynamic farming",
    },
  };
}

function amenitySource(amenity: WineryAmenity, w: CategoryWineryItem) {
  if (amenity === "dog") return w.dogFriendlySource;
  if (amenity === "kid") return w.kidFriendlySource;
  return w.sustainableSource;
}

export function CategoryJsonLd({
  amenity,
  pageUrl,
  pageName,
  pageDescription,
  wineries,
  lastModified,
}: CategoryJsonLdProps) {
  const itemListElements = wineries.map((w, i) => {
    const wineryUrl = `${BASE_URL}/wineries/${w.slug}`;
    const source = amenitySource(amenity, w);
    return {
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": ["LocalBusiness", "Winery"],
        "@id": wineryUrl,
        name: w.name,
        url: wineryUrl,
        ...(w.city && {
          address: {
            "@type": "PostalAddress",
            addressLocality: w.city,
            addressRegion: "CA",
            addressCountry: "US",
          },
        }),
        ...(w.aggregateRating && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: w.aggregateRating,
            bestRating: 5,
            ratingCount: w.totalRatings || 1,
          },
        }),
        ...amenityProperty(amenity),
        ...(source && { sameAs: [source] }),
      },
    };
  });

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": pageUrl,
    url: pageUrl,
    name: pageName,
    description: pageDescription,
    ...(lastModified && { dateModified: lastModified.toISOString() }),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: wineries.length,
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      itemListElement: itemListElements,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPage) }}
    />
  );
}
