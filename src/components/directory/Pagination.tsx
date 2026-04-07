"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      {currentPage <= 1 ? (
        <span
          aria-disabled="true"
          className="rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center opacity-50 cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </span>
      ) : (
        <Link
          href={hrefForPage(currentPage - 1)}
          aria-label="Previous page"
          scroll={true}
          className="rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[var(--muted)] transition-colors focus-visible:ring-2 focus-visible:ring-burgundy-500 focus-visible:ring-offset-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`dots-${i}`} className="px-2 text-[var(--muted-foreground)]">
            ...
          </span>
        ) : page === currentPage ? (
          <span
            key={page}
            aria-current="page"
            className="min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center text-sm font-medium bg-burgundy-700 text-white"
          >
            {page}
          </span>
        ) : (
          <Link
            key={page}
            href={hrefForPage(page)}
            scroll={true}
            className="min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center text-sm font-medium hover:bg-[var(--muted)] transition-colors focus-visible:ring-2 focus-visible:ring-burgundy-500 focus-visible:ring-offset-2"
          >
            {page}
          </Link>
        )
      )}
      {currentPage >= totalPages ? (
        <span
          aria-disabled="true"
          className="rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center opacity-50 cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </span>
      ) : (
        <Link
          href={hrefForPage(currentPage + 1)}
          aria-label="Next page"
          scroll={true}
          className="rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[var(--muted)] transition-colors focus-visible:ring-2 focus-visible:ring-burgundy-500 focus-visible:ring-offset-2"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
