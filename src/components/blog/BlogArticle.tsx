import Image from "next/image";
import Link from "next/link";
import { Calendar, ChevronRight, Clock } from "lucide-react";
import type { BlogPost } from "@/lib/blog";

function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 230));
}

export function BlogArticle({
  post,
  children,
}: {
  post: BlogPost;
  children: React.ReactNode;
}) {
  const readTime = estimateReadTime(post.content);

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pb-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] py-6">
        <Link href="/" className="hover:text-[var(--foreground)] transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/blog" className="hover:text-[var(--foreground)] transition-colors">
          Blog
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[var(--foreground)] line-clamp-1">{post.title}</span>
      </nav>

      {/* Hero image */}
      {post.heroImage && (
        <div className="relative aspect-[2/1] rounded-2xl overflow-hidden mb-10 shadow-md">
          <Image
            src={post.heroImage}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Header */}
      <header className="mb-10 border-b border-[var(--border)] pb-8">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold leading-tight text-[var(--foreground)]">
          {post.title}
        </h1>
        <p className="mt-4 text-lg text-[var(--muted-foreground)] leading-relaxed">
          {post.description}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-[var(--muted-foreground)]">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </time>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{readTime} min read</span>
          </div>
          <span>by {post.author}</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/blog?tag=${encodeURIComponent(tag)}`}
              className="text-xs px-2.5 py-1 rounded-full bg-burgundy-100 text-burgundy-700 dark:bg-burgundy-900 dark:text-burgundy-300 hover:bg-burgundy-200 dark:hover:bg-burgundy-800 transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>
      </header>

      {/* MDX content */}
      <div className="blog-prose prose prose-lg max-w-none">
        {children}
      </div>
    </article>
  );
}
