import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Wine, BedDouble, LayoutDashboard, BarChart3, Mail, ExternalLink, Share2, Route } from "lucide-react";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[var(--muted)]/30">
      <div className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center gap-6">
            <Link
              href="/nalaadmin"
              className="flex items-center gap-2 font-heading font-bold text-lg"
            >
              <LayoutDashboard className="h-5 w-5" />
              Admin
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/nalaadmin/wineries"
                className="flex items-center gap-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <Wine className="h-4 w-4" />
                Wineries
              </Link>
              <Link
                href="/nalaadmin/accommodations"
                className="flex items-center gap-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <BedDouble className="h-4 w-4" />
                Accommodations
              </Link>
              <Link
                href="/nalaadmin/routes"
                className="flex items-center gap-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <Route className="h-4 w-4" />
                Routes
              </Link>
              <Link
                href="/nalaadmin/social"
                className="flex items-center gap-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Social
              </Link>
              <Link
                href="/nalaadmin/analytics"
                className="flex items-center gap-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Link>
              <Link
                href="/nalaadmin/analytics/subscribers"
                className="flex items-center gap-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <Mail className="h-4 w-4" />
                Subscribers
              </Link>
              <Link
                href="/nalaadmin/analytics/clicks"
                className="flex items-center gap-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Clicks
              </Link>
            </nav>
            <div className="ml-auto text-xs text-[var(--muted-foreground)]">
              {session?.user?.email}
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
