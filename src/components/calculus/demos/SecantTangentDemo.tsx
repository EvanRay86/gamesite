"use client";

// The signature derivative visual: drag h toward 0 and watch the secant line
// (through two points) collapse onto the tangent line. The difference quotient
// converges to the true derivative f'(a).

import { useState } from "react";
import FunctionPlot, { PLOT_COLORS } from "../FunctionPlot";
import { derivative, fmt } from "@/lib/calculus/numeric";

const FUNCS = {
  "x²": { fn: (x: number) => x * x, tex: "x^2" },
  "x³": { fn: (x: number) => x * x * x, tex: "x^3" },
  "sin x": { fn: (x: number) => Math.sin(x), tex: "\\sin x" },
  "eˣ": { fn: (x: number) => Math.exp(x), tex: "e^x" },
} as const;

type FuncKey = keyof typeof FUNCS;

export default function SecantTangentDemo() {
  const [fkey, setFkey] = useState<FuncKey>("x²");
  const [a, setA] = useState(1);
  const [t, setT] = useState(0.7); // slider 0..1 → h exponential

  const f = FUNCS[fkey].fn;
  const h = 0.02 * Math.pow(125, t); // 0.02 … 2.5
  const fa = f(a);
  const fah = f(a + h);
  const secantSlope = (fah - fa) / h;
  const trueSlope = derivative(f, a);

  const xmin = a - 3;
  const xmax = a + 3;

  // secant line extended across the view
  const secY = (x: number) => secantSlope * (x - a) + fa;
  // tangent line extended across the view
  const tanY = (x: number) => trueSlope * (x - a) + fa;

  return (
    <div className="clay-card my-5 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-coral">🔍 Secant → Tangent</span>
        <div className="ml-auto flex gap-1">
          {(Object.keys(FUNCS) as FuncKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setFkey(k)}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                fkey === k ? "bg-coral text-white" : "bg-surface text-text-muted hover:bg-surface-hover"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <FunctionPlot
        xDomain={[xmin, xmax]}
        ariaLabel="Secant and tangent lines"
        curves={[{ fn: f, color: PLOT_COLORS.ink, width: 2.5 }]}
        segments={[
          { x1: xmin, y1: tanY(xmin), x2: xmax, y2: tanY(xmax), color: PLOT_COLORS.teal, dashed: true, width: 2 },
          { x1: xmin, y1: secY(xmin), x2: xmax, y2: secY(xmax), color: PLOT_COLORS.coral, width: 2 },
        ]}
        points={[
          { x: a, y: fa, color: PLOT_COLORS.coral, label: "(a, f(a))" },
          { x: a + h, y: fah, color: PLOT_COLORS.purple, label: "(a+h, f(a+h))", hollow: true },
        ]}
      />

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 flex justify-between font-semibold text-text-secondary">
            <span>Point a</span>
            <span className="font-mono text-coral">{fmt(a, 2)}</span>
          </span>
          <input
            type="range"
            min={-2}
            max={2}
            step={0.1}
            value={a}
            onChange={(e) => setA(parseFloat(e.target.value))}
            className="w-full accent-coral"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 flex justify-between font-semibold text-text-secondary">
            <span>Gap h</span>
            <span className="font-mono text-purple">{fmt(h, 3)}</span>
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.005}
            value={t}
            onChange={(e) => setT(parseFloat(e.target.value))}
            className="w-full accent-purple"
          />
        </label>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat label="Secant slope" value={fmt(secantSlope, 3)} color="coral" />
        <Stat label="True f′(a)" value={fmt(trueSlope, 3)} color="teal" />
        <Stat label="Error" value={fmt(Math.abs(secantSlope - trueSlope), 3)} color="purple" />
      </div>
      <p className="mt-3 text-center text-sm text-text-muted">
        As <span className="font-mono">h → 0</span>, the red secant slope approaches the teal tangent slope — that limit{" "}
        <span className="italic">is</span> the derivative.
      </p>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`rounded-lg bg-${color}/10 px-2 py-2`}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-text-dim">{label}</div>
      <div className={`font-mono text-lg font-bold text-${color}`}>{value}</div>
    </div>
  );
}
