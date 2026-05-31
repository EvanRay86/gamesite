"use client";

import { Section, Callout } from "@/components/calculus/ui";
import SectionFaq from "@/components/calculus/SectionFaq";
import { M, MathBlock } from "@/components/calculus/Math";
import ProblemGenerator from "@/components/calculus/ProblemGenerator";

const COMMON: { f: string; df: string }[] = [
  { f: "c \\text{ (constant)}", df: "0" },
  { f: "x^n", df: "n x^{n-1}" },
  { f: "e^x", df: "e^x" },
  { f: "a^x", df: "a^x \\ln a" },
  { f: "\\ln x", df: "\\dfrac{1}{x}" },
  { f: "\\sin x", df: "\\cos x" },
  { f: "\\cos x", df: "-\\sin x" },
  { f: "\\tan x", df: "\\sec^2 x" },
  { f: "\\arcsin x", df: "\\dfrac{1}{\\sqrt{1-x^2}}" },
  { f: "\\arctan x", df: "\\dfrac{1}{1+x^2}" },
];

export default function DerivRulesSection() {
  return (
    <Section
      id="deriv-rules"
      number="3"
      accent="amber"
      title="Differentiation Rules"
      subtitle="The complete toolkit — combine these to differentiate anything."
    >
      <p>
        Three structural rules handle how functions are combined, plus a short table of known derivatives. Master
        these and you can differentiate essentially any expression you&apos;ll meet.
      </p>

      <div className="my-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <RuleCard title="Product Rule" color="coral">
          <MathBlock>{`(uv)' = u'v + uv'`}</MathBlock>
          <p className="text-sm">“First times derivative of second, plus second times derivative of first.”</p>
        </RuleCard>
        <RuleCard title="Quotient Rule" color="sky">
          <MathBlock>{`\\left(\\frac{u}{v}\\right)' = \\frac{u'v - uv'}{v^2}`}</MathBlock>
          <p className="text-sm">“Low d-high minus high d-low, over low squared.”</p>
        </RuleCard>
        <RuleCard title="Chain Rule" color="purple">
          <MathBlock>{`\\big(f(g(x))\\big)' = f'(g(x))\\,g'(x)`}</MathBlock>
          <p className="text-sm">“Derivative of the outside (leave inside), times derivative of the inside.”</p>
        </RuleCard>
      </div>

      <Callout kind="warning" title="The #1 source of lost points: the chain rule">
        <p>
          Forgetting to multiply by the inside&apos;s derivative is the most common calculus mistake. <M>{`\\frac{d}{dx}\\sin(3x)`}</M>{" "}
          is <M>{`3\\cos(3x)`}</M>, <strong>not</strong> <M>{`\\cos(3x)`}</M>. Whenever a function is “wrapped” around
          something other than a bare <M>x</M>, the chain rule is in play.
        </p>
      </Callout>

      <h3 className="mt-6 text-xl font-bold text-text-primary">Common derivatives to know cold</h3>
      <div className="my-3 overflow-hidden rounded-xl border border-border-light">
        <table className="w-full text-left">
          <thead className="bg-amber/10">
            <tr className="text-sm text-amber">
              <th className="px-4 py-2 font-bold">f(x)</th>
              <th className="px-4 py-2 font-bold">f ′(x)</th>
            </tr>
          </thead>
          <tbody>
            {COMMON.map((r, i) => (
              <tr key={i} className={i % 2 ? "bg-white/40" : "bg-white/70"}>
                <td className="px-4 py-2"><M>{r.f}</M></td>
                <td className="px-4 py-2"><M>{r.df}</M></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout kind="example" title="Putting rules together">
        <p className="mb-1">Differentiate <M>{`f(x) = x^2 \\sin x`}</M> (product rule):</p>
        <MathBlock>{`f'(x) = (2x)(\\sin x) + (x^2)(\\cos x) = 2x\\sin x + x^2\\cos x`}</MathBlock>
        <p className="mb-1">Differentiate <M>{`g(x) = e^{x^2}`}</M> (chain rule, inside is <M>{`x^2`}</M>):</p>
        <MathBlock>{`g'(x) = e^{x^2}\\cdot 2x = 2x\\,e^{x^2}`}</MathBlock>
      </Callout>

      <div className="my-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ProblemGenerator generatorIds={["deriv-product"]} title="Practice: Product Rule" accent="coral" />
        <ProblemGenerator generatorIds={["deriv-quotient"]} title="Practice: Quotient Rule" accent="sky" />
        <ProblemGenerator generatorIds={["deriv-chain"]} title="Practice: Chain Rule" accent="purple" />
        <ProblemGenerator generatorIds={["deriv-trig", "deriv-explog"]} title="Practice: Trig / Exp / Log" accent="amber" />
      </div>

      <Callout kind="tip" title="Higher-order derivatives">
        <p>
          Differentiate again to get <M>{`f''(x)`}</M> (acceleration, concavity), and again for <M>{`f'''(x)`}</M>,
          and so on. Each derivative describes how the previous one is changing.
        </p>
      </Callout>
      <SectionFaq sectionId="deriv-rules" accent="amber" />
    </Section>
  );
}

function RuleCard({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border-t-4 border-${color} bg-white/70 p-4 shadow-sm`}>
      <div className={`mb-1 text-sm font-bold text-${color}`}>{title}</div>
      <div className="text-text-secondary">{children}</div>
    </div>
  );
}
