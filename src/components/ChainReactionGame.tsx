"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
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

interface StatsData {
  streak: number;
  maxStreak: number;
  lastDate: string;
  gamesPlayed: number;
  gamesWon: number;
  totalStars: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_CHANCES = 5;
const STORAGE_PREFIX = "chain-reaction-";
const STATS_KEY = "chain-reaction-stats";

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

// Stats management (replaces old streak-only system)
function loadStats(): StatsData {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw);
    // Migrate from old streak-only key
    const oldRaw = localStorage.getItem("chain-reaction-streak");
    if (oldRaw) {
      const old = JSON.parse(oldRaw);
      return {
        streak: old.current || 0,
        maxStreak: old.max || 0,
        lastDate: old.lastDate || "",
        gamesPlayed: 0,
        gamesWon: 0,
        totalStars: 0,
      };
    }
  } catch {}
  return { streak: 0, maxStreak: 0, lastDate: "", gamesPlayed: 0, gamesWon: 0, totalStars: 0 };
}

function saveStats(date: string, won: boolean, earnedStars: number): StatsData {
  const stats = loadStats();
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (won) {
    if (stats.lastDate === yesterdayStr) {
      stats.streak += 1;
    } else if (stats.lastDate !== date) {
      stats.streak = 1;
    }
    stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
    stats.gamesWon += 1;
    stats.totalStars += earnedStars;
  } else {
    stats.streak = 0;
  }

  stats.lastDate = date;
  stats.gamesPlayed += 1;

  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    // Also keep old key in sync for backwards compat
    localStorage.setItem("chain-reaction-streak", JSON.stringify({
      current: stats.streak,
      max: stats.maxStreak,
      lastDate: stats.lastDate,
    }));
  } catch {}

  return stats;
}

function getStars(wrongGuesses: number, won: boolean): number {
  if (!won) return 0;
  if (wrongGuesses === 0) return 3;
  if (wrongGuesses <= 2) return 2;
  return 1; // 3-4 wrong
}

