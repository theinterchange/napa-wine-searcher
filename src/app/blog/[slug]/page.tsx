import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getAllPosts, getAllSlugs, getPostBySlug } from "@/lib/blog";
import { BlogArticle } from "@/components/blog/BlogArticle";
import { BlogCard } from "@/components/blog/BlogCard";
import { WineryCard } from "@/components/directory/WineryCard";
import { AccommodationCard } from "@/components/accommodation/AccommodationCard";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import { mdxComponents } from "@/components/blog/mdx-components";
import { BASE_URL } from "@/lib/constants";
import { AddToTripButton } from "@/components/trip/AddToTripButton";
import { getWineriesByAmenity } from "@/lib/guide-data";
import { getAllAccommodations } from "@/lib/accommodation-data";
import { db } from "@/db";
import { wineries, subRegions } from "@/db/schema";
import { eq, and, lte, desc, sql } from "drizzle-orm";
import { wineryRankingDesc } from "@/lib/winery-ranking";

export const revalidate = 86400;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: `${post.title} | Napa Sonoma Guide`,
    description: post.description,
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${BASE_URL}/blog/${post.slug}`,
      siteName: "Napa Sonoma Guide",
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      ...(post.heroImage && {
        images: [{ url: `${BASE_URL}${post.heroImage}`, width: 1200, height: 630 }],
      }),
    },
  };
}

async function getWineriesForTags(tags: string[]) {
  const tagSet = new Set(tags.map((t) => t.toLowerCase()));

  // Try amenity-based match first
  if (tagSet.has("dog-friendly")) return (await getWineriesByAmenity("dogFriendly")).slice(0, 4);
  if (tagSet.has("kid-friendly") || tagSet.has("family")) return (await getWineriesByAmenity("kidFriendly")).slice(0, 4);

  // Budget wineries
  if (tagSet.has("budget") || tagSet.has("affordable")) {
    return db
      .select({
        id: wineries.id, slug: wineries.slug, name: wineries.name, shortDescription: wineries.shortDescription,
        city: wineries.city, subRegion: subRegions.name, valley: subRegions.valley,
        priceLevel: wineries.priceLevel, aggregateRating: wineries.aggregateRating,
        totalRatings: wineries.totalRatings, reservationRequired: wineries.reservationRequired,
        dogFriendly: wineries.dogFriendly, picnicFriendly: wineries.picnicFriendly,
        kidFriendly: wineries.kidFriendly, kidFriendlyConfidence: wineries.kidFriendlyConfidence,
        curated: wineries.curated, heroImageUrl: wineries.heroImageUrl,
      })
      .from(wineries)
      .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
      .where(lte(wineries.priceLevel, 2))
      .orderBy(wineryRankingDesc)
      .limit(4);
  }

  // Valley-based fallback
  const valley = tagSet.has("napa valley") ? "napa" : tagSet.has("sonoma county") ? "sonoma" : null;
  return db
    .select({
      id: wineries.id, slug: wineries.slug, name: wineries.name, shortDescription: wineries.shortDescription,
      city: wineries.city, subRegion: subRegions.name, valley: subRegions.valley,
      priceLevel: wineries.priceLevel, aggregateRating: wineries.aggregateRating,
      totalRatings: wineries.totalRatings, reservationRequired: wineries.reservationRequired,
      dogFriendly: wineries.dogFriendly, picnicFriendly: wineries.picnicFriendly,
      kidFriendly: wineries.kidFriendly, kidFriendlyConfidence: wineries.kidFriendlyConfidence,
      curated: wineries.curated, heroImageUrl: wineries.heroImageUrl,
    })
    .from(wineries)
    .innerJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(valley ? eq(subRegions.valley, valley) : undefined)
    .orderBy(wineryRankingDesc)
    .limit(4);
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  // Determine valley from post tags for accommodation suggestions
  const tagSet = new Set(post.tags.map((t) => t.toLowerCase()));
  const postValley: "napa" | "sonoma" | null =
    tagSet.has("napa valley") || tagSet.has("napa") || tagSet.has("bottlerock")
      ? "napa"
      : tagSet.has("sonoma county") || tagSet.has("sonoma")
        ? "sonoma"
        : null;

  const [allPosts, matchingWineries, matchingAccommodations] = await Promise.all([
    Promise.resolve(getAllPosts()),
    getWineriesForTags(post.tags),
    postValley
      ? getAllAccommodations(postValley).then((all) => all.slice(0, 3))
      : Promise.resolve([]),
  ]);
  const related = allPosts
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: post.heroImage ? `${BASE_URL}${post.heroImage}` : undefined,
    datePublished: post.date,
    url: `${BASE_URL}/blog/${post.slug}`,
    mainEntityOfPage: `${BASE_URL}/blog/${post.slug}`,
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Napa Sonoma Guide",
    },
    keywords: post.tags?.join(", "),
    articleSection: "Wine Country Travel",
    inLanguage: "en-US",
  };

  const eventJsonLd = post.event
    ? {
        "@context": "https://schema.org",
        "@type": post.event.eventType || "Event",
        name: post.event.name,
        startDate: post.event.startDate,
        endDate: post.event.endDate,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          name: post.event.locationName,
          address: {
            "@type": "PostalAddress",
            streetAddress: post.event.locationAddress,
            addressLocality: post.event.locationCity,
            addressRegion: post.event.locationRegion || "CA",
            ...(post.event.locationPostal && {
              postalCode: post.event.locationPostal,
            }),
            addressCountry: "US",
          },
        },
        ...(post.event.url && { url: post.event.url }),
        ...(post.event.image && { image: post.event.image }),
      }
    : null;

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
          { name: post.title, href: `/blog/${post.slug}` },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {eventJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
        />
      )}

      <BlogArticle post={post}>
        <MDXRemote source={post.content} components={mdxComponents} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
      </BlogArticle>

      {/* Matching wineries */}
      {matchingWineries.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 border-t border-[var(--border)] mt-12">
          <h2 className="font-heading text-2xl font-bold mb-6">
            Explore These Wineries
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {matchingWineries.map((w, i) => (
              <div key={w.slug} className="relative">
                <WineryCard winery={w} />
                <AddToTripButton wineryId={w.id} winerySlug={w.slug} wineryName={w.name} showLabel={i === 0} />
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/wineries"
              className="text-sm font-medium text-[var(--foreground)] hover:underline"
            >
              Browse all wineries &rarr;
            </Link>
          </div>
        </section>
      )}

      {/* Where to Stay — nearby accommodations with booking CTAs */}
      {matchingAccommodations.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 border-t border-[var(--border)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold">
              Where to Stay Nearby
            </h2>
            <Link
              href={
                postValley === "napa"
                  ? "/where-to-stay/napa-valley"
                  : postValley === "sonoma"
                    ? "/where-to-stay/sonoma-county"
                    : "/where-to-stay"
              }
              className="text-sm font-medium text-[var(--foreground)] hover:underline"
            >
              All hotels &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {matchingAccommodations.map((a) => (
              <AccommodationCard
                key={a.slug}
                accommodation={a}
                showBookingCTA
                sourceComponent="BlogWhereToStay"
              />
            ))}
          </div>
        </section>
      )}

      {/* Related posts */}
      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 border-t border-[var(--border)] mt-12">
          <h2 className="font-heading text-2xl font-bold mb-6">
            More from the Blog
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((p) => (
              <BlogCard key={p.slug} post={p} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/blog"
              className="text-sm font-medium text-[var(--foreground)] hover:underline"
            >
              View all posts
            </Link>
          </div>
        </section>
      )}

    </>
  );
}
