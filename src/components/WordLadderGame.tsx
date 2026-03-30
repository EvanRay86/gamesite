"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  isValidWord,
  differsByOneLetter,
  type WordLadderPuzzle,
} from "@/lib/word-ladder-puzzles";
import { shareOrCopy } from "@/lib/share";
import { useGameStats } from "@/hooks/useGameStats";
import StatsModal from "@/components/StatsModal";
import StatsButton from "@/components/StatsButton";

type GameState = "playing" | "won" | "lost";

const MAX_STEPS = 10; // max intermediate words allowed
const WORD_LENGTH = 4;
const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

interface Props {
  puzzle: WordLadderPuzzle;
  date: string;
}

// ---------------------------------------------------------------------------
// Local storage helpers
// ---------------------------------------------------------------------------

function getStorageKey(date: string): string {
  return `word-ladder-${date}`;
}

function getStreakKey(): string {
  return "word-ladder-streak";
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
  chain: string[];
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

export default function WordLadderGame({ puzzle, date }: Props) {
  const optimalSteps = puzzle.solution.length - 2; // intermediate steps in solution
  const [chain, setChain] = useState<string[]>([puzzle.start]);
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [error, setError] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shake, setShake] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showStats, setShowStats] = useState(false);
  const { stats: gameStats, recordGame } = useGameStats("word-ladder", date);

  // Load saved state
  useEffect(() => {
    const saved = loadState(date);
    if (saved) {
      setChain(saved.chain);
      setGameState(saved.gameState);
      if (saved.gameState !== "playing") setShowSplash(false);
    }
    setTimeout(() => setFadeIn(true), 100);
  }, [date]);

  // Persist state
  useEffect(() => {
    if (chain.length > 1 || gameState !== "playing") {
      saveState(date, { chain, gameState });
    }
  }, [chain, gameState, date]);

  // Focus for keyboard
  useEffect(() => {
    if (!showSplash) containerRef.current?.focus();
  }, [showSplash]);

  const lastWord = chain[chain.length - 1];

  const handleChar = useCallback(
    (ch: string) => {
      if (gameState !== "playing") return;
      setError(null);
      if (currentGuess.length < WORD_LENGTH) {
        setCurrentGuess((prev) => [...prev, ch.toLowerCase()]);
      }
    },
    [gameState, currentGuess.length],
  );

  const handleDelete = useCallback(() => {
    if (gameState !== "playing") return;
    setError(null);
    setCurrentGuess((prev) => prev.slice(0, -1));
  }, [gameState]);

  const handleUndo = useCallback(() => {
    if (gameState !== "playing") return;
    if (chain.length <= 1) return;
    setError(null);
    setCurrentGuess([]);
    setChain((prev) => prev.slice(0, -1));
  }, [gameState, chain.length]);

  const handleSubmit = useCallback(() => {
    if (gameState !== "playing") return;
    setError(null);

    if (currentGuess.length !== WORD_LENGTH) {
      setError("Enter a 4-letter word");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    const word = currentGuess.join("");

    if (!isValidWord(word)) {
      setError("Not a valid word");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (!differsByOneLetter(lastWord, word)) {
      setError("Change exactly one letter");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (chain.includes(word)) {
      setError("Already used that word");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    const newChain = [...chain, word];
    setChain(newChain);
    setCurrentGuess([]);

    // Check win
    if (word === puzzle.end) {
      setGameState("won");
      recordGame(true, newChain.length - 1);
      setTimeout(() => setShowStats(true), 800);
      const streak = loadStreak();
      const yesterday = new Date(date + "T00:00:00Z");
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      const newCurrent =
        streak.lastDate === yesterdayStr ? streak.current + 1 : 1;
      saveStreak({
        current: newCurrent,
        max: Math.max(newCurrent, streak.max),
        lastDate: date,
      });
    } else if (newChain.length - 1 >= MAX_STEPS) {
      // Used all steps without reaching the end
      setGameState("lost");
      recordGame(false, MAX_STEPS);
      setTimeout(() => setShowStats(true), 800);
      const streak = loadStreak();
      saveStreak({ ...streak, current: 0, lastDate: date });
    }
  }, [gameState, currentGuess, lastWord, chain, puzzle.end, date]);

  // Physical keyboard
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
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleChar(e.key);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showSplash, handleSubmit, handleDelete, handleChar]);

  const generateShareText = useCallback(() => {
    const steps = chain.length - 1;
    const emoji = gameState === "won" ? "\u2705" : "\u274C";
    const chainStr = chain.map((w) => w.toUpperCase()).join(" \u2192 ");
    return `\uD83E\uDDF1 Word Ladder ${emoji}\n${puzzle.start.toUpperCase()} \u2192 ${puzzle.end.toUpperCase()}\nSteps: ${steps} (optimal: ${optimalSteps})\n${chainStr}\ngamesite.app/daily/word-ladder`;
  }, [gameState, chain, puzzle, optimalSteps]);

  const handleShare = useCallback(async () => {
    const text = generateShareText();
    const ok = await shareOrCopy(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generateShareText]);

  // ---------------------------------------------------------------------------
  // Splash
  // ---------------------------------------------------------------------------

  if (showSplash) {
    return (
      <div
        className={`flex min-h-[70vh] flex-col items-center justify-center px-4 transition-opacity duration-500 ${fadeIn ? "opacity-100" : "opacity-0"}`}
      >
        <div className="bg-white rounded-2xl shadow-lg border border-border-light p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">{"\uD83E\uDDF1"}</div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">
            Word Ladder
          </h1>
          <span className="inline-block text-xs font-semibold text-teal bg-teal/10 rounded-full px-3 py-1 mb-3">
            Daily Puzzle
          </span>
          <p className="text-text-muted text-sm mb-6">
            Change one letter at a time to transform the start word into the end
            word. Every step must be a real English word.
          </p>

          <div className="space-y-3 text-left text-sm text-text-secondary mb-6">
            <div className="flex items-start gap-3">
              <span className="font-bold text-teal">1.</span>
              <span>
                Start with the given word and change exactly one letter
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-bold text-teal">2.</span>
              <span>Each step must form a valid English word</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-bold text-teal">3.</span>
              <span>
                Reach the target word in as few steps as possible
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-text-secondary">
            <p className="font-semibold text-text-primary mb-2">Example</p>
            <div className="flex items-center justify-center gap-2 flex-wrap font-mono text-base">
              <span className="bg-teal/10 text-teal font-bold px-2 py-1 rounded">
                COLD
              </span>
              <span className="text-text-dim">{"\u2192"}</span>
              <span className="bg-white border border-border-light px-2 py-1 rounded">
                CORD
              </span>
              <span className="text-text-dim">{"\u2192"}</span>
              <span className="bg-white border border-border-light px-2 py-1 rounded">
                WORD
              </span>
              <span className="text-text-dim">{"\u2192"}</span>
              <span className="bg-white border border-border-light px-2 py-1 rounded">
                WORM
              </span>
              <span className="text-text-dim">{"\u2192"}</span>
              <span className="bg-amber/10 text-amber font-bold px-2 py-1 rounded">
                WARM
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowSplash(false)}
            className="w-full bg-teal text-white font-bold rounded-full py-3 text-sm hover:opacity-90 transition-opacity"
          >
            Play
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main game
  // ---------------------------------------------------------------------------

  const isFinished = gameState !== "playing";
  const streak = loadStreak();
  const stepsUsed = chain.length - 1;

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className={`flex min-h-[80vh] flex-col items-center px-4 py-8 outline-none transition-opacity duration-500 ${fadeIn ? "opacity-100" : "opacity-0"}`}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl font-bold text-text-primary mb-2">
              Word Ladder
            </h1>
            <StatsButton onClick={() => setShowStats(true)} />
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="bg-teal/10 rounded-xl px-4 py-2 text-center">
              <p className="text-[10px] text-text-dim uppercase tracking-wide">
                Start
              </p>
              <p className="text-xl font-extrabold text-teal font-mono tracking-widest">
                {puzzle.start.toUpperCase()}
              </p>
            </div>
            <div className="text-text-dim text-lg">{"\u2192"}</div>
            <div className="bg-amber/10 rounded-xl px-4 py-2 text-center">
              <p className="text-[10px] text-text-dim uppercase tracking-wide">
                Target
              </p>
              <p className="text-xl font-extrabold text-amber font-mono tracking-widest">
                {puzzle.end.toUpperCase()}
              </p>
            </div>
          </div>
          <p className="text-xs text-text-dim mt-2">
            Optimal: {optimalSteps} step{optimalSteps !== 1 ? "s" : ""} &middot; Max: {MAX_STEPS} steps
          </p>
        </div>

        {/* Chain display */}
        <div className="flex flex-col items-center gap-2 mb-4">
          {chain.map((word, idx) => {
            const isStart = idx === 0;
            const isEnd = word === puzzle.end && gameState === "won";
            // Highlight the changed letter
            const prevWord = idx > 0 ? chain[idx - 1] : null;

            return (
              <div key={idx} className="flex flex-col items-center">
                {idx > 0 && (
                  <div className="text-text-dim text-xs mb-1">{"\u2193"}</div>
                )}
                <div
                  className={`flex gap-1 ${
                    isStart
                      ? ""
                      : isEnd
                        ? ""
                        : ""
                  }`}
                >
                  {word.split("").map((letter, li) => {
                    const changed = prevWord && prevWord[li] !== letter;
                    const bg = isStart
                      ? "bg-teal/10 border-teal/30 text-teal"
                      : isEnd
                        ? "bg-amber/10 border-amber/30 text-amber"
                        : changed
                          ? "bg-teal/10 border-teal/30 text-teal"
                          : "bg-white border-border-light text-text-primary";
                    return (
                      <div
                        key={li}
                        className={`flex h-11 w-11 items-center justify-center rounded-lg border-2 text-lg font-bold font-mono uppercase select-none ${bg}`}
                      >
                        {letter}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Current input row */}
          {gameState === "playing" && (
            <div className="flex flex-col items-center">
              <div className="text-text-dim text-xs mb-1">{"\u2193"}</div>
              <div className={`flex gap-1 ${shake ? "animate-shake" : ""}`}>
                {Array.from({ length: WORD_LENGTH }).map((_, i) => {
                  const ch = currentGuess[i] ?? "";
                  return (
                    <div
                      key={i}
                      className={`flex h-11 w-11 items-center justify-center rounded-lg border-2 text-lg font-bold font-mono uppercase select-none transition-colors ${
                        ch
                          ? "bg-white border-gray-400 text-text-primary"
                          : "bg-white border-border-light border-dashed text-text-dim"
                      }`}
                    >
                      {ch || "\u00B7"}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Target reminder at bottom if not yet reached */}
          {gameState === "playing" && (
            <div className="flex flex-col items-center mt-1">
              <div className="text-text-dim text-xs mb-1">{"\u22EE"}</div>
              <div className="flex gap-1 opacity-40">
                {puzzle.end.split("").map((letter, li) => (
                  <div
                    key={li}
                    className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-dashed border-amber/40 text-lg font-bold font-mono uppercase text-amber/50 select-none"
                  >
                    {letter}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="text-center mb-3">
            <span className="inline-block bg-red-100 text-red-600 text-sm font-medium rounded-full px-4 py-1.5">
              {error}
            </span>
          </div>
        )}

        {/* Steps counter */}
        {gameState === "playing" && (
          <div className="text-center mb-3">
            <span className="text-xs text-text-dim">
              Steps used: <span className="font-bold text-text-secondary">{stepsUsed}</span> / {MAX_STEPS}
            </span>
          </div>
        )}

        {/* Win / lose */}
        {isFinished && (
          <div className="bg-white rounded-2xl border border-border-light p-6 mb-4 text-center shadow-sm">
            {gameState === "won" ? (
              <>
                <div className="text-3xl mb-2">{"\uD83C\uDF89"}</div>
                <h2 className="text-lg font-bold text-text-primary">
                  {stepsUsed <= optimalSteps
                    ? "Perfect!"
                    : stepsUsed <= optimalSteps + 1
                      ? "Great!"
                      : "Solved!"}
                </h2>
                <p className="text-text-muted text-sm mt-1">
                  You reached{" "}
                  <span className="font-mono font-semibold text-amber">
                    {puzzle.end.toUpperCase()}
                  </span>{" "}
                  in{" "}
                  <span className="font-bold text-teal">{stepsUsed}</span>{" "}
                  step{stepsUsed !== 1 ? "s" : ""}
                  {stepsUsed <= optimalSteps && " — that's optimal!"}
                </p>
              </>
            ) : (
              <>
                <div className="text-3xl mb-2">{"\uD83D\uDE14"}</div>
                <h2 className="text-lg font-bold text-text-primary">
                  Out of steps!
                </h2>
                <p className="text-text-muted text-sm mt-1">
                  The optimal path was:{" "}
                  <span className="font-mono font-semibold text-teal">
                    {puzzle.solution.map((w) => w.toUpperCase()).join(" \u2192 ")}
                  </span>
                </p>
              </>
            )}

            {/* Streak */}
            <div className="flex justify-center gap-6 mt-4 text-center">
              <div>
                <p className="text-2xl font-bold text-teal">{streak.current}</p>
                <p className="text-xs text-text-dim">Streak</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">
                  {streak.max}
                </p>
                <p className="text-xs text-text-dim">Best</p>
              </div>
            </div>

            <button
              onClick={handleShare}
              className="mt-4 bg-teal text-white font-bold rounded-full px-6 py-2.5 text-sm hover:opacity-90 transition-opacity"
            >
              {copied ? "Copied!" : "Share result"}
            </button>
          </div>
        )}

        {/* On-screen keyboard */}
        {!isFinished && (
          <div className="flex flex-col items-center gap-1.5 mt-2">
            {/* Row 1 */}
            <div className="flex gap-1">
              {["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"].map(
                (ch) => (
                  <button
                    key={ch}
                    onClick={() => handleChar(ch)}
                    className="flex h-11 w-[32px] sm:w-[36px] items-center justify-center rounded-lg bg-gray-200 text-sm font-bold text-text-primary hover:bg-gray-300 transition-colors uppercase"
                  >
                    {ch}
                  </button>
                ),
              )}
            </div>
            {/* Row 2 */}
            <div className="flex gap-1">
              {["a", "s", "d", "f", "g", "h", "j", "k", "l"].map((ch) => (
                <button
                  key={ch}
                  onClick={() => handleChar(ch)}
                  className="flex h-11 w-[32px] sm:w-[36px] items-center justify-center rounded-lg bg-gray-200 text-sm font-bold text-text-primary hover:bg-gray-300 transition-colors uppercase"
                >
                  {ch}
                </button>
              ))}
            </div>
            {/* Row 3 */}
            <div className="flex gap-1">
              <button
                onClick={handleUndo}
                className="flex h-11 min-w-[48px] items-center justify-center rounded-lg bg-gray-200 text-xs font-bold text-text-primary hover:bg-gray-300 transition-colors"
              >
                Undo
              </button>
              {["z", "x", "c", "v", "b", "n", "m"].map((ch) => (
                <button
                  key={ch}
                  onClick={() => handleChar(ch)}
                  className="flex h-11 w-[32px] sm:w-[36px] items-center justify-center rounded-lg bg-gray-200 text-sm font-bold text-text-primary hover:bg-gray-300 transition-colors uppercase"
                >
                  {ch}
                </button>
              ))}
              <button
                onClick={handleDelete}
                className="flex h-11 min-w-[48px] items-center justify-center rounded-lg bg-gray-200 text-xs font-bold text-text-primary hover:bg-gray-300 transition-colors"
              >
                Del
              </button>
            </div>
            {/* Enter row */}
            <button
              onClick={handleSubmit}
              className="flex h-11 min-w-[120px] items-center justify-center rounded-lg bg-teal text-sm font-bold text-white hover:opacity-90 transition-opacity mt-1"
            >
              Submit Word
            </button>
          </div>
        )}
      </div>

      <StatsModal
        open={showStats}
        onClose={() => setShowStats(false)}
        stats={gameStats}
        gameName="Word Ladder"
        color="teal"
        maxGuesses={MAX_STEPS}
      />

      {/* Shake animation loaded via CSS module: src/styles/animations.module.css */}
    </div>
  );
}
