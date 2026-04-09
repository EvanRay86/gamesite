"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { VocabVaultPuzzle } from "@/types/vocab-vault";
import { shareOrCopy } from "@/lib/share";
import { useGameStats } from "@/hooks/useGameStats";
import StatsModal from "@/components/StatsModal";
import StatsButton from "@/components/StatsButton";
import XShareButton from "@/components/XShareButton";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_ROUNDS = 5;
const MAX_ATTEMPTS = 3;
const MAX_SCORE = 15; // 5 words x 3 pts max
const POINTS = [3, 2, 1]; // points per attempt #

type Screen = "splash" | "playing" | "results";

interface RoundResult {
  word: string;
  correct: boolean;
  attemptsUsed: number; // 1-3 if correct, 3 if failed
}

interface SavedState {
  screen: Screen;
  currentRound: number;
  attempt: number;
  results: RoundResult[];
  score: number;
}

// ---------------------------------------------------------------------------
// Local-storage helpers
// ---------------------------------------------------------------------------

function stateKey(date: string): string {
  return `vocab-vault-${date}`;
}

function loadSavedState(date: string): SavedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(stateKey(date));
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return null;
}

function persistState(date: string, state: SavedState) {
  try {
    localStorage.setItem(stateKey(date), JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function saveStats(date: string, score: number, results: RoundResult[]) {
  try {
    const key = "vocab-vault-stats";
    const prev = JSON.parse(localStorage.getItem(key) || "{}");
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);
    const streak =
      prev.lastDate === yStr ? (prev.streak || 0) + 1 : prev.lastDate === date ? prev.streak || 1 : 1;
    localStorage.setItem(
      key,
      JSON.stringify({
        lastDate: date,
        streak,
        maxStreak: Math.max(streak, prev.maxStreak || 0),
        totalGames: (prev.totalGames || 0) + 1,
        totalScore: (prev.totalScore || 0) + score,
      })
    );
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Hint builder
// ---------------------------------------------------------------------------

function getHint(word: string, attempt: number): string {
  if (attempt <= 1) return "";
  const lower = word.toLowerCase();
  if (attempt === 2) return `Starts with "${lower[0].toUpperCase()}"`;
  return `Starts with "${lower[0].toUpperCase()}", ends with "${lower[lower.length - 1]}"`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Props = { puzzle: VocabVaultPuzzle };

export default function VocabVaultGame({ puzzle }: Props) {
  const words = puzzle.words.slice(0, TOTAL_ROUNDS);
  const date = puzzle.puzzle_date;

  // -- State ---------------------------------------------------------------
  const [screen, setScreen] = useState<Screen>("splash");
  const [currentRound, setCurrentRound] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [guess, setGuess] = useState("");
  const [results, setResults] = useState<RoundResult[]>([]);
  const [score, setScore] = useState(0);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [hintText, setHintText] = useState("");
  const [shared, setShared] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [showStats, setShowStats] = useState(false);
  const { stats, recordGame } = useGameStats("vocab-vault", date);

  const inputRef = useRef<HTMLInputElement>(null);

  // -- Restore saved state on mount ----------------------------------------
  useEffect(() => {
    const saved = loadSavedState(date);
    if (saved) {
      setScreen(saved.screen);
      setCurrentRound(saved.currentRound);
      setAttempt(saved.attempt);
      setResults(saved.results);
      setScore(saved.score);
      if (saved.screen === "playing" && saved.attempt > 1) {
        setHintText(getHint(words[saved.currentRound]?.word ?? "", saved.attempt));
      }
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- Persist state on every meaningful change ----------------------------
  useEffect(() => {
    if (!loaded) return;
    persistState(date, { screen, currentRound, attempt, results, score });
  }, [loaded, date, screen, currentRound, attempt, results, score]);

  // -- Record stats when results screen shown ------------------------------
  useEffect(() => {
    if (screen === "results" && loaded) {
      const perfect = score === MAX_SCORE;
      recordGame(perfect, score);
      saveStats(date, score, results);
      setTimeout(() => setShowStats(true), 800);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // -- Auto-focus input on round / screen change ---------------------------
  useEffect(() => {
    if (screen === "playing") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [screen, currentRound]);

  // -- Current word --------------------------------------------------------
  const currentWord = words[currentRound];

  // -- Advance to next round or results ------------------------------------
  const advance = useCallback(
    (newResults: RoundResult[], newScore: number) => {
      if (currentRound + 1 >= words.length) {
        setResults(newResults);
        setScore(newScore);
        setScreen("results");
      } else {
        setResults(newResults);
        setScore(newScore);
        setCurrentRound((r) => r + 1);
        setAttempt(1);
        setGuess("");
        setHintText("");
        setFlash(null);
      }
    },
    [currentRound, words.length]
  );

  // -- Handle guess submission ---------------------------------------------
  const handleSubmit = useCallback(() => {
    if (!currentWord || guess.trim().length === 0) return;

    const isCorrect =
      guess.trim().toLowerCase() === currentWord.word.toLowerCase();

    if (isCorrect) {
      // Correct answer
      const pts = POINTS[attempt - 1] ?? 0;
      const newScore = score + pts;
      const result: RoundResult = {
        word: currentWord.word,
        correct: true,
        attemptsUsed: attempt,
      };
      const newResults = [...results, result];

      setFlash("correct");
      setScore(newScore);
      setTimeout(() => {
        setFlash(null);
        advance(newResults, newScore);
      }, 700);
    } else {
      // Wrong answer
      setShake(true);
      setTimeout(() => setShake(false), 500);

      if (attempt >= MAX_ATTEMPTS) {
        // All attempts used
        const result: RoundResult = {
          word: currentWord.word,
          correct: false,
          attemptsUsed: MAX_ATTEMPTS,
        };
        const newResults = [...results, result];

        setFlash("wrong");
        setTimeout(() => {
          setFlash(null);
          advance(newResults, score);
        }, 1200);
      } else {
        // Reveal hint and give another attempt
        const nextAttempt = attempt + 1;
        setAttempt(nextAttempt);
        setHintText(getHint(currentWord.word, nextAttempt));
        setGuess("");
      }
    }
  }, [guess, currentWord, attempt, score, results, advance]);

  // -- Key handler ---------------------------------------------------------
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // -- Share ---------------------------------------------------------------
  const getShareText = useCallback(() => {
    const emojis = results
      .map((r) => {
        if (!r.correct) return "\u{1F7E5}"; // red square
        if (r.attemptsUsed === 1) return "\u{1F7E9}"; // green square
        return "\u{1F7E8}"; // yellow square
      })
      .join("");
    return `Vocab Vault \u{1F9E0} ${score}/${MAX_SCORE}\n${emojis}\ngamesite.app/daily/vocab-vault`;
  }, [results, score]);

  const handleShare = async () => {
    const ok = await shareOrCopy(getShareText());
    if (ok) {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  // -- Don't render until saved state is loaded ----------------------------
  if (!loaded) return null;

  // -- Mask the word in example sentence -----------------------------------
  const maskedExample = currentWord
    ? currentWord.example.replace(
        new RegExp(currentWord.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
        "______"
      )
    : "";

  // ========================================================================
  // Splash Screen
  // ========================================================================
  if (screen === "splash") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-[420px] text-center">
          <div className="text-5xl mb-4">{"\u{1F9E0}"}</div>
          <h1 className="font-display text-4xl text-text-primary mb-2">
            Vocab Vault
          </h1>
          <p className="text-text-muted text-sm mb-2">
            Guess the word from its definition and example sentence.
          </p>
          <p className="text-text-dim text-xs mb-8">
            5 words &middot; 3 attempts each &middot; hints unlock as you go
          </p>
          <button
            onClick={() => setScreen("playing")}
            className="rounded-full bg-purple px-8 py-3 text-lg font-bold text-white shadow-md hover:shadow-lg hover:bg-purple/90 active:scale-95 transition-all"
          >
            Play
          </button>
          <StatsButton onClick={() => setShowStats(true)} />
          <StatsModal
            open={showStats}
            onClose={() => setShowStats(false)}
            stats={stats}
            gameName="Vocab Vault"
            color="purple"
            maxGuesses={MAX_SCORE}
          />
        </div>
      </div>
    );
  }

  // ========================================================================
  // Results Screen
  // ========================================================================
  if (screen === "results") {
    const perfect = score === MAX_SCORE;
    const good = score >= 10;

    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-[480px]">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-6 sm:p-8 text-center">
            <div className="text-4xl mb-2">
              {perfect ? "\u{1F3C6}" : good ? "\u{1F389}" : "\u{1F4DA}"}
            </div>
            <h2 className="font-display text-3xl text-text-primary mb-1">
              {perfect ? "Perfect!" : good ? "Nice Work!" : "Keep Learning!"}
            </h2>
            <p className="text-text-muted text-lg mb-6">
              <span className="font-bold text-purple">{score}</span> / {MAX_SCORE} points
            </p>

            {/* Per-word breakdown */}
            <div className="space-y-2 mb-6 text-left">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 ${r.correct ? "bg-green-50 dark:bg-green-950/30" : "bg-red-50 dark:bg-red-950/30"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{r.correct ? "\u2705" : "\u274C"}</span>
                    <div>
                      <p className="font-semibold text-sm text-text-primary capitalize">
                        {r.word}
                      </p>
                      <p className="text-xs text-text-dim">
                        {r.correct
                          ? `${r.attemptsUsed} attempt${r.attemptsUsed > 1 ? "s" : ""} \u2014 ${POINTS[r.attemptsUsed - 1]}pt${POINTS[r.attemptsUsed - 1] > 1 ? "s" : ""}`
                          : "Not guessed"}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg">
                    {r.correct
                      ? r.attemptsUsed === 1
                        ? "\u{1F7E9}"
                        : "\u{1F7E8}"
                      : "\u{1F7E5}"}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={handleShare}
                className={`rounded-full px-6 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg active:scale-95 transition-all ${shared ? "bg-green-500 text-white" : "bg-purple text-white hover:bg-purple/90"}`}
              >
                {shared ? "Copied!" : "Share Results"}
              </button>
              <XShareButton getText={getShareText} />
            </div>

            <button
              onClick={() => setShowStats(true)}
              className="bg-surface text-text-muted border-[1.5px] border-zinc-200 dark:border-zinc-700 rounded-full px-8 py-3 text-base font-bold cursor-pointer transition-all hover:bg-surface-hover hover:text-text-secondary mt-4"
            >
              View Stats
            </button>
            <StatsModal
              open={showStats}
              onClose={() => setShowStats(false)}
              stats={stats}
              gameName="Vocab Vault"
              color="purple"
              maxGuesses={MAX_SCORE}
            />
          </div>
        </div>
      </div>
    );
  }

  // ========================================================================
  // Playing Screen
  // ========================================================================
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-[480px]">
        {/* Progress indicators */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-text-muted">
            Word {currentRound + 1} of {words.length}
          </span>
          <div className="flex gap-1.5">
            {words.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-6 rounded-full transition-colors ${i < currentRound ? (results[i]?.correct ? "bg-green-500" : "bg-red-400") : i === currentRound ? "bg-purple" : "bg-zinc-200 dark:bg-zinc-700"}`}
              />
            ))}
          </div>
        </div>

        {/* Main card */}
        <div
          className={`bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-6 sm:p-8 transition-colors duration-300 ${flash === "correct" ? "!border-green-400 !bg-green-50 dark:!bg-green-950/30" : ""} ${flash === "wrong" ? "!border-red-400 !bg-red-50 dark:!bg-red-950/30" : ""}`}
        >
          {/* Attempt dots */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-text-dim uppercase tracking-wider">
              Attempt {attempt} of {MAX_ATTEMPTS}
            </span>
            <div className="flex gap-1.5">
              {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${i < attempt - 1 ? "bg-red-400" : i === attempt - 1 ? "bg-purple" : "bg-zinc-200 dark:bg-zinc-700"}`}
                />
              ))}
            </div>
          </div>

          {/* Definition */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-purple uppercase tracking-wider mb-1">
              Definition
            </p>
            <p className="text-sm text-text-primary leading-relaxed">
              {currentWord.definition}
            </p>
          </div>

          {/* Example sentence */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-purple uppercase tracking-wider mb-1">
              Example
            </p>
            <p className="text-sm text-text-muted italic leading-relaxed">
              &ldquo;{maskedExample}&rdquo;
            </p>
          </div>

          {/* Hint (shown on attempt 2+) */}
          {hintText && (
            <div className="mb-4 rounded-lg bg-purple/5 dark:bg-purple/10 border border-purple/20 px-3 py-2">
              <p className="text-xs text-purple font-medium">
                {"\u{1F4A1}"} Hint: {hintText}
              </p>
            </div>
          )}

          {/* Reveal answer on wrong flash */}
          {flash === "wrong" && (
            <div className="mb-4 text-center">
              <p className="text-sm text-red-500 font-semibold">
                The answer was:{" "}
                <span className="capitalize">{currentWord.word}</span>
              </p>
            </div>
          )}

          {/* Input */}
          {!flash && (
            <div className="space-y-3">
              <input
                ref={inputRef}
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your guess..."
                className={`w-full rounded-lg border-2 px-4 py-3 text-sm bg-white dark:bg-zinc-800 text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent transition-all ${shake ? "border-red-400 animate-[shake_0.4s_ease-in-out]" : "border-zinc-200 dark:border-zinc-700"}`}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
              />
              <button
                onClick={handleSubmit}
                disabled={guess.trim().length === 0}
                className="w-full rounded-full bg-purple px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:bg-purple/90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Submit Guess
              </button>
            </div>
          )}
        </div>

        {/* Score tally */}
        <div className="text-center mt-3">
          <span className="text-sm text-text-dim">
            Score: <span className="font-bold text-purple">{score}</span> / {MAX_SCORE}
          </span>
        </div>
      </div>

      {/* Shake keyframes (injected once) */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
