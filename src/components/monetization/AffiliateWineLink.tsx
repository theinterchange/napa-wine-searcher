"use client";

import { ShoppingBag } from "lucide-react";
import { TrackedLink } from "./TrackedLink";

interface AffiliateWineLinkProps {
  url: string;
  wineryId?: number;
  winerySlug?: string;
  label?: string;
  size?: "sm" | "md";
}

export function AffiliateWineLink({
  url,
  wineryId,
  winerySlug,
  label = "Find Online",
  size = "sm",
}: AffiliateWineLinkProps) {
  return (
    <TrackedLink
      href={url}
      clickType="buy_wine"
      wineryId={wineryId}
      sourcePage={winerySlug ? `/wineries/${winerySlug}` : undefined}
      sourceComponent="AffiliateWineLink"
      className={`inline-flex items-center gap-1 text-burgundy-700 dark:text-burgundy-400 hover:underline ${
        size === "sm" ? "text-xs" : "text-sm"
      }`}
    >
      <ShoppingBag className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      {label}
    </TrackedLink>
  );
}
