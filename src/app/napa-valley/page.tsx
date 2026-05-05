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

  const placeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: "Napa Valley",
    description: content.metaDescription,
    url: `${BASE_URL}/napa-valley`,
    geo: {
      "@type": "GeoCoordinates",
      latitude: 38.5025,
      longitude: -122.2654,
    },
    containedInPlace: {
      "@type": "Place",
      name: "California, United States",
    },
  };

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Napa Valley", href: "/napa-valley" },
        ]}
      />
      <FAQSchema faqs={content.faq} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placeJsonLd) }}
      />

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
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
        <div className="border-b border-[var(--rule)] pb-4 mb-8">
          <span className="kicker">N° 01 / The Region</span>
          <h2 className="editorial-h2 text-[28px] sm:text-[34px] lg:text-[40px] mt-2">
            What makes Napa <em>special.</em>
          </h2>
        </div>
        <div className="max-w-3xl space-y-5 font-[var(--font-serif-text)] text-[17px] leading-[1.7] text-[var(--ink-2)]">
          {content.editorial.map((p, i) => (
            <p key={i} className={i === 0 ? "drop-cap-editorial" : ""} style={{ textWrap: "pretty" }}>{p}</p>
          ))}
        </div>
      </section>

      {/* 3. Top Wineries */}
      <section className="border-t border-[var(--rule-soft)]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
          <div className="border-b border-[var(--rule)] pb-4 mb-8 flex items-end justify-between gap-4">
            <div>
              <span className="kicker">N° 02 / The Wineries</span>
              <h2 className="editorial-h2 text-[28px] sm:text-[34px] lg:text-[40px] mt-2">
                Top-rated <em>estates.</em>
              </h2>
              <p className="mt-3 font-[var(--font-serif-text)] text-[15px] text-[var(--ink-2)]">
                The highest-rated wineries across all Napa Valley sub-regions.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {overview.topWineries.map((w) => (
              <WineryCard key={w.slug} winery={w} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/wineries?valley=napa"
              className="inline-flex items-center gap-2 bg-[var(--ink)] px-6 py-3.5 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-white hover:bg-[var(--brass-2)] transition-colors"
            >
              View all Napa wineries →
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Explore Sub-Regions — RegionCards with images + editorial */}
      <section className="border-t border-[var(--rule-soft)] bg-[var(--paper-2)]/40">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
          <div className="border-b border-[var(--rule)] pb-4 mb-8">
            <span className="kicker">N° 03 / Sub-AVAs</span>
            <h2 className="editorial-h2 text-[28px] sm:text-[34px] lg:text-[40px] mt-2">
              Region by <em>region.</em>
            </h2>
            <p className="mt-3 font-[var(--font-serif-text)] text-[15px] text-[var(--ink-2)] max-w-2xl" style={{ textWrap: "pretty" }}>
              From the cool, fog-kissed Carneros in the south to the sun-drenched slopes of Calistoga in the north.
            </p>
          </div>
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
        <section className="border-t border-[var(--rule-soft)]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
            <div className="border-b border-[var(--rule)] pb-4 mb-8">
              <span className="kicker">N° 04 / Varietals</span>
              <h2 className="editorial-h2 text-[28px] sm:text-[34px] lg:text-[40px] mt-2">
                Popular <em>varietals.</em>
              </h2>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {varietals.map((v) => (
                <Link
                  key={v.name}
                  href={`/wineries?valley=napa&varietal=${slugify(v.name)}`}
                  className="inline-flex items-center gap-2 border border-[var(--rule)] bg-[var(--paper)] px-4 py-2 font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--ink-2)] hover:border-[var(--brass)] hover:text-[var(--ink)] transition-colors"
                >
                  <Grape className="h-3.5 w-3.5 text-[var(--brass)]" />
                  {v.name}
                  <span className="font-[var(--font-serif-text)] normal-case tracking-normal text-[12px] text-[var(--ink-3)]">
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
        <section className="border-t border-[var(--rule-soft)]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
            <div className="border-b border-[var(--rule)] pb-4 mb-8 flex items-end justify-between gap-4">
              <div>
                <span className="kicker">N° 05 / Lodging</span>
                <h2 className="editorial-h2 text-[28px] sm:text-[34px] lg:text-[40px] mt-2">
                  Where to <em>stay.</em>
                </h2>
              </div>
              <Link
                href="/where-to-stay/napa-valley"
                className="hidden sm:inline-flex items-center gap-1 font-mono text-[10.5px] tracking-[0.18em] uppercase text-[var(--ink-2)] hover:text-[var(--brass-2)] transition-colors"
              >
                All Napa hotels →
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
      <section className="border-t border-[var(--rule-soft)]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
          <div className="border-b border-[var(--rule)] pb-4 mb-8">
            <span className="kicker">N° 06 / The Plan</span>
            <h2 className="editorial-h2 text-[28px] sm:text-[34px] lg:text-[40px] mt-2">
              Plan your <em>visit.</em>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-[var(--rule-soft)] bg-[var(--paper-2)]/40 p-5">
              <Calendar className="h-4 w-4 text-[var(--brass)] mb-3" />
              <span className="kicker">Best Time</span>
              <p className="mt-2 font-[var(--font-serif-text)] text-[13.5px] leading-[1.5] text-[var(--ink-2)]">{content.bestTimeToVisit}</p>
            </div>
            <div className="border border-[var(--rule-soft)] bg-[var(--paper-2)]/40 p-5">
              <Grape className="h-4 w-4 text-[var(--brass)] mb-3" />
              <span className="kicker">Tasting Prices</span>
              <p className="mt-2 font-[var(--font-serif-text)] text-[13.5px] leading-[1.5] text-[var(--ink-2)]">
                ${overview.tastingPriceRange.min} – ${overview.tastingPriceRange.max} per tasting
              </p>
            </div>
            <div className="border border-[var(--rule-soft)] bg-[var(--paper-2)]/40 p-5">
              <Dog className="h-4 w-4 text-[var(--brass)] mb-3" />
              <span className="kicker">Dog-Friendly</span>
              <p className="mt-2 font-[var(--font-serif-text)] text-[13.5px] leading-[1.5] text-[var(--ink-2)]">
                {overview.amenities.dogFriendlyCount} wineries welcome dogs
              </p>
            </div>
            <div className="border border-[var(--rule-soft)] bg-[var(--paper-2)]/40 p-5">
              <Baby className="h-4 w-4 text-[var(--brass)] mb-3" />
              <span className="kicker">Kid-Friendly</span>
              <p className="mt-2 font-[var(--font-serif-text)] text-[13.5px] leading-[1.5] text-[var(--ink-2)]">
                {overview.amenities.kidFriendlyCount} family-friendly options
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/itineraries"
              className="inline-flex items-center gap-2 border border-[var(--ink)] px-5 py-2.5 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)] transition-colors"
            >
              Browse Itineraries
            </Link>
            <Link
              href="/itineraries/build?valley=napa"
              className="inline-flex items-center gap-2 border border-[var(--ink)] px-5 py-2.5 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)] transition-colors"
            >
              Build Custom Route
            </Link>
          </div>
        </div>
      </section>

      {/* 8. From the Blog */}
      {blogPosts.length > 0 && (
        <section className="border-t border-[var(--rule-soft)]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
            <div className="border-b border-[var(--rule)] pb-4 mb-8 flex items-end justify-between gap-4">
              <div>
                <span className="kicker">N° 07 / Dispatches</span>
                <h2 className="editorial-h2 text-[28px] sm:text-[34px] lg:text-[40px] mt-2">
                  From the <em>blog.</em>
                </h2>
                <p className="mt-3 font-[var(--font-serif-text)] text-[15px] text-[var(--ink-2)]">
                  Stories, seasonal guides, and insider knowledge from wine country.
                </p>
              </div>
              <Link
                href="/blog"
                className="hidden sm:inline-flex items-center gap-1 font-mono text-[10.5px] tracking-[0.18em] uppercase text-[var(--ink-2)] hover:text-[var(--brass-2)] transition-colors"
              >
                Read all posts →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 9. FAQ */}
      <section className="border-t border-[var(--rule-soft)] bg-[var(--paper-2)]/40">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
          <div className="border-b border-[var(--rule)] pb-4 mb-2">
            <span className="kicker inline-flex items-center gap-1.5">
              <HelpCircle className="h-3 w-3 text-[var(--brass)]" />
              N° 08 / FAQ
            </span>
            <h2 className="editorial-h2 text-[26px] sm:text-[32px] mt-2">
              Frequently <em>asked.</em>
            </h2>
          </div>
          <FAQSection faqs={content.faq} />
        </div>
      </section>
    </>
  );
}
