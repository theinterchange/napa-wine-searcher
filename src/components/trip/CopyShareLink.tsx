"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";

export function CopyShareLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(
      `${window.location.origin}${path}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={handleCopy}
        className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1"
      >
        {copied ? (
          <>
            <Check className="h-3 w-3 text-green-600" /> Copied
          </>
        ) : (
          <>
            <Share2 className="h-3 w-3" /> Share
          </>
        )}
      </button>
      {copied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[var(--ink)] px-4 py-2 text-sm font-medium text-[var(--paper)] shadow-[0_8px_24px_rgba(0,0,0,0.18)] animate-in fade-in slide-in-from-bottom-2 duration-200">
          Link copied to clipboard!
        </div>
      )}
    </>
  );
}
