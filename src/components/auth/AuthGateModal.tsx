"use client";

import Link from "next/link";
import { X, Heart, Route, BookOpen, ArrowRight } from "lucide-react";
import { useEffect, useCallback } from "react";

interface AuthGateModalProps {
  /** Feature-specific message, e.g. "Save this itinerary to revisit later" */
  message: string;
  onClose: () => void;
}

const FEATURES = [
  {
    icon: Heart,
    label: "Save & Organize",
    desc: "Bookmark wineries and build collections for every trip",
  },
  {
    icon: Route,
    label: "Plan & Share Trips",
    desc: "Build custom itineraries with routes, timing, and maps",
  },
  {
    icon: BookOpen,
    label: "Tasting Journal",
    desc: "Log wines, rate tastings, and keep notes from every visit",
  },
];

export function AuthGateModal({ message, onClose }: AuthGateModalProps) {
  const callbackUrl =
    typeof window !== "undefined" ? window.location.pathname : "/";

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Create a free account"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 sm:p-8">
          <h2 className="font-[var(--font-heading)] text-[22px] sm:text-[26px] font-normal tracking-[-0.01em] text-[var(--ink)] pr-8">
            Create a free account
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
            {message}
          </p>

          <div className="mt-6 space-y-4">
            {FEATURES.map((f) => (
              <div key={f.label} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-burgundy-200 dark:border-burgundy-800 bg-burgundy-50 dark:bg-burgundy-950">
                  <f.icon className="h-4 w-4 text-burgundy-700 dark:text-burgundy-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{f.label}</p>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="flex items-center justify-center gap-2 rounded-lg bg-burgundy-900 px-5 py-3 text-sm font-semibold text-white hover:bg-burgundy-800 transition-colors"
            >
              Create Free Account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-center text-xs text-[var(--muted-foreground)]">
              Already have an account?{" "}
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                className="text-[var(--foreground)] hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
