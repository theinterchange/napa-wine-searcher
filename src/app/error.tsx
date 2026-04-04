"use client";

import { Wine } from "lucide-react";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center">
        <Wine className="mx-auto h-12 w-12 text-[var(--foreground)] opacity-50" />
        <h1 className="mt-4 font-heading text-2xl font-bold">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)] max-w-md mx-auto">
          We encountered an unexpected error. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-burgundy-700 px-4 py-2 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
