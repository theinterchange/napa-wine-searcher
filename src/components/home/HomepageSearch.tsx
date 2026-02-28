"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function HomepageSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/wineries?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative max-w-lg w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-burgundy-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search wineries by name..."
        className="w-full rounded-full bg-white/10 backdrop-blur-sm border border-white/20 py-3 pl-12 pr-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400/50"
      />
    </form>
  );
}
