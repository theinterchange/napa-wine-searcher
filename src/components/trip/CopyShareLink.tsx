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
  );
}
