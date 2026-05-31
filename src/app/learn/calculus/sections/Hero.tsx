"use client";

import FunctionPlot, { PLOT_COLORS } from "@/components/calculus/FunctionPlot";
import { derivative } from "@/lib/calculus/numeric";

const f = (x: number) => 0.5 * x * x;
const a = 2;
const slope = derivative(f, a);
const tan = (x: number) => slope * (x - a) + f(a);

export default function Hero() {
  return (
    <header className="relative overflow-hidden pb-6 pt-8 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="hero-blob h-64 w-64 bg-purple/30" style={{ top: -40, left: -40 }} />
        <div className="hero-blob h-72 w-72 bg-sky/25" style={{ top: 20, right: -60, animationDelay: "5s" }} />
        <div className="hero-blob h-56 w-56 bg-coral/20" style={{ bottom: -20, left: "30%", animationDelay: "9s" }} />
      </div>

      <span className="inline-block rounded-full bg-purple/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple">
        Interactive Course · Free
      </span>
      <h1 className="gradient-text-hero mx-auto mt-3 max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
        Teach Me Calculus
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-base text-text-muted sm:text-lg">
        Everything you need to actually understand calculus — from limits to multivariable — on one page.
        Live graphs you can drag, endless practice problems with step-by-step solutions, and real-world
        examples that make it click.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <a href="#intro" className="btn-glow rounded-full bg-purple px-6 py-3 text-sm font-bold text-white no-underline transition-transform hover:scale-105">
          Start from the beginning
        </a>
        <a href="#practice" className="rounded-full bg-surface px-6 py-3 text-sm font-bold text-text-secondary no-underline transition-colors hover:bg-surface-hover">
          Jump to practice 🎯
        </a>
      </div>

      {/* Two big ideas teaser */}
      <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-4 text-left sm:grid-cols-2">
        <div className="clay-card p-4">
          <div className="mb-1 text-xs font-bold uppercase tracking-wide text-coral">Differential calculus</div>
          <div className="mb-2 font-display text-lg text-text-primary">Slopes & rates of change</div>
          <FunctionPlot
            xDomain={[-1, 4]}
            height={200}
            grid
            ariaLabel="A curve with a tangent line"
            curves={[{ fn: f, color: PLOT_COLORS.ink }]}
            segments={[{ x1: -1, y1: tan(-1), x2: 4, y2: tan(4), color: PLOT_COLORS.coral, dashed: true }]}
            points={[{ x: a, y: f(a), color: PLOT_COLORS.coral }]}
          />
        </div>
        <div className="clay-card p-4">
          <div className="mb-1 text-xs font-bold uppercase tracking-wide text-green">Integral calculus</div>
          <div className="mb-2 font-display text-lg text-text-primary">Areas & accumulation</div>
          <FunctionPlot
            xDomain={[-1, 4]}
            height={200}
            grid
            ariaLabel="Shaded area under a curve"
            curves={[{ fn: f, color: PLOT_COLORS.ink }]}
            areas={[{ fn: f, from: 0.5, to: 3.2, color: PLOT_COLORS.green, opacity: 0.25 }]}
          />
        </div>
      </div>

      <div className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-text-muted">
        <span>📚 17 chapters</span>
        <span>📈 15+ live graphs</span>
        <span>🎲 Endless practice</span>
        <span>🧮 Through Calc III</span>
      </div>
    </header>
  );
}
