"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ProblemGenerator.tsx — the interactive practice widget.
//
// Pulls randomized problems from the generator catalog (by id list or topic),
// renders the prompt, grades typed / multiple-choice answers, tracks a streak,
// records solves to course progress, and reveals a step-by-step solution.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useMemo, useState } from "react";
import { M, MathBlock } from "./Math";
import { useProgress } from "./progress";
import {
  GENERATORS,
  generatorsByTopic,
  type Generator,
  type GeneratedProblem,
} from "@/lib/calculus/generators";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  /** Restrict to specific generator ids. */
  generatorIds?: string[];
  /** Or restrict to a topic. */
  topic?: string;
  title?: string;
  accent?: string;
}

export default function ProblemGenerator({
  generatorIds,
  topic,
  title = "Practice",
  accent = "purple",
}: Props) {
  const { markSolved } = useProgress();

  const pool = useMemo<Generator[]>(() => {
    if (generatorIds?.length) {
      return GENERATORS.filter((g) => generatorIds.includes(g.id));
    }
    if (topic) return generatorsByTopic(topic);
    return GENERATORS;
  }, [generatorIds, topic]);

  const [gen, setGen] = useState<Generator>(() => pool[0] ?? GENERATORS[0]);
  const [problem, setProblem] = useState<GeneratedProblem>(() =>
    (pool[0] ?? GENERATORS[0]).generate(),
  );
  const [choices, setChoices] = useState(() =>
    problem.choices ? shuffle(problem.choices) : null,
  );
  const [input, setInput] = useState("");
  const [picked, setPicked] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [showSteps, setShowSteps] = useState(false);
  const [streak, setStreak] = useState(0);
  const [solved, setSolvedCount] = useState(0);

  const newProblem = useCallback(() => {
    const g = pool[Math.floor(Math.random() * pool.length)];
    const p = g.generate();
    setGen(g);
    setProblem(p);
    setChoices(p.choices ? shuffle(p.choices) : null);
    setInput("");
    setPicked(null);
    setStatus("idle");
    setShowSteps(false);
  }, [pool]);

  const handleCorrect = useCallback(() => {
    setStatus("correct");
    setStreak((s) => s + 1);
    setSolvedCount((c) => c + 1);
    markSolved(gen.topic);
  }, [gen.topic, markSolved]);

  const checkTyped = useCallback(() => {
    if (status === "correct") return;
    const ok = problem.check?.(input.trim()) ?? false;
    if (ok) handleCorrect();
    else {
      setStatus("wrong");
      setStreak(0);
    }
  }, [input, problem, status, handleCorrect]);

  const checkChoice = useCallback(
    (idx: number) => {
      if (status === "correct" || !choices) return;
      setPicked(idx);
      if (choices[idx].correct) handleCorrect();
      else {
        setStatus("wrong");
        setStreak(0);
      }
    },
    [choices, status, handleCorrect],
  );

  return (
    <div className={`clay-card my-5 overflow-hidden`}>
      {/* header */}
      <div className={`flex items-center justify-between gap-2 bg-${accent}/10 px-4 py-2.5`}>
        <div className="flex items-center gap-2">
          <span className="text-base">🎯</span>
          <span className={`text-sm font-bold text-${accent}`}>{title}</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold text-text-muted">
          <span title="Current streak">🔥 {streak}</span>
          <span title="Solved this session">✓ {solved}</span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-text-dim">
          {gen.title}
        </div>
        {problem.lead && (
          <p className="mb-2 text-sm text-text-muted">{problem.lead}</p>
        )}

        <div className="my-3 rounded-lg bg-surface px-3 py-2">
          <MathBlock>{problem.promptTex}</MathBlock>
        </div>

        {/* multiple choice */}
        {choices ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {choices.map((c, i) => {
              const isPicked = picked === i;
              const reveal = status !== "idle";
              const cls = reveal
                ? c.correct
                  ? "border-green bg-green/10 text-green"
                  : isPicked
                    ? "border-coral bg-coral/10 text-coral"
                    : "border-border-light bg-white text-text-muted"
                : "border-border-light bg-white hover:border-purple hover:bg-purple/5";
              return (
                <button
                  key={i}
                  onClick={() => checkChoice(i)}
                  disabled={status === "correct"}
                  className={`flex items-center justify-center rounded-lg border-2 px-3 py-2.5 font-medium transition-all ${cls}`}
                >
                  <M>{c.tex}</M>
                </button>
              );
            })}
          </div>
        ) : (
          // typed answer
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && checkTyped()}
              placeholder={problem.placeholder ?? "Type your answer"}
              className="flex-1 rounded-lg border-2 border-border-light bg-white px-3 py-2.5 font-mono text-[15px] outline-none transition-colors focus:border-purple"
              spellCheck={false}
              autoComplete="off"
            />
            <button
              onClick={checkTyped}
              disabled={status === "correct" || !input.trim()}
              className={`rounded-lg bg-${accent} px-5 py-2.5 font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40`}
            >
              Check
            </button>
          </div>
        )}

        {/* feedback */}
        {status === "correct" && (
          <div className="animate-fade-in mt-3 flex items-center gap-2 rounded-lg bg-green/10 px-3 py-2 text-sm font-semibold text-green">
            ✓ Correct! Nice work.
          </div>
        )}
        {status === "wrong" && (
          <div className="animate-fade-in mt-3 flex items-center gap-2 rounded-lg bg-coral/10 px-3 py-2 text-sm font-semibold text-coral">
            ✗ Not quite — try again, or reveal the steps below.
          </div>
        )}

        {/* actions */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSteps((s) => !s)}
            className="rounded-full border border-border-light bg-white px-4 py-1.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface"
          >
            {showSteps ? "Hide solution" : "Show solution"}
          </button>
          <button
            onClick={newProblem}
            className="rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
          >
            ↻ New problem
          </button>
        </div>

        {/* solution */}
        {showSteps && (
          <div className="animate-fade-in mt-4 rounded-xl border border-border-light bg-white/70 p-4">
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-sky">
              Step-by-step
            </div>
            <ol className="space-y-2">
              {problem.steps.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-text-secondary">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky/15 text-[11px] font-bold text-sky">
                    {i + 1}
                  </span>
                  <StepText text={s} />
                </li>
              ))}
            </ol>
            <div className="mt-3 rounded-lg bg-green/5 px-3 py-2">
              <span className="text-xs font-bold uppercase tracking-wide text-green">Answer</span>
              <div className="mt-1">
                <M>{problem.answerTex}</M>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Renders a step string that may contain inline $...$ LaTeX segments. */
function StepText({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <span className="flex-1">
      {parts.map((p, i) =>
        p.startsWith("$") && p.endsWith("$") ? (
          <M key={i}>{p.slice(1, -1)}</M>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  );
}
