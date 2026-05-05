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

  const baseClass =
    "font-mono text-[10.5px] tracking-[0.16em] uppercase px-3 py-1.5 sm:py-1 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]";
  const active = "bg-[var(--ink)] border-[var(--ink)] text-[var(--paper)]";
  const inactive =
    "border-[var(--rule)] text-[var(--ink-2)] hover:border-[var(--brass)] hover:text-[var(--ink)]";

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => handleClick(null)}
        aria-current={!activeTag ? "true" : undefined}
        className={`${baseClass} ${!activeTag ? active : inactive}`}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => handleClick(tag)}
          aria-current={activeTag === tag ? "true" : undefined}
          className={`${baseClass} ${activeTag === tag ? active : inactive}`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
