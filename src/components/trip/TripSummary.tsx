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
} from "lucide-react";
import { useState } from "react";
import { formatDistance, formatDriveTime } from "@/lib/geo";
import { TrackedLink } from "@/components/monetization/TrackedLink";
import { EmailCapture } from "@/components/monetization/EmailCapture";

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
}

export function TripSummary({ summary, stopIds, theme }: TripSummaryProps) {
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <h2 className="font-heading text-lg font-semibold mb-4">Trip Summary</h2>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Car className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400 shrink-0" />
          <div>
            <p className="text-sm font-medium">
              {formatDistance(summary.totalMiles)}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Total driving distance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400 shrink-0" />
          <div>
            <p className="text-sm font-medium">
              {formatDriveTime(summary.totalDriveMinutes)} driving +{" "}
              {formatDriveTime(summary.totalTasteMinutes)} tasting
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              ~{formatDriveTime(summary.totalDriveMinutes + summary.totalTasteMinutes)}{" "}
              total
            </p>
          </div>
        </div>
        {(summary.totalMinCost > 0 || summary.totalMaxCost > 0) && (
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400 shrink-0" />
            <div>
              <p className="text-sm font-medium">
                ${summary.totalMinCost}–${summary.totalMaxCost}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Estimated tasting cost
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <Wine className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400 shrink-0" />
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
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-burgundy-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors"
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
      </div>

      <div className="mt-5 pt-5 border-t border-[var(--border)]">
        <EmailCapture
          source="itinerary"
          heading="Email Me This Itinerary"
          description="We'll send this route to your inbox so you can reference it on the go."
          buttonText="Send"
          successMessage="We'll email your itinerary shortly!"
          compact
        />
      </div>
    </div>
  );
}
