"use client";

// Riemann sum explorer: choose the number of rectangles and the sampling method,
// and watch the approximation converge to the exact area (the definite integral).

import { useState } from "react";
import FunctionPlot, { PLOT_COLORS } from "../FunctionPlot";
import { riemannRects, integrate, fmt, type RiemannMethod } from "@/lib/calculus/numeric";

const FUNCS = {
  "x²": { fn: (x: number) => x * x, a: 0, b: 3 },
  "sin x": { fn: (x: number) => Math.sin(x) + 1.2, a: 0, b: Math.PI * 2 },
  "√x": { fn: (x: number) => Math.sqrt(Math.max(0, x)), a: 0, b: 4 },
} as const;
type FuncKey = keyof typeof FUNCS;

const METHODS: { key: RiemannMethod; label: string }[] = [
  { key: "left", label: "Left" },
  { key: "right", label: "Right" },
  { key: "midpoint", label: "Midpoint" },
  { key: "trapezoid", label: "Trapezoid" },
];

export default function RiemannSumDemo() {
  const [fkey, setFkey] = useState<FuncKey>("x²");
  const [n, setN] = useState(6);
  const [method, setMethod] = useState<RiemannMethod>("left");

  const { fn, a, b } = FUNCS[fkey];
  const { rects, sum } = riemannRects(fn, a, b, n, method);
  const exact = integrate(fn, a, b);
  const error = Math.abs(sum - exact);

  return (
    <div className="clay-card my-5 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-purple">📊 Riemann Sums</span>
        <div className="ml-auto flex gap-1">
          {(Object.keys(FUNCS) as FuncKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setFkey(k)}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                fkey === k ? "bg-purple text-white" : "bg-surface text-text-muted"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <FunctionPlot
        xDomain={[a - 0.4, b + 0.4]}
        ariaLabel="Riemann sum rectangles under a curve"
        curves={[{ fn, color: PLOT_COLORS.ink, width: 2.5 }]}
        riemann={{ rects, color: PLOT_COLORS.purple }}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {METHODS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMethod(m.key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                method === m.key ? "bg-purple text-white" : "bg-surface text-text-muted"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-3 block text-sm">
        <span className="mb-1 flex justify-between font-semibold text-text-secondary">
          <span>Rectangles (n)</span>
          <span className="font-mono text-purple">{n}</span>
        </span>
        <input
          type="range"
          min={1}
          max={100}
          step={1}
          value={n}
          onChange={(e) => setN(parseInt(e.target.value))}
          className="w-full accent-purple"
        />
      </label>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat label="Approximation" value={fmt(sum, 4)} color="purple" />
        <Stat label="Exact area" value={fmt(exact, 4)} color="green" />
        <Stat label="Error" value={fmt(error, 4)} color="coral" />
      </div>
      <p className="mt-3 text-center text-sm text-text-muted">
        Push <span className="font-mono">n</span> higher and the rectangles squeeze the error toward 0. The exact area
        is the limit of these sums — that&apos;s the <span className="font-semibold">definite integral</span>.
      </p>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`rounded-lg bg-${color}/10 px-2 py-2`}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-text-dim">{label}</div>
      <div className={`font-mono text-base font-bold text-${color}`}>{value}</div>
    </div>
  );
}
