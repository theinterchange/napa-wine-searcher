"use client";

import { ExternalLink } from "lucide-react";
import { TrackedLink } from "../monetization/TrackedLink";
import { hotelBookingUrl } from "@/lib/affiliate";

interface BookHotelCTAProps {
  bookingUrl: string | null;
  websiteUrl: string | null;
  accommodationId?: number;
  accommodationSlug?: string;
  sourcePage?: string;
  sourceComponent?: string;
  size?: "sm" | "md" | "lg";
  label?: React.ReactNode;
}

export function BookHotelCTA({
  bookingUrl,
  websiteUrl,
  accommodationId,
  accommodationSlug,
  sourcePage,
  sourceComponent,
  size = "md",
  label = "Check Availability" as React.ReactNode,
}: BookHotelCTAProps) {
  const href = hotelBookingUrl(bookingUrl, websiteUrl);
  if (!href) return null;

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-sm gap-2 w-full justify-center",
  };

  return (
    <TrackedLink
      href={href}
      clickType="book_hotel"
      accommodationId={accommodationId}
      sourcePage={
        sourcePage ??
        (accommodationSlug ? `/where-to-stay/${accommodationSlug}` : undefined)
      }
      sourceComponent={sourceComponent}
      className={`inline-flex items-center rounded-lg font-semibold transition-colors ${sizeClasses[size]} bg-gold-500 text-burgundy-950 hover:bg-gold-400`}
    >
      <ExternalLink
        className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"}
      />
      {label}
    </TrackedLink>
  );
}
