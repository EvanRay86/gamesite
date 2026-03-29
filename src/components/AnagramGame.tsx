"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { AnagramPuzzle } from "@/types/anagram";
import { shareOrCopy } from "@/lib/share";

const TIME_LIMIT = 30; // seconds per word

type Screen = "splash" | "playing" | "results";

export default function AnagramGame({ puzzle }: { puzzle: AnagramPuzzle }) {
  const [screen, setScreen] = useState<Screen>("splash");
  const [current, setCurrent] = useState(0);
  const [guess, setGuess] = useState("");
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [results, setResults] = useState<
    { solved: boolean; timeTaken: number }[]
  >([]);
  const [shake, setShake] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [shared, setShared] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const words = puzzle.words;
  const totalWords = words.length;
  const currentWord = words[current];

  // ── Timer ─────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== "playing" || revealed) return;

    startTimeRef.current = Date.now();
    setTimeLeft(TIME_LIMIT);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up — mark as failed
          clearInterval(timerRef.current!);
          setRevealed(true);
          setResults((r) => [...r, { solved: false, timeTaken: TIME_LIMIT }]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, current, revealed]);

  // Auto-focus input
  useEffect(() => {
    if (screen === "playing" && !revealed) {
      inputRef.current?.focus();
    }
  }, [screen, current, revealed]);

  const handleSubmit = useCallback(() => {
    if (revealed) return;

    const answer = guess.trim().toUpperCase();
    if (answer === currentWord.word) {
      // Correct!
      if (timerRef.current) clearInterval(timerRef.current);
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      setResults((r) => [...r, { solved: true, timeTaken: elapsed }]);
      setRevealed(true);
    } else {
      // Wrong — shake
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }, [guess, currentWord, revealed]);

  const handleNext = useCallback(() => {
    if (current + 1 >= totalWords) {
      setScreen("results");
    } else {
      setCurrent((c) => c + 1);
      setGuess("");
      setRevealed(false);
    }
  }, [current, totalWords]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        if (revealed) {
          handleNext();
        } else {
          handleSubmit();
        }
      }
    },
    [revealed, handleNext, handleSubmit]
  );

  const handleSkip = useCallback(() => {
    if (revealed) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setResults((r) => [...r, { solved: false, timeTaken: TIME_LIMIT }]);
    setRevealed(true);
  }, [revealed]);

  const solvedCount = results.filter((r) => r.solved).length;
  const totalTime = results.reduce((sum, r) => sum + r.timeTaken, 0);

  const handleShare = async () => {
    const emoji = results.map((r) => (r.solved ? "✅" : "❌")).join("");
    const text = `Anagram Scramble ${puzzle.puzzle_date}\n${emoji}\n${solvedCount}/${totalWords} solved\ngamesite.app/daily/anagram`;
    const ok = await shareOrCopy(text);
    if (ok) {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  // ── Timer bar color ───────────────────────────────────────
  const timerPercent = (timeLeft / TIME_LIMIT) * 100;
  const timerColor =
    timeLeft > 15 ? "#4ECDC4" : timeLeft > 7 ? "#F7B731" : "#FF6B6B";

  // ── Splash Screen ──────────────────────────────────────────
  if (screen === "splash") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-[420px] text-center">
          <h1 className="font-display text-4xl text-text-primary mb-2">
            Anagram Scramble
          </h1>
          <p className="text-text-muted mb-8">
            Unscramble {totalWords} words before time runs out.
            <br />
            You have {TIME_LIMIT} seconds per word.
          </p>
          <button
            onClick={() => setScreen("playing")}
            className="rounded-full bg-teal px-8 py-3 text-lg font-bold text-white
                       hover:bg-teal/90 transition-colors"
          >
            Start
          </button>
        </div>
      </div>
    );
  }

  // ── Results Screen ─────────────────────────────────────────
  if (screen === "results") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-[480px]">
          <div className="bg-white rounded-2xl border border-border-light shadow-sm p-6 sm:p-8 text-center">
            <h2 className="font-display text-3xl text-text-primary mb-1">
              {solvedCount === totalWords
                ? "Perfect!"
                : solvedCount >= 3
                  ? "Nice Work!"
                  : "Keep Trying!"}
            </h2>
            <p className="text-text-muted mb-6">
              {solvedCount}/{totalWords} words solved
            </p>

            {/* Word results */}
            <div className="space-y-3 mb-6 text-left">
              {words.map((w, i) => {
                const r = results[i];
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between rounded-xl p-3 ${
                      r?.solved ? "bg-green/5" : "bg-red-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{r?.solved ? "✅" : "❌"}</span>
                      <div>
                        <p className="font-bold text-text-primary tracking-wider">
                          {w.word}
                        </p>
                        <p className="text-xs text-text-dim">{w.hint}</p>
                      </div>
                    </div>
                    <span className="text-sm text-text-muted">
                      {r?.solved ? `${r.timeTaken}s` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>

            {solvedCount > 0 && (
              <p className="text-sm text-text-muted mb-4">
                Total time: {totalTime}s
              </p>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleShare}
                className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-colors ${
                  shared
                    ? "bg-green text-white"
                    : "bg-teal text-white hover:bg-teal/90"
                }`}
              >
                {shared ? "Copied!" : "Share Results"}
              </button>
              <button
                onClick={() => {
                  setScreen("splash");
                  setCurrent(0);
                  setGuess("");
                  setResults([]);
                  setRevealed(false);
                }}
                className="rounded-full border border-border-light px-6 py-2.5
                           text-sm font-semibold text-text-muted hover:bg-surface
                           transition-colors"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Playing Screen ─────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-[480px]">
        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-text-muted">
            Word {current + 1} of {totalWords}
          </span>
          <div className="flex gap-1.5">
            {words.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-6 rounded-full transition-colors ${
                  i < current
                    ? results[i]?.solved
                      ? "bg-green"
                      : "bg-red-300"
                    : i === current
                      ? "bg-teal"
                      : "bg-border-light"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border-light shadow-sm p-6 sm:p-8">
          {/* Timer bar */}
          <div className="w-full h-2 bg-surface rounded-full mb-6 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{
                width: `${timerPercent}%`,
                backgroundColor: timerColor,
              }}
            />
          </div>

          {/* Hint */}
          <div className="text-center mb-2">
            <span className="inline-block rounded-full bg-teal/10 text-teal px-3 py-1 text-xs font-semibold">
              {currentWord.hint}
            </span>
          </div>

          {/* Letters — show scrambled while playing, solved word when revealed */}
          <div className="flex justify-center gap-2 my-6">
            {(revealed ? currentWord.word.split("") : currentWord.scrambled.split("")).map((letter, i) => (
              <div
                key={i}
                className={`w-12 h-14 sm:w-14 sm:h-16 rounded-xl border-2 flex items-center justify-center
                           text-xl sm:text-2xl font-bold tracking-wider
                           ${
                             revealed
                               ? results[current]?.solved
                                 ? "border-green bg-green/5 text-green"
                                 : "border-red-300 bg-red-50 text-red-500"
                               : "border-border-light bg-surface text-text-primary"
                           }
                           ${shake ? "animate-[shake_0.4s_ease-in-out]" : ""}`}
              >
                {letter}
              </div>
            ))}
          </div>


          {/* Input or next button */}
          {revealed ? (
            <div className="text-center">
              <p className="text-lg font-semibold mb-3">
                {results[current]?.solved ? (
                  <span className="text-green">
                    Correct! ({results[current].timeTaken}s)
                  </span>
                ) : (
                  <span className="text-red-500">
                    {timeLeft === 0 ? "Time's up!" : "Skipped"}
                  </span>
                )}
              </p>
              <button
                onClick={handleNext}
                className="rounded-full bg-teal px-6 py-2.5 text-sm font-semibold
                           text-white hover:bg-teal/90 transition-colors"
              >
                {current + 1 >= totalWords ? "See Results" : "Next Word"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                ref={inputRef}
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                maxLength={currentWord.word.length}
                placeholder="Type your answer..."
                className={`w-full rounded-xl border-2 px-4 py-3 text-center text-lg
                           font-semibold tracking-widest uppercase
                           focus:outline-none focus:border-teal
                           ${shake ? "border-red-400" : "border-border-light"}`}
                autoComplete="off"
                autoCapitalize="characters"
              />
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleSubmit}
                  disabled={guess.trim().length === 0}
                  className="rounded-full bg-teal px-6 py-2.5 text-sm font-semibold
                             text-white hover:bg-teal/90 transition-colors
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Submit
                </button>
                <button
                  onClick={handleSkip}
                  className="rounded-full border border-border-light px-6 py-2.5
                             text-sm font-semibold text-text-muted hover:bg-surface
                             transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Timer text */}
        {!revealed && (
          <div className="text-center mt-3">
            <span
              className="text-2xl font-bold font-mono"
              style={{ color: timerColor }}
            >
              {timeLeft}s
            </span>
          </div>
        )}
      </div>

    </div>
  );
}
