"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { movieBank, type FramedPuzzle } from "@/lib/framed-puzzles";
import { shareOrCopy } from "@/lib/share";
import { useGameStats } from "@/hooks/useGameStats";
import StatsModal from "@/components/StatsModal";
import StatsButton from "@/components/StatsButton";
import XShareButton from "@/components/XShareButton";

const MAX_GUESSES = 6;

interface Props {
  puzzle: FramedPuzzle;
  variant?: string;
}

export default function FramedGame({ puzzle, variant }: Props) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
  const [showSplash, setShowSplash] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showStats, setShowStats] = useState(false);

  const { stats, recordGame } = useGameStats("framed", puzzle.date);

  useEffect(() => {
    setTimeout(() => setFadeIn(true), 100);
  }, []);

  // Filter movie suggestions
  const suggestions = useMemo(() => {
    if (inputValue.length < 1) return [];
    const lower = inputValue.toLowerCase();
    return movieBank
      .filter(
        (m) =>
          m.toLowerCase().includes(lower) &&
          !guesses.includes(m),
      )
      .slice(0, 6);
  }, [inputValue, guesses]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const submitGuess = useCallback(
    (title: string) => {
      if (gameState !== "playing") return;
      const trimmed = title.trim();
      if (!trimmed || guesses.includes(trimmed)) return;

      const newGuesses = [...guesses, trimmed];
      setGuesses(newGuesses);
      setInputValue("");
      setShowDropdown(false);

      // Check win
      if (trimmed.toLowerCase() === puzzle.title.toLowerCase()) {
        setGameState("won");
        recordGame(true, newGuesses.length);
        setTimeout(() => setShowStats(true), 800);
        return;
      }

      // Check lose (used all guesses)
      if (newGuesses.length >= MAX_GUESSES) {
        setGameState("lost");
        recordGame(false, MAX_GUESSES);
        setTimeout(() => setShowStats(true), 800);
        return;
      }

      // Reveal next frame
      setCurrentFrame((prev) => Math.min(prev + 1, MAX_GUESSES - 1));
    },
    [gameState, guesses, puzzle.title, recordGame],
  );

  const skipGuess = useCallback(() => {
    if (gameState !== "playing") return;

    const newGuesses = [...guesses, "⏭ Skipped"];
    setGuesses(newGuesses);

    if (newGuesses.length >= MAX_GUESSES) {
      setGameState("lost");
      recordGame(false, MAX_GUESSES);
      setTimeout(() => setShowStats(true), 800);
      return;
    }

    setCurrentFrame((prev) => Math.min(prev + 1, MAX_GUESSES - 1));
  }, [gameState, guesses, recordGame]);

  const generateShareText = useCallback(() => {
    const guessCount = gameState === "won" ? guesses.length : "X";
    const squares: string[] = guesses.map((g) =>
      g.toLowerCase() === puzzle.title.toLowerCase() ? "🟩" : "🟥",
    );
    // Pad remaining slots
    while (squares.length < MAX_GUESSES) squares.push("⬛");

    const variantLabel = variant && variant !== "all" ? ` (${variant})` : "";
    return `🎬 Framed${variantLabel} — ${guessCount}/${MAX_GUESSES}\n${squares.join("")}\ngamesite.app/daily/framed`;
  }, [gameState, guesses, puzzle.title, variant]);

  const handleShare = useCallback(async () => {
    const text = generateShareText();
    const ok = await shareOrCopy(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generateShareText]);

  const variantLabel = variant && variant !== "all"
    ? variant.charAt(0).toUpperCase() + variant.slice(1)
    : null;

  // Splash screen
  if (showSplash) {
    return (
      <div
        className={`flex min-h-[70vh] flex-col items-center justify-center px-4 transition-opacity duration-500 ${fadeIn ? "opacity-100" : "opacity-0"}`}
      >
        <div className="bg-white rounded-2xl shadow-lg border border-border-light p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🎬</div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Framed</h1>
          {variantLabel && (
            <span className="inline-block text-xs font-semibold text-green bg-green/10 rounded-full px-3 py-1 mb-3">
              {variantLabel}
            </span>
          )}
          <p className="text-text-muted text-sm mb-6">
            Guess the movie from still frames. You get 6 frames and 6 guesses.
            Each wrong guess (or skip) reveals a more recognizable frame.
          </p>

          <div className="space-y-3 text-left text-sm text-text-secondary mb-6">
            <div className="flex items-start gap-3">
              <span className="font-bold text-green">1.</span>
              <span>Look at the frame and guess the movie</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-bold text-green">2.</span>
              <span>Wrong? A new, easier frame is revealed</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-bold text-green">3.</span>
              <span>Guess in as few frames as possible</span>
            </div>
          </div>

          <button
            onClick={() => setShowSplash(false)}
            className="w-full bg-green text-white font-bold rounded-full py-3 text-sm
                       hover:opacity-90 transition-opacity"
          >
            Play
          </button>
        </div>
      </div>
    );
  }

  const isFinished = gameState !== "playing";

  return (
    <div
      className={`flex min-h-[80vh] flex-col items-center px-4 py-8 transition-opacity duration-500 ${fadeIn ? "opacity-100" : "opacity-0"}`}
    >
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Framed
              {variantLabel && (
                <span className="ml-2 text-sm font-semibold text-green">
                  {variantLabel}
                </span>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-text-muted font-medium tabular-nums">
              {currentFrame + 1} / {MAX_GUESSES}
            </div>
            <StatsButton onClick={() => setShowStats(true)} />
          </div>
        </div>

        {/* Frame display */}
        <div className="relative rounded-xl overflow-hidden border-2 border-border-light bg-black mb-4 shadow-lg">
          <div className="aspect-video relative">
            <Image
              src={puzzle.frames[currentFrame]}
              alt={`Movie frame ${currentFrame + 1}`}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Frame indicator dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {puzzle.frames.map((_, i) => (
              <button
                key={i}
                disabled={i > currentFrame && !isFinished}
                onClick={() => {
                  if (i <= currentFrame || isFinished) setCurrentFrame(i);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  i === currentFrame
                    ? "bg-white scale-125 shadow-md"
                    : i <= currentFrame || isFinished
                      ? "bg-white/50 hover:bg-white/80 cursor-pointer"
                      : "bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Game finished state */}
        {isFinished && (
          <div className="bg-white rounded-xl border border-border-light p-5 mb-4 text-center shadow-sm">
            {gameState === "won" ? (
              <>
                <div className="text-3xl mb-2">🎉</div>
                <h2 className="text-lg font-bold text-text-primary">
                  You got it!
                </h2>
                <p className="text-text-muted text-sm mt-1">
                  <span className="font-semibold text-text-primary">
                    {puzzle.title}
                  </span>{" "}
                  ({puzzle.year}) — guessed in{" "}
                  <span className="font-bold text-green">{guesses.length}</span>{" "}
                  {guesses.length === 1 ? "try" : "tries"}
                </p>
              </>
            ) : (
              <>
                <div className="text-3xl mb-2">😔</div>
                <h2 className="text-lg font-bold text-text-primary">
                  Better luck tomorrow!
                </h2>
                <p className="text-text-muted text-sm mt-1">
                  The answer was{" "}
                  <span className="font-semibold text-text-primary">
                    {puzzle.title}
                  </span>{" "}
                  ({puzzle.year})
                </p>
              </>
            )}

            {/* Guess history squares */}
            <div className="flex items-center justify-center gap-1 mt-3">
              {guesses.map((g, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-md flex items-center justify-center text-sm ${
                    g.toLowerCase() === puzzle.title.toLowerCase()
                      ? "bg-green text-white"
                      : "bg-red-400 text-white"
                  }`}
                >
                  {g.toLowerCase() === puzzle.title.toLowerCase() ? "✓" : "✗"}
                </div>
              ))}
              {Array.from({ length: MAX_GUESSES - guesses.length }).map(
                (_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="w-8 h-8 rounded-md bg-gray-200"
                  />
                ),
              )}
            </div>

            <div className="flex gap-3 justify-center mt-4">
              <button
                onClick={handleShare}
                className="bg-green text-white font-bold rounded-full px-6 py-2.5 text-sm
                           hover:opacity-90 transition-opacity"
              >
                {copied ? "Copied!" : "Share result"}
              </button>
              <XShareButton getText={generateShareText} />
            </div>
          </div>
        )}

        {/* Input area — only while playing */}
        {!isFinished && (
          <div className="relative" ref={dropdownRef}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setShowDropdown(e.target.value.length > 0);
                  }}
                  onFocus={() => {
                    if (inputValue.length > 0) setShowDropdown(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && suggestions.length > 0) {
                      submitGuess(suggestions[0]);
                    }
                  }}
                  placeholder="Search for a movie..."
                  className="w-full rounded-xl border-2 border-border-light bg-white px-4 py-3 text-sm
                             text-text-primary placeholder-text-dim
                             focus:border-green focus:outline-none transition-colors"
                />

                {/* Dropdown */}
                {showDropdown && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-border-light shadow-lg z-20 overflow-hidden">
                    {suggestions.map((movie) => (
                      <button
                        key={movie}
                        onClick={() => submitGuess(movie)}
                        className="w-full text-left px-4 py-2.5 text-sm text-text-primary
                                   hover:bg-green/10 transition-colors border-b border-border-light last:border-0"
                      >
                        {movie}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={skipGuess}
                className="rounded-xl border-2 border-border-light bg-white px-4 py-3 text-sm font-semibold
                           text-text-muted hover:border-green hover:text-green transition-colors"
                title="Skip — reveal next frame"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Guess history */}
        {guesses.length > 0 && !isFinished && (
          <div className="mt-4 space-y-1.5">
            {guesses.map((guess, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  guess === "⏭ Skipped"
                    ? "bg-gray-100 text-text-dim italic"
                    : "bg-red-50 text-red-600"
                }`}
              >
                <span className="font-bold text-xs w-5">{i + 1}.</span>
                <span>{guess}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <StatsModal
        open={showStats}
        onClose={() => setShowStats(false)}
        stats={stats}
        gameName="Framed"
        color="green"
        maxGuesses={MAX_GUESSES}
      />
    </div>
  );
}
