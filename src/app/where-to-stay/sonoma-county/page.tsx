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
        className="flex items-center gap-1 font-mono text-[10.5px] tracking-[0.18em] uppercase text-[var(--ink-3)] mb-8"
      >
        <Link href="/" className="hover:text-[var(--ink)]">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/where-to-stay" className="hover:text-[var(--ink)]">
          Where to Stay
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-[var(--brass-2)]">Sonoma County</span>
      </nav>

      <div className="mb-10 pb-6 border-b border-[var(--rule)]">
        <span className="kicker">Lodging · Sonoma County</span>
        <h1 className="editorial-h2 text-[34px] sm:text-[44px] lg:text-[52px] mt-3">
          Where to stay in <em>Sonoma.</em>
        </h1>
        <p className="mt-5 max-w-[56ch] font-[var(--font-serif-text)] text-[16px] sm:text-[18px] leading-[1.55] text-[var(--ink-2)]" style={{ textWrap: "pretty" }}>
          From boutique hotels in Healdsburg to vineyard retreats in Russian
          River Valley — our picks for the best places to stay during your
          Sonoma wine trip.
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
          <BedDouble className="mx-auto h-12 w-12 text-[var(--brass)]/50 mb-4" />
          <h2 className="font-[var(--font-heading)] text-[22px] font-normal mb-2 text-[var(--ink)]">
            Coming Soon
          </h2>
          <p className="font-[var(--font-serif-text)] text-[var(--ink-3)]">
            We&apos;re curating the best places to stay in Sonoma County.
            Check back soon.
          </p>
        </div>
      )}
    </div>
  );
}
