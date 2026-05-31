"use client";

import { Section, Callout, Collapsible } from "@/components/calculus/ui";
import SectionFaq from "@/components/calculus/SectionFaq";
import { M, MathBlock } from "@/components/calculus/Math";
import ProblemGenerator from "@/components/calculus/ProblemGenerator";

const BASIC: { i: string; r: string }[] = [
  { i: "\\int x^n\\,dx", r: "\\dfrac{x^{n+1}}{n+1} + C" },
  { i: "\\int \\dfrac{1}{x}\\,dx", r: "\\ln|x| + C" },
  { i: "\\int e^x\\,dx", r: "e^x + C" },
  { i: "\\int \\cos x\\,dx", r: "\\sin x + C" },
  { i: "\\int \\sin x\\,dx", r: "-\\cos x + C" },
  { i: "\\int \\sec^2 x\\,dx", r: "\\tan x + C" },
  { i: "\\int \\dfrac{1}{1+x^2}\\,dx", r: "\\arctan x + C" },
];

export default function IntTechniquesSection() {
  return (
    <Section
      id="int-techniques"
      number="6"
      accent="teal"
      title="Integration Techniques"
      subtitle="Antiderivatives don't follow neat rules like derivatives — here's the toolkit."
    >
      <p>
        Differentiation is mechanical; integration is more like puzzle-solving. There&apos;s no universal product or
        quotient rule for integrals. Instead you learn a handful of techniques and recognize which one fits.
      </p>

      <h3 className="mt-4 text-xl font-bold text-text-primary">① u-Substitution (reverse chain rule)</h3>
      <p>
        When you spot a function <em>and</em> its derivative inside the integral, substitute. It undoes the chain
        rule.
      </p>
      <Callout kind="example" title="A clean u-sub">
        <p className="mb-1">For <M>{`\\int 2x\\,(x^2+1)^5\\,dx`}</M>, let <M>{`u = x^2+1`}</M>, so <M>{`du = 2x\\,dx`}</M>:</p>
        <MathBlock>{`\\int u^5\\,du = \\frac{u^6}{6} + C = \\frac{(x^2+1)^6}{6} + C`}</MathBlock>
      </Callout>

      <ProblemGenerator generatorIds={["int-usub"]} title="Practice: u-Substitution" accent="teal" />

      <h3 className="mt-6 text-xl font-bold text-text-primary">② Integration by Parts (reverse product rule)</h3>
      <p>For products of unlike functions (a polynomial times a log or exponential, say):</p>
      <MathBlock>{`\\int u\\,dv = uv - \\int v\\,du`}</MathBlock>
      <Callout kind="tip" title="LIATE: how to pick u">
        <p>
          Choose <M>u</M> by priority — <strong>L</strong>ogarithmic, <strong>I</strong>nverse trig,{" "}
          <strong>A</strong>lgebraic, <strong>T</strong>rigonometric, <strong>E</strong>xponential. Whatever&apos;s
          earlier in LIATE becomes <M>u</M>; the rest is <M>dv</M>.
        </p>
      </Callout>
      <Callout kind="example" title="Parts in action">
        <p className="mb-1"><M>{`\\int x\\,e^x\\,dx`}</M>: let <M>{`u=x`}</M> (algebraic), <M>{`dv=e^x dx`}</M>. Then <M>{`du=dx`}</M>, <M>{`v=e^x`}</M>:</p>
        <MathBlock>{`\\int x e^x\\,dx = x e^x - \\int e^x\\,dx = x e^x - e^x + C = e^x(x-1) + C`}</MathBlock>
      </Callout>

      <Collapsible summary="③ Partial fractions (for rational functions)" accent="teal">
        <p className="mb-2">
          Split a complicated fraction into simple pieces you can integrate. For example:
        </p>
        <MathBlock>{`\\frac{1}{(x-1)(x+2)} = \\frac{1/3}{x-1} - \\frac{1/3}{x+2}`}</MathBlock>
        <p>Each piece integrates to a logarithm: <M>{`\\frac{1}{3}\\ln|x-1| - \\frac{1}{3}\\ln|x+2| + C`}</M>.</p>
      </Collapsible>

      <Collapsible summary="④ Trig integrals & trig substitution" accent="teal">
        <p className="mb-2">
          Use identities like <M>{`\\sin^2 x = \\tfrac{1-\\cos 2x}{2}`}</M> to break down powers of sine and cosine.
          For roots like <M>{`\\sqrt{a^2-x^2}`}</M>, substitute <M>{`x = a\\sin\\theta`}</M> to turn the root into a
          clean trig expression.
        </p>
      </Collapsible>

      <h3 className="mt-6 text-xl font-bold text-text-primary">Basic integrals to know cold</h3>
      <div className="my-3 overflow-hidden rounded-xl border border-border-light">
        <table className="w-full text-left">
          <thead className="bg-teal/10">
            <tr className="text-sm text-teal">
              <th className="px-4 py-2 font-bold">Integral</th>
              <th className="px-4 py-2 font-bold">Result</th>
            </tr>
          </thead>
          <tbody>
            {BASIC.map((r, i) => (
              <tr key={i} className={i % 2 ? "bg-white/40" : "bg-white/70"}>
                <td className="px-4 py-2"><M>{r.i}</M></td>
                <td className="px-4 py-2"><M>{r.r}</M></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout kind="warning" title="Some integrals have no elementary answer">
        <p>
          A few innocent-looking integrals — like <M>{`\\int e^{-x^2}\\,dx`}</M> (the bell curve!) — simply
          can&apos;t be written with elementary functions. That&apos;s not a failing on your part; it&apos;s a fact
          of life, and why numerical integration (like the Riemann sums earlier) matters.
        </p>
      </Callout>
      <SectionFaq sectionId="int-techniques" accent="teal" />
    </Section>
  );
}
