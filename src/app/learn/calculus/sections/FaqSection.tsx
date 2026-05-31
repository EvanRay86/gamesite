"use client";

import { useState } from "react";
import { Section } from "@/components/calculus/ui";
import { CALC_FAQS } from "../faq-data";

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Section
      id="faq"
      number="?"
      accent="amber"
      title="Frequently Asked Questions"
      subtitle="The questions every calculus learner asks."
    >
      <div className="space-y-2">
        {CALC_FAQS.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="overflow-hidden rounded-xl border border-border-light bg-white/60">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-semibold text-text-primary transition-colors hover:bg-amber/5"
                aria-expanded={isOpen}
              >
                <span>{faq.question}</span>
                <span className={`shrink-0 text-amber transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`} aria-hidden>
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
    </Section>
  );
}
