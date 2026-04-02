"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { countryNames, type GeoPuzzle } from "@/lib/geo-puzzles";
import { shareOrCopy } from "@/lib/share";
import { useGameStats } from "@/hooks/useGameStats";
import StatsModal from "@/components/StatsModal";
import StatsButton from "@/components/StatsButton";

const MAX_GUESSES = 4;
const STORAGE_KEY = "geoguess-streak";

interface StreakData {
  current: number;
  lastDate: string;
}

function loadStreak(): StreakData {
  if (typeof window === "undefined") return { current: 0, lastDate: "" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { current: 0, lastDate: "" };
}

function saveStreak(data: StreakData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/** Check if two date strings are consecutive calendar days. */
function isConsecutiveDay(prev: string, next: string): boolean {
  const d1 = new Date(prev);
  const d2 = new Date(next);
  const diff = d2.getTime() - d1.getTime();
  return diff > 0 && diff <= 86400000 * 1.5; // allow some wiggle
}

export default function GeoGuessGame({ puzzle }: { puzzle: GeoPuzzle }) {
  const { country, date } = puzzle;

  const [guesses, setGuesses] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
  const [showSplash, setShowSplash] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [streak, setStreak] = useState(0);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [showStats, setShowStats] = useState(false);
  const { stats, recordGame } = useGameStats("geo-guess", date);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load streak on mount
  useEffect(() => {
    const s = loadStreak();
    setStreak(s.current);
  }, []);

  useEffect(() => {
    setTimeout(() => setFadeIn(true), 100);
  }, []);

  // Filter country suggestions
  const suggestions = useMemo(() => {
    if (inputValue.length < 1) return [];
    const lower = inputValue.toLowerCase();
    return countryNames
      .filter(
        (c) =>
          c.toLowerCase().includes(lower) &&
          !guesses.includes(c),
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

  // Reset highlight when suggestions change
  useEffect(() => {
    setHighlightIdx(-1);
  }, [suggestions]);

  const submitGuess = useCallback(
    (name: string) => {
      if (gameState !== "playing") return;
      const trimmed = name.trim();
      if (!trimmed || guesses.includes(trimmed)) return;

      const newGuesses = [...guesses, trimmed];
      setGuesses(newGuesses);
      setInputValue("");
      setShowDropdown(false);

      // Check win
      if (trimmed.toLowerCase() === country.name.toLowerCase()) {
        setGameState("won");
        // Update streak
        const s = loadStreak();
        const newStreak = isConsecutiveDay(s.lastDate, date)
          ? s.current + 1
          : s.lastDate === date
            ? s.current
            : 1;
        saveStreak({ current: newStreak, lastDate: date });
        setStreak(newStreak);
        recordGame(true, newGuesses.length);
        setTimeout(() => setShowStats(true), 800);
        return;
      }

      // Check lose
      if (newGuesses.length >= MAX_GUESSES) {
        setGameState("lost");
        // Reset streak
        const s = loadStreak();
        if (s.lastDate !== date) {
          saveStreak({ current: 0, lastDate: date });
          setStreak(0);
        }
        recordGame(false, newGuesses.length);
        setTimeout(() => setShowStats(true), 800);
        return;
      }
    },
    [gameState, guesses, country.name, date],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIdx((prev) => Math.min(prev + 1, suggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIdx((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightIdx >= 0 && highlightIdx < suggestions.length) {
          submitGuess(suggestions[highlightIdx]);
        } else if (suggestions.length > 0) {
          submitGuess(suggestions[0]);
        }
      }
    },
    [highlightIdx, suggestions, submitGuess],
  );

  // Share result
  const handleShare = useCallback(async () => {
    const guessCount = gameState === "won" ? guesses.length : "X";
    const squares: string[] = guesses.map((g) =>
      g.toLowerCase() === country.name.toLowerCase() ? "\u{1F7E9}" : "\u{1F7E5}",
    );
    while (squares.length < MAX_GUESSES) squares.push("\u2B1C");

    const text = `\u{1F30D} Where in the World ${date} — ${guessCount}/${MAX_GUESSES}\n${squares.join("")}\ngamesite.app/daily/geo-guess`;

    const ok = await shareOrCopy(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [gameState, guesses, country.name, date]);

  // How many hints to show (starts at 1, +1 per wrong guess)
  const hintsRevealed = Math.min(guesses.length + 1, MAX_GUESSES);
  const isFinished = gameState !== "playing";

  // ── Splash ──────────────────────────────────────────────────
  if (showSplash) {
    return (
      <div
        className={`flex min-h-[80vh] flex-col items-center justify-center px-4 transition-opacity duration-500 ${fadeIn ? "opacity-100" : "opacity-0"}`}
      >
        <div className="bg-white rounded-2xl shadow-lg border border-border-light p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">{"\u{1F30D}"}</div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Where in the World</h1>
          <p className="text-text-muted text-sm mb-6">
            Guess the country from progressive hints. You get 4 guesses — each
            wrong answer reveals a new clue.
          </p>

          <div className="space-y-3 text-left text-sm text-text-secondary mb-6">
            <div className="flex items-start gap-3">
              <span className="font-bold text-green">1.</span>
              <span>Start with just the flag and continent</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-bold text-green">2.</span>
              <span>Wrong guess? The capital city is revealed</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-bold text-green">3.</span>
              <span>Still stuck? See the population range</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-bold text-green">4.</span>
              <span>Last chance — a fun fact and neighbors appear</span>
            </div>
          </div>

          {streak > 0 && (
            <div className="mb-4 text-sm text-text-muted">
              Current streak: <span className="font-bold text-green">{streak}</span>
            </div>
          )}

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

  // ── Main game ───────────────────────────────────────────────
  return (
    <div
      className={`flex min-h-[80vh] flex-col items-center px-4 py-8 transition-opacity duration-500 ${fadeIn ? "opacity-100" : "opacity-0"}`}
    >
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Where in the World
            </h1>
            <p className="text-text-dim text-xs">{date}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-text-muted font-medium tabular-nums">
              {guesses.length} / {MAX_GUESSES} guesses
            </div>
            <StatsButton onClick={() => setShowStats(true)} />
          </div>
        </div>

        {/* Hint cards */}
        <div className="space-y-3 mb-6">
          {/* Hint 1: Flag + Continent (always visible) */}
          <div className="bg-white rounded-2xl border border-border-light shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-green mb-2">
                  Hint 1 — Flag &amp; Continent
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-6xl leading-none">{country.flag}</span>
                  <div>
                    <span className="inline-block text-xs font-semibold text-green bg-green/10 rounded-full px-3 py-1">
                      {country.continent}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hint 2: Capital */}
          <div
            className={`bg-white rounded-2xl border border-border-light shadow-sm p-6 transition-all duration-500 ${
              hintsRevealed >= 2 ? "opacity-100" : "opacity-30 pointer-events-none"
            }`}
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-green mb-2">
              Hint 2 — Capital City
            </div>
            {hintsRevealed >= 2 ? (
              <p className="text-text-primary text-lg font-semibold">
                {country.capital}
              </p>
            ) : (
              <p className="text-text-dim text-sm italic">Revealed after guess 1</p>
            )}
          </div>

          {/* Hint 3: Population */}
          <div
            className={`bg-white rounded-2xl border border-border-light shadow-sm p-6 transition-all duration-500 ${
              hintsRevealed >= 3 ? "opacity-100" : "opacity-30 pointer-events-none"
            }`}
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-green mb-2">
              Hint 3 — Population
            </div>
            {hintsRevealed >= 3 ? (
              <p className="text-text-primary text-lg font-semibold">
                {country.population}
              </p>
            ) : (
              <p className="text-text-dim text-sm italic">Revealed after guess 2</p>
            )}
          </div>

          {/* Hint 4: Fun fact + Neighbors */}
          <div
            className={`bg-white rounded-2xl border border-border-light shadow-sm p-6 transition-all duration-500 ${
              hintsRevealed >= 4 ? "opacity-100" : "opacity-30 pointer-events-none"
            }`}
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-green mb-2">
              Hint 4 — Fun Fact &amp; Neighbors
            </div>
            {hintsRevealed >= 4 ? (
              <div className="space-y-2">
                <p className="text-text-primary text-sm">
                  {country.funFact}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {country.neighbors.map((n) => (
                    <span
                      key={n}
                      className="text-xs font-medium text-green bg-green/10 rounded-full px-2.5 py-0.5"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-text-dim text-sm italic">Revealed after guess 3</p>
            )}
          </div>
        </div>

        {/* Result card */}
        {isFinished && (
          <div className="bg-white rounded-2xl border border-border-light p-6 mb-4 text-center shadow-sm">
            {gameState === "won" ? (
              <>
                <div className="text-3xl mb-2">{"\u{1F389}"}</div>
                <h2 className="text-lg font-bold text-text-primary">
                  You got it in {guesses.length}/{MAX_GUESSES}!
                </h2>
                <p className="text-text-muted text-sm mt-1">
                  <span className="text-5xl leading-none">{country.flag}</span>
                </p>
                <p className="text-text-primary font-semibold text-lg mt-2">
                  {country.name}
                </p>
              </>
            ) : (
              <>
                <div className="text-3xl mb-2">{"\u{1F614}"}</div>
                <h2 className="text-lg font-bold text-text-primary">
                  Better luck tomorrow!
                </h2>
                <p className="text-text-muted text-sm mt-1">
                  The answer was{" "}
                  <span className="font-semibold text-text-primary">
                    {country.flag} {country.name}
                  </span>
                </p>
              </>
            )}

            {/* Guess history squares */}
            <div className="flex items-center justify-center gap-1 mt-3">
              {guesses.map((g, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-md flex items-center justify-center text-sm ${
                    g.toLowerCase() === country.name.toLowerCase()
                      ? "bg-green text-white"
                      : "bg-red-400 text-white"
                  }`}
                >
                  {g.toLowerCase() === country.name.toLowerCase() ? "\u2713" : "\u2717"}
                </div>
              ))}
              {Array.from({ length: MAX_GUESSES - guesses.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-8 h-8 rounded-md bg-gray-200"
                />
              ))}
            </div>

            {/* Stats row */}
            <div className="flex justify-center gap-6 mt-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">
                  {gameState === "won" ? guesses.length : "X"}
                </div>
                <div className="text-text-dim text-xs mt-0.5">Guesses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">{streak}</div>
                <div className="text-text-dim text-xs mt-0.5">Streak</div>
              </div>
            </div>

            <button
              onClick={handleShare}
              className="bg-green text-white font-bold rounded-full px-6 py-2.5 text-sm
                         hover:opacity-90 transition-opacity"
            >
              {copied ? "Copied!" : "Share result"}
            </button>
          </div>
        )}

        {/* Input area */}
        {!isFinished && (
          <div className="relative" ref={dropdownRef}>
            <div className="relative" role="combobox" aria-expanded={showDropdown && suggestions.length > 0} aria-haspopup="listbox">
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
                onKeyDown={handleKeyDown}
                placeholder="Type a country name..."
                aria-label="Country name"
                aria-autocomplete="list"
                aria-controls="geo-suggestions"
                aria-activedescendant={highlightIdx >= 0 ? `geo-option-${highlightIdx}` : undefined}
                className="w-full rounded-xl border-2 border-border-light bg-white px-4 py-3 text-sm
                           text-text-primary placeholder-text-dim
                           focus:border-green focus:outline-none transition-colors"
              />

              {/* Dropdown */}
              {showDropdown && suggestions.length > 0 && (
                <div id="geo-suggestions" role="listbox" aria-label="Country suggestions" className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-border-light shadow-lg z-20 overflow-hidden">
                  {suggestions.map((name, i) => (
                    <button
                      key={name}
                      id={`geo-option-${i}`}
                      role="option"
                      aria-selected={i === highlightIdx}
                      onClick={() => submitGuess(name)}
                      className={`w-full text-left px-4 py-2.5 text-sm text-text-primary
                                 transition-colors border-b border-border-light last:border-0 ${
                                   i === highlightIdx
                                     ? "bg-green/15"
                                     : "hover:bg-green/10"
                                 }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Guess history */}
        {guesses.length > 0 && !isFinished && (
          <div className="mt-4 space-y-1.5">
            {guesses.map((guess, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-red-50 text-red-600"
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
        gameName="Where in the World"
        color="green"
        maxGuesses={MAX_GUESSES}
      />
    </div>
  );
}
