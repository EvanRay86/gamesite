"use client";

import { Section, Callout, KeyIdea } from "@/components/calculus/ui";
import SectionFaq from "@/components/calculus/SectionFaq";
import { M, MathBlock } from "@/components/calculus/Math";
import TaylorSeriesDemo from "@/components/calculus/demos/TaylorSeriesDemo";
import ProblemGenerator from "@/components/calculus/ProblemGenerator";

const TESTS: { name: string; use: string }[] = [
  { name: "nth-term test", use: "If terms don't → 0, the series diverges. (Quick disqualifier.)" },
  { name: "Geometric", use: "Σ ar ⁿ converges iff |r| < 1, to a/(1−r)." },
  { name: "p-series", use: "Σ 1/nᵖ converges iff p > 1. (So Σ1/n diverges, Σ1/n² converges.)" },
  { name: "Ratio test", use: "If lim |aₙ₊₁/aₙ| < 1, converges. Great for factorials & powers." },
  { name: "Comparison / Integral", use: "Compare to a known series, or to an improper integral." },
];

export default function SeriesSection() {
  return (
    <Section
      id="series"
      number="BC"
      accent="coral"
      title="Sequences & Series"
      subtitle="Adding up infinitely many numbers — and when that even makes sense."
    >
      <p>
        A <strong>sequence</strong> is an ordered list of numbers; a <strong>series</strong> is their sum. Adding
        infinitely many things sounds impossible, yet <M>{`\\tfrac12+\\tfrac14+\\tfrac18+\\cdots = 1`}</M>. The
        central question of this chapter: does an infinite sum settle on a finite value (<em>converge</em>) or blow
        up (<em>diverge</em>)?
      </p>

      <KeyIdea title="Convergence in one picture">
        The series <M>{`\\sum a_n`}</M> converges if its <em>partial sums</em> <M>{`S_N = a_1 + \\cdots + a_N`}</M>{" "}
        approach a limit as <M>{`N\\to\\infty`}</M>. If the pieces you&apos;re adding don&apos;t shrink to zero fast
        enough, the total never settles.
      </KeyIdea>

      <h3 className="mt-4 text-xl font-bold text-text-primary">The geometric series</h3>
      <p>The one you&apos;ll use most. When the ratio between terms is constant and less than 1 in size:</p>
      <MathBlock>{`\\sum_{n=0}^{\\infty} ar^n = \\frac{a}{1-r} \\quad (|r| < 1)`}</MathBlock>
      <div className="my-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ProblemGenerator generatorIds={["series-geometric"]} title="Practice: Geometric Series" accent="coral" />
        <ProblemGenerator generatorIds={["series-converge"]} title="Practice: Converge or Diverge?" accent="amber" />
      </div>

      <h3 className="mt-6 text-xl font-bold text-text-primary">Convergence tests at a glance</h3>
      <div className="my-3 overflow-hidden rounded-xl border border-border-light">
        <table className="w-full text-left text-[15px]">
          <thead className="bg-coral/10">
            <tr className="text-sm text-coral">
              <th className="px-4 py-2 font-bold">Test</th>
              <th className="px-4 py-2 font-bold">When to use</th>
            </tr>
          </thead>
          <tbody>
            {TESTS.map((t, i) => (
              <tr key={i} className={i % 2 ? "bg-white/40" : "bg-white/70"}>
                <td className="px-4 py-2 font-semibold text-text-primary">{t.name}</td>
                <td className="px-4 py-2 text-text-secondary">{t.use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mt-6 text-xl font-bold text-text-primary">Power series & Taylor series</h3>
      <p>
        The grand finale: represent a function as an <em>infinite polynomial</em>. The Taylor series of <M>f</M>{" "}
        centered at 0 (its Maclaurin series) is
      </p>
      <MathBlock>{`f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(0)}{n!}\\,x^n = f(0) + f'(0)x + \\frac{f''(0)}{2!}x^2 + \\cdots`}</MathBlock>

      <TaylorSeriesDemo />

      <Callout kind="realworld" title="Why your calculator loves Taylor series">
        <p>
          A chip can only add and multiply — it can&apos;t &quot;take a sine.&quot; So it evaluates a few terms of a
          Taylor (or related) series. Series turn transcendental functions into arithmetic, which is why they
          underpin everything from graphing calculators to physics engines.
        </p>
      </Callout>
      <SectionFaq sectionId="series" accent="coral" />
    </Section>
  );
}
