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
        className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
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
          className={`text-sm px-3 py-1.5 rounded-full border transition-colors capitalize ${
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
