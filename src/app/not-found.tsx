import { Wine } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center">
        <Wine className="mx-auto h-12 w-12 text-[var(--foreground)] opacity-50" />
        <h1 className="mt-4 font-[var(--font-heading)] text-[26px] sm:text-[30px] font-normal tracking-[-0.01em] text-[var(--ink)]">
          Page Not Found
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)] max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-burgundy-700 px-4 py-2 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/wineries"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
          >
            Browse Wineries
          </Link>
        </div>
      </div>
    </div>
  );
}
