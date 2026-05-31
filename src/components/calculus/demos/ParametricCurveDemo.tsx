"use client";

// Parametric & polar curve tracer. Pick a curve, drag the parameter, and watch
// the point sweep out a shape that's impossible to write as y = f(x).

import { useState } from "react";
import FunctionPlot, { PLOT_COLORS, type PlotSegment } from "../FunctionPlot";
import { fmt } from "@/lib/calculus/numeric";

type Curve = { x: (t: number) => number; y: (t: number) => number; tMax: number; label: string; kind: "parametric" | "polar" };

const CURVES: Record<string, Curve> = {
  Circle: { x: (t) => 2 * Math.cos(t), y: (t) => 2 * Math.sin(t), tMax: 2 * Math.PI, label: "x=2cos t, y=2sin t", kind: "parametric" },
  Lissajous: { x: (t) => 2.4 * Math.sin(3 * t), y: (t) => 2.4 * Math.sin(2 * t), tMax: 2 * Math.PI, label: "x=sin 3t, y=sin 2t", kind: "parametric" },
  Spiral: { x: (t) => 0.35 * t * Math.cos(t), y: (t) => 0.35 * t * Math.sin(t), tMax: 6 * Math.PI, label: "r = 0.35θ (Archimedean spiral)", kind: "polar" },
  Rose: { x: (t) => 2.6 * Math.cos(4 * t) * Math.cos(t), y: (t) => 2.6 * Math.cos(4 * t) * Math.sin(t), tMax: 2 * Math.PI, label: "r = cos 4θ (8-petal rose)", kind: "polar" },
  Cardioid: { x: (t) => (1 + Math.cos(t)) * Math.cos(t) * 1.6, y: (t) => (1 + Math.cos(t)) * Math.sin(t) * 1.6, tMax: 2 * Math.PI, label: "r = 1 + cos θ (cardioid)", kind: "polar" },
};

export default function ParametricCurveDemo() {
  const [name, setName] = useState<keyof typeof CURVES>("Lissajous");
  const [frac, setFrac] = useState(0.5);
  const c = CURVES[name];
  const tNow = frac * c.tMax;

  const N = 400;
  const full: PlotSegment[] = [];
  const traced: PlotSegment[] = [];
  for (let i = 0; i < N; i++) {
    const t1 = (i / N) * c.tMax;
    const t2 = ((i + 1) / N) * c.tMax;
    const seg = { x1: c.x(t1), y1: c.y(t1), x2: c.x(t2), y2: c.y(t2) };
    full.push({ ...seg, color: "rgba(26,26,46,0.12)", width: 1.5 });
    if (t2 <= tNow) traced.push({ ...seg, color: PLOT_COLORS.purple, width: 2.5 });
  }

  return (
    <div className="clay-card my-5 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-amber">✨ Parametric & Polar Curves</span>
        <div className="ml-auto flex flex-wrap gap-1">
          {(Object.keys(CURVES) as (keyof typeof CURVES)[]).map((k) => (
            <button
              key={k}
              onClick={() => { setName(k); setFrac(0.5); }}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${name === k ? "bg-amber text-white" : "bg-surface text-text-muted"}`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[420px]">
        <FunctionPlot
          xDomain={[-3.2, 3.2]}
          yDomain={[-3.2, 3.2]}
          width={400}
          height={360}
          ariaLabel={`${name} curve`}
          segments={[...full, ...traced]}
          points={[{ x: c.x(tNow), y: c.y(tNow), color: PLOT_COLORS.coral }]}
        />
      </div>

      <label className="mt-3 block text-sm">
        <span className="mb-1 flex justify-between font-semibold text-text-secondary">
          <span>{c.kind === "polar" ? "angle θ" : "parameter t"}</span>
          <span className="font-mono text-coral">{fmt(tNow, 2)}</span>
        </span>
        <input type="range" min={0} max={1} step={0.005} value={frac} onChange={(e) => setFrac(parseFloat(e.target.value))} className="w-full accent-amber" />
      </label>

      <div className="mt-2 rounded-lg bg-surface px-3 py-2 text-center font-mono text-sm text-text-secondary">{c.label}</div>
    </div>
  );
}
