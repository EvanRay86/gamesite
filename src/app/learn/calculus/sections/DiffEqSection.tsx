"use client";

import { Section, Callout, KeyIdea } from "@/components/calculus/ui";
import SectionFaq from "@/components/calculus/SectionFaq";
import { M, MathBlock } from "@/components/calculus/Math";
import SlopeFieldDemo from "@/components/calculus/demos/SlopeFieldDemo";

export default function DiffEqSection() {
  return (
    <Section
      id="diffeq"
      number="BC"
      accent="purple"
      title="Differential Equations"
      subtitle="Equations whose unknown is a function — the language of science."
    >
      <p>
        A <strong>differential equation</strong> relates a function to its own derivatives. Instead of solving for a
        number, you solve for a whole function. They model essentially every changing system in physics, biology,
        engineering, and finance.
      </p>

      <KeyIdea title="A differential equation describes a slope">
        <M>{`\\frac{dy}{dx} = f(x, y)`}</M> says: &quot;at each point, here is the slope the solution must have.&quot;
        The slope field draws those instructions; a solution is any curve that follows them.
      </KeyIdea>

      <SlopeFieldDemo />

      <h3 className="mt-6 text-xl font-bold text-text-primary">Separable equations</h3>
      <p>The most solvable type — get all the <M>y</M>&apos;s on one side, all the <M>x</M>&apos;s on the other, then integrate both sides.</p>
      <Callout kind="example" title="Solving dy/dx = ky">
        <MathBlock>{`\\frac{dy}{y} = k\\,dx \\;\\Rightarrow\\; \\int\\frac{dy}{y} = \\int k\\,dx \\;\\Rightarrow\\; \\ln|y| = kx + C \\;\\Rightarrow\\; y = y_0 e^{kx}`}</MathBlock>
        <p>This single equation — &quot;rate of change is proportional to amount&quot; — governs exponential growth and decay.</p>
      </Callout>

      <h3 className="mt-6 text-xl font-bold text-text-primary">Models you&apos;ll meet everywhere</h3>
      <div className="my-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Model title="Exponential" eq="y' = ky" note="Compound interest, radioactive decay, unchecked populations." />
        <Model title="Logistic" eq="y' = ky(1 − y/M)" note="Population with a carrying capacity M; the S-curve." />
        <Model title="Newton cooling" eq="T' = −k(T − Tₐ)" note="An object relaxing to ambient temperature Tₐ." />
      </div>

      <Callout kind="realworld" title="Why this is the capstone">
        <p>
          Differential equations are where derivatives and integrals join forces to predict the future: the
          trajectory of a rocket, the spread of a disease (the SIR model), the charge in a circuit, the price of an
          option (Black–Scholes). If calculus has a &quot;final boss,&quot; this is it.
        </p>
      </Callout>
      <SectionFaq sectionId="diffeq" accent="purple" />
    </Section>
  );
}

function Model({ title, eq, note }: { title: string; eq: string; note: string }) {
  return (
    <div className="rounded-xl border-t-4 border-purple bg-white/70 p-3 shadow-sm">
      <div className="text-sm font-bold text-purple">{title}</div>
      <div className="my-1 font-mono text-sm text-text-primary">{eq}</div>
      <p className="text-xs text-text-muted">{note}</p>
    </div>
  );
}
