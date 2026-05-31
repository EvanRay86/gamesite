"use client";

// A function of two variables visualized as a heatmap, with a movable probe that
// reports f, ∂f/∂x, and ∂f/∂y — the slopes of the surface in each direction.

import { useState } from "react";
import { derivative, fmt, clamp } from "@/lib/calculus/numeric";

const SURFACES = {
  "Bowl  x²+y²": { f: (x: number, y: number) => x * x + y * y, note: "a paraboloid — minimum at the origin" },
  "Saddle  x²−y²": { f: (x: number, y: number) => x * x - y * y, note: "a saddle — neither max nor min at the origin" },
  "Ripple  sin·cos": { f: (x: number, y: number) => 2 * Math.sin(x) * Math.cos(y), note: "rolling hills and valleys" },
} as const;
type Key = keyof typeof SURFACES;

const RANGE = 3;
const GRID = 26;
const PLOTINK = "#1a1a2e";

export default function ContourDemo() {
  const [key, setKey] = useState<Key>("Saddle  x²−y²");
  const [px, setPx] = useState(1);
  const [py, setPy] = useState(0.8);
  const f = SURFACES[key].f;

  // sample grid for color normalization
  const cells: { gx: number; gy: number; v: number }[] = [];
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const x = -RANGE + (2 * RANGE * i) / (GRID - 1);
      const y = RANGE - (2 * RANGE * j) / (GRID - 1);
      const v = f(x, y);
      cells.push({ gx: i, gy: j, v });
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
  }
  const color = (v: number) => {
    const t = (v - lo) / (hi - lo || 1); // 0..1
    // blue (low) → white → red (high)
    const r = Math.round(255 * Math.min(1, t * 2));
    const b = Math.round(255 * Math.min(1, (1 - t) * 2));
    const g = Math.round(255 * (1 - Math.abs(t - 0.5) * 2) * 0.7 + 60);
    return `rgb(${r},${g},${b})`;
  };

  // partials at the probe (treat the other variable as fixed)
  const dfdx = derivative((x) => f(x, py), px);
  const dfdy = derivative((y) => f(px, y), py);

  const cell = 200 / GRID;
  const probeX = ((px + RANGE) / (2 * RANGE)) * 200;
  const probeY = ((RANGE - py) / (2 * RANGE)) * 200;

  return (
    <div className="clay-card my-5 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-green">🗺️ Surface as a Heatmap</span>
        <div className="ml-auto flex flex-wrap gap-1">
          {(Object.keys(SURFACES) as Key[]).map((k) => (
            <button
              key={k}
              onClick={() => setKey(k)}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${key === k ? "bg-green text-white" : "bg-surface text-text-muted"}`}
            >
              {k.split("  ")[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <svg viewBox="0 0 200 200" className="w-full rounded-lg border border-border-light">
          {cells.map((c, i) => (
            <rect key={i} x={c.gx * cell} y={c.gy * cell} width={cell + 0.5} height={cell + 0.5} fill={color(c.v)} />
          ))}
          <line x1={probeX} y1={0} x2={probeX} y2={200} stroke="rgba(0,0,0,0.35)" strokeWidth={0.75} />
          <line x1={0} y1={probeY} x2={200} y2={probeY} stroke="rgba(0,0,0,0.35)" strokeWidth={0.75} />
          <circle cx={probeX} cy={probeY} r={4} fill="#fff" stroke={PLOTINK} strokeWidth={2} />
        </svg>

        <div className="text-[15px] text-text-secondary">
          <p className="mb-2">{SURFACES[key].note}. Red is high, blue is low.</p>
          <div className="space-y-2">
            <Probe label="f(x, y)" value={fmt(f(px, py), 3)} color="green" />
            <Probe label="∂f/∂x  (slope in x)" value={fmt(dfdx, 3)} color="coral" />
            <Probe label="∂f/∂y  (slope in y)" value={fmt(dfdy, 3)} color="sky" />
          </div>
          <label className="mt-3 block text-sm">
            <span className="mb-1 flex justify-between font-semibold"><span>x</span><span className="font-mono text-coral">{fmt(px, 2)}</span></span>
            <input type="range" min={-RANGE} max={RANGE} step={0.05} value={px} onChange={(e) => setPx(clamp(parseFloat(e.target.value), -RANGE, RANGE))} className="w-full accent-coral" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 flex justify-between font-semibold"><span>y</span><span className="font-mono text-sky">{fmt(py, 2)}</span></span>
            <input type="range" min={-RANGE} max={RANGE} step={0.05} value={py} onChange={(e) => setPy(clamp(parseFloat(e.target.value), -RANGE, RANGE))} className="w-full accent-sky" />
          </label>
        </div>
      </div>
      <p className="mt-3 text-center text-sm text-text-muted">
        A partial derivative just freezes one variable and differentiates in the other — the slope of the surface
        along that compass direction.
      </p>
    </div>
  );
}

function Probe({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`flex items-center justify-between rounded-lg bg-${color}/10 px-3 py-1.5`}>
      <span className="text-sm font-semibold text-text-secondary">{label}</span>
      <span className={`font-mono font-bold text-${color}`}>{value}</span>
    </div>
  );
}
