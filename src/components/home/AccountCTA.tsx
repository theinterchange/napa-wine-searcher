"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Heart, Route, Download } from "lucide-react";
import { useSession } from "next-auth/react";

export function AccountCTA() {
  const { data: session } = useSession();

  if (session) {
    return (
      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-2xl font-bold">
              Your Free Wine Country Planning Guide
            </h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              The best wineries, insider tasting tips, and how to make the most
              of every visit — all in one downloadable guide.
            </p>
            <a
              href="/api/guide/download"
              download
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-burgundy-900 px-6 py-3 text-sm font-semibold text-white hover:bg-burgundy-800 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download the Free Guide (PDF)
            </a>
          </div>
        </div>
      </section>
    );
  }

  const features = [
    {
      icon: Download,
      label: "Free Guide",
      desc: "A downloadable planning guide with insider tips and top picks",
    },
    {
      icon: Heart,
      label: "Save Wineries",
      desc: "Bookmark favorites and build collections for every trip",
    },
    {
      icon: Route,
      label: "Plan Trips",
      desc: "Build custom itineraries with routes and timing",
    },
    {
      icon: BookOpen,
      label: "Tasting Journal",
      desc: "Log wines, rate tastings, and track every visit",
    },
  ];

  return (
    <section className="border-t border-[var(--border)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-2xl font-bold">
            Your Wine Country Companion
          </h2>
          <p className="mt-3 text-[var(--muted-foreground)] text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Start with a free planning guide — the best wineries, insider
            tasting tips, and how to make the most of every visit. Then save
            the wineries that catch your eye, build a custom itinerary, and
            keep a tasting journal that grows with every trip.
          </p>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <f.icon className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400" />
                <p className="text-sm font-semibold">{f.label}</p>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-burgundy-900 px-6 py-3 text-sm font-semibold text-white hover:bg-burgundy-800 transition-colors"
            >
              Create Your Free Account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-xs text-[var(--muted-foreground)]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[var(--foreground)] hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
