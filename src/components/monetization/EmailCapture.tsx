"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Check,
  Loader2,
  Heart,
  BookOpen,
  Route,
  ArrowRight,
  Wine,
  BedDouble,
} from "lucide-react";

export type EmailCaptureSource =
  | "itinerary"
  | "guide"
  | "exit_intent"
  | "blog"
  | "winery"
  | "search"
  | "homepage"
  | "footer"
  | "signup_direct";

interface EmailCaptureProps {
  source: EmailCaptureSource;
  heading?: string;
  description?: string;
  buttonText?: string;
  compact?: boolean;
}

const UPSELL_BENEFITS = [
  { icon: Heart, text: "Save favorite wineries and build collections" },
  { icon: Check, text: "Track which wineries you've visited" },
  { icon: BookOpen, text: "Log tastings in your wine journal" },
  { icon: Route, text: "Save and share custom trip itineraries" },
];

export function EmailCapture({
  source,
  heading = "Get Your Free Wine Country Planning Guide",
  description = "Tips on the best wineries, when to visit, and how to save on tastings — delivered straight to your inbox.",
  buttonText = "Send Me the Guide",
  compact = false,
}: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Something went wrong");
        setStatus("error");
        return;
      }

      setSubmittedEmail(email);
      setStatus("success");
      setEmail("");
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    const signupHref = `/signup?email=${encodeURIComponent(submittedEmail)}&from=${source}`;

    if (compact) {
      return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-burgundy-600 text-white">
              <Check className="h-3.5 w-3.5" />
            </div>
            <p className="text-sm font-semibold">
              Your guide is on the way!
            </p>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">
            Check your inbox. Create a free account to save wineries, track visits, log tastings, and plan trips.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={signupHref}
              className="inline-flex items-center gap-1.5 rounded-lg bg-burgundy-900 px-3 py-2 text-xs font-semibold text-white hover:bg-burgundy-800 transition-colors"
            >
              Create Free Account
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/wineries"
              className="text-xs font-medium text-[var(--foreground)] hover:underline"
            >
              or browse wineries &rarr;
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-[var(--border)] bg-burgundy-50 dark:bg-burgundy-950 p-6 sm:p-8">
        <div className="text-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-burgundy-600 text-white mx-auto">
            <Check className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-heading text-xl font-bold text-burgundy-950 dark:text-white">
            Your guide is on the way!
          </h3>
          <p className="mt-2 text-sm text-burgundy-800 dark:text-burgundy-100">
            Check your inbox for the Napa &amp; Sonoma planning guide.
          </p>
        </div>

        <div className="mt-6 border-t border-burgundy-200 dark:border-burgundy-800 pt-6">
          <div className="text-center mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-burgundy-700 dark:text-burgundy-300">
              Make it yours
            </p>
            <h4 className="mt-1 font-heading text-lg font-bold text-burgundy-950 dark:text-white">
              Create a free account
            </h4>
            <p className="mt-1 text-sm text-burgundy-800 dark:text-burgundy-100 max-w-md mx-auto">
              Save everything that catches your eye and pick up where you left off:
            </p>
          </div>

          <ul className="space-y-2 max-w-md mx-auto mb-5">
            {UPSELL_BENEFITS.map((benefit) => (
              <li
                key={benefit.text}
                className="flex items-start gap-2.5 text-sm text-burgundy-900 dark:text-burgundy-100"
              >
                <benefit.icon className="h-4 w-4 shrink-0 text-burgundy-600 dark:text-burgundy-400 mt-0.5" />
                <span>{benefit.text}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col items-center gap-2">
            <Link
              href={signupHref}
              className="inline-flex items-center gap-2 rounded-lg bg-burgundy-900 px-6 py-3 text-sm font-semibold text-white hover:bg-burgundy-800 transition-colors"
            >
              Create Free Account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Secondary navigation — for users who don't want an account */}
          <div className="mt-6 pt-5 border-t border-burgundy-200 dark:border-burgundy-800">
            <p className="text-center text-xs font-medium uppercase tracking-wider text-burgundy-700 dark:text-burgundy-300 mb-3">
              Or keep exploring
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/wineries"
                className="inline-flex items-center gap-2 rounded-lg border border-burgundy-300 dark:border-burgundy-700 bg-transparent px-5 py-2.5 text-sm font-medium text-burgundy-900 dark:text-burgundy-100 hover:bg-burgundy-100 dark:hover:bg-burgundy-900 transition-colors"
              >
                <Wine className="h-4 w-4" />
                Browse Wineries
              </Link>
              <Link
                href="/where-to-stay"
                className="inline-flex items-center gap-2 rounded-lg border border-burgundy-300 dark:border-burgundy-700 bg-transparent px-5 py-2.5 text-sm font-medium text-burgundy-900 dark:text-burgundy-100 hover:bg-burgundy-100 dark:hover:bg-burgundy-900 transition-colors"
              >
                <BedDouble className="h-4 w-4" />
                Browse Hotels
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="h-4 w-4 text-burgundy-600 dark:text-burgundy-400" />
          <h3 className="text-sm font-semibold">{heading}</h3>
        </div>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-400"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="shrink-0 rounded-lg bg-burgundy-900 px-4 py-2 text-sm font-medium text-white hover:bg-burgundy-800 disabled:opacity-50 transition-colors"
          >
            {status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              buttonText
            )}
          </button>
        </div>
        {status === "error" && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            {errorMessage}
          </p>
        )}
      </form>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-burgundy-50 dark:bg-burgundy-950 p-6 sm:p-8 text-center">
      <Mail className="h-8 w-8 mx-auto text-burgundy-600 dark:text-burgundy-400 mb-3" />
      <h3 className="font-heading text-xl font-bold text-burgundy-950 dark:text-white">{heading}</h3>
      <p className="mt-2 text-sm text-burgundy-800 dark:text-burgundy-100 max-w-md mx-auto">
        {description}
      </p>
      <form
        onSubmit={handleSubmit}
        className="mt-5 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-400"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="shrink-0 rounded-lg bg-burgundy-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-burgundy-800 disabled:opacity-50 transition-colors"
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          ) : (
            buttonText
          )}
        </button>
      </form>
      {status === "error" && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}
      <p className="mt-3 text-xs text-burgundy-800 dark:text-burgundy-100">
        No spam, ever. Unsubscribe anytime.
      </p>
    </div>
  );
}
