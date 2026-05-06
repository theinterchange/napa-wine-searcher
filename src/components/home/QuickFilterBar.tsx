import Link from "next/link";

const regionFilters = [
  { label: "Napa Valley", href: "/wineries?valley=napa" },
  { label: "Sonoma County", href: "/wineries?valley=sonoma" },
];

const amenityFilters = [
  { label: "Dog-Friendly", href: "/wineries?amenities=dog" },
  { label: "Kid-Friendly", href: "/wineries?amenities=kid" },
  { label: "Walk-in OK", href: "/wineries?amenities=walkin" },
  { label: "Under $40", href: "/wineries?tastingPrice=budget" },
  { label: "Luxury", href: "/wineries?tastingPrice=luxury" },
  { label: "Cabernet", href: "/wineries?varietal=cabernet-sauvignon" },
];

export function QuickFilterBar() {
  return (
    <div className="-mx-4 sm:mx-0 sm:border-b sm:border-[var(--rule-soft)]">
      <div
        className="flex sm:flex-wrap items-center gap-2 sm:gap-3 px-4 sm:px-0 py-3 sm:py-4 overflow-x-auto sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <span className="kicker mr-1 hidden sm:inline-block">Region</span>
        {regionFilters.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="shrink-0 border border-[var(--ink)] bg-[var(--ink)] px-3.5 py-1.5 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--paper)] hover:bg-[var(--brass)] hover:border-[var(--brass)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:ring-offset-2"
          >
            {f.label}
          </Link>
        ))}
        <span className="hidden sm:inline-block w-px h-5 bg-[var(--rule)] mx-2" aria-hidden="true" />
        <span className="kicker mr-1 hidden sm:inline-block">Good for</span>
        {amenityFilters.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="shrink-0 border border-[var(--ink)] bg-transparent px-3.5 py-1.5 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:ring-offset-2"
          >
            {f.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
