"use client";

import { Section, Callout, KeyIdea, Collapsible } from "@/components/calculus/ui";
import SectionFaq from "@/components/calculus/SectionFaq";
import { M, MathBlock } from "@/components/calculus/Math";
import FunctionPlot, { PLOT_COLORS } from "@/components/calculus/FunctionPlot";
import OptimizationDemo from "@/components/calculus/demos/OptimizationDemo";
import ProblemGenerator from "@/components/calculus/ProblemGenerator";

const shape = (x: number) => (x * x * x) / 3 - x; // critical pts at ±1, inflection at 0

export default function DerivAppsSection() {
  return (
    <Section
      id="deriv-apps"
      number="4"
      accent="purple"
      title="Applications of Derivatives"
      subtitle="Where derivatives earn their keep: shape, motion, and optimization."
    >
      <p>
        Once you can find <M>{`f'`}</M> and <M>{`f''`}</M>, you can describe the entire shape of a graph, locate
        maxima and minima, relate changing quantities, and approximate hard values. This is the most useful chapter
        in all of differential calculus.
      </p>

      <h3 className="mt-4 text-xl font-bold text-text-primary">Reading a graph from its derivatives</h3>
      <div className="my-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FunctionPlot
          xDomain={[-2.4, 2.4]}
          yDomain={[-2, 2]}
          ariaLabel="Curve with critical points and inflection"
          curves={[{ fn: shape, color: PLOT_COLORS.ink, width: 2.5 }]}
          points={[
            { x: -1, y: shape(-1), color: PLOT_COLORS.coral, label: "max" },
            { x: 1, y: shape(1), color: PLOT_COLORS.green, label: "min" },
            { x: 0, y: shape(0), color: PLOT_COLORS.purple, label: "inflection", hollow: true },
          ]}
        />
        <div className="text-[15px] text-text-secondary">
          <p className="mb-2">
            <strong className="text-coral">f ′ &gt; 0</strong> → curve rising;{" "}
            <strong className="text-sky">f ′ &lt; 0</strong> → curve falling. Where <M>{`f'=0`}</M> the curve
            levels off — a candidate max or min (a <em>critical point</em>).
          </p>
          <p>
            <strong className="text-purple">f ″ &gt; 0</strong> → concave up (cup ∪);{" "}
            <strong>f ″ &lt; 0</strong> → concave down (cap ∩). Where concavity flips is an{" "}
            <em>inflection point</em>.
          </p>
        </div>
      </div>

      <KeyIdea title="The derivative tests">
        <ul className="ml-4 list-disc space-y-1">
          <li><strong>First derivative test:</strong> at a critical point, if <M>{`f'`}</M> changes + → −, it&apos;s a local max; − → + is a local min.</li>
          <li><strong>Second derivative test:</strong> at a critical point, <M>{`f''>0`}</M> ⇒ local min, <M>{`f''<0`}</M> ⇒ local max.</li>
        </ul>
      </KeyIdea>

      <h3 className="mt-6 text-xl font-bold text-text-primary">Optimization</h3>
      <p>
        Optimization is the real-world payoff: maximize volume, minimize cost, find the best angle. The recipe is
        always the same — write the quantity as a function of one variable, differentiate, set <M>{`f'=0`}</M>, and
        check it&apos;s really a max or min.
      </p>

      <OptimizationDemo />

      <h3 className="mt-6 text-xl font-bold text-text-primary">Related rates</h3>
      <p>
        When two quantities are linked, their rates of change are linked too. Differentiate the relationship with
        respect to time and solve for the rate you want.
      </p>
      <Callout kind="example" title="A spreading oil slick">
        <p className="mb-1">A circular slick&apos;s radius grows at <M>{`\\frac{dr}{dt} = 2`}</M> m/s. How fast is the area growing when <M>{`r = 10`}</M>?</p>
        <MathBlock>{`A = \\pi r^2 \\;\\Rightarrow\\; \\frac{dA}{dt} = 2\\pi r \\frac{dr}{dt} = 2\\pi(10)(2) = 40\\pi \\approx 125.7 \\text{ m}^2/\\text{s}`}</MathBlock>
        <p>The chain rule is doing the heavy lifting: <M>{`A`}</M> depends on <M>{`r`}</M>, which depends on <M>{`t`}</M>.</p>
      </Callout>

      <Collapsible summary="L'Hôpital's rule — taming 0/0 and ∞/∞" accent="purple">
        <p className="mb-2">If a limit gives an indeterminate <M>{`\\tfrac{0}{0}`}</M> or <M>{`\\tfrac{\\infty}{\\infty}`}</M>, differentiate top and bottom separately:</p>
        <MathBlock>{`\\lim_{x\\to a}\\frac{f(x)}{g(x)} = \\lim_{x\\to a}\\frac{f'(x)}{g'(x)}`}</MathBlock>
        <p>Example: <M>{`\\lim_{x\\to 0}\\frac{\\sin x}{x} = \\lim_{x\\to 0}\\frac{\\cos x}{1} = 1`}</M>.</p>
      </Collapsible>

      <Collapsible summary="Linear approximation & differentials" accent="purple">
        <p className="mb-2">Near a point, a curve looks like its tangent line. That gives a quick estimate:</p>
        <MathBlock>{`f(x) \\approx f(a) + f'(a)(x-a)`}</MathBlock>
        <p>Example: estimate <M>{`\\sqrt{4.1}`}</M> using <M>{`a=4`}</M>: <M>{`\\sqrt{4} + \\tfrac{1}{2\\sqrt4}(0.1) = 2 + 0.025 = 2.025`}</M> (true value 2.0248…).</p>
      </Collapsible>

      <Collapsible summary="The Mean Value Theorem" accent="purple">
        <p>
          If <M>{`f`}</M> is continuous on <M>{`[a,b]`}</M> and differentiable inside, then somewhere the
          instantaneous slope equals the average slope: <M>{`f'(c) = \\frac{f(b)-f(a)}{b-a}`}</M>. Translation: if
          you average 60 mph over a trip, at some instant your speedometer read exactly 60.
        </p>
      </Collapsible>

      <div className="my-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ProblemGenerator generatorIds={["deriv-tangent"]} title="Practice: Tangent Lines" accent="purple" />
        <ProblemGenerator generatorIds={["app-critical"]} title="Practice: Critical Points" accent="coral" />
        <ProblemGenerator generatorIds={["app-related-rates"]} title="Practice: Related Rates" accent="sky" />
        <ProblemGenerator generatorIds={["deriv-second"]} title="Practice: Second Derivatives" accent="amber" />
      </div>

      <Callout kind="realworld" title="Marginal everything (economics)">
        <p>
          In economics, the derivative of a total is called the <em>marginal</em> quantity: marginal cost is{" "}
          <M>{`C'(x)`}</M>, marginal revenue is <M>{`R'(x)`}</M>. Profit is maximized where marginal revenue equals
          marginal cost — a derivative set to zero.
        </p>
      </Callout>
      <SectionFaq sectionId="deriv-apps" accent="purple" />
    </Section>
  );
}
