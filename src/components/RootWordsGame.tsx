"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { RootWordsPuzzle } from "@/types/root-words";
import { isValidEnglishWord } from "@/lib/dictionary";
import { shareOrCopy } from "@/lib/share";
import XShareButton from "@/components/XShareButton";

const GAME_DURATION = 90; // seconds

type Screen = "splash" | "playing" | "results";

function getStorageKey(date: string) {
  return `root-words-${date}`;
}

function getPoints(word: string): number {
  if (word.length >= 8) return 3;
  if (word.length >= 6) return 2;
  return 1;
}

interface SavedState {
  foundWords: string[];
  score: number;
  completed: boolean;
}

export default function RootWordsGame({ puzzle }: { puzzle: RootWordsPuzzle }) {
  const [screen, setScreen] = useState<Screen>("splash");
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [guess, setGuess] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [lastAdded, setLastAdded] = useState("");
  const [shared, setShared] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Restore saved state on mount ──────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(getStorageKey(puzzle.puzzle_date));
      if (raw) {
        const saved: SavedState = JSON.parse(raw);
        setFoundWords(saved.foundWords);
        setScore(saved.score);
        if (saved.completed) {
          setTimeLeft(0);
          setScreen("results");
        }
      }
    } catch {
      // ignore corrupt data
    }
  }, [puzzle.puzzle_date]);

  // ── Persist state ─────────────────────────────────────────
  const saveState = useCallback(
    (words: string[], pts: number, completed: boolean) => {
      try {
        const data: SavedState = {
          foundWords: words,
          score: pts,
          completed,
        };
        localStorage.setItem(
          getStorageKey(puzzle.puzzle_date),
          JSON.stringify(data)
        );
      } catch {
        // storage full, ignore
      }
    },
    [puzzle.puzzle_date]
  );

  // ── Timer ─────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== "playing") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen]);

  // ── End game when timer reaches 0 ────────────────────────
  useEffect(() => {
    if (screen === "playing" && timeLeft === 0) {
      saveState(foundWords, score, true);
      setScreen("results");
    }
  }, [timeLeft, screen, foundWords, score, saveState]);

  // ── Auto-focus input ──────────────────────────────────────
  useEffect(() => {
    if (screen === "playing") {
      inputRef.current?.focus();
    }
  }, [screen]);

  // ── Clear error after delay ───────────────────────────────
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 1500);
    return () => clearTimeout(t);
  }, [error]);

  // ── Clear lastAdded animation ─────────────────────────────
  useEffect(() => {
    if (!lastAdded) return;
    const t = setTimeout(() => setLastAdded(""), 600);
    return () => clearTimeout(t);
  }, [lastAdded]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = useCallback(() => {
    const word = guess.trim().toLowerCase();
    setGuess("");

    if (!word) return;

    // Must be 4+ letters
    if (word.length < 4) {
      setError("Word must be at least 4 letters");
      triggerShake();
      return;
    }

    // Must contain the root
    if (!word.includes(puzzle.root.toLowerCase())) {
      setError(`Word must contain "${puzzle.root.toUpperCase()}"`);
      triggerShake();
      return;
    }

    // Must not be already found
    if (foundWords.includes(word)) {
      setError("Already found!");
      triggerShake();
      return;
    }

    // Must be a valid English word
    if (!isValidEnglishWord(word)) {
      setError("Not a valid word");
      triggerShake();
      return;
    }

    const pts = getPoints(word);
    const newWords = [...foundWords, word];
    const newScore = score + pts;

    setFoundWords(newWords);
    setScore(newScore);
    setLastAdded(word);
    setError("");
    saveState(newWords, newScore, false);
  }, [guess, puzzle.root, foundWords, score, saveState]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const startGame = () => {
    setScreen("playing");
    setTimeLeft(GAME_DURATION);
    setFoundWords([]);
    setScore(0);
  };

  // ── Timer bar color ───────────────────────────────────────
  const timerPercent = (timeLeft / GAME_DURATION) * 100;
  const timerColor =
    timerPercent > 50
      ? "bg-green-500"
      : timerPercent > 25
        ? "bg-yellow-500"
        : "bg-red-500";

  const shareText = `Root Words \u{1F331} ${puzzle.root.toUpperCase()} (${puzzle.meaning})\nFound ${foundWords.length} words \u00B7 ${score} points\ngamesite.app/daily/root-words`;

  // ── Splash Screen ─────────────────────────────────────────
  if (screen === "splash") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Root Words
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 text-center max-w-md">
          Find as many English words as possible that contain the given
          Latin/Greek root. You have 90 seconds!
        </p>
        <button
          onClick={startGame}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-lg px-8 py-3 rounded-lg transition-colors"
        >
          Play
        </button>
      </div>
    );
  }

  // ── Results Screen ────────────────────────────────────────
  if (screen === "results") {
    return (
      <div className="flex flex-col items-center gap-6 px-4 py-8 max-w-lg mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Time&apos;s Up!
        </h2>

        <div className="bg-teal-50 dark:bg-teal-900/30 rounded-xl p-6 w-full text-center">
          <p className="text-sm uppercase tracking-wide text-teal-700 dark:text-teal-300 mb-1">
            Root
          </p>
          <p className="text-3xl font-bold text-teal-800 dark:text-teal-200">
            {puzzle.root.toUpperCase()}
          </p>
          <p className="text-sm text-teal-600 dark:text-teal-400 mt-1">
            meaning: {puzzle.meaning}
          </p>
        </div>

        <div className="flex gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {score}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Points</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {foundWords.length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Words Found
            </p>
          </div>
        </div>

        {foundWords.length > 0 && (
          <div className="w-full">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Your words:
            </p>
            <div className="flex flex-wrap gap-2">
              {foundWords.map((w) => (
                <span
                  key={w}
                  className="bg-teal-100 dark:bg-teal-800/50 text-teal-800 dark:text-teal-200 text-sm px-3 py-1 rounded-full"
                >
                  {w}{" "}
                  <span className="text-teal-500 dark:text-teal-400 text-xs">
                    +{getPoints(w)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-2">
          <button
            onClick={async () => {
              await shareOrCopy(shareText);
              setShared(true);
              setTimeout(() => setShared(false), 2000);
            }}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            {shared ? "Copied!" : "Share"}
          </button>
          <XShareButton getText={() => shareText} />
        </div>
      </div>
    );
  }

  // ── Playing Screen ────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 px-4 py-4 max-w-lg mx-auto">
      {/* Timer bar */}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${timerColor} rounded-full transition-all duration-1000 ease-linear`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
        {timeLeft}s remaining
      </p>

      {/* Root card */}
      <div className="bg-teal-50 dark:bg-teal-900/30 rounded-xl p-6 text-center">
        <p className="text-3xl font-bold text-teal-800 dark:text-teal-200 tracking-wide">
          {puzzle.root.toUpperCase()}
        </p>
        <p className="text-sm text-teal-600 dark:text-teal-400 mt-2">
          meaning: {puzzle.meaning}
        </p>
        <p className="text-xs text-teal-500 dark:text-teal-500 mt-1">
          {puzzle.origin}
        </p>
      </div>

      {/* Score */}
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 px-1">
        <span>
          Words: <strong>{foundWords.length}</strong>
        </span>
        <span>
          Score: <strong>{score}</strong>
        </span>
      </div>

      {/* Found words */}
      <div className="min-h-[80px] flex flex-wrap gap-2 content-start">
        {foundWords.map((w) => (
          <span
            key={w}
            className={`text-sm px-3 py-1 rounded-full transition-all ${w === lastAdded ? "bg-green-200 dark:bg-green-700 text-green-900 dark:text-green-100 scale-110" : "bg-teal-100 dark:bg-teal-800/50 text-teal-800 dark:text-teal-200"}`}
          >
            {w}{" "}
            <span className="text-xs opacity-60">+{getPoints(w)}</span>
          </span>
        ))}
      </div>

      {/* Error message */}
      <div className="h-6 flex items-center justify-center">
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400 animate-pulse">
            {error}
          </p>
        )}
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Type a word with "${puzzle.root.toUpperCase()}"...`}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        className={`w-full text-lg px-4 py-3 rounded-lg border-2 transition-colors outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
      />

      <style jsx>{`
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
