"use client";

import { Section, Callout } from "@/components/calculus/ui";
import { M } from "@/components/calculus/Math";
import GradientDescentDemo from "@/components/calculus/demos/GradientDescentDemo";

const USES: { icon: string; field: string; color: string; what: string; math: string }[] = [
  { icon: "🚀", field: "Physics & Engineering", color: "coral", what: "Position, velocity, and acceleration are a derivative chain. Integrate force to get work, acceleration to get velocity.", math: "v = \\frac{ds}{dt},\\ \\ W = \\int F\\,dx" },
  { icon: "💰", field: "Economics", color: "green", what: "Marginal cost and revenue are derivatives of totals; consumer & producer surplus are areas (integrals).", math: "\\text{maximize where } MR = MC" },
  { icon: "💊", field: "Medicine & Pharmacology", color: "sky", what: "Drug concentration decays exponentially; dosing schedules solve a differential equation to stay in the safe band.", math: "C(t) = C_0 e^{-kt}" },
  { icon: "🦠", field: "Biology", color: "teal", what: "Populations follow logistic growth toward a carrying capacity — a classic differential equation.", math: "\\frac{dP}{dt} = kP\\left(1-\\tfrac{P}{M}\\right)" },
  { icon: "📡", field: "Signal Processing", color: "purple", what: "Fourier analysis (built on integrals) decomposes sound and images into frequencies — the basis of MP3 and JPEG.", math: "\\hat f(\\xi) = \\int f(x)e^{-2\\pi i x\\xi}dx" },
  { icon: "📈", field: "Statistics & ML", color: "amber", what: "Probabilities are areas under density curves; models train by following gradients downhill (below).", math: "P(a\\le X\\le b) = \\int_a^b f(x)\\,dx" },
];

export default function RealWorldSection() {
  return (
    <Section
      id="realworld"
      number="🌍"
      accent="teal"
      title="Calculus in the Real World"
      subtitle="Not just exam fuel — the operating system of modern science and tech."
    >
      <p>
        Whenever something changes or accumulates, calculus is nearby. A tour of where it&apos;s quietly running the
        show:
      </p>

      <div className="my-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {USES.map((u) => (
          <div key={u.field} className={`clay-card p-4 border-t-4 border-${u.color}`}>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xl">{u.icon}</span>
              <h4 className={`font-bold text-${u.color}`}>{u.field}</h4>
            </div>
            <p className="mb-2 text-sm text-text-secondary">{u.what}</p>
            <div className="rounded bg-surface px-2 py-1 text-center">
              <M>{u.math}</M>
            </div>
          </div>
        ))}
      </div>

      <h3 className="mt-6 text-xl font-bold text-text-primary">Spotlight: how machine learning actually learns</h3>
      <p>
        Every neural network — every chatbot, image generator, and recommendation engine — is trained by{" "}
        <strong>gradient descent</strong>. The model&apos;s error is a function of millions of parameters; training
        means rolling downhill on that error surface by repeatedly stepping against the gradient. Here it is in 1D:
      </p>

      <GradientDescentDemo />

      <Callout kind="realworld" title="The punchline">
        <p>
          The derivative you learned as &quot;slope of a tangent line&quot; is the exact tool that lets a computer
          improve itself. Calculus isn&apos;t a relic — it&apos;s the engine under the hood of the AI you&apos;re
          talking to right now.
        </p>
      </Callout>
    </Section>
  );
}
