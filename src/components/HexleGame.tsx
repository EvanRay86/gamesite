"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { LetterStatus, HexleGuess } from "@/types/hexle";
import { isValidGuess } from "@/lib/hexle-words";
import { shareOrCopy } from "@/lib/share";
import { useGameStats } from "@/hooks/useGameStats";
import StatsModal from "@/components/StatsModal";
import StatsButton from "@/components/StatsButton";

const WORD_LENGTH = 6;
const MAX_GUESSES = 7;

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

const STATUS_COLORS: Record<LetterStatus, string> = {
  correct: "bg-amber text-white border-amber",
  present: "bg-teal text-white border-teal",
  absent: "bg-[#3a3a4a] text-white border-[#3a3a4a]",
  empty: "bg-surface border-border-light text-text-primary",
};

const KEYBOARD_COLORS: Record<LetterStatus, string> = {
  correct: "bg-amber text-white",
  present: "bg-teal text-white",
  absent: "bg-[#3a3a4a] text-white",
  empty: "bg-surface text-text-primary",
};

function evaluateGuess(guess: string, answer: string): LetterStatus[] {
  const statuses: LetterStatus[] = Array(WORD_LENGTH).fill("absent");
  const answerChars = answer.split("");
  const guessChars = guess.split("");
  const remaining: (string | null)[] = [...answerChars];

  // First pass: mark correct positions
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessChars[i] === answerChars[i]) {
      statuses[i] = "correct";
      remaining[i] = null;
    }
  }

  // Second pass: mark present (wrong position)
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (statuses[i] === "correct") continue;
    const idx = remaining.indexOf(guessChars[i]);
    if (idx !== -1) {
      statuses[i] = "present";
      remaining[idx] = null;
    }
  }

  return statuses;
}

interface Props {
  answer: string;
  puzzleDate: string;
}

