"use client";

import { Section, Callout } from "@/components/calculus/ui";
import ProblemGenerator from "@/components/calculus/ProblemGenerator";
import { useProgress } from "@/components/calculus/progress";
import { CHAPTER_IDS } from "../chapters";

function ProgressSummary() {
  const { totalSolved, completed } = useProgress();
  return (
    <div className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Stat label="Problems solved" value={String(totalSolved)} color="coral" />
      <Stat label="Sections completed" value={`${completed.length} / ${CHAPTER_IDS.length}`} color="green" />
      <Stat label="Mastery" value={`${Math.round((completed.length / CHAPTER_IDS.length) * 100)}%`} color="purple" />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`clay-card stat-glow p-4 text-center`}>
      <div className={`font-mono text-2xl font-bold text-${color}`}>{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  );
}

export default function PracticeSection() {
  return (
    <Section
      id="practice"
      number="🎯"
      accent="coral"
      title="Practice Hub"
      subtitle="Unlimited randomized problems across every topic — with full solutions."
    >
      <p>
        Practice is where calculus actually sticks. Every generator below produces fresh problems forever; each one
        grades your answer (algebraically equivalent forms are accepted) and reveals a step-by-step solution. Your
        running totals:
      </p>

      <ProgressSummary />

      <h3 className="mt-4 text-xl font-bold text-text-primary">🎲 Random Mix (everything)</h3>
      <p className="text-text-muted">The full firehose — any topic, any difficulty. Great for review or exam prep.</p>
      <ProblemGenerator title="Mixed Practice" accent="coral" />

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ProblemGenerator
          generatorIds={["limit-direct", "limit-factor", "limit-infinity"]}
          title="Limits Drills"
          accent="sky"
        />
        <ProblemGenerator
          generatorIds={["deriv-power", "deriv-root", "deriv-product", "deriv-quotient", "deriv-chain", "deriv-trig", "deriv-explog", "deriv-second"]}
          title="Derivatives Drills"
          accent="coral"
        />
        <ProblemGenerator
          generatorIds={["deriv-tangent", "app-critical", "app-related-rates"]}
          title="Derivative Applications"
          accent="amber"
        />
        <ProblemGenerator
          generatorIds={["int-power", "int-definite", "int-definite-quad", "int-average", "int-usub"]}
          title="Integrals Drills"
          accent="green"
        />
        <ProblemGenerator
          generatorIds={["series-geometric", "series-converge", "mv-partial"]}
          title="Series & Multivariable"
          accent="purple"
        />
      </div>

      <Callout kind="tip" title="How to study with these">
        <p>
          Don&apos;t peek at the solution first. Attempt it, check, and only then reveal the steps — that retrieval
          effort is what builds durable understanding. Aim for a streak of 5 in each topic before moving on.
        </p>
      </Callout>
    </Section>
  );
}
