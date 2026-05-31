"use client";

// Slope field explorer for a first-order ODE dy/dx = f(x, y). Tiny tick marks
// show the prescribed slope at each point; an Euler-method curve threads through
// them from an initial condition you control.

import { useState } from "react";
import FunctionPlot, { PLOT_COLORS, type PlotSegment } from "../FunctionPlot";
import { fmt } from "@/lib/calculus/numeric";

const ODES = {
  "y′ = x": { f: (x: number, _y: number) => x, note: "solutions are parabolas y = x²/2 + C" },
  "y′ = y": { f: (_x: number, y: number) => y, note: "exponential growth y = Ceˣ" },
  "y′ = x − y": { f: (x: number, y: number) => x - y, note: "solutions curve toward the line y = x − 1" },
} as const;
type Key = keyof typeof ODES;

const X: [number, number] = [-4, 4];
const Y: [number, number] = [-4, 4];

export default function SlopeFieldDemo() {
  const [key, setKey] = useState<Key>("y′ = x − y");
  const [y0, setY0] = useState(2);
  const f = ODES[key].f;

  // slope field tick marks
  const field: PlotSegment[] = [];
  for (let gx = X[0] + 0.5; gx <= X[1] - 0.4; gx += 0.8) {
    for (let gy = Y[0] + 0.5; gy <= Y[1] - 0.4; gy += 0.8) {
      const m = f(gx, gy);
      const scale = 0.32 / Math.sqrt(1 + m * m);
      field.push({
        x1: gx - scale,
        y1: gy - scale * m,
        x2: gx + scale,
        y2: gy + scale * m,
        color: "rgba(69,183,209,0.55)",
        width: 1.5,
      });
    }
  }

  // Euler-method solution curve from (x0=-4, y0), and also integrate forward from x=0
  const sol: PlotSegment[] = [];
  const step = 0.05;
  // forward from left edge
  let x = X[0];
  let y = y0;
  for (; x < X[1]; x += step) {
    const ny = y + f(x, y) * step;
    if (Math.abs(y) < 12 && Math.abs(ny) < 12) {
      sol.push({ x1: x, y1: y, x2: x + step, y2: ny, color: PLOT_COLORS.coral, width: 2.5 });
    }
    y = ny;
  }

  return (
    <div className="clay-card my-5 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-sky">🧭 Slope Field & Euler&apos;s Method</span>
        <div className="ml-auto flex gap-1">
          {(Object.keys(ODES) as Key[]).map((k) => (
            <button
              key={k}
              onClick={() => setKey(k)}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${key === k ? "bg-sky text-white" : "bg-surface text-text-muted"}`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <FunctionPlot
        xDomain={X}
        yDomain={Y}
        ariaLabel="Slope field with a solution curve"
        segments={[...field, ...sol]}
        points={[{ x: X[0], y: y0, color: PLOT_COLORS.coral, label: "start" }]}
      />

      <label className="mt-3 block text-sm">
        <span className="mb-1 flex justify-between font-semibold text-text-secondary">
          <span>Initial value y at x = −4</span>
          <span className="font-mono text-coral">{fmt(y0, 1)}</span>
        </span>
        <input type="range" min={-4} max={4} step={0.2} value={y0} onChange={(e) => setY0(parseFloat(e.target.value))} className="w-full accent-sky" />
      </label>

      <div className="mt-2 rounded-lg bg-sky/10 px-3 py-2 text-center text-sm text-text-secondary">
        The little ticks show the slope the equation <span className="font-mono">{key}</span> demands at every point;{" "}
        {ODES[key].note}.
      </div>
      <p className="mt-2 text-center text-sm text-text-muted">
        A differential equation describes a curve by its slope. The red curve follows those slopes step by step —
        that&apos;s <span className="font-semibold">Euler&apos;s method</span>, the simplest numerical ODE solver.
      </p>
    </div>
  );
}
