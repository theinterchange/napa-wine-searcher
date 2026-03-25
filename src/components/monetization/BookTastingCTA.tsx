"use client";

import { CalendarCheck } from "lucide-react";
import { TrackedLink } from "./TrackedLink";

interface BookTastingCTAProps {
  websiteUrl: string;
  wineryId?: number;
  winerySlug?: string;
  sourcePage?: string;
  sourceComponent?: string;
  size?: "sm" | "md" | "lg";
  variant?: "filled" | "outline";
  label?: React.ReactNode;
}

export function BookTastingCTA({
  websiteUrl,
  wineryId,
  winerySlug,
  sourcePage,
  sourceComponent,
  size = "md",
  variant = "filled",
  label = "Book with Winery" as React.ReactNode,
}: BookTastingCTAProps) {
  let href = websiteUrl;
  try {
    const url = new URL(websiteUrl);
    if (url.protocol === "http:") url.protocol = "https:";
    url.searchParams.set("utm_source", "winecountryguide");
    url.searchParams.set("utm_medium", "referral");
    url.searchParams.set("utm_campaign", "book_tasting");
    href = url.toString();
  } catch {
    return null;
  }

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-sm gap-2 w-full justify-center",
  };

  return (
    <TrackedLink
      href={href}
      clickType="book_tasting"
      wineryId={wineryId}
      sourcePage={sourcePage ?? (winerySlug ? `/wineries/${winerySlug}` : undefined)}
      sourceComponent={sourceComponent}
      className={`inline-flex items-center rounded-lg font-semibold transition-colors ${sizeClasses[size]} ${
        variant === "outline"
          ? "border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
          : "bg-gold-500 text-burgundy-950 hover:bg-gold-400"
      }`}
    >
      <CalendarCheck className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {label}
    </TrackedLink>
  );
}
