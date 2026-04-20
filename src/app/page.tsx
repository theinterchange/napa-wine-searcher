import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Wine, Route, Dog, DollarSign, Sparkles, BedDouble } from "lucide-react";
import { db } from "@/db";
import { BASE_URL } from "@/lib/constants";
import { wineries, subRegions, dayTripRoutes } from "@/db/schema";
import { sql, count, eq, and, isNotNull } from "drizzle-orm";
import { HeroFeatured } from "@/components/home/HeroFeatured";
import { QuickFilterBar } from "@/components/home/QuickFilterBar";
import { EditorialInterlude } from "@/components/home/EditorialInterlude";
import { RegionCard } from "@/components/home/RegionCard";
import { GuideCard } from "@/components/home/GuideCard";
import { SeasonalBanner } from "@/components/home/SeasonalBanner";
import { getActiveSeasonalBanners } from "@/lib/seasonal";
import { wineryRankingDesc } from "@/lib/winery-ranking";
import { WineryCard } from "@/components/directory/WineryCard";
import { AccommodationCard } from "@/components/accommodation/AccommodationCard";
import { BlogCard } from "@/components/blog/BlogCard";
import { getAllAccommodations } from "@/lib/accommodation-data";
import { getAllPosts } from "@/lib/blog";
import { getGuideBySlug } from "@/lib/guide-content";
import { SUBREGION_CONTENT } from "@/lib/region-content";

export const revalidate = 86400; // ISR: regenerate daily

export const metadata: Metadata = {
  title: "Top Napa Valley & Sonoma County Wineries | Napa Sonoma Guide",
  description:
    "225+ wineries ranked and reviewed. Compare tasting experiences, check reservation availability, and plan your Napa Valley or Sonoma County wine trip.",
  openGraph: {
    title: "Top Napa Valley & Sonoma County Wineries | Napa Sonoma Guide",
    description:
      "225+ wineries ranked and reviewed. Compare tasting experiences, check reservation availability, and plan your Napa Valley or Sonoma County wine trip.",
    url: BASE_URL,
    siteName: "Napa Sonoma Guide",
    type: "website",
  },
  alternates: {
    canonical: BASE_URL,
  },
};

