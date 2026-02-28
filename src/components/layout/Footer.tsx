import { Wine } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Wine className="h-5 w-5 text-burgundy-700 dark:text-burgundy-300" />
              <span className="font-heading text-lg font-bold text-burgundy-900 dark:text-cream-100">
                Wine Country Guide
              </span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Your definitive guide to Napa and Sonoma Valley wineries. Discover
              exceptional wines, book tastings, and plan your wine country
              adventure.
            </p>
          </div>
          <div>
            <h3 className="font-heading font-semibold mb-3">Explore</h3>
            <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <li>
                <Link href="/wineries" className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors">
                  All Wineries
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors">
                  Map View
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors">
                  Compare Wineries
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-heading font-semibold mb-3">Regions</h3>
            <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <li>
                <Link href="/wineries?valley=napa" className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors">
                  Napa Valley
                </Link>
              </li>
              <li>
                <Link href="/wineries?valley=sonoma" className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors">
                  Sonoma Valley
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
          &copy; {new Date().getFullYear()} Wine Country Guide. Built with Next.js.
        </div>
      </div>
    </footer>
  );
}
