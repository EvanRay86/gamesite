"use client";

import { Section, Callout, KeyIdea } from "@/components/calculus/ui";
import SectionFaq from "@/components/calculus/SectionFaq";
import { M, MathBlock } from "@/components/calculus/Math";
import RiemannSumDemo from "@/components/calculus/demos/RiemannSumDemo";
import ProblemGenerator from "@/components/calculus/ProblemGenerator";

export default function IntegralsSection() {
  return (
    <Section
      id="integrals"
      number="5"
      accent="green"
      title="The Integral & the Fundamental Theorem"
      subtitle="Adding up infinitely many slivers — and the theorem that ties it all together."
    >
      <p>
        Differentiation breaks change into instantaneous rates. Integration runs the other direction: it{" "}
        <strong>accumulates</strong>. The definite integral measures the area under a curve — and area turns out to
        encode totals of every kind: distance from speed, work from force, profit from marginal profit.
      </p>

      <h3 className="mt-4 text-xl font-bold text-text-primary">From rectangles to exact area</h3>
      <p>
        Approximate the area under a curve with rectangles, then let their number go to infinity. The limit of these{" "}
        <strong>Riemann sums</strong> is the definite integral:
      </p>

      <MathBlock>{`\\int_a^b f(x)\\,dx = \\lim_{n\\to\\infty} \\sum_{i=1}^{n} f(x_i)\\,\\Delta x`}</MathBlock>

      <RiemannSumDemo />

      <KeyIdea title="What the symbols mean">
        The <M>{`\\int`}</M> is a stretched “S” for <em>sum</em>. The <M>{`dx`}</M> is the width of an
        infinitely thin slice. So <M>{`\\int_a^b f(x)\\,dx`}</M> literally reads: “sum the slivers{" "}
        <M>{`f(x)\\,dx`}</M> from <M>{`x=a`}</M> to <M>{`x=b`}</M>.”
      </KeyIdea>

      <h3 className="mt-6 text-xl font-bold text-text-primary">The Fundamental Theorem of Calculus</h3>
      <p>
        Here is the punchline of the entire subject — the bridge between derivatives and integrals. It comes in two
        parts:
      </p>

      <div className="my-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border-t-4 border-green bg-white/70 p-4 shadow-sm">
          <div className="mb-1 text-sm font-bold text-green">Part 1 — differentiation undoes integration</div>
          <MathBlock>{`\\frac{d}{dx}\\int_a^x f(t)\\,dt = f(x)`}</MathBlock>
          <p className="text-sm text-text-secondary">The rate at which area accumulates is just the height of the curve.</p>
        </div>
        <div className="rounded-xl border-t-4 border-teal bg-white/70 p-4 shadow-sm">
          <div className="mb-1 text-sm font-bold text-teal">Part 2 — how to actually compute integrals</div>
          <MathBlock>{`\\int_a^b f(x)\\,dx = F(b) - F(a)`}</MathBlock>
          <p className="text-sm text-text-secondary">where <M>{`F`}</M> is any antiderivative of <M>{`f`}</M>. Find an antiderivative, plug in the bounds, subtract.</p>
        </div>
      </div>

      <Callout kind="intuition" title="Why this is miraculous">
        <p>
          Computing area by hand means summing infinitely many rectangles — brutal. Part 2 says you can skip all of
          that: just reverse-engineer a function whose derivative is <M>{`f`}</M>, and evaluate it at the two
          endpoints. Two centuries of hard area problems collapse into &quot;find an antiderivative.&quot;
        </p>
      </Callout>

      <h3 className="mt-6 text-xl font-bold text-text-primary">Antiderivatives & the reverse power rule</h3>
      <p>
        An <strong>antiderivative</strong> (or indefinite integral) of <M>{`f`}</M> is a function whose derivative
        is <M>{`f`}</M>. Because the derivative of a constant is zero, antiderivatives always carry a{" "}
        <M>{`+\\,C`}</M>:
      </p>
      <MathBlock>{`\\int x^n\\,dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\ne -1), \\qquad \\int \\frac{1}{x}\\,dx = \\ln|x| + C`}</MathBlock>

      <Callout kind="warning" title="Never forget the + C">
        <p>
          On an <em>indefinite</em> integral, dropping the <M>{`+C`}</M> is an automatic deduction — there are
          infinitely many antiderivatives, differing by a constant. (On a <em>definite</em> integral the constant
          cancels in the subtraction, so you don&apos;t need it there.)
        </p>
      </Callout>

      <div className="my-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ProblemGenerator generatorIds={["int-power"]} title="Practice: Indefinite Integrals" accent="green" />
        <ProblemGenerator generatorIds={["int-definite"]} title="Practice: Definite Integrals" accent="teal" />
      </div>
      <SectionFaq sectionId="integrals" accent="green" />
    </Section>
  );
}
