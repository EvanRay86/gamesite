"use client";

// The classic optimization problem: cut squares of side x from the corners of a
// sheet and fold up a box. Slide x and watch the volume curve — the derivative
// is zero exactly at the maximum.

import { useState } from "react";
import FunctionPlot, { PLOT_COLORS } from "../FunctionPlot";
import { fmt } from "@/lib/calculus/numeric";

const L = 20;
const W = 16;
const V = (x: number) => x * (L - 2 * x) * (W - 2 * x);

// find the maximizing x on (0, 8) by a fine scan
let best = 0;
let bestV = -Infinity;
for (let x = 0; x <= 8; x += 0.001) {
  const v = V(x);
  if (v > bestV) {
    bestV = v;
    best = x;
  }
}

export default function OptimizationDemo() {
  const [x, setX] = useState(2);
  const baseL = L - 2 * x;
  const baseW = W - 2 * x;

  return (
    <div className="clay-card my-5 p-4 sm:p-5">
      <div className="mb-3 text-sm font-bold text-purple">📦 Optimization: the open-top box</div>
      <p className="mb-3 text-sm text-text-muted">
        From a {L}×{W} cm sheet, cut a square of side <span className="font-mono">x</span> from each corner and fold up
        the sides. What <span className="font-mono">x</span> gives the biggest box?
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* sheet diagram */}
        <div className="flex items-center justify-center">
          <svg viewBox="0 0 220 180" className="w-full max-w-[240px]">
            <rect x={10} y={10} width={200} height={160} fill={PLOT_COLORS.amber} fillOpacity={0.12} stroke={PLOT_COLORS.amber} strokeWidth={1.5} />
            {[
              [10, 10],
              [1, 10],
              [10, 1],
              [1, 1],
            ].map(([left, top], i) => {
              const cut = (x / W) * 40 + 6;
              return (
                <rect
                  key={i}
                  x={left === 10 ? 10 : 210 - cut}
                  y={top === 10 ? 10 : 170 - cut}
                  width={cut}
                  height={cut}
                  fill={PLOT_COLORS.coral}
                  fillOpacity={0.3}
                  stroke={PLOT_COLORS.coral}
                  strokeDasharray="3 2"
                />
              );
            })}
            <text x={110} y={95} textAnchor="middle" fontSize={11} fill={PLOT_COLORS.ink}>
              base {fmt(baseL, 1)} × {fmt(baseW, 1)}
            </text>
          </svg>
        </div>

        {/* volume curve */}
        <FunctionPlot
          xDomain={[0, 8]}
          height={200}
          ariaLabel="Box volume versus corner cut size"
          curves={[{ fn: V, color: PLOT_COLORS.purple, width: 2.5 }]}
          points={[
            { x, y: V(x), color: PLOT_COLORS.coral, label: "you" },
            { x: best, y: bestV, color: PLOT_COLORS.green, label: "max" },
          ]}
          vlines={[{ value: best, color: PLOT_COLORS.green, dashed: true }]}
        />
      </div>

      <label className="mt-3 block text-sm">
        <span className="mb-1 flex justify-between font-semibold text-text-secondary">
          <span>Corner cut x</span>
          <span className="font-mono text-coral">{fmt(x, 2)} cm</span>
        </span>
        <input type="range" min={0.1} max={7.9} step={0.05} value={x} onChange={(e) => setX(parseFloat(e.target.value))} className="w-full accent-purple" />
      </label>

      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <Stat label="Your volume" value={`${fmt(V(x), 1)} cm³`} color="coral" />
        <Stat label="Max volume" value={`${fmt(bestV, 1)} cm³`} color="green" />
      </div>
      <p className="mt-3 text-center text-sm text-text-muted">
        The maximum sits at <span className="font-mono text-green">x ≈ {fmt(best, 2)}</span>, exactly where the
        volume curve flattens — i.e. where <span className="font-mono">V′(x) = 0</span>. That&apos;s how optimization
        works: set the derivative to zero.
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
