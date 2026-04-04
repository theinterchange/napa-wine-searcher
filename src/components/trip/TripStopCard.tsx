"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeftRight, X, MapPin, Star, Clock, Wine, ChevronDown, CalendarCheck, Dog, Baby, TreePine, Ticket } from "lucide-react";
import { useState } from "react";
import type { RouteStop, Alternative, ScheduleEntry } from "./TripPlanner";
import { formatDriveTime, formatDriveTimeRange } from "@/lib/geo";
import { TrackedLink } from "@/components/monetization/TrackedLink";

interface TripStopCardProps {
  stop: RouteStop;
  index: number;
  total: number;
  alternatives: Alternative[];
  onSwap: (stopId: number, newWinery: Alternative) => void;
  onRemove: (stopId: number) => void;
  onPreview?: (slug: string) => void;
  schedule?: ScheduleEntry;
}

function getTodayHours(hoursJson: string | null | undefined): { label: string; isOpen: boolean } | null {
  if (!hoursJson) return null;
  try {
    const hours: { day: string; hours: string }[] = JSON.parse(hoursJson);
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = dayNames[new Date().getDay()];
    const entry = hours.find((h) => h.day.toLowerCase() === today.toLowerCase());
    if (!entry) return null;
    const isClosed = entry.hours.toLowerCase().includes("closed");
    return { label: isClosed ? "Closed today" : entry.hours, isOpen: !isClosed };
  } catch {
    return null;
  }
}

function getAmenityTags(item: { dogFriendly: boolean | null; kidFriendly: boolean | null; picnicFriendly: boolean | null; reservationRequired: boolean | null }) {
  return [
    item.dogFriendly && { icon: Dog, label: "Dog OK" },
    item.kidFriendly && { icon: Baby, label: "Kids OK" },
    item.picnicFriendly && { icon: TreePine, label: "Picnic" },
    item.reservationRequired === false && { icon: Ticket, label: "Walk-in" },
  ].filter(Boolean) as { icon: typeof Dog; label: string }[];
}

