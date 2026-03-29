"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { QuotablePuzzle } from "@/types/quotable";
import { shareOrCopy } from "@/lib/share";

type Screen = "splash" | "playing" | "results";

const MAX_GUESSES = 4;
const INITIAL_REVEAL = 0.3;
const REVEAL_PER_WRONG = 0.2;
const STORAGE_KEY = "quotable-streak";

function loadStreak(): { current: number; lastDate: string } {
  if (typeof window === "undefined") return { current: 0, lastDate: "" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { current: 0, lastDate: "" };
}

function saveStreak(data: { current: number; lastDate: string }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function isConsecutiveDay(prev: string, next: string): boolean {
  const d1 = new Date(prev);
  const d2 = new Date(next);
  const diff = d2.getTime() - d1.getTime();
  return diff > 0 && diff <= 86400000 * 1.5;
}

/** Deterministic seeded shuffle for word reveal order */
function seededOrder(len: number, seed: string): number[] {
  const indices = Array.from({ length: len }, (_, i) => i);
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  for (let i = indices.length - 1; i > 0; i--) {
    h = (h * 16807 + 0) | 0;
    const j = Math.abs(h) % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

export default function QuotableGame({ puzzle }: { puzzle: QuotablePuzzle }) {
  const [screen, setScreen] = useState<Screen>("splash");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [won, setWon] = useState(false);
  const [shared, setShared] = useState(false);
  const [streak, setStreak] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [shakeInput, setShakeInput] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = loadStreak();
    setStreak(s.current);
  }, []);

  // Split the quote into words
  const words = useMemo(() => puzzle.quote.split(/\s+/), [puzzle.quote]);

  // Determine which word indices to reveal based on seeded order
  const revealOrder = useMemo(
    () => seededOrder(words.length, puzzle.id + puzzle.puzzle_date),
    [words.length, puzzle.id, puzzle.puzzle_date]
  );

  // Always reveal first and last words, then fill up to the percentage
  const revealedIndices = useMemo(() => {
    const wrongCount = guesses.filter(
      (g) => g.toLowerCase() !== puzzle.attribution.toLowerCase()
    ).length;
    const pct = Math.min(INITIAL_REVEAL + wrongCount * REVEAL_PER_WRONG, 1);
    const count = Math.max(Math.ceil(words.length * pct), 2);

    const revealed = new Set<number>();
    // Always show first and last
    revealed.add(0);
    revealed.add(words.length - 1);

    for (const idx of revealOrder) {
      if (revealed.size >= count) break;
      revealed.add(idx);
    }
    return revealed;
  }, [words.length, guesses, puzzle.attribution, revealOrder]);

  const isFinished = won || guesses.length >= MAX_GUESSES;

  // Autocomplete suggestions
  const suggestions = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const lower = searchQuery.toLowerCase();
    return puzzle.options
      .filter(
        (o) =>
          o.toLowerCase().includes(lower) &&
          !guesses.includes(o)
      )
      .slice(0, 6);
  }, [searchQuery, puzzle.options, guesses]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const submitGuess = useCallback(
    (name: string) => {
      if (isFinished) return;
      const trimmed = name.trim();
      if (!trimmed || guesses.includes(trimmed)) return;

      const newGuesses = [...guesses, trimmed];
      setGuesses(newGuesses);
      setSearchQuery("");
      setShowDropdown(false);
      setHighlightIdx(-1);

      if (trimmed.toLowerCase() === puzzle.attribution.toLowerCase()) {
        setWon(true);
        setScreen("results");
        const s = loadStreak();
        const newStreak = isConsecutiveDay(s.lastDate, puzzle.puzzle_date)
          ? s.current + 1
          : 1;
        saveStreak({ current: newStreak, lastDate: puzzle.puzzle_date });
        setStreak(newStreak);
      } else if (newGuesses.length >= MAX_GUESSES) {
        setScreen("results");
        saveStreak({ current: 0, lastDate: puzzle.puzzle_date });
        setStreak(0);
      } else {
        // Wrong guess flash
        setShakeInput(true);
        setTimeout(() => setShakeInput(false), 500);
      }
    },
    [isFinished, guesses, puzzle.attribution, puzzle.puzzle_date]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIdx((prev) =>
          Math.min(prev + 1, suggestions.length - 1)
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIdx((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightIdx >= 0 && highlightIdx < suggestions.length) {
          submitGuess(suggestions[highlightIdx]);
        }
      }
    },
    [highlightIdx, suggestions, submitGuess]
  );

  const handleShare = useCallback(async () => {
    const emoji = guesses
      .map((g) =>
        g.toLowerCase() === puzzle.attribution.toLowerCase()
          ? "\uD83D\uDFE9"
          : "\uD83D\uDFE5"
      )
      .join("");

    const status = won
      ? `${guesses.length}/${MAX_GUESSES}`
      : `X/${MAX_GUESSES}`;

    const text = `Quotable \u2014 ${puzzle.puzzle_date}\n${emoji} ${status}\ngamesite.app/daily/quotable`;

    const ok = await shareOrCopy(text);
    if (ok) {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }, [guesses, won, puzzle.attribution, puzzle.puzzle_date]);

  // ── Splash ────────────────────────────────────────────────
  if (screen === "splash") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-8 animate-[fade-up_0.5s_ease_forwards]">
        <h1 className="font-body text-5xl font-extrabold text-text-primary tracking-tight mb-3">
          <span className="bg-gradient-to-r from-purple to-coral bg-clip-text text-transparent">
            Quotable
          </span>
        </h1>
        <p className="text-text-muted text-base mb-2">{puzzle.puzzle_date}</p>
        <p className="text-text-dim text-sm mb-8 max-w-xs text-center">
          Guess who said the famous quote. Words are revealed progressively.
          You have {MAX_GUESSES} guesses.
        </p>
        <button
          onClick={() => setScreen("playing")}
          className="bg-gradient-to-br from-purple to-coral text-white border-none
                     px-10 py-4 rounded-full text-lg font-bold cursor-pointer
                     shadow-[0_4px_24px_rgba(168,85,247,0.3)]
                     hover:scale-105 hover:shadow-[0_6px_32px_rgba(168,85,247,0.5)]
                     transition-all duration-200"
        >
          Start
        </button>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────
  if (screen === "results") {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-8 animate-[fade-up_0.5s_ease_forwards]">
        <h2 className="font-body text-4xl font-extrabold text-text-primary mb-4">
          {won ? "You got it!" : "Not this time!"}
        </h2>

        {/* Full quote */}
        <div className="w-full max-w-lg bg-surface/80 rounded-2xl border border-border-light p-6 mb-4">
          <p className="text-text-primary text-lg leading-relaxed italic">
            &ldquo;{puzzle.quote}&rdquo;
          </p>
          <p className="text-purple font-bold mt-3 text-right">
            &mdash; {puzzle.attribution}
          </p>
        </div>

        {won && (
          <p className="text-text-muted text-base mb-2">
            Guessed in{" "}
            <span className="text-purple font-bold">
              {guesses.length}/{MAX_GUESSES}
            </span>
          </p>
        )}

        {streak > 0 && (
          <p className="text-purple font-semibold text-sm mb-2">
            {streak} day streak!
          </p>
        )}

        {/* Guess history */}
        <div className="w-full max-w-md mb-6">
          {guesses.map((g, i) => {
            const correct =
              g.toLowerCase() === puzzle.attribution.toLowerCase();
            return (
              <div key={i} className="flex items-center gap-2 mb-1">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    correct
                      ? "bg-teal/20 text-teal"
                      : "bg-coral/20 text-coral"
                  }`}
                >
                  {correct ? "\u2713" : "\u2717"}
                </span>
                <span className="text-text-secondary text-sm">{g}</span>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleShare}
          className="bg-gradient-to-br from-purple to-coral text-white border-none
                     px-8 py-3 rounded-full text-base font-bold cursor-pointer
                     shadow-[0_4px_16px_rgba(168,85,247,0.3)]
                     hover:scale-105 transition-all duration-200"
        >
          {shared ? "Copied!" : "Share Results"}
        </button>
      </div>
    );
  }

  // ── Playing ───────────────────────────────────────────────
  const wrongCount = guesses.filter(
    (g) => g.toLowerCase() !== puzzle.attribution.toLowerCase()
  ).length;
  const showHint = puzzle.hint && wrongCount >= 2;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-8">
      {/* Guess counter */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-text-dim text-sm">
          Guess {guesses.length + 1} of {MAX_GUESSES}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: MAX_GUESSES }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full ${
                i < guesses.length
                  ? guesses[i]?.toLowerCase() ===
                    puzzle.attribution.toLowerCase()
                    ? "bg-teal"
                    : "bg-coral"
                  : "bg-text-dim/20"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Quote with blanks */}
      <div className="w-full max-w-lg bg-surface/80 rounded-2xl border border-border-light p-6 mb-6">
        <p className="text-lg leading-loose">
          <span className="text-text-dim">&ldquo;</span>
          {words.map((word, i) => {
            const revealed = revealedIndices.has(i) || isFinished;
            return (
              <span key={i}>
                {revealed ? (
                  <span className="text-text-primary font-medium">
                    {word}
                  </span>
                ) : (
                  <span
                    className="inline-block bg-purple/15 rounded px-1 mx-0.5 text-transparent select-none"
                    style={{ minWidth: `${Math.max(word.length * 0.55, 1.5)}em` }}
                  >
                    {word}
                  </span>
                )}
                {i < words.length - 1 && " "}
              </span>
            );
          })}
          <span className="text-text-dim">&rdquo;</span>
        </p>

        {showHint && (
          <p className="text-purple/70 text-sm mt-3">
            Hint: {puzzle.hint}
          </p>
        )}
      </div>

      {/* Input + autocomplete */}
      <div ref={dropdownRef} className="w-full max-w-md relative" role="combobox" aria-expanded={showDropdown && suggestions.length > 0} aria-haspopup="listbox">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
            setHighlightIdx(-1);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder="Who said this?"
          aria-label="Quote attribution"
          aria-autocomplete="list"
          aria-controls="quotable-suggestions"
          aria-activedescendant={highlightIdx >= 0 ? `quotable-option-${highlightIdx}` : undefined}
          className={`w-full px-5 py-4 rounded-xl border bg-surface/80
                     text-text-primary text-base font-medium
                     placeholder:text-text-dim/50
                     focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple/40
                     transition-all
                     ${shakeInput ? "animate-[shake_0.4s_ease-in-out] border-coral" : "border-border-light"}`}
        />

        {showDropdown && suggestions.length > 0 && (
          <div id="quotable-suggestions" role="listbox" aria-label="Author suggestions" className="absolute top-full mt-1 w-full bg-surface border border-border-light rounded-xl shadow-lg overflow-hidden z-10">
            {suggestions.map((option, i) => (
              <button
                key={option}
                id={`quotable-option-${i}`}
                role="option"
                aria-selected={i === highlightIdx}
                onClick={() => submitGuess(option)}
                className={`w-full text-left px-4 py-3 text-sm transition-colors
                           ${
                             i === highlightIdx
                               ? "bg-purple/10 text-purple"
                               : "text-text-secondary hover:bg-surface-hover"
                           }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Previous guesses */}
      {guesses.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {guesses.map((g, i) => (
            <span
              key={i}
              className="text-xs px-3 py-1.5 rounded-full bg-coral/10 text-coral font-medium"
            >
              {g}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
