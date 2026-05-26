import { EmailCapture } from "@/components/monetization/EmailCapture";

/**
 * Footer email capture strip — shown on every page including auth routes.
 *
 * Server component on purpose. Previously this was "use client" so it could
 * conditionally return null on auth routes via usePathname() — but that
 * created a hydration boundary on the footer wrapper and a 0.525 mobile CLS
 * regression (per Week 7 stats, 2026-05-24). The auth-route hide saved
 * ~negligible UX and cost real Core Web Vitals score; dropping it for now.
 *
 * `EmailCapture` itself is still a client component (form state), but it's
 * a leaf node inside a server-rendered wrapper with stable known height, so
 * hydration doesn't shift the surrounding layout.
 *
 * Note: the `users` and `email_subscribers` tables are separate, so a
 * logged-in user isn't automatically on the marketing list.
 */
export function FooterEmailCapture() {
  return (
    <div className="border-y border-[var(--rule)] bg-[var(--paper-2)]/60">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <EmailCapture
          source="footer"
          heading="The Napa & Sonoma planning guide"
          description="Tasting tips, the wineries worth a detour, and how to plan a weekend that actually works — sent occasionally."
        />
      </div>
    </div>
  );
}
