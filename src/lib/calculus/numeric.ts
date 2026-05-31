// ─────────────────────────────────────────────────────────────────────────────
// numeric.ts — numerical calculus helpers used by the interactive graphs and
// the answer-checking layer. Pure functions, no dependencies.
// ─────────────────────────────────────────────────────────────────────────────

export type Fn = (x: number) => number;

/** Central-difference approximation of f'(x). Good to ~1e-6 for smooth f. */
export function derivative(f: Fn, x: number, h = 1e-5): number {
  return (f(x + h) - f(x - h)) / (2 * h);
}

/** Second derivative via central differences. */
export function secondDerivative(f: Fn, x: number, h = 1e-4): number {
  return (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
}

/** A function that returns the numeric derivative of f at any x. */
export function derivativeFn(f: Fn, h = 1e-5): Fn {
  return (x: number) => derivative(f, x, h);
}

/** Composite Simpson's rule for the definite integral of f on [a, b]. */
export function integrate(f: Fn, a: number, b: number, n = 1000): number {
  if (a === b) return 0;
  // Simpson's rule needs an even number of intervals
  const N = n % 2 === 0 ? n : n + 1;
  const h = (b - a) / N;
  let sum = f(a) + f(b);
  for (let i = 1; i < N; i++) {
    const x = a + i * h;
    sum += (i % 2 === 0 ? 2 : 4) * f(x);
  }
  return (h / 3) * sum;
}

export type RiemannMethod = "left" | "right" | "midpoint" | "trapezoid";

export interface RiemannRect {
  x: number; // left edge
  width: number;
  height: number; // f at sample point (signed)
  sampleX: number; // where height was sampled
}

/** Build the rectangles (or trapezoid heights) for a Riemann-sum visualization. */
export function riemannRects(
  f: Fn,
  a: number,
  b: number,
  n: number,
  method: RiemannMethod,
): { rects: RiemannRect[]; sum: number } {
  const dx = (b - a) / n;
  const rects: RiemannRect[] = [];
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const left = a + i * dx;
    let sampleX: number;
    let height: number;
    if (method === "left") {
      sampleX = left;
      height = f(left);
    } else if (method === "right") {
      sampleX = left + dx;
      height = f(left + dx);
    } else if (method === "midpoint") {
      sampleX = left + dx / 2;
      height = f(sampleX);
    } else {
      // trapezoid: average of endpoints
      const hl = f(left);
      const hr = f(left + dx);
      sampleX = left + dx / 2;
      height = (hl + hr) / 2;
    }
    rects.push({ x: left, width: dx, height, sampleX });
    sum += height * dx;
  }
  return { rects, sum };
}

/** Bisection root-finder on [a,b] (requires a sign change). Returns null if none. */
export function findRoot(f: Fn, a: number, b: number, iters = 60): number | null {
  let fa = f(a);
  let fb = f(b);
  if (Number.isNaN(fa) || Number.isNaN(fb) || fa * fb > 0) return null;
  let lo = a;
  let hi = b;
  for (let i = 0; i < iters; i++) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if (fm === 0) return mid;
    if (fa * fm < 0) {
      hi = mid;
      fb = fm;
    } else {
      lo = mid;
      fa = fm;
    }
  }
  return (lo + hi) / 2;
}

/** Round to a sensible number of decimals and strip trailing zeros. */
export function fmt(n: number, decimals = 4): string {
  if (!Number.isFinite(n)) return "undefined";
  if (Math.abs(n) < 1e-12) return "0";
  const rounded = Number(n.toFixed(decimals));
  return String(rounded);
}

/** Pretty fraction-or-decimal formatting for small rationals (used in answers). */
export function fmtNice(n: number): string {
  if (!Number.isFinite(n)) return "undefined";
  if (Number.isInteger(n)) return String(n);
  // Try to express as a simple fraction p/q with q <= 12
  for (let q = 2; q <= 12; q++) {
    const p = n * q;
    if (Math.abs(p - Math.round(p)) < 1e-9) {
      return `${Math.round(p)}/${q}`;
    }
  }
  return fmt(n, 4);
}

/** Greatest common divisor (for reducing generated fractions). */
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

/** Clamp helper. */
export function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

/** Linear map from one range to another. */
export function mapRange(
  x: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  return outMin + ((x - inMin) * (outMax - outMin)) / (inMax - inMin);
}
