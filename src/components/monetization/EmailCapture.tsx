"use client";

import { useState } from "react";
import { Mail, Check, Loader2, Download } from "lucide-react";

interface EmailCaptureProps {
  source: "itinerary" | "guide" | "exit_intent";
  heading?: string;
  description?: string;
  buttonText?: string;
  successMessage?: string;
  compact?: boolean;
}

export function EmailCapture({
  source,
  heading = "Get Your Free Wine Country Planning Guide",
  description = "Tips on the best wineries, when to visit, and how to save on tastings — delivered straight to your inbox.",
  buttonText = "Send Me the Guide",
  successMessage = "Check your inbox! We'll send your guide shortly.",
  compact = false,
}: EmailCaptureProps) {
  const [email, setEmail] = useState("");
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

      setStatus("success");
      setEmail("");
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className={`rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 ${compact ? "p-4" : "p-6"}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="h-4 w-4" />
          </div>
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            Your guide is ready!
          </p>
        </div>
        <a
          href="/api/guide/download"
          download
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-burgundy-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-burgundy-800 transition-colors"
        >
          <Download className="h-4 w-4" />
          Download Your Free Guide (PDF)
        </a>
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
            className="shrink-0 rounded-lg bg-burgundy-700 px-4 py-2 text-sm font-medium text-white hover:bg-burgundy-800 disabled:opacity-50 transition-colors"
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
    <div className="rounded-xl border border-[var(--border)] bg-olive-50 dark:bg-olive-950 p-6 sm:p-8 text-center">
      <Mail className="h-8 w-8 mx-auto text-burgundy-600 dark:text-burgundy-400 mb-3" />
      <h3 className="font-heading text-xl font-bold text-olive-900 dark:text-white">{heading}</h3>
      <p className="mt-2 text-sm text-olive-700 dark:text-olive-300 max-w-md mx-auto">
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
          className="shrink-0 rounded-lg bg-burgundy-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-burgundy-800 disabled:opacity-50 transition-colors"
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
      <p className="mt-3 text-xs text-[var(--muted-foreground)]">
        No spam, ever. Unsubscribe anytime.
      </p>
    </div>
  );
}
