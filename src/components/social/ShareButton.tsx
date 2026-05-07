"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function ShareButton({ title, text }: { title: string; text?: string }) {
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
    <>
      <button
        onClick={handleShare}
        className={cn(
          "inline-flex items-center gap-2 px-3.5 py-2.5 border border-[var(--rule)] bg-[var(--paper)] font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)] hover:border-[var(--brass)] hover:text-[var(--brass-2)] transition-colors"
        )}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-700" />
            Copied
          </>
        ) : (
          <>
            <Share2 className="h-3.5 w-3.5 text-[var(--brass)]" />
            Share
          </>
        )}
      </button>
      {copied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-medium text-white dark:text-gray-900 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          Link copied to clipboard!
        </div>
      )}
    </>
  );
}
