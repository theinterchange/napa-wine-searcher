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
      <div className="w-full max-w-sm card-flat px-8 py-9 text-center">
        <Wine className="mx-auto h-9 w-9 text-[var(--brass)]" />
        <span className="block kicker mt-4">Members</span>
        <h1 className="editorial-h2 text-[28px] sm:text-[32px] mt-2">
          Link <em>expired.</em>
        </h1>
        <p className="font-[var(--font-serif-text)] text-[14px] text-[var(--ink-2)] mt-3 leading-relaxed">
          This reset link has expired or is invalid. Please request a new one.
        </p>
        <Link href="/forgot-password" className="btn-ink mt-6 inline-flex">
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm card-flat px-8 py-9">
      <div className="text-center">
        <Wine className="mx-auto h-9 w-9 text-[var(--brass)]" />
        <span className="block kicker mt-4">Members</span>
        <h1 className="editorial-h2 text-[28px] sm:text-[32px] mt-2">
          Set new <em>password.</em>
        </h1>
      </div>

      {status === "success" ? (
        <p className="mt-8 text-center font-[var(--font-serif-text)] text-[14px] text-[var(--ink-2)]">
          Password updated! Redirecting to login...
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && (
            <div className="border border-red-700 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="password" className="label-kicker">
              New Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-editorial"
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="label-kicker">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              "Reset Password"
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
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
