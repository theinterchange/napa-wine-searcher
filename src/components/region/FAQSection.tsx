"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQSectionProps {
  faqs: { question: string; answer: string }[];
}

export function FAQSection({ faqs }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
      {faqs.map((faq, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            aria-expanded={openIndex === i}
            className="flex w-full items-center justify-between gap-4 py-4 text-left focus-visible:ring-2 focus-visible:ring-burgundy-500 focus-visible:ring-offset-2 rounded"
          >
            <h3 className="font-heading text-base font-semibold pr-4">
              {faq.question}
            </h3>
            <ChevronDown
              className={cn(
                "h-5 w-5 shrink-0 text-[var(--muted-foreground)] transition-transform",
                openIndex === i && "rotate-180"
              )}
            />
          </button>
          {openIndex === i && (
            <p className="pb-4 text-sm text-[var(--muted-foreground)] leading-relaxed">
              {faq.answer}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
