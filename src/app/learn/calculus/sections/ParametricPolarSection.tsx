"use client";

import { Section, Callout, KeyIdea } from "@/components/calculus/ui";
import SectionFaq from "@/components/calculus/SectionFaq";
import { M, MathBlock } from "@/components/calculus/Math";
import ParametricCurveDemo from "@/components/calculus/demos/ParametricCurveDemo";

export default function ParametricPolarSection() {
  return (
    <Section
      id="parametric-polar"
      number="BC"
      accent="amber"
      title="Parametric & Polar"
      subtitle="Curves that loop, cross, and spiral — beyond y = f(x)."
    >
      <p>
        Not every curve passes the vertical-line test. A circle, a figure-eight, the path of a planet — none can be
        written as a single <M>{`y=f(x)`}</M>. Two new coordinate systems set them free.
      </p>

      <h3 className="mt-4 text-xl font-bold text-text-primary">Parametric equations</h3>
      <p>
        Let a parameter <M>t</M> (often time) drive both coordinates independently: <M>{`x = x(t)`}</M>,{" "}
        <M>{`y = y(t)`}</M>. As <M>t</M> advances, the point <M>{`(x(t), y(t))`}</M> draws the curve.
      </p>

      <ParametricCurveDemo />

      <KeyIdea title="Slope of a parametric curve">
        The chain rule gives the slope directly from the two rates:
        <MathBlock>{`\\frac{dy}{dx} = \\frac{dy/dt}{dx/dt}`}</MathBlock>
        And arc length adds up tiny hypotenuses: <M>{`L = \\int_a^b \\sqrt{(dx/dt)^2 + (dy/dt)^2}\\,dt`}</M>.
      </KeyIdea>

      <h3 className="mt-6 text-xl font-bold text-text-primary">Polar coordinates</h3>
      <p>
        Instead of left/right and up/down, locate a point by its distance <M>r</M> from the origin and angle{" "}
        <M>θ</M>. The dictionary between the two systems:
      </p>
      <MathBlock>{`x = r\\cos\\theta, \\quad y = r\\sin\\theta, \\qquad r^2 = x^2 + y^2, \\quad \\tan\\theta = \\tfrac{y}{x}`}</MathBlock>
      <p>
        Equations like <M>{`r = \\cos(4\\theta)`}</M> (a rose) or <M>{`r = 1 + \\cos\\theta`}</M> (a cardioid) are
        trivial in polar but monstrous in <M>{`x`}</M>–<M>{`y`}</M>. Try them in the picker above.
      </p>

      <Callout kind="note" title="Area in polar coordinates">
        <p>
          Polar area is swept out in pie-slice wedges, not rectangles, so the formula uses{" "}
          <M>{`r^2`}</M>: <M>{`A = \\frac{1}{2}\\int_{\\alpha}^{\\beta} r(\\theta)^2\\,d\\theta`}</M>.
        </p>
      </Callout>

      <Callout kind="realworld" title="Where these show up">
        <p>
          Parametric equations describe projectile motion and animation paths; polar coordinates describe radar,
          spirals in nature, antenna radiation patterns, and anything with rotational symmetry.
        </p>
      </Callout>
      <SectionFaq sectionId="parametric-polar" accent="amber" />
    </Section>
  );
}
