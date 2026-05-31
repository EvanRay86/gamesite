"use client";

// Limit explorer: a function with a removable hole at x = a. Slide x toward a
// from either side and watch f(x) close in on the limit, with a numeric table.

import { useState } from "react";
import FunctionPlot, { PLOT_COLORS } from "../FunctionPlot";
import { fmt } from "@/lib/calculus/numeric";
import { M } from "../Math";

// f(x) = (x² - 1)/(x - 1) = x + 1, hole at x = 1, limit = 2
const A = 1;
const LIMIT = 2;
const f = (x: number) => (x === A ? NaN : (x * x - 1) / (x - 1));

export default function LimitExplorer() {
  const [side, setSide] = useState<"left" | "right">("left");
  const [t, setT] = useState(0.5); // distance from a, exponential

  const dist = 1.2 * Math.pow(0.01, t); // 1.2 … 0.012
  const x = side === "left" ? A - dist : A + dist;
  const y = f(x);

  const leftRows = [0.5, 0.2, 0.05, 0.01].map((d) => ({ x: A - d, y: f(A - d) }));
  const rightRows = [0.5, 0.2, 0.05, 0.01].map((d) => ({ x: A + d, y: f(A + d) }));

  return (
    <div className="clay-card my-5 p-4 sm:p-5">
      <div className="mb-3 text-sm font-bold text-sky">
        🔍 Approaching a limit: <M>{`f(x)=\\frac{x^2-1}{x-1}`}</M>
      </div>

      <FunctionPlot
        xDomain={[-1, 3]}
        yDomain={[-1, 4]}
        ariaLabel="Limit approaching a hole"
        curves={[{ fn: f, color: PLOT_COLORS.sky, width: 2.5 }]}
        points={[
          { x: A, y: LIMIT, color: PLOT_COLORS.sky, hollow: true, label: "hole" },
          { x, y, color: PLOT_COLORS.coral, label: `x = ${fmt(x, 3)}` },
        ]}
        vlines={[{ value: A, color: PLOT_COLORS.amber, dashed: true }]}
        hlines={[{ value: LIMIT, color: PLOT_COLORS.green, dashed: true }]}
      />

      <div className="mt-3 flex items-center gap-2">
        <div className="flex gap-1">
          <button
            onClick={() => setSide("left")}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${side === "left" ? "bg-sky text-white" : "bg-surface text-text-muted"}`}
          >
            ← from left
          </button>
          <button
            onClick={() => setSide("right")}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${side === "right" ? "bg-sky text-white" : "bg-surface text-text-muted"}`}
          >
            from right →
          </button>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={t}
          onChange={(e) => setT(parseFloat(e.target.value))}
          className="flex-1 accent-sky"
          aria-label="How close to x = 1"
        />
      </div>

      <div className="mt-3 rounded-lg bg-surface px-3 py-2 text-center">
        <span className="text-sm text-text-muted">
          f({fmt(x, 4)}) = <span className="font-mono font-bold text-coral">{fmt(y, 4)}</span> → closing in on{" "}
          <span className="font-mono font-bold text-green">2</span>
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Table title="x → 1⁻" rows={leftRows} />
        <Table title="x → 1⁺" rows={rightRows} />
      </div>
      <p className="mt-3 text-center text-sm text-text-muted">
        The function is <span className="font-semibold">undefined</span> at x = 1 (the hole), yet both sides head to the
        same height. That shared height is the limit: <M>{`\\lim_{x\\to 1} f(x) = 2`}</M>.
      </p>
    </div>
  );
}

function Table({ title, rows }: { title: string; rows: { x: number; y: number }[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border-light">
      <div className="bg-sky/10 px-2 py-1 text-center text-xs font-bold text-sky">{title}</div>
      <table className="w-full text-center text-xs">
        <thead>
          <tr className="text-text-dim">
            <th className="py-1 font-semibold">x</th>
            <th className="py-1 font-semibold">f(x)</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border-light">
              <td className="py-1">{fmt(r.x, 3)}</td>
              <td className="py-1 text-coral">{fmt(r.y, 4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
