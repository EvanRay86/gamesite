"use client";

import { useMemo, useState } from "react";
import { Section } from "@/components/calculus/ui";

const TERMS: { term: string; def: string }[] = [
  { term: "Antiderivative", def: "A function whose derivative is the given function; the result of indefinite integration (includes + C)." },
  { term: "Asymptote", def: "A line a curve approaches but never reaches (horizontal, vertical, or slant)." },
  { term: "Chain rule", def: "Differentiates a composite function: the derivative of the outside times the derivative of the inside." },
  { term: "Concavity", def: "Whether a curve bends upward (concave up, f″ > 0) or downward (concave down, f″ < 0)." },
  { term: "Continuity", def: "A function is continuous at a point if its limit there equals its value — no holes, jumps, or breaks." },
  { term: "Critical point", def: "A point where the derivative is zero or undefined; a candidate for a maximum or minimum." },
  { term: "Definite integral", def: "The signed area under a curve between two bounds; a single number." },
  { term: "Derivative", def: "The instantaneous rate of change of a function; the slope of its tangent line." },
  { term: "Difference quotient", def: "[f(x+h) − f(x)] / h, the average slope whose limit (as h→0) defines the derivative." },
  { term: "Differential equation", def: "An equation relating a function to its own derivatives; its solution is a function." },
  { term: "Extremum", def: "A maximum or minimum value of a function (local or global)." },
  { term: "Fundamental Theorem of Calculus", def: "Links derivatives and integrals: they are inverse operations." },
  { term: "Gradient", def: "The vector of partial derivatives; points in the direction of steepest increase." },
  { term: "Implicit differentiation", def: "Differentiating an equation not solved for y, applying the chain rule to y terms." },
  { term: "Indeterminate form", def: "An ambiguous limit like 0/0 or ∞/∞ that requires more work (factoring or L'Hôpital's rule)." },
  { term: "Indefinite integral", def: "The family of all antiderivatives of a function, written with + C." },
  { term: "Inflection point", def: "A point where concavity switches (f″ changes sign)." },
  { term: "Integration by parts", def: "A technique reversing the product rule: ∫u dv = uv − ∫v du." },
  { term: "L'Hôpital's rule", def: "For 0/0 or ∞/∞ limits, take the derivative of the top and bottom separately." },
  { term: "Limit", def: "The value a function approaches as the input approaches some point." },
  { term: "Partial derivative", def: "The derivative of a multivariable function with respect to one variable, holding the others fixed." },
  { term: "Riemann sum", def: "An approximation of area using rectangles; its limit is the definite integral." },
  { term: "Secant line", def: "A line through two points on a curve; its slope is an average rate of change." },
  { term: "Series", def: "The sum of the terms of a sequence; can be finite or infinite." },
  { term: "Slope field", def: "A grid of short segments showing the slope a differential equation prescribes at each point." },
  { term: "Tangent line", def: "A line touching a curve at one point with the same slope as the curve there." },
  { term: "Taylor series", def: "An expression of a function as an infinite polynomial built from its derivatives." },
  { term: "u-substitution", def: "An integration technique reversing the chain rule by substituting u = g(x)." },
];

export default function GlossarySection() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return TERMS;
    return TERMS.filter((t) => t.term.toLowerCase().includes(s) || t.def.toLowerCase().includes(s));
  }, [q]);

  return (
    <Section
      id="glossary"
      number="A-Z"
      accent="purple"
      title="Glossary"
      subtitle="Every key term, defined in one line."
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search terms…"
        className="mb-4 w-full rounded-xl border-2 border-border-light bg-white px-4 py-2.5 outline-none transition-colors focus:border-purple"
        spellCheck={false}
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {filtered.map((t) => (
          <div key={t.term} className="rounded-xl border border-border-light bg-white/60 p-3">
            <div className="font-bold text-purple">{t.term}</div>
            <div className="text-sm leading-relaxed text-text-secondary">{t.def}</div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-text-muted">No terms match “{q}”.</p>
        )}
      </div>
    </Section>
  );
}
