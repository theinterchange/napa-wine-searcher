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
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
        <div className="text-center">
          <Wine className="mx-auto h-10 w-10 text-burgundy-700 dark:text-burgundy-400" />
          <h1 className="mt-4 font-heading text-2xl font-bold">
            Reset Password
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {status === "success" ? (
          <p className="mt-8 text-center text-sm text-[var(--muted-foreground)]">
            If an account exists with that email, we&apos;ve sent a reset link. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-lg bg-burgundy-700 px-4 py-3 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors disabled:opacity-50"
            >
              {status === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
          <Link
            href="/login"
            className="text-burgundy-700 hover:text-burgundy-800 dark:text-burgundy-400 font-medium"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
