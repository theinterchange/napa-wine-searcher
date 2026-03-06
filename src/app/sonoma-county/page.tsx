import Link from "next/link";
import type { Metadata } from "next";
import { Grape, Dog, Baby, UtensilsCrossed, Calendar, HelpCircle } from "lucide-react";
import { getValleyOverview, getTopVarietals } from "@/lib/region-data";
import { VALLEY_CONTENT } from "@/lib/region-content";
import { WineryCard } from "@/components/directory/WineryCard";
import { ValleyHero } from "@/components/region/ValleyHero";
import { SubRegionGrid } from "@/components/region/SubRegionGrid";
import { FAQSection } from "@/components/region/FAQSection";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import { FAQSchema } from "@/components/seo/FAQSchema";
import { slugify } from "@/lib/utils";
import { BASE_URL } from "@/lib/constants";

const content = VALLEY_CONTENT.sonoma;

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
  openGraph: {
    title: content.metaTitle,
    description: content.metaDescription,
    url: `${BASE_URL}/sonoma-county`,
    siteName: "Napa Sonoma Guide",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: content.metaTitle,
    description: content.metaDescription,
  },
};

export default async function SonomaCountyPage() {
  const [overview, varietals] = await Promise.all([
    getValleyOverview("sonoma"),
    getTopVarietals("sonoma"),
  ]);

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Sonoma County", href: "/sonoma-county" },
        ]}
      />
      <FAQSchema faqs={content.faq} />

      <ValleyHero
        title={content.title}
        subtitle={content.heroSubtitle}
        wineryCount={overview.totalWineries}
        subRegionCount={overview.subRegions.length}
        valley="sonoma"
      />

      {/* Top Wineries */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-bold mb-6">
          Top-Rated Sonoma County Wineries
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {overview.topWineries.map((w) => (
            <WineryCard key={w.slug} winery={w} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/wineries?valley=sonoma"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-6 py-3 text-sm font-semibold hover:bg-[var(--muted)] transition-colors"
          >
            View All Sonoma Wineries
          </Link>
        </div>
      </section>

      {/* Explore Sub-Regions */}
      <section className="border-y border-[var(--border)] bg-[var(--muted)]/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold mb-6">
            Explore Sonoma County Regions
          </h2>
          <SubRegionGrid subRegions={overview.subRegions} valley="sonoma" />
        </div>
      </section>

      {/* What Makes Sonoma Special */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-bold mb-6">
          What Makes Sonoma County Special
        </h2>
        <div className="max-w-3xl space-y-4 text-[var(--muted-foreground)] leading-relaxed">
          {content.editorial.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      {/* Popular Varietals */}
      {varietals.length > 0 && (
        <section className="border-y border-[var(--border)] bg-[var(--card)]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-bold mb-6">
              Popular Varietals in Sonoma County
            </h2>
            <div className="flex flex-wrap gap-3">
              {varietals.map((v) => (
                <Link
                  key={v.name}
                  href={`/wineries?valley=sonoma&varietal=${slugify(v.name)}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm hover:border-burgundy-400 hover:text-burgundy-700 dark:hover:border-burgundy-600 dark:hover:text-burgundy-400 transition-colors"
                >
                  <Grape className="h-4 w-4 text-burgundy-500" />
                  {v.name}
                  <span className="text-[var(--muted-foreground)]">
                    ({v.count})
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Plan Your Visit */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-bold mb-6">
          Plan Your Sonoma County Visit
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <Calendar className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400 mb-3" />
            <h3 className="font-heading text-sm font-semibold mb-1">Best Time to Visit</h3>
            <p className="text-xs text-[var(--muted-foreground)]">{content.bestTimeToVisit}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <Grape className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400 mb-3" />
            <h3 className="font-heading text-sm font-semibold mb-1">Tasting Prices</h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              ${overview.tastingPriceRange.min} – ${overview.tastingPriceRange.max} per tasting
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <Dog className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400 mb-3" />
            <h3 className="font-heading text-sm font-semibold mb-1">Dog-Friendly</h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              {overview.amenities.dogFriendlyCount} wineries welcome dogs
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <Baby className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400 mb-3" />
            <h3 className="font-heading text-sm font-semibold mb-1">Kid-Friendly</h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              {overview.amenities.kidFriendlyCount} family-friendly options
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            href="/day-trips"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
          >
            Browse Day Trips
          </Link>
          <Link
            href="/plan-trip?valley=sonoma"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
          >
            Build Custom Route
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-[var(--border)] bg-[var(--muted)]/30">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold mb-6 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400" />
            Frequently Asked Questions
          </h2>
          <FAQSection faqs={content.faq} />
        </div>
      </section>
    </>
  );
}
