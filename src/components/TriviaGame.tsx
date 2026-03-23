"use client";

import { useState, useCallback } from "react";
import type { TriviaPuzzle } from "@/types/trivia";

const CATEGORY_COLORS: Record<string, string> = {
  Science: "#4ECDC4",
  History: "#FF6B6B",
  Geography: "#45B7D1",
  Art: "#F7B731",
  Music: "#F7B731",
  Literature: "#FF6B6B",
  Nature: "#4ECDC4",
  Technology: "#45B7D1",
  Culture: "#F7B731",
  Math: "#4ECDC4",
  Sports: "#FF6B6B",
};

function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] || "#8a8a9a";
}

type Screen = "splash" | "playing" | "results";

export default function TriviaGame({ puzzle }: { puzzle: TriviaPuzzle }) {
  const [screen, setScreen] = useState<Screen>("splash");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showCorrect, setShowCorrect] = useState(false);

  const questions = puzzle.questions;
  const totalQ = questions.length;
  const score = answers.filter(
    (a, i) => a === questions[i].correctIndex
  ).length;

  const handleSelect = useCallback(
    (idx: number) => {
      if (locked) return;
      setSelected(idx);
    },
    [locked]
  );

  const handleConfirm = useCallback(() => {
    if (selected === null || locked) return;
    setLocked(true);
    setShowCorrect(true);

    const isCorrect = selected === questions[current].correctIndex;
    const newStreak = isCorrect ? streak + 1 : 0;
    setStreak(newStreak);
    if (newStreak > bestStreak) setBestStreak(newStreak);

    setTimeout(() => {
      setAnswers((prev) => [...prev, selected]);
      setSelected(null);
      setLocked(false);
      setShowCorrect(false);

      if (current + 1 >= totalQ) {
        setScreen("results");
      } else {
        setCurrent((c) => c + 1);
      }
    }, 1200);
  }, [selected, locked, current, totalQ, questions, streak, bestStreak]);

  const handleShare = useCallback(() => {
    const lines = answers.map((a, i) => {
      const correct = a === questions[i].correctIndex;
      return correct ? "\u2705" : "\u274c";
    });

    const pct = Math.round((score / totalQ) * 100);
    const text = `Daily Trivia ${puzzle.puzzle_date}\n${score}/${totalQ} (${pct}%)\n${lines.join("")}\ngamesite-orpin.vercel.app/trivia`;

    navigator.clipboard.writeText(text).catch(() => {});
  }, [answers, questions, score, totalQ, puzzle.puzzle_date]);

  // ── Splash ──────────────────────────────────────────────
  if (screen === "splash") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 animate-[fade-up_0.5s_ease_forwards]">
        <h1 className="font-body text-5xl font-extrabold text-text-primary tracking-tight mb-3">
          <span className="bg-gradient-to-r from-sky to-teal bg-clip-text text-transparent">
            Daily Trivia
          </span>
        </h1>
        <p className="text-text-muted text-base mb-2">{puzzle.puzzle_date}</p>
        <p className="text-text-dim text-sm mb-8 max-w-xs text-center">
          {totalQ} questions across multiple categories. Pick the right answer
          for each one.
        </p>
        <button
          onClick={() => setScreen("playing")}
          className="bg-gradient-to-br from-sky to-teal text-white border-none
                     px-10 py-4 rounded-full text-lg font-bold cursor-pointer
                     shadow-[0_4px_24px_rgba(69,183,209,0.3)]
                     hover:scale-105 hover:shadow-[0_6px_32px_rgba(69,183,209,0.5)]
                     transition-all duration-200"
        >
          Start
        </button>
      </div>
    );
  }

  // ── Results ─────────────────────────────────────────────
  if (screen === "results") {
    const pct = Math.round((score / totalQ) * 100);
    let remark = "Better luck next time!";
    if (pct === 100) remark = "Perfect score!";
    else if (pct >= 75) remark = "Great job!";
    else if (pct >= 50) remark = "Not bad!";

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 animate-[fade-up_0.5s_ease_forwards]">
        <h2 className="font-body text-4xl font-extrabold text-text-primary mb-2">
          {remark}
        </h2>
        <p className="text-text-muted text-lg mb-8">
          You got{" "}
          <span className="text-sky font-bold">
            {score}/{totalQ}
          </span>{" "}
          correct
        </p>

        {/* Stats */}
        <div className="flex gap-6 mb-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-text-primary">{pct}%</div>
            <div className="text-text-dim text-xs mt-1">Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-text-primary">
              {bestStreak}
            </div>
            <div className="text-text-dim text-xs mt-1">Best streak</div>
          </div>
        </div>

        {/* Answer summary */}
        <div className="w-full max-w-md mb-8 space-y-2">
          {questions.map((q, i) => {
            const userAnswer = answers[i];
            const correct = userAnswer === q.correctIndex;
            return (
              <div
                key={i}
                className="flex items-center gap-3 bg-surface/80 rounded-xl px-4 py-3"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    correct
                      ? "bg-teal/20 text-teal"
                      : "bg-coral/20 text-coral"
                  }`}
                >
                  {correct ? "\u2713" : "\u2717"}
                </div>
                <div className="min-w-0">
                  <p className="text-text-secondary text-sm truncate">
                    {q.question}
                  </p>
                  {!correct && (
                    <p className="text-teal/70 text-xs mt-0.5">
                      {q.options[q.correctIndex]}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleShare}
          className="bg-gradient-to-br from-sky to-teal text-white border-none
                     px-8 py-3 rounded-full text-base font-bold cursor-pointer
                     shadow-[0_4px_16px_rgba(69,183,209,0.3)]
                     hover:scale-105 transition-all duration-200"
        >
          Share Results
        </button>
      </div>
    );
  }

  // ── Playing ─────────────────────────────────────────────
  const q = questions[current];
  const catColor = getCategoryColor(q.category);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Progress bar */}
      <div className="w-full max-w-md mb-6">
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
            style={{ color: catColor, backgroundColor: catColor + "18" }}
          >
            {q.category}
          </span>
          <span className="text-text-dim text-sm font-medium">
            {current + 1} / {totalQ}
          </span>
        </div>
        <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky to-teal rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((current + 1) / totalQ) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div
        key={current}
        className="w-full max-w-md animate-[fade-up_0.35s_ease_forwards]"
      >
        <h2 className="font-body text-xl sm:text-2xl font-bold text-text-primary mb-6 text-center leading-snug">
          {q.question}
        </h2>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrectAnswer = i === q.correctIndex;

            let bg = "bg-surface/80 border-border-light";
            let text = "text-text-secondary";

            if (showCorrect && isCorrectAnswer) {
              bg = "bg-teal/15 border-teal/50";
              text = "text-teal";
            } else if (showCorrect && isSelected && !isCorrectAnswer) {
              bg = "bg-coral/15 border-coral/50";
              text = "text-coral";
            } else if (isSelected) {
              bg = "bg-sky/15 border-sky/50";
              text = "text-sky";
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={locked}
                className={`w-full text-left px-5 py-4 rounded-xl border
                           font-medium text-base transition-all duration-200
                           cursor-pointer disabled:cursor-default
                           ${bg} ${text}
                           ${!locked && !isSelected ? "hover:bg-surface-hover hover:border-sky/30" : ""}`}
              >
                <span className="text-text-dim/50 text-sm font-bold mr-3">
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Confirm button */}
        <div className="flex justify-center">
          <button
            onClick={handleConfirm}
            disabled={selected === null || locked}
            className="bg-gradient-to-br from-sky to-teal text-white border-none
                       px-8 py-3 rounded-full text-base font-bold cursor-pointer
                       shadow-[0_4px_16px_rgba(69,183,209,0.3)]
                       hover:scale-105 transition-all duration-200
                       disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-default"
          >
            {locked ? (selected === q.correctIndex ? "Correct!" : "Wrong") : "Lock In"}
          </button>
        </div>
      </div>

      {/* Score ticker */}
      <div className="mt-6 flex items-center gap-4 text-text-dim text-sm">
        <span>
          Score: <span className="text-text-primary font-bold">{score}</span>
        </span>
        {streak > 1 && (
          <span className="text-amber font-semibold animate-[pop-in_0.3s_ease_forwards]">
            {streak} streak!
          </span>
        )}
      </div>
    </div>
  );
}
