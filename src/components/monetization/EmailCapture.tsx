"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Check, Loader2, ArrowRight } from "lucide-react";

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

export function EmailCapture({
  source,
  heading = "Get the free Napa & Sonoma planning guide",
  description = "Insider tasting tips, the best wineries by region, and how to make the most of every stop — delivered to your inbox.",
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

    return (
      <div className={compact ? "" : "text-center"}>
        <span className="kicker">Sent</span>
        <h3 className="editorial-h2 text-[24px] sm:text-[28px] mt-2">
          Your guide is on the <em>way.</em>
        </h3>
        <p className="mt-3 font-[var(--font-serif-text)] text-[15px] leading-[1.55] text-[var(--ink-2)] max-w-[52ch] mx-auto">
          Check your inbox. Create a free account to save wineries, track visits, and plan trips.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <Link href={signupHref} className="btn-ink inline-flex items-center gap-2">
            Create free account
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/wineries"
            className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[var(--ink-2)] hover:text-[var(--brass-2)] transition-colors"
          >
            Or keep browsing →
          </Link>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="card-flat p-5">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="h-4 w-4 text-[var(--brass)]" />
          <span className="kicker">{heading}</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="input-editorial flex-1"
          />
          <button type="submit" disabled={status === "loading"} className="btn-ink shrink-0">
            {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : buttonText}
          </button>
        </div>
        {status === "error" && (
          <p className="mt-2 font-[var(--font-serif-text)] text-[12.5px] text-[var(--ink-3)]">
            {errorMessage}
          </p>
        )}
      </form>
    );
  }

  return (
    <div className="text-center">
      <span className="kicker">Field notes</span>
      <h3 className="editorial-h2 text-[26px] sm:text-[32px] mt-2">{heading}</h3>
      <p className="mt-3 font-[var(--font-serif-text)] text-[15px] leading-[1.55] text-[var(--ink-2)] max-w-[52ch] mx-auto">
        {description}
      </p>
      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="input-editorial flex-1"
        />
        <button type="submit" disabled={status === "loading"} className="btn-ink shrink-0">
          {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : buttonText}
        </button>
      </form>
      {status === "error" && (
        <p className="mt-2 font-[var(--font-serif-text)] text-[12.5px] text-[var(--ink-3)]">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
