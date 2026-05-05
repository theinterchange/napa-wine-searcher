import Link from "next/link";
import Image from "next/image";
import {
  Wine,
  DollarSign,
  ArrowLeftRight,
  Heart,
  Sparkles,
  MapPin,
  Dog,
  Baby,
  Leaf,
} from "lucide-react";
import { getAllGuides, getGuideBySlug } from "@/lib/guide-content";
import {
  getWineriesByAmenity,
  getWineriesByExperience,
  getWineriesByTastingPrice,
} from "@/lib/guide-data";
import {
  getCategoryWineries,
  getCategoryHeroImage,
  getQualifyingSubregions,
  displaySubRegionName,
  type WineryAmenity,
} from "@/lib/category-data";
import { GuideCard } from "@/components/home/GuideCard";
import type { Metadata } from "next";

import { BASE_URL } from "@/lib/constants";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Wine Country Guides | Napa Sonoma Guide",
  description:
    "Curated guides to Napa Valley and Sonoma County wineries — by amenity, varietal, price, experience, and region comparison.",
  openGraph: {
    title: "Wine Country Guides | Napa Sonoma Guide",
    description:
      "Curated guides to Napa Valley and Sonoma County wineries — by amenity, varietal, price, experience, and region comparison.",
    url: `${BASE_URL}/guides`,
    siteName: "Napa Sonoma Guide",
    type: "website",
  },
};

// Meta shared by guide-type sections (populated from allGuides)
const GUIDE_TYPE_META: Record<
  string,
  { label: string; icon: React.ReactNode; description: string; hero: string }
> = {
  amenity: {
    label: "By Amenity",
    icon: <MapPin className="h-5 w-5" />,
    description: "Picnic grounds and walk-in tasting rooms across Napa and Sonoma.",
    hero: "/images/blog/napa-spring-hero.jpg",
  },
  varietal: {
    label: "By Varietal",
    icon: <Wine className="h-5 w-5" />,
    description:
      "Find the best wineries for Cabernet Sauvignon, Pinot Noir, Chardonnay, and more.",
    hero: "/images/blog/napa-avas-hero.jpg",
  },
  price: {
    label: "By Price",
    icon: <DollarSign className="h-5 w-5" />,
    description:
      "Free tastings, budget-friendly options under $40, and luxury experiences worth every dollar.",
    hero: "/images/blog/budget-wine-tasting-hero.jpg",
  },
  experience: {
    label: "Experiences",
    icon: <Heart className="h-5 w-5" />,
    description:
      "Group celebrations and first-time visitor itineraries — where to go based on the kind of day you're planning.",
    hero: "/images/blog/wineries-for-groups-hero.jpg",
  },
  comparison: {
    label: "Region Comparisons",
    icon: <ArrowLeftRight className="h-5 w-5" />,
    description:
      "Side-by-side data on wineries, prices, ratings, and varietals across regions.",
    hero: "/images/blog/sonoma-hidden-gems-hero.jpg",
  },
};

// Cluster sections — label/icon/copy for each amenity
const CLUSTER_META: Record<
  WineryAmenity,
  { label: string; icon: React.ReactNode; description: string; root: string }
> = {
  dog: {
    label: "Dog-Friendly Wineries",
    icon: <Dog className="h-5 w-5" />,
    description:
      "Outdoor patios, leashed welcomes, and hosts who stock a water bowl behind the bar.",
    root: "/dog-friendly-wineries",
  },
  kid: {
    label: "Kid-Friendly Wineries",
    icon: <Baby className="h-5 w-5" />,
    description:
      "Family-welcoming wineries with space to roam, grape juice tastings, and relaxed hosts.",
    root: "/kid-friendly-wineries",
  },
  sustainable: {
    label: "Sustainable Wineries",
    icon: <Leaf className="h-5 w-5" />,
    description:
      "Organic, biodynamic, and regenerative producers — wines made with care for the land.",
    root: "/sustainable-wineries",
  },
};

// Analytics-driven order: proven performers first (28d GSC), new clusters in
// a fair middle slot, weakest guide sections last. Revisit after 3–4 weeks
// of cluster data accumulates.
const SECTION_ORDER: Array<
  | { kind: "guide"; key: "amenity" | "varietal" | "price" | "experience" | "comparison" }
  | { kind: "cluster"; key: WineryAmenity }
> = [
  { kind: "guide", key: "price" },
  { kind: "guide", key: "comparison" },
  { kind: "guide", key: "varietal" },
  { kind: "cluster", key: "dog" },
  { kind: "cluster", key: "kid" },
  { kind: "cluster", key: "sustainable" },
  { kind: "guide", key: "amenity" },
  { kind: "guide", key: "experience" },
];

