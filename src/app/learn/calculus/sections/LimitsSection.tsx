"use client";

import { Section, Callout, KeyIdea } from "@/components/calculus/ui";
import SectionFaq from "@/components/calculus/SectionFaq";
import { M, MathBlock } from "@/components/calculus/Math";
import LimitExplorer from "@/components/calculus/demos/LimitExplorer";
import FunctionPlot, { PLOT_COLORS } from "@/components/calculus/FunctionPlot";
import ProblemGenerator from "@/components/calculus/ProblemGenerator";

export default function LimitsSection() {
  return (
    <Section
      id="limits"
      number="1"
      accent="sky"
      title="Limits & Continuity"
      subtitle="The idea that makes everything else in calculus possible."
    >
      <p>
        A <strong>limit</strong> answers the question: “as the input gets arbitrarily close to some value, what
        does the output head toward?” Crucially, we don&apos;t care what happens <em>at</em> the point — only what
        happens <em>near</em> it. That distinction is the whole game.
      </p>

      <MathBlock>{`\\lim_{x \\to a} f(x) = L`}</MathBlock>
      <p className="text-text-muted">
        Read aloud: “the limit of <M>{`f(x)`}</M> as <M>x</M> approaches <M>a</M> equals <M>L</M>.”
      </p>

      <LimitExplorer />

      <KeyIdea title="Why limits exist at all">
        The function above, <M>{`\\frac{x^2-1}{x-1}`}</M>, is genuinely undefined at <M>{`x=1`}</M> (you&apos;d divide
        by zero). Yet everything <em>around</em> <M>{`x=1`}</M> points cleanly at the height 2. The limit captures
        that &quot;intended&quot; value — which is exactly what we need to define a slope at a single point.
      </KeyIdea>

      <h3 className="mt-6 text-xl font-bold text-text-primary">One-sided limits</h3>
      <p>
        Sometimes the left and right approaches disagree. We write <M>{`\\lim_{x\\to a^-}`}</M> for the approach
        from the left and <M>{`\\lim_{x\\to a^+}`}</M> from the right. The two-sided limit exists only when both
        sides agree:
      </p>
      <MathBlock>{`\\lim_{x\\to a} f(x) = L \\iff \\lim_{x\\to a^-} f(x) = \\lim_{x\\to a^+} f(x) = L`}</MathBlock>

      <h3 className="mt-6 text-xl font-bold text-text-primary">The three ways continuity breaks</h3>
      <p>
        A function is <strong>continuous</strong> at <M>a</M> if you can draw through it without lifting your pen —
        formally, <M>{`\\lim_{x\\to a} f(x) = f(a)`}</M>. Here are the classic ways that fails:
      </p>

      <div className="my-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <DiscontinuityCard
          title="Removable (hole)"
          color={PLOT_COLORS.sky}
          fn={(x) => (Math.abs(x - 1) < 1e-9 ? NaN : (x * x - 1) / (x - 1))}
          hole={{ x: 1, y: 2 }}
          note="Limit exists, but f(a) is missing or misplaced."
        />
        <DiscontinuityCard
          title="Jump"
          color={PLOT_COLORS.coral}
          fn={(x) => (x < 1 ? x : x + 1.5)}
          note="Left and right limits disagree."
        />
        <DiscontinuityCard
          title="Infinite"
          color={PLOT_COLORS.purple}
          fn={(x) => 1 / (x - 1)}
          note="Function blows up to ±∞ (a vertical asymptote)."
        />
      </div>

      <Callout kind="example" title="Evaluating a 0/0 limit by factoring">
        <p className="mb-2">Direct substitution into <M>{`\\lim_{x\\to 3}\\frac{x^2-9}{x-3}`}</M> gives <M>{`\\tfrac{0}{0}`}</M> — indeterminate. Factor and cancel:</p>
        <MathBlock>{`\\frac{x^2-9}{x-3} = \\frac{(x-3)(x+3)}{x-3} = x+3 \\;\\Rightarrow\\; \\lim_{x\\to 3}(x+3) = 6`}</MathBlock>
      </Callout>

      <Callout kind="warning" title="0/0 is NOT zero (or one)">
        <p>
          <M>{`\\tfrac{0}{0}`}</M> is an <strong>indeterminate form</strong> — it&apos;s a signal that you have more
          work to do (factor, rationalize, or use L&apos;Hôpital&apos;s rule later), not an answer. Same goes for{" "}
          <M>{`\\tfrac{\\infty}{\\infty}`}</M> and <M>{`\\infty - \\infty`}</M>.
        </p>
      </Callout>

      <h3 className="mt-6 text-xl font-bold text-text-primary">Limits at infinity</h3>
      <p>
        For end behavior of rational functions, compare the degrees of the top and bottom. A quick rule:
      </p>
      <ul className="my-2 ml-5 list-disc space-y-1 text-text-secondary">
        <li>Top degree &lt; bottom degree → limit is <strong>0</strong>.</li>
        <li>Top degree = bottom degree → limit is the <strong>ratio of leading coefficients</strong>.</li>
        <li>Top degree &gt; bottom degree → limit is <strong>±∞</strong> (no horizontal asymptote).</li>
      </ul>

      <ProblemGenerator topic="limits" title="Practice: Limits" accent="sky" />

      <Callout kind="note" title="Where this is heading">
        <p>
          Hold onto the idea of &quot;a gap shrinking to zero.&quot; In the next chapter we apply a limit to the
          slope formula <M>{`\\frac{\\Delta y}{\\Delta x}`}</M> and out pops the derivative.
        </p>
      </Callout>
      <SectionFaq sectionId="limits" accent="sky" />
    </Section>
  );
}

function DiscontinuityCard({
  title,
  fn,
  color,
  note,
  hole,
}: {
  title: string;
  fn: (x: number) => number;
  color: string;
  note: string;
  hole?: { x: number; y: number };
}) {
  return (
    <div className="rounded-xl border border-border-light bg-white/60 p-3">
      <div className="mb-1 text-sm font-bold" style={{ color }}>
        {title}
      </div>
      <FunctionPlot
        xDomain={[-1.5, 3.5]}
        yDomain={[-4, 5]}
        height={150}
        width={280}
        curves={[{ fn, color, width: 2 }]}
        points={hole ? [{ x: hole.x, y: hole.y, color, hollow: true, radius: 4 }] : []}
        ariaLabel={title}
      />
      <p className="mt-1 text-xs text-text-muted">{note}</p>
    </div>
  );
}
