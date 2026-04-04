interface WineryData {
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  heroImageUrl: string | null;
  whyVisit: string | null;
  description: string | null;
  priceLevel: number | null;
  dogFriendly: boolean | null;
  kidFriendly: boolean | null;
  hoursJson: string | null;
  knownFor: string | null;
  theSetting: string | null;
  tastingRoomVibe: string | null;
  visitorTips: string | null;
}

interface ListingExtras {
  tastingCount: number;
  photoCount: number;
}

interface ListingScore {
  score: number;
  maxScore: number;
  missing: string[];
}

const CHECKS: Array<{
  field: string;
  label: string;
  points: number;
  test: (w: WineryData, e: ListingExtras) => boolean;
}> = [
  // Critical (40 pts)
  { field: "address", label: "Address", points: 10, test: (w) => !!(w.address && w.city) },
  { field: "phone", label: "Phone number", points: 5, test: (w) => !!w.phone },
  { field: "email", label: "Email", points: 5, test: (w) => !!w.email },
  { field: "websiteUrl", label: "Website URL", points: 5, test: (w) => !!w.websiteUrl },
  { field: "heroImageUrl", label: "Hero image", points: 15, test: (w) => !!w.heroImageUrl },

  // Experience (35 pts)
  { field: "whyVisit", label: "Why Visit description", points: 12, test: (w) => !!w.whyVisit },
  { field: "description", label: "Description", points: 10, test: (w) => !!w.description },
  { field: "tastings", label: "Tasting experiences", points: 8, test: (_, e) => e.tastingCount > 0 },
  { field: "priceLevel", label: "Price level", points: 5, test: (w) => !!w.priceLevel },

  // Amenities (15 pts)
  { field: "dogFriendly", label: "Dog-friendly info", points: 5, test: (w) => w.dogFriendly !== null },
  { field: "kidFriendly", label: "Kid-friendly info", points: 5, test: (w) => w.kidFriendly !== null },
  { field: "hoursJson", label: "Hours", points: 5, test: (w) => !!w.hoursJson },

  // Polish (10 pts)
  { field: "knownFor", label: "Known For tags", points: 3, test: (w) => !!w.knownFor },
  { field: "setting", label: "Setting / Vibe description", points: 4, test: (w) => !!(w.theSetting || w.tastingRoomVibe) },
  { field: "visitorTips", label: "Visitor tips", points: 3, test: (w) => !!w.visitorTips },
];

export function calculateListingScore(
  winery: WineryData,
  extras: ListingExtras
): ListingScore {
  let score = 0;
  const maxScore = CHECKS.reduce((sum, c) => sum + c.points, 0);
  const missing: string[] = [];

  for (const check of CHECKS) {
    if (check.test(winery, extras)) {
      score += check.points;
    } else {
      missing.push(check.label);
    }
  }

  return { score, maxScore, missing };
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-500";
}

export function scoreBadgeClasses(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
  if (score >= 50) return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300";
  return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
}
