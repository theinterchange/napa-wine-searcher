import { type LucideIcon } from "lucide-react";
import { Music, Sun, Grape, Gift, Flag } from "lucide-react";

export interface SeasonalBannerLink {
  label: string;
  href: string;
}

export interface SeasonalBannerDef {
  id: string;
  title: string;
  mobileTitle?: string;
  startDate: string;
  endDate: string;
  icon: LucideIcon;
  bgClass: string;
  links: SeasonalBannerLink[];
}

const SEASONAL_BANNERS: SeasonalBannerDef[] = [
  {
    id: "bottlerock-2026",
    title: "BottleRock 2026 — May 22–24 in Napa Valley",
    mobileTitle: "BottleRock 2026 — May 22–24",
    startDate: "2026-04-01",
    endDate: "2026-05-25",
    icon: Music,
    bgClass: "bg-burgundy-900",
    links: [
      {
        label: "Plan tastings near the festival",
        href: "/blog/bottlerock-2026-winery-guide",
      },
      {
        label: "Where to stay",
        href: "/blog/where-to-stay-bottlerock-2026",
      },
    ],
  },
  {
    id: "memorial-day-2026",
    title: "Memorial Day Weekend in Wine Country",
    startDate: "2026-05-12",
    endDate: "2026-05-27",
    icon: Flag,
    bgClass: "bg-burgundy-900",
    links: [
      {
        label: "Memorial Day guide",
        href: "/blog/memorial-day-napa-2026",
      },
    ],
  },
  {
    id: "summer-2026",
    title: "Summer in Wine Country",
    startDate: "2026-06-01",
    endDate: "2026-09-15",
    icon: Sun,
    bgClass: "bg-burgundy-900",
    links: [
      {
        label: "Best summer wineries",
        href: "/blog/best-napa-wineries-summer",
      },
    ],
  },
  {
    id: "harvest-2026",
    title: "Harvest Season in Napa & Sonoma",
    startDate: "2026-09-01",
    endDate: "2026-11-15",
    icon: Grape,
    bgClass: "bg-burgundy-900",
    links: [],
  },
  {
    id: "holiday-2026",
    title: "Holiday Season in Wine Country",
    startDate: "2026-11-15",
    endDate: "2027-01-02",
    icon: Gift,
    bgClass: "bg-burgundy-900",
    links: [],
  },
];

export function getActiveSeasonalBanners(
  now: Date = new Date()
): SeasonalBannerDef[] {
  return SEASONAL_BANNERS.filter((b) => {
    const start = new Date(b.startDate);
    const end = new Date(b.endDate);
    return now >= start && now < end;
  });
}
