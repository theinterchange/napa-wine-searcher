"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wine,
  Map,
  Menu,
  X,
  GitCompareArrows,
  ChevronDown,
  User,
  FolderOpen,
  Route,
  BookOpen,
  Bookmark,
  LogOut,
  Newspaper,
  BedDouble,
  Settings,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { GlobalSearch } from "./GlobalSearch";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/wineries", label: "Wineries" },
  { href: "/where-to-stay", label: "Where to Stay", icon: BedDouble },
  { href: "/map", label: "Map", icon: Map },
  { href: "/plan-trip", label: "Plan Trip", icon: Route },
  { href: "/blog", label: "Blog", icon: Newspaper },
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
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Wine className="h-6 w-6 text-burgundy-900 dark:text-burgundy-200" />
            <span className="font-heading text-xl font-extrabold text-burgundy-900 dark:text-gold-600">
              Napa Sonoma Guide
            </span>
          </Link>

          <GlobalSearch hideButton={pathname === "/"} />

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
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  className="flex items-center gap-2 text-sm font-medium hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors focus-visible:ring-2 focus-visible:ring-burgundy-500 focus-visible:ring-offset-2 rounded"
                >
                  {session.user?.image && (
                    <img
                      src={session.user.image}
                      alt=""
                      className="h-7 w-7 rounded-full"
                    />
                  )}
                  {session.user?.name}
                  <ChevronDown className="h-3.5 w-3.5" />
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
                            "text-burgundy-700 dark:text-burgundy-400"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    ))}
                    {session.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL && (
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
                className="rounded-md bg-burgundy-700 px-4 py-2 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          <div className="flex md:hidden items-center gap-1">
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
            {session ? (
              <>
                {userMenuLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium",
                      isActive(href)
                        ? "text-burgundy-700 dark:text-burgundy-400"
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
            <ThemeToggle />
          </div>
        )}
      </div>
    </nav>
  );
}
