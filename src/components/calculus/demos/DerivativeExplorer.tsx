"use client";

// Plots f and its derivative f′ together. Move the pointer across the graph to
// set x: a tangent line appears on f, and a dot rides along the f′ curve showing
// that the derivative's *height* equals the original curve's *slope*.

import { useState } from "react";
import FunctionPlot, { PLOT_COLORS } from "../FunctionPlot";
import { derivative, derivativeFn, fmt, clamp } from "@/lib/calculus/numeric";

const FUNCS = {
  "x³ − 3x": { fn: (x: number) => x ** 3 - 3 * x, dom: [-2.6, 2.6] as [number, number] },
  "x²": { fn: (x: number) => x * x, dom: [-3, 3] as [number, number] },
  "sin x": { fn: (x: number) => Math.sin(x), dom: [-Math.PI * 1.5, Math.PI * 1.5] as [number, number] },
} as const;
type Key = keyof typeof FUNCS;

export default function DerivativeExplorer() {
  const [key, setKey] = useState<Key>("x³ − 3x");
  const [x0, setX0] = useState(-1.2);

  const { fn, dom } = FUNCS[key];
  const df = derivativeFn(fn);
  const slope = derivative(fn, x0);
  const fa = fn(x0);
  const tan = (x: number) => slope * (x - x0) + fa;

  return (
    <div className="clay-card my-5 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-coral">📈 f and f′ together</span>
        <div className="ml-auto flex gap-1">
          {(Object.keys(FUNCS) as Key[]).map((k) => (
            <button
              key={k}
              onClick={() => setKey(k)}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                key === k ? "bg-coral text-white" : "bg-surface text-text-muted"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <FunctionPlot
        xDomain={dom}
        ariaLabel="A function and its derivative"
        curves={[
          { fn, color: PLOT_COLORS.ink, width: 2.5, label: "f(x)" },
          { fn: df, color: PLOT_COLORS.teal, width: 2, dashed: true, label: "f′(x)" },
        ]}
        segments={[{ x1: dom[0], y1: tan(dom[0]), x2: dom[1], y2: tan(dom[1]), color: PLOT_COLORS.coral, width: 1.75 }]}
        points={[
          { x: x0, y: fa, color: PLOT_COLORS.coral },
          { x: x0, y: df(x0), color: PLOT_COLORS.teal, hollow: true },
        ]}
        onPointer={(mx) => setX0(clamp(mx, dom[0], dom[1]))}
      />

      <div className="mt-3 flex items-center gap-3">
        <span className="text-sm text-text-muted">Drag across the graph, or use the slider:</span>
      </div>
      <input
        type="range"
        min={dom[0]}
        max={dom[1]}
        step={0.02}
        value={x0}
        onChange={(e) => setX0(parseFloat(e.target.value))}
        className="mt-1 w-full accent-coral"
        aria-label="x position"
      />

      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <Stat label="x" value={fmt(x0, 2)} color="ink" />
        <Stat label="slope of f" value={fmt(slope, 3)} color="coral" />
        <Stat label="height of f′" value={fmt(df(x0), 3)} color="teal" />
      </div>
      <p className="mt-2 text-center text-sm text-text-muted">
        The last two numbers are always equal — that&apos;s the definition of the derivative, made visible.
      </p>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  const text = color === "ink" ? "text-text-primary" : `text-${color}`;
  const bg = color === "ink" ? "bg-surface" : `bg-${color}/10`;
  return (
    <div className={`rounded-lg ${bg} px-2 py-2`}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-text-dim">{label}</div>
      <div className={`font-mono text-base font-bold ${text}`}>{value}</div>
    </div>
  );
}
