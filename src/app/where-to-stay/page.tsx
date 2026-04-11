import type { Metadata } from "next";
import { getAllAccommodations } from "@/lib/accommodation-data";
import { AccommodationFilters } from "@/components/accommodation/AccommodationFilters";
import { AccommodationCard } from "@/components/accommodation/AccommodationCard";
import { Pagination } from "@/components/directory/Pagination";
import { BedDouble } from "lucide-react";
import { BASE_URL } from "@/lib/constants";

export const revalidate = 3600;

const PAGE_SIZE = 18;

export const metadata: Metadata = {
  title: "Where to Stay in Wine Country",
  description:
    "Hand-picked hotels, inns, and resorts for your Napa and Sonoma wine country trip. Curated by location, price, and proximity to the best wineries.",
  alternates: { canonical: `${BASE_URL}/where-to-stay` },
  openGraph: {
    title: "Where to Stay in Wine Country | Napa Sonoma Guide",
    description:
      "Hand-picked hotels, inns, and resorts for your Napa and Sonoma wine country trip.",
  },
};

export default async function WhereToStayPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const valley = params.valley || "";
  const type = params.type || "";
  const features = params.features || "";
  const sort = params.sort || "";

  let accommodations = await getAllAccommodations();

  // Apply filters
  if (valley) {
    const valleys = valley.split(",").filter(Boolean);
    accommodations = accommodations.filter((a) => valleys.includes(a.valley));
  }
  if (type) {
    const types = type.split(",").filter(Boolean);
    accommodations = accommodations.filter((a) => types.includes(a.type));
  }
  if (features) {
    const featureList = features.split(",").filter(Boolean);
    if (featureList.includes("dog")) {
      accommodations = accommodations.filter((a) => a.dogFriendly === true);
    }
    if (featureList.includes("adultsOnly")) {
      accommodations = accommodations.filter((a) => a.adultsOnly === true);
    }
  }

  // Apply sort
  if (sort === "name") {
    accommodations.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "reviews") {
    accommodations.sort(
      (a, b) => (b.googleReviewCount ?? 0) - (a.googleReviewCount ?? 0)
    );
  }
  // Default sort (rating) is already handled by getAllAccommodations ranking

  const total = accommodations.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const clampedPage = Math.min(page, Math.max(1, totalPages));
  const paged = accommodations.slice(
    (clampedPage - 1) * PAGE_SIZE,
    clampedPage * PAGE_SIZE
  );

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Where to Stay in Wine Country",
    description: "Hand-picked hotels, inns, and resorts across Napa and Sonoma wine country.",
    numberOfItems: accommodations.length,
    itemListElement: paged.slice(0, 10).map((a, i) => ({
      "@type": "ListItem",
      position: (clampedPage - 1) * PAGE_SIZE + i + 1,
      name: a.name,
      url: `${BASE_URL}/where-to-stay/${a.slug}`,
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      {/* Hero — compact intro so first row of hotels stays above the fold */}
      <div className="text-center mb-8">
        <h1 className="font-heading text-3xl font-bold mb-3">
          Where to Stay in Wine Country
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] max-w-2xl mx-auto leading-relaxed">
          Hand-picked hotels, inns, and resorts across Napa and Sonoma — chosen
          for their proximity to great wineries, the quality of the experience,
          and value at every price point.
        </p>
      </div>

      {/* Filters */}
      <AccommodationFilters />

      {/* Grid */}
      {paged.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paged.map((a) => (
            <AccommodationCard key={a.slug} accommodation={a} showBookingCTA />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <BedDouble className="mx-auto h-12 w-12 text-[var(--muted-foreground)] mb-4" />
          <p className="text-lg text-[var(--muted-foreground)]">
            No accommodations match your filters.
          </p>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-8">
        <Pagination
          currentPage={clampedPage}
          totalPages={totalPages}
          basePath="/where-to-stay"
        />
      </div>

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Where to Stay in Wine Country",
            description:
              "Hand-picked hotels, inns, and resorts for Napa and Sonoma wine country trips.",
            url: `${BASE_URL}/where-to-stay`,
            isPartOf: {
              "@type": "WebSite",
              name: "Napa Sonoma Guide",
              url: BASE_URL,
            },
          }),
        }}
      />
    </div>
  );
}