// Pull a hero image from the top-ranked winery matching each filter.
// Used for Popular Guides cards without a bespoke blog image, and for
// cluster section heroes.
async function getFeaturedHeroFallbacks() {
  const [firstTimeSonoma, luxuryNapa, picnicNapa] = await Promise.all([
    getWineriesByExperience("first-time", "sonoma"),
    getWineriesByTastingPrice("luxury", "napa"),
    getWineriesByAmenity("picnicFriendly", "napa"),
  ]);

  const firstWithHero = (rows: Array<{ heroImageUrl: string | null }>) =>
    rows.find((w) => w.heroImageUrl)?.heroImageUrl ?? null;

  return {
    firstTimeSonoma: firstWithHero(firstTimeSonoma),
    luxuryNapa: firstWithHero(luxuryNapa),
    picnicNapa: firstWithHero(picnicNapa),
  };
}

// One query per cluster: top-ranked winery's hero photo for the section band
async function getClusterHeroes() {
  const [dog, kid, sustainable] = await Promise.all([
    getCategoryWineries("dog", { kind: "hub" }),
    getCategoryWineries("kid", { kind: "hub" }),
    getCategoryWineries("sustainable", { kind: "hub" }),
  ]);
  return {
    dog: getCategoryHeroImage(dog)?.url ?? null,
    kid: getCategoryHeroImage(kid)?.url ?? null,
    sustainable: getCategoryHeroImage(sustainable)?.url ?? null,
  };
}

async function getClusterSubregions() {
  const [dog, kid, sustainable] = await Promise.all([
    getQualifyingSubregions("dog"),
    getQualifyingSubregions("kid"),
    getQualifyingSubregions("sustainable"),
  ]);
  return { dog, kid, sustainable };
}

// Intro fallbacks for category-cluster cards in Popular Guides
const FEATURED_CLUSTER_INTROS: Record<string, string> = {
  "dog-friendly-wineries":
    "Outdoor patios, leashed welcomes, and vineyards where your pup fits right in.",
  "kid-friendly-wineries":
    "Family-welcoming wineries with space to roam, grape juice tastings, and relaxed hosts.",
  "sustainable-wineries":
    "Organic, biodynamic, and regenerative producers — wines made with care for the land.",
};

type CardData = { slug: string; title: string; href: string; intro: string };

function buildClusterCards(
  amenity: WineryAmenity,
  subregions: Array<{ slug: string; name: string; valley: "napa" | "sonoma" }>,
): CardData[] {
  const meta = CLUSTER_META[amenity];
  const cards: CardData[] = [
    {
      slug: `${amenity}-hub`,
      title: `All ${meta.label}`,
      href: meta.root,
      intro: "Every qualifying winery across Napa Valley and Sonoma County.",
    },
    {
      slug: `${amenity}-napa`,
      title: `${meta.label} in Napa Valley`,
      href: `${meta.root}/napa-valley`,
      intro: `${meta.label} across Napa Valley — sortable by ranking and region.`,
    },
    {
      slug: `${amenity}-sonoma`,
      title: `${meta.label} in Sonoma County`,
      href: `${meta.root}/sonoma-county`,
      intro: `${meta.label} across Sonoma County — from the Russian River to the Mayacamas.`,
    },
  ];
  for (const sr of subregions) {
    const name = displaySubRegionName(sr.name);
    cards.push({
      slug: `${amenity}-${sr.slug}`,
      title: `${meta.label} in ${name}`,
      href: `${meta.root}/${sr.slug}`,
      intro: `${meta.label} in ${name} — the qualifying estates and what to expect.`,
    });
  }
  return cards;
}

