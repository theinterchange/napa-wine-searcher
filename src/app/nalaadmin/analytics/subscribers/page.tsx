import Link from "next/link";
import { ArrowLeft, Users, UserPlus, Mail } from "lucide-react";
import { getAllSubscribers } from "@/lib/analytics-queries";
import { StatCard } from "../components/StatCard";
import { SubscribersTable } from "./SubscribersTable";

export default async function SubscribersPage() {
  const subscribers = await getAllSubscribers();

  const now = Date.now();
  const day = 86400000;
  const last7 = subscribers.filter(
    (s) => now - new Date(s.subscribedAt).getTime() < 7 * day
  ).length;
  const last30 = subscribers.filter(
    (s) => now - new Date(s.subscribedAt).getTime() < 30 * day
  ).length;

  const bySource = subscribers.reduce<Record<string, number>>((acc, s) => {
    acc[s.source] = (acc[s.source] || 0) + 1;
    return acc;
  }, {});
  const topSource =
    Object.entries(bySource).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  return (
    <div>
      <Link
        href="/nalaadmin/analytics"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Analytics
      </Link>

      <h1 className="font-heading text-3xl font-bold mb-2">
        Email Subscribers
      </h1>
      <p className="text-sm text-[var(--muted-foreground)] mb-8">
        Full list of everyone who joined the email list, with source and signup
        date.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          label="Total Subscribers"
          value={subscribers.length}
          icon={<Users className="h-4 w-4" />}
          subtitle="All time"
        />
        <StatCard
          label="New (7 days)"
          value={last7}
          icon={<UserPlus className="h-4 w-4" />}
        />
        <StatCard
          label="New (30 days)"
          value={last30}
          icon={<UserPlus className="h-4 w-4" />}
        />
        <StatCard
          label="Top Source"
          value={topSource}
          icon={<Mail className="h-4 w-4" />}
          subtitle={`${bySource[topSource] ?? 0} subscribers`}
        />
      </div>

      <SubscribersTable subscribers={subscribers} />
    </div>
  );
}
