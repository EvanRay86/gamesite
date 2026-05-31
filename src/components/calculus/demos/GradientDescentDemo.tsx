"use client";

// Gradient descent — the algorithm behind machine learning — as a ball rolling
// downhill. Each step moves against the derivative: x ← x − (learning rate)·f′(x).

import { useEffect, useRef, useState } from "react";
import FunctionPlot, { PLOT_COLORS } from "../FunctionPlot";
import { derivative, fmt } from "@/lib/calculus/numeric";

// a double-well "loss" so we can show local vs global minima
const loss = (x: number) => 0.08 * x ** 4 - 0.5 * x * x + 0.15 * x + 2;
const DOM: [number, number] = [-3.2, 3.2];

export default function GradientDescentDemo() {
  const [x, setX] = useState(-2.6);
  const [lr, setLr] = useState(0.15);
  const [steps, setSteps] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const grad = derivative(loss, x);

  const step = () => {
    setX((cur) => {
      const g = derivative(loss, cur);
      return cur - lr * g;
    });
    setSteps((s) => s + 1);
  };

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setX((cur) => {
        const g = derivative(loss, cur);
        if (Math.abs(g) < 1e-3) {
          setPlaying(false);
          return cur;
        }
        return cur - lr * g;
      });
      setSteps((s) => s + 1);
    }, 120);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, lr]);

  const reset = (start: number) => {
    setPlaying(false);
    setX(start);
    setSteps(0);
  };

  return (
    <div className="clay-card my-5 p-4 sm:p-5">
      <div className="mb-3 text-sm font-bold text-purple">🤖 Gradient Descent (how AI learns)</div>

      <FunctionPlot
        xDomain={DOM}
        yDomain={[0, 4.2]}
        ariaLabel="A ball descending a loss curve"
        curves={[{ fn: loss, color: PLOT_COLORS.ink, width: 2.5 }]}
        points={[{ x, y: loss(x), color: PLOT_COLORS.coral, radius: 7, label: "model" }]}
        segments={[
          // tangent showing the local gradient
          { x1: x - 0.7, y1: loss(x) - 0.7 * grad, x2: x + 0.7, y2: loss(x) + 0.7 * grad, color: PLOT_COLORS.amber, width: 2 },
        ]}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={step} className="rounded-full bg-purple px-4 py-1.5 text-sm font-semibold text-white">Step</button>
        <button onClick={() => setPlaying((p) => !p)} className="rounded-full bg-coral px-4 py-1.5 text-sm font-semibold text-white">
          {playing ? "⏸ Pause" : "▶ Auto"}
        </button>
        <button onClick={() => reset(-2.6)} className="rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-text-secondary">Reset left</button>
        <button onClick={() => reset(2.6)} className="rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-text-secondary">Reset right</button>
      </div>

      <label className="mt-3 block text-sm">
        <span className="mb-1 flex justify-between font-semibold text-text-secondary">
          <span>Learning rate</span>
          <span className="font-mono text-purple">{fmt(lr, 2)}</span>
        </span>
        <input type="range" min={0.01} max={0.6} step={0.01} value={lr} onChange={(e) => setLr(parseFloat(e.target.value))} className="w-full accent-purple" />
      </label>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat label="position x" value={fmt(x, 3)} color="coral" />
        <Stat label="gradient f′(x)" value={fmt(grad, 3)} color="amber" />
        <Stat label="steps" value={String(steps)} color="purple" />
      </div>
      <p className="mt-3 text-center text-sm text-text-muted">
        The ball always moves <em>opposite</em> the slope, so it rolls downhill to a minimum. Too big a learning
        rate overshoots and bounces; start on different sides to see it settle into different <em>local</em> minima —
        the central challenge of training neural networks.
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
