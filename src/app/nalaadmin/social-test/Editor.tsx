"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchAllEntities,
  loadPost,
  savePost,
  type SocialEntity,
} from "./actions";
import { AMENITY_LABELS } from "@/lib/social/amenity-labels";
import type { SlideVariant } from "@/lib/social/slide-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SlideState = {
  slideVariant: SlideVariant;
  photo: string;
  eyebrow: string;
  headline: string;
  subtext: string;
  fx: number;
  fy: number;
  zoom: number;
};

type CardFormat = "ig" | "pinterest" | "reel-slide";

const SLIDE_COUNT = 8;

const DEFAULT_SLIDE_SEQUENCE: SlideVariant[] = [
  "hook",
  "qualifier",
  "setting",
  "experience",
  "unique",
  "setting",
  "experience",
  "cta",
];

function makeEmptySlide(slideVariant: SlideVariant): SlideState {
  return {
    slideVariant,
    photo: "",
    eyebrow: "",
    headline: "",
    subtext: "",
    fx: 50,
    fy: 50,
    zoom: 1,
  };
}

// ---------------------------------------------------------------------------
// Preview (DOM approximation of Satori output) — supports 9:16 + variants
// ---------------------------------------------------------------------------

type OverlayPreviewProps = {
  width: number;
  height: number;
  slide: SlideState;
  isReel: boolean;
};

