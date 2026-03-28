import type { Metadata } from "next";
import { getAllAccommodations } from "@/lib/accommodation-data";
import { AccommodationCard } from "@/components/accommodation/AccommodationCard";
import { BedDouble } from "lucide-react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Where to Stay in Sonoma County",
  description:
    "Hand-picked hotels, inns, and resorts in Sonoma County. Curated for wine country visitors by location and proximity to the best wineries.",
  alternates: { canonical: `${BASE_URL}/where-to-stay/sonoma-county` },
};

export default async function SonomaCountyStayPage() {
  const accommodations = await getAllAccommodations("sonoma");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] mb-8"
      >
        <Link href="/" className="hover:text-[var(--foreground)]">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/where-to-stay" className="hover:text-[var(--foreground)]">
          Where to Stay
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[var(--foreground)]">Sonoma County</span>
      </nav>

      <div className="text-center mb-12">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-4">
          Where to Stay in Sonoma County
        </h1>
        <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
          From boutique hotels in Healdsburg to vineyard retreats in Russian
          River Valley, these are our picks for the best places to stay
          during your Sonoma wine trip.
        </p>
      </div>

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
            We&apos;re curating the best places to stay in Sonoma County.
            Check back soon.
          </p>
        </div>
      )}
    </div>
  );
}
