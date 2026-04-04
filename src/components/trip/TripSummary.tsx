"use client";

import {
  Car,
  Clock,
  DollarSign,
  Wine,
  Navigation,
  Share2,
  Copy,
  Check,
  BedDouble,
  MapPin,
  Star,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDriveTime, formatDriveTimeRange } from "@/lib/geo";
import { TrackedLink } from "@/components/monetization/TrackedLink";
import { BookHotelCTA } from "@/components/accommodation/BookHotelCTA";
import { SaveTripButton } from "./SaveTripButton";
import type { HomeBase } from "@/app/plan-trip/PlanTripClient";

interface NearbyAccommodation {
  slug: string;
  name: string;
  type: string;
  heroImageUrl: string | null;
  thumbnailUrl: string | null;
  priceTier: number | null;
  googleRating: number | null;
  city: string | null;
  distanceMiles: number;
}

interface TripSummaryProps {
  summary: {
    totalMiles: number;
    totalDriveMinutes: number;
    totalTasteMinutes: number;
    totalMinCost: number;
    totalMaxCost: number;
    googleMapsUrl: string | null;
  };
  stopIds: number[];
  theme?: string;
  homeBase?: HomeBase | null;
  routeCentroid?: { lat: number; lng: number } | null;
}

const typeLabels: Record<string, string> = {
  hotel: "Hotel",
  inn: "Inn",
  resort: "Resort",
  vacation_rental: "Vacation Rental",
  bed_and_breakfast: "B&B",
};

export function TripSummary({ summary, stopIds, theme, homeBase, routeCentroid }: TripSummaryProps) {
  const [copied, setCopied] = useState(false);
  const [nearbyStays, setNearbyStays] = useState<NearbyAccommodation[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  const shareUrl = () => {
    const params = new URLSearchParams({ stops: stopIds.join(",") });
    if (theme) params.set("theme", theme);
    return `${window.location.origin}/plan-trip?${params.toString()}`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fetch nearby accommodations based on route centroid
  useEffect(() => {
    if (!routeCentroid) return;
    let cancelled = false;
    setLoadingNearby(true);
    const params = new URLSearchParams({
      lat: String(routeCentroid.lat),
      lng: String(routeCentroid.lng),
      limit: "3",
    });
    if (homeBase?.slug) {
      params.set("exclude", homeBase.slug);
    }
    fetch(`/api/accommodations/nearby?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setNearbyStays(data.accommodations || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingNearby(false);
      });
    return () => { cancelled = true; };
  }, [routeCentroid, homeBase?.slug]);

  return (
    <div className="space-y-4">
      {/* Trip stats */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="font-heading text-lg font-semibold mb-4">Trip Summary</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Car className="h-5 w-5 text-[var(--muted-foreground)] shrink-0" />
            <div>
              <p className="text-sm font-medium">
                ~{Math.round(summary.totalMiles / 5) * 5} mi
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Total driving distance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-[var(--muted-foreground)] shrink-0" />
            <div>
              <p className="text-sm font-medium">
                ~{formatDriveTimeRange(summary.totalDriveMinutes)} driving +{" "}
                {formatDriveTime(summary.totalTasteMinutes)} tasting
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                ~{formatDriveTimeRange(summary.totalDriveMinutes + summary.totalTasteMinutes)}{" "}
                total
              </p>
              <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                Estimates only — open Google Maps for exact times
              </p>
            </div>
          </div>
          {(summary.totalMinCost > 0 || summary.totalMaxCost > 0) && (
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-[var(--muted-foreground)] shrink-0" />
              <div>
                <p className="text-sm font-medium">
                  ${summary.totalMinCost}
                  {summary.totalMaxCost > summary.totalMinCost && `–$${summary.totalMaxCost}`}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Total tasting cost for all {stopIds.length} wineries
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Wine className="h-5 w-5 text-[var(--muted-foreground)] shrink-0" />
            <div>
              <p className="text-sm font-medium">{stopIds.length} wineries</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                on this route
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          {summary.googleMapsUrl && (
            <TrackedLink
              href={summary.googleMapsUrl}
              clickType="directions"
              sourcePage="/plan-trip"
              sourceComponent="TripSummary"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] hover:border-[var(--foreground)]/30 transition-colors"
            >
              <Navigation className="h-4 w-4" />
              Open in Google Maps
            </TrackedLink>
          )}
          <button
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium hover:border-burgundy-400 dark:hover:border-burgundy-600 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                Link Copied!
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                Share Route
              </>
            )}
          </button>
          <SaveTripButton stopIds={stopIds} theme={theme} />
        </div>
      </div>

      {/* Home Base card */}
      {homeBase && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-gold-700 dark:text-gold-500" />
            Your Home Base
          </h3>
          <Link
            href={`/where-to-stay/${homeBase.slug}`}
            className="text-sm font-medium hover:text-[var(--foreground)] transition-colors"
          >
            {homeBase.name}
          </Link>
          <div className="mt-3">
            <BookHotelCTA
              bookingUrl={homeBase.bookingUrl}
              websiteUrl={homeBase.websiteUrl}
              accommodationName={homeBase.name}
              lat={homeBase.lat}
              lng={homeBase.lng}
              accommodationSlug={homeBase.slug}
              sourcePage="/plan-trip"
              sourceComponent="TripSummary"
              size="sm"
              label="Book Your Stay"
            />
          </div>
        </div>
      )}

      {/* Nearby Places to Stay */}
      {(nearbyStays.length > 0 || loadingNearby) && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-gold-700 dark:text-gold-500" />
            Nearby Places to Stay
          </h3>
          {loadingNearby ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
            </div>
          ) : (
            <div className="space-y-3">
              {nearbyStays.map((stay) => (
                <Link
                  key={stay.slug}
                  href={`/where-to-stay/${stay.slug}`}
                  className="flex gap-3 rounded-lg border border-[var(--border)] p-2.5 hover:border-burgundy-400 dark:hover:border-burgundy-600 transition-colors group"
                >
                  <div className="relative h-14 w-14 shrink-0 rounded-lg bg-burgundy-100 dark:bg-burgundy-900 overflow-hidden">
                    {(stay.heroImageUrl || stay.thumbnailUrl) ? (
                      <Image
                        src={stay.heroImageUrl || stay.thumbnailUrl!}
                        alt={stay.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <BedDouble className="h-5 w-5 text-burgundy-300 dark:text-burgundy-700" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors">
                      {stay.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                      <span>{typeLabels[stay.type] || stay.type}</span>
                      {stay.priceTier && (
                        <span>{"$".repeat(stay.priceTier)}</span>
                      )}
                      {stay.googleRating && (
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-gold-500 text-gold-500" />
                          {stay.googleRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                      {stay.distanceMiles < 1
                        ? "< 1 mi from route"
                        : `${stay.distanceMiles.toFixed(1)} mi from route`}
                    </p>
                  </div>
                </Link>
              ))}
              <Link
                href="/where-to-stay"
                className="block text-center text-xs font-medium text-[var(--foreground)] hover:underline pt-1"
              >
                Browse all accommodations &rarr;
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
