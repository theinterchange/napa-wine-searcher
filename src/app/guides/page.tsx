import Link from "next/link";
import { BookOpen, Dog, Baby, UtensilsCrossed, DoorOpen, Wine, DollarSign, ArrowLeftRight, Heart } from "lucide-react";
import { getAllGuides } from "@/lib/guide-content";
import type { Metadata } from "next";

import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Wine Country Guides | Napa Sonoma Guide",
  description:
    "Browse our collection of guides to Napa Valley and Sonoma County wineries — by amenity, varietal, price, and more.",
  openGraph: {
    title: "Wine Country Guides | Napa Sonoma Guide",
    description:
      "Browse our collection of guides to Napa Valley and Sonoma County wineries — by amenity, varietal, price, and more.",
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
    description: "Find wineries by dog-friendly, kid-friendly, picnic-friendly, and walk-in options.",
  },
  varietal: {
    label: "By Varietal",
    icon: <Wine className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400" />,
    description: "Discover wineries known for specific grape varieties.",
  },
  price: {
    label: "By Price",
    icon: <DollarSign className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400" />,
    description: "Find tastings and wines that fit your budget.",
  },
  experience: {
    label: "Experiences",
    icon: <Heart className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400" />,
    description: "Find the perfect wineries for romantic outings, group celebrations, and first-time visitors.",
  },
  comparison: {
    label: "Region Comparisons",
    icon: <ArrowLeftRight className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400" />,
    description: "Compare wine regions side-by-side to plan your visit.",
  },
};

const TYPE_ORDER = ["amenity", "varietal", "price", "experience", "comparison"];

export default function GuidesPage() {
  const allGuides = getAllGuides();

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    meta: TYPE_META[type],
    guides: allGuides.filter((g) => g.type === type),
  })).filter((g) => g.guides.length > 0);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Wine Country Guides",
    description:
      "Browse our collection of guides to Napa Valley and Sonoma County wineries — by amenity, varietal, price, and more.",
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-burgundy-600" />
          Wine Country Guides
        </h1>
        <p className="mt-3 text-[var(--muted-foreground)] max-w-2xl">
          Curated guides to help you find the perfect Napa Valley and Sonoma
          County wineries for your visit.
        </p>
      </div>

      <div className="space-y-12">
        {grouped.map(({ type, meta, guides }) => (
          <section key={type}>
            <div className="flex items-center gap-2 mb-4">
              {meta.icon}
              <h2 className="font-heading text-xl font-bold">{meta.label}</h2>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              {meta.description}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {guides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/guides/${guide.slug}`}
                  className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 hover:border-burgundy-400 dark:hover:border-burgundy-600 transition-colors"
                >
                  <h3 className="font-medium text-sm">{guide.h1}</h3>
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
