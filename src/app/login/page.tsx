"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { Wine } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error || !result?.ok) {
        setError("Invalid email or password");
        setLoading(false);
      } else {
        window.location.href = callbackUrl;
      }
    } catch {
      setError("Invalid email or password");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm card-flat px-8 py-9">
      <div className="text-center">
        <Wine className="mx-auto h-9 w-9 text-[var(--brass)]" />
        <span className="block kicker mt-4">Members</span>
        <h1 className="editorial-h2 text-[28px] sm:text-[32px] mt-2">
          Welcome <em>back.</em>
        </h1>
        <p className="font-[var(--font-serif-text)] text-[14px] text-[var(--ink-2)] mt-3 leading-relaxed">
          Sign in to save favorites, add notes, and track your visits.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && (
          <div className="border border-red-700 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

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

        <div>
          <label htmlFor="password" className="label-kicker">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-editorial"
          />
          <div className="mt-1.5 text-right">
            <Link
              href="/forgot-password"
              className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[var(--brass-2)] hover:text-[var(--ink)] transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-ink w-full">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="mt-7 pt-5 border-t border-[var(--rule-soft)] text-center font-[var(--font-serif-text)] text-[14px] text-[var(--ink-2)]">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="not-italic font-mono text-[10.5px] tracking-[0.18em] uppercase text-[var(--ink)] hover:text-[var(--brass-2)] transition-colors"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
