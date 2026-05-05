import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
  const dateFormatted = new Date(post.date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const primaryTag = post.tags[0] ?? "Dispatch";

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pb-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[var(--ink-3)] py-6">
        <Link href="/" className="hover:text-[var(--ink)] transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/blog" className="hover:text-[var(--ink)] transition-colors">
          Blog
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[var(--ink)] line-clamp-1">{post.title}</span>
      </nav>

      {/* Hero image */}
      {post.heroImage && (
        <figure className="photo-zoom relative aspect-[2/1] mb-10 overflow-hidden">
          <Image
            src={post.heroImage}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </figure>
      )}

      {/* Header */}
      <header className="mb-10">
        <span className="kicker">
          {primaryTag} · <time dateTime={post.date}>{dateFormatted}</time> · {readTime} min · {post.author}
        </span>
        <h1
          className="editorial-h2 text-[36px] sm:text-[48px] lg:text-[54px] mt-3"
          style={{ textWrap: "balance" }}
        >
          {post.title}
        </h1>
        {post.description && (
          <p className="font-[var(--font-serif-text)] text-[18px] leading-relaxed text-[var(--ink-2)] mt-5 max-w-[55ch]">
            {post.description}
          </p>
        )}
        <hr className="rule-brass mt-7 mb-0" />
      </header>

      {/* MDX content */}
      <div className="blog-prose prose prose-lg editorial-prose max-w-none">
        {children}
      </div>
    </article>
  );
}
