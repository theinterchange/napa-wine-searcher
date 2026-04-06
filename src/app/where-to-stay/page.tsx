import type { Metadata } from "next";
import { getAllAccommodations } from "@/lib/accommodation-data";
import { AccommodationCard } from "@/components/accommodation/AccommodationCard";
import { BedDouble, MapPin } from "lucide-react";
import Link from "next/link";
import { BASE_URL } from "@/lib/constants";

export const revalidate = 3600;

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

export default async function WhereToStayPage() {
  const accommodations = await getAllAccommodations();

  const napaCount = accommodations.filter((a) => a.valley === "napa").length;
  const sonomaCount = accommodations.filter(
    (a) => a.valley === "sonoma"
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
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

      {/* Valley quick links */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <Link
          href="/where-to-stay/napa-valley"
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-5 py-3 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
        >
          <MapPin className="h-4 w-4" />
          Napa Valley
          <span className="text-[var(--muted-foreground)]">
            ({napaCount})
          </span>
        </Link>
        <Link
          href="/where-to-stay/sonoma-county"
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-5 py-3 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
        >
          <MapPin className="h-4 w-4" />
          Sonoma County
          <span className="text-[var(--muted-foreground)]">
            ({sonomaCount})
          </span>
        </Link>
      </div>

      {/* All accommodations */}
      {accommodations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {accommodations.map((a) => (
            <AccommodationCard key={a.slug} accommodation={a} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <BedDouble className="mx-auto h-12 w-12 text-[var(--muted-foreground)] mb-4" />
          <h2 className="font-heading text-xl font-semibold mb-2">
            Coming Soon
          </h2>
          <p className="text-[var(--muted-foreground)]">
            We&apos;re curating the best places to stay in wine country.
            Check back soon for our hand-picked recommendations.
          </p>
        </div>
      )}

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
