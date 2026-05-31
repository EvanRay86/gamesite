"use client";

// ─────────────────────────────────────────────────────────────────────────────
// FunctionPlot.tsx — a dependency-free SVG graphing engine.
//
// Renders axes, a "nice" grid with numeric labels, one or more function curves
// (breaking the path at asymptotes / undefined points), and a stack of optional
// overlays used throughout the calculus page:
//   • shaded areas (under a curve or between two curves) — for integrals
//   • Riemann rectangles                                  — for Riemann sums
//   • arbitrary line segments (tangents, secants)         — for derivatives
//   • points (filled/hollow, labeled)                     — for critical points
//   • vertical / horizontal reference lines (asymptotes)
//
// It is fully declarative. Interactive demos wrap it and pass the `onPointer`
// callback to read math-space coordinates from mouse / touch.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useRef } from "react";

export interface PlotCurve {
  fn: (x: number) => number;
  color?: string;
  width?: number;
  dashed?: boolean;
  label?: string;
}

export interface PlotPoint {
  x: number;
  y: number;
  color?: string;
  radius?: number;
  hollow?: boolean;
  label?: string;
  labelDx?: number;
  labelDy?: number;
}

export interface PlotSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  dashed?: boolean;
  width?: number;
}

export interface PlotArea {
  fn: (x: number) => number;
  from: number;
  to: number;
  /** Optional lower boundary curve (defaults to y = 0). */
  fn2?: (x: number) => number;
  color?: string;
  opacity?: number;
}

export interface PlotRiemann {
  rects: { x: number; width: number; height: number }[];
  color?: string;
  stroke?: string;
}

export interface PlotRefLine {
  value: number;
  color?: string;
  dashed?: boolean;
  label?: string;
}

export interface FunctionPlotProps {
  curves?: PlotCurve[];
  xDomain: [number, number];
  yDomain?: [number, number];
  points?: PlotPoint[];
  segments?: PlotSegment[];
  areas?: PlotArea[];
  riemann?: PlotRiemann;
  vlines?: PlotRefLine[];
  hlines?: PlotRefLine[];
  width?: number;
  height?: number;
  grid?: boolean;
  className?: string;
  ariaLabel?: string;
  onPointer?: (mathX: number, mathY: number) => void;
  onPointerLeave?: () => void;
}

const PALETTE = {
  coral: "#FF6B6B",
  teal: "#4ECDC4",
  sky: "#45B7D1",
  amber: "#F7B731",
  purple: "#A855F7",
  green: "#22C55E",
  ink: "#1a1a2e",
  grid: "rgba(26,26,46,0.07)",
  gridMajor: "rgba(26,26,46,0.16)",
  axis: "rgba(26,26,46,0.5)",
};

const PAD = { left: 42, right: 16, top: 16, bottom: 30 };

/** Choose a "nice" tick step (1, 2, 5 × 10^k) near the target count. */
function niceStep(range: number, target = 8): number {
  const raw = range / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  let step;
  if (norm < 1.5) step = 1;
  else if (norm < 3) step = 2;
  else if (norm < 7) step = 5;
  else step = 10;
  return step * mag;
}

function ticks(min: number, max: number, step: number): number[] {
  const out: number[] = [];
  const start = Math.ceil(min / step) * step;
  for (let v = start; v <= max + step * 1e-6; v += step) {
    out.push(Math.abs(v) < step * 1e-6 ? 0 : v);
  }
  return out;
}

function fmtTick(v: number, step: number): string {
  const decimals = step < 1 ? Math.min(3, Math.ceil(-Math.log10(step))) : 0;
  return v.toFixed(decimals);
}

