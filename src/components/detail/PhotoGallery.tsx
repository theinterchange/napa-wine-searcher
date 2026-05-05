"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Photo {
  id: number;
  url: string;
  altText: string | null;
}

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const close = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(
    () =>
      setLightboxIndex((i) =>
        i !== null && i > 0 ? i - 1 : photos.length - 1
      ),
    [photos.length]
  );
  const next = useCallback(
    () =>
      setLightboxIndex((i) =>
        i !== null && i < photos.length - 1 ? i + 1 : 0
      ),
    [photos.length]
  );

  useEffect(() => {
    if (lightboxIndex === null) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxIndex, close, prev, next]);

  if (photos.length === 0) return null;

  const [feature, ...rest] = photos;
  const grid = rest.slice(0, 4);

  return (
    <>
      {/* Gallery grid */}
      <div className="space-y-3">
        {/* Feature photo — full width */}
        <button
          onClick={() => setLightboxIndex(0)}
          className="relative w-full aspect-[16/9] overflow-hidden photo-zoom focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:ring-offset-2"
          aria-label={`View photo 1 of ${photos.length}`}
        >
          <Image
            src={feature.url}
            alt={feature.altText || "Winery photo"}
            fill
            sizes="(max-width: 768px) 100vw, 700px"
            quality={85}
            className="object-cover"
            priority
          />
        </button>

        {/* Grid of remaining photos */}
        {grid.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {grid.map((photo, i) => (
              <button
                key={photo.id}
                onClick={() => setLightboxIndex(i + 1)}
                className="relative aspect-[4/3] overflow-hidden photo-zoom focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:ring-offset-2"
                aria-label={`View photo ${i + 2} of ${photos.length}`}
              >
                <Image
                  src={photo.url}
                  alt={photo.altText || "Winery photo"}
                  fill
                  sizes="(max-width: 768px) 50vw, 350px"
                  quality={85}
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* View all link if more photos exist */}
        {photos.length > 5 && (
          <button
            onClick={() => setLightboxIndex(5)}
            className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[var(--ink-2)] hover:text-[var(--brass-2)] border-b border-[var(--brass)] pb-1 transition-colors"
          >
            View all {photos.length} photos →
          </button>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/95"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery"
        >
          <button
            onClick={close}
            className="absolute top-4 right-4 z-10 border border-[var(--brass)]/40 bg-[var(--ink)]/60 p-2 text-[var(--brass)] hover:bg-[var(--brass)] hover:text-[var(--ink)] transition-colors"
            aria-label="Close lightbox"
          >
            <X className="h-5 w-5" />
          </button>

          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-4 z-10 border border-white/30 bg-black/40 p-2 text-white hover:bg-black/60 transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          <Image
            key={photos[lightboxIndex].id}
            src={photos[lightboxIndex].url}
            alt={photos[lightboxIndex].altText || "Winery photo"}
            width={1200}
            height={800}
            sizes="90vw"
            quality={90}
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-4 z-10 border border-white/30 bg-black/40 p-2 text-white hover:bg-black/60 transition-colors"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-[10.5px] tracking-[0.22em] uppercase bg-black/50 px-3 py-1 text-[var(--brass)]">
            {lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