export function TripStopCard({
  stop,
  index,
  total,
  alternatives,
  onSwap,
  onRemove,
  onPreview,
  schedule,
}: TripStopCardProps) {
  const [showAlts, setShowAlts] = useState(false);

  const todayHours = getTodayHours(stop.hoursJson);
  const amenities = getAmenityTags(stop);

  return (
    <div>
      <div className="flex gap-4">
        {/* Timeline */}
        <div className="flex flex-col items-center">
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-burgundy-900 text-white text-xs font-bold">
              {index + 1}
            </div>
            {schedule && (
              <span className="text-[10px] font-medium text-[var(--muted-foreground)] whitespace-nowrap">
                {schedule.arriveAt}
              </span>
            )}
          </div>
          {index < total - 1 && (
            <div className="w-px flex-1 bg-[var(--border)] mt-1" />
          )}
        </div>

        {/* Card */}
        <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden mb-2">
          <div className="flex flex-col sm:flex-row">
            <div className="relative aspect-[16/9] sm:aspect-auto sm:w-44 bg-burgundy-100 dark:bg-burgundy-900 shrink-0 flex items-center justify-center overflow-hidden">
              {stop.heroImageUrl ? (
                <Image
                  src={stop.heroImageUrl}
                  alt={stop.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 176px"
                  className="object-cover"
                />
              ) : (
                <Wine className="h-10 w-10 text-burgundy-300 dark:text-burgundy-700" />
              )}
            </div>
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={() => onPreview?.(stop.slug)}
                  className="font-heading text-lg font-semibold text-left hover:text-[var(--foreground)] transition-colors"
                >
                  {stop.name}
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  {alternatives.length > 0 && (
                    <button
                      onClick={() => setShowAlts(!showAlts)}
                      className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                      title="Swap winery"
                    >
                      <ArrowLeftRight className="h-4 w-4" />
                    </button>
                  )}
                  {total > 2 && (
                    <button
                      onClick={() => onRemove(stop.id)}
                      className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 transition-colors"
                      title="Remove stop"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Location & rating */}
              <div className="mt-1 flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {stop.subRegion}
                  {stop.city && ` · ${stop.city}`}
                </span>
                {(stop.googleRating || stop.aggregateRating) && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
                    {(stop.googleRating || stop.aggregateRating)?.toFixed(1)}
                  </span>
                )}
              </div>

              {/* Today's hours */}
              {todayHours && (
                <p className={`mt-1.5 text-xs font-medium ${
                  todayHours.isOpen
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}>
                  <Clock className="inline h-3 w-3 mr-1 -mt-0.5" />
                  {todayHours.isOpen ? `Open today: ${todayHours.label}` : "Closed today"}
                </p>
              )}

              {/* Amenity badges */}
              {amenities.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {amenities.map(({ icon: Icon, label }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-0.5 rounded-full border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]"
                    >
                      <Icon className="h-2.5 w-2.5" />
                      {label}
                    </span>
                  ))}
                </div>
              )}

              {/* Match reasons */}
              {stop.matchReasons && stop.matchReasons.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {stop.matchReasons.map((reason) => (
                    <span
                      key={reason}
                      className="inline-flex items-center rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              )}

              {/* Tasting info + schedule */}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
                {stop.tasting?.min != null && (
                  <span>
                    Tastings from ${Math.round(stop.tasting.min)}
                  </span>
                )}
                {stop.tastingDurationMinutes && stop.tastingDurationMinutes !== 60 && (
                  <span>~{stop.tastingDurationMinutes} min tasting</span>
                )}
                {schedule && (
                  <span className="font-semibold text-[var(--foreground)]">
                    {schedule.arriveAt} – {schedule.departAt}
                  </span>
                )}
              </div>

              {/* Booking CTA */}
              <div className="mt-3">
                {stop.visitUrl ? (
                  <TrackedLink
                    href={stop.visitUrl}
                    clickType="book_tasting"
                    sourcePage="/plan-trip"
                    sourceComponent="TripStopCard"
                    className="inline-flex items-center gap-1 rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-burgundy-950 hover:bg-gold-400 transition-colors"
                  >
                    <CalendarCheck className="h-3.5 w-3.5" />
                    Book a Tasting
                  </TrackedLink>
                ) : (
                  <Link
                    href={`/wineries/${stop.slug}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-burgundy-950 hover:bg-gold-400 transition-colors"
                  >
                    <CalendarCheck className="h-3.5 w-3.5" />
                    Book a Tasting
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Alternatives dropdown */}
          {showAlts && alternatives.length > 0 && (
            <div className="border-t border-[var(--border)] bg-[var(--muted)]/30 p-3">
              <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
                Swap with a similar winery:
              </p>
              <div className="space-y-2">
                {alternatives.map((alt) => {
                  const altAmenities = getAmenityTags(alt);
                  return (
                    <button
                      key={alt.id}
                      onClick={() => {
                        onSwap(stop.id, alt);
                        setShowAlts(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-left hover:border-burgundy-400 dark:hover:border-burgundy-600 transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-12 w-12 shrink-0 rounded-lg bg-burgundy-100 dark:bg-burgundy-900 overflow-hidden">
                        {alt.heroImageUrl ? (
                          <Image
                            src={alt.heroImageUrl}
                            alt={alt.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Wine className="h-5 w-5 text-burgundy-300 dark:text-burgundy-700" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{alt.name}</p>
                        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                          {alt.subRegion && <span>{alt.subRegion}</span>}
                          {alt.city && alt.city !== alt.subRegion && <span>· {alt.city}</span>}
                          {(alt.googleRating || alt.aggregateRating) && (
                            <span className="flex items-center gap-0.5">
                              <Star className="h-3 w-3 fill-gold-500 text-gold-500" />
                              {(alt.googleRating || alt.aggregateRating)?.toFixed(1)}
                            </span>
                          )}
                          {alt.priceLevel && (
                            <span>{"$".repeat(alt.priceLevel)}</span>
                          )}
                        </div>
                        {/* Amenity tags */}
                        {altAmenities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {altAmenities.map(({ icon: Icon, label }) => (
                              <span
                                key={label}
                                className="inline-flex items-center gap-0.5 rounded-full border border-[var(--border)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--muted-foreground)]"
                              >
                                <Icon className="h-2.5 w-2.5" />
                                {label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4 -rotate-90 text-[var(--muted-foreground)] shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drive segment */}
      {stop.segmentAfter && stop.segmentAfter.miles > 0 && (
        <div className="flex gap-4 mb-2">
          <div className="w-8" />
          <div className="flex items-center gap-2 py-1 px-3 text-xs text-[var(--muted-foreground)] rounded-full bg-[var(--muted)]/50">
            <Clock className="h-3.5 w-3.5" />
            <span>
              ~{stop.segmentAfter.minutes > 15
                ? formatDriveTimeRange(stop.segmentAfter.minutes)
                : formatDriveTime(stop.segmentAfter.minutes)} drive
              {stop.segmentAfter.miles >= 1 && (
                <> · {Math.round(stop.segmentAfter.miles)} mi</>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
