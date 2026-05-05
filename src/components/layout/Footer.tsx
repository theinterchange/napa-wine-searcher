import Link from "next/link";
import { FooterEmailCapture } from "./FooterEmailCapture";
import { ThemeToggle } from "./ThemeToggle";

const linkClass =
  "text-[var(--ink-2)] hover:text-[var(--ink)] hover:underline decoration-[var(--brass)] underline-offset-4 transition-colors";

export function Footer() {
  return (
    <footer className="border-t border-[var(--rule)] bg-[var(--paper)]">
      {/* Email capture strip — hidden on auth routes */}
      <FooterEmailCapture />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <div className="font-[var(--font-heading)] text-[24px] font-normal tracking-[-0.01em] text-[var(--ink)]">
              Napa Sonoma <em className="italic" style={{ color: "var(--brass-2)" }}>Guide</em>
            </div>
            <p className="mt-4 text-[14px] leading-[1.55] text-[var(--ink-2)] max-w-[40ch]">
              The complete visitor&apos;s guide to Napa Valley and Sonoma County wineries — ranked, reviewed, and filtered the way you&apos;d actually pick.
            </p>
          </div>

          <div className="md:col-span-2">
            <h3 className="kicker mb-4">Explore</h3>
            <ul className="space-y-2.5 text-[14px]">
              <li><Link href="/wineries" className={linkClass}>All Wineries</Link></li>
              <li><Link href="/where-to-stay" className={linkClass}>Where to Stay</Link></li>
              <li><Link href="/itineraries" className={linkClass}>Itineraries</Link></li>
              <li><Link href="/itineraries/build" className={linkClass}>Plan a Trip</Link></li>
              <li><Link href="/map" className={linkClass}>Map View</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="kicker mb-4">Regions</h3>
            <ul className="space-y-2.5 text-[14px]">
              <li><Link href="/napa-valley" className={linkClass}>Napa Valley</Link></li>
              <li><Link href="/sonoma-county" className={linkClass}>Sonoma County</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h3 className="kicker mb-4">Guides &amp; Blog</h3>
            <ul className="space-y-2.5 text-[14px] grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              <li><Link href="/guides" className={`${linkClass} text-[var(--ink)]`}>Browse All Guides</Link></li>
              <li><Link href="/blog" className={linkClass}>Blog</Link></li>
              <li><Link href="/dog-friendly-wineries" className={linkClass}>Dog-Friendly Wineries</Link></li>
              <li><Link href="/kid-friendly-wineries" className={linkClass}>Kid-Friendly Wineries</Link></li>
              <li><Link href="/sustainable-wineries" className={linkClass}>Sustainable Wineries</Link></li>
              <li><Link href="/dog-friendly-hotels" className={linkClass}>Dog-Friendly Hotels</Link></li>
              <li><Link href="/guides/best-cabernet-sauvignon-napa-valley" className={linkClass}>Best Cabernet</Link></li>
              <li><Link href="/guides/cheap-wine-tastings-napa-valley" className={linkClass}>Affordable Tastings</Link></li>
              <li><Link href="/guides/napa-valley-vs-sonoma-county" className={linkClass}>Napa vs Sonoma</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-7 border-t border-[var(--rule-soft)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[var(--ink-3)]">
            <p>&copy; {new Date().getFullYear()} Napa Sonoma Guide.</p>
            <div className="flex items-center gap-5 font-mono text-[10.5px] tracking-[0.18em] uppercase">
              <Link href="/privacy" className="hover:text-[var(--ink)] transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-[var(--ink)] transition-colors">Terms</Link>
              <ThemeToggle />
            </div>
          </div>
          <p className="mt-5 text-center text-[12.5px] text-[var(--ink-3)]">
            Must be 21 or older to consume alcohol. Please drink responsibly.
          </p>
          <p className="mt-1.5 text-center text-[12.5px] text-[var(--ink-3)]">
            Photos and ratings powered by Google. Confirm details directly with venues before visiting.
          </p>
        </div>
      </div>
    </footer>
  );
}
