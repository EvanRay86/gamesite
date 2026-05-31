"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SectionFaq.tsx — a compact FAQ accordion rendered INSIDE a lesson section
// (within the chapter's <Section>, unlike the page-level FAQ block). Pulls its
// questions from SECTION_FAQS by section id.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { getSectionFaqs } from "@/app/learn/calculus/faq-data";

const ACCENT_TEXT: Record<string, string> = {
  coral: "text-coral",
  teal: "text-teal",
  sky: "text-sky",
  amber: "text-amber",
  purple: "text-purple",
  green: "text-green",
};
const ACCENT_HOVER: Record<string, string> = {
  coral: "hover:bg-coral/5",
  teal: "hover:bg-teal/5",
  sky: "hover:bg-sky/5",
  amber: "hover:bg-amber/5",
  purple: "hover:bg-purple/5",
  green: "hover:bg-green/5",
};

export default function SectionFaq({
  sectionId,
  accent = "purple",
  title = "Common Questions",
}: {
  sectionId: string;
  accent?: string;
  title?: string;
}) {
  const faqs = getSectionFaqs(sectionId);
  const [open, setOpen] = useState<number | null>(null);
  if (!faqs.length) return null;

  const text = ACCENT_TEXT[accent] ?? ACCENT_TEXT.purple;
  const hover = ACCENT_HOVER[accent] ?? ACCENT_HOVER.purple;

  return (
    <div className="mt-8">
      <h3 className={`mb-3 flex items-center gap-2 text-lg font-bold ${text}`}>
        <span aria-hidden>❓</span> {title}
      </h3>
      <div className="space-y-2">
        {faqs.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-border-light bg-white/60"
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[15px] font-semibold text-text-primary transition-colors ${hover}`}
                aria-expanded={isOpen}
              >
                <span>{faq.question}</span>
                <span
                  className={`shrink-0 ${text} transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
                  aria-hidden
                >
                  +
                </span>
              </button>
              {isOpen && (
                <div className="animate-fade-in border-t border-border-light px-4 py-3 text-[15px] leading-relaxed text-text-secondary">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
