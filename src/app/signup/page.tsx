"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Heart,
  Route,
  BookOpen,
  ArrowRight,
  Download,
  MapPin,
  Star,
  Users,
  Check,
  Mail,
  Loader2,
  Wine,
  BedDouble,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const ACCOUNT_FEATURES = [
  {
    icon: Heart,
    label: "Save & Organize",
    desc: "Bookmark wineries, build themed collections, and never lose track of a recommendation. Every favorite is waiting when the next trip comes around.",
  },
  {
    icon: Route,
    label: "Plan & Share Trips",
    desc: "Build custom day-trip itineraries with optimized routes, timing between stops, and maps. Save trips to revisit later or share with travel companions.",
  },
  {
    icon: BookOpen,
    label: "Tasting Journal",
    desc: "Log every wine, rate tastings, and keep personal notes that build a record of every visit — from the standout Cab to the surprising Viognier.",
  },
];

const QUICK_STATS = [
  { icon: MapPin, value: "225+", label: "Wineries" },
  { icon: Star, value: "7", label: "Regions" },
  { icon: Users, value: "Free", label: "Forever" },
];

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const prefilledEmail = searchParams.get("email") || "";

  // If email is already captured (from inline EmailCapture), start at Step 2
  const [step, setStep] = useState<1 | 2>(prefilledEmail ? 2 : 1);
  const [email, setEmail] = useState(prefilledEmail);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Step 1: Email capture ---
  async function handleEmailCapture(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "signup_direct" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }
      setLoading(false);
      setStep(2);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  // --- Step 2: Account creation ---
  async function handleAccountCreation(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.status === 409) {
        // Email already registered — redirect to login with flash context
        router.push(
          `/login?email=${encodeURIComponent(email)}&existing=1&callbackUrl=${encodeURIComponent(callbackUrl)}`
        );
        return;
      }

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      await signIn("credentials", {
        email,
        password,
        callbackUrl,
      });
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh]">
      {/* Mobile hero image */}
      <div className="relative aspect-[21/9] w-full lg:hidden">
        <Image
          src="/images/blog/napa-spring-hero.jpg"
          alt="Napa Valley vineyards with mustard flowers in spring"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[var(--background)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
          {/* Left: Editorial pitch */}
          <div className="lg:sticky lg:top-24">
            {/* Desktop hero image */}
            <div className="relative hidden lg:block aspect-[16/10] w-full rounded-xl overflow-hidden">
              <Image
                src="/images/blog/napa-spring-hero.jpg"
                alt="Napa Valley vineyards with mustard flowers in spring"
                fill
                priority
                sizes="50vw"
                className="object-cover"
              />
            </div>

            <div className="mt-6 lg:mt-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                {step === 1
                  ? "Start with your free guide"
                  : "Next: save your favorites and plan your trips"}
              </p>
              <h1 className="mt-2 font-heading text-3xl sm:text-4xl font-bold leading-tight">
                {step === 1 ? (
                  <>
                    Your free Napa &amp; Sonoma
                    <br className="hidden sm:block" /> planning guide
                  </>
                ) : (
                  <>
                    The tools to plan every
                    <br className="hidden sm:block" /> wine country visit
                  </>
                )}
              </h1>
              <p className="mt-4 text-[var(--muted-foreground)] leading-relaxed">
                {step === 1
                  ? "Insider tasting tips, the best wineries by region, seasonal advice, and how to make the most of every stop. Just enter your email — no account required."
                  : "A free account unlocks everything needed to discover, plan, and remember the best of Napa and Sonoma — from the first tasting to the hundredth."}
              </p>

              {/* Quick stats */}
              <div className="mt-6 flex gap-6">
                {QUICK_STATS.map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <s.icon className="h-4 w-4 text-[var(--muted-foreground)]" />
                    <p className="text-sm">
                      <span className="font-semibold">{s.value}</span>{" "}
                      <span className="text-[var(--muted-foreground)]">
                        {s.label}
                      </span>
                    </p>
                  </div>
                ))}
              </div>

              {/* Account-exclusive features — primary pitch */}
              <div className="mt-8 space-y-5">
                {ACCOUNT_FEATURES.map((f) => (
                  <div key={f.label} className="flex items-start gap-4">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-burgundy-100 dark:bg-burgundy-900/40">
                      <f.icon className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400" />
                    </div>
                    <div>
                      <p className="font-semibold">{f.label}</p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)] leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Guide bonus — only show on step 1 */}
              {step === 1 && (
                <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                  <div className="flex items-start gap-3">
                    <Download className="mt-0.5 h-5 w-5 shrink-0 text-burgundy-600 dark:text-burgundy-400" />
                    <div>
                      <p className="font-semibold">
                        Plus: Free Wine Country Planning Guide
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)] leading-relaxed">
                        A downloadable PDF with the best wineries for every style,
                        insider tasting tips, day trip itineraries by region, and
                        where to eat and stay. Delivered instantly to your inbox.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Form card */}
          <div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
              {step === 1 ? (
                // ──────── STEP 1: Email capture ────────
                <>
                  <div>
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-burgundy-100 dark:bg-burgundy-900/40 mb-4">
                      <Mail className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400" />
                    </div>
                    <h2 className="font-heading text-2xl font-bold">
                      Get your free planning guide
                    </h2>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                      Just enter your email — no account required. We&apos;ll send
                      the guide straight to your inbox.
                    </p>
                  </div>

                  <form onSubmit={handleEmailCapture} className="mt-6 space-y-4">
                    {error && (
                      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {error}
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="email-step1"
                        className="block text-sm font-medium mb-1"
                      >
                        Email
                      </label>
                      <input
                        id="email-step1"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                        placeholder="you@example.com"
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-lg bg-burgundy-900 px-4 py-3 text-sm font-semibold text-white hover:bg-burgundy-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Me the Guide
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    <p className="text-center text-xs text-[var(--muted-foreground)]">
                      No spam, ever. Unsubscribe anytime.
                    </p>
                  </form>

                  <div className="mt-6 border-t border-[var(--border)] pt-4 text-center text-sm text-[var(--muted-foreground)]">
                    Already have an account?{" "}
                    <Link
                      href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                      className="text-[var(--foreground)] hover:underline font-medium"
                    >
                      Sign in
                    </Link>
                  </div>
                </>
              ) : (
                // ──────── STEP 2: Account creation ────────
                <>
                  <div>
                    <div className="flex items-start gap-3 rounded-lg bg-burgundy-50 dark:bg-burgundy-950 px-4 py-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-burgundy-600 text-white mt-0.5">
                        <Check className="h-4 w-4" />
                      </div>
                      <div className="text-sm">
                        <p className="font-semibold text-burgundy-950 dark:text-white">
                          Guide sent to {email}
                        </p>
                        <p className="mt-0.5 text-xs text-burgundy-800 dark:text-burgundy-100">
                          Check your inbox shortly.
                        </p>
                      </div>
                    </div>

                    <h2 className="mt-6 font-heading text-2xl font-bold">
                      Create your free account
                    </h2>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                      Unlock saved wineries, trip planning, and a tasting journal.
                    </p>
                  </div>

                  <form onSubmit={handleAccountCreation} className="mt-6 space-y-4">
                    {error && (
                      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {error}
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium mb-1"
                      >
                        Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                        placeholder="Your name"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium mb-1"
                      >
                        Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                        placeholder="At least 8 characters"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium mb-1"
                      >
                        Confirm Password
                      </label>
                      <input
                        id="confirmPassword"
                        type="password"
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                      />
                    </div>

                    <div className="flex items-start gap-2">
                      <input
                        id="age-confirm"
                        type="checkbox"
                        checked={ageConfirmed}
                        onChange={(e) => setAgeConfirmed(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-[var(--border)] text-burgundy-900 focus:ring-burgundy-500"
                      />
                      <label
                        htmlFor="age-confirm"
                        className="text-xs text-[var(--muted-foreground)]"
                      >
                        I confirm that I am 21 years of age or older
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !ageConfirmed}
                      className="w-full rounded-lg bg-burgundy-900 px-4 py-3 text-sm font-semibold text-white hover:bg-burgundy-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        "Creating account..."
                      ) : (
                        <>
                          Create Free Account
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    <p className="text-center text-xs text-[var(--muted-foreground)]">
                      No credit card required. Free forever.
                    </p>
                  </form>

                  {/* Secondary navigation — for users who don't want an account */}
                  <div className="mt-6 border-t border-[var(--border)] pt-5">
                    <p className="text-center text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)] mb-3">
                      Or keep exploring
                    </p>
                    <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3">
                      <Link
                        href="/wineries"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                      >
                        <Wine className="h-4 w-4" />
                        Browse Wineries
                      </Link>
                      <Link
                        href="/where-to-stay"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                      >
                        <BedDouble className="h-4 w-4" />
                        Browse Hotels
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-[var(--border)] pt-4 text-center text-sm text-[var(--muted-foreground)]">
                    Already have an account?{" "}
                    <Link
                      href={`/login?email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`}
                      className="text-[var(--foreground)] hover:underline font-medium"
                    >
                      Sign in
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
