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
    <nav className="sticky top-0 z-50 border-b bg-[var(--paper)]/95 backdrop-blur-sm border-[var(--rule-soft)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <svg
              viewBox="0 0 32 32"
              className="h-7 w-7 shrink-0"
              aria-hidden="true"
            >
              <rect width="32" height="32" rx="4" fill="var(--color-burgundy-900)" />
              <path
                d="M 8 6 L 24 6 C 24 13.5, 21 17.5, 16.8 18 L 16.8 25.8 L 22 25.8 L 22 27.3 L 10 27.3 L 10 25.8 L 15.2 25.8 L 15.2 18 C 11 17.5, 8 13.5, 8 6 Z"
                fill="var(--paper)"
              />
              <path
                d="M 10 11.8 Q 16 13.4, 22 11.8 Q 21 17, 16 17.7 Q 11 17, 10 11.8 Z"
                fill="var(--brass)"
              />
            </svg>
            <span
              className="font-mono text-[12.5px] tracking-[0.22em] uppercase font-semibold whitespace-nowrap text-[var(--ink)]"
            >
              Napa Sonoma Guide
            </span>
          </Link>

          <div className="hidden lg:flex flex-1 justify-center">
            <div className="w-full max-w-md">
              <GlobalSearch hideButton={pathname === "/"} />
            </div>
          </div>

          <div className="hidden lg:flex items-center h-full gap-0 shrink-0">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center h-full px-3.5 font-mono text-[11px] tracking-[0.18em] uppercase transition-colors",
                  isActive(href)
                    ? "text-[var(--ink)] font-semibold"
                    : "text-[var(--ink-2)] hover:text-[var(--ink)] font-medium"
                )}
              >
                {label}
                {isActive(href) && (
                  <span className="absolute inset-x-3 bottom-2.5 h-px bg-[var(--brass)]" />
                )}
              </Link>
            ))}
            {session ? (
              <div className="relative ml-2" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  aria-controls="user-menu"
                  aria-haspopup="menu"
                  aria-label="Account menu"
                  className="flex items-center gap-1.5 p-0.5 hover:ring-2 hover:ring-[var(--brass)]/30 transition-all focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:ring-offset-2"
                >
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="h-8 w-8 border border-[var(--rule)]"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center bg-[var(--paper-2)] text-[var(--ink)] font-mono text-[12px] tracking-[0.05em] font-semibold border border-[var(--rule)]">
                      {session.user?.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                    </span>
                  )}
                </button>

                {userMenuOpen && (
                  <div id="user-menu" role="menu" className="absolute right-0 top-full mt-2 w-52 max-w-[calc(100vw-2rem)] border border-[var(--rule)] bg-[var(--paper)] shadow-lg py-1 z-50">
                    {userMenuLinks.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setUserMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 px-4 py-2.5 font-mono text-[11px] tracking-[0.16em] uppercase transition-colors",
                          isActive(href)
                            ? "text-[var(--ink)] font-semibold bg-[var(--paper-2)]"
                            : "text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)]"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 text-[var(--brass)]" />
                        {label}
                      </Link>
                    ))}
                    {!!(session as unknown as Record<string, unknown>)?.isAdmin && (
                      <>
                        <div className="border-t border-[var(--rule-soft)] my-1" />
                        <Link
                          href="/nalaadmin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] transition-colors"
                        >
                          <Settings className="h-3.5 w-3.5 text-[var(--brass)]" />
                          Admin
                        </Link>
                      </>
                    )}
                    <div className="border-t border-[var(--rule-soft)] my-1" />
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] transition-colors text-left"
                    >
                      <LogOut className="h-3.5 w-3.5 text-[var(--brass)]" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="ml-3 bg-burgundy-900 px-4 py-2 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-white hover:bg-burgundy-800 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          <div className="flex lg:hidden items-center gap-1 -mr-2">
            <GlobalSearch hideButton={pathname === "/"} />
            <button
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              aria-expanded={open}
              aria-controls="mobile-nav"
              className="p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:ring-offset-2"
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
          <div id="mobile-nav" className="lg:hidden border-t border-[var(--rule-soft)] py-4 space-y-3">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "block font-mono text-[11px] tracking-[0.18em] uppercase",
                  isActive(href)
                    ? "text-[var(--ink)] font-semibold"
                    : "text-[var(--ink-2)] font-medium"
                )}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
            {session ? (
              <>
                <div className="flex items-center gap-3 pb-3 mb-2 border-b border-[var(--rule-soft)]">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="h-8 w-8 border border-[var(--rule)]"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center bg-[var(--paper-2)] text-[var(--ink)] font-mono text-[12px] font-semibold border border-[var(--rule)]">
                      {session.user?.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  )}
                  <span className="font-mono text-[11px] tracking-[0.16em] uppercase font-medium text-[var(--ink)]">
                    {session.user?.name || "Account"}
                  </span>
                </div>
                {userMenuLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] uppercase",
                      isActive(href)
                        ? "text-[var(--ink)] font-semibold"
                        : "text-[var(--ink-2)] font-medium"
                    )}
                    onClick={() => setOpen(false)}
                  >
                    <Icon className="h-3.5 w-3.5 text-[var(--brass)]" />
                    {label}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    setOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] uppercase font-medium text-[var(--ink-2)]"
                >
                  <LogOut className="h-3.5 w-3.5 text-[var(--brass)]" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)]"
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