async function getFeaturedWineries() {
  const top = await db
    .select({
      slug: wineries.slug,
      name: wineries.name,
      heroImageUrl: wineries.heroImageUrl,
      subRegion: subRegions.name,
      valley: subRegions.valley,
      googleRating: wineries.googleRating,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(eq(wineries.curated, true))
    .orderBy(wineryRankingDesc)
    .limit(10);

  // Fisher-Yates shuffle and take 5
  for (let i = top.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [top[i], top[j]] = [top[j], top[i]];
  }
  return top.slice(0, 5);
}

async function getTotalWineries() {
  const [{ total }] = await db.select({ total: count() }).from(wineries);
  return total;
}


async function getPopularSubRegions() {
  const regions = await db
    .select({
      name: subRegions.name,
      slug: subRegions.slug,
      valley: subRegions.valley,
      count: count(),
    })
    .from(wineries)
    .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .groupBy(subRegions.id)
    .orderBy(sql`count(*) DESC`)
    .limit(8);

  // For the top 4 (2 napa, 2 sonoma), get hero images
  const napaRegions = regions.filter((r) => r.valley === "napa").slice(0, 2);
  const sonomaRegions = regions.filter((r) => r.valley === "sonoma").slice(0, 2);
  const featured = [...napaRegions, ...sonomaRegions];

  const heroImages = await Promise.all(
    featured.map(async (region) => {
      const [topWinery] = await db
        .select({ heroImageUrl: wineries.heroImageUrl })
        .from(wineries)
        .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
        .where(
          and(
            eq(subRegions.slug, region.slug),
            eq(wineries.curated, true),
            isNotNull(wineries.heroImageUrl)
          )
        )
        .orderBy(wineryRankingDesc)
        .limit(1);
      return topWinery?.heroImageUrl ?? null;
    })
  );

  return featured.map((region, i) => ({
    ...region,
    heroImageUrl: heroImages[i],
  }));
}

async function getHomepageWineries() {
  return db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      shortDescription: wineries.shortDescription,
      city: wineries.city,
      priceLevel: wineries.priceLevel,
      aggregateRating: wineries.aggregateRating,
      totalRatings: wineries.totalRatings,
      reservationRequired: wineries.reservationRequired,
      dogFriendly: wineries.dogFriendly,
      picnicFriendly: wineries.picnicFriendly,
      kidFriendly: wineries.kidFriendly,
      kidFriendlyConfidence: wineries.kidFriendlyConfidence,
      heroImageUrl: wineries.heroImageUrl,
      subRegion: subRegions.name,
      subRegionSlug: subRegions.slug,
      valley: subRegions.valley,
      curated: wineries.curated,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .orderBy(wineryRankingDesc)
    .limit(9);
}

// Get hero images for guides that don't have matching blog images
async function getGuideHeroFallbacks() {
  const [cabernet] = await db
    .select({ heroImageUrl: wineries.heroImageUrl })
    .from(wineries)
    .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(
      and(
        eq(wineries.curated, true),
        eq(subRegions.valley, "napa"),
        isNotNull(wineries.heroImageUrl)
      )
    )
    .orderBy(wineryRankingDesc)
    .limit(1);

  return {
    cabernet: cabernet?.heroImageUrl ?? null,
  };
}

// Build enriched guide data for homepage
function getHomepageGuides(fallbackImages: { cabernet: string | null }) {
  const guideConfigs = [
    {
      slug: "first-time-guide-napa-valley",
      label: "First Time in Napa Valley",
      icon: Sparkles,
      heroImage: "/images/blog/napa-first-time-hero.jpg",
    },
    {
      slug: "dog-friendly-wineries",
      label: "Dog-Friendly Wineries",
      icon: Dog,
      heroImage: "/images/blog/dog-friendly-wineries-hero.jpg",
      href: "/dog-friendly-wineries",
    },
    {
      slug: "cheap-wine-tastings-napa-valley",
      label: "Budget Tastings",
      icon: DollarSign,
      heroImage: "/images/blog/budget-wine-tasting-hero.jpg",
    },
    {
      slug: "best-cabernet-sauvignon-napa-valley",
      label: "Best Cabernet Sauvignon",
      icon: Wine,
      heroImage: fallbackImages.cabernet,
    },
  ];

  return guideConfigs.map((config) => {
    // For guides that have been replaced by category cluster pages,
    // getGuideBySlug returns null — provide a manual intro fallback.
    const guide = getGuideBySlug(config.slug);
    return {
      ...config,
      intro: guide?.intro?.[0] ?? "Browse the full set on napasonomaguide.com.",
    };
  });
}

export default async function HomePage() {
  const [
    featured,
    totalWineries,
    homepageWineries,
    popularRegions,
    topAccommodations,
    blogPosts,
    guideFallbacks,
  ] = await Promise.all([
    getFeaturedWineries(),
    getTotalWineries(),
    getHomepageWineries(),
    getPopularSubRegions(),
    getAllAccommodations().then((all) => all.slice(0, 3)),
    Promise.resolve(getAllPosts().slice(0, 3)),
    getGuideHeroFallbacks(),
  ]);

  const guides = getHomepageGuides(guideFallbacks);

  // Enrich regions with editorial content from SUBREGION_CONTENT
  const enrichedRegions = popularRegions.map((region) => {
    const content = SUBREGION_CONTENT[region.slug];
    return {
      ...region,
      signatureVarietal: content?.signatureVarietal ?? "Wine Country",
      whyVisit:
        content?.whyVisit ??
        content?.description?.[0] ??
        `Discover ${region.count} wineries in ${region.name}.`,
    };
  });

  const seasonalBanners = getActiveSeasonalBanners();

  return (
    <>
      {/* 1. Hero with Featured Wineries (contains page H1) */}
      <HeroFeatured wineries={featured} totalWineries={totalWineries} />

      {/* 2. Seasonal Banners — auto-managed by start/end dates (amenity discovery lives in QuickFilterBar inside Explore Wineries) */}
      {seasonalBanners.map((banner) => (
        <SeasonalBanner key={banner.id} banner={banner} />
      ))}

      {/* 4. Explore Wineries */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-heading text-2xl font-bold">Explore Wineries</h2>
          <Link
            href="/wineries"
            className="text-sm font-medium text-[var(--foreground)] hover:underline"
          >
            Browse All Wineries &rarr;
          </Link>
        </div>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          Hand-picked selections — from iconic estates to tucked-away gems worth the drive.
        </p>
        <QuickFilterBar />
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {homepageWineries.map((winery) => (
            <WineryCard key={winery.slug} winery={winery} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/wineries"
            className="inline-flex items-center gap-2 rounded-lg bg-burgundy-900 px-6 py-3 text-sm font-semibold text-white hover:bg-burgundy-800 transition-colors"
          >
            Browse All Wineries &rarr;
          </Link>
        </div>
      </section>

      {/* 5. Editorial Interlude */}
      <EditorialInterlude />

      {/* 6. Wine Country, Region by Region */}
      {enrichedRegions.length > 0 && (() => {
        const napaRegions = enrichedRegions.filter((r) => r.valley === "napa");
        const sonomaRegions = enrichedRegions.filter((r) => r.valley === "sonoma");
        return (
          <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-2">
              <h2 className="font-heading text-2xl font-bold">
                Wine Country, Region by Region
              </h2>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mb-10">
              Every valley, hillside, and back road has its own personality — shaped by soil, sun, and decades of winemaking tradition.
            </p>

            {/* Napa Valley */}
            {napaRegions.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading text-lg font-semibold">Napa Valley</h3>
                  <Link href="/napa-valley" className="text-sm font-medium text-[var(--foreground)] hover:underline">
                    All Napa regions &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {napaRegions.map((region) => (
                    <RegionCard
                      key={region.slug}
                      name={region.name}
                      slug={region.slug}
                      valley="napa"
                      count={region.count}
                      signatureVarietal={region.signatureVarietal}
                      whyVisit={region.whyVisit}
                      heroImageUrl={region.heroImageUrl}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sonoma County */}
            {sonomaRegions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading text-lg font-semibold">Sonoma County</h3>
                  <Link href="/sonoma-county" className="text-sm font-medium text-[var(--foreground)] hover:underline">
                    All Sonoma regions &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {sonomaRegions.map((region) => (
                    <RegionCard
                      key={region.slug}
                      name={region.name}
                      slug={region.slug}
                      valley="sonoma"
                      count={region.count}
                      signatureVarietal={region.signatureVarietal}
                      whyVisit={region.whyVisit}
                      heroImageUrl={region.heroImageUrl}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        );
      })()}

      {/* 7. Plan Your Trip — Accommodation Cards + Quick Links */}
      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold">
              Plan Your Wine Country Trip
            </h2>
            <div className="flex gap-4 text-sm font-medium">
              <Link href="/where-to-stay" className="text-[var(--foreground)] hover:underline">
                All hotels &rarr;
              </Link>
              <Link href="/itineraries" className="text-[var(--foreground)] hover:underline">
                Itineraries &rarr;
              </Link>
            </div>
          </div>

          {topAccommodations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {topAccommodations.map((a) => (
                <AccommodationCard
                  key={a.slug}
                  accommodation={a}
                  showBookingCTA
                  sourceComponent="HomepageFeatured"
                />
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/wineries"
              className="group flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 hover:shadow-md hover:border-burgundy-300 dark:hover:border-burgundy-700 transition-all"
            >
              <Wine className="h-6 w-6 text-burgundy-600 shrink-0" />
              <div>
                <p className="font-semibold group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors">
                  Browse Wineries
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {totalWineries} wineries with tastings & ratings
                </p>
              </div>
            </Link>
            <Link
              href="/where-to-stay"
              className="group flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 hover:shadow-md hover:border-burgundy-300 dark:hover:border-burgundy-700 transition-all"
            >
              <BedDouble className="h-6 w-6 text-burgundy-600 shrink-0" />
              <div>
                <p className="font-semibold group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors">
                  Where to Stay
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Hand-picked hotels & resorts
                </p>
              </div>
            </Link>
            <Link
              href="/itineraries"
              className="group flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 hover:shadow-md hover:border-burgundy-300 dark:hover:border-burgundy-700 transition-all"
            >
              <Route className="h-6 w-6 text-burgundy-600 shrink-0" />
              <div>
                <p className="font-semibold group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors">
                  Plan a Trip
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Build your winery route
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Your Guide to Wine Country — Free Guide featured + Guide Cards */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-heading text-2xl font-bold">Your Guide to Wine Country</h2>
          <Link
            href="/guides"
            className="text-sm font-medium text-[var(--foreground)] hover:underline"
          >
            All guides &rarr;
          </Link>
        </div>
        <p className="text-sm text-[var(--muted-foreground)] mb-8">
          Whether it&apos;s a first sip or a fiftieth visit — the right guide makes all the difference.
        </p>

        {/* 5 guide cards in a grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
          {guides.map((g) => (
            <GuideCard
              key={g.slug}
              slug={g.slug}
              label={g.label}
              intro={g.intro}
              icon={g.icon}
              heroImage={g.heroImage}
              href={(g as { href?: string }).href}
            />
          ))}
        </div>
      </section>

      {/* 9. From the Blog */}
      {blogPosts.length > 0 && (
        <section className="border-t border-[var(--border)]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-heading text-2xl font-bold">From the Blog</h2>
              <Link
                href="/blog"
                className="text-sm font-medium text-[var(--foreground)] hover:underline"
              >
                Read all posts &rarr;
              </Link>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mb-8">
              Stories, seasonal guides, and insider knowledge from wine country.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-lg bg-burgundy-900 px-6 py-3 text-sm font-semibold text-white hover:bg-burgundy-800 transition-colors"
              >
                Read All Posts
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

    </>
  );
}
