"use client";

import { CalendarCheck, ExternalLink } from "lucide-react";
import { TrackedLink } from "./TrackedLink";
import { hotelBookingUrl } from "@/lib/affiliate";

type WineryProps = {
  kind: "winery";
  websiteUrl: string;
  wineryId?: number;
  winerySlug?: string;
  label?: string;
};

type HotelProps = {
  kind: "hotel";
  bookingUrl: string | null;
  websiteUrl: string | null;
  accommodationName?: string;
  lat?: number | null;
  lng?: number | null;
  accommodationId?: number;
  accommodationSlug?: string;
  priceFrom?: number | null;
  label?: string;
};

type Props = WineryProps | HotelProps;

export function MobileBookingBar(props: Props) {
  let href: string | null = null;
  let clickType: "book_tasting" | "book_hotel";
  let sourcePage: string | undefined;
  let sourceComponent: string;
  let icon: React.ReactNode;
  let label: string;
  let accommodationId: number | undefined;
  let wineryId: number | undefined;

  if (props.kind === "winery") {
    try {
      const url = new URL(props.websiteUrl);
      if (url.protocol === "http:") url.protocol = "https:";
      url.searchParams.set("utm_source", "winecountryguide");
      url.searchParams.set("utm_medium", "referral");
      url.searchParams.set("utm_campaign", "book_tasting_mobile");
      href = url.toString();
    } catch {
      return null;
    }
    clickType = "book_tasting";
    wineryId = props.wineryId;
    sourcePage = props.winerySlug ? `/wineries/${props.winerySlug}` : undefined;
    sourceComponent = "MobileBookingBar";
    icon = <CalendarCheck className="h-4 w-4" aria-hidden="true" />;
    label = props.label ?? "Reserve a Tasting";
  } else {
    const stay22 =
      props.accommodationName && props.lat && props.lng
        ? { name: props.accommodationName, lat: props.lat, lng: props.lng }
        : undefined;
    href = hotelBookingUrl(props.bookingUrl, props.websiteUrl, stay22);
    if (!href) return null;
    clickType = "book_hotel";
    accommodationId = props.accommodationId;
    sourcePage = props.accommodationSlug
      ? `/where-to-stay/${props.accommodationSlug}`
      : undefined;
    sourceComponent = "MobileBookingBar";
    icon = <ExternalLink className="h-4 w-4" aria-hidden="true" />;
    label = props.label ?? "Book Now";
  }

  return (
    <div
      className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-[var(--rule)] bg-[var(--paper)]/95 backdrop-blur-sm px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      role="region"
      aria-label="Booking"
    >
      <TrackedLink
        href={href}
        clickType={clickType}
        wineryId={wineryId}
        accommodationId={accommodationId}
        sourcePage={sourcePage}
        sourceComponent={sourceComponent}
        className="flex w-full items-center justify-center gap-2 bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--brass)] transition-colors px-5 py-3 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold"
      >
        {icon}
        {label}
      </TrackedLink>
    </div>
  );
}
