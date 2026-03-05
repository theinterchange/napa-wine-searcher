"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function ShareButton({ title, text, compact }: { title: string; text?: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to copy
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      title={compact ? (copied ? "Link Copied" : "Share") : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors",
        compact ? "px-2.5 py-2" : "px-3 py-2"
      )}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-600" />
          {!compact && "Link Copied"}
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          {!compact && "Share"}
        </>
      )}
    </button>
  );
}
