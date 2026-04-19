// Phase A visual test run: walk through 10 real entities × 2 formats side by side.
// Not linked from anywhere — visit /nalaadmin/social-test directly.

import { SocialCardEditor } from "./Editor";

type TestEntity = {
  slug: string;
  type: "winery" | "accommodation";
  headline: string;
  subtext: string;
  tag: string;
  image: string;
};

const BLOB = "https://iubllytv2maaomk9.public.blob.vercel-storage.com";

const ENTITIES: TestEntity[] = [
  // --- 5 wineries, visual diversity ---
  {
    slug: "opus-one",
    type: "winery",
    headline: "Opus One",
    subtext: "Oakville · Napa Valley",
    tag: "Sustainable",
    image: `${BLOB}/winery-photos/opus-one/0.jpg`,
  },
  {
    slug: "castello-di-amorosa",
    type: "winery",
    headline: "Castello di Amorosa",
    subtext: "Calistoga · Napa Valley",
    tag: "Dog-friendly",
    image: `${BLOB}/winery-photos/castello-di-amorosa/0.jpg`,
  },
  {
    slug: "frogs-leap",
    type: "winery",
    headline: "Frog's Leap Winery",
    subtext: "Rutherford · Napa Valley",
    tag: "Dog-friendly",
    image: `${BLOB}/winery-photos/frogs-leap/0.jpg`,
  },
  {
    slug: "schramsberg-vineyards",
    type: "winery",
    headline: "Schramsberg Vineyards",
    subtext: "Calistoga · Napa Valley",
    tag: "Sparkling Wine",
    image: `${BLOB}/winery-photos/schramsberg-vineyards/0.jpg`,
  },
  {
    slug: "hamel",
    type: "winery",
    headline: "Hamel Family Wines",
    subtext: "Sonoma Valley",
    tag: "Sustainable",
    image: `${BLOB}/winery-photos/hamel/0.jpg`,
  },

  // --- 5 accommodations, type + vibe diversity ---
  {
    slug: "auberge-du-soleil",
    type: "accommodation",
    headline: "Auberge du Soleil",
    subtext: "Rutherford · Napa Valley",
    tag: "Adults-Only Retreat",
    image: `${BLOB}/accommodation-photos/auberge-du-soleil/0.jpg`,
  },
  {
    slug: "meadowlark-country-house-and-resort",
    type: "accommodation",
    headline: "Meadowlark Country House",
    subtext: "Calistoga · Napa Valley",
    tag: "Adults-Only · Dog-Friendly",
    image: `${BLOB}/accommodation-photos/meadowlark-country-house-and-resort/0.jpg`,
  },
  {
    slug: "rancho-caymus-inn",
    type: "accommodation",
    headline: "Rancho Caymus Inn",
    subtext: "Rutherford · Napa Valley",
    tag: "Wine Country Inn",
    image: `${BLOB}/accommodation-photos/rancho-caymus-inn/0.jpg`,
  },
  {
    slug: "the-francis-house",
    type: "accommodation",
    headline: "The Francis House",
    subtext: "Calistoga · Napa Valley",
    tag: "Boutique Stay",
    image: `${BLOB}/accommodation-photos/the-francis-house/0.jpg`,
  },
  {
    slug: "vignoble",
    type: "accommodation",
    headline: "Vignoble",
    subtext: "St Helena · Napa Valley",
    tag: "Wine Country Stay",
    image: `${BLOB}/accommodation-photos/vignoble/0.jpg`,
  },
];

function cardUrl(
  e: TestEntity,
  format: "ig" | "pinterest",
  variant: "bottom" | "overlay"
) {
  const params = new URLSearchParams({
    format,
    variant,
    headline: e.headline,
    subtext: e.subtext,
    tag: e.tag,
    image: e.image,
  });
  return `/api/social-card?${params.toString()}`;
}

export default function SocialCardTestPage() {
  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">
          Social Card — Phase A Visual Test
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] max-w-3xl">
          Interactive editor up top — swap photos, set focal point, zoom, pick
          tags. Grid below shows all 10 entities in both variants for at-a-glance
          comparison.
        </p>
      </div>

      <SocialCardEditor />

      <div className="mb-6 mt-10 border-t border-[var(--border)] pt-6">
        <h2 className="font-heading text-xl font-bold mb-1">
          Static grid — all 10 entities
        </h2>
        <p className="text-xs text-[var(--muted-foreground)]">
          Default tag and hero photo per entity. Click any card to open full
          resolution.
        </p>
      </div>

      <div className="flex flex-col gap-12">
        {ENTITIES.map((e) => (
          <section
            key={e.slug}
            className="border-t border-[var(--border)] pt-8"
          >
            <div className="mb-4">
              <div className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">
                {e.type}
              </div>
              <h2 className="font-heading text-xl font-bold">{e.headline}</h2>
              <div className="text-sm text-[var(--muted-foreground)]">
                {e.subtext} · {e.tag}
              </div>
            </div>
            <div className="flex flex-wrap gap-6 items-start">
              <figure className="flex flex-col gap-2">
                <div className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
                  Bottom · IG 1080×1350
                </div>
                <a href={cardUrl(e, "ig", "bottom")} target="_blank">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cardUrl(e, "ig", "bottom")}
                    alt={`${e.headline} bottom IG`}
                    width={320}
                    height={400}
                    className="border border-[var(--border)] shadow-sm"
                  />
                </a>
              </figure>
              <figure className="flex flex-col gap-2">
                <div className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
                  Overlay · IG 1080×1350
                </div>
                <a href={cardUrl(e, "ig", "overlay")} target="_blank">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cardUrl(e, "ig", "overlay")}
                    alt={`${e.headline} overlay IG`}
                    width={320}
                    height={400}
                    className="border border-[var(--border)] shadow-sm"
                  />
                </a>
              </figure>
              <figure className="flex flex-col gap-2">
                <div className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
                  Overlay · Pinterest 1000×1500
                </div>
                <a href={cardUrl(e, "pinterest", "overlay")} target="_blank">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cardUrl(e, "pinterest", "overlay")}
                    alt={`${e.headline} overlay Pinterest`}
                    width={320}
                    height={480}
                    className="border border-[var(--border)] shadow-sm"
                  />
                </a>
              </figure>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
