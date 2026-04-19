"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  User,
  FolderOpen,
  Route,
  BookOpen,
  LogOut,
  Settings,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { GlobalSearch } from "./GlobalSearch";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/wineries", label: "Wineries" },
  { href: "/where-to-stay", label: "Where to Stay" },
  { href: "/itineraries", label: "Plan Trip" },
  { href: "/blog", label: "Blog" },
];

const userMenuLinks = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/collections", label: "Collections", icon: FolderOpen },
  { href: "/my-trips", label: "My Trips", icon: Route },
  { href: "/journal", label: "Wine Journal", icon: BookOpen },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  return (
    <nav className="sticky top-0 z-50 border-b bg-[var(--card)] border-[var(--border)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7 shrink-0" aria-hidden="true">
              <rect width="32" height="32" rx="6" className="fill-burgundy-900 dark:fill-burgundy-800" />
              <path d="M16 6c-3 0-6 4-6 8 0 3.3 2.2 5.5 5 6v5h-3a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-5c2.8-.5 5-2.7 5-6 0-4-3-8-6-8z" fill="#d4a843" />
            </svg>
            <span className="font-heading text-lg font-bold text-burgundy-900 dark:text-gold-500 whitespace-nowrap">
              Napa Sonoma Guide
            </span>
          </Link>

          <div className="hidden lg:block flex-1">
            <GlobalSearch hideButton={pathname === "/"} />
          </div>

          <div className="hidden lg:flex items-center h-full gap-1 shrink-0">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center h-full px-3 text-sm transition-colors",
                  isActive(href)
                    ? "text-[var(--foreground)] font-semibold"
                    : "text-[var(--foreground)] hover:text-[var(--foreground)] font-medium opacity-60 hover:opacity-100"
                )}
              >
                {label}
                {isActive(href) && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-burgundy-900 dark:bg-gold-500 rounded-full" />
                )}
              </Link>
            ))}
            {session ? (
              <div className="relative ml-2" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  aria-label="Account menu"
                  className="flex items-center gap-1.5 rounded-full p-0.5 hover:ring-2 hover:ring-[var(--border)] transition-all focus-visible:ring-2 focus-visible:ring-burgundy-500 focus-visible:ring-offset-2"
                >
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="h-8 w-8 rounded-full border border-[var(--border)]"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-burgundy-100 text-burgundy-700 dark:bg-burgundy-900 dark:text-burgundy-300 text-sm font-semibold border border-[var(--border)]">
                      {session.user?.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                    </span>
                  )}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 max-w-[calc(100vw-2rem)] rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg py-1 z-50">
                    {userMenuLinks.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setUserMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors",
                          isActive(href) &&
                            "text-[var(--foreground)] font-semibold"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    ))}
                    {!!(session as unknown as Record<string, unknown>)?.isAdmin && (
                      <>
                        <div className="border-t border-[var(--border)] my-1" />
                        <Link
                          href="/nalaadmin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                          Admin
                        </Link>
                      </>
                    )}
                    <div className="border-t border-[var(--border)] my-1" />
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-burgundy-900 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          <div className="flex lg:hidden items-center gap-1">
            <GlobalSearch hideButton={pathname === "/"} />
            <button
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              aria-expanded={open}
              className="rounded p-1 focus-visible:ring-2 focus-visible:ring-burgundy-500 focus-visible:ring-offset-2"
            >
              {open ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden border-t border-[var(--border)] py-4 space-y-3">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "block text-sm font-medium",
                  isActive(href)
                    ? "text-[var(--foreground)] font-semibold"
                    : ""
                )}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
            {session ? (
              <>
                <div className="flex items-center gap-3 pb-2 mb-2 border-b border-[var(--border)]">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="h-8 w-8 rounded-full border border-[var(--border)]"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-burgundy-100 text-burgundy-700 dark:bg-burgundy-900 dark:text-burgundy-300 text-sm font-semibold border border-[var(--border)]">
                      {session.user?.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  )}
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {session.user?.name || "Account"}
                  </span>
                </div>
                {userMenuLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium",
                      isActive(href)
                        ? "text-[var(--foreground)] font-semibold"
                        : ""
                    )}
                    onClick={() => setOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    setOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block text-sm font-medium text-burgundy-700"
                onClick={() => setOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
