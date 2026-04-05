import Link from "next/link";
import { Dog, Wine, DollarSign, ArrowLeftRight, Heart, Sparkles } from "lucide-react";
import { getAllGuides, getGuideBySlug } from "@/lib/guide-content";
import { GuideCard } from "@/components/home/GuideCard";
import type { Metadata } from "next";

import { BASE_URL } from "@/lib/constants";

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

const TYPE_META: Record<
  string,
  { label: string; icon: React.ReactNode; description: string }
> = {
  amenity: {
    label: "By Amenity",
    icon: <Dog className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400" />,
    description: "Dog-friendly patios, kid-welcoming estates, picnic grounds, and walk-in tasting rooms.",
  },
  varietal: {
    label: "By Varietal",
    icon: <Wine className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400" />,
    description: "Find the best wineries for Cabernet Sauvignon, Pinot Noir, Chardonnay, and more.",
  },
  price: {
    label: "By Price",
    icon: <DollarSign className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400" />,
    description: "Free tastings, budget-friendly options under $40, and luxury experiences worth every dollar.",
  },
  experience: {
    label: "Experiences",
    icon: <Heart className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400" />,
    description: "Romantic escapes, group celebrations, and first-time visitor itineraries.",
  },
  comparison: {
    label: "Region Comparisons",
    icon: <ArrowLeftRight className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400" />,
    description: "Side-by-side data on wineries, prices, ratings, and varietals across regions.",
  },
};

const TYPE_ORDER = ["amenity", "varietal", "price", "experience", "comparison"];

// Featured guides with hero images for the top section
const FEATURED_GUIDES = [
  {
    slug: "first-time-guide-napa-valley",
    label: "First Time in Napa Valley",
    icon: Sparkles,
    heroImage: "/images/blog/napa-first-time-hero.jpg",
  },
  {
    slug: "dog-friendly-wineries-napa-valley",
    label: "Dog-Friendly Wineries",
    icon: Dog,
    heroImage: "/images/blog/dog-friendly-wineries-hero.jpg",
  },
  {
    slug: "cheap-wine-tastings-napa-valley",
    label: "Budget Tastings",
    icon: DollarSign,
    heroImage: "/images/blog/budget-wine-tasting-hero.jpg",
  },
  {
    slug: "napa-valley-vs-sonoma-county",
    label: "Napa vs Sonoma",
    icon: ArrowLeftRight,
    heroImage: "/images/blog/napa-vs-sonoma-hero.jpg",
  },
];

export default function GuidesPage() {
  const allGuides = getAllGuides();

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    meta: TYPE_META[type],
    guides: allGuides.filter((g) => g.type === type),
  })).filter((g) => g.guides.length > 0);

  const featuredGuidesData = FEATURED_GUIDES.map((config) => {
    const guide = getGuideBySlug(config.slug);
    return {
      ...config,
      intro: guide?.intro?.[0] ?? "",
    };
  });

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
      <section className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold">
            Wine Country Guides
          </h1>
          <p className="mt-3 text-[var(--muted-foreground)] max-w-2xl leading-relaxed">
            Everything needed to plan the perfect wine country visit — whether
            searching by region, varietal, budget, or style. Each guide is built
            from verified winery data and local knowledge.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Featured Guides — visual picks at top */}
        <div className="mb-12">
          <h2 className="font-heading text-xl font-bold mb-6">
            Popular Guides
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredGuidesData.map((g) => (
              <GuideCard
                key={g.slug}
                slug={g.slug}
                label={g.label}
                intro={g.intro}
                icon={g.icon}
                heroImage={g.heroImage}
              />
            ))}
          </div>
        </div>

        {/* All guides grouped by type */}
        <div className="space-y-12">
          {grouped.map(({ type, meta, guides }) => (
            <section key={type}>
              <div className="flex items-center gap-2 mb-2">
                {meta.icon}
                <h2 className="font-heading text-xl font-bold">{meta.label}</h2>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                {meta.description}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {guides.map((guide) => {
                  const introText = guide.intro[0]?.slice(0, 90) ?? "";
                  return (
                    <Link
                      key={guide.slug}
                      href={`/guides/${guide.slug}`}
                      className="group rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3.5 hover:border-burgundy-400 dark:hover:border-burgundy-600 hover:shadow-sm transition-all"
                    >
                      <h3 className="font-medium text-sm group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors">
                        {guide.h1}
                      </h3>
                      {introText && (
                        <p className="mt-1 text-xs text-[var(--muted-foreground)] line-clamp-2">
                          {introText}...
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
