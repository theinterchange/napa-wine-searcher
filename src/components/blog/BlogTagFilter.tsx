"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function BlogTagFilter({ tags }: { tags: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTag = searchParams.get("tag");

  function handleClick(tag: string | null) {
    if (tag) {
      router.push(`/blog?tag=${encodeURIComponent(tag)}`);
    } else {
      router.push("/blog");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleClick(null)}
        aria-current={!activeTag ? "true" : undefined}
        className={`text-sm px-3 py-1.5 rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-burgundy-500 focus-visible:ring-offset-2 ${
          !activeTag
            ? "bg-burgundy-700 text-white border-burgundy-700"
            : "border-[var(--border)] hover:border-burgundy-400 text-[var(--muted-foreground)]"
        }`}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => handleClick(tag)}
          aria-current={activeTag === tag ? "true" : undefined}
          className={`text-sm px-3 py-1.5 rounded-full border transition-colors capitalize focus-visible:ring-2 focus-visible:ring-burgundy-500 focus-visible:ring-offset-2 ${
            activeTag === tag
              ? "bg-burgundy-700 text-white border-burgundy-700"
              : "border-[var(--border)] hover:border-burgundy-400 text-[var(--muted-foreground)]"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
