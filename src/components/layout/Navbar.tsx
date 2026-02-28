"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wine, Map, Menu, X, GitCompareArrows } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/wineries", label: "Wineries" },
  { href: "/map", label: "Map", icon: Map },
  { href: "/compare", label: "Compare", icon: GitCompareArrows },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="sticky top-0 z-50 border-b bg-[var(--card)]/90 backdrop-blur border-[var(--border)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Wine className="h-6 w-6 text-burgundy-700 dark:text-burgundy-300" />
            <span className="font-heading text-xl font-bold text-burgundy-900 dark:text-cream-100">
              Wine Country Guide
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1 text-sm font-medium transition-colors border-b-2 pb-0.5",
                  isActive(href)
                    ? "text-burgundy-700 dark:text-burgundy-400 border-burgundy-700 dark:border-burgundy-400"
                    : "text-[var(--foreground)] hover:text-burgundy-700 dark:hover:text-burgundy-400 border-transparent"
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {label}
              </Link>
            ))}
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
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "block text-sm font-medium",
                  isActive(href)
                    ? "text-burgundy-700 dark:text-burgundy-400"
                    : ""
                )}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
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