function buildShareText(
  date: string,
  wrongGuesses: number,
  won: boolean,
  slotStatuses: SlotStatus[],
): string {
  const stars = getStars(wrongGuesses, won);
  const starStr = won ? "\u2B50".repeat(stars) : "\u274C";
  const remaining = MAX_CHANCES - wrongGuesses;
  const chainEmoji = slotStatuses
    .map((s) => {
      if (s === "locked" || s === "correct") return "\uD83D\uDFE2"; // green
      if (s === "wrong") return "\uD83D\uDD34"; // red
      return "\u26AA"; // white for blank (shouldn't happen at end)
    })
    .join("");

  return `Chain Reaction \u26D3\uFE0F ${date}\n${starStr} ${won ? `${remaining}/${MAX_CHANCES} remaining` : "0 chances left"}\n${chainEmoji}\ngamesite.app/daily/chain-reaction`;
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
  const [stats, setStats] = useState<StatsData | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load stats on mount
  useEffect(() => {
    setStats(loadStats());
  }, []);

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
    const hasProgress = attempts > 0 || gameState !== "playing" || slotStatuses.some((s) => s === "correct");
    if (hasProgress) {
      saveState(date, { guesses, attempts, gameState, slotStatuses, revealedLetters });
    }
  }, [guesses, attempts, gameState, slotStatuses, revealedLetters, date]);

  // Focus active input
  useEffect(() => {
    if (activeSlot !== null && inputRefs.current[activeSlot]) {
      inputRefs.current[activeSlot]?.focus();
    }
  }, [activeSlot]);

  // Helper: all blank slot indices
  const blankIndices = chain
    .map((_, i) => i)
    .filter((i) => i !== 0 && i !== chain.length - 1);

  // Check a single slot — called when user presses Enter on an input
  const handleCheckSlot = useCallback(
    (slotIndex: number) => {
      if (gameState !== "playing" || isChecking) return;
      const guess = guesses[slotIndex].trim().toLowerCase();
      if (!guess) return;
      if (slotStatuses[slotIndex] === "correct") return;

      setIsChecking(true);
      const newStatuses = [...slotStatuses];

      if (guess === chain[slotIndex].toLowerCase()) {
        newStatuses[slotIndex] = "correct";

        const allCorrect = blankIndices.every(
          (i) => newStatuses[i] === "correct",
        );
        setSlotStatuses(newStatuses);
        if (allCorrect) {
          setGameState("won");
          const earnedStars = getStars(attempts, true);
          const newStats = saveStats(date, true, earnedStars);
          setStats(newStats);
        } else {
          // Move to next unsolved slot
          const nextUnsolved = blankIndices.find(
            (i) => newStatuses[i] !== "correct" && i !== slotIndex,
          );
          if (nextUnsolved !== undefined) {
            setActiveSlot(nextUnsolved);
          }
        }
      } else {
        const newWrong = attempts + 1;
        setAttempts(newWrong);

        newStatuses[slotIndex] = "wrong";
        setSlotStatuses(newStatuses);

        // Shake it
        setShakeSlots(new Set([slotIndex]));
        setTimeout(() => setShakeSlots(new Set()), 600);

        // Reveal a hint letter
        const newRevealed = [...revealedLetters.map((r) => [...r])];
        const answer = chain[slotIndex].toLowerCase();
        const alreadyRevealed = newRevealed[slotIndex].length;
        if (alreadyRevealed < answer.length) {
          newRevealed[slotIndex].push(answer[alreadyRevealed]);
        }
        setRevealedLetters(newRevealed);

        if (newWrong >= MAX_CHANCES) {
          // Game over — reveal all remaining words
          const finalStatuses = [...newStatuses];
          for (const i of blankIndices) {
            if (finalStatuses[i] !== "correct") {
              finalStatuses[i] = "wrong";
            }
          }
          setSlotStatuses(finalStatuses);
          setGameState("lost");
          const newStats = saveStats(date, false, 0);
          setStats(newStats);
          setGuesses((prev) => {
            const filled = [...prev];
            for (const i of blankIndices) {
              if (filled[i].toLowerCase() !== chain[i].toLowerCase()) {
                filled[i] = chain[i];
              }
            }
            return filled;
          });
        } else {
          // Reset wrong status back to blank after animation
          setTimeout(() => {
            setSlotStatuses((prev) => {
              const reset = [...prev];
              reset[slotIndex] = "blank";
              return reset;
            });
          }, 800);
        }
      }

      setTimeout(() => setIsChecking(false), 100);
    },
    [
      gameState,
      isChecking,
      chain,
      guesses,
      attempts,
      slotStatuses,
      revealedLetters,
      blankIndices,
      date,
    ],
  );

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
              Answer: sun<strong>flower</strong> {"\u2192"} flower<strong>pot</strong> {"\u2192"} pot<strong>luck</strong> {"\u2192"} luck charm
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Press <strong>Enter</strong> to check a word.</li>
              <li>You have <strong>5 chances</strong> — each wrong guess costs one.</li>
              <li>A hint letter is revealed after each wrong guess.</li>
            </ul>
          </div>

          <button
            onClick={dismissSplash}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-lg font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/30 active:scale-95"
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
  const streakCount = stats?.streak ?? 0;

  return (
    <div
      className="mx-auto flex min-h-[80vh] max-w-lg flex-col items-center px-4 py-8 animate-fade-in"
      style={{
        background: "linear-gradient(180deg, #f0fdf4 0%, #fefce8 40%, #fffbeb 100%)",
      }}
    >
      {/* Header */}
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-zinc-800">
        <span className="mr-1.5">&#x26D3;&#xFE0F;</span>
        Chain Reaction
      </h1>
      <p className="mb-2 text-sm text-zinc-500">
        {date} &middot; {isFinished
          ? (gameState === "won"
            ? `${MAX_CHANCES - attempts}/${MAX_CHANCES} chances left`
            : "0 chances left")
          : `${MAX_CHANCES - attempts} chance${MAX_CHANCES - attempts === 1 ? "" : "s"} remaining`}
      </p>

      {/* Streak badge (during gameplay) */}
      {streakCount > 0 && !isFinished && (
        <div className="flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold dark:bg-amber-900/30 dark:text-amber-400">
          &#x1F525; {streakCount} day streak
        </div>
      )}
      {streakCount === 0 && !isFinished && <div className="mb-4" />}

      {/* Chain slots */}
      <div className="mb-8 flex w-full flex-col items-center gap-2">
        {chain.map((word, i) => {
          const isLocked = i === 0 || i === chain.length - 1;
          const status = slotStatuses[i];
          const isActive = activeSlot === i && !isFinished;
          const isShaking = shakeSlots.has(i);
          const revealed = revealedLetters[i];
          const showArrow = i < chain.length - 1;
          const prevCorrect = i > 0 && (slotStatuses[i - 1] === "correct" || slotStatuses[i - 1] === "locked");
          const thisCorrect = status === "correct" || isLocked;

          return (
            <div key={i} className="flex w-full flex-col items-center">
              <div
                className={`
                  relative flex w-full max-w-xs items-center justify-center
                  rounded-2xl border-2 px-5 py-4 text-lg font-semibold
                  transition-all duration-200
                  ${isShaking ? "animate-shake" : ""}
                  ${
                    isLocked
                      ? "border-emerald-400 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 shadow-sm dark:border-emerald-600 dark:from-emerald-950 dark:to-emerald-900 dark:text-emerald-300"
                      : status === "correct"
                        ? "border-emerald-400 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 shadow-sm dark:border-emerald-600 dark:from-emerald-950 dark:to-emerald-900 dark:text-emerald-300"
                        : status === "wrong"
                          ? "border-red-400 bg-red-50 text-red-700 shadow-sm dark:border-red-600 dark:bg-red-950 dark:text-red-300"
                          : isActive
                            ? "border-emerald-400 bg-white shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-200 dark:bg-zinc-800 dark:ring-emerald-800"
                            : "border-zinc-200/80 bg-white/80 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80"
                  }
                `}
                onClick={() => {
                  if (!isLocked && !isFinished && status !== "correct") {
                    setActiveSlot(i);
                  }
                }}
              >
                {/* Slot number badge */}
                <span className={`absolute -left-3 -top-3 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shadow-sm ${
                  thisCorrect
                    ? "bg-emerald-500 text-white"
                    : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                }`}>
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
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (guesses[i].trim().length > 0) {
                            handleCheckSlot(i);
                          }
                          return;
                        }
                        if (e.key === "Tab") {
                          e.preventDefault();
                          const openSlots = blankIndices.filter(
                            (idx) => slotStatuses[idx] !== "correct",
                          );
                          const currentPos = openSlots.indexOf(i);
                          const nextPos = e.shiftKey
                            ? (currentPos - 1 + openSlots.length) % openSlots.length
                            : (currentPos + 1) % openSlots.length;
                          setActiveSlot(openSlots[nextPos]);
                        }
                      }}
                      className="w-full bg-transparent text-center uppercase tracking-widest outline-none placeholder:text-zinc-300 placeholder:normal-case placeholder:tracking-normal dark:placeholder:text-zinc-600"
                      disabled={isFinished}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                )}

                {/* Compound word label */}
                {(status === "correct" || isLocked) && i > 0 && prevCorrect ? (
                  <span className="absolute -top-2.5 right-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                    {chain[i - 1].toLowerCase()}{chain[i].toLowerCase()}
                  </span>
                ) : null}
              </div>

              {/* Arrow connector */}
              {showArrow && (
                <div className={`my-0.5 transition-colors duration-300 ${
                  thisCorrect && (i + 1 < chain.length && (slotStatuses[i + 1] === "correct" || slotStatuses[i + 1] === "locked"))
                    ? "text-emerald-400"
                    : "text-zinc-300 dark:text-zinc-600"
                }`}>
                  <svg
                    width="20"
                    height="20"
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

      {/* Result */}
      {isFinished && (
        <div className="flex w-full max-w-xs flex-col items-center gap-4">
          {/* Result */}
          <div
            className={`w-full rounded-2xl border-2 p-5 text-center ${
              gameState === "won"
                ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:border-emerald-800 dark:from-emerald-950 dark:to-teal-950"
                : "border-red-200 bg-gradient-to-br from-red-50 to-orange-50 dark:border-red-800 dark:from-red-950 dark:to-orange-950"
            }`}
          >
            {gameState === "won" ? (
              <>
                {/* Animated stars */}
                <div className="flex justify-center gap-1 mb-2">
                  {Array.from({ length: stars }).map((_, i) => (
                    <span
                      key={i}
                      className="inline-block text-3xl"
                      style={{
                        animation: `starPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 200}ms both`,
                      }}
                    >
                      {"\u2B50"}
                    </span>
                  ))}
                </div>
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                  {attempts === 0 ? "Perfect — no wrong guesses!" : `Solved with ${MAX_CHANCES - attempts} chance${MAX_CHANCES - attempts === 1 ? "" : "s"} remaining!`}
                </p>
                {/* Stats line */}
                {stats && streakCount > 0 && (
                  <p className="mt-1 text-sm text-emerald-600/80 dark:text-emerald-400/80">
                    &#x1F525; {streakCount} day streak &middot; &#x2B50; {stats.totalStars} total stars
                  </p>
                )}
                {stats && streakCount === 0 && (
                  <p className="mt-1 text-sm text-emerald-600/80 dark:text-emerald-400/80">
                    &#x2B50; {stats.totalStars} total stars
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-3xl mb-2">{"\uD83D\uDE14"}</p>
                <p className="font-semibold text-red-700 dark:text-red-300">
                  Not this time — the chain is revealed above.
                </p>
                {stats && stats.gamesPlayed > 1 && (
                  <p className="mt-1 text-sm text-red-600/70 dark:text-red-400/70">
                    {stats.gamesWon}/{stats.gamesPlayed} games won &middot; Best streak: {stats.maxStreak}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Share */}
          <button
            onClick={handleShare}
            className="w-full rounded-2xl border-2 border-emerald-200 bg-white py-3.5 text-lg font-semibold text-emerald-700 shadow-sm transition-all hover:scale-[1.02] hover:bg-emerald-50 hover:shadow-md active:scale-95 dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-300 dark:hover:bg-emerald-950"
          >
            {copied ? "Copied!" : "Share Result"}
          </button>

          {/* Past puzzles link — centered, inline */}
          <Link
            href="/daily/chain-reaction/archive"
            className="rounded-full border border-zinc-200 bg-white/80 px-5 py-2 text-sm font-medium text-zinc-500 no-underline transition-all hover:bg-white hover:text-zinc-700 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            Past puzzles
          </Link>
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

      {/* Star pop animation */}
      <style jsx>{`
        @keyframes starPop {
          0% {
            opacity: 0;
            transform: scale(0) rotate(-20deg);
          }
          60% {
            opacity: 1;
            transform: scale(1.3) rotate(5deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
}
