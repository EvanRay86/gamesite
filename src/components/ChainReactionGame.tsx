"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { shareOrCopy } from "@/lib/share";
import type { ChainReactionPuzzle } from "@/lib/chain-reaction-puzzles";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  puzzle: ChainReactionPuzzle;
  date: string;
}

type SlotStatus = "locked" | "blank" | "correct" | "wrong";

interface SavedState {
  guesses: string[];
  attempts: number;
  gameState: "playing" | "won" | "lost";
  slotStatuses: SlotStatus[];
  revealedLetters: string[][]; // per-slot revealed letters
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_ATTEMPTS = 3;
const STORAGE_PREFIX = "chain-reaction-";

function getStorageKey(date: string) {
  return `${STORAGE_PREFIX}${date}`;
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

// Streak management
interface StreakData {
  current: number;
  max: number;
  lastDate: string;
}

function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem("chain-reaction-streak");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { current: 0, max: 0, lastDate: "" };
}

function saveStreak(date: string, won: boolean) {
  const streak = loadStreak();
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (won) {
    if (streak.lastDate === yesterdayStr) {
      streak.current += 1;
    } else if (streak.lastDate !== date) {
      streak.current = 1;
    }
    streak.max = Math.max(streak.max, streak.current);
    streak.lastDate = date;
  } else {
    streak.current = 0;
    streak.lastDate = date;
  }

  try {
    localStorage.setItem("chain-reaction-streak", JSON.stringify(streak));
  } catch {}
}

function getStars(attempts: number, won: boolean): number {
  if (!won) return 0;
  return MAX_ATTEMPTS - attempts + 1; // 3★ first try, 2★ second, 1★ third
}

function buildShareText(
  date: string,
  attempts: number,
  won: boolean,
  slotStatuses: SlotStatus[],
): string {
  const stars = getStars(attempts, won);
  const starStr = won ? "\u2B50".repeat(stars) : "\u274C";
  const chainEmoji = slotStatuses
    .map((s) => {
      if (s === "locked" || s === "correct") return "\uD83D\uDFE2"; // green
      if (s === "wrong") return "\uD83D\uDD34"; // red
      return "\u26AA"; // white for blank (shouldn't happen at end)
    })
    .join("");

  return `Chain Reaction \u26D3\uFE0F ${date}\n${starStr} (${attempts}/${MAX_ATTEMPTS})\n${chainEmoji}\ngamesite.app/daily/chain-reaction`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChainReactionGame({ puzzle, date }: Props) {
  const { chain } = puzzle;

  // State
  const [guesses, setGuesses] = useState<string[]>(
    () => chain.map(() => ""),
  );
  const [attempts, setAttempts] = useState(0);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">(
    "playing",
  );
  const [slotStatuses, setSlotStatuses] = useState<SlotStatus[]>(() =>
    chain.map((_, i) => (i === 0 || i === chain.length - 1 ? "locked" : "blank")),
  );
  const [revealedLetters, setRevealedLetters] = useState<string[][]>(() =>
    chain.map(() => []),
  );
  const [activeSlot, setActiveSlot] = useState<number | null>(1);
  const [shakeSlots, setShakeSlots] = useState<Set<number>>(new Set());
  const [showSplash, setShowSplash] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Restore saved state
  useEffect(() => {
    const saved = loadState(date);
    if (saved) {
      setGuesses(saved.guesses);
      setAttempts(saved.attempts);
      setGameState(saved.gameState);
      setSlotStatuses(saved.slotStatuses);
      setRevealedLetters(saved.revealedLetters);
      setShowSplash(false);
    } else {
      // Check if user has seen instructions before
      try {
        if (localStorage.getItem("chain-reaction-seen")) {
          setShowSplash(false);
        }
      } catch {}
    }
  }, [date]);

  // Persist state
  useEffect(() => {
    if (attempts > 0 || gameState !== "playing") {
      saveState(date, { guesses, attempts, gameState, slotStatuses, revealedLetters });
    }
  }, [guesses, attempts, gameState, slotStatuses, revealedLetters, date]);

  // Focus active input
  useEffect(() => {
    if (activeSlot !== null && inputRefs.current[activeSlot]) {
      inputRefs.current[activeSlot]?.focus();
    }
  }, [activeSlot]);

  // Submit handler — validate the chain
  const handleSubmit = useCallback(() => {
    if (gameState !== "playing" || isChecking) return;

    // Check if all blanks are filled
    const blankIndices = chain
      .map((_, i) => i)
      .filter((i) => i !== 0 && i !== chain.length - 1);
    const allFilled = blankIndices.every(
      (i) => guesses[i].trim().length > 0,
    );
    if (!allFilled) return;

    setIsChecking(true);
    const newAttempts = attempts + 1;
    const newStatuses = [...slotStatuses];
    const wrongSlots = new Set<number>();

    // Check each blank slot
    for (const i of blankIndices) {
      if (newStatuses[i] === "correct") continue; // already solved
      const guess = guesses[i].trim().toLowerCase();
      const answer = chain[i].toLowerCase();
      if (guess === answer) {
        newStatuses[i] = "correct";
      } else {
        newStatuses[i] = "wrong";
        wrongSlots.add(i);
      }
    }

    const allCorrect = blankIndices.every((i) => newStatuses[i] === "correct");

    // Shake wrong slots
    if (wrongSlots.size > 0) {
      setShakeSlots(wrongSlots);
      setTimeout(() => setShakeSlots(new Set()), 600);
    }

    // Reveal hints for wrong slots after a failed attempt (if not final)
    if (!allCorrect && newAttempts < MAX_ATTEMPTS) {
      const newRevealed = [...revealedLetters.map((r) => [...r])];
      for (const i of wrongSlots) {
        const answer = chain[i].toLowerCase();
        const alreadyRevealed = newRevealed[i].length;
        if (alreadyRevealed < answer.length) {
          newRevealed[i].push(answer[alreadyRevealed]);
        }
      }
      setRevealedLetters(newRevealed);

      // Reset wrong statuses back to blank after animation
      setTimeout(() => {
        setSlotStatuses((prev) => {
          const reset = [...prev];
          for (const i of wrongSlots) {
            reset[i] = "blank";
          }
          return reset;
        });
      }, 800);
    }

    setSlotStatuses(newStatuses);
    setAttempts(newAttempts);

    if (allCorrect) {
      setGameState("won");
      saveStreak(date, true);
    } else if (newAttempts >= MAX_ATTEMPTS) {
      // Reveal all answers on loss
      const finalStatuses = [...newStatuses];
      for (const i of blankIndices) {
        if (finalStatuses[i] !== "correct") {
          finalStatuses[i] = "wrong";
        }
      }
      setSlotStatuses(finalStatuses);
      setGameState("lost");
      saveStreak(date, false);
      // Fill in correct answers for display
      setGuesses((prev) => {
        const filled = [...prev];
        for (const i of blankIndices) {
          if (filled[i].toLowerCase() !== chain[i].toLowerCase()) {
            filled[i] = chain[i];
          }
        }
        return filled;
      });
    }

    // Focus first unsolved slot
    const nextUnsolved = blankIndices.find(
      (i) => newStatuses[i] !== "correct",
    );
    if (nextUnsolved !== undefined) {
      setActiveSlot(nextUnsolved);
    }

    setTimeout(() => setIsChecking(false), 100);
  }, [
    gameState,
    isChecking,
    chain,
    guesses,
    attempts,
    slotStatuses,
    revealedLetters,
    date,
  ]);

  // Keyboard submit
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (showSplash || gameState !== "playing") return;
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showSplash, gameState, handleSubmit]);

  // Share
  const handleShare = async () => {
    const text = buildShareText(date, attempts, gameState === "won", slotStatuses);
    const ok = await shareOrCopy(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Dismiss splash
  const dismissSplash = () => {
    setShowSplash(false);
    try {
      localStorage.setItem("chain-reaction-seen", "1");
    } catch {}
  };

  // ── Splash Screen ──────────────────────────────────────────────────────
  if (showSplash) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-md animate-fade-in rounded-2xl bg-white p-8 shadow-lg dark:bg-zinc-900">
          <h1 className="mb-2 text-center text-3xl font-bold tracking-tight">
            Chain Reaction
          </h1>
          <p className="mb-6 text-center text-zinc-500 dark:text-zinc-400">
            Complete the word chain!
          </p>

          <div className="mb-6 space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
            <p>
              You'll see the <strong>first</strong> and <strong>last</strong>{" "}
              word of a chain. Fill in the missing middle words so that each
              pair of neighbors forms a <strong>compound word</strong> or common
              phrase.
            </p>
            <div className="rounded-lg bg-zinc-100 p-3 font-mono text-center text-base dark:bg-zinc-800">
              <span className="font-bold text-emerald-600">SUN</span>
              {" \u2192 "}
              <span className="text-zinc-400">???</span>
              {" \u2192 "}
              <span className="text-zinc-400">???</span>
              {" \u2192 "}
              <span className="text-zinc-400">???</span>
              {" \u2192 "}
              <span className="font-bold text-emerald-600">CHARM</span>
            </div>
            <p className="text-xs text-zinc-400">
              Answer: sun<strong>flower</strong> \u2192 flower<strong>pot</strong> \u2192 pot<strong>luck</strong> \u2192 luck charm
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>You have <strong>3 attempts</strong> to solve the chain.</li>
              <li>After each wrong guess, a hint letter is revealed.</li>
            </ul>
          </div>

          <button
            onClick={dismissSplash}
            className="w-full rounded-xl bg-[#FF6B6B] py-3 text-lg font-semibold text-white transition-transform hover:scale-[1.02] active:scale-95"
          >
            Play
          </button>
        </div>
      </div>
    );
  }

  // ── Main Game ──────────────────────────────────────────────────────────

  const stars = getStars(attempts, gameState === "won");
  const isFinished = gameState !== "playing";

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col items-center px-4 py-8 animate-fade-in">
      {/* Header */}
      <h1 className="mb-1 text-2xl font-bold tracking-tight">
        Chain Reaction
      </h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        {date} &middot; Attempt {Math.min(attempts + (isFinished ? 0 : 1), MAX_ATTEMPTS)}/{MAX_ATTEMPTS}
      </p>

      {/* Chain slots */}
      <div className="mb-8 flex w-full flex-col items-center gap-3">
        {chain.map((word, i) => {
          const isLocked = i === 0 || i === chain.length - 1;
          const status = slotStatuses[i];
          const isActive = activeSlot === i && !isFinished;
          const isShaking = shakeSlots.has(i);
          const revealed = revealedLetters[i];

          // Connector arrow
          const showArrow = i < chain.length - 1;

          return (
            <div key={i} className="flex w-full flex-col items-center">
              <div
                className={`
                  relative flex w-full max-w-xs items-center justify-center
                  rounded-xl border-2 px-4 py-3 text-lg font-semibold
                  transition-all duration-200
                  ${isShaking ? "animate-shake" : ""}
                  ${
                    isLocked
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950 dark:text-emerald-300"
                      : status === "correct"
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950 dark:text-emerald-300"
                        : status === "wrong"
                          ? "border-red-400 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-950 dark:text-red-300"
                          : isActive
                            ? "border-[#FF6B6B] bg-white shadow-md dark:bg-zinc-800"
                            : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                  }
                `}
                onClick={() => {
                  if (!isLocked && !isFinished && status !== "correct") {
                    setActiveSlot(i);
                  }
                }}
              >
                {/* Slot number badge */}
                <span className="absolute -left-3 -top-3 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                  {i + 1}
                </span>

                {isLocked || status === "correct" ? (
                  <span className="uppercase tracking-widest">
                    {isLocked ? word : guesses[i] || word}
                  </span>
                ) : isFinished ? (
                  <span className="uppercase tracking-widest opacity-70">
                    {word}
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                    {/* Show hint letters */}
                    {revealed.length > 0 && (
                      <span className="mr-1 text-amber-500 uppercase tracking-widest">
                        {revealed.join("")}
                      </span>
                    )}
                    <input
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      value={guesses[i]}
                      placeholder={
                        revealed.length > 0
                          ? `${revealed.join("")}...`
                          : "type here"
                      }
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z]/g, "");
                        setGuesses((prev) => {
                          const next = [...prev];
                          next[i] = val;
                          return next;
                        });
                      }}
                      onFocus={() => setActiveSlot(i)}
                      onKeyDown={(e) => {
                        if (e.key === "Tab") {
                          e.preventDefault();
                          // Find next blank slot
                          const blankIndices = chain
                            .map((_, idx) => idx)
                            .filter(
                              (idx) =>
                                idx !== 0 &&
                                idx !== chain.length - 1 &&
                                slotStatuses[idx] !== "correct",
                            );
                          const currentPos = blankIndices.indexOf(i);
                          const nextPos = e.shiftKey
                            ? (currentPos - 1 + blankIndices.length) % blankIndices.length
                            : (currentPos + 1) % blankIndices.length;
                          setActiveSlot(blankIndices[nextPos]);
                        }
                      }}
                      className="w-full bg-transparent text-center uppercase tracking-widest outline-none placeholder:text-zinc-300 placeholder:normal-case placeholder:tracking-normal dark:placeholder:text-zinc-600"
                      disabled={isFinished}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                )}

                {/* Compound word label between this and next slot */}
                {status === "correct" && i > 0 && slotStatuses[i - 1] === "correct" || (status === "correct" && i > 0 && (i - 1 === 0)) ? (
                  <span className="absolute -top-2 right-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400">
                    {chain[i - 1].toLowerCase()}{chain[i].toLowerCase()}
                  </span>
                ) : null}
              </div>

              {/* Arrow connector */}
              {showArrow && (
                <div className="my-1 text-zinc-300 dark:text-zinc-600">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="mx-auto"
                  >
                    <path
                      d="M8 2v10m0 0l-3-3m3 3l3-3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit / Result */}
      {!isFinished ? (
        <button
          onClick={handleSubmit}
          disabled={isChecking}
          className="w-full max-w-xs rounded-xl bg-[#FF6B6B] py-3 text-lg font-semibold text-white transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        >
          Check Chain
        </button>
      ) : (
        <div className="flex w-full max-w-xs flex-col items-center gap-4">
          {/* Result */}
          <div
            className={`w-full rounded-xl p-4 text-center ${
              gameState === "won"
                ? "bg-emerald-50 dark:bg-emerald-950"
                : "bg-red-50 dark:bg-red-950"
            }`}
          >
            {gameState === "won" ? (
              <>
                <p className="text-2xl mb-1">
                  {"\u2B50".repeat(stars)}
                </p>
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                  Solved in {attempts} {attempts === 1 ? "attempt" : "attempts"}!
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl mb-1">{"\uD83D\uDE14"}</p>
                <p className="font-semibold text-red-700 dark:text-red-300">
                  Not this time — the chain is revealed above.
                </p>
              </>
            )}
          </div>

          {/* Share */}
          <button
            onClick={handleShare}
            className="w-full rounded-xl border-2 border-zinc-200 py-3 text-lg font-semibold transition-transform hover:scale-[1.02] active:scale-95 dark:border-zinc-700"
          >
            {copied ? "Copied!" : "Share Result"}
          </button>
        </div>
      )}

      {/* Compound word guide (shown after game) */}
      {isFinished && (
        <div className="mt-6 w-full max-w-xs">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            The Compounds
          </p>
          <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            {chain.slice(0, -1).map((word, i) => (
              <p key={i}>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {word.toLowerCase()}
                </span>
                <span className="font-medium text-emerald-600">
                  {chain[i + 1].toLowerCase()}
                </span>
              </p>
            ))}
          </div>
        </div>
      )}
      {/* Inline animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes chain-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: chain-shake 0.4s ease-in-out;
        }
        @keyframes chain-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: chain-fade-in 0.3s ease-out;
        }
      `,
        }}
      />
    </div>
  );
}
