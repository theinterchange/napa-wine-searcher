import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight, Grape, Route, Clock } from "lucide-react";
import { getSubRegionDetail, getAllSubRegions } from "@/lib/region-data";
import { SUBREGION_CONTENT } from "@/lib/region-content";
import { WineryCard } from "@/components/directory/WineryCard";
import { SubRegionGrid } from "@/components/region/SubRegionGrid";
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

export default async function NapaSubRegionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getSubRegionDetail(slug);
  if (!data || data.region.valley !== "napa") notFound();

  const content = SUBREGION_CONTENT[slug];

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Napa Valley", href: "/napa-valley" },
          { name: data.region.name, href: `/napa-valley/${slug}` },
        ]}
      />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]"
        >
          <Link
            href="/"
            className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors"
          >
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <Link
            href="/napa-valley"
            className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors"
          >
            Napa Valley
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span
            className="text-[var(--foreground)] font-medium truncate"
            aria-current="page"
          >
            {data.region.name}
          </span>
        </nav>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold">
          {data.region.name} Wineries
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[var(--muted-foreground)]">
          <span>
            <strong className="text-[var(--foreground)]">
              {data.wineries.length}
            </strong>{" "}
            {data.wineries.length === 1 ? "winery" : "wineries"}
          </span>
          {content && (
            <>
              <span className="text-[var(--border)]" aria-hidden="true">
                |
              </span>
              <span className="flex items-center gap-1">
                <Grape className="h-3.5 w-3.5" />
                Known for {content.signatureVarietal}
              </span>
            </>
          )}
        </div>
      </section>

      {/* All Wineries */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.wineries.map((w) => (
            <WineryCard key={w.slug} winery={w} />
          ))}
        </div>
      </section>

      {/* About Sub-Region */}
      {content && (
        <section className="border-y border-[var(--border)] bg-[var(--muted)]/30">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-bold mb-6">
              About {data.region.name}
            </h2>
            <div className="max-w-3xl space-y-4 text-[var(--muted-foreground)] leading-relaxed">
              {content.description.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                  Known For
                </h3>
                <p className="text-sm">{content.knownFor.join(", ")}</p>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                  Terroir
                </h3>
                <p className="text-sm">{content.terroir}</p>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                  Best Time to Visit
                </h3>
                <p className="text-sm">{content.bestTimeToVisit}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Related Day Trips */}
      {data.relatedTrips.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold mb-6">
            Day Trips in {data.region.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.relatedTrips.map((trip) => (
              <Link
                key={trip.slug}
                href={`/day-trips/${trip.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 hover:border-burgundy-400 hover:shadow-sm dark:hover:border-burgundy-600 transition-all"
              >
                <Route className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400 shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-heading text-sm font-semibold group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors line-clamp-1">
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
        </section>
      )}

      {/* Explore More of Napa Valley */}
      {data.siblingRegions.length > 0 && (
        <section className="border-t border-[var(--border)] bg-[var(--card)]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-bold mb-6">
              Explore More of Napa Valley
            </h2>
            <SubRegionGrid
              subRegions={data.siblingRegions}
              valley="napa"
            />
          </div>
        </section>
      )}
    </>
  );
}
