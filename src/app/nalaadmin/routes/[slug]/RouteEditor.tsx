"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  ArrowUp,
  ArrowDown,
  X,
  Plus,
  Save,
  ExternalLink,
  Loader2,
} from "lucide-react";

export interface AdminStop {
  wineryId: number;
  name: string;
  slug: string;
  city: string | null;
  subRegion: string | null;
  heroImageUrl: string | null;
  rating: number | null;
  priceLevel: number | null;
  notes: string | null;
  suggestedDuration: number | null;
  isFeatured: boolean;
  valleyVariant: "napa" | "sonoma" | "both";
}

type Variant = "napa" | "sonoma" | "both";
const VARIANT_LABELS: Record<Variant, string> = {
  napa: "Napa",
  sonoma: "Sonoma",
  both: "Both",
};

export interface AdminPoolItem {
  wineryId: number;
  name: string;
  slug: string;
  city: string | null;
  subRegion: string | null;
  heroImageUrl: string | null;
  rating: number | null;
  priceLevel: number | null;
}

interface RouteEditorProps {
  slug: string;
  initial: {
    title: string;
    description: string | null;
    region: string | null;
    theme: string | null;
    estimatedHours: number | null;
    heroImageUrl: string | null;
    groupVibe: string | null;
    duration: "half" | "full" | "weekend" | null;
    seoKeywords: string | null;
    faqJson: string | null;
    editorialPull: string | null;
  };
  initialStops: AdminStop[];
  initialPool: AdminPoolItem[];
}

