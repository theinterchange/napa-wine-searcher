"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dog,
  Baby,
  UtensilsCrossed,
  Footprints,
  Gem,
  DollarSign,
  Wine,
  Route,
  Clock,
} from "lucide-react";

interface RegionStat {
  valley: string;
  subRegionName: string;
  subRegionSlug: string;
  count: number;
}

interface DayTrip {
  slug: string;
  title: string;
  theme: string | null;
  estimatedHours: number | null;
}

interface PlanYourVisitProps {
  discoveryLinks: { label: string; href: string }[];
  regionStats: {
    napa: RegionStat[];
    sonoma: RegionStat[];
    napaTotal: number;
    sonomaTotal: number;
  };
  dayTrips: DayTrip[];
}

const styleCards = [
  { label: "Dog-Friendly", href: "/wineries?dog=true", icon: Dog },
  { label: "Kid-Friendly", href: "/wineries?kid=true", icon: Baby },
  { label: "Picnic-Ready", href: "/wineries?picnic=true", icon: UtensilsCrossed },
  { label: "Walk-in OK", href: "/wineries?reservation=false", icon: Footprints },
  { label: "Luxury", href: "/wineries?tastingPrice=luxury", icon: Gem },
  { label: "Under $40", href: "/wineries?tastingPrice=budget", icon: DollarSign },
  { label: "Cabernet Sauvignon", href: "/wineries?varietal=cabernet-sauvignon", icon: Wine },
];

const tabs = ["By Style", "By Region", "Day Trips"] as const;
type Tab = (typeof tabs)[number];

export function PlanYourVisit({
  regionStats,
  dayTrips,
}: PlanYourVisitProps) {
  const [activeTab, setActiveTab] = useState<Tab>("By Style");

  return (
    <section className="border-y border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-bold mb-6">
          Plan Your Visit
        </h2>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-[var(--border)]">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-burgundy-700 text-burgundy-700 dark:border-burgundy-400 dark:text-burgundy-400"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "By Style" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {styleCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 hover:border-burgundy-400 hover:shadow-sm dark:hover:border-burgundy-600 transition-all"
                >
                  <Icon className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400 shrink-0" />
                  <span className="text-sm font-medium">{card.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {activeTab === "By Region" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Napa */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading text-lg font-semibold">
                  Napa Valley
                </h3>
                <span className="text-sm text-[var(--muted-foreground)]">
                  {regionStats.napaTotal} wineries
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {regionStats.napa.map((r) => (
                  <Link
                    key={r.subRegionSlug}
                    href={`/wineries?region=${r.subRegionSlug}`}
                    className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm hover:border-burgundy-400 hover:text-burgundy-700 dark:hover:border-burgundy-600 dark:hover:text-burgundy-400 transition-colors"
                  >
                    {r.subRegionName}{" "}
                    <span className="text-[var(--muted-foreground)]">
                      ({r.count})
                    </span>
                  </Link>
                ))}
                <Link
                  href="/wineries?valley=napa"
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-burgundy-700 dark:text-burgundy-400 hover:underline"
                >
                  View all &rarr;
                </Link>
              </div>
            </div>

            {/* Sonoma */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading text-lg font-semibold">
                  Sonoma County
                </h3>
                <span className="text-sm text-[var(--muted-foreground)]">
                  {regionStats.sonomaTotal} wineries
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {regionStats.sonoma.map((r) => (
                  <Link
                    key={r.subRegionSlug}
                    href={`/wineries?region=${r.subRegionSlug}`}
                    className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm hover:border-burgundy-400 hover:text-burgundy-700 dark:hover:border-burgundy-600 dark:hover:text-burgundy-400 transition-colors"
                  >
                    {r.subRegionName}{" "}
                    <span className="text-[var(--muted-foreground)]">
                      ({r.count})
                    </span>
                  </Link>
                ))}
                <Link
                  href="/wineries?valley=sonoma"
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-burgundy-700 dark:text-burgundy-400 hover:underline"
                >
                  View all &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Day Trips" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dayTrips.map((trip) => (
              <Link
                key={trip.slug}
                href={`/day-trips/${trip.slug}`}
                className="group flex flex-col rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 hover:border-burgundy-400 hover:shadow-sm dark:hover:border-burgundy-600 transition-all"
              >
                <div className="flex items-start gap-3">
                  <Route className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-heading text-sm font-semibold group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors line-clamp-1">
                      {trip.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                      {trip.theme && (
                        <span className="rounded-full bg-burgundy-50 dark:bg-burgundy-950 px-2 py-0.5 text-burgundy-700 dark:text-burgundy-300">
                          {trip.theme}
                        </span>
                      )}
                      {trip.estimatedHours && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {trip.estimatedHours}h
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            <Link
              href="/day-trips"
              className="flex items-center justify-center rounded-xl border border-dashed border-[var(--border)] p-5 text-sm font-medium text-burgundy-700 dark:text-burgundy-400 hover:border-burgundy-400 dark:hover:border-burgundy-600 hover:bg-burgundy-50 dark:hover:bg-burgundy-950/50 transition-all"
            >
              View all routes &rarr;
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
