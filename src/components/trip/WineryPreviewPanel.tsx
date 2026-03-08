"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  ExternalLink,
  MapPin,
  Phone,
  Globe,
  Clock,
  Star,
  Wine,
  Dog,
  Baby,
  TreePine,
  Loader2,
} from "lucide-react";

interface PreviewData {
  slug: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  websiteUrl: string | null;
  hoursJson: string | null;
  heroImageUrl: string | null;
  reservationRequired: boolean | null;
  dogFriendly: boolean | null;
  kidFriendly: boolean | null;
  picnicFriendly: boolean | null;
  priceLevel: number | null;
  aggregateRating: number | null;
  googleRating: number | null;
  subRegion: string | null;
  tastings: {
    id: number;
    name: string;
    price: number | null;
    description: string | null;
  }[];
  wines: {
    id: number;
    name: string;
    wineType: string | null;
  }[];
}

interface WineryPreviewPanelProps {
  slug: string | null;
  onClose: () => void;
}

export function WineryPreviewPanel({ slug, onClose }: WineryPreviewPanelProps) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [visible, setVisible] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const cacheRef = useRef(new Map<string, PreviewData>());

  const fetchPreview = useCallback(async (s: string) => {
    const cached = cacheRef.current.get(s);
    if (cached) {
      setData(cached);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/wineries/${s}/preview`);
      if (!res.ok) throw new Error();
      const json: PreviewData = await res.json();
      cacheRef.current.set(s, json);
      setData(json);
    } catch {
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when slug changes
  useEffect(() => {
    if (slug) {
      setDescExpanded(false);
      fetchPreview(slug);
      // Trigger slide-in on next frame
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [slug, fetchPreview]);

  // ESC key
  useEffect(() => {
    if (!slug) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slug, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (slug) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [slug]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  if (!slug) return null;

  const rating = data?.googleRating ?? data?.aggregateRating;

  const amenities = [
    data?.dogFriendly && { icon: Dog, label: "Dog-Friendly" },
    data?.kidFriendly && { icon: Baby, label: "Kid-Friendly" },
    data?.picnicFriendly && { icon: TreePine, label: "Picnic Area" },
  ].filter(Boolean) as { icon: typeof Dog; label: string }[];

  let hours: { day: string; hours: string }[] = [];
  if (data?.hoursJson) {
    try {
      hours = JSON.parse(data.hoursJson);
    } catch {}
  }

  const description = data?.shortDescription || data?.description;

  const panel = (
    <div className="fixed inset-0 z-[90]">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-[var(--background)] shadow-xl overflow-y-auto transition-transform duration-300 ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 py-3">
          <Link
            href={`/wineries/${slug}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-burgundy-700 dark:text-burgundy-400 hover:underline"
          >
            View Full Page
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-burgundy-600 dark:text-burgundy-400" />
          </div>
        )}

        {error && (
          <div className="px-4 py-20 text-center">
            <p className="text-[var(--muted-foreground)]">
              Could not load winery details.
            </p>
            <Link
              href={`/wineries/${slug}`}
              className="mt-2 inline-block text-sm text-burgundy-700 dark:text-burgundy-400 hover:underline"
            >
              Go to full page &rarr;
            </Link>
          </div>
        )}

        {data && !loading && (
          <div>
            {/* Hero image */}
            {data.heroImageUrl && (
              <div className="relative aspect-[16/9] bg-burgundy-100 dark:bg-burgundy-900">
                <Image
                  src={data.heroImageUrl}
                  alt={data.name}
                  fill
                  sizes="(max-width: 448px) 100vw, 448px"
                  className="object-cover"
                />
              </div>
            )}

            <div className="p-4 space-y-5">
              {/* Name + rating + price */}
              <div>
                <h2 className="font-heading text-xl font-bold">{data.name}</h2>
                <div className="mt-1 flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                  {data.subRegion && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {data.subRegion}
                    </span>
                  )}
                  {rating != null && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
                      {rating.toFixed(1)}
                    </span>
                  )}
                  {data.priceLevel && (
                    <span className="font-medium">
                      {"$".repeat(data.priceLevel)}
                    </span>
                  )}
                </div>
              </div>

              {/* Amenity pills */}
              {amenities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {amenities.map(({ icon: Icon, label }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--muted-foreground)]"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </span>
                  ))}
                  {data.reservationRequired === false && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--muted-foreground)]">
                      Walk-in Welcome
                    </span>
                  )}
                </div>
              )}

              {/* Description */}
              {description && (
                <div>
                  <p
                    className={`text-sm text-[var(--muted-foreground)] leading-relaxed ${
                      !descExpanded ? "line-clamp-3" : ""
                    }`}
                  >
                    {description}
                  </p>
                  {description.length > 180 && (
                    <button
                      onClick={() => setDescExpanded(!descExpanded)}
                      className="mt-1 text-xs font-medium text-burgundy-700 dark:text-burgundy-400 hover:underline"
                    >
                      {descExpanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>
              )}

              {/* Visit Info */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Visit Info</h3>
                {data.address && (
                  <p className="flex items-start gap-2 text-sm text-[var(--muted-foreground)]">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      {data.address}
                      {data.city && `, ${data.city}`}
                      {data.state && `, ${data.state}`}
                      {data.zip && ` ${data.zip}`}
                    </span>
                  </p>
                )}
                {data.phone && (
                  <p className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-[var(--muted-foreground)]" />
                    <a
                      href={`tel:${data.phone}`}
                      className="text-burgundy-700 dark:text-burgundy-400 hover:underline"
                    >
                      {data.phone}
                    </a>
                  </p>
                )}
                {data.websiteUrl && (
                  <p className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-[var(--muted-foreground)]" />
                    <a
                      href={data.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-burgundy-700 dark:text-burgundy-400 hover:underline truncate"
                    >
                      {data.websiteUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                    </a>
                  </p>
                )}
                {hours.length > 0 && (
                  <div className="flex items-start gap-2 text-sm text-[var(--muted-foreground)]">
                    <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
                      {hours.map((h) => (
                        <div key={h.day} className="contents">
                          <span className="font-medium">{h.day}</span>
                          <span>{h.hours}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tastings */}
              {data.tastings.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">
                    Tasting Experiences
                  </h3>
                  <div className="space-y-2">
                    {data.tastings.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-lg border border-[var(--border)] p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{t.name}</span>
                          {t.price != null && (
                            <span className="text-sm font-semibold text-burgundy-700 dark:text-burgundy-400">
                              ${Math.round(t.price)}
                            </span>
                          )}
                        </div>
                        {t.description && (
                          <p className="mt-1 text-xs text-[var(--muted-foreground)] line-clamp-2">
                            {t.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Wines */}
              {data.wines.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Top Wines</h3>
                  <div className="space-y-1">
                    {data.wines.map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
                      >
                        <Wine className="h-3.5 w-3.5 text-burgundy-500 shrink-0" />
                        <span className="truncate">{w.name}</span>
                        {w.wineType && (
                          <span className="ml-auto shrink-0 text-xs text-[var(--muted-foreground)]">
                            {w.wineType}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(panel, document.body);
}