export function RouteEditor({
  slug,
  initial,
  initialStops,
  initialPool,
}: RouteEditorProps) {
  const [meta, setMeta] = useState(initial);
  const [stops, setStops] = useState<AdminStop[]>(initialStops);
  const [pool, setPool] = useState<AdminPoolItem[]>(initialPool);
  const [poolQuery, setPoolQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [variantTab, setVariantTab] = useState<Variant>(() => {
    // Start on whichever variant has stops; otherwise Both.
    const present = new Set(initialStops.map((s) => s.valleyVariant));
    return present.has("napa")
      ? "napa"
      : present.has("sonoma")
      ? "sonoma"
      : "both";
  });

  const stopIds = useMemo(() => stops.map((s) => s.wineryId), [stops]);
  const stopsInVariant = useMemo(
    () =>
      stops
        .map((s, i) => ({ stop: s, index: i }))
        .filter(({ stop }) => stop.valleyVariant === variantTab),
    [stops, variantTab]
  );

  // Refresh pool whenever stops, theme, or the active variant tab change so
  // candidates respect the tab's geography (Napa tab → Napa pool, etc.).
  useEffect(() => {
    const params = new URLSearchParams({
      limit: "24",
    });
    if (meta.theme) params.set("theme", meta.theme);
    // Tab drives the pool scope, not the route-level region field.
    if (variantTab === "napa") params.set("valley", "Napa Valley");
    else if (variantTab === "sonoma") params.set("valley", "Sonoma County");
    if (stopIds.length > 0) params.set("excludeIds", stopIds.join(","));
    let cancelled = false;
    fetch(`/api/itineraries/pool?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : { pool: [] }))
      .then((data) => {
        if (cancelled) return;
        const mapped: AdminPoolItem[] = (data.pool ?? []).map((p: any) => ({
          wineryId: p.wineryId,
          name: p.name,
          slug: p.slug,
          city: p.city,
          subRegion: p.subRegion,
          heroImageUrl: p.heroImageUrl,
          rating: p.googleRating,
          priceLevel: p.priceLevel,
        }));
        setPool(mapped);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [meta.theme, variantTab, stopIds.join(",")]);

  const filteredPool = useMemo(() => {
    if (!poolQuery.trim()) return pool;
    const q = poolQuery.toLowerCase();
    return pool.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.city ?? "").toLowerCase().includes(q) ||
        (p.subRegion ?? "").toLowerCase().includes(q)
    );
  }, [pool, poolQuery]);

  const moveStop = (i: number, delta: -1 | 1) => {
    const j = i + delta;
    if (j < 0 || j >= stops.length) return;
    const next = [...stops];
    [next[i], next[j]] = [next[j], next[i]];
    setStops(next);
  };

  const toggleFeatured = (i: number) => {
    setStops((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, isFeatured: !s.isFeatured } : s))
    );
  };

  const removeStop = (i: number) => {
    setStops((prev) => prev.filter((_, idx) => idx !== i));
  };

  const addFromPool = (p: AdminPoolItem) => {
    if (stops.some((s) => s.wineryId === p.wineryId)) return;
    setStops((prev) => [
      ...prev,
      {
        wineryId: p.wineryId,
        name: p.name,
        slug: p.slug,
        city: p.city,
        subRegion: p.subRegion,
        heroImageUrl: p.heroImageUrl,
        rating: p.rating,
        priceLevel: p.priceLevel,
        notes: null,
        suggestedDuration: null,
        isFeatured: false,
        valleyVariant: variantTab,
      },
    ]);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/nalaadmin/routes/${slug}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...meta,
          stops: stops.map((s) => ({
            wineryId: s.wineryId,
            notes: s.notes ?? null,
            suggestedDuration: s.suggestedDuration ?? null,
            isFeatured: s.isFeatured,
            valleyVariant: s.valleyVariant,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Save failed (${res.status})`);
      }
      setSavedAt(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/nalaadmin/routes"
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            ← All routes
          </Link>
          <h1 className="mt-1 font-heading text-2xl font-bold">Edit route</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/itineraries/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium hover:border-burgundy-900"
          >
            View live <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-burgundy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-burgundy-800 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </header>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </p>
      )}
      {savedAt && !error && (
        <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900">
          Saved at {new Date(savedAt).toLocaleTimeString()}.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Metadata */}
        <section className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="font-semibold">Route metadata</h2>
          <TextField
            label="Title"
            value={meta.title}
            onChange={(v) => setMeta({ ...meta, title: v })}
          />
          <TextField
            label="Editorial pull (one-line intro)"
            value={meta.editorialPull ?? ""}
            onChange={(v) => setMeta({ ...meta, editorialPull: v || null })}
          />
          <TextField
            label="Description"
            value={meta.description ?? ""}
            onChange={(v) => setMeta({ ...meta, description: v || null })}
            multiline
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Region"
              value={meta.region ?? ""}
              onChange={(v) => setMeta({ ...meta, region: v || null })}
            />
            <TextField
              label="Theme"
              value={meta.theme ?? ""}
              onChange={(v) => setMeta({ ...meta, theme: v || null })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Group vibe"
              value={meta.groupVibe ?? ""}
              onChange={(v) => setMeta({ ...meta, groupVibe: v || null })}
            />
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                Duration
              </label>
              <select
                value={meta.duration ?? ""}
                onChange={(e) =>
                  setMeta({
                    ...meta,
                    duration: (e.target.value || null) as typeof meta.duration,
                  })
                }
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
              >
                <option value="">—</option>
                <option value="half">Half day</option>
                <option value="full">Full day</option>
                <option value="weekend">Weekend</option>
              </select>
            </div>
          </div>
          <TextField
            label="Hero image URL"
            value={meta.heroImageUrl ?? ""}
            onChange={(v) => setMeta({ ...meta, heroImageUrl: v || null })}
          />
          <TextField
            label="SEO keywords"
            value={meta.seoKeywords ?? ""}
            onChange={(v) => setMeta({ ...meta, seoKeywords: v || null })}
          />
          <TextField
            label="FAQ JSON"
            value={meta.faqJson ?? ""}
            onChange={(v) => setMeta({ ...meta, faqJson: v || null })}
            multiline
          />
        </section>

        {/* Stops */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Stops</h2>
            <span className="text-xs text-[var(--muted-foreground)]">
              {stops.filter((s) => s.isFeatured).length} featured across all variants
            </span>
          </div>

          {/* Variant tabs */}
          <div className="mb-3 flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--background)] p-0.5">
            {(["napa", "sonoma", "both"] as Variant[]).map((v) => {
              const count = stops.filter((s) => s.valleyVariant === v).length;
              const active = variantTab === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVariantTab(v)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-burgundy-900 text-white"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                  }`}
                >
                  {VARIANT_LABELS[v]} ({count})
                </button>
              );
            })}
          </div>

          {stopsInVariant.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--border)] p-4 text-center text-sm text-[var(--muted-foreground)]">
              No stops in the {VARIANT_LABELS[variantTab]} variant yet. Add wineries from the pool below — they'll be tagged {variantTab}.
            </p>
          ) : (
            <ul className="space-y-2">
              {stopsInVariant.map(({ stop: s, index: i }, localIdx) => (
                <li
                  key={s.wineryId}
                  className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] p-2"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-burgundy-900 text-xs font-semibold text-white">
                    {localIdx + 1}
                  </span>
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-[var(--muted)]">
                    {s.heroImageUrl && (
                      <Image
                        src={s.heroImageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{s.name}</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
                      {s.subRegion ?? s.city}
                      {s.rating != null && <span>· ★ {s.rating.toFixed(1)}</span>}
                      {s.priceLevel != null && (
                        <span>· {"$".repeat(Math.min(4, s.priceLevel))}</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFeatured(i)}
                    aria-label="Toggle featured"
                    className={`rounded-md p-1.5 ${
                      s.isFeatured
                        ? "bg-[#b8860b]/15 text-[#8b6508]"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                    }`}
                    title={s.isFeatured ? "Featured — click to unfeature" : "Mark as featured"}
                  >
                    <Star className={`h-4 w-4 ${s.isFeatured ? "fill-current" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStop(i, -1)}
                    disabled={localIdx === 0}
                    aria-label="Move up"
                    className="rounded-md p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStop(i, 1)}
                    disabled={localIdx === stopsInVariant.length - 1}
                    aria-label="Move down"
                    className="rounded-md p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStop(i)}
                    aria-label="Remove stop"
                    className="rounded-md p-1.5 text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Candidate pool */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Candidate pool</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Wineries matching this route's theme + region with strict source
              gates (curated OR rating ≥ 4.0 with ≥ 50 reviews). Click Add to
              push into stops.
            </p>
          </div>
          <input
            type="search"
            placeholder="Filter by name or sub-region"
            value={poolQuery}
            onChange={(e) => setPoolQuery(e.target.value)}
            className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm"
          />
        </div>
        {filteredPool.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            No matching candidates. Try adjusting the theme or region above.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPool.map((p) => (
              <li
                key={p.wineryId}
                className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] p-2"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-[var(--muted)]">
                  {p.heroImageUrl && (
                    <Image
                      src={p.heroImageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
                    {p.subRegion ?? p.city}
                    {p.rating != null && <span>· ★ {p.rating.toFixed(1)}</span>}
                    {p.priceLevel != null && (
                      <span>· {"$".repeat(Math.min(4, p.priceLevel))}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => addFromPool(p)}
                  className="inline-flex items-center gap-1 rounded-full border border-burgundy-900 px-2.5 py-1 text-xs font-medium text-burgundy-900 hover:bg-burgundy-900 hover:text-white"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
        />
      )}
    </div>
  );
}
