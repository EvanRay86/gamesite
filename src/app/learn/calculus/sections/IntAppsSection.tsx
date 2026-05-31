"use client";

import { Section, Callout, KeyIdea } from "@/components/calculus/ui";
import SectionFaq from "@/components/calculus/SectionFaq";
import { M, MathBlock } from "@/components/calculus/Math";
import FunctionPlot, { PLOT_COLORS } from "@/components/calculus/FunctionPlot";
import AreaBetweenCurvesDemo from "@/components/calculus/demos/AreaBetweenCurvesDemo";
import ProblemGenerator from "@/components/calculus/ProblemGenerator";

const profile = (x: number) => Math.sqrt(Math.max(0, x));

export default function IntAppsSection() {
  return (
    <Section
      id="int-apps"
      number="7"
      accent="sky"
      title="Applications of Integration"
      subtitle="Areas, volumes, averages, and totals — integrals everywhere."
    >
      <p>
        If a derivative is a rate, an integral is a total. Anything built by accumulating a rate over an interval is
        an integral in disguise.
      </p>

      <h3 className="mt-4 text-xl font-bold text-text-primary">Area between curves</h3>
      <p>
        Integrate the gap <M>{`(\\text{top} - \\text{bottom})`}</M> across the interval where one curve sits above
        the other.
      </p>
      <AreaBetweenCurvesDemo />

      <h3 className="mt-6 text-xl font-bold text-text-primary">Volumes of revolution</h3>
      <p>
        Spin a region around an axis and you get a solid. Slice it into thin disks of radius <M>{`f(x)`}</M> and
        thickness <M>{`dx`}</M>; each disk has volume <M>{`\\pi f(x)^2\\,dx`}</M>. Add them up:
      </p>
      <MathBlock>{`V = \\pi \\int_a^b \\big(f(x)\\big)^2\\,dx \\quad\\text{(disk method)}`}</MathBlock>
      <div className="my-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FunctionPlot
          xDomain={[-0.3, 4.3]}
          yDomain={[-2.2, 2.2]}
          ariaLabel="Region revolved around the x-axis"
          curves={[
            { fn: profile, color: PLOT_COLORS.sky, width: 2.5 },
            { fn: (x) => -profile(x), color: PLOT_COLORS.sky, width: 1.5, dashed: true },
          ]}
          areas={[
            { fn: profile, fn2: (x) => -profile(x), from: 0, to: 4, color: PLOT_COLORS.sky, opacity: 0.18 },
          ]}
          hlines={[{ value: 0, color: PLOT_COLORS.ink, dashed: true }]}
        />
        <div className="text-[15px] text-text-secondary">
          <p className="mb-2">
            Revolving <M>{`y=\\sqrt{x}`}</M> on <M>{`[0,4]`}</M> around the x-axis sweeps out a paraboloid. The
            dashed mirror curve shows the bottom of the solid.
          </p>
          <MathBlock>{`V = \\pi\\int_0^4 (\\sqrt{x})^2\\,dx = \\pi\\int_0^4 x\\,dx = 8\\pi`}</MathBlock>
          <p className="text-sm text-text-muted">The <strong>shell method</strong> (cylindrical shells <M>{`2\\pi x\\,f(x)\\,dx`}</M>) is the alternative when revolving around a vertical axis.</p>
        </div>
      </div>

      <KeyIdea title="The pattern behind every application">
        Slice the thing into infinitely many tiny pieces, write the size of one generic piece, and integrate. Area:
        pieces are strips <M>{`f(x)\\,dx`}</M>. Volume: pieces are disks <M>{`\\pi f(x)^2\\,dx`}</M>. Distance:
        pieces are <M>{`v(t)\\,dt`}</M>. Same move every time.
      </KeyIdea>

      <h3 className="mt-6 text-xl font-bold text-text-primary">Average value of a function</h3>
      <MathBlock>{`\\bar f = \\frac{1}{b-a}\\int_a^b f(x)\\,dx`}</MathBlock>
      <p>It&apos;s the height of the rectangle with the same area as the region under the curve — the continuous version of an average.</p>

      <ProblemGenerator generatorIds={["int-average", "int-definite-quad"]} title="Practice: Average Value & Definite Integrals" accent="sky" />

      <Callout kind="realworld" title="Distance from velocity, work from force">
        <p className="mb-1">
          Total distance traveled is the integral of speed: <M>{`\\int_a^b v(t)\\,dt`}</M>. Work done by a variable
          force is <M>{`\\int_a^b F(x)\\,dx`}</M>. Charge is the integral of current; volume of water is the integral
          of flow rate. The same operation, dressed in different physics.
        </p>
      </Callout>

      <Callout kind="note" title="Arc length & surface area">
        <p>
          Even the length of a curve is an integral: <M>{`L = \\int_a^b \\sqrt{1 + (f'(x))^2}\\,dx`}</M>. Notice it
          uses the derivative <em>inside</em> an integral — the two halves of calculus working together.
        </p>
      </Callout>
      <SectionFaq sectionId="int-apps" accent="sky" />
    </Section>
  );
}