export default function FunctionPlot({
  curves = [],
  xDomain,
  yDomain,
  points = [],
  segments = [],
  areas = [],
  riemann,
  vlines = [],
  hlines = [],
  width = 560,
  height = 360,
  grid = true,
  className = "",
  ariaLabel,
  onPointer,
  onPointerLeave,
}: FunctionPlotProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const [xmin, xmax] = xDomain;
  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;

  // Auto-fit y-domain from the curves if not provided.
  const [ymin, ymax] = useMemo<[number, number]>(() => {
    if (yDomain) return yDomain;
    let lo = Infinity;
    let hi = -Infinity;
    const N = 200;
    for (const c of curves) {
      for (let i = 0; i <= N; i++) {
        const x = xmin + ((xmax - xmin) * i) / N;
        const y = c.fn(x);
        if (Number.isFinite(y)) {
          lo = Math.min(lo, y);
          hi = Math.max(hi, y);
        }
      }
    }
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [-5, 5];
    if (lo === hi) {
      lo -= 1;
      hi += 1;
    }
    const pad = (hi - lo) * 0.12;
    return [lo - pad, hi + pad];
  }, [yDomain, curves, xmin, xmax]);

  // ── Coordinate transforms ──────────────────────────────────────────────────
  const sx = (x: number) => PAD.left + ((x - xmin) / (xmax - xmin)) * plotW;
  const sy = (y: number) => PAD.top + ((ymax - y) / (ymax - ymin)) * plotH;

  // ── Curve path generation (with asymptote breaks) ──────────────────────────
  function curvePath(fn: (x: number) => number): string {
    const cols = Math.max(80, Math.floor(plotW));
    let d = "";
    let penDown = false;
    let prevY = NaN;
    for (let i = 0; i <= cols; i++) {
      const x = xmin + ((xmax - xmin) * i) / cols;
      const y = fn(x);
      const inView = Number.isFinite(y);
      // Detect a likely vertical asymptote: huge jump between adjacent samples.
      const jump =
        penDown &&
        Number.isFinite(prevY) &&
        Math.abs(y - prevY) > (ymax - ymin) * 4;
      if (!inView || jump) {
        penDown = false;
        prevY = y;
        continue;
      }
      const px = sx(x).toFixed(1);
      // Clamp drawing far outside the viewport so paths stay tidy.
      const cy = Math.max(ymin - (ymax - ymin), Math.min(ymax + (ymax - ymin), y));
      const py = sy(cy).toFixed(1);
      d += penDown ? ` L${px} ${py}` : ` M${px} ${py}`;
      penDown = true;
      prevY = y;
    }
    return d.trim();
  }

  function areaPath(area: PlotArea): string {
    const { fn, fn2, from, to } = area;
    const cols = Math.max(20, Math.floor(((to - from) / (xmax - xmin)) * plotW));
    let top = "";
    const bottomPts: string[] = [];
    for (let i = 0; i <= cols; i++) {
      const x = from + ((to - from) * i) / cols;
      const yt = clampY(fn(x));
      const yb = clampY(fn2 ? fn2(x) : 0);
      top += `${i === 0 ? "M" : "L"}${sx(x).toFixed(1)} ${sy(yt).toFixed(1)} `;
      bottomPts.push(`L${sx(x).toFixed(1)} ${sy(yb).toFixed(1)} `);
    }
    return top + bottomPts.reverse().join("") + "Z";
  }

  function clampY(y: number): number {
    if (!Number.isFinite(y)) return ymax;
    return Math.max(ymin - (ymax - ymin) * 0.5, Math.min(ymax + (ymax - ymin) * 0.5, y));
  }

  // ── Grid ticks ─────────────────────────────────────────────────────────────
  const xStep = niceStep(xmax - xmin);
  const yStep = niceStep(ymax - ymin);
  const xTicks = ticks(xmin, xmax, xStep);
  const yTicks = ticks(ymin, ymax, yStep);

  const axisY = ymin <= 0 && ymax >= 0 ? sy(0) : null; // x-axis position
  const axisX = xmin <= 0 && xmax >= 0 ? sx(0) : null; // y-axis position

  function handlePointer(e: React.PointerEvent<SVGSVGElement>) {
    if (!onPointer || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    const py = ((e.clientY - rect.top) / rect.height) * height;
    const mx = xmin + ((px - PAD.left) / plotW) * (xmax - xmin);
    const my = ymax - ((py - PAD.top) / plotH) * (ymax - ymin);
    onPointer(mx, my);
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full h-auto touch-none select-none ${className}`}
      style={{ maxWidth: "100%" }}
      role="img"
      aria-label={ariaLabel ?? "Function graph"}
      onPointerMove={onPointer ? handlePointer : undefined}
      onPointerDown={onPointer ? handlePointer : undefined}
      onPointerLeave={onPointerLeave}
    >
      {/* plot background */}
      <rect
        x={PAD.left}
        y={PAD.top}
        width={plotW}
        height={plotH}
        fill="#fff"
        rx={8}
      />

      {/* grid */}
      {grid && (
        <g>
          {xTicks.map((t, i) => (
            <line
              key={`gx${i}`}
              x1={sx(t)}
              y1={PAD.top}
              x2={sx(t)}
              y2={PAD.top + plotH}
              stroke={t === 0 ? PALETTE.gridMajor : PALETTE.grid}
              strokeWidth={1}
            />
          ))}
          {yTicks.map((t, i) => (
            <line
              key={`gy${i}`}
              x1={PAD.left}
              y1={sy(t)}
              x2={PAD.left + plotW}
              y2={sy(t)}
              stroke={t === 0 ? PALETTE.gridMajor : PALETTE.grid}
              strokeWidth={1}
            />
          ))}
        </g>
      )}

      {/* shaded areas (under curves) */}
      {areas.map((a, i) => (
        <path
          key={`area${i}`}
          d={areaPath(a)}
          fill={a.color ?? PALETTE.sky}
          fillOpacity={a.opacity ?? 0.22}
          stroke="none"
        />
      ))}

      {/* Riemann rectangles */}
      {riemann &&
        riemann.rects.map((r, i) => {
          const x0 = sx(r.x);
          const x1 = sx(r.x + r.width);
          const yTop = sy(Math.max(0, r.height));
          const yBot = sy(Math.min(0, r.height));
          return (
            <rect
              key={`rr${i}`}
              x={Math.min(x0, x1)}
              y={yTop}
              width={Math.abs(x1 - x0)}
              height={Math.abs(yBot - yTop)}
              fill={riemann.color ?? PALETTE.purple}
              fillOpacity={0.25}
              stroke={riemann.stroke ?? PALETTE.purple}
              strokeWidth={0.75}
              strokeOpacity={0.6}
            />
          );
        })}

      {/* axes */}
      {axisY !== null && (
        <line
          x1={PAD.left}
          y1={axisY}
          x2={PAD.left + plotW}
          y2={axisY}
          stroke={PALETTE.axis}
          strokeWidth={1.5}
        />
      )}
      {axisX !== null && (
        <line
          x1={axisX}
          y1={PAD.top}
          x2={axisX}
          y2={PAD.top + plotH}
          stroke={PALETTE.axis}
          strokeWidth={1.5}
        />
      )}

      {/* tick labels */}
      <g fontSize={10} fill={PALETTE.axis} fontFamily="var(--font-grotesk), monospace">
        {xTicks.map((t, i) =>
          t === 0 ? null : (
            <text key={`xl${i}`} x={sx(t)} y={PAD.top + plotH + 14} textAnchor="middle">
              {fmtTick(t, xStep)}
            </text>
          ),
        )}
        {yTicks.map((t, i) =>
          t === 0 ? null : (
            <text key={`yl${i}`} x={PAD.left - 6} y={sy(t) + 3} textAnchor="end">
              {fmtTick(t, yStep)}
            </text>
          ),
        )}
      </g>

      {/* reference lines */}
      {vlines.map((v, i) => (
        <g key={`vl${i}`}>
          <line
            x1={sx(v.value)}
            y1={PAD.top}
            x2={sx(v.value)}
            y2={PAD.top + plotH}
            stroke={v.color ?? PALETTE.amber}
            strokeWidth={1.5}
            strokeDasharray={v.dashed ? "5 4" : undefined}
          />
          {v.label && (
            <text
              x={sx(v.value) + 4}
              y={PAD.top + 12}
              fontSize={11}
              fill={v.color ?? PALETTE.amber}
              fontWeight={600}
            >
              {v.label}
            </text>
          )}
        </g>
      ))}
      {hlines.map((h, i) => (
        <line
          key={`hl${i}`}
          x1={PAD.left}
          y1={sy(h.value)}
          x2={PAD.left + plotW}
          y2={sy(h.value)}
          stroke={h.color ?? PALETTE.amber}
          strokeWidth={1.5}
          strokeDasharray={h.dashed ? "5 4" : undefined}
        />
      ))}

      {/* curves */}
      {curves.map((c, i) => (
        <path
          key={`c${i}`}
          d={curvePath(c.fn)}
          fill="none"
          stroke={c.color ?? PALETTE.coral}
          strokeWidth={c.width ?? 2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={c.dashed ? "6 5" : undefined}
        />
      ))}

      {/* arbitrary segments (tangents, secants) */}
      {segments.map((s, i) => (
        <line
          key={`s${i}`}
          x1={sx(s.x1)}
          y1={sy(s.y1)}
          x2={sx(s.x2)}
          y2={sy(s.y2)}
          stroke={s.color ?? PALETTE.ink}
          strokeWidth={s.width ?? 2}
          strokeDasharray={s.dashed ? "6 5" : undefined}
        />
      ))}

      {/* points */}
      {points.map((p, i) => (
        <g key={`p${i}`}>
          <circle
            cx={sx(p.x)}
            cy={sy(p.y)}
            r={p.radius ?? 5}
            fill={p.hollow ? "#fff" : p.color ?? PALETTE.ink}
            stroke={p.color ?? PALETTE.ink}
            strokeWidth={2}
          />
          {p.label && (
            <text
              x={sx(p.x) + (p.labelDx ?? 8)}
              y={sy(p.y) + (p.labelDy ?? -8)}
              fontSize={12}
              fontWeight={600}
              fill={p.color ?? PALETTE.ink}
            >
              {p.label}
            </text>
          )}
        </g>
      ))}

      {/* curve legend */}
      {curves.some((c) => c.label) && (
        <g fontSize={11} fontFamily="var(--font-grotesk), monospace">
          {curves
            .filter((c) => c.label)
            .map((c, i) => (
              <g key={`leg${i}`} transform={`translate(${PAD.left + 8}, ${PAD.top + 14 + i * 16})`}>
                <line x1={0} y1={-4} x2={18} y2={-4} stroke={c.color ?? PALETTE.coral} strokeWidth={3} strokeDasharray={c.dashed ? "5 4" : undefined} />
                <text x={24} y={0} fill={PALETTE.ink} fontWeight={600}>
                  {c.label}
                </text>
              </g>
            ))}
        </g>
      )}
    </svg>
  );
}

export { PALETTE as PLOT_COLORS };
