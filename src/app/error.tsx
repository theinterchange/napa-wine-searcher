"use client";

import { useEffect } from "react";
import { Wine } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <Wine className="mx-auto h-12 w-12 text-[var(--foreground)] opacity-50" />
        <h1 className="mt-4 font-[var(--font-heading)] text-[26px] sm:text-[30px] font-normal tracking-[-0.01em] text-[var(--ink)]">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)] max-w-md mx-auto">
          We encountered an unexpected error. Please try again.
        </p>
        {isDev && (
          <pre className="mx-auto mt-4 max-w-xl overflow-auto rounded-lg border border-[var(--border)] bg-[var(--muted)] p-3 text-left text-xs text-[var(--foreground)]">
            {error.message}
            {error.digest ? `\n\ndigest: ${error.digest}` : ""}
          </pre>
        )}
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
