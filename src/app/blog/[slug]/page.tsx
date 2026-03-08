import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getAllSlugs, getPostBySlug } from "@/lib/blog";
import { BlogArticle } from "@/components/blog/BlogArticle";
import { BlogCard } from "@/components/blog/BlogCard";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import { EmailCapture } from "@/components/monetization/EmailCapture";
import { mdxComponents } from "@/components/blog/mdx-components";
import { BASE_URL } from "@/lib/constants";

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

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const allPosts = getAllPosts();
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
        <MDXRemote source={post.content} components={mdxComponents} />
      </BlogArticle>

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
              className="text-sm font-medium text-burgundy-700 dark:text-burgundy-400 hover:underline"
            >
              View all posts
            </Link>
          </div>
        </section>
      )}

      {/* Email capture */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pb-12">
        <EmailCapture source="guide" />
      </div>
    </>
  );
}
