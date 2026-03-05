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
        className="text-sm text-[var(--muted-foreground)] hover:text-burgundy-700 dark:hover:text-burgundy-400 flex items-center gap-1"
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-medium text-white dark:text-gray-900 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          Link copied to clipboard!
        </div>
      )}
    </>
  );
}
