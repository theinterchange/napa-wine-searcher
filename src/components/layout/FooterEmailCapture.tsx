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
    <div className="border-b border-[var(--border)] bg-burgundy-50 dark:bg-burgundy-950/50">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <EmailCapture
          source="footer"
          heading="Get the free Napa & Sonoma planning guide"
          description="Insider tasting tips, the best wineries by region, and how to make the most of every stop — delivered to your inbox."
        />
      </div>
    </div>
  );
}
