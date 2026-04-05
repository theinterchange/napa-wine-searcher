"use client";

import Link from "next/link";
import { ArrowRight, Heart, Route, BookOpen } from "lucide-react";
import { useSession } from "next-auth/react";

export function SignUpPrompt() {
  const { data: session } = useSession();

  if (session) return null;

  return (
    <div className="max-w-3xl mx-auto mb-12 text-center">
      <h2 className="font-heading text-2xl font-bold mb-3">
        Create Your Free Account
      </h2>
      <p className="text-[var(--muted-foreground)] mb-6">
        Get more out of your wine country experience with a free account.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-6">
        <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <Heart className="h-5 w-5 text-burgundy-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Save Favorites</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Bookmark wineries you love
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <Route className="h-5 w-5 text-burgundy-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Plan Trips</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Build and save custom routes
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <BookOpen className="h-5 w-5 text-burgundy-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Tasting Journal</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Log and rate wines you try
            </p>
          </div>
        </div>
      </div>
      <Link
        href="/signup"
        className="inline-flex items-center gap-2 rounded-lg bg-burgundy-900 px-6 py-3 text-sm font-semibold text-white hover:bg-burgundy-800 transition-colors"
      >
        Get Started — It&apos;s Free
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
