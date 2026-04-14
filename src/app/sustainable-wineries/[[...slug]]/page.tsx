/**
 * Catch-all route for the sustainable wineries category cluster.
 *
 *   /sustainable-wineries                       → cluster hub
 *   /sustainable-wineries/napa-valley           → Napa spoke
 *   /sustainable-wineries/sonoma-county         → Sonoma spoke
 *   /sustainable-wineries/{subregion-slug}      → subregion spoke
 *
 * Subregion spokes only render when (a) the subregion has at least 4
 * confirmed-yes wineries (gated by getQualifyingSubregions) AND (b) the
 * subregion key is present in SUSTAINABLE_META in category-content.ts.
 * Anything else returns notFound() — no thin pages.
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CategoryLandingLayout } from "@/components/category/CategoryLandingLayout";
import {
  getCategoryWineries,
  getQualifyingSubregions,
  getCategoryAccommodations,
  getCategoryHeroImage,
  type CategoryScope,
  type Valley,
} from "@/lib/category-data";
import {
  getCategoryMeta,
  getCategoryDeck,
  getCategoryHeroOverride,
  getDefinedScopes,
} from "@/lib/category-content";
import { BASE_URL } from "@/lib/constants";

const AMENITY = "sustainable" as const;
const ROOT_PATH = "/sustainable-wineries";

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

/** Resolve a URL slug array into a CategoryScope, or null if invalid. */
async function resolveScope(
  slugSegments: string[] | undefined
): Promise<CategoryScope | null> {
  if (!slugSegments || slugSegments.length === 0) {
    return { kind: "hub" };
  }
  if (slugSegments.length > 1) return null;

  const segment = slugSegments[0];
  if (segment === "napa-valley") return { kind: "valley", valley: "napa" };
  if (segment === "sonoma-county") return { kind: "valley", valley: "sonoma" };

  const qualifying = await getQualifyingSubregions(AMENITY);
  if (qualifying.some((s) => s.slug === segment)) {
    return { kind: "subregion", subRegionSlug: segment };
  }
  return null;
}

function pathFor(scope: CategoryScope): string {
  if (scope.kind === "hub") return ROOT_PATH;
  if (scope.kind === "valley") {
    return `${ROOT_PATH}/${scope.valley === "napa" ? "napa-valley" : "sonoma-county"}`;
  }
  return `${ROOT_PATH}/${scope.subRegionSlug}`;
}

export async function generateStaticParams() {
  const params: { slug: string[] }[] = [{ slug: [] }];
  params.push({ slug: ["napa-valley"] });
  params.push({ slug: ["sonoma-county"] });
  const qualifying = await getQualifyingSubregions(AMENITY);
  const definedKeys = new Set(getDefinedScopes(AMENITY));
  for (const sr of qualifying) {
    if (definedKeys.has(`subregion:${sr.slug}`)) {
      params.push({ slug: [sr.slug] });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const scope = await resolveScope(slug);
  if (!scope) return {};

  const meta = getCategoryMeta(AMENITY, scope);
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

export default async function SustainableWineriesPage({ params }: PageProps) {
  const { slug } = await params;
  const scope = await resolveScope(slug);
  if (!scope) notFound();

  const meta = getCategoryMeta(AMENITY, scope);
  const deck = getCategoryDeck(AMENITY, scope);
  if (!meta || !deck) notFound();

  const [wineries, qualifyingSubregions] = await Promise.all([
    getCategoryWineries(AMENITY, scope),
    getQualifyingSubregions(AMENITY),
  ]);

  if (scope.kind === "subregion" && wineries.length < 4) {
    notFound();
  }

  let stayValley: Valley | null = null;
  if (scope.kind === "valley") stayValley = scope.valley;
  else if (scope.kind === "subregion") {
    const sr = qualifyingSubregions.find((s) => s.slug === scope.subRegionSlug);
    if (sr) stayValley = sr.valley;
  }

  const nearbyAccommodations = await getCategoryAccommodations(
    AMENITY,
    stayValley
  );

  const hero =
    getCategoryHeroOverride(AMENITY, scope) ?? getCategoryHeroImage(wineries);

  return (
    <CategoryLandingLayout
      amenity={AMENITY}
      scope={scope}
      meta={meta}
      deck={deck}
      hero={hero}
      wineries={wineries}
      qualifyingSubregions={qualifyingSubregions}
      nearbyAccommodations={
        nearbyAccommodations as React.ComponentProps<
          typeof CategoryLandingLayout
        >["nearbyAccommodations"]
      }
    />
  );
}
