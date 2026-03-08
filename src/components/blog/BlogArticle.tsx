import Image from "next/image";
import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";
import type { BlogPost } from "@/lib/blog";

export function BlogArticle({
  post,
  children,
}: {
  post: BlogPost;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] py-6">
        <Link href="/" className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/blog" className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors">
          Blog
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[var(--foreground)] line-clamp-1">{post.title}</span>
      </nav>

      {/* Hero image */}
      {post.heroImage && (
        <div className="relative aspect-[2/1] rounded-xl overflow-hidden mb-8">
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
      <header className="mb-8">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold leading-tight">
          {post.title}
        </h1>
        <div className="mt-4 flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
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
          <span>by {post.author}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
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
      <div className="prose prose-lg max-w-none
        prose-headings:font-heading prose-headings:font-bold
        prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
        prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
        prose-p:text-[var(--foreground)] prose-p:leading-relaxed
        prose-strong:text-[var(--foreground)]
        prose-li:text-[var(--foreground)]
        prose-table:text-sm
        prose-th:text-left prose-th:font-semibold prose-th:border-b prose-th:border-[var(--border)] prose-th:pb-2
        prose-td:border-b prose-td:border-[var(--border)] prose-td:py-2
        dark:prose-invert
      ">
        {children}
      </div>
    </article>
  );
}
