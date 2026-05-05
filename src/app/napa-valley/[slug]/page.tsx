import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight, Grape, Route, Clock } from "lucide-react";
import { db } from "@/db";
import { wineries, subRegions } from "@/db/schema";
import { eq, desc, and, isNotNull, sql } from "drizzle-orm";
import { wineryRankingDesc } from "@/lib/winery-ranking";
import { getSubRegionDetail, getAllSubRegions } from "@/lib/region-data";
import { SUBREGION_CONTENT } from "@/lib/region-content";
import { getAllAccommodations } from "@/lib/accommodation-data";
import { WineryCard } from "@/components/directory/WineryCard";
import { RegionCard } from "@/components/home/RegionCard";
import { AccommodationCard } from "@/components/accommodation/AccommodationCard";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";

import { BASE_URL } from "@/lib/constants";

export async function generateStaticParams() {
  const regions = await getAllSubRegions("napa");
  return regions.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSubRegionDetail(slug);
  if (!data || data.region.valley !== "napa") return { title: "Not Found" };

  const content = SUBREGION_CONTENT[slug];
  const title = `${data.region.name} Wineries | Napa Valley Guide`;
  const description =
    content?.description[0]?.slice(0, 160) ??
    `Explore ${data.wineries.length} wineries in ${data.region.name}, Napa Valley.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/napa-valley/${slug}`,
      siteName: "Napa Sonoma Guide",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

async function getSiblingRegionImages(
  siblingRegions: { name: string; slug: string; count: number }[]
) {
  const top4 = siblingRegions.slice(0, 4);
  const images = await Promise.all(
    top4.map(async (sr) => {
      const [topWinery] = await db
        .select({ heroImageUrl: wineries.heroImageUrl })
        .from(wineries)
        .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
        .where(
          and(
            eq(subRegions.slug, sr.slug),
            eq(wineries.curated, true),
            isNotNull(wineries.heroImageUrl)
          )
        )
        .orderBy(wineryRankingDesc)
        .limit(1);
      return { slug: sr.slug, heroImageUrl: topWinery?.heroImageUrl ?? null };
    })
  );
  return Object.fromEntries(images.map((i) => [i.slug, i.heroImageUrl]));
}

export default async function NapaSubRegionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getSubRegionDetail(slug);
  if (!data || data.region.valley !== "napa") notFound();

  const content = SUBREGION_CONTENT[slug];

  const [accommodations, siblingImages] = await Promise.all([
    getAllAccommodations().then((all) =>
      all.filter((a) => a.valley === "napa").slice(0, 3)
    ),
    getSiblingRegionImages(data.siblingRegions),
  ]);

  // Enrich sibling regions for RegionCards
  const enrichedSiblings = data.siblingRegions.slice(0, 4).map((sr) => {
    const regionContent = SUBREGION_CONTENT[sr.slug];
    return {
      ...sr,
      heroImageUrl: siblingImages[sr.slug] ?? null,
      signatureVarietal: regionContent?.signatureVarietal ?? "Wine Country",
      whyVisit:
        regionContent?.whyVisit ??
        regionContent?.description?.[0] ??
        `Discover ${sr.count} wineries in ${sr.name}.`,
    };
  });

  const topWinery = data.wineries.find((w) => w.heroImageUrl);

  const placeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: data.region.name,
    description: content?.description[0] ?? `Explore wineries in ${data.region.name}, Napa Valley.`,
    url: `${BASE_URL}/napa-valley/${slug}`,
    containedInPlace: {
      "@type": "Place",
      name: "Napa Valley, California",
    },
  };

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Napa Valley", href: "/napa-valley" },
          { name: data.region.name, href: `/napa-valley/${slug}` },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placeJsonLd) }}
      />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 font-mono text-[10.5px] tracking-[0.16em] uppercase text-[var(--ink-3)] min-w-0"
        >
          <Link href="/" className="hover:text-[var(--ink)] transition-colors shrink-0">Home</Link>
          <ChevronRight className="h-3 w-3 text-[var(--rule)] shrink-0" aria-hidden="true" />
          <Link href="/napa-valley" className="hover:text-[var(--ink)] transition-colors shrink-0">Napa Valley</Link>
          <ChevronRight className="h-3 w-3 text-[var(--rule)] shrink-0" aria-hidden="true" />
          <span className="text-[var(--ink)] font-semibold truncate min-w-0" aria-current="page">
            {data.region.name}
          </span>
        </nav>
      </div>

      {/* Hero with next/image */}
      {topWinery?.heroImageUrl ? (
        <div className="relative bg-burgundy-900 text-white overflow-hidden">
          <Image
            src={topWinery.heroImageUrl}
            alt={`Wineries in ${data.region.name}, Napa Valley`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 pt-32 sm:pt-40 pb-8 sm:px-6 lg:px-8">
            <h1 className="font-[var(--font-heading)] text-[32px] sm:text-[40px] font-normal tracking-[-0.015em] text-[var(--ink)]">
              {data.region.name} Wineries
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/70">
              <span>{data.wineries.length} wineries to explore</span>
              {content && (
                <>
                  <span>|</span>
                  <span className="flex items-center gap-1">
                    <Grape className="h-3.5 w-3.5" />
                    Known for {content.signatureVarietal}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="font-[var(--font-heading)] text-[32px] sm:text-[40px] font-normal tracking-[-0.015em] text-[var(--ink)]">
            {data.region.name} Wineries
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[var(--muted-foreground)]">
            <span>{data.wineries.length} wineries to explore</span>
            {content && (
              <>
                <span className="text-[var(--border)]">|</span>
                <span className="flex items-center gap-1">
                  <Grape className="h-3.5 w-3.5" />
                  Known for {content.signatureVarietal}
                </span>
              </>
            )}
          </div>
        </section>
      )}

      {/* About Sub-Region */}
      {content && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="font-[var(--font-heading)] text-[26px] sm:text-[30px] font-normal tracking-[-0.01em] text-[var(--ink)] mb-4">
            About {data.region.name}
          </h2>

          {content.whyVisit && (
            <p className="font-[var(--font-serif-text)] text-[16.5px] leading-[1.7] text-[var(--ink-2)] mb-6 max-w-3xl" style={{ textWrap: "pretty" }}>
              {content.whyVisit}
            </p>
          )}

          <div className="max-w-3xl space-y-4 text-[var(--muted-foreground)] leading-relaxed">
            {content.description.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {content.topExperiences && content.topExperiences.length > 0 && (
            <div className="mt-8 max-w-3xl">
              <h3 className="font-[var(--font-heading)] text-[22px] sm:text-[24px] font-normal tracking-[-0.01em] text-[var(--ink)] mb-4">
                Top Experiences in {data.region.name}
              </h3>
              <ul className="space-y-3">
                {content.topExperiences.map((exp, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[var(--muted-foreground)]">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-burgundy-500 shrink-0" />
                    {exp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {content.insiderTip && (
            <div className="mt-8 max-w-3xl rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="text-sm font-semibold mb-2">Local Tip</h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                {content.insiderTip}
              </p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Known For</h3>
              <p className="text-sm">{content.knownFor.join(", ")}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Terroir</h3>
              <p className="text-sm">{content.terroir}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Best Time to Visit</h3>
              <p className="text-sm">{content.bestTimeToVisit}</p>
            </div>
          </div>
        </section>
      )}

      {/* Wineries — with heading */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <h2 className="font-[var(--font-heading)] text-[26px] sm:text-[30px] font-normal tracking-[-0.01em] text-[var(--ink)] mb-2">
          Wineries in {data.region.name}
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          {data.wineries.length} {data.wineries.length === 1 ? "winery" : "wineries"} to explore — sorted by rating, verified wineries first.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.wineries.map((w) => (
            <WineryCard key={w.slug} winery={w} />
          ))}
        </div>
      </section>

      {/* Day Trips */}
      {data.relatedTrips.length > 0 && (
        <section className="border-t border-[var(--border)]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="font-[var(--font-heading)] text-[26px] sm:text-[30px] font-normal tracking-[-0.01em] text-[var(--ink)] mb-6">
              Day Trips in {data.region.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.relatedTrips.map((trip) => (
                <Link
                  key={trip.slug}
                  href={`/itineraries/${trip.slug}`}
                  className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 hover:border-burgundy-400 hover:shadow-sm dark:hover:border-burgundy-600 transition-all"
                >
                  <Route className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-[var(--font-heading)] text-[14px] font-normal group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors line-clamp-1">
                      {trip.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                      {trip.theme && (
                        <span className="rounded-full bg-burgundy-50 dark:bg-burgundy-950 px-2 py-0.5 text-burgundy-700 dark:text-burgundy-300">
                          {trip.theme}
                        </span>
                      )}
                      {trip.estimatedHours && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {trip.estimatedHours}h
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Where to Stay */}
      {accommodations.length > 0 && (
        <section className="border-t border-[var(--border)]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-[var(--font-heading)] text-[26px] sm:text-[30px] font-normal tracking-[-0.01em] text-[var(--ink)]">
                Where to Stay Near {data.region.name}
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
                <AccommodationCard key={a.slug} accommodation={a} showBookingCTA />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Explore More — RegionCards */}
      {enrichedSiblings.length > 0 && (
        <section className="border-t border-[var(--border)] bg-[var(--muted)]/30">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="font-[var(--font-heading)] text-[26px] sm:text-[30px] font-normal tracking-[-0.01em] text-[var(--ink)] mb-2">
              Explore More of Napa Valley
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-8">
              Discover neighboring regions, each with its own character and wines.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {enrichedSiblings.map((sr) => (
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
      )}
    </>
  );
}
