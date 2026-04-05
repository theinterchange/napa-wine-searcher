import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getAllPosts, getAllSlugs, getPostBySlug } from "@/lib/blog";
import { BlogArticle } from "@/components/blog/BlogArticle";
import { BlogCard } from "@/components/blog/BlogCard";
import { WineryCard } from "@/components/directory/WineryCard";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import { mdxComponents } from "@/components/blog/mdx-components";
import { BASE_URL } from "@/lib/constants";
import { getWineriesByAmenity } from "@/lib/guide-data";
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
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${BASE_URL}/blog/${post.slug}`,
      siteName: "Napa Sonoma Guide",
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
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
        slug: wineries.slug, name: wineries.name, shortDescription: wineries.shortDescription,
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
      slug: wineries.slug, name: wineries.name, shortDescription: wineries.shortDescription,
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

  const [allPosts, matchingWineries] = await Promise.all([
    Promise.resolve(getAllPosts()),
    getWineriesForTags(post.tags),
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
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Napa Sonoma Guide",
    },
  };

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
            {matchingWineries.map((w) => (
              <WineryCard key={w.slug} winery={w} />
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
