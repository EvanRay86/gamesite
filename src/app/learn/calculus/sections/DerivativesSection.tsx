"use client";

import { Section, Callout, KeyIdea } from "@/components/calculus/ui";
import SectionFaq from "@/components/calculus/SectionFaq";
import { M, MathBlock } from "@/components/calculus/Math";
import SecantTangentDemo from "@/components/calculus/demos/SecantTangentDemo";
import DerivativeExplorer from "@/components/calculus/demos/DerivativeExplorer";
import ProblemGenerator from "@/components/calculus/ProblemGenerator";

export default function DerivativesSection() {
  return (
    <Section
      id="derivatives"
      number="2"
      accent="coral"
      title="The Derivative"
      subtitle="Instantaneous rate of change — the slope of a curve at a single point."
    >
      <p>
        Take the slope formula <M>{`\\frac{\\Delta y}{\\Delta x}`}</M> and shrink the run to zero. The slope between
        two points (a <em>secant</em>) becomes the slope at one point (a <em>tangent</em>). That limit is the
        <strong> derivative</strong>:
      </p>

      <MathBlock>{`f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}`}</MathBlock>

      <p>Drag the gap <M>h</M> toward zero below and watch the red secant snap onto the teal tangent:</p>

      <SecantTangentDemo />

      <KeyIdea title="Three ways to read a derivative">
        <ul className="ml-4 list-disc space-y-1">
          <li><strong>Geometrically:</strong> the slope of the tangent line at a point.</li>
          <li><strong>Physically:</strong> an instantaneous rate of change (velocity is the derivative of position).</li>
          <li><strong>Algebraically:</strong> the limit of the difference quotient shown above.</li>
        </ul>
      </KeyIdea>

      <Callout kind="example" title="Computing a derivative from the definition">
        <p className="mb-2">
          Let&apos;s find <M>{`f'(x)`}</M> for <M>{`f(x) = x^2`}</M> using only the limit — no shortcuts. It&apos;s
          worth doing by hand once, because it shows <em>why</em> the power rule works.
        </p>
        <MathBlock>{`f'(x) = \\lim_{h\\to 0}\\frac{(x+h)^2 - x^2}{h}`}</MathBlock>
        <p className="mb-2">Expand <M>{`(x+h)^2 = x^2 + 2xh + h^2`}</M>, and the <M>{`x^2`}</M> terms cancel:</p>
        <MathBlock>{`= \\lim_{h\\to 0}\\frac{x^2 + 2xh + h^2 - x^2}{h} = \\lim_{h\\to 0}\\frac{2xh + h^2}{h}`}</MathBlock>
        <p className="mb-2">Factor out <M>h</M> and cancel it (legal, since <M>{`h\\to 0`}</M> means <M>{`h \\ne 0`}</M>):</p>
        <MathBlock>{`= \\lim_{h\\to 0}(2x + h) = 2x`}</MathBlock>
        <p>The power rule gives the same answer instantly: <M>{`\\frac{d}{dx}x^2 = 2x`}</M>. Every shortcut rule is really just this limit, pre-computed.</p>
      </Callout>

      <h3 className="mt-6 text-xl font-bold text-text-primary">Notation (they all mean the same thing)</h3>
      <MathBlock>{`f'(x) \\;=\\; \\frac{dy}{dx} \\;=\\; \\frac{d}{dx}\\,f(x) \\;=\\; \\dot{y} \\;=\\; D_x f`}</MathBlock>
      <p className="text-text-muted">
        Leibniz&apos;s <M>{`\\frac{dy}{dx}`}</M> is handy because it names the variables; Lagrange&apos;s{" "}
        <M>{`f'(x)`}</M> is compact. Use whichever the problem makes natural.
      </p>

      <h3 className="mt-6 text-xl font-bold text-text-primary">A function and its derivative, side by side</h3>
      <p>
        The derivative is itself a function — it reports the slope at every <M>x</M>. Drag across the graph: where
        the curve climbs, <M>{`f'`}</M> is positive; at peaks and valleys, <M>{`f'=0`}</M>; where it falls,{" "}
        <M>{`f'`}</M> is negative.
      </p>

      <DerivativeExplorer />

      <Callout kind="realworld" title="Position → velocity → acceleration">
        <p>
          If <M>{`s(t)`}</M> is an object&apos;s position, then <M>{`s'(t)=v(t)`}</M> is its velocity and{" "}
          <M>{`v'(t)=a(t)`}</M> is its acceleration. Your car&apos;s speedometer is literally computing a
          derivative of your odometer reading in real time.
        </p>
      </Callout>

      <h3 className="mt-6 text-xl font-bold text-text-primary">The first rule: the Power Rule</h3>
      <p>You almost never compute the limit by hand. Instead you learn rules. The workhorse:</p>
      <MathBlock>{`\\frac{d}{dx}\\,x^n = n\\,x^{n-1}`}</MathBlock>
      <p>
        “Bring the exponent down front, then subtract one from it.” Combined with the fact that constants pull out
        and sums differentiate term-by-term, you can already handle any polynomial.
      </p>

      <Callout kind="example" title="Power rule in action">
        <MathBlock>{`\\frac{d}{dx}\\left(3x^4 - 5x^2 + 7\\right) = 12x^3 - 10x + 0 = 12x^3 - 10x`}</MathBlock>
        <p>Each term: <M>{`3x^4 \\to 12x^3`}</M>, <M>{`-5x^2 \\to -10x`}</M>, and the constant <M>7</M> vanishes (a flat line has zero slope).</p>
      </Callout>

      <ProblemGenerator generatorIds={["deriv-power", "deriv-root"]} title="Practice: Power Rule" accent="coral" />

      <Callout kind="note" title="Next up">
        <p>
          Products, quotients, compositions, trig, exponentials, logs — the full toolkit is in{" "}
          <a href="#deriv-rules" className="font-semibold text-amber no-underline">Differentiation Rules</a>.
        </p>
      </Callout>
      <SectionFaq sectionId="derivatives" accent="coral" />
    </Section>
  );
}
