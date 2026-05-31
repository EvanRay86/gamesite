"use client";

import { Section, Callout, Collapsible } from "@/components/calculus/ui";
import SectionFaq from "@/components/calculus/SectionFaq";
import { M, MathBlock } from "@/components/calculus/Math";

export default function PrereqsSection() {
  return (
    <Section
      id="prereqs"
      number="0"
      accent="teal"
      title="Quick Refresher: The Algebra You'll Lean On"
      subtitle="You don't need to be a wizard — but these five things show up constantly."
    >
      <p>
        Most “calculus is hard” moments are really “my algebra got rusty” moments. Skim these. If a box looks
        obvious, great — close it and move on. If not, this is the stuff worth shoring up first.
      </p>

      <Collapsible summary="① Functions & function notation" accent="teal" defaultOpen>
        <p>
          A function is a machine: feed it an input, get one output. <M>{`f(x) = x^2 + 1`}</M> means “square the
          input, add 1.” So <M>{`f(3) = 10`}</M>. We&apos;ll constantly plug things in — including expressions
          like <M>{`f(x+h)`}</M>, which just means “replace every x with (x+h).”
        </p>
      </Collapsible>

      <Collapsible summary="② Slope of a line = rise over run" accent="teal">
        <p>
          The slope between two points is <M>{`m = \\dfrac{y_2 - y_1}{x_2 - x_1}`}</M>. This single idea becomes the
          derivative once we let the two points slide together. A derivative is just a slope where the “run”
          shrinks to zero.
        </p>
      </Collapsible>

      <Collapsible summary="③ Exponent & radical rules" accent="teal">
        <MathBlock>{`x^a x^b = x^{a+b}, \\quad \\frac{x^a}{x^b} = x^{a-b}, \\quad (x^a)^b = x^{ab}`}</MathBlock>
        <MathBlock>{`\\sqrt{x} = x^{1/2}, \\quad \\frac{1}{x^n} = x^{-n}`}</MathBlock>
        <p>
          That last conversion is the secret to the power rule: rewrite roots and fractions as exponents, then
          differentiate everything the same way.
        </p>
      </Collapsible>

      <Collapsible summary="④ Factoring (especially the difference of squares)" accent="teal">
        <MathBlock>{`a^2 - b^2 = (a-b)(a+b), \\quad x^2 + (p+q)x + pq = (x+p)(x+q)`}</MathBlock>
        <p>
          Factoring is how we resolve the dreaded <M>{`\\tfrac{0}{0}`}</M> limit: factor, cancel, then substitute.
        </p>
      </Collapsible>

      <Collapsible summary="⑤ The trig & log facts that matter" accent="teal">
        <MathBlock>{`\\sin^2\\theta + \\cos^2\\theta = 1, \\quad \\ln(ab) = \\ln a + \\ln b, \\quad e^{\\ln x} = x`}</MathBlock>
        <p>
          You don&apos;t need every identity memorized. You do need to recognize <M>{`\\sin, \\cos, e^x`}</M>, and{" "}
          <M>{`\\ln x`}</M> on sight, because their derivatives are special and worth knowing cold.
        </p>
      </Collapsible>

      <Callout kind="tip" title="Don't over-prepare">
        <p>
          You can start calculus today. Refer back here whenever an algebra step trips you up — that&apos;s more
          efficient than trying to “finish” reviewing first.
        </p>
      </Callout>
      <SectionFaq sectionId="prereqs" accent="teal" />
    </Section>
  );
}
