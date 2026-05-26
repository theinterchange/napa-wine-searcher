"use client";

import { useState, type ReactNode } from "react";
import { Mail, Loader2 } from "lucide-react";

interface Props {
  /** Source attribution stored on `email_subscribers.source`. Must be a value
   *  the schema enum already accepts — `"guide"` is the closest semantic fit
   *  until we extend the enum for per-magnet attribution. */
  source: "guide" | "itinerary" | "blog";
  /** Headline above the form (pre-submit state). */
  heading: string;
  /** Sub-headline (pre-submit state). */
  description: string;
  /** Renders inside the success card, after the user submits. The full lead
   *  magnet content lives here. */
  children: ReactNode;
}

/**
 * Lead-magnet email capture: trade-an-email-for-content pattern.
 *
 * On submit, hits /api/subscribe and reveals `children` inline in place of the
 * form. No redirect, no email-delivery dependency — the magnet content IS the
 * success state. (The existing sendGuideEmail() inside /api/subscribe still
 * fires harmlessly; it links to an auth-gated PDF that lead-magnet users can't
 * access, but the on-page reveal is the real delivery surface.)
 */
export function LeadMagnetCapture({ source, heading, description, children }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
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
        body: JSON.stringify({ email: email.trim(), source }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMessage(body.error ?? "Could not save your email. Try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setErrorMessage("Network error. Try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <section className="border-y border-[var(--brass)] bg-[var(--paper-2)]/60 py-8 sm:py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <span className="kicker inline-flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-[var(--brass)]" />
            Delivered
          </span>
          <h2 className="editorial-h2 text-[26px] sm:text-[32px] mt-2">
            Here&apos;s your <em>guide.</em>
          </h2>
          <p className="mt-2 font-[var(--font-serif-text)] text-[14.5px] leading-[1.55] text-[var(--ink-3)]">
            We&apos;ll keep your inbox quiet — just the occasional planning note.
          </p>
        </div>
        <div className="mt-8">{children}</div>
      </section>
    );
  }

  return (
    <section className="border-y border-[var(--rule)] bg-[var(--paper-2)]/60 py-10 sm:py-14">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
        <span className="kicker">Free guide</span>
        <h2
          className="editorial-h2 text-[28px] sm:text-[36px] mt-2"
          style={{ textWrap: "balance" }}
        >
          {heading}
        </h2>
        <p
          className="mt-4 max-w-[52ch] mx-auto font-[var(--font-serif-text)] text-[16px] leading-[1.55] text-[var(--ink-2)]"
          style={{ textWrap: "pretty" }}
        >
          {description}
        </p>
        <form
          onSubmit={handleSubmit}
          className="mt-7 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={status === "loading"}
            className="input-editorial flex-1"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="btn-ink shrink-0"
          >
            {status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            ) : (
              "Get the guide"
            )}
          </button>
        </form>
        {status === "error" && (
          <p className="mt-3 font-[var(--font-serif-text)] text-[13px] text-[#a92020]">
            {errorMessage}
          </p>
        )}
      </div>
    </section>
  );
}
