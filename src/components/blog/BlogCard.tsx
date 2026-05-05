import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/lib/blog";

export function BlogCard({ post }: { post: BlogPost }) {
  const dateStr = new Date(post.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const firstTag = post.tags[0] ?? "Dispatch";

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col bg-[var(--paper-2)] border-t-2 border-[var(--rule)] hover:border-[var(--brass)] transition-colors"
    >
      <div className="photo-zoom relative aspect-[16/10] bg-[var(--paper-2)]">
        {post.heroImage ? (
          <Image
            src={post.heroImage}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--rule)] font-[var(--font-heading)] text-2xl">
            NSG
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5">
        <span className="kicker">
          {firstTag} ·{" "}
          <time dateTime={post.date}>{dateStr}</time>
        </span>

        <hr className="rule-brass mt-3" />

        <h3 className="editorial-h2 text-[22px] mt-2 line-clamp-2 group-hover:text-[var(--color-burgundy-900)] transition-colors">
          {post.title}
        </h3>

        <p className="font-[var(--font-serif-text)] text-[15px] leading-relaxed text-[var(--ink-2)] mt-3 line-clamp-3 flex-1">
          {post.description}
        </p>

        <div className="mt-4 pt-4 border-t border-[var(--rule-soft)] flex items-center justify-between font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--ink-3)]">
          <span>Read</span>
          <span aria-hidden="true">→</span>
        </div>
      </div>
    </Link>
  );
}
