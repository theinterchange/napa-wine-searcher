import Link from "next/link";
import Image from "next/image";

export function EditorialInterlude() {
  return (
    <section className="bg-[var(--paper-2)]/60 border-t border-[var(--rule-soft)]">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
        <span className="kicker block text-center">N° 03 / Cartography</span>
        <hr className="rule-brass mx-auto mt-3" />
        <h2 className="editorial-h2 text-[28px] sm:text-[34px] lg:text-[40px] mt-2 text-center">
          The lay of the <em>land.</em>
        </h2>

        <p className="drop-cap-editorial mt-8 font-[var(--font-serif-text)] text-[17px] leading-[1.7] text-[var(--ink-2)] text-left" style={{ textWrap: "pretty" }}>
          Napa and Sonoma sit side by side, separated by the Mayacamas Mountains,
          but they couldn&apos;t feel more different. Napa is a single, focused
          valley&nbsp;— thirty miles of Cabernet royalty, where every other
          driveway leads to a world-class tasting room. Sonoma sprawls across
          1,768 square miles of wildly varied terrain, from the fog-cooled
          Russian River to the sun-baked slopes of Dry Creek. Together, they
          make up the most storied wine region in the New World&nbsp;— and every
          corner of it is worth exploring.
        </p>

        <Link href="/map" className="group block mt-10 mb-2 photo-zoom">
          <Image
            src="/images/map-outline.png"
            alt="Stylized map of Napa Valley and Sonoma County showing key wine regions including Calistoga, St. Helena, Rutherford, Russian River Valley, and Dry Creek Valley"
            width={800}
            height={520}
            className="mx-auto"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, 700px"
          />
        </Link>

        <div className="text-center mt-6">
          <Link
            href="/map"
            className="inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)] border-b border-[var(--brass)] pb-1 hover:text-[var(--brass-2)] transition-colors"
          >
            Explore the interactive map →
          </Link>
        </div>
      </div>
    </section>
  );
}
