import Link from "next/link";
import type { Metadata } from "next";
import { Grape, Dog, Baby, Calendar, HelpCircle } from "lucide-react";
import { db } from "@/db";
import { wineries, subRegions } from "@/db/schema";
import { eq, desc, and, isNotNull } from "drizzle-orm";
import { wineryRankingDesc } from "@/lib/winery-ranking";
import { getValleyOverview, getTopVarietals } from "@/lib/region-data";
import { VALLEY_CONTENT, SUBREGION_CONTENT } from "@/lib/region-content";
import { getAllAccommodations } from "@/lib/accommodation-data";
import { getAllPosts } from "@/lib/blog";
import { WineryCard } from "@/components/directory/WineryCard";
import { ValleyHero } from "@/components/region/ValleyHero";
import { RegionCard } from "@/components/home/RegionCard";
import { AccommodationCard } from "@/components/accommodation/AccommodationCard";
import { BlogCard } from "@/components/blog/BlogCard";
import { FAQSection } from "@/components/region/FAQSection";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import { FAQSchema } from "@/components/seo/FAQSchema";
import { slugify } from "@/lib/utils";
import { BASE_URL } from "@/lib/constants";

const content = VALLEY_CONTENT.napa;

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
  openGraph: {
    title: content.metaTitle,
    description: content.metaDescription,
    url: `${BASE_URL}/napa-valley`,
    siteName: "Napa Sonoma Guide",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: content.metaTitle,
    description: content.metaDescription,
  },
  alternates: {
    canonical: `${BASE_URL}/napa-valley`,
  },
};

async function getValleyHeroImage() {
  const [topWinery] = await db
    .select({ heroImageUrl: wineries.heroImageUrl })
    .from(wineries)
    .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(
      and(
        eq(subRegions.valley, "napa"),
        eq(wineries.curated, true),
        isNotNull(wineries.heroImageUrl)
      )
    )
    .orderBy(wineryRankingDesc)
    .limit(1);
  return topWinery?.heroImageUrl ?? null;
}

async function getSubRegionHeroImages(regionSlugs: string[]) {
  const images = await Promise.all(
    regionSlugs.map(async (slug) => {
      const [topWinery] = await db
        .select({ heroImageUrl: wineries.heroImageUrl })
        .from(wineries)
        .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
        .where(
          and(
            eq(subRegions.slug, slug),
            eq(wineries.curated, true),
            isNotNull(wineries.heroImageUrl)
          )
        )
        .orderBy(wineryRankingDesc)
        .limit(1);
      return { slug, heroImageUrl: topWinery?.heroImageUrl ?? null };
    })
  );
  return Object.fromEntries(images.map((i) => [i.slug, i.heroImageUrl]));
}

export default async function NapaValleyPage() {
  const [overview, varietals, heroImageUrl, accommodations, blogPosts] =
    await Promise.all([
      getValleyOverview("napa"),
      getTopVarietals("napa"),
      getValleyHeroImage(),
      getAllAccommodations().then((all) =>
        all.filter((a) => a.valley === "napa").slice(0, 3)
      ),
      Promise.resolve(getAllPosts().slice(0, 3)),
    ]);

  // Fetch hero images for all sub-regions
  const subRegionHeroImages = await getSubRegionHeroImages(
    overview.subRegions.map((sr) => sr.slug)
  );

  // Enrich sub-regions with editorial content
  const enrichedSubRegions = overview.subRegions.map((sr) => {
    const regionContent = SUBREGION_CONTENT[sr.slug];
    return {
      ...sr,
      heroImageUrl: subRegionHeroImages[sr.slug] ?? null,
      signatureVarietal: regionContent?.signatureVarietal ?? "Wine Country",
      whyVisit:
        regionContent?.whyVisit ??
        regionContent?.description?.[0] ??
        `Discover ${sr.count} wineries in ${sr.name}.`,
    };
  });

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Napa Valley", href: "/napa-valley" },
        ]}
      />
      <FAQSchema faqs={content.faq} />

      {/* 1. Hero */}
      <ValleyHero
        title={content.title}
        subtitle={content.heroSubtitle}
        wineryCount={overview.totalWineries}
        subRegionCount={overview.subRegions.length}
        valley="napa"
        heroImageUrl={heroImageUrl}
      />

      {/* 2. What Makes Napa Special — moved up for editorial tone */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-bold mb-4">
          What Makes Napa Valley Special
        </h2>
        <div className="max-w-3xl space-y-4 text-[var(--muted-foreground)] leading-relaxed">
          {content.editorial.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      {/* 3. Top Wineries */}
      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold mb-2">
            Top-Rated Napa Valley Wineries
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">
            The highest-rated wineries across all Napa Valley sub-regions.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {overview.topWineries.map((w) => (
              <WineryCard key={w.slug} winery={w} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/wineries?valley=napa"
              className="inline-flex items-center gap-2 rounded-lg bg-burgundy-900 px-6 py-3 text-sm font-semibold text-white hover:bg-burgundy-800 transition-colors"
            >
              View All Napa Wineries
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Explore Sub-Regions — RegionCards with images + editorial */}
      <section className="border-t border-[var(--border)] bg-[var(--muted)]/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold mb-2">
            Explore Napa Valley Sub-Regions
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-8">
            From the cool, fog-kissed Carneros in the south to the sun-drenched slopes of Calistoga in the north.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {enrichedSubRegions.map((sr) => (
              <RegionCard
                key={sr.slug}
                name={sr.name}
                slug={sr.slug}
                valley="napa"
                count={sr.count}
                signatureVarietal={sr.signatureVarietal}
                whyVisit={sr.whyVisit}
                heroImageUrl={sr.heroImageUrl}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Popular Varietals */}
      {varietals.length > 0 && (
        <section className="border-t border-[var(--border)]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-bold mb-6">
              Popular Varietals in Napa Valley
            </h2>
            <div className="flex flex-wrap gap-3">
              {varietals.map((v) => (
                <Link
                  key={v.name}
                  href={`/wineries?valley=napa&varietal=${slugify(v.name)}`}
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

      {/* 6. Where to Stay */}
      {accommodations.length > 0 && (
        <section className="border-t border-[var(--border)]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl font-bold">
                Where to Stay in Napa Valley
              </h2>
              <Link
                href="/where-to-stay/napa-valley"
                className="text-sm font-medium text-[var(--foreground)] hover:underline"
              >
                All Napa hotels &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {accommodations.map((a) => (
                <AccommodationCard key={a.slug} accommodation={a} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. Plan Your Visit */}
      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold mb-6">
            Plan Your Napa Valley Visit
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
              href="/plan-trip?valley=napa"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
            >
              Build Custom Route
            </Link>
          </div>
        </div>
      </section>

      {/* 8. From the Blog */}
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
          </div>
        </section>
      )}

      {/* 9. FAQ */}
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
