"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { evaluateEquation, type MathlerPuzzle } from "@/lib/mathler-puzzles";
import { shareOrCopy } from "@/lib/share";

const MAX_GUESSES = 6;
const EQUATION_LENGTH = 6;
const VALID_CHARS = "0123456789+-*/";

type CellStatus = "correct" | "present" | "absent" | "empty";
type GameState = "playing" | "won" | "lost";

interface GuessResult {
  guess: string;
  statuses: CellStatus[];
}

interface Props {
  puzzle: MathlerPuzzle;
  date: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCharCounts(str: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const ch of str) {
    counts.set(ch, (counts.get(ch) ?? 0) + 1);
  }
  return counts;
}

function gradeGuess(guess: string, answer: string): CellStatus[] {
  const statuses: CellStatus[] = Array(EQUATION_LENGTH).fill("absent");
  const answerCounts = getCharCounts(answer);

  // First pass: mark correct (green)
  for (let i = 0; i < EQUATION_LENGTH; i++) {
    if (guess[i] === answer[i]) {
      statuses[i] = "correct";
      answerCounts.set(guess[i], (answerCounts.get(guess[i]) ?? 1) - 1);
    }
  }

  // Second pass: mark present (yellow)
  for (let i = 0; i < EQUATION_LENGTH; i++) {
    if (statuses[i] === "correct") continue;
    const remaining = answerCounts.get(guess[i]) ?? 0;
    if (remaining > 0) {
      statuses[i] = "present";
      answerCounts.set(guess[i], remaining - 1);
    }
  }

  return statuses;
}

function getStorageKey(date: string): string {
  return `mathler-${date}`;
}

function getStreakKey(): string {
  return "mathler-streak";
}

interface StreakData {
  current: number;
  max: number;
  lastDate: string;
}

function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem(getStreakKey());
    if (raw) return JSON.parse(raw);
  } catch {}
  return { current: 0, max: 0, lastDate: "" };
}

function saveStreak(data: StreakData) {
  try {
    localStorage.setItem(getStreakKey(), JSON.stringify(data));
  } catch {}
}

interface SavedState {
  guesses: GuessResult[];
  gameState: GameState;
}

