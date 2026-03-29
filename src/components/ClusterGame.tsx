"use client";

import { useState, useCallback, useEffect } from "react";
import type { Group, Puzzle, GuessEntry } from "@/types/puzzle";
import { shareOrCopy } from "@/lib/share";
import { useGameStats } from "@/hooks/useGameStats";
import StatsModal from "@/components/StatsModal";
import StatsButton from "@/components/StatsButton";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MAX_MISTAKES = 4;

const EMOJI_MAP: Record<string, string> = {
  "#FF6B6B": "🟥",
  "#4ECDC4": "🩵",
  "#45B7D1": "🔷",
  "#F7B731": "🟧",
  "#A855F7": "🟪",
};

interface Props {
  puzzle: Puzzle;
  puzzleNumber?: number;
}

export default function ClusterGame({ puzzle, puzzleNumber }: Props) {
  const [words, setWords] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [solved, setSolved] = useState<Group[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [shakeWords, setShakeWords] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [revealIndex, setRevealIndex] = useState(-1);
  const [guessHistory, setGuessHistory] = useState<GuessEntry[]>([]);
  const [showSplash, setShowSplash] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const { stats, recordGame } = useGameStats("cluster", puzzle.puzzle_date);

  const initPuzzle = useCallback(() => {
    const allWords = puzzle.groups.flatMap((g) => g.words);
    setWords(shuffle(allWords));
    setSelected([]);
    setSolved([]);
    setMistakes(0);
    setShakeWords(false);
    setGameOver(false);
    setWon(false);
    setRevealIndex(-1);
    setGuessHistory([]);
  }, [puzzle]);

  useEffect(() => {
    initPuzzle();
    setTimeout(() => setFadeIn(true), 100);
  }, [initPuzzle]);

  const toggleWord = (word: string) => {
    if (gameOver || solved.some((g) => g.words.includes(word))) return;
    setSelected((prev) =>
      prev.includes(word)
        ? prev.filter((w) => w !== word)
        : prev.length < 3
          ? [...prev, word]
          : prev
    );
  };

  const handleSubmit = () => {
    if (selected.length !== 3 || gameOver) return;

    const match = puzzle.groups.find(
      (g) => !solved.includes(g) && selected.every((w) => g.words.includes(w))
    );

    if (match) {
      const newSolved = [...solved, match];
      setSolved(newSolved);
      setSelected([]);
      setGuessHistory((h) => [
        ...h,
        { colors: selected.map(() => match.color), correct: true },
      ]);

      if (newSolved.length === 5) {
        setTimeout(() => {
          setWon(true);
          setGameOver(true);
          recordGame(true, mistakes + 1);
          setTimeout(() => setShowStats(true), 600);
        }, 500);
      }
    } else {
      const oneAway = puzzle.groups.some(
        (g) =>
          !solved.includes(g) &&
          selected.filter((w) => g.words.includes(w)).length === 2
      );

      setShakeWords(true);
      setTimeout(() => setShakeWords(false), 500);

      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);

      const guessColors = selected.map((w) => {
        const g = puzzle.groups.find((gr) => gr.words.includes(w));
        return g ? g.color : "#666";
      });
      setGuessHistory((h) => [
        ...h,
        { colors: guessColors, correct: false, oneAway },
      ]);

      if (newMistakes >= MAX_MISTAKES) {
        recordGame(false, MAX_MISTAKES);
        setTimeout(() => {
          setGameOver(true);
          let delay = 0;
          puzzle.groups.forEach((g, i) => {
            if (!solved.includes(g)) {
              setTimeout(() => setRevealIndex(i), delay);
              delay += 400;
            }
          });
        }, 600);
      }
    }
  };

  const handleShuffle = () => {
    const solvedWords = solved.flatMap((g) => g.words);
    const remaining = words.filter((w) => !solvedWords.includes(w));
    setWords([...solvedWords, ...shuffle(remaining)]);
  };

  const handleShare = async () => {
    const title = `Cluster ${puzzle.puzzle_date}${puzzleNumber ? ` #${puzzleNumber}` : ""}`;
    const grid = guessHistory
      .map((guess) => guess.colors.map((c) => EMOJI_MAP[c] || "⬛").join(""))
      .join("\n");
    const text = `${title}\n${grid}\ngamesite.app/daily/cluster`;

    const ok = await shareOrCopy(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const solvedWords = solved.flatMap((g) => g.words);
  const remainingWords = words.filter((w) => !solvedWords.includes(w));

  // --- Splash Screen ---
  if (showSplash) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="animate-[float_3s_ease-in-out_infinite]">
          <div className="flex gap-1.5 mb-8">
            {["bg-coral", "bg-teal", "bg-sky", "bg-amber", "bg-purple"].map((c, i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded-[10px] ${c} opacity-90`}
              />
            ))}
          </div>
        </div>
        <h1 className="font-display text-5xl text-text-primary tracking-tight animate-[fade-up_0.6s_ease_forwards]">
          Cluster
        </h1>
        <p className="text-text-muted text-base max-w-[340px] leading-relaxed mt-4 mb-10 animate-[fade-up_0.6s_ease_0.2s_forwards] opacity-0">
          Find five groups of three words that share a hidden connection.
          You get four mistakes before it&apos;s over.
        </p>
        <button
          onClick={() => setShowSplash(false)}
          className="bg-gradient-to-br from-coral to-coral-dark text-white border-none
                     px-12 py-4 rounded-full text-lg font-bold cursor-pointer
                     animate-[fade-up_0.6s_ease_0.4s_forwards] opacity-0
                     shadow-[0_4px_24px_rgba(255,107,107,0.3)]
                     hover:scale-105 hover:shadow-[0_6px_32px_rgba(255,107,107,0.5)]
                     transition-all duration-200"
        >
          Play
        </button>
      </div>
    );
  }

  // --- Main Game ---
  return (
    <div
      className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center px-4 py-6 transition-opacity duration-400"
      style={{ opacity: fadeIn ? 1 : 0 }}
    >
      {/* Header */}
      <div className="text-center mb-5 w-full max-w-[520px] relative">
        <div className="absolute right-0 top-0">
          <StatsButton onClick={() => setShowStats(true)} />
        </div>
        <h1 className="font-display text-4xl text-text-primary tracking-tight">
          Cluster
        </h1>
        <p className="text-text-dim text-[13px] mt-1">
          Find the hidden link between three words
        </p>
      </div>

      {/* Mistakes */}
      <div className="flex gap-2 mb-4 items-center">
        <span className="text-text-dim text-[13px] mr-1">Mistakes:</span>
        {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
              i < mistakes
                ? "bg-error shadow-[0_0_8px_rgba(231,76,60,0.5)]"
                : "bg-[rgba(255,255,255,0.08)] border-[1.5px] border-border-light"
            }`}
          />
        ))}
      </div>

      {/* Solved Groups */}
      <div className="w-full max-w-[520px]">
        {solved.map((group) => (
          <div
            key={group.category}
            className="rounded-xl p-3.5 px-4 mb-2 text-center animate-[pop-in_0.4s_ease_forwards]"
            style={{ background: group.color }}
          >
            <div className="font-extrabold text-[15px] text-dark uppercase tracking-wider">
              {group.category}
            </div>
            <div className="text-[13px] text-dark/70 mt-0.5 font-medium">
              {group.words.join(", ")}
            </div>
          </div>
        ))}

        {/* Reveal unsolved on loss */}
        {gameOver &&
          !won &&
          puzzle.groups
            .filter((g) => !solved.includes(g))
            .map((group) => {
              const idx = puzzle.groups.indexOf(group);
              return (
                <div
                  key={group.category}
                  className="rounded-xl p-3.5 px-4 mb-2 text-center"
                  style={{
                    background: group.color,
                    animation:
                      revealIndex >= idx
                        ? "slide-down 0.4s ease forwards"
                        : "none",
                    opacity: revealIndex >= idx ? 1 : 0,
                  }}
                >
                  <div className="font-extrabold text-[15px] text-dark uppercase tracking-wider">
                    {group.category}
                  </div>
                  <div className="text-[13px] text-dark/70 mt-0.5 font-medium">
                    {group.words.join(", ")}
                  </div>
                </div>
              );
            })}
      </div>

      {/* Word Grid */}
      {!gameOver && (
        <div
          className="grid grid-cols-5 gap-2 w-full max-w-[520px] mb-5"
          style={{ animation: shakeWords ? "shake 0.4s ease" : "none" }}
        >
          {remainingWords.map((word, i) => {
            const isSelected = selected.includes(word);
            return (
              <button
                key={word}
                onClick={() => toggleWord(word)}
                className={`rounded-xl py-4.5 px-1 text-[12px] font-semibold tracking-wide
                           cursor-pointer select-none transition-all duration-150
                           hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)]
                           active:scale-95
                           ${
                             isSelected
                               ? "bg-gradient-to-br from-coral to-coral-dark text-white border-2 border-coral font-bold shadow-[0_4px_16px_rgba(255,107,107,0.25)]"
                               : "bg-surface text-text-secondary border-2 border-border shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                           }`}
                style={{
                  animation: `fade-up 0.3s ease ${i * 0.03}s forwards`,
                }}
              >
                {word}
              </button>
            );
          })}
        </div>
      )}

      {/* Action Buttons */}
      {!gameOver && (
        <div className="flex gap-2.5 mb-5">
          <button
            onClick={handleShuffle}
            className="bg-surface text-text-muted border-[1.5px] border-border-light
                       rounded-full px-6 py-2.5 text-sm font-semibold cursor-pointer
                       transition-all hover:bg-surface-hover hover:text-text-secondary"
          >
            Shuffle
          </button>
          <button
            onClick={() => setSelected([])}
            className="bg-surface text-text-muted border-[1.5px] border-border-light
                       rounded-full px-6 py-2.5 text-sm font-semibold cursor-pointer
                       transition-all hover:bg-surface-hover hover:text-text-secondary"
          >
            Deselect
          </button>
          <button
            onClick={handleSubmit}
            disabled={selected.length !== 3}
            className={`rounded-full px-7 py-2.5 text-sm font-bold border-none transition-all duration-200
                        ${
                          selected.length === 3
                            ? "bg-gradient-to-br from-coral to-coral-dark text-white cursor-pointer shadow-[0_4px_16px_rgba(255,107,107,0.3)]"
                            : "bg-[rgba(255,255,255,0.03)] text-[#4a4a5a] cursor-default"
                        }`}
          >
            Submit
          </button>
        </div>
      )}

      {/* Guess History Dots */}
      {guessHistory.length > 0 && (
        <div className="mb-4">
          {guessHistory.map((guess, gi) => (
            <div
              key={gi}
              className="flex gap-1 items-center mb-1 animate-[fade-up_0.3s_ease_forwards]"
            >
              {guess.colors.map((c, ci) => (
                <div
                  key={ci}
                  className="w-5 h-5 rounded-[5px]"
                  style={{ background: c }}
                />
              ))}
              {guess.oneAway && (
                <span className="text-error text-[11px] ml-1.5 font-semibold">
                  One away!
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Game Over */}
      {gameOver && (
        <div className="text-center animate-[fade-up_0.5s_ease_forwards] mt-3">
          <div
            className={`text-3xl font-display mb-2 ${won ? "text-coral" : "text-error"}`}
          >
            {won ? "Brilliant!" : "Better luck next time"}
          </div>
          {won && (
            <div className="text-text-muted text-sm mb-4">
              Solved with {mistakes === 0 ? "no" : mistakes} mistake
              {mistakes !== 1 ? "s" : ""}
            </div>
          )}
          <div className="flex gap-3 justify-center">
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

      {/* Footer */}
      <div className="mt-auto pt-8 text-[rgba(255,255,255,0.15)] text-[11px] tracking-wider">
        {puzzle.puzzle_date}
      </div>

      <StatsModal
        open={showStats}
        onClose={() => setShowStats(false)}
        stats={stats}
        gameName="Cluster"
        color="coral"
        maxGuesses={MAX_MISTAKES}
      />
    </div>
  );
}
