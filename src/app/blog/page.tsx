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
  title: "Blog | Napa Sonoma Guide",
  description:
    "Expert guides, insider tips, and practical advice for planning your Napa Valley and Sonoma County wine country visit.",
  openGraph: {
    title: "Blog | Napa Sonoma Guide",
    description:
      "Expert guides, insider tips, and practical advice for planning your wine country visit.",
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
        <nav className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] mb-8">
          <Link
            href="/"
            className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors"
          >
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-[var(--foreground)]">Blog</span>
        </nav>

        {/* Header */}
        <div className="max-w-2xl mb-10">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold">
            Wine Country Blog
          </h1>
          <p className="mt-3 text-lg text-[var(--muted-foreground)]">
            Practical guides and insider tips for your Napa Valley and Sonoma
            County visit.
          </p>
        </div>

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
