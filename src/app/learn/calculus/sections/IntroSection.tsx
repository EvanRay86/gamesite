"use client";

import { Section, Callout, KeyIdea } from "@/components/calculus/ui";
import SectionFaq from "@/components/calculus/SectionFaq";
import { M, MathBlock } from "@/components/calculus/Math";

export default function IntroSection() {
  return (
    <Section
      id="intro"
      number="★"
      accent="purple"
      title="What Is Calculus, Really?"
      subtitle="The mathematics of change and accumulation."
    >
      <p>
        Algebra and geometry describe a world that holds still — a line has one slope, a rectangle has one
        area. But the real world <em>moves</em>: cars accelerate, populations grow, temperatures swing,
        prices fluctuate. <strong>Calculus is the math of things that change.</strong> It gives you two
        superpowers, and one beautiful theorem that says they&apos;re secretly the same power.
      </p>

      <div className="my-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border-l-4 border-coral bg-coral/5 p-4">
          <div className="mb-1 text-sm font-bold text-coral">① The Derivative</div>
          <p className="text-[15px] text-text-secondary">
            How fast is something changing <em>right now</em>? The derivative measures an instantaneous rate of
            change — the slope of a curve at a single point. Speed from position, growth rate from population,
            marginal cost from total cost.
          </p>
        </div>
        <div className="rounded-xl border-l-4 border-green bg-green/5 p-4">
          <div className="mb-1 text-sm font-bold text-green">② The Integral</div>
          <p className="text-[15px] text-text-secondary">
            How much has accumulated <em>in total</em>? The integral adds up infinitely many tiny pieces — the
            area under a curve. Distance from speed, total revenue from sales rate, volume from cross-sections.
          </p>
        </div>
      </div>

      <KeyIdea title="The whole subject in one sentence">
        A derivative <strong>zooms in</strong> to find an instantaneous rate; an integral <strong>adds up</strong>{" "}
        infinitely many slivers to find a total. The{" "}
        <span className="font-semibold text-purple">Fundamental Theorem of Calculus</span> proves these are inverse
        operations — differentiation and integration undo each other.
      </KeyIdea>

      <MathBlock>
        {`\\underbrace{\\frac{d}{dx}\\!\\left[\\int_a^x f(t)\\,dt\\right] = f(x)}_{\\text{integration then differentiation}} \\qquad \\underbrace{\\int_a^b f'(x)\\,dx = f(b)-f(a)}_{\\text{the net change}}`}
      </MathBlock>

      <Callout kind="intuition" title="Why the infinity trick works">
        <p>
          The clever move behind both ideas is the <strong>limit</strong>: instead of computing a slope over a
          gap or an area with chunky rectangles, we ask what happens as the gap shrinks to zero and the
          rectangles become infinitely thin. The limit turns an approximation into an exact answer. That&apos;s
          why we start with limits in <a href="#limits" className="font-semibold text-sky no-underline">Chapter 1</a>.
        </p>
      </Callout>

      <Callout kind="tip" title="How to use this page">
        <p>
          Work top to bottom, or jump around with the contents menu. Every blue-ish box is interactive —{" "}
          <strong>drag the sliders and points</strong>. Every <M>{`f(x)`}</M> you see is real, computed live.
          Hit <strong>“New problem”</strong> in any practice box for unlimited randomized exercises with full
          solutions. Mark sections done to track your progress.
        </p>
      </Callout>
      <SectionFaq sectionId="intro" accent="purple" />
    </Section>
  );
}
