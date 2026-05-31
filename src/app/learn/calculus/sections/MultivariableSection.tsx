"use client";

import { Section, Callout, KeyIdea } from "@/components/calculus/ui";
import SectionFaq from "@/components/calculus/SectionFaq";
import { M, MathBlock } from "@/components/calculus/Math";
import ContourDemo from "@/components/calculus/demos/ContourDemo";
import ProblemGenerator from "@/components/calculus/ProblemGenerator";

export default function MultivariableSection() {
  return (
    <Section
      id="multivariable"
      number="III"
      accent="green"
      title="Multivariable Calculus (a primer)"
      subtitle="Calculus in 3D and beyond: surfaces, partials, gradients, and double integrals."
    >
      <p>
        So far every function took one input. Reality usually has more: temperature depends on latitude{" "}
        <em>and</em> longitude; profit depends on price <em>and</em> volume. A function <M>{`z = f(x, y)`}</M>{" "}
        describes a <strong>surface</strong> floating above the plane. Calculus III extends derivatives and
        integrals to these surfaces.
      </p>

      <h3 className="mt-4 text-xl font-bold text-text-primary">Partial derivatives</h3>
      <p>
        To differentiate a surface, pick a direction. The <strong>partial derivative</strong> <M>{`\\partial f/\\partial x`}</M>{" "}
        measures the slope as you walk in the x-direction, holding <M>y</M> fixed — and vice versa.
      </p>

      <ContourDemo />

      <ProblemGenerator generatorIds={["mv-partial"]} title="Practice: Partial Derivatives" accent="green" />

      <h3 className="mt-6 text-xl font-bold text-text-primary">The gradient: steepest ascent</h3>
      <p>Bundle the partials into a vector and you get the <strong>gradient</strong> — it points in the direction of fastest increase:</p>
      <MathBlock>{`\\nabla f = \\left\\langle \\frac{\\partial f}{\\partial x},\\ \\frac{\\partial f}{\\partial y} \\right\\rangle`}</MathBlock>

      <KeyIdea title="Gradient = uphill">
        Stand anywhere on a hillside; the gradient points straight up the steepest slope, and its length tells you
        how steep. Reverse it and you&apos;re heading downhill the fastest — which is precisely how machine-learning
        models train. (See <a href="#realworld" className="font-semibold text-green no-underline">gradient descent</a> below.)
      </KeyIdea>

      <h3 className="mt-6 text-xl font-bold text-text-primary">Double integrals</h3>
      <p>
        Just as a single integral sums strips to get area, a <strong>double integral</strong> sums tiny columns to
        get the volume under a surface:
      </p>
      <MathBlock>{`V = \\iint_R f(x, y)\\,dA = \\int_c^d \\int_a^b f(x, y)\\,dx\\,dy`}</MathBlock>
      <p>You integrate inside-out: do the inner integral (treating the outer variable as constant), then the outer one.</p>

      <Callout kind="realworld" title="Where Calc III lives">
        <p>
          Gradients power gradient descent (all of deep learning). Partial derivatives drive thermodynamics and
          fluid flow. Multiple integrals compute mass, center of mass, and probability over regions. Vector
          calculus (div, curl, and the theorems of Green, Stokes, and Gauss) is the mathematics of electromagnetism.
        </p>
      </Callout>
      <SectionFaq sectionId="multivariable" accent="green" />
    </Section>
  );
}
