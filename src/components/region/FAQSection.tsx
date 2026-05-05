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
    <div className="border-t border-[var(--rule-soft)]">
      {faqs.map((faq, i) => (
        <div key={i} className="border-b border-[var(--rule-soft)]">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            aria-expanded={openIndex === i}
            className="flex w-full items-baseline justify-between gap-4 py-5 text-left focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:ring-offset-2"
          >
            <h3 className="font-[var(--font-heading)] text-[18px] leading-[1.3] font-normal text-[var(--ink)] tracking-[-0.01em] pr-4">
              {faq.question}
            </h3>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-[var(--ink-3)] transition-transform",
                openIndex === i && "rotate-180 text-[var(--brass)]"
              )}
            />
          </button>
          {openIndex === i && (
            <p className="pb-5 font-[var(--font-serif-text)] text-[15.5px] leading-[1.65] text-[var(--ink-2)]" style={{ textWrap: "pretty" }}>
              {faq.answer}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
