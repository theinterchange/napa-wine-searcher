"use client";

import { Search } from "lucide-react";

export function HeroSearchTrigger() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("open-global-search"))}
      className="relative max-w-lg w-full text-left rounded-full bg-white/10 backdrop-blur-sm border border-white/20 py-3 pl-12 pr-4 text-white/70 hover:bg-white/15 hover:border-white/30 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
    >
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-burgundy-400" />
      Search wineries, wines, regions...
    </button>
  );
}
