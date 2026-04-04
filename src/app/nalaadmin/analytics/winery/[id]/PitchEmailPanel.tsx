"use client";

import { useState } from "react";
import { Mail, Copy, Send, Check, Loader2 } from "lucide-react";

interface PitchEmailPanelProps {
  wineryId: number;
  wineryName: string;
  wineryEmail: string | null;
  totalClicks: number;
  periodLabel: string;
}

function generatePlainTextEmail(wineryName: string, totalClicks: number, periodLabel: string) {
  return `Hi there,

I'm Michael from Napa Sonoma Guide (napasonomaguide.com), a wine country discovery platform helping visitors plan their Napa and Sonoma trips.

Your winery, ${wineryName}, already has a listing on our site. In the ${periodLabel}, your listing received ${totalClicks} clicks from engaged wine country visitors.

Our platform reaches a growing number of email subscribers actively planning wine country trips, plus organic search traffic from people searching for Napa and Sonoma wineries.

Featured Listing Benefits:
- Priority placement in search results and recommendations
- Enhanced listing with more photos, tasting menu details, and video
- "Featured Winery" badge on your listing
- Inclusion in our monthly email to subscribers
- Dedicated blog post or guide feature

Featured listings start at $100/month, cancel anytime. Would you be interested in a quick call to discuss?

Best,
Michael Chen
Napa Sonoma Guide
napasonomaguide.com`;
}

export function PitchEmailPanel({
  wineryId,
  wineryName,
  wineryEmail,
  totalClicks,
  periodLabel,
}: PitchEmailPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState(
    `Partnership Opportunity — ${wineryName} on Napa Sonoma Guide`
  );
  const [email, setEmail] = useState(wineryEmail || "");
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const body = generatePlainTextEmail(wineryName, totalClicks, periodLabel);

  async function handleCopy() {
    const text = `Subject: ${subject}\nTo: ${email}\n\n${body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSend() {
    if (!email) {
      setError("No email address provided");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/admin/pitch-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wineryId,
          subject,
          recipientEmail: email,
          periodDays: 30,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-burgundy-700 text-white px-4 py-2.5 text-sm font-medium hover:bg-burgundy-800 transition-colors"
      >
        <Mail className="h-4 w-4" />
        Generate Pitch Email
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <h2 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
        <Mail className="h-5 w-5" />
        Pitch Email
      </h2>

      {sent ? (
        <div className="flex items-center gap-2 text-green-600 py-4">
          <Check className="h-5 w-5" />
          <span className="font-medium">Email sent to {email}</span>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                To
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="winery@example.com"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
              {!wineryEmail && (
                <p className="text-xs text-amber-600 mt-1">
                  No email on file — enter manually
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Preview
              </label>
              <pre className="whitespace-pre-wrap text-sm bg-[var(--muted)]/30 rounded-lg border border-[var(--border)] p-4 max-h-64 overflow-y-auto font-sans">
                {body}
              </pre>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 mb-4">{error}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !email}
              className="inline-flex items-center gap-2 rounded-lg bg-burgundy-700 text-white px-4 py-2 text-sm font-medium hover:bg-burgundy-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Sending..." : "Send via Email"}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] ml-auto"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
