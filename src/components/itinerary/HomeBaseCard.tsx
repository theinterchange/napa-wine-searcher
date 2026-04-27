"use client";

import Image from "next/image";
import Link from "next/link";
import { Hotel, Pencil, ArrowDown } from "lucide-react";
import type { TripHomeBase } from "@/lib/trip-state/types";

interface HomeBaseCardProps {
  homeBase: TripHomeBase;
  onOpenPicker: () => void;
  onScrollToSummary?: () => void;
}

/**
 * "Stop Zero" card at the top of the stops list. During planning this
 * card is decision-focused, not booking-focused — the gold Book CTA
 * lives in the TripReadySummary at the bottom of the page. Change /
 * Details / "Book when ready" are the only actions here.
 */
export function HomeBaseCard({
  homeBase,
  onOpenPicker,
  onScrollToSummary,
}: HomeBaseCardProps) {
  const price = homeBase.priceTier
    ? "$".repeat(Math.max(1, Math.min(4, homeBase.priceTier)))
    : null;

  return (
    <article className="relative grid overflow-hidden rounded-2xl border border-burgundy-900/40 bg-[var(--card)] shadow-sm sm:grid-cols-[200px_1fr]">
      <div className="relative aspect-[16/10] w-full bg-[var(--muted)] sm:aspect-auto sm:h-full">
        {homeBase.heroImageUrl ? (
          <Image
            src={homeBase.heroImageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 200px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-burgundy-900/10 to-burgundy-900/5">
            <Hotel className="h-8 w-8 text-burgundy-900/40" />
          </div>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-burgundy-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-md">
          <Hotel className="h-3 w-3" />
          Home base
        </span>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div>
          <h3 className="font-serif text-lg font-semibold leading-tight">
            {homeBase.name}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[var(--muted-foreground)]">
            {homeBase.city && <span>{homeBase.city}</span>}
            {homeBase.googleRating != null && (
              <span>· ★ {homeBase.googleRating.toFixed(1)}</span>
            )}
            {price && <span>· {price}</span>}
            {homeBase.starRating != null && (
              <span>· {homeBase.starRating}-star</span>
            )}
          </div>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            You can change this anytime.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenPicker}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)] hover:border-burgundy-900"
          >
            <Pencil className="h-3 w-3" />
            Change
          </button>
          <Link
            href={`/where-to-stay/${homeBase.slug}`}
            className="text-xs font-medium text-[var(--muted-foreground)] underline-offset-2 hover:underline"
          >
            Details
          </Link>
          {onScrollToSummary && (
            <button
              type="button"
              onClick={onScrollToSummary}
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-burgundy-900 underline-offset-2 hover:underline"
            >
              Book when you&apos;re ready
              <ArrowDown className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
