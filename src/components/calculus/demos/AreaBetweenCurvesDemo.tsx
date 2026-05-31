"use client";

// Shade the region between two curves over [a, b] and compute its area as the
// integral of (top − bottom). Drag the bounds to see the area update live.

import { useState } from "react";
import FunctionPlot, { PLOT_COLORS } from "../FunctionPlot";
import { integrate, fmt } from "@/lib/calculus/numeric";

const f = (x: number) => -0.5 * x * x + 4; // downward parabola (top)
const g = (x: number) => 0.5 * x; // line (bottom)

// intersection points where f = g  →  -0.5x² + 4 = 0.5x  →  x² + x - 8 = 0
const xL = (-1 - Math.sqrt(1 + 32)) / 2;
const xR = (-1 + Math.sqrt(1 + 32)) / 2;

export default function AreaBetweenCurvesDemo() {
  const [a, setA] = useState(Number(xL.toFixed(2)));
  const [b, setB] = useState(Number(xR.toFixed(2)));
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const area = integrate((x) => f(x) - g(x), lo, hi);

  return (
    <div className="clay-card my-5 p-4 sm:p-5">
      <div className="mb-3 text-sm font-bold text-sky">🟦 Area Between Two Curves</div>

      <FunctionPlot
        xDomain={[-5, 4]}
        yDomain={[-3, 5]}
        ariaLabel="Region between two curves"
        curves={[
          { fn: f, color: PLOT_COLORS.purple, width: 2.5, label: "top: −0.5x²+4" },
          { fn: g, color: PLOT_COLORS.coral, width: 2.5, label: "bottom: 0.5x" },
        ]}
        areas={[{ fn: f, fn2: g, from: lo, to: hi, color: PLOT_COLORS.sky, opacity: 0.28 }]}
        vlines={[
          { value: lo, color: PLOT_COLORS.green, dashed: true, label: "a" },
          { value: hi, color: PLOT_COLORS.green, dashed: true, label: "b" },
        ]}
      />

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 flex justify-between font-semibold text-text-secondary">
            <span>Left bound a</span>
            <span className="font-mono text-green">{fmt(a, 2)}</span>
          </span>
          <input type="range" min={-5} max={3.9} step={0.05} value={a} onChange={(e) => setA(parseFloat(e.target.value))} className="w-full accent-green" />
        </label>
        <label className="text-sm">
          <span className="mb-1 flex justify-between font-semibold text-text-secondary">
            <span>Right bound b</span>
            <span className="font-mono text-green">{fmt(b, 2)}</span>
          </span>
          <input type="range" min={-4.9} max={4} step={0.05} value={b} onChange={(e) => setB(parseFloat(e.target.value))} className="w-full accent-green" />
        </label>
      </div>

      <div className="mt-3 rounded-lg bg-sky/10 px-3 py-2 text-center">
        <span className="text-sm text-text-secondary">
          Shaded area ={" "}
          <span className="font-mono font-bold text-sky">∫ (top − bottom) dx = {fmt(area, 3)}</span>
        </span>
      </div>
      <p className="mt-2 text-center text-sm text-text-muted">
        Set the bounds to the intersection points (<span className="font-mono">a ≈ {fmt(xL, 2)}</span>,{" "}
        <span className="font-mono">b ≈ {fmt(xR, 2)}</span>) to capture the whole enclosed region.
      </p>
    </div>
  );
}
