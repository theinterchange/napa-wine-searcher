/**
 * Catch-all route for the dog-friendly hotels category cluster.
 *
 *   /dog-friendly-hotels                → hub (all dog-friendly hotels)
 *   /dog-friendly-hotels/napa-valley    → Napa spoke
 *   /dog-friendly-hotels/sonoma-county  → Sonoma spoke
 *
 * No subregion spokes — not enough hotels per subregion.
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AccommodationCategoryLayout } from "@/components/category/AccommodationCategoryLayout";
import {
  getAccommodationCategoryListings,
  getAccommodationHeroImage,
  type Valley,
} from "@/lib/category-data";
import {
  getAccommodationCategoryMeta,
  getAccommodationCategoryDeck,
} from "@/lib/accommodation-category-content";
import { BASE_URL } from "@/lib/constants";

const AMENITY = "dog" as const;
const ROOT_PATH = "/dog-friendly-hotels";

type AccommodationScope = { kind: "hub" } | { kind: "valley"; valley: Valley };

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

function resolveScope(
  slugSegments: string[] | undefined
): AccommodationScope | null {
  if (!slugSegments || slugSegments.length === 0) {
    return { kind: "hub" };
  }
  if (slugSegments.length > 1) return null;
  if (slugSegments[0] === "napa-valley") return { kind: "valley", valley: "napa" };
  if (slugSegments[0] === "sonoma-county") return { kind: "valley", valley: "sonoma" };
  return null;
}

function pathFor(scope: AccommodationScope): string {
  if (scope.kind === "hub") return ROOT_PATH;
  return `${ROOT_PATH}/${scope.valley === "napa" ? "napa-valley" : "sonoma-county"}`;
}

export function generateStaticParams() {
  return [
    { slug: [] },
    { slug: ["napa-valley"] },
    { slug: ["sonoma-county"] },
  ];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const scope = resolveScope(slug);
  if (!scope) return {};

  const meta = getAccommodationCategoryMeta(AMENITY, scope);
  if (!meta) return {};

  const url = `${BASE_URL}${pathFor(scope)}`;
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: url },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url,
      siteName: "Napa Sonoma Guide",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function DogFriendlyHotelsPage({ params }: PageProps) {
  const { slug } = await params;
  const scope = resolveScope(slug);
  if (!scope) notFound();

  const meta = getAccommodationCategoryMeta(AMENITY, scope);
  const deck = getAccommodationCategoryDeck(AMENITY, scope);
  if (!meta || !deck) notFound();

  const valley = scope.kind === "valley" ? scope.valley : null;
  const accommodations = await getAccommodationCategoryListings(AMENITY, valley);

  const hero = getAccommodationHeroImage(accommodations);

  return (
    <AccommodationCategoryLayout
      amenity={AMENITY}
      scope={scope}
      meta={meta}
      deck={deck}
      hero={hero}
      accommodations={accommodations}
    />
  );
}
