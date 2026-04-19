"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Plus, ExternalLink, Dog, Baby, TreeDeciduous, Leaf, Loader2 } from "lucide-react";

interface WineryPreview {
  id: number;
  slug: string;
  name: string;
  city: string | null;
  heroImageUrl: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  priceLevel: number | null;
  shortDescription: string | null;
  whyVisit: string | null;
  knownFor: string | null;
  dogFriendly: boolean | null;
  kidFriendly: boolean | null;
  picnicFriendly: boolean | null;
  reservationRequired: boolean | null;
  visitUrl: string | null;
  websiteUrl: string | null;
  subRegion: string | null;
  tasting: { min: number | null; max: number | null } | null;
  tastingDurationMinutes: number;
  experienceCount: number;
}

interface WineryPreviewDrawerProps {
  slug: string | null;
  onClose: () => void;
  onAdd: (slug: string) => void;
  adding?: boolean;
}

export function WineryPreviewDrawer({
  slug,
  onClose,
  onAdd,
  adding,
}: WineryPreviewDrawerProps) {
  const [data, setData] = useState<WineryPreview | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slug) {
      setData(null);
      return;
    }
    setLoading(true);
    let cancelled = false;
    fetch(`/api/wineries/by-slug/${slug}/preview`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [slug, onClose]);

  if (!slug) return null;

  const rating = data?.googleRating;
  const priceChars = data?.priceLevel
    ? "$".repeat(Math.max(1, Math.min(4, data.priceLevel)))
    : null;
  const tastingLabel =
    data?.tasting && data.tasting.min != null
      ? data.tasting.max == null || data.tasting.max === data.tasting.min
        ? `From $${data.tasting.min}`
        : `$${data.tasting.min}–$${data.tasting.max}`
      : null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-label="Winery preview"
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-hidden bg-[var(--background)] shadow-2xl"
      >
        <header className="relative shrink-0">
          <div className="relative aspect-[4/3] w-full bg-[var(--muted)]">
            {data?.heroImageUrl && (
              <Image
                src={data.heroImageUrl}
                alt={data.name}
                fill
                className="object-cover"
                sizes="448px"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {loading && !data && (
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          )}
          {data && (
            <>
              <div className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                {data.subRegion ?? data.city ?? ""}
              </div>
              <h2 className="mt-1 font-serif text-2xl font-semibold">
                {data.name}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--muted-foreground)]">
                {rating != null && (
                  <span>
                    ★ {rating.toFixed(1)}
                    {data.googleReviewCount
                      ? ` (${data.googleReviewCount.toLocaleString()} reviews)`
                      : ""}
                  </span>
                )}
                {priceChars && <span>· {priceChars}</span>}
                {tastingLabel && <span>· Tasting {tastingLabel}</span>}
                {data.reservationRequired != null && (
                  <span>
                    ·{" "}
                    {data.reservationRequired
                      ? "Reservation required"
                      : "Walk-ins welcome"}
                  </span>
                )}
              </div>

              {(data.whyVisit || data.shortDescription) && (
                <p className="mt-4 text-sm leading-relaxed text-[var(--foreground)]">
                  {data.whyVisit ?? data.shortDescription}
                </p>
              )}

              {data.knownFor && (
                <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
                  <div className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">
                    Known for
                  </div>
                  <div className="mt-1 text-sm">{data.knownFor}</div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-1.5">
                {data.dogFriendly && (
                  <AmenityPill icon={<Dog className="h-3.5 w-3.5" />} label="Dog-friendly" />
                )}
                {data.kidFriendly && (
                  <AmenityPill icon={<Baby className="h-3.5 w-3.5" />} label="Kid-friendly" />
                )}
                {data.picnicFriendly && (
                  <AmenityPill icon={<TreeDeciduous className="h-3.5 w-3.5" />} label="Picnic area" />
                )}
                {data.experienceCount > 0 && (
                  <AmenityPill icon={<Leaf className="h-3.5 w-3.5" />} label={`${data.experienceCount} experiences`} />
                )}
              </div>
            </>
          )}
        </div>

        <footer className="shrink-0 border-t border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => data && onAdd(data.slug)}
              disabled={adding || !data}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-burgundy-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-burgundy-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add to trip
            </button>
            {data && (
              <Link
                href={`/wineries/${data.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:border-burgundy-900"
              >
                Full page <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </footer>
      </aside>
    </>
  );
}

function AmenityPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)] px-2 py-0.5 text-xs text-[var(--foreground)]">
      {icon}
      {label}
    </span>
  );
}
