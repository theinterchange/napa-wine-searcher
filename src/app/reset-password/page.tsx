"use client";

import { Suspense, useState } from "react";
import { Wine, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setStatus("loading");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, password }),
    });

    if (res.ok) {
      setStatus("success");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      setStatus("error");
    }
  }

  if (!token || !email) {
    return (
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
        <Wine className="mx-auto h-10 w-10 text-burgundy-700 dark:text-burgundy-400" />
        <h1 className="mt-4 font-heading text-2xl font-bold">Invalid Link</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          This reset link is invalid or has expired.
        </p>
        <Link
          href="/forgot-password"
          className="mt-4 inline-block text-sm text-burgundy-700 hover:text-burgundy-800 dark:text-burgundy-400 font-medium"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
      <div className="text-center">
        <Wine className="mx-auto h-10 w-10 text-burgundy-700 dark:text-burgundy-400" />
        <h1 className="mt-4 font-heading text-2xl font-bold">
          Set New Password
        </h1>
      </div>

      {status === "success" ? (
        <p className="mt-8 text-center text-sm text-[var(--muted-foreground)]">
          Password updated! Redirecting to login...
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              New Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              "Reset Password"
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
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
