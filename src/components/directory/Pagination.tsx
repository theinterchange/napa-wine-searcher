"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  currentPage,
  totalPages,
  basePath = "/wineries",
}: {
  currentPage: number;
  totalPages: number;
  basePath?: string;
}) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const hrefForPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set("page", String(page));
    } else {
      params.delete("page");
    }
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  const SIBLING_COUNT = 2;
  const TOTAL_VISIBLE = 2 * SIBLING_COUNT + 5;

  const range = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const pages: (number | "...")[] = [];
  if (totalPages <= TOTAL_VISIBLE) {
    pages.push(...range(1, totalPages));
  } else {
    const leftSibling = Math.max(currentPage - SIBLING_COUNT, 1);
    const rightSibling = Math.min(currentPage + SIBLING_COUNT, totalPages);
    const showLeftDots = leftSibling > 2;
    const showRightDots = rightSibling < totalPages - 1;

    if (!showLeftDots && showRightDots) {
      const leftCount = 3 + 2 * SIBLING_COUNT;
      pages.push(...range(1, leftCount), "...", totalPages);
    } else if (showLeftDots && !showRightDots) {
      const rightCount = 3 + 2 * SIBLING_COUNT;
      pages.push(1, "...", ...range(totalPages - rightCount + 1, totalPages));
    } else {
      pages.push(1, "...", ...range(leftSibling, rightSibling), "...", totalPages);
    }
  }

  const baseCell =
    "min-w-[44px] min-h-[44px] flex items-center justify-center font-mono text-[12px] tracking-[0.06em] tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:ring-offset-2";

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5">
      {currentPage <= 1 ? (
        <span aria-disabled="true" className={`${baseCell} opacity-30 cursor-not-allowed`}>
          <ChevronLeft className="h-4 w-4" />
        </span>
      ) : (
        <Link
          href={hrefForPage(currentPage - 1)}
          aria-label="Previous page"
          scroll={true}
          className={`${baseCell} text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)]`}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`dots-${i}`} className="px-2 text-[var(--ink-3)] font-mono text-[12px]">
            …
          </span>
        ) : page === currentPage ? (
          <span
            key={page}
            aria-current="page"
            className={`${baseCell} bg-[var(--ink)] text-[var(--paper)] font-semibold`}
          >
            {page}
          </span>
        ) : (
          <Link
            key={page}
            href={hrefForPage(page)}
            scroll={true}
            className={`${baseCell} text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)]`}
          >
            {page}
          </Link>
        )
      )}
      {currentPage >= totalPages ? (
        <span aria-disabled="true" className={`${baseCell} opacity-30 cursor-not-allowed`}>
          <ChevronRight className="h-4 w-4" />
        </span>
      ) : (
        <Link
          href={hrefForPage(currentPage + 1)}
          aria-label="Next page"
          scroll={true}
          className={`${baseCell} text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)]`}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
