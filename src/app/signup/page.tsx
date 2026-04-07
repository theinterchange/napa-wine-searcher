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
  Loader2,
  Wine,
  BedDouble,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const ACCOUNT_FEATURES = [
  {
    icon: Heart,
    label: "Save & Organize",
    desc: "Bookmark wineries and build collections for every trip",
  },
  {
    icon: Route,
    label: "Plan & Share Trips",
    desc: "Build custom itineraries with routes, timing, and maps",
  },
  {
    icon: BookOpen,
    label: "Tasting Journal",
    desc: "Log wines, rate tastings, and keep notes from every visit",
  },
];

const QUICK_STATS = [
  { icon: MapPin, value: "225+", label: "Wineries" },
  { icon: BedDouble, value: "128+", label: "Hotels" },
  { icon: Star, value: "7", label: "Regions" },
  { icon: Wine, value: "700+", label: "Tastings" },
];

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const prefilledEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(prefilledEmail);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Create account
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.status === 409) {
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

      // Send guide as a bonus (non-blocking)
      fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "signup_direct" }),
      }).catch(() => {});

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
          {/* Left: Editorial pitch — guide + site value */}
          <div>
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
              <h1 className="font-heading text-3xl sm:text-4xl font-bold leading-tight">
                Your wine country
                <br className="hidden sm:block" /> companion
              </h1>
              <p className="mt-4 text-[var(--muted-foreground)] leading-relaxed">
                Discover the best of Napa and Sonoma — from iconic estates to
                hidden gems. A free account unlocks everything needed to plan,
                save, and remember every visit.
              </p>

              {/* Quick stats */}
              <div className="mt-6 flex flex-wrap gap-5">
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

              {/* Guide bonus */}
              <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                <div className="flex items-start gap-3">
                  <Download className="mt-0.5 h-5 w-5 shrink-0 text-burgundy-600 dark:text-burgundy-400" />
                  <div>
                    <p className="font-semibold">
                      Free Wine Country Planning Guide
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)] leading-relaxed">
                      A downloadable PDF with the best wineries for every style,
                      insider tasting tips, day trip itineraries by region, and
                      where to eat and stay. Delivered to your inbox when you
                      sign up.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form card + value props */}
          <div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
              <h2 className="font-heading text-2xl font-bold">
                Create your free account
              </h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Unlock saved wineries, trip planning, and a tasting journal.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                    placeholder="you@example.com"
                    autoFocus={!prefilledEmail}
                  />
                </div>

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
                    autoFocus={!!prefilledEmail}
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
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
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Free Account
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Value props */}
              <div className="mt-6 border-t border-[var(--border)] pt-5 space-y-3">
                {ACCOUNT_FEATURES.map((f) => (
                  <div key={f.label} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-burgundy-200 dark:border-burgundy-800 bg-burgundy-50 dark:bg-burgundy-950">
                      <f.icon className="h-3.5 w-3.5 text-burgundy-700 dark:text-burgundy-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{f.label}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-[var(--border)] pt-4 text-center text-sm text-[var(--muted-foreground)]">
                Already have an account?{" "}
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                  className="text-[var(--foreground)] hover:underline font-medium"
                >
                  Sign in
                </Link>
              </div>
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
