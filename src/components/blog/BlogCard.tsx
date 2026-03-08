import Link from "next/link";
import Image from "next/image";
import { Calendar } from "lucide-react";
import type { BlogPost } from "@/lib/blog";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:shadow-lg hover:border-burgundy-300 dark:hover:border-burgundy-700 transition-all"
    >
      <div className="relative aspect-[16/9] bg-burgundy-100 dark:bg-burgundy-900 overflow-hidden">
        {post.heroImage ? (
          <Image
            src={post.heroImage}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-burgundy-300 dark:text-burgundy-700 font-heading text-2xl font-bold">
            NSG
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <Calendar className="h-3.5 w-3.5" />
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </time>
        </div>
        <h3 className="mt-2 font-heading text-lg font-semibold group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="mt-2 text-sm text-[var(--muted-foreground)] line-clamp-2 flex-1">
          {post.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-burgundy-100 text-burgundy-700 dark:bg-burgundy-900 dark:text-burgundy-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
