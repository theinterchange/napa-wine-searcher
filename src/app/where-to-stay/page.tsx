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
  title: "Where to Stay in Napa & Sonoma — Vineyard Hotels, Inns & Resorts",
  description:
    "Hand-picked Napa Valley and Sonoma County hotels, inns, and vineyard resorts. Compare amenities, drive times to wineries, and book in one click.",
  alternates: { canonical: `${BASE_URL}/where-to-stay` },
  openGraph: {
    title: "Where to Stay in Napa & Sonoma — Vineyard Hotels, Inns & Resorts",
    description:
      "Hand-picked Napa Valley and Sonoma County hotels, inns, and vineyard resorts.",
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
  const stars = params.stars || "";
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
  if (stars) {
    const starList = stars.split(",").map(Number).filter(Boolean);
    accommodations = accommodations.filter((a) => a.starRating != null && starList.includes(a.starRating));
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      {/* Hero — compact intro so first row of hotels stays above the fold */}
      <div className="mb-5 pb-4 sm:mb-10 sm:pb-7 border-b border-[var(--rule)]">
        <span className="kicker">Lodging</span>
        <h1 className="editorial-h2 text-[28px] sm:text-[44px] lg:text-[52px] mt-2 sm:mt-3">
          Where to <em>stay.</em>
        </h1>
        <p
          className="hidden sm:block mt-5 max-w-[52ch] text-[16px] sm:text-[17px] leading-[1.5] text-[var(--ink-2)]"
          style={{ fontFamily: "var(--font-serif-text)", textWrap: "pretty" }}
        >
          Hand-picked hotels and inns across Napa and Sonoma.
        </p>
      </div>

      {/* Filters */}
      <AccommodationFilters />

      {/* Grid */}
      {paged.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paged.map((a, i) => (
            <AccommodationCard key={a.slug} accommodation={a} showBookingCTA priority={i === 0} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <BedDouble className="mx-auto h-12 w-12 text-[var(--brass)]/50 mb-4" />
          <p className="font-[var(--font-serif-text)] text-[18px] text-[var(--ink-3)]">
            No accommodations match your filters.
          </p>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-10">
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
