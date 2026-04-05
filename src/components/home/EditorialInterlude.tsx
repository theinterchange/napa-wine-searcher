import Link from "next/link";
import Image from "next/image";
import { Map } from "lucide-react";

export function EditorialInterlude() {
  return (
    <section className="bg-[var(--muted)]/30">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 text-center">
        <h2 className="font-heading text-2xl font-bold tracking-tight">
          The Lay of the Land
        </h2>
        <p className="mt-5 text-base sm:text-lg leading-relaxed text-[var(--muted-foreground)]">
          Napa and Sonoma sit side by side, separated by the Mayacamas
          Mountains, but they couldn&apos;t feel more different. Napa is a
          single, focused valley&nbsp;— thirty miles of Cabernet royalty, where
          every other driveway leads to a world-class tasting room. Sonoma
          sprawls across 1,768 square miles of wildly varied terrain, from the
          fog-cooled Russian River to the sun-baked slopes of Dry Creek.
          Together, they make up the most storied wine region in the New
          World&nbsp;— and every corner of it is worth exploring.
        </p>
        <Link href="/map" className="group block mt-8 mb-4">
          <Image
            src="/images/map-outline.png"
            alt="Stylized map of Napa Valley and Sonoma County showing key wine regions including Calistoga, St. Helena, Rutherford, Russian River Valley, and Dry Creek Valley"
            width={800}
            height={520}
            className="mx-auto rounded-lg transition-transform group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, 700px"
          />
        </Link>
        <Link
          href="/map"
          className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)] hover:underline"
        >
          <Map className="h-4 w-4" />
          Explore the interactive map &rarr;
        </Link>
      </div>
    </section>
  );
}
