"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { TriviaPuzzle } from "@/types/trivia";
import { shareOrCopy } from "@/lib/share";
import { useGameStats } from "@/hooks/useGameStats";
import StatsModal from "@/components/StatsModal";
import StatsButton from "@/components/StatsButton";
import XShareButton from "@/components/XShareButton";

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
  "Current Events": "#FF6B6B",
};

function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] || "#8a8a9a";
}

const TIME_LIMIT = 8; // seconds per question

type Screen = "splash" | "playing" | "results";

export default function TriviaGame({ puzzle }: { puzzle: TriviaPuzzle }) {
  const [screen, setScreen] = useState<Screen>("splash");
  const [current, setCurrent] = useState(0);
  const [locked, setLocked] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [shared, setShared] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showStats, setShowStats] = useState(false);
  const { stats, recordGame } = useGameStats("daily-trivia", puzzle.puzzle_date);

  const questions = puzzle.questions;
  const totalQ = questions.length;
  const score = answers.filter(
    (a, i) => a === questions[i].correctIndex
  ).length;

  // ── Timer ───────────────────────────────────────────────
  useEffect(() => {
    if (screen !== "playing" || locked) return;

    setTimeLeft(TIME_LIMIT);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Time's up — treat as no answer
          clearInterval(timerRef.current!);
          handleAnswer(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, current, locked]);

  // Record stats when game ends
  useEffect(() => {
    if (screen === "results") {
      recordGame(score >= Math.ceil(totalQ / 2), score);
      setTimeout(() => setShowStats(true), 1000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // ── Answer immediately on click ─────────────────────────
  const handleAnswer = useCallback(
    (idx: number | null) => {
      if (locked) return;
      setLocked(true);
      setPicked(idx);
      if (timerRef.current) clearInterval(timerRef.current);

      const isCorrect = idx !== null && idx === questions[current].correctIndex;
      const newStreak = isCorrect ? streak + 1 : 0;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);

      // Show result briefly, then advance
      setTimeout(() => {
        setAnswers((prev) => [...prev, idx]);
        setPicked(null);
        setLocked(false);

        if (current + 1 >= totalQ) {
          setScreen("results");
        } else {
          setCurrent((c) => c + 1);
        }
      }, 1000);
    },
    [locked, current, totalQ, questions, streak, bestStreak]
  );

  // ── Keyboard shortcuts (1-4 for answers) ───────────────
  useEffect(() => {
    if (screen !== "playing" || locked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key);
      if (num >= 1 && num <= questions[current].options.length) {
        e.preventDefault();
        handleAnswer(num - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen, locked, handleAnswer, questions, current]);

  // ── Share ───────────────────────────────────────────────
  const getShareText = useCallback(() => {
    const lines = answers.map((a, i) => {
      if (a === null) return "\u23f0"; // ⏰ for timeout
      return a === questions[i].correctIndex ? "\u2705" : "\u274c";
    });

    const pct = Math.round((score / totalQ) * 100);
    return `Daily Trivia ${puzzle.puzzle_date}\n${score}/${totalQ} (${pct}%)\n${lines.join("")}\ngamesite.app/daily/daily-trivia`;
  }, [answers, questions, score, totalQ, puzzle.puzzle_date]);

  const handleShare = useCallback(async () => {
    const text = getShareText();
    const ok = await shareOrCopy(text);
    if (ok) {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }, [getShareText]);

  // ── Splash ──────────────────────────────────────────────
  if (screen === "splash") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-8 animate-[fade-up_0.5s_ease_forwards]">
        <h1 className="font-body text-5xl font-extrabold text-text-primary tracking-tight mb-3">
          <span className="bg-gradient-to-r from-sky to-teal bg-clip-text text-transparent">
            Daily Trivia
          </span>
        </h1>
        <p className="text-text-muted text-base mb-2">{puzzle.puzzle_date}</p>
        <p className="text-text-dim text-sm mb-8 max-w-xs text-center">
          {totalQ} questions. {TIME_LIMIT} seconds each. Tap your answer — no
          take-backs.
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
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-8 animate-[fade-up_0.5s_ease_forwards]">
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
            const timedOut = userAnswer === null;
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
                      : timedOut
                        ? "bg-amber/20 text-amber"
                        : "bg-coral/20 text-coral"
                  }`}
                >
                  {correct ? "\u2713" : timedOut ? "\u23f0" : "\u2717"}
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
          {shared ? "Copied!" : "Share Results"}
        </button>
        <XShareButton getText={getShareText} />
        <button
          onClick={() => setShowStats(true)}
          className="bg-surface text-text-muted border-[1.5px] border-border-light
                     rounded-full px-8 py-3 text-base font-bold cursor-pointer
                     transition-all hover:bg-surface-hover hover:text-text-secondary mt-3"
        >
          View Stats
        </button>

        <StatsModal
          open={showStats}
          onClose={() => setShowStats(false)}
          stats={stats}
          gameName="8 Second Trivia"
          color="sky"
          maxGuesses={totalQ}
        />
      </div>
    );
  }

  // ── Playing ─────────────────────────────────────────────
  const q = questions[current];
  const catColor = getCategoryColor(q.category);
  const timerPct = (timeLeft / TIME_LIMIT) * 100;
  const timerUrgent = timeLeft <= 3;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-8">
      {/* Progress + timer row */}
      <div className="w-full max-w-md mb-6">
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
            style={{ color: catColor, backgroundColor: catColor + "18" }}
          >
            {q.category}
          </span>
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-bold tabular-nums ${
                timerUrgent ? "text-coral" : "text-text-muted"
              }`}
            >
              {timeLeft}s
            </span>
            <span className="text-text-dim text-sm font-medium">
              {current + 1}/{totalQ}
            </span>
          </div>
        </div>

        {/* Timer bar */}
        <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 linear ${
              timerUrgent
                ? "bg-gradient-to-r from-coral to-amber"
                : "bg-gradient-to-r from-sky to-teal"
            }`}
            style={{ width: `${timerPct}%` }}
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

        {/* Options — click or press 1-4 */}
        <div role="group" aria-label="Answer options — press 1 through 4 to answer" className="space-y-3">
          {q.options.map((opt, i) => {
            const isPicked = picked === i;
            const isCorrectAnswer = i === q.correctIndex;

            let bg = "bg-surface/80 border-border-light";
            let text = "text-text-secondary";

            if (locked && isCorrectAnswer) {
              bg = "bg-teal/15 border-teal/50";
              text = "text-teal";
            } else if (locked && isPicked && !isCorrectAnswer) {
              bg = "bg-coral/15 border-coral/50";
              text = "text-coral";
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={locked}
                aria-label={`Option ${String.fromCharCode(65 + i)}: ${opt}`}
                className={`w-full text-left px-5 py-4 rounded-xl border
                           font-medium text-base transition-all duration-200
                           cursor-pointer disabled:cursor-default
                           ${bg} ${text}
                           ${!locked ? "hover:bg-surface-hover hover:border-sky/30 active:scale-[0.98]" : ""}`}
              >
                <span className="text-text-dim/50 text-sm font-bold mr-3">
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Score ticker */}
      <div aria-live="polite" className="mt-6 flex items-center gap-4 text-text-dim text-sm">
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
