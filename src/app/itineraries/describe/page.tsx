import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Describe your Napa & Sonoma trip | Napa Sonoma Guide",
  description:
    "Tell us the wines you love and the setting you want — we'll match you to verified wineries and build a full itinerary.",
  alternates: { canonical: `${BASE_URL}/itineraries/describe` },
};

export default function DescribeItineraryPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Sparkles className="h-8 w-8 text-[var(--brass)]" />
      <span className="block kicker mt-4">Itineraries</span>
      <h1 className="editorial-h2 text-[34px] sm:text-[40px] mt-2">
        Describe your ideal <em>trip.</em>
      </h1>
      <p className="mt-4 font-[var(--font-serif-text)] text-[17px] leading-relaxed text-[var(--ink-2)] max-w-[60ch]">
        Tell us the wines you love, the setting you want, or the mood you&apos;re
        after — we&apos;ll match you to verified wineries and build a full itinerary.
      </p>

      <div className="card-flat mt-8 p-6">
        <span className="kicker">Coming soon</span>
        <p className="mt-2 font-[var(--font-heading)] text-[18px] text-[var(--ink)]">
          Arriving soon
        </p>
        <p className="mt-2 font-[var(--font-serif-text)] text-[15px] text-[var(--ink-2)] leading-relaxed">
          Natural-language trip building is in final review. In the meantime,
          the preference builder asks a few quick questions and produces the
          same kind of itinerary — fully editable after.
        </p>
        <Link href="/itineraries/build" className="btn-ink mt-5 inline-flex">
          Build from preferences <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </main>
  );
}
