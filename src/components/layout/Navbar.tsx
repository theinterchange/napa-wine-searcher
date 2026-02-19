"use client";

import Link from "next/link";
import { Wine, Map, Menu, X, GitCompareArrows } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { useSession } from "next-auth/react";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 border-b bg-[var(--card)]/90 backdrop-blur border-[var(--border)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Wine className="h-6 w-6 text-burgundy-700 dark:text-burgundy-400" />
            <span className="font-heading text-xl font-bold text-burgundy-900 dark:text-cream-100">
              Wine Country Guide
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/wineries"
              className="text-sm font-medium text-[var(--foreground)] hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors"
            >
              Wineries
            </Link>
            <Link
              href="/map"
              className="flex items-center gap-1 text-sm font-medium text-[var(--foreground)] hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors"
            >
              <Map className="h-4 w-4" />
              Map
            </Link>
            <Link
              href="/compare"
              className="flex items-center gap-1 text-sm font-medium text-[var(--foreground)] hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors"
            >
              <GitCompareArrows className="h-4 w-4" />
              Compare
            </Link>
            <ThemeToggle />
            {session ? (
              <span className="text-sm text-[var(--muted-foreground)]">
                {session.user?.name}
              </span>
            ) : (
              <Link
                href="/login"
                className="rounded-md bg-burgundy-700 px-4 py-2 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          <button
            className="md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-[var(--border)] py-4 space-y-3">
            <Link
              href="/wineries"
              className="block text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              Wineries
            </Link>
            <Link
              href="/map"
              className="block text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              Map
            </Link>
            <Link
              href="/compare"
              className="block text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              Compare
            </Link>
            {!session && (
              <Link
                href="/login"
                className="block text-sm font-medium text-burgundy-700"
                onClick={() => setOpen(false)}
              >
                Sign In
              </Link>
            )}
            <ThemeToggle />
          </div>
        )}
      </div>
    </nav>
  );
}
