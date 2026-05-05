import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronRight, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { WineryCard } from "@/components/directory/WineryCard";
import { FAQSection } from "@/components/region/FAQSection";
import { FAQSchema } from "@/components/seo/FAQSchema";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import {
  getAllGuides,
  getGuideBySlug,
  type GuideDefinition,
} from "@/lib/guide-content";
import { AddToTripButton } from "@/components/trip/AddToTripButton";
import { AccommodationCard } from "@/components/accommodation/AccommodationCard";
import { getAllAccommodations } from "@/lib/accommodation-data";
import {
  getWineriesByAmenity,
  getWineriesByVarietal,
  getWineriesByTastingPrice,
  getWineriesByWinePrice,
  getWineriesByExperience,
  getRegionComparisonData,
  getSubRegionComparisonData,
} from "@/lib/guide-data";

import { BASE_URL } from "@/lib/constants";

// Static hero image mapping for popular guides
const GUIDE_HERO_IMAGES: Record<string, string> = {
  "first-time-guide-napa-valley": "/images/blog/napa-first-time-hero.jpg",
  "first-time-guide-sonoma-county": "/images/blog/napa-first-time-hero.jpg",
  "cheap-wine-tastings-napa-valley": "/images/blog/budget-wine-tasting-hero.jpg",
  "cheap-wine-tastings-sonoma-county": "/images/blog/budget-wine-tasting-hero.jpg",
  "best-cabernet-sauvignon-napa-valley": "/images/blog/napa-avas-hero.jpg",
  "napa-valley-vs-sonoma-county": "/images/blog/napa-vs-sonoma-hero.jpg",
  "wineries-for-groups-napa-valley": "/images/blog/wineries-for-groups-hero.jpg",
  "wineries-for-groups-sonoma-county": "/images/blog/wineries-for-groups-hero.jpg",
};