function loadState(date: string): SavedState | null {
  try {
    const raw = localStorage.getItem(getStorageKey(date));
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveState(date: string, state: SavedState) {
  try {
    localStorage.setItem(getStorageKey(date), JSON.stringify(state));
  } catch {}
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MathlerGame({ puzzle, date }: Props) {
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [error, setError] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shake, setShake] = useState(false);
  const [revealRow, setRevealRow] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved state on mount
  useEffect(() => {
    const saved = loadState(date);
    if (saved) {
      setGuesses(saved.guesses);
      setGameState(saved.gameState);
      if (saved.gameState !== "playing") {
        setShowSplash(false);
      }
    }
    setTimeout(() => setFadeIn(true), 100);
  }, [date]);

  // Persist state
  useEffect(() => {
    if (guesses.length > 0) {
      saveState(date, { guesses, gameState });
    }
  }, [guesses, gameState, date]);

  // Focus container for keyboard input
  useEffect(() => {
    if (!showSplash) {
      containerRef.current?.focus();
    }
  }, [showSplash]);

  // Build keyboard status map
  const keyStatuses = useCallback((): Map<string, CellStatus> => {
    const map = new Map<string, CellStatus>();
    for (const g of guesses) {
      for (let i = 0; i < EQUATION_LENGTH; i++) {
        const ch = g.guess[i];
        const s = g.statuses[i];
        const current = map.get(ch);
        // Priority: correct > present > absent
        if (!current || s === "correct" || (s === "present" && current === "absent")) {
          map.set(ch, s);
        }
      }
    }
    return map;
  }, [guesses]);

  const handleChar = useCallback(
    (ch: string) => {
      if (gameState !== "playing") return;
      setError(null);
      if (currentGuess.length < EQUATION_LENGTH) {
        setCurrentGuess((prev) => [...prev, ch]);
      }
    },
    [gameState, currentGuess.length],
  );

  const handleDelete = useCallback(() => {
    if (gameState !== "playing") return;
    setError(null);
    setCurrentGuess((prev) => prev.slice(0, -1));
  }, [gameState]);

  const handleSubmit = useCallback(() => {
    if (gameState !== "playing") return;
    setError(null);

    if (currentGuess.length !== EQUATION_LENGTH) {
      setError("Not enough characters");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    const guessStr = currentGuess.join("");
    const result = evaluateEquation(guessStr);

    if (result === null) {
      setError("Invalid equation");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (result !== puzzle.target) {
      setError(`Equation equals ${result}, not ${puzzle.target}`);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    const statuses = gradeGuess(guessStr, puzzle.equation);
    const newGuess: GuessResult = { guess: guessStr, statuses };
    const newGuesses = [...guesses, newGuess];

    setRevealRow(guesses.length);
    setTimeout(() => setRevealRow(null), 600);

    setGuesses(newGuesses);
    setCurrentGuess([]);

    // Check win
    const isWin = statuses.every((s) => s === "correct");
    if (isWin) {
      setGameState("won");
      // Update streak
      const streak = loadStreak();
      const yesterday = new Date(date + "T00:00:00Z");
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      const newCurrent = streak.lastDate === yesterdayStr ? streak.current + 1 : 1;
      saveStreak({
        current: newCurrent,
        max: Math.max(newCurrent, streak.max),
        lastDate: date,
      });
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameState("lost");
      // Break streak
      const streak = loadStreak();
      saveStreak({ ...streak, current: 0, lastDate: date });
    }
  }, [gameState, currentGuess, guesses, puzzle, date]);

  // Physical keyboard handler
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (showSplash) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        handleDelete();
      } else if (VALID_CHARS.includes(e.key)) {
        e.preventDefault();
        handleChar(e.key);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showSplash, handleSubmit, handleDelete, handleChar]);

  const generateShareText = useCallback(() => {
    const guessCount = gameState === "won" ? guesses.length : "X";
    const rows = guesses
      .map((g) =>
        g.statuses
          .map((s) =>
            s === "correct" ? "\uD83D\uDFE9" : s === "present" ? "\uD83D\uDFE8" : "\u2B1C",
          )
          .join(""),
      )
      .join("\n");
    return `\uD83E\uDDEE Mathler ${guessCount}/${MAX_GUESSES}\nTarget: ${puzzle.target}\n${rows}\ngamesite.app/daily/mathler`;
  }, [gameState, guesses, puzzle.target]);

  const handleShare = useCallback(async () => {
    const text = generateShareText();
    const ok = await shareOrCopy(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generateShareText]);

  // Splash screen
  if (showSplash) {
    return (
      <div
        className={`flex min-h-[80vh] flex-col items-center justify-center px-4 transition-opacity duration-500 ${fadeIn ? "opacity-100" : "opacity-0"}`}
      >
        <div className="bg-white rounded-2xl shadow-lg border border-border-light p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">{"\uD83E\uDDEE"}</div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Mathler</h1>
          <span className="inline-block text-xs font-semibold text-purple bg-purple/10 rounded-full px-3 py-1 mb-3">
            Daily Puzzle
          </span>
          <p className="text-text-muted text-sm mb-6">
            Find the hidden equation that equals the target number. You get 6 guesses,
            and each equation is exactly 6 characters long.
          </p>

          <div className="space-y-3 text-left text-sm text-text-secondary mb-6">
            <div className="flex items-start gap-3">
              <span className="font-bold text-purple">1.</span>
              <span>Enter a valid math equation using digits and operators</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-bold text-purple">2.</span>
              <span>Your equation must equal the target number</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-bold text-purple">3.</span>
              <span>Green = right spot, Yellow = wrong spot, Gray = not in equation</span>
            </div>
          </div>

          <button
            onClick={() => setShowSplash(false)}
            className="w-full bg-purple text-white font-bold rounded-full py-3 text-sm hover:opacity-90 transition-opacity"
          >
            Play
          </button>
        </div>
      </div>
    );
  }

  const isFinished = gameState !== "playing";
  const streak = loadStreak();
  const statuses = keyStatuses();

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className={`flex min-h-[80vh] flex-col items-center px-4 py-8 outline-none transition-opacity duration-500 ${fadeIn ? "opacity-100" : "opacity-0"}`}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-text-primary mb-1">Mathler</h1>
          <div className="inline-block bg-purple/10 rounded-xl px-5 py-3">
            <p className="text-xs text-text-muted font-medium uppercase tracking-wide mb-0.5">
              Find the equation that equals
            </p>
            <p className="text-3xl font-extrabold text-purple tabular-nums">
              {puzzle.target}
            </p>
          </div>
        </div>

        {/* Guess grid */}
        <div className="flex flex-col items-center gap-1.5 mb-4">
          {Array.from({ length: MAX_GUESSES }).map((_, rowIdx) => {
            const isCurrentRow = rowIdx === guesses.length && gameState === "playing";
            const guessResult = guesses[rowIdx];
            const isRevealing = revealRow === rowIdx;

            return (
              <div
                key={rowIdx}
                className={`flex gap-1.5 ${isCurrentRow && shake ? "animate-shake" : ""}`}
              >
                {Array.from({ length: EQUATION_LENGTH }).map((_, colIdx) => {
                  let char = "";
                  let status: CellStatus = "empty";

                  if (guessResult) {
                    char = guessResult.guess[colIdx];
                    status = guessResult.statuses[colIdx];
                  } else if (isCurrentRow) {
                    char = currentGuess[colIdx] ?? "";
                  }

                  const bgColor =
                    status === "correct"
                      ? "bg-green-500 border-green-500 text-white"
                      : status === "present"
                        ? "bg-amber-500 border-amber-500 text-white"
                        : status === "absent"
                          ? "bg-gray-500 border-gray-500 text-white"
                          : char
                            ? "bg-white border-gray-400 text-text-primary"
                            : "bg-white border-border-light text-text-primary";

                  const revealDelay = isRevealing ? `${colIdx * 80}ms` : "0ms";

                  return (
                    <div
                      key={colIdx}
                      className={`flex h-14 w-14 items-center justify-center rounded-lg border-2
                        text-xl font-bold select-none transition-colors duration-300 ${bgColor}`}
                      style={{
                        transitionDelay: guessResult ? revealDelay : "0ms",
                      }}
                    >
                      {char}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="text-center mb-3">
            <span className="inline-block bg-red-100 text-red-600 text-sm font-medium rounded-full px-4 py-1.5">
              {error}
            </span>
          </div>
        )}

        {/* Win / lose state */}
        {isFinished && (
          <div className="bg-white rounded-2xl border border-border-light p-6 mb-4 text-center shadow-sm">
            {gameState === "won" ? (
              <>
                <div className="text-3xl mb-2">{"\uD83C\uDF89"}</div>
                <h2 className="text-lg font-bold text-text-primary">Brilliant!</h2>
                <p className="text-text-muted text-sm mt-1">
                  You found{" "}
                  <span className="font-mono font-semibold text-purple">
                    {puzzle.equation}
                  </span>{" "}
                  in{" "}
                  <span className="font-bold text-purple">{guesses.length}</span>{" "}
                  {guesses.length === 1 ? "guess" : "guesses"}
                </p>
              </>
            ) : (
              <>
                <div className="text-3xl mb-2">{"\uD83D\uDE14"}</div>
                <h2 className="text-lg font-bold text-text-primary">
                  Better luck tomorrow!
                </h2>
                <p className="text-text-muted text-sm mt-1">
                  The answer was{" "}
                  <span className="font-mono font-semibold text-purple">
                    {puzzle.equation}
                  </span>
                </p>
              </>
            )}

            {/* Streak */}
            <div className="flex justify-center gap-6 mt-4 text-center">
              <div>
                <p className="text-2xl font-bold text-purple">{streak.current}</p>
                <p className="text-xs text-text-dim">Streak</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{streak.max}</p>
                <p className="text-xs text-text-dim">Best</p>
              </div>
            </div>

            <button
              onClick={handleShare}
              className="mt-4 bg-purple text-white font-bold rounded-full px-6 py-2.5 text-sm hover:opacity-90 transition-opacity"
            >
              {copied ? "Copied!" : "Share result"}
            </button>
          </div>
        )}

        {/* On-screen keyboard */}
        {!isFinished && (
          <div className="flex flex-col items-center gap-2 mt-2">
            {/* Row 1: digits 1-5 */}
            <div className="flex gap-1.5">
              {["1", "2", "3", "4", "5"].map((ch) => (
                <KeyButton
                  key={ch}
                  char={ch}
                  status={statuses.get(ch)}
                  onClick={() => handleChar(ch)}
                />
              ))}
            </div>
            {/* Row 2: digits 6-0 */}
            <div className="flex gap-1.5">
              {["6", "7", "8", "9", "0"].map((ch) => (
                <KeyButton
                  key={ch}
                  char={ch}
                  status={statuses.get(ch)}
                  onClick={() => handleChar(ch)}
                />
              ))}
            </div>
            {/* Row 3: operators + action keys */}
            <div className="flex gap-1.5">
              <button
                onClick={handleDelete}
                className="flex h-12 min-w-[52px] items-center justify-center rounded-lg bg-gray-200 text-sm font-bold text-text-primary hover:bg-gray-300 transition-colors"
              >
                Del
              </button>
              {["+", "-", "*", "/"].map((ch) => (
                <KeyButton
                  key={ch}
                  char={ch}
                  status={statuses.get(ch)}
                  onClick={() => handleChar(ch)}
                />
              ))}
              <button
                onClick={handleSubmit}
                className="flex h-12 min-w-[52px] items-center justify-center rounded-lg bg-purple text-sm font-bold text-white hover:opacity-90 transition-opacity"
              >
                Enter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Shake animation loaded via CSS module: src/styles/animations.module.css */}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Keyboard button
// ---------------------------------------------------------------------------

function KeyButton({
  char,
  status,
  onClick,
}: {
  char: string;
  status?: CellStatus;
  onClick: () => void;
}) {
  const bg =
    status === "correct"
      ? "bg-green-500 text-white hover:bg-green-600"
      : status === "present"
        ? "bg-amber-500 text-white hover:bg-amber-600"
        : status === "absent"
          ? "bg-gray-500 text-white hover:bg-gray-600"
          : "bg-gray-200 text-text-primary hover:bg-gray-300";

  return (
    <button
      onClick={onClick}
      className={`flex h-12 min-w-[36px] items-center justify-center rounded-lg
                  text-lg font-bold transition-colors ${bg}`}
    >
      {char}
    </button>
  );
}
