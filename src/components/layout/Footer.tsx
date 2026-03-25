import { Wine } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Wine className="h-5 w-5 text-burgundy-900 dark:text-burgundy-200" />
              <span className="font-heading text-lg font-extrabold text-burgundy-900 dark:text-gold-600">
                Napa Sonoma Guide
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
                <Link href="/napa-valley" className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors">
                  Napa Valley
                </Link>
              </li>
              <li>
                <Link href="/sonoma-county" className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors">
                  Sonoma County
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-heading font-semibold mb-3">Guides & Blog</h3>
            <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <li>
                <Link href="/blog" className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/guides/dog-friendly-wineries-napa-valley" className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors">
                  Dog-Friendly Wineries
                </Link>
              </li>
              <li>
                <Link href="/guides/best-cabernet-sauvignon-napa-valley" className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors">
                  Best Cabernet Sauvignon
                </Link>
              </li>
              <li>
                <Link href="/guides/cheap-wine-tastings-napa-valley" className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors">
                  Affordable Tastings
                </Link>
              </li>
              <li>
                <Link href="/guides/napa-valley-vs-sonoma-county" className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors">
                  Napa vs Sonoma
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-[var(--border)] text-sm text-[var(--muted-foreground)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>&copy; {new Date().getFullYear()} Napa Sonoma Guide.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
            Must be 21 or older to consume alcohol. Please drink responsibly.
          </p>
        </div>
      </div>
    </footer>
  );
}
