import Link from "next/link";

const filters = [
  { label: "Napa Valley", href: "/wineries?valley=napa" },
  { label: "Sonoma County", href: "/wineries?valley=sonoma" },
  { label: "Dog-Friendly", href: "/wineries?amenities=dog" },
  { label: "Kid-Friendly", href: "/wineries?amenities=kid" },
  { label: "Walk-in OK", href: "/wineries?amenities=walkin" },
  { label: "Under $40", href: "/wineries?tastingPrice=budget" },
  { label: "Luxury", href: "/wineries?tastingPrice=luxury" },
  { label: "Cabernet Sauvignon", href: "/wineries?varietal=cabernet-sauvignon" },
];

export function QuickFilterBar() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
      {filters.map((f) => (
        <Link
          key={f.href}
          href={f.href}
          className="shrink-0 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:border-burgundy-400 hover:text-burgundy-700 dark:hover:border-burgundy-600 dark:hover:text-burgundy-400 transition-colors focus-visible:ring-2 focus-visible:ring-burgundy-500 focus-visible:ring-offset-2"
        >
          {f.label}
        </Link>
      ))}
    </div>
  );
}
