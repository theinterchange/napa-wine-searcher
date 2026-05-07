import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that read searchParams and would otherwise be marked dynamic by
// Next.js (Cache-Control: private, no-cache, no-store). These pages produce
// SSR HTML that is identical for every visitor — Navbar/auth state hydrates
// client-side — so we override to a public edge-cacheable response. ~60s
// freshness with 5m stale-while-revalidate means at most one user per minute
// pays the SSR + Turso round-trip cost; everyone else is served from the
// Vercel edge cache.
const EDGE_CACHEABLE_PATHS = new Set<string>(["/wineries", "/where-to-stay"]);

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (EDGE_CACHEABLE_PATHS.has(request.nextUrl.pathname)) {
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );
  }

  return response;
}

export const config = {
  matcher: ["/wineries", "/where-to-stay"],
};
