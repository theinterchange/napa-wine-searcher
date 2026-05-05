"use client";

import { usePathname } from "next/navigation";
import { EmailCapture } from "@/components/monetization/EmailCapture";

const HIDDEN_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

/**
 * Footer email capture strip — shown on all content pages.
 * Hidden only on auth routes where users are mid-flow.
 * Note: the `users` table and `email_subscribers` table are separate,
 * so a logged-in user isn't automatically on the marketing list.
 */
export function FooterEmailCapture() {
  const pathname = usePathname();

  // Hide on auth routes
  if (pathname && HIDDEN_ROUTES.some((r) => pathname.startsWith(r))) {
    return null;
  }

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