export default async function GuidesPage() {
  const allGuides = getAllGuides();
  const [fallbacks, clusterHeroes, clusterSubregions] = await Promise.all([
    getFeaturedHeroFallbacks(),
    getClusterHeroes(),
    getClusterSubregions(),
  ]);

  const featuredGuides = [
    {
      slug: "first-time-guide-napa-valley",
      label: "First Time in Napa Valley",
      icon: Sparkles,
      heroImage: "/images/blog/napa-first-time-hero.jpg",
    },
    {
      slug: "first-time-guide-sonoma-county",
      label: "First Time in Sonoma County",
      icon: Sparkles,
      heroImage: fallbacks.firstTimeSonoma,
    },
    {
      slug: "napa-valley-vs-sonoma-county",
      label: "Napa vs Sonoma",
      icon: ArrowLeftRight,
      heroImage: "/images/blog/napa-vs-sonoma-hero.jpg",
    },
    {
      slug: "luxury-wine-tasting-experiences-napa-valley",
      label: "Luxury Wine Tasting",
      icon: DollarSign,
      heroImage: fallbacks.luxuryNapa,
    },
    {
      slug: "dog-friendly-wineries",
      label: "Dog-Friendly Wineries",
      icon: Dog,
      heroImage: "/images/blog/dog-friendly-wineries-hero.jpg",
      href: "/dog-friendly-wineries",
    },
    {
      slug: "kid-friendly-wineries",
      label: "Kid-Friendly Wineries",
      icon: Baby,
      heroImage: "/images/blog/wine-country-kids-hero.jpg",
      href: "/kid-friendly-wineries",
    },
    {
      slug: "sustainable-wineries",
      label: "Sustainable Wineries",
      icon: Leaf,
      heroImage: "/images/blog/beyond-tasting-room-hero.jpg",
      href: "/sustainable-wineries",
    },
    {
      slug: "picnic-wineries-napa-valley",
      label: "Picnic-Friendly Wineries",
      icon: MapPin,
      heroImage: fallbacks.picnicNapa,
    },
  ];

  const featuredGuidesData = featuredGuides.map((config) => {
    const guide = getGuideBySlug(config.slug);
    const intro =
      guide?.intro?.[0] ?? FEATURED_CLUSTER_INTROS[config.slug] ?? "";
    return { ...config, intro };
  });

  // Build rendered sections in the final analytics-driven order
  const renderedSections = SECTION_ORDER.map((entry) => {
    if (entry.kind === "guide") {
      const meta = GUIDE_TYPE_META[entry.key];
      const cards: CardData[] = allGuides
        .filter((g) => g.type === entry.key)
        .map((g) => ({
          slug: g.slug,
          title: g.h1,
          href: `/guides/${g.slug}`,
          intro: g.intro[0]?.slice(0, 90) ?? "",
        }));
      return { key: entry.key, meta, heroImage: meta.hero, cards };
    }
    // cluster
    const meta = CLUSTER_META[entry.key];
    const heroImage =
      clusterHeroes[entry.key] ?? "/images/blog/dog-friendly-wineries-hero.jpg";
    const cards = buildClusterCards(entry.key, clusterSubregions[entry.key]);
    return {
      key: `cluster-${entry.key}`,
      meta: { label: meta.label, icon: meta.icon, description: meta.description },
      heroImage,
      cards,
    };
  }).filter((s) => s.cards.length > 0);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Wine Country Guides",
    description:
      "Curated guides to Napa Valley and Sonoma County wineries — by amenity, varietal, price, experience, and region comparison.",
    url: `${BASE_URL}/guides`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: allGuides.map((guide, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${BASE_URL}/guides/${guide.slug}`,
        name: guide.h1,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* Editorial Hero */}
      <section className="border-b border-[var(--rule)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <span className="kicker">The Library · Wine country, indexed</span>
          <h1 className="editorial-h2 text-[36px] sm:text-[48px] mt-3">
            Curated <em>guides.</em>
          </h1>
          <p className="font-[var(--font-serif-text)] text-[17px] leading-[1.5] text-[var(--ink-2)] mt-4 max-w-[55ch]">
            Curated routes through Napa and Sonoma — by region, varietal,
            budget, or style. Every guide built from verified winery data.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Featured Guides — visual picks at top */}
        <div className="mb-14">
          <header className="mb-6">
            <span className="kicker">Popular</span>
            <h2 className="editorial-h2 text-[26px] sm:text-[32px] mt-2">
              Where most readers <em>start.</em>
            </h2>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredGuidesData.map((g) => (
              <GuideCard
                key={g.slug}
                slug={g.slug}
                label={g.label}
                intro={g.intro}
                icon={g.icon}
                heroImage={g.heroImage}
                href={g.href}
              />
            ))}
          </div>
        </div>

        {/* All sections (guide types + clusters) in analytics-driven order */}
        <div className="space-y-14">
          {renderedSections.map(({ key, meta, heroImage, cards }) => (
            <section key={key}>
              {/* Section header — editorial flat */}
              <header className="mb-5 pb-4 border-b border-[var(--rule)]">
                <div className="flex items-center gap-2 text-[var(--brass-2)]">
                  {meta.icon}
                  <span className="kicker">{meta.label}</span>
                </div>
                <p className="font-[var(--font-serif-text)] text-[15px] leading-relaxed text-[var(--ink-2)] mt-2 max-w-[60ch]">
                  {meta.description}
                </p>
              </header>
              {/* Decorative section thumbnail (small, flat) */}
              <div className="photo-zoom relative h-28 sm:h-32 mb-5 overflow-hidden">
                <Image
                  src={heroImage}
                  alt=""
                  fill
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  className="object-cover"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cards.map((card) => (
                  <Link
                    key={card.slug}
                    href={card.href}
                    className="group bg-[var(--paper-2)] border-t-2 border-[var(--rule)] hover:border-[var(--brass)] px-4 py-3.5 transition-colors"
                  >
                    <h3 className="font-[var(--font-heading)] text-[17px] leading-tight text-[var(--ink)] group-hover:text-[var(--color-burgundy-900)] transition-colors">
                      {card.title}
                    </h3>
                    {card.intro && (
                      <p className="mt-1.5 text-[13px] text-[var(--ink-3)] line-clamp-2">
                        {card.intro}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
