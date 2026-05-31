"use client";

// Taylor (Maclaurin) series explorer: add polynomial terms one at a time and
// watch the approximation hug the true curve over a wider and wider interval.

import { useState } from "react";
import FunctionPlot, { PLOT_COLORS } from "../FunctionPlot";

function factorial(n: number): number {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

const FUNCS = {
  "eˣ": {
    exact: (x: number) => Math.exp(x),
    approx: (x: number, N: number) => {
      let s = 0;
      for (let n = 0; n <= N; n++) s += Math.pow(x, n) / factorial(n);
      return s;
    },
    dom: [-3, 3] as [number, number],
    range: [-1, 8] as [number, number],
    series: "1 + x + x²/2! + x³/3! + …",
  },
  "sin x": {
    exact: (x: number) => Math.sin(x),
    approx: (x: number, N: number) => {
      let s = 0;
      for (let k = 0; k <= N; k++) s += (Math.pow(-1, k) * Math.pow(x, 2 * k + 1)) / factorial(2 * k + 1);
      return s;
    },
    dom: [-7, 7] as [number, number],
    range: [-2, 2] as [number, number],
    series: "x − x³/3! + x⁵/5! − …",
  },
  "cos x": {
    exact: (x: number) => Math.cos(x),
    approx: (x: number, N: number) => {
      let s = 0;
      for (let k = 0; k <= N; k++) s += (Math.pow(-1, k) * Math.pow(x, 2 * k)) / factorial(2 * k);
      return s;
    },
    dom: [-7, 7] as [number, number],
    range: [-2, 2] as [number, number],
    series: "1 − x²/2! + x⁴/4! − …",
  },
} as const;
type Key = keyof typeof FUNCS;

export default function TaylorSeriesDemo() {
  const [key, setKey] = useState<Key>("sin x");
  const [terms, setTerms] = useState(2);
  const F = FUNCS[key];

  return (
    <div className="clay-card my-5 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-coral">🌀 Taylor Series</span>
        <div className="ml-auto flex gap-1">
          {(Object.keys(FUNCS) as Key[]).map((k) => (
            <button
              key={k}
              onClick={() => { setKey(k); setTerms(2); }}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${key === k ? "bg-coral text-white" : "bg-surface text-text-muted"}`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <FunctionPlot
        xDomain={F.dom}
        yDomain={F.range}
        ariaLabel="Taylor polynomial approximating a function"
        curves={[
          { fn: F.exact, color: PLOT_COLORS.ink, width: 2.5, label: key },
          { fn: (x) => F.approx(x, terms), color: PLOT_COLORS.coral, width: 2, dashed: true, label: `${terms + 1}-term approx` },
        ]}
      />

      <label className="mt-3 block text-sm">
        <span className="mb-1 flex justify-between font-semibold text-text-secondary">
          <span>Terms</span>
          <span className="font-mono text-coral">{terms + 1}</span>
        </span>
        <input type="range" min={0} max={12} step={1} value={terms} onChange={(e) => setTerms(parseInt(e.target.value))} className="w-full accent-coral" />
      </label>

      <div className="mt-2 rounded-lg bg-surface px-3 py-2 text-center font-mono text-sm text-text-secondary">
        {key} = {F.series}
      </div>
      <p className="mt-3 text-center text-sm text-text-muted">
        A polynomial — the simplest kind of function — can imitate <em>any</em> smooth curve. Each new term widens
        the interval where the dashed approximation matches. This is how calculators actually compute sin, cos, and eˣ.
      </p>
    </div>
  );
}