export default function HexleGame({ answer, puzzleDate }: Props) {
  const [guesses, setGuesses] = useState<HexleGuess[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shakeRow, setShakeRow] = useState(false);
  const [revealingRow, setRevealingRow] = useState(-1);
  const [toast, setToast] = useState("");
  const [showSplash, setShowSplash] = useState(true);
  const [fadeIn, setFadeIn] = useState(true);
  const [copied, setCopied] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bounceRow, setBounceRow] = useState(-1);
  const [showStats, setShowStats] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  const { stats, recordGame } = useGameStats("hexle", puzzleDate);

  // Load streak from localStorage
  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("hexle-stats") || "{}");
      setStreak(data.streak || 0);
    } catch { /* ignore */ }
  }, []);

  const saveStats = useCallback((didWin: boolean, numGuesses: number) => {
    try {
      const data = JSON.parse(localStorage.getItem("hexle-stats") || "{}");
      const lastDate = data.lastDate || "";
      const today = puzzleDate;

      if (didWin) {
        // Check if streak continues (played yesterday or first game)
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        const newStreak = lastDate === yesterdayStr ? (data.streak || 0) + 1 : 1;
        const points = MAX_GUESSES + 1 - numGuesses;

        const newData = {
          streak: newStreak,
          lastDate: today,
          totalPoints: (data.totalPoints || 0) + points,
          gamesWon: (data.gamesWon || 0) + 1,
          gamesPlayed: (data.gamesPlayed || 0) + 1,
        };
        localStorage.setItem("hexle-stats", JSON.stringify(newData));
        setStreak(newStreak);
      } else {
        const newData = {
          ...data,
          streak: 0,
          lastDate: today,
          gamesPlayed: (data.gamesPlayed || 0) + 1,
        };
        localStorage.setItem("hexle-stats", JSON.stringify(newData));
        setStreak(0);
      }
    } catch { /* ignore */ }
  }, [puzzleDate]);

  // Keyboard handler
  useEffect(() => {
    if (showSplash || gameOver) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toUpperCase();

      if (key === "ENTER") {
        handleSubmit();
      } else if (key === "BACKSPACE") {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (/^[A-Z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
        setCurrentGuess((prev) => prev + key);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1500);
  };

  const handleSubmit = () => {
    if (currentGuess.length !== WORD_LENGTH) {
      setShakeRow(true);
      setTimeout(() => setShakeRow(false), 500);
      showToast("Not enough letters");
      return;
    }

    if (!isValidGuess(currentGuess)) {
      setShakeRow(true);
      setTimeout(() => setShakeRow(false), 500);
      showToast("Not a valid word");
      return;
    }

    const statuses = evaluateGuess(currentGuess, answer);
    const newGuess: HexleGuess = { letters: currentGuess.split(""), statuses };
    const newGuesses = [...guesses, newGuess];
    const rowIndex = guesses.length;

    setRevealingRow(rowIndex);
    setGuesses(newGuesses);
    setCurrentGuess("");

    const isWin = currentGuess === answer;
    const isLoss = !isWin && newGuesses.length >= MAX_GUESSES;

    // Wait for flip animation to finish before showing result
    setTimeout(() => {
      setRevealingRow(-1);

      if (isWin) {
        setBounceRow(rowIndex);
        setTimeout(() => setBounceRow(-1), 1000);
        setTimeout(() => {
          setWon(true);
          setGameOver(true);
          saveStats(true, newGuesses.length);
          recordGame(true, newGuesses.length);
          setTimeout(() => setShowStats(true), 600);
        }, 600);
      } else if (isLoss) {
        setTimeout(() => {
          setGameOver(true);
          saveStats(false, newGuesses.length);
          recordGame(false, newGuesses.length);
          setTimeout(() => setShowStats(true), 600);
        }, 200);
      }
    }, WORD_LENGTH * 100 + 300);
  };

  const handleKeyPress = (key: string) => {
    if (gameOver) return;
    if (key === "ENTER") {
      handleSubmit();
    } else if (key === "⌫") {
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else if (currentGuess.length < WORD_LENGTH) {
      setCurrentGuess((prev) => prev + key);
    }
  };

  // Build keyboard status map (best status per letter)
  const keyboardStatuses = useCallback((): Record<string, LetterStatus> => {
    const map: Record<string, LetterStatus> = {};
    const priority: LetterStatus[] = ["correct", "present", "absent"];
    for (const guess of guesses) {
      guess.letters.forEach((letter, i) => {
        const status = guess.statuses[i];
        const current = map[letter];
        if (!current || priority.indexOf(status) < priority.indexOf(current)) {
          map[letter] = status;
        }
      });
    }
    return map;
  }, [guesses]);

  const handleShare = async () => {
    const points = won ? MAX_GUESSES + 1 - guesses.length : 0;
    const title = `Hexle ${puzzleDate}`;
    const score = won ? `${guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
    const grid = guesses
      .map((g) =>
        g.statuses
          .map((s) => (s === "correct" ? "🟧" : s === "present" ? "🩵" : "⬛"))
          .join("")
      )
      .join("\n");
    const text = `${title} ${score}${won ? ` (+${points}pts)` : ""}\n\n${grid}\ngamesite.app/daily/hexle`;

    const ok = await shareOrCopy(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // --- Splash Screen ---
  if (showSplash) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="animate-[float_3s_ease-in-out_infinite]">
          <div className="flex gap-1.5 mb-8">
            {["H", "E", "X", "L", "E", "!"].map((letter, i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white
                  ${i < 3 ? "bg-amber" : i < 5 ? "bg-teal" : "bg-[#3a3a4a]"}`}
              >
                {letter}
              </div>
            ))}
          </div>
        </div>
        <h1 className="font-display text-5xl text-text-primary tracking-tight animate-[fade-up_0.6s_ease_forwards]">
          Hexle
        </h1>
        <p className="text-text-muted text-base max-w-[340px] leading-relaxed mt-4 mb-10 animate-[fade-up_0.6s_ease_0.2s_forwards] opacity-0">
          Crack the six-letter word in seven guesses.
          <br />
          <span className="inline-block mt-2 text-sm">
            <span className="inline-block w-4 h-4 rounded bg-amber align-middle mr-1" /> Correct spot{" "}
            <span className="inline-block w-4 h-4 rounded bg-teal align-middle mr-1 ml-2" /> Wrong spot{" "}
            <span className="inline-block w-4 h-4 rounded bg-[#3a3a4a] align-middle mr-1 ml-2" /> Not in word
          </span>
        </p>
        <button
          onClick={() => {
            setShowSplash(false);
            setTimeout(() => {
              setFadeIn(true);
              gameRef.current?.focus();
            }, 100);
          }}
          className="bg-gradient-to-br from-amber to-[#e5a020] text-white border-none
                     px-12 py-4 rounded-full text-lg font-bold cursor-pointer
                     animate-[fade-up_0.6s_ease_0.4s_forwards] opacity-0
                     shadow-[0_4px_24px_rgba(247,183,49,0.3)]
                     hover:scale-105 hover:shadow-[0_6px_32px_rgba(247,183,49,0.5)]
                     transition-all duration-200"
        >
          Play
        </button>
      </div>
    );
  }

  const kbStatuses = keyboardStatuses();
  const points = won ? MAX_GUESSES + 1 - guesses.length : 0;

  // --- Main Game ---
  return (
    <div
      ref={gameRef}
      className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center px-4 py-6 transition-opacity duration-400"
      style={{ opacity: fadeIn ? 1 : 0 }}
    >
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-text-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-lg animate-[fade-up_0.3s_ease_forwards]">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-4 w-full max-w-[400px] relative">
        <div className="absolute right-0 top-0">
          <StatsButton onClick={() => setShowStats(true)} />
        </div>
        <h1 className="font-display text-4xl text-text-primary tracking-tight">
          Hexle
        </h1>
        <p className="text-text-dim text-[13px] mt-1">
          Six letters. Seven guesses. A new word every day.
        </p>
      </div>

      {/* Streak badge */}
      {streak > 0 && !gameOver && (
        <div className="flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full bg-amber/10 text-amber text-xs font-bold">
          🔥 {streak} day streak
        </div>
      )}

      {/* Grid */}
      <div className="grid gap-1.5 mb-5 w-full max-w-[360px]">
        {Array.from({ length: MAX_GUESSES }).map((_, rowIdx) => {
          const guess = guesses[rowIdx];
          const isCurrentRow = rowIdx === guesses.length && !gameOver;
          const isRevealing = rowIdx === revealingRow;
          const isBouncing = rowIdx === bounceRow;
          const isShaking = isCurrentRow && shakeRow;

          return (
            <div
              key={rowIdx}
              className="grid grid-cols-6 gap-1.5"
              style={{ animation: isShaking ? "shake 0.4s ease" : "none" }}
            >
              {Array.from({ length: WORD_LENGTH }).map((_, colIdx) => {
                let letter = "";
                let statusClass = STATUS_COLORS.empty;

                if (guess) {
                  letter = guess.letters[colIdx];
                  statusClass = STATUS_COLORS[guess.statuses[colIdx]];
                } else if (isCurrentRow) {
                  letter = currentGuess[colIdx] || "";
                }

                const hasLetter = letter !== "";
                const flipDelay = isRevealing ? colIdx * 100 : 0;
                const bounceDelay = isBouncing ? colIdx * 80 : 0;

                return (
                  <div
                    key={colIdx}
                    className={`w-full aspect-square flex items-center justify-center
                               text-2xl font-bold rounded-lg border-2 select-none
                               transition-all duration-150
                               ${guess ? statusClass : hasLetter ? "bg-surface border-text-dim text-text-primary" : STATUS_COLORS.empty}
                               ${hasLetter && !guess ? "scale-105" : ""}`}
                    style={{
                      animation: isRevealing
                        ? `hexle-flip 0.5s ease ${flipDelay}ms both`
                        : isBouncing
                          ? `hexle-bounce 0.4s ease ${bounceDelay}ms`
                          : "none",
                    }}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Game Over */}
      {gameOver && (
        <div className="text-center animate-[fade-up_0.5s_ease_forwards] mb-5">
          <div
            className={`text-3xl font-display mb-2 ${won ? "text-amber" : "text-error"}`}
          >
            {won ? "Brilliant!" : "Better luck tomorrow"}
          </div>
          {won && (
            <div className="text-text-muted text-sm mb-1">
              Solved in {guesses.length} guess{guesses.length !== 1 ? "es" : ""} — <span className="text-amber font-bold">+{points} pts</span>
            </div>
          )}
          {!won && (
            <div className="text-text-muted text-sm mb-1">
              The word was <span className="font-bold text-text-primary">{answer}</span>
            </div>
          )}
          {streak > 0 && won && (
            <div className="text-text-dim text-sm mb-3">
              🔥 {streak} day streak
            </div>
          )}
          <div className="flex gap-3 justify-center mt-3">
            <button
              onClick={handleShare}
              className="bg-surface text-text-muted border-[1.5px] border-border-light
                         rounded-full px-8 py-3.5 text-base font-bold cursor-pointer
                         transition-all hover:bg-surface-hover hover:text-text-secondary"
            >
              {copied ? "Copied!" : "Share"}
            </button>
          </div>
        </div>
      )}

      {/* Keyboard */}
      {!gameOver && (
        <div className="w-full max-w-[500px] mt-auto">
          {KEYBOARD_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex justify-center gap-1 mb-1.5">
              {row.map((key) => {
                const status = kbStatuses[key];
                const colorClass = status ? KEYBOARD_COLORS[status] : KEYBOARD_COLORS.empty;
                const isWide = key === "ENTER" || key === "⌫";

                return (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    className={`${colorClass} border-none rounded-lg font-semibold cursor-pointer
                               select-none transition-all duration-100
                               active:scale-95 hover:opacity-80
                               ${isWide ? "px-3 sm:px-4 text-xs sm:text-sm" : "text-sm sm:text-base"}
                               h-12 sm:h-14`}
                    style={{
                      minWidth: isWide ? "65px" : "32px",
                      flex: isWide ? "1.5" : "1",
                    }}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-6 text-text-dim/30 text-[11px] tracking-wider">
        {puzzleDate}
      </div>

      <StatsModal
        open={showStats}
        onClose={() => setShowStats(false)}
        stats={stats}
        gameName="Hexle"
        color="amber"
        maxGuesses={MAX_GUESSES}
      />
    </div>
  );
}
