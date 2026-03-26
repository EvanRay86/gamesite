"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { EmojiWordPuzzle } from "@/types/emoji-word";

const MAX_GUESSES_PER_ROUND = 3;

type Screen = "splash" | "playing" | "results";

const DIFFICULTY_LABELS = ["", "Easy", "Medium", "Tricky", "Hard", "Expert"];
const DIFFICULTY_COLORS = [
  "",
  "#22C55E", // green
  "#4ECDC4", // teal
  "#F7B731", // amber
  "#FF6B6B", // coral
  "#A855F7", // purple
];

export default function EmojiWordGame({
  puzzle,
}: {
  puzzle: EmojiWordPuzzle;
}) {
  const [screen, setScreen] = useState<Screen>("splash");
  const [current, setCurrent] = useState(0);
  const [guess, setGuess] = useState("");
  const [guessesLeft, setGuessesLeft] = useState(MAX_GUESSES_PER_ROUND);
  const [hintShown, setHintShown] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<
    { solved: boolean; guessesUsed: number }[]
  >([]);
  const [shake, setShake] = useState(false);
  const [shared, setShared] = useState(false);
  const [emojiPop, setEmojiPop] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const rounds = puzzle.rounds;
  const totalRounds = rounds.length;
  const currentRound = rounds[current];

  useEffect(() => {
    if (screen === "playing" && !revealed) {
      inputRef.current?.focus();
    }
  }, [screen, current, revealed]);

  // Pop animation when a new round starts
  useEffect(() => {
    if (screen === "playing") {
      setEmojiPop(true);
      const t = setTimeout(() => setEmojiPop(false), 600);
      return () => clearTimeout(t);
    }
  }, [screen, current]);

  const normalize = (s: string) =>
    s
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

  const handleSubmit = useCallback(() => {
    if (revealed) return;
    const answer = normalize(guess);
    const correct = normalize(currentRound.answer);

    if (answer === correct) {
      const used = MAX_GUESSES_PER_ROUND - guessesLeft + 1;
      setResults((r) => [...r, { solved: true, guessesUsed: used }]);
      setRevealed(true);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);

      const remaining = guessesLeft - 1;
      setGuessesLeft(remaining);

      // Show hint after first wrong guess if one exists
      if (!hintShown && currentRound.hint) {
        setHintShown(true);
      }

      if (remaining <= 0) {
        setResults((r) => [
          ...r,
          { solved: false, guessesUsed: MAX_GUESSES_PER_ROUND },
        ]);
        setRevealed(true);
      }
    }
    setGuess("");
  }, [guess, currentRound, revealed, guessesLeft, hintShown]);

  const handleNext = useCallback(() => {
    if (current + 1 >= totalRounds) {
      setScreen("results");
    } else {
      setCurrent((c) => c + 1);
      setGuess("");
      setGuessesLeft(MAX_GUESSES_PER_ROUND);
      setHintShown(false);
      setRevealed(false);
    }
  }, [current, totalRounds]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        if (revealed) {
          handleNext();
        } else if (guess.trim().length > 0) {
          handleSubmit();
        }
      }
    },
    [revealed, handleNext, handleSubmit, guess]
  );

  const handleSkip = useCallback(() => {
    if (revealed) return;
    setResults((r) => [
      ...r,
      { solved: false, guessesUsed: MAX_GUESSES_PER_ROUND },
    ]);
    setRevealed(true);
  }, [revealed]);

  const solvedCount = results.filter((r) => r.solved).length;

  // Score: 3 stars for first guess, 2 for second, 1 for third, 0 for fail
  const getStars = (r: { solved: boolean; guessesUsed: number }) => {
    if (!r.solved) return 0;
    return Math.max(1, MAX_GUESSES_PER_ROUND - r.guessesUsed + 1);
  };
  const totalStars = results.reduce((sum, r) => sum + getStars(r), 0);
  const maxStars = totalRounds * MAX_GUESSES_PER_ROUND;

  const handleShare = () => {
    const lines = results.map((r, i) => {
      const stars = getStars(r);
      const starEmoji = stars > 0 ? "⭐".repeat(stars) : "❌";
      return `${rounds[i].emojis} ${starEmoji}`;
    });
    const text = `Emoji Decoder ${puzzle.puzzle_date}\n${lines.join("\n")}\n${solvedCount}/${totalRounds} solved — ${totalStars}/${maxStars} ⭐`;
    navigator.clipboard.writeText(text);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const diffColor = DIFFICULTY_COLORS[currentRound?.difficulty ?? 1];
  const diffLabel = DIFFICULTY_LABELS[currentRound?.difficulty ?? 1];

  // ── Splash ────────────────────────────────────────────────
  if (screen === "splash") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-[420px] text-center">
          <div className="text-6xl mb-4">🔤🤔</div>
          <h1 className="font-display text-4xl text-text-primary mb-2">
            Emoji Decoder
          </h1>
          <p className="text-text-muted mb-8">
            Guess the word or phrase from the emoji clues.
            <br />
            {totalRounds} rounds — they get harder!
            <br />
            <span className="text-xs text-text-dim">
              {MAX_GUESSES_PER_ROUND} guesses per round
            </span>
          </p>

          {/* Difficulty preview */}
          <div className="flex justify-center gap-2 mb-8">
            {rounds.map((r, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className="h-2 w-8 rounded-full"
                  style={{ backgroundColor: DIFFICULTY_COLORS[r.difficulty] }}
                />
                <span className="text-[10px] text-text-dim">
                  {DIFFICULTY_LABELS[r.difficulty]}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setScreen("playing")}
            className="rounded-full bg-amber px-8 py-3 text-lg font-bold text-white
                       hover:bg-amber/90 transition-colors"
          >
            Start
          </button>
        </div>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────
  if (screen === "results") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-[480px]">
          <div className="bg-white rounded-2xl border border-border-light shadow-sm p-6 sm:p-8 text-center">
            <h2 className="font-display text-3xl text-text-primary mb-1">
              {solvedCount === totalRounds
                ? "Perfect! 🎉"
                : solvedCount >= 3
                  ? "Nice Work! 👏"
                  : "Keep Trying! 💪"}
            </h2>
            <p className="text-text-muted mb-1">
              {solvedCount}/{totalRounds} decoded
            </p>
            <p className="text-sm text-text-dim mb-6">
              {totalStars}/{maxStars} ⭐ earned
            </p>

            <div className="space-y-3 mb-6 text-left">
              {rounds.map((r, i) => {
                const res = results[i];
                const stars = res ? getStars(res) : 0;
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between rounded-xl p-3 ${
                      res?.solved ? "bg-green/5" : "bg-red-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{r.emojis}</span>
                      <div>
                        <p className="font-bold text-text-primary">
                          {r.answer}
                        </p>
                        <p className="text-xs text-text-dim">
                          {DIFFICULTY_LABELS[r.difficulty]}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm">
                      {stars > 0 ? "⭐".repeat(stars) : "❌"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleShare}
                className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-colors ${
                  shared
                    ? "bg-green text-white"
                    : "bg-amber text-white hover:bg-amber/90"
                }`}
              >
                {shared ? "Copied!" : "Share Results"}
              </button>
              <button
                onClick={() => {
                  setScreen("splash");
                  setCurrent(0);
                  setGuess("");
                  setGuessesLeft(MAX_GUESSES_PER_ROUND);
                  setHintShown(false);
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

  // ── Playing ───────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-[480px]">
        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-text-muted">
            Round {current + 1} of {totalRounds}
          </span>
          <div className="flex gap-1.5">
            {rounds.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-6 rounded-full transition-colors ${
                  i < current
                    ? results[i]?.solved
                      ? "bg-green"
                      : "bg-red-300"
                    : i === current
                      ? "bg-amber"
                      : "bg-border-light"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border-light shadow-sm p-6 sm:p-8">
          {/* Difficulty badge */}
          <div className="text-center mb-2">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: diffColor }}
            >
              {diffLabel}
            </span>
          </div>

          {/* Emoji clue */}
          <div
            className={`text-center my-6 transition-transform ${
              emojiPop ? "animate-[pop-in_0.5s_ease-out]" : ""
            }`}
          >
            <span className="text-6xl sm:text-7xl leading-tight">
              {currentRound.emojis}
            </span>
          </div>

          {/* Hint (shown after first wrong guess) */}
          {hintShown && currentRound.hint && !revealed && (
            <div className="text-center mb-4 animate-[fade-up_0.3s_ease-out]">
              <span className="inline-block rounded-lg bg-amber/10 text-amber px-3 py-1.5 text-sm font-medium">
                💡 {currentRound.hint}
              </span>
            </div>
          )}

          {/* Guesses remaining */}
          {!revealed && (
            <div className="flex justify-center gap-1.5 mb-4">
              {Array.from({ length: MAX_GUESSES_PER_ROUND }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i < guessesLeft ? "bg-amber" : "bg-border-light"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Input or result */}
          {revealed ? (
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary mb-1 tracking-wide">
                {currentRound.answer}
              </p>
              {currentRound.hint && (
                <p className="text-sm text-text-dim mb-3">
                  💡 {currentRound.hint}
                </p>
              )}
              <p className="text-lg font-semibold mb-4">
                {results[current]?.solved ? (
                  <span className="text-green">
                    {"⭐".repeat(getStars(results[current]))} Correct!
                  </span>
                ) : (
                  <span className="text-red-500">Not this time ❌</span>
                )}
              </p>
              <button
                onClick={handleNext}
                className="rounded-full bg-amber px-6 py-2.5 text-sm font-semibold
                           text-white hover:bg-amber/90 transition-colors"
              >
                {current + 1 >= totalRounds ? "See Results" : "Next Round"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                ref={inputRef}
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer..."
                className={`w-full rounded-xl border-2 px-4 py-3 text-center text-lg
                           font-semibold tracking-wide
                           focus:outline-none focus:border-amber
                           ${shake ? "border-red-400 animate-[shake_0.4s_ease-in-out]" : "border-border-light"}`}
                autoComplete="off"
              />
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleSubmit}
                  disabled={guess.trim().length === 0}
                  className="rounded-full bg-amber px-6 py-2.5 text-sm font-semibold
                             text-white hover:bg-amber/90 transition-colors
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Guess
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
      </div>
    </div>
  );
}
