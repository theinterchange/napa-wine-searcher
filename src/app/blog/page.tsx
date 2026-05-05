import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getAllPosts, getAllTags } from "@/lib/blog";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogTagFilter } from "@/components/blog/BlogTagFilter";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import { BASE_URL } from "@/lib/constants";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Wine Country Guides — Napa & Sonoma Trip Planning, Unpacked",
  description:
    "Editorial guides for Napa Valley and Sonoma County trips — first-time itineraries, BottleRock weekend, Memorial Day, dog-friendly tastings, and more.",
  openGraph: {
    title: "Wine Country Guides — Napa & Sonoma Trip Planning, Unpacked",
    description:
      "First-time Napa, BottleRock weekends, Memorial Day, dog-friendly tastings — editorial guides for wine country trips.",
    url: `${BASE_URL}/blog`,
    siteName: "Napa Sonoma Guide",
    type: "website",
  },
  alternates: {
    canonical: `${BASE_URL}/blog`,
  },
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const allPosts = getAllPosts();
  const allTags = getAllTags();

  const posts = tag
    ? allPosts.filter((p) => p.tags.includes(tag))
    : allPosts;

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Wine Country Blog",
    description:
      "Expert guides, insider tips, and practical advice for planning your Napa Valley and Sonoma County wine country visit.",
    url: `${BASE_URL}/blog`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${BASE_URL}/blog/${post.slug}`,
        name: post.title,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 font-mono text-[10.5px] tracking-[0.16em] uppercase text-[var(--ink-3)] mb-8"
        >
          <Link
            href="/"
            className="hover:text-[var(--ink)] transition-colors"
          >
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-[var(--rule)] shrink-0" aria-hidden="true" />
          <span className="text-[var(--ink)] font-semibold" aria-current="page">Blog</span>
        </nav>

        {/* Header */}
        <header className="max-w-3xl mb-10 pb-7 border-b border-[var(--rule)]">
          <span className="kicker">Dispatches</span>
          <h1 className="editorial-h2 text-[36px] sm:text-[48px] mt-3">
            Wine country, <em>unpacked.</em>
          </h1>
          <p className="font-[var(--font-serif-text)] text-[17px] leading-[1.5] text-[var(--ink-2)] mt-5 max-w-[52ch]">
            Practical guides and insider notes for Napa and Sonoma.
          </p>
        </header>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="mb-8">
            <Suspense>
              <BlogTagFilter tags={allTags} />
            </Suspense>
          </div>
        )}

        {/* Posts grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <p className="text-center text-[var(--muted-foreground)] py-16">
            {tag
              ? `No posts found for "${tag}".`
              : "No blog posts yet. Check back soon!"}
          </p>
        )}

      </div>
    </>
  );
}