export async function generateStaticParams() {
  const guides = getAllGuides();
  return guides.map((g) => ({ slug: [g.slug] }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guideSlug = slug.join("/");
  const guide = getGuideBySlug(guideSlug);

  if (!guide) return { title: "Guide Not Found" };

  return {
    title: guide.title,
    description: guide.metaDescription,
    openGraph: {
      title: guide.title,
      description: guide.metaDescription,
      url: `${BASE_URL}/guides/${guide.slug}`,
      siteName: "Napa Sonoma Guide",
      type: "website",
    },
  };
}

async function getGuideData(guide: GuideDefinition) {
  if (guide.type === "amenity" && guide.amenity) {
    return {
      wineries: await getWineriesByAmenity(
        guide.amenity,
        guide.valley,
        guide.subRegionSlug
      ),
    };
  }

  if (guide.type === "varietal" && guide.varietal) {
    return {
      wineries: await getWineriesByVarietal(
        guide.varietal,
        guide.valley,
        guide.subRegionSlug
      ),
    };
  }

  if (guide.type === "price") {
    if (guide.wineMaxPrice) {
      return {
        wineries: await getWineriesByWinePrice(guide.wineMaxPrice, guide.valley),
      };
    }
    if (guide.priceTier) {
      return {
        wineries: await getWineriesByTastingPrice(guide.priceTier, guide.valley),
      };
    }
  }

  if (guide.type === "experience" && guide.experienceType) {
    return {
      wineries: await getWineriesByExperience(
        guide.experienceType,
        guide.valley,
        guide.subRegionSlug
      ),
    };
  }

  if (guide.type === "comparison" && guide.compare) {
    if (guide.compare.isValley) {
      return {
        comparison: await getRegionComparisonData(
          guide.compare.region1 as "napa" | "sonoma",
          guide.compare.region2 as "napa" | "sonoma"
        ),
      };
    }
    return {
      comparison: await getSubRegionComparisonData(
        guide.compare.region1,
        guide.compare.region2
      ),
    };
  }

  return { wineries: [] };
}

function getRelatedGuides(currentGuide: GuideDefinition) {
  const allGuides = getAllGuides();

  // Prioritize: same type + same region, then same type different region, then same region different type
  const sameTypeRegion = allGuides.filter(
    (g) =>
      g.slug !== currentGuide.slug &&
      g.type === currentGuide.type &&
      g.valley === currentGuide.valley
  );
  const sameType = allGuides.filter(
    (g) =>
      g.slug !== currentGuide.slug &&
      g.type === currentGuide.type &&
      g.valley !== currentGuide.valley
  );
  const sameRegion = allGuides.filter(
    (g) =>
      g.slug !== currentGuide.slug &&
      g.type !== currentGuide.type &&
      g.valley === currentGuide.valley &&
      !g.subRegionSlug // Only valley-level guides
  );

  const related = [...sameTypeRegion, ...sameType, ...sameRegion];
  return related.slice(0, 6);
}

function ComparisonTable({
  guide,
  data,
}: {
  guide: GuideDefinition;
  data: Record<string, unknown>;
}) {
  if (!guide.compare) return null;

  const isValley = guide.compare.isValley;
  const REGION_LABELS: Record<string, string> = {
    napa: "Napa Valley",
    sonoma: "Sonoma County",
  };

  let region1Label: string;
  let region2Label: string;
  let stats1: Record<string, unknown>;
  let stats2: Record<string, unknown>;

  if (isValley) {
    region1Label = REGION_LABELS[guide.compare.region1] || guide.compare.region1;
    region2Label = REGION_LABELS[guide.compare.region2] || guide.compare.region2;
    stats1 = (data as Record<string, Record<string, unknown>>)[guide.compare.region1] || {};
    stats2 = (data as Record<string, Record<string, unknown>>)[guide.compare.region2] || {};
  } else {
    const subData = data as { region1: Record<string, unknown> | null; region2: Record<string, unknown> | null };
    stats1 = subData.region1 || {};
    stats2 = subData.region2 || {};
    region1Label = (stats1.name as string) || guide.compare.region1;
    region2Label = (stats2.name as string) || guide.compare.region2;
  }

  const rows = [
    {
      label: "Wineries",
      v1: stats1.wineryCount as number,
      v2: stats2.wineryCount as number,
      format: (v: number) => String(v),
    },
    {
      label: "Avg Rating",
      v1: stats1.avgRating as number,
      v2: stats2.avgRating as number,
      format: (v: number) => v > 0 ? v.toFixed(1) : "N/A",
    },
    {
      label: "Avg Tasting Price",
      v1: stats1.avgTastingPrice as number,
      v2: stats2.avgTastingPrice as number,
      format: (v: number) => v > 0 ? `$${Math.round(v)}` : "N/A",
    },
    {
      label: "Top Varietals",
      v1: stats1.topVarietals as string[],
      v2: stats2.topVarietals as string[],
      format: (v: string[]) => v?.slice(0, 3).join(", ") || "N/A",
    },
  ];

  if (isValley) {
    rows.push(
      {
        label: "Dog-Friendly",
        v1: stats1.dogFriendlyCount as number,
        v2: stats2.dogFriendlyCount as number,
        format: (v: number) => `${v} wineries`,
      },
      {
        label: "Kid-Friendly",
        v1: stats1.kidFriendlyCount as number,
        v2: stats2.kidFriendlyCount as number,
        format: (v: number) => `${v} wineries`,
      }
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--muted)]">
          <tr>
            <th className="text-left p-4 font-medium" />
            <th className="text-left p-4 font-semibold text-[var(--foreground)]">
              {region1Label}
            </th>
            <th className="text-left p-4 font-semibold text-[var(--foreground)]">
              {region2Label}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {rows.map((row) => (
            <tr key={row.label} className="hover:bg-[var(--muted)]/50">
              <td className="p-4 font-medium">{row.label}</td>
              <td className="p-4">{(row.format as (v: unknown) => string)(row.v1)}</td>
              <td className="p-4">{(row.format as (v: unknown) => string)(row.v2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const guideSlug = slug.join("/");
  const guide = getGuideBySlug(guideSlug);

  if (!guide) notFound();

  const [data, allAccommodations] = await Promise.all([
    getGuideData(guide),
    getAllAccommodations(),
  ]);
  type WineryCardProps = Parameters<typeof WineryCard>[0]["winery"];
  const wineries = "wineries" in data ? (data.wineries as WineryCardProps[]) : [];

  const guideValley = guide.valley;
  const accommodations = guideValley
    ? allAccommodations.filter((a) => a.valley === guideValley).slice(0, 3)
    : allAccommodations.slice(0, 3);
  const comparison = "comparison" in data ? data.comparison : null;

  const relatedGuides = getRelatedGuides(guide);
  const heroImage = GUIDE_HERO_IMAGES[guide.slug] ?? null;

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Guides", href: "/guides" },
    { name: guide.h1, href: `/guides/${guide.slug}` },
  ];

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.h1,
    description: guide.metaDescription,
    url: `${BASE_URL}/guides/${guide.slug}`,
    author: { "@type": "Organization", name: "Napa Sonoma Guide" },
    publisher: { "@type": "Organization", name: "Napa Sonoma Guide" },
    mainEntityOfPage: `${BASE_URL}/guides/${guide.slug}`,
    inLanguage: "en-US",
  };

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      {guide.faqs.length > 0 && <FAQSchema faqs={guide.faqs} />}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      {/* Hero — image when available, paper header otherwise */}
      {heroImage ? (
        <div className="relative bg-[var(--ink)] text-white overflow-hidden">
          <Image
            src={heroImage}
            alt={guide.h1}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)]/85 via-[var(--ink)]/55 to-[var(--ink)]/20" />
          <div className="relative mx-auto max-w-7xl px-4 pt-24 sm:pt-32 pb-10 sm:px-6 lg:px-8">
            {/* Breadcrumbs over image */}
            <nav
              aria-label="Breadcrumb"
              className="mb-4 flex items-center gap-1 text-sm text-white/70"
            >
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              <Link href="/guides" className="hover:text-white transition-colors">Guides</Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-white/85 font-medium truncate">{guide.h1}</span>
            </nav>
            <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[#f0d894]">
              The Library
            </span>
            <h1
              className="font-[var(--font-heading)] font-normal tracking-[-0.02em] leading-[1.05] text-white text-[36px] sm:text-[48px] lg:text-[56px] mt-2 max-w-[22ch]"
              style={{ textWrap: "balance", textShadow: "0 2px 24px rgba(0,0,0,0.45)" }}
            >
              {guide.h1}
            </h1>
            {guide.intro.length > 0 && (
              <p className="mt-4 font-[var(--font-serif-text)] text-[17px] leading-relaxed text-white/85 max-w-[60ch]">
                {guide.intro[0]}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="border-b border-[var(--rule)]">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <nav
              aria-label="Breadcrumb"
              className="mb-4 flex items-center gap-1 text-sm text-[var(--ink-3)]"
            >
              <Link href="/" className="hover:text-[var(--ink)] transition-colors">Home</Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              <Link href="/guides" className="hover:text-[var(--ink)] transition-colors">Guides</Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-[var(--ink)] font-medium truncate" aria-current="page">{guide.h1}</span>
            </nav>
            <span className="kicker">The Library</span>
            <h1 className="editorial-h2 text-[36px] sm:text-[44px] mt-2 max-w-[24ch]">
              {guide.h1}
            </h1>
            {guide.intro.map((p, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? "mt-4 font-[var(--font-serif-text)] text-[17px] leading-relaxed text-[var(--ink-2)] max-w-3xl"
                    : "mt-4 font-[var(--font-serif-text)] text-[16px] leading-relaxed text-[var(--ink-2)] max-w-3xl"
                }
              >
                {p}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Intro text for hero-image guides (second paragraph onwards) */}
        {heroImage && guide.intro.length > 1 && (
          <div className="mb-10 max-w-3xl">
            {guide.intro.slice(1).map((p, i) => (
              <p
                key={i}
                className="mt-4 font-[var(--font-serif-text)] text-[17px] leading-relaxed text-[var(--ink-2)]"
              >
                {p}
              </p>
            ))}
          </div>
        )}

        {/* Comparison table */}
        {guide.type === "comparison" && comparison && (
          <div className="mb-10">
            <h2 className="editorial-h2 text-[26px] sm:text-[32px] mb-4">
              Side-by-Side Comparison
            </h2>
            <ComparisonTable
              guide={guide}
              data={comparison as Record<string, unknown>}
            />
          </div>
        )}

        {/* Winery grid */}
        {wineries.length > 0 && (
          <div className="mb-10">
            <h2 className="editorial-h2 text-[26px] sm:text-[32px] mb-2">
              {guide.type === "comparison"
                ? "Featured Wineries"
                : `${wineries.length} ${wineries.length === 1 ? "Winery" : "Wineries"} Found`}
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">
              Sorted by rating — verified wineries appear first.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wineries.map((w, i) => (
                <div key={w.slug} className="relative">
                  <WineryCard winery={w} />
                  <AddToTripButton wineryId={w.id} winerySlug={w.slug} wineryName={w.name} showLabel={i === 0} />
                </div>
              ))}
            </div>
          </div>
        )}

        {wineries.length === 0 && guide.type !== "comparison" && (
          <div className="card-flat mb-10 text-center px-6 py-10">
            <p className="font-[var(--font-heading)] text-[20px] text-[var(--ink)] mb-2">
              No wineries currently match this filter
            </p>
            <p className="font-[var(--font-serif-text)] text-[15px] text-[var(--ink-2)] mb-6 max-w-[55ch] mx-auto">
              We&apos;re still adding data for this category. In the meantime, try browsing
              all wineries or explore a related guide below.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href={guideValley === "napa" ? "/wineries?valley=napa" : guideValley === "sonoma" ? "/wineries?valley=sonoma" : "/wineries"}
                className="btn-ink"
              >
                Browse All Wineries
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {relatedGuides.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {relatedGuides.slice(0, 3).map((g) => (
                  <Link
                    key={g.slug}
                    href={`/guides/${g.slug}`}
                    className="font-mono text-[10.5px] tracking-[0.18em] uppercase border border-[var(--ink)] px-3 py-1.5 text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)] transition-colors"
                  >
                    {g.h1}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Plan Your Visit CTA */}
        {wineries.length > 0 && guide.type !== "comparison" && (
          <div className="card-flat mb-10 text-center px-6 py-9">
            <span className="kicker">Plan</span>
            <h2 className="editorial-h2 text-[24px] sm:text-[28px] mt-2 mb-3">
              Ready to <em>visit?</em>
            </h2>
            <p className="font-[var(--font-serif-text)] text-[15px] text-[var(--ink-2)] mb-6 max-w-[55ch] mx-auto">
              Build a custom itinerary with these wineries — add tastings, lunch, and travel time to create your perfect day.
            </p>
            <Link
              href={guideValley === "napa" ? "/itineraries/build?valley=napa" : guideValley === "sonoma" ? "/itineraries/build?valley=sonoma" : "/itineraries"}
              className="btn-ink"
            >
              Plan Your Trip
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* FAQ Section */}
        {guide.faqs.length > 0 && (
          <div className="mb-10">
            <h2 className="editorial-h2 text-[26px] sm:text-[32px] mb-4">
              Frequently Asked Questions
            </h2>
            <FAQSection faqs={guide.faqs} />
          </div>
        )}

        {/* Where to Stay */}
        {accommodations.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="editorial-h2 text-[26px] sm:text-[32px]">
                Where to Stay
              </h2>
              <Link
                href={guideValley === "napa" ? "/where-to-stay/napa-valley" : guideValley === "sonoma" ? "/where-to-stay/sonoma-county" : "/where-to-stay"}
                className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
              >
                All hotels &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {accommodations.map((a) => (
                <AccommodationCard
                  key={a.slug}
                  accommodation={a}
                  showBookingCTA
                  sourceComponent="GuideWhereToStay"
                />
              ))}
            </div>
          </div>
        )}

        {/* Related Guides — structured by relevance */}
        {relatedGuides.length > 0 && (
          <div className="border-t border-[var(--rule)] pt-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="editorial-h2 text-[22px] sm:text-[26px]">
                Related <em>guides.</em>
              </h2>
              <Link
                href={guideValley === "napa" ? "/napa-valley" : guideValley === "sonoma" ? "/sonoma-county" : "/wineries"}
                className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
              >
                {guideValley === "napa" ? "Explore Napa Valley" : guideValley === "sonoma" ? "Explore Sonoma County" : "Browse all wineries"} &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedGuides.map((g) => (
                <Link
                  key={g.slug}
                  href={`/guides/${g.slug}`}
                  className="group bg-[var(--paper-2)] border-t-2 border-[var(--rule)] hover:border-[var(--brass)] p-4 transition-colors"
                >
                  <h3 className="font-[var(--font-heading)] text-[16px] leading-tight text-[var(--ink)] group-hover:text-[var(--color-burgundy-900)] transition-colors">
                    {g.h1}
                  </h3>
                  <p className="mt-1.5 text-[13px] text-[var(--ink-3)] line-clamp-2">
                    {g.intro[0]?.slice(0, 100)}...
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