function OverlayCardPreview({
  width,
  height,
  slide,
  isReel,
}: OverlayPreviewProps) {
  const scale = width / 1080;
  const px = (n: number) => Math.round(n * scale);
  const { slideVariant, photo, eyebrow, headline, subtext, fx, fy, zoom } = slide;

  const isPhotoLed =
    slideVariant === "setting" ||
    slideVariant === "experience" ||
    slideVariant === "unique";

  const hookSize =
    headline.length > 42 ? 64 : headline.length > 30 ? 76 : headline.length > 18 ? 88 : 96;
  const qualifierSize =
    headline.length > 60 ? 40 : headline.length > 40 ? 48 : headline.length > 24 ? 56 : 64;
  const ctaSize = headline.length > 40 ? 48 : headline.length > 24 ? 56 : 68;

  const scrim = isPhotoLed
    ? "linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 72%, rgba(0,0,0,0.38) 100%)"
    : slideVariant === "cta"
      ? "linear-gradient(to bottom, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.72) 78%, rgba(0,0,0,0.92) 100%)"
      : "linear-gradient(to bottom, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.58) 72%, rgba(0,0,0,0.88) 100%)";

  const padX = isReel ? 72 : 64;
  const padBottom = isReel ? 260 : 80;
  const padTop = isReel ? 96 : 56;

  const serif = "Georgia, 'Times New Roman', serif";
  const sans = "var(--font-sans), 'Inter', system-ui, sans-serif";

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        background: "#7a1c37",
        overflow: "hidden",
        fontFamily: sans,
      }}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `translate(${(50 - fx) * 0.6}%, ${(50 - fy) * 0.6}%) scale(${zoom})`,
            willChange: "transform",
            pointerEvents: "none",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: scrim,
          pointerEvents: "none",
        }}
      />

      {slideVariant === "hook" && (
        <div
          style={{
            position: "absolute",
            left: px(padX),
            right: px(padX),
            bottom: px(padBottom),
            pointerEvents: "none",
          }}
        >
          {eyebrow ? (
            <div
              style={{
                fontFamily: serif,
                fontWeight: 400,
                fontSize: px(isReel ? 28 : 24),
                color: "rgba(254, 253, 248, 0.88)",
                letterSpacing: px(isReel ? 5 : 4),
                textTransform: "uppercase",
                marginBottom: px(isReel ? 24 : 18),
              }}
            >
              {eyebrow}
            </div>
          ) : null}
          <div
            style={{
              fontWeight: 700,
              fontSize: px(hookSize),
              lineHeight: 1.08,
              color: "#fefdf8",
              letterSpacing: -0.5,
            }}
          >
            {headline}
          </div>
        </div>
      )}

      {slideVariant === "qualifier" && (
        <div
          style={{
            position: "absolute",
            left: px(padX),
            right: px(padX),
            bottom: px(padBottom),
            pointerEvents: "none",
          }}
        >
          {eyebrow ? (
            <div
              style={{
                fontFamily: serif,
                fontWeight: 400,
                fontSize: px(isReel ? 26 : 22),
                color: "rgba(254, 253, 248, 0.88)",
                letterSpacing: px(isReel ? 4 : 3),
                textTransform: "uppercase",
                marginBottom: px(isReel ? 22 : 16),
              }}
            >
              {eyebrow}
            </div>
          ) : null}
          <div
            style={{
              fontWeight: 700,
              fontSize: px(qualifierSize),
              lineHeight: 1.2,
              color: "#fefdf8",
              letterSpacing: -0.3,
              marginBottom: subtext ? px(16) : 0,
            }}
          >
            {headline}
          </div>
          {subtext ? (
            <div
              style={{
                fontWeight: 400,
                fontSize: px(isReel ? 30 : 26),
                lineHeight: 1.4,
                color: "rgba(254, 253, 248, 0.82)",
              }}
            >
              {subtext}
            </div>
          ) : null}
        </div>
      )}

      {isPhotoLed && eyebrow ? (
        <div
          style={{
            position: "absolute",
            top: px(padTop),
            left: px(padX),
            fontFamily: serif,
            fontWeight: 400,
            fontSize: px(isReel ? 24 : 20),
            color: "rgba(254, 253, 248, 0.88)",
            letterSpacing: px(isReel ? 5 : 4),
            textTransform: "uppercase",
            pointerEvents: "none",
          }}
        >
          {eyebrow}
        </div>
      ) : null}

      {isPhotoLed && headline ? (
        <div
          style={{
            position: "absolute",
            left: px(padX),
            right: px(padX),
            bottom: px(padBottom),
            fontFamily: serif,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: px(isReel ? 36 : 30),
            lineHeight: 1.3,
            color: "rgba(254, 253, 248, 0.92)",
            pointerEvents: "none",
          }}
        >
          {headline}
        </div>
      ) : null}

      {slideVariant === "cta" && (
        <div
          style={{
            position: "absolute",
            left: px(padX),
            right: px(padX),
            bottom: px(padBottom),
            pointerEvents: "none",
          }}
        >
          {eyebrow ? (
            <div
              style={{
                fontFamily: serif,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: px(isReel ? 40 : 34),
                lineHeight: 1.25,
                color: "rgba(254, 253, 248, 0.92)",
                marginBottom: px(isReel ? 36 : 28),
              }}
            >
              {eyebrow}
            </div>
          ) : null}
          <div
            style={{
              fontWeight: 700,
              fontSize: px(ctaSize),
              lineHeight: 1.1,
              color: "#fefdf8",
              letterSpacing: -0.4,
              marginBottom: px(isReel ? 28 : 20),
            }}
          >
            {headline}
          </div>
          <div
            style={{
              fontWeight: 400,
              fontSize: px(isReel ? 30 : 26),
              color: "rgba(254, 253, 248, 0.82)",
              letterSpacing: px(2),
            }}
          >
            {subtext || "napasonomaguide.com"}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildAvailableTags(e: SocialEntity): string[] {
  const tags: string[] = [];
  if (e.attributes.dogFriendly) tags.push(AMENITY_LABELS.dogFriendly);
  if (e.attributes.kidFriendly) tags.push(AMENITY_LABELS.kidFriendly);
  if (e.attributes.sustainable) tags.push(AMENITY_LABELS.sustainable);
  if (e.attributes.picnicFriendly) tags.push(AMENITY_LABELS.picnicFriendly);
  if (e.attributes.adultsOnly) tags.push(AMENITY_LABELS.adultsOnly);
  if (e.city) tags.push(e.city);
  const valleyLabel = e.valley === "sonoma" ? "Sonoma Valley" : "Napa Valley";
  tags.push(valleyLabel);
  return tags;
}

function buildDefaultEyebrow(e: SocialEntity): string {
  const valleyLabel = e.valley === "sonoma" ? "Sonoma" : "Napa";
  const region = e.region && e.region !== e.city ? e.region : null;
  const parts = [region ?? e.city, valleyLabel].filter(Boolean);
  return parts.join(" · ");
}

function initialSlides(e: SocialEntity | null): SlideState[] {
  if (!e) {
    return DEFAULT_SLIDE_SEQUENCE.map(makeEmptySlide);
  }
  const eyebrow = buildDefaultEyebrow(e);
  return DEFAULT_SLIDE_SEQUENCE.map((variant, i) => ({
    slideVariant: variant,
    photo: e.photos[i % Math.max(1, e.photos.length)] ?? "",
    eyebrow,
    headline: variant === "hook" ? e.name : "",
    subtext: "",
    fx: 50,
    fy: 50,
    zoom: 1,
  }));
}

function buildCardUrl(params: {
  format: CardFormat;
  variant: "overlay" | "bottom";
  slide: SlideState;
  tags: string[];
  slug: string;
}) {
  const { slide } = params;
  return `/api/social-card?${new URLSearchParams({
    format: params.format,
    variant: params.variant,
    slideVariant: slide.slideVariant,
    headline: slide.headline,
    subtext: slide.subtext,
    eyebrow: slide.eyebrow,
    tag: params.tags.join(","),
    image: slide.photo,
    slug: params.slug,
    fx: String(slide.fx),
    fy: String(slide.fy),
    zoom: String(slide.zoom),
  }).toString()}`;
}

// ---------------------------------------------------------------------------
// Main editor component
// ---------------------------------------------------------------------------

export function SocialCardEditor() {
  const [entities, setEntities] = useState<SocialEntity[]>([]);
  const [loading, setLoading] = useState(true);

  const [entitySlug, setEntitySlug] = useState("");
  const [entityType, setEntityType] = useState<"winery" | "accommodation">(
    "winery"
  );
  const [format, setFormat] = useState<CardFormat>("reel-slide");
  const [variant] = useState<"overlay" | "bottom">("overlay");
  const [tags, setTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [currentPhotos, setCurrentPhotos] = useState<string[]>([]);

  const [slides, setSlides] = useState<SlideState[]>(() =>
    DEFAULT_SLIDE_SEQUENCE.map(makeEmptySlide)
  );
  const [slideIndex, setSlideIndex] = useState(0);
  const currentSlide = slides[slideIndex];

  const [captionIg, setCaptionIg] = useState("");
  const [captionPinterest, setCaptionPinterest] = useState("");

  const [savedPostId, setSavedPostId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAllEntities().then(async (data) => {
      setEntities(data);

      const params = new URLSearchParams(window.location.search);
      const slugParam = params.get("slug");
      const typeParam = params.get("type");

      let target = data.find((e) => e.slug === "hamel-family-wines") ?? data[0];
      if (slugParam) {
        const match = data.find(
          (e) => e.slug === slugParam && (!typeParam || e.type === typeParam)
        );
        if (match) target = match;
      }

      if (target) {
        const saved = await loadPost(target.slug, target.type);
        applyEntity(target, saved);
      }
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyEntity = useCallback(
    (e: SocialEntity, saved?: Awaited<ReturnType<typeof loadPost>>) => {
      setEntitySlug(e.slug);
      setEntityType(e.type);
      setCurrentPhotos(e.photos);
      setAvailableTags(buildAvailableTags(e));
      setSlides(initialSlides(e));
      setSlideIndex(0);

      if (saved) {
        setFormat((saved.format as CardFormat) ?? "reel-slide");
        setTags(saved.overlayTags ? saved.overlayTags.split(",") : []);
        setCaptionIg(saved.captionInstagram ?? "");
        setCaptionPinterest(saved.captionPinterest ?? "");
        setSavedPostId(saved.id);
        setSaveStatus("Loaded saved draft");
      } else {
        setFormat("reel-slide");
        setTags([]);
        setCaptionIg("");
        setCaptionPinterest("");
        setSavedPostId(null);
        setSaveStatus("");
      }
    },
    []
  );

  async function handleEntityChange(slug: string) {
    const e = entities.find((x) => x.slug === slug);
    if (!e) return;
    setSaveStatus("Loading...");
    const saved = await loadPost(slug, e.type);
    applyEntity(e, saved);
  }

  function updateCurrentSlide(patch: Partial<SlideState>) {
    setSlides((prev) =>
      prev.map((s, i) => (i === slideIndex ? { ...s, ...patch } : s))
    );
    setSaveStatus("");
  }

  function toggleTag(t: string) {
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
    setSaveStatus("");
  }

  async function handleSave() {
    setSaving(true);
    try {
      const result = await savePost({
        entitySlug,
        entityType,
        variant,
        format: (format === "reel-slide" ? "ig" : format) as "ig" | "pinterest",
        overlayHeadline: currentSlide.headline,
        overlaySubtext: currentSlide.subtext,
        overlayTags: tags.join(","),
        captionInstagram: captionIg,
        captionPinterest: captionPinterest,
        photoUrl: currentSlide.photo,
        photoFocalX: currentSlide.fx,
        photoFocalY: currentSlide.fy,
        photoZoom: currentSlide.zoom,
      });
      setSavedPostId(result.id);
      setSaveStatus("Saved");
    } catch {
      setSaveStatus("Save failed");
    }
    setSaving(false);
  }

  async function handleDownloadSlide() {
    const url = buildCardUrl({
      format,
      variant,
      slide: currentSlide,
      tags,
      slug: entitySlug,
    });
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${entitySlug}-slide${slideIndex + 1}-${currentSlide.slideVariant}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function handleDownloadAll() {
    for (let i = 0; i < slides.length; i++) {
      const url = buildCardUrl({
        format,
        variant,
        slide: slides[i],
        tags,
        slug: entitySlug,
      });
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${entitySlug}-slide${i + 1}-${slides[i].slideVariant}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      // small pacing delay so browser doesn't drop downloads
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  // Drag-to-pan — writes to the current slide.
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startFx: number;
    startFy: number;
    width: number;
    height: number;
  } | null>(null);

  function handleDragStart(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startFx: currentSlide.fx,
      startFy: currentSlide.fy,
      width: rect.width,
      height: rect.height,
    };
  }

  function handleDragMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current;
    if (!d) return;
    const sensitivity = 3;
    const clamp = (n: number) => Math.max(2, Math.min(98, n));
    const dxPct = ((e.clientX - d.startX) / d.width) * 100;
    const dyPct = ((e.clientY - d.startY) / d.height) * 100;
    updateCurrentSlide({
      fx: clamp(+(d.startFx - dxPct * sensitivity).toFixed(1)),
      fy: clamp(+(d.startFy - dyPct * sensitivity).toFixed(1)),
    });
  }

  function handleDragEnd(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragRef.current = null;
  }

  const cardUrl = useMemo(
    () =>
      buildCardUrl({
        format,
        variant,
        slide: currentSlide,
        tags,
        slug: entitySlug,
      }),
    [format, variant, currentSlide, tags, entitySlug]
  );

  // Preview dimensions by format.
  const previewSpec =
    format === "reel-slide"
      ? { width: 270, height: 480, canvasW: 1080 }
      : format === "pinterest"
        ? { width: 360, height: 540, canvasW: 1000 }
        : { width: 360, height: 450, canvasW: 1080 };

  const filteredEntities = useMemo(() => {
    if (!search) return entities;
    const q = search.toLowerCase();
    return entities.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.slug.includes(q)
    );
  }, [entities, search]);

  const currentEntity = entities.find((e) => e.slug === entitySlug);
  const isReel = format === "reel-slide";

  if (loading) {
    return (
      <section className="border border-[var(--border)] rounded-xl bg-[var(--card)] p-6 mb-12">
        <p className="text-sm text-[var(--muted-foreground)]">
          Loading {entities.length > 0 ? entities.length : ""} entities from
          database...
        </p>
      </section>
    );
  }

  return (
    <section className="border border-[var(--border)] rounded-xl bg-[var(--card)] p-6 mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-heading text-xl font-bold">Social Card Editor</h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            {entities.length} entities · 8-slide sequence · drag photo to reframe
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <select
            className="border border-[var(--border)] rounded px-2 py-1"
            value={format}
            onChange={(e) => setFormat(e.target.value as CardFormat)}
          >
            <option value="reel-slide">Reel/TikTok 1080×1920</option>
            <option value="ig">IG 1080×1350</option>
            <option value="pinterest">Pinterest 1000×1500</option>
          </select>
        </div>
      </div>

      {/* Slide stepper */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {slides.map((s, i) => (
          <button
            key={i}
            onClick={() => setSlideIndex(i)}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
              i === slideIndex
                ? "bg-[#7a1c37] text-white border-[#7a1c37]"
                : "bg-transparent text-[var(--foreground)] border-[var(--border)] hover:border-[var(--muted-foreground)]"
            }`}
            title={s.slideVariant}
          >
            {i + 1}
            <span className="ml-1.5 opacity-70 text-[10px] uppercase tracking-wider">
              {s.slideVariant}
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-6 flex-wrap">
        {/* Left: live preview + action buttons */}
        <div className="flex flex-col gap-2">
          <div className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
            Slide {slideIndex + 1} · {currentSlide.slideVariant} · drag to reframe
          </div>
          <div
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
            className="border border-[var(--border)] shadow-md cursor-grab active:cursor-grabbing select-none touch-none"
            style={{ width: previewSpec.width, height: previewSpec.height }}
          >
            <OverlayCardPreview
              width={previewSpec.width}
              height={previewSpec.height}
              slide={currentSlide}
              isReel={isReel}
            />
          </div>

          {/* Action bar */}
          <div className="flex flex-wrap gap-2 mt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 rounded text-xs font-medium bg-[#7a1c37] text-white hover:bg-[#5a1428] disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : savedPostId ? "Update draft" : "Save draft"}
            </button>
            <button
              onClick={handleDownloadSlide}
              className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
            >
              Download slide
            </button>
            <button
              onClick={handleDownloadAll}
              className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
            >
              Download all 8
            </button>
          </div>
          <div className="flex gap-3 items-center text-[10px] text-[var(--muted-foreground)]">
            <a href={cardUrl} target="_blank" className="underline">
              Open full resolution
            </a>
            <span>
              Focal: {currentSlide.fx}%, {currentSlide.fy}%
            </span>
            {saveStatus && (
              <span className={saveStatus === "Saved" ? "text-green-600" : ""}>
                {saveStatus}
              </span>
            )}
          </div>
        </div>

        {/* Right: controls */}
        <div className="flex-1 min-w-[360px] flex flex-col gap-5">
          {/* Entity picker with search */}
          <div>
            <label className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] block mb-1.5">
              Entity · {currentEntity?.type ?? ""}
            </label>
            <input
              type="text"
              placeholder="Search wineries and accommodations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm mb-1.5"
            />
            <select
              className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm"
              value={entitySlug}
              onChange={(e) => handleEntityChange(e.target.value)}
              size={Math.min(8, filteredEntities.length)}
            >
              {filteredEntities.filter((e) => e.type === "winery").length > 0 && (
                <optgroup
                  label={`Wineries (${filteredEntities.filter((e) => e.type === "winery").length})`}
                >
                  {filteredEntities
                    .filter((e) => e.type === "winery")
                    .map((e) => (
                      <option key={e.slug} value={e.slug}>
                        {e.name} — {e.city}
                      </option>
                    ))}
                </optgroup>
              )}
              {filteredEntities.filter((e) => e.type === "accommodation").length > 0 && (
                <optgroup
                  label={`Accommodations (${filteredEntities.filter((e) => e.type === "accommodation").length})`}
                >
                  {filteredEntities
                    .filter((e) => e.type === "accommodation")
                    .map((e) => (
                      <option key={e.slug} value={e.slug}>
                        {e.name} — {e.city}
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Slide variant */}
          <div>
            <label className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] block mb-1.5">
              Slide variant
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  "hook",
                  "qualifier",
                  "setting",
                  "experience",
                  "unique",
                  "cta",
                ] as SlideVariant[]
              ).map((v) => {
                const on = currentSlide.slideVariant === v;
                return (
                  <button
                    key={v}
                    onClick={() => updateCurrentSlide({ slideVariant: v })}
                    className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                      on
                        ? "bg-[#7a1c37] text-white border-[#7a1c37]"
                        : "bg-transparent text-[var(--foreground)] border-[var(--border)] hover:border-[var(--muted-foreground)]"
                    }`}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photo picker */}
          <div>
            <label className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] block mb-1.5">
              Photo · {currentPhotos.length} available
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {currentPhotos.map((p, i) => (
                <button
                  key={p}
                  onClick={() =>
                    updateCurrentSlide({
                      photo: p,
                      fx: 50,
                      fy: 50,
                      zoom: 1,
                    })
                  }
                  className={`aspect-[4/3] overflow-hidden rounded border-2 ${
                    p === currentSlide.photo
                      ? "border-[#ab1f43]"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
            <div className="flex gap-2 mb-2">
              <input
                type="url"
                placeholder="Or paste a custom photo URL"
                className="flex-1 border border-[var(--border)] rounded px-3 py-1.5 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const url = (e.target as HTMLInputElement).value.trim();
                    if (url) {
                      updateCurrentSlide({
                        photo: url,
                        fx: 50,
                        fy: 50,
                        zoom: 1,
                      });
                    }
                  }
                }}
              />
              <span className="text-[10px] text-[var(--muted-foreground)] self-center">
                press ↵
              </span>
            </div>
          </div>

          {/* Zoom + reset */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
                Zoom · {Math.round(currentSlide.zoom * 100)}%
              </label>
              <button
                onClick={() =>
                  updateCurrentSlide({ fx: 50, fy: 50, zoom: 1 })
                }
                className="text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] underline transition-colors"
              >
                Reset position
              </button>
            </div>
            <input
              type="range"
              min={1}
              max={2.5}
              step={0.05}
              value={currentSlide.zoom}
              onChange={(e) =>
                updateCurrentSlide({ zoom: parseFloat(e.target.value) })
              }
              className="w-full"
            />
          </div>

          {/* Copy inputs: eyebrow + headline + subtext */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] block mb-1.5">
                Eyebrow (serif nameplate · Title Case or short UPPERCASE)
              </label>
              <input
                type="text"
                value={currentSlide.eyebrow}
                onChange={(e) => updateCurrentSlide({ eyebrow: e.target.value })}
                placeholder="e.g. Moon Mountain · Sonoma"
                className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] block mb-1.5">
                {currentSlide.slideVariant === "cta"
                  ? "CTA line (sans bold)"
                  : currentSlide.slideVariant === "hook"
                    ? "Hook headline (sans bold, lowercase)"
                    : currentSlide.slideVariant === "qualifier"
                      ? "Qualifier line (editorial sentence)"
                      : "Pulled detail (serif italic · photo-led)"}
              </label>
              <input
                type="text"
                value={currentSlide.headline}
                onChange={(e) =>
                  updateCurrentSlide({ headline: e.target.value })
                }
                className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm font-heading"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] block mb-1.5">
                {currentSlide.slideVariant === "cta"
                  ? "Site URL line (defaults to napasonomaguide.com)"
                  : currentSlide.slideVariant === "qualifier"
                    ? "Subtext (optional second line)"
                    : "Subtext (optional)"}
              </label>
              <input
                type="text"
                value={currentSlide.subtext}
                onChange={(e) => updateCurrentSlide({ subtext: e.target.value })}
                className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Tags (still supported for batch queue / legacy) */}
          <div>
            <label className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] block mb-1.5">
              Tags · {tags.length} selected (metadata only — not rendered on slides)
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((t) => {
                const on = tags.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTag(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      on
                        ? "bg-[#7a1c37] text-white border-[#7a1c37]"
                        : "bg-transparent text-[var(--foreground)] border-[var(--border)] hover:border-[var(--muted-foreground)]"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Captions (IG + Pinterest) */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
                  Instagram Caption · {captionIg.length} chars
                </label>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(captionIg);
                    setSaveStatus("Copied IG caption");
                    setTimeout(() => setSaveStatus(""), 1500);
                  }}
                  className="text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] underline transition-colors"
                >
                  Copy
                </button>
              </div>
              <textarea
                value={captionIg}
                onChange={(e) => {
                  setCaptionIg(e.target.value);
                  setSaveStatus("");
                }}
                rows={4}
                placeholder="Instagram caption"
                className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm resize-y"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
                  Pinterest Description · {captionPinterest.length} chars
                </label>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(captionPinterest);
                    setSaveStatus("Copied Pinterest caption");
                    setTimeout(() => setSaveStatus(""), 1500);
                  }}
                  className="text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] underline transition-colors"
                >
                  Copy
                </button>
              </div>
              <textarea
                value={captionPinterest}
                onChange={(e) => {
                  setCaptionPinterest(e.target.value);
                  setSaveStatus("");
                }}
                rows={4}
                placeholder="Pinterest description"
                className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm resize-y"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
