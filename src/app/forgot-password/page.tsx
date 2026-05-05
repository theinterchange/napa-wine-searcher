"use client";

import { useState } from "react";
import { Wine, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setStatus("success");
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm card-flat px-8 py-9">
        <div className="text-center">
          <Wine className="mx-auto h-9 w-9 text-[var(--brass)]" />
          <span className="block kicker mt-4">Members</span>
          <h1 className="editorial-h2 text-[28px] sm:text-[32px] mt-2">
            Reset <em>password.</em>
          </h1>
          <p className="font-[var(--font-serif-text)] text-[14px] text-[var(--ink-2)] mt-3 leading-relaxed">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {status === "success" ? (
          <div className="mt-8 border border-[var(--brass)] bg-[var(--paper)] px-4 py-3 text-center font-[var(--font-serif-text)] text-[14px] text-[var(--ink-2)]">
            If an account exists for that email, we&apos;ve sent a password reset link. Check your inbox (and spam folder).
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="label-kicker">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-editorial"
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="btn-ink w-full"
            >
              {status === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
        )}

        <div className="mt-7 pt-5 border-t border-[var(--rule-soft)] text-center">
          <Link
            href="/login"
            className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[var(--ink)] hover:text-[var(--brass-2)] transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
