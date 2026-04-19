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
      <Sparkles className="h-8 w-8 text-burgundy-900" />
      <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
        Describe your ideal trip
      </h1>
      <p className="mt-3 text-[var(--muted-foreground)]">
        Tell us the wines you love, the setting you want, or the mood you're
        after — we'll match you to verified wineries and build a full itinerary.
      </p>
      <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted-foreground)]">
        <p className="font-semibold text-[var(--foreground)]">
          Arriving soon
        </p>
        <p className="mt-2">
          Natural-language trip building is in final review. In the meantime,
          the preference builder asks a few quick questions and produces the
          same kind of itinerary — fully editable after.
        </p>
        <Link
          href="/itineraries/build"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--foreground)] underline-offset-4 hover:underline"
        >
          Build from preferences <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
