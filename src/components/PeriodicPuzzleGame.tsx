"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { PeriodicPuzzle, Element } from "@/types/periodic-puzzle";
import { ELEMENTS } from "@/lib/periodic-puzzle-data";
import { getElementByName } from "@/lib/periodic-puzzle-puzzles";
import { shareOrCopy } from "@/lib/share";
import PeriodicTable from "@/components/PeriodicTable";

const MAX_GUESSES = 6;

type Screen = "splash" | "playing" | "results";

interface GuessRow {
  element: Element;
  correct: boolean;
}

interface SavedState {
  guesses: string[];
  screen: Screen;
}

// ---------------------------------------------------------------------------
// Comparison helpers
// ---------------------------------------------------------------------------

function compareNumeric(
  guessed: number,
  answer: number
): "correct" | "higher" | "lower" {
  if (guessed === answer) return "correct";
  return answer > guessed ? "higher" : "lower";
}

function compareExact(guessed: string, answer: string): "correct" | "wrong" {
  return guessed.toLowerCase() === answer.toLowerCase() ? "correct" : "wrong";
}

function buildShareRow(guess: Element, answer: Element): string {
  const atomicEmoji =
    guess.atomicNumber === answer.atomicNumber
      ? "\u{1F7E9}"
      : guess.atomicNumber < answer.atomicNumber
        ? "\u{1F7E8}"
        : "\u{1F7E8}";
  const periodEmoji =
    guess.period === answer.period
      ? "\u{1F7E9}"
      : guess.period < answer.period
        ? "\u{2B06}\u{FE0F}"
        : "\u{2B07}\u{FE0F}";
  const groupEmoji =
    guess.group === answer.group
      ? "\u{1F7E9}"
      : guess.group < answer.group
        ? "\u{2B06}\u{FE0F}"
        : "\u{2B07}\u{FE0F}";
  const categoryEmoji =
    guess.category === answer.category ? "\u{1F7E9}" : "\u{1F7E5}";
  const stateEmoji =
    guess.state === answer.state ? "\u{1F7E9}" : "\u{1F7E5}";
  return `${atomicEmoji}${periodEmoji}${groupEmoji}${categoryEmoji}${stateEmoji}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  puzzle: PeriodicPuzzle;
}

export default function PeriodicPuzzleGame({ puzzle }: Props) {
  const answer = puzzle.element;
  const storageKey = `periodic-puzzle-${puzzle.puzzle_date}`;

  // ---- state ---------------------------------------------------------------
  const [screen, setScreen] = useState<Screen>("splash");
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Element[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [shakeRow, setShakeRow] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const won = guesses.some((g) => g.correct);
  const lost = !won && guesses.length >= MAX_GUESSES;
  const gameOver = won || lost;

  // ---- persistence ---------------------------------------------------------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const saved: SavedState = JSON.parse(raw);
      const restored: GuessRow[] = saved.guesses
        .map((name) => {
          const el = getElementByName(name);
          if (!el) return null;
          return {
            element: el,
            correct: el.name.toLowerCase() === answer.name.toLowerCase(),
          };
        })
        .filter(Boolean) as GuessRow[];
      setGuesses(restored);

      if (saved.screen === "results" || saved.screen === "playing") {
        const isWon = restored.some((g) => g.correct);
        const isLost = !isWon && restored.length >= MAX_GUESSES;
        setScreen(isWon || isLost ? "results" : saved.screen);
      }
    } catch {
      // ignore corrupt storage
    }
  }, [storageKey, answer.name]);

  useEffect(() => {
    if (screen === "splash") return;
    const toSave: SavedState = {
      guesses: guesses.map((g) => g.element.name),
      screen: gameOver ? "results" : screen,
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(toSave));
    } catch {
      // quota exceeded
    }
  }, [guesses, screen, gameOver, storageKey]);

  // ---- autocomplete --------------------------------------------------------
  const guessedNames = new Set(guesses.map((g) => g.element.name.toLowerCase()));

  // Build map for periodic table visual feedback
  const guessedElementsMap = new Map<string, "correct" | "wrong">();
  for (const g of guesses) {
    guessedElementsMap.set(g.element.name, g.correct ? "correct" : "wrong");
  }

  const updateSuggestions = useCallback(
    (val: string) => {
      if (!val.trim()) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }
      const lower = val.toLowerCase();
      const filtered = ELEMENTS.filter(
        (el) =>
          el.name.toLowerCase().startsWith(lower) &&
          !guessedNames.has(el.name.toLowerCase())
      ).slice(0, 6);
      setSuggestions(filtered);
      setShowDropdown(filtered.length > 0);
      setSelectedIdx(-1);
    },
    [guessedNames]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    updateSuggestions(val);
  };

  // ---- guess submission ----------------------------------------------------
  const submitGuess = useCallback(
    (elementName: string) => {
      if (gameOver) return;
      const el = getElementByName(elementName);
      if (!el) {
        setShakeRow(true);
        setTimeout(() => setShakeRow(false), 500);
        return;
      }
      if (guessedNames.has(el.name.toLowerCase())) return;

      const isCorrect =
        el.name.toLowerCase() === answer.name.toLowerCase();
      const newRow: GuessRow = { element: el, correct: isCorrect };
      const next = [newRow, ...guesses];
      setGuesses(next);
      setInput("");
      setSuggestions([]);
      setShowDropdown(false);

      const nowWon = isCorrect;
      const nowLost = !nowWon && next.length >= MAX_GUESSES;
      if (nowWon || nowLost) {
        setTimeout(() => setScreen("results"), 800);
      }
    },
    [answer.name, gameOver, guessedNames, guesses]
  );

  const handleSelect = useCallback(
    (el: Element) => {
      setInput(el.name);
      setShowDropdown(false);
      setSuggestions([]);
      submitGuess(el.name);
      inputRef.current?.focus();
    },
    [submitGuess]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowDropdown(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((p) => Math.min(p + 1, suggestions.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((p) => Math.max(p - 1, -1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIdx >= 0 && suggestions[selectedIdx]) {
        handleSelect(suggestions[selectedIdx]);
      } else if (suggestions.length === 1) {
        handleSelect(suggestions[0]);
      } else if (input.trim()) {
        submitGuess(input.trim());
      }
    }
  };

  // ---- share ---------------------------------------------------------------
  const buildShareText = () => {
    const numGuesses = won
      ? guesses.length
      : "X";
    const header = `Periodic Puzzle \u269B\uFE0F ${numGuesses}/${MAX_GUESSES}`;
    const rows = [...guesses]
      .reverse()
      .map((g) => buildShareRow(g.element, answer));
    return `${header}\n${rows.join("\n")}\ngamesite.app/daily/periodic-puzzle`;
  };

  const handleShare = async () => {
    const text = buildShareText();
    await shareOrCopy(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  // ---- cell rendering ------------------------------------------------------
  function NumericCell({
    guessed,
    answer: ans,
    label,
  }: {
    guessed: number;
    answer: number;
    label: string;
  }) {
    const cmp = compareNumeric(guessed, ans);
    const bg =
      cmp === "correct"
        ? "bg-green-500 text-white"
        : "bg-amber-500 text-white";
    const arrow =
      cmp === "higher" ? "\u2B06\uFE0F" : cmp === "lower" ? "\u2B07\uFE0F" : "";
    const display = label === "Group" && guessed === 0 ? "\u2014" : String(guessed);
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-lg p-2 min-w-[60px] ${bg} transition-all duration-300`}
      >
        <span className="text-lg font-bold">
          {display} {arrow}
        </span>
      </div>
    );
  }

  function ExactCell({
    guessed,
    answer: ans,
    display,
  }: {
    guessed: string;
    answer: string;
    display: string;
  }) {
    const cmp = compareExact(guessed, ans);
    const bg =
      cmp === "correct"
        ? "bg-green-500 text-white"
        : "bg-red-500 text-white";
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-lg p-2 min-w-[60px] ${bg} transition-all duration-300`}
      >
        <span className="text-sm font-semibold capitalize leading-tight text-center">
          {display}
        </span>
      </div>
    );
  }

  // =========================================================================
  // SPLASH SCREEN
  // =========================================================================
  if (screen === "splash") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12 px-4 text-center">
        <div className="text-6xl">{"\u269B\uFE0F"}</div>
        <h1 className="text-3xl font-bold text-green-600 dark:text-green-400">
          Periodic Puzzle
        </h1>
        <p className="max-w-md text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Guess the mystery element in {MAX_GUESSES} tries! After each guess,
          you&apos;ll see how your element compares to the answer across five
          categories: atomic number, period, group, category, and state.
        </p>
        <div className="flex flex-col gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <p>
            <span className="inline-block w-6 h-6 rounded bg-green-500 text-white text-center leading-6 mr-2 text-xs font-bold">
              {"\u2713"}
            </span>
            Green = correct
          </p>
          <p>
            <span className="inline-block w-6 h-6 rounded bg-amber-500 text-white text-center leading-6 mr-2 text-xs font-bold">
              {"\u2191"}
            </span>
            Amber with arrow = answer is higher/lower
          </p>
          <p>
            <span className="inline-block w-6 h-6 rounded bg-red-500 text-white text-center leading-6 mr-2 text-xs font-bold">
              {"\u2717"}
            </span>
            Red = wrong category/state
          </p>
        </div>
        <button
          onClick={() => {
            setScreen("playing");
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          className="mt-4 px-8 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-lg transition-colors shadow-lg"
        >
          Play
        </button>
      </div>
    );
  }

  // =========================================================================
  // RESULTS SCREEN
  // =========================================================================
  if (screen === "results") {
    return (
      <div className="flex flex-col items-center gap-6 py-8 px-4">
        {/* Result header */}
        <div className="text-center">
          {won ? (
            <>
              <div className="text-5xl mb-2">{"\u{1F389}"}</div>
              <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
                Correct!
              </h2>
            </>
          ) : (
            <>
              <div className="text-5xl mb-2">{"\u{1F62E}"}</div>
              <h2 className="text-2xl font-bold text-red-500">
                The answer was...
              </h2>
            </>
          )}
        </div>

        {/* Answer card */}
        <div className="w-full max-w-sm rounded-2xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-6 text-center">
          <div className="text-4xl font-bold text-green-700 dark:text-green-300">
            {answer.symbol}
          </div>
          <div className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
            {answer.name}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-zinc-600 dark:text-zinc-400">
            <div>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">Atomic #:</span>{" "}
              {answer.atomicNumber}
            </div>
            <div>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">Period:</span>{" "}
              {answer.period}
            </div>
            <div>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">Group:</span>{" "}
              {answer.group === 0 ? "\u2014" : answer.group}
            </div>
            <div>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">Category:</span>{" "}
              <span className="capitalize">{answer.category}</span>
            </div>
            <div>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">State:</span>{" "}
              <span className="capitalize">{answer.state}</span>
            </div>
            <div>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">Era:</span>{" "}
              {answer.discoveryEra}
            </div>
            <div className="col-span-2">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">Known for:</span>{" "}
              {answer.commonUse}
            </div>
          </div>
        </div>

        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          Solved in{" "}
          <span className="font-bold text-zinc-800 dark:text-zinc-200">
            {guesses.length}
          </span>{" "}
          / {MAX_GUESSES} guesses
        </p>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-colors shadow-lg"
        >
          {copiedShare ? "Copied!" : "Share Result"}
        </button>
      </div>
    );
  }

  // =========================================================================
  // PLAYING SCREEN
  // =========================================================================
  return (
    <div className="flex flex-col items-center gap-4 py-6 px-2 sm:px-4 w-full max-w-5xl mx-auto">
      <h1 className="text-xl font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
        {"\u269B\uFE0F"} Periodic Puzzle
      </h1>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Guess {guesses.length}/{MAX_GUESSES}
      </p>

      {/* Interactive periodic table */}
      <PeriodicTable
        guessedElements={guessedElementsMap}
        onElementClick={(name) => submitGuess(name)}
        disabled={gameOver}
      />

      {/* Input area */}
      {!gameOver && (
        <div className="relative w-full max-w-sm">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              // delay to allow click on dropdown
              setTimeout(() => setShowDropdown(false), 150);
            }}
            onFocus={() => {
              if (input.trim()) updateSuggestions(input);
            }}
            placeholder="Type an element name..."
            autoComplete="off"
            className={`w-full rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-green-500 transition-all ${shakeRow ? "animate-[shake_0.3s_ease-in-out]" : ""}`}
          />

          {/* Autocomplete dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg"
            >
              {suggestions.map((el, i) => (
                <button
                  key={el.atomicNumber}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(el);
                  }}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${i === selectedIdx ? "bg-green-100 dark:bg-green-900/40" : "hover:bg-zinc-100 dark:hover:bg-zinc-700"}`}
                >
                  <span className="font-bold text-green-600 dark:text-green-400 w-10 text-center text-sm">
                    {el.symbol}
                  </span>
                  <span className="text-zinc-800 dark:text-zinc-200 text-sm">
                    {el.name}
                  </span>
                  <span className="ml-auto text-xs text-zinc-400">
                    #{el.atomicNumber}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Column headers */}
      {guesses.length > 0 && (
        <div className="w-full overflow-x-auto">
          <div className="min-w-[420px]">
            <div className="grid grid-cols-[1fr_60px_60px_60px_90px_70px] gap-1.5 px-1 mb-1">
              <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide pl-1">
                Element
              </div>
              <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide text-center">
                Atomic #
              </div>
              <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide text-center">
                Period
              </div>
              <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide text-center">
                Group
              </div>
              <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide text-center">
                Category
              </div>
              <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide text-center">
                State
              </div>
            </div>

            {/* Guess rows */}
            <div className="flex flex-col gap-1.5">
              {guesses.map((row, i) => {
                const el = row.element;
                const isNewest = i === 0;
                return (
                  <div
                    key={`${el.atomicNumber}-${i}`}
                    className={`grid grid-cols-[1fr_60px_60px_60px_90px_70px] gap-1.5 ${isNewest ? "animate-[slideIn_0.3s_ease-out]" : ""} ${row.correct ? "ring-2 ring-green-400 rounded-lg" : ""}`}
                  >
                    {/* Element name */}
                    <div className="flex items-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-2">
                      <span className="font-bold text-green-600 dark:text-green-400 text-sm w-8 text-center">
                        {el.symbol}
                      </span>
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                        {el.name}
                      </span>
                    </div>

                    {/* Atomic number */}
                    <NumericCell
                      guessed={el.atomicNumber}
                      answer={answer.atomicNumber}
                      label="Atomic"
                    />

                    {/* Period */}
                    <NumericCell
                      guessed={el.period}
                      answer={answer.period}
                      label="Period"
                    />

                    {/* Group */}
                    <NumericCell
                      guessed={el.group}
                      answer={answer.group}
                      label="Group"
                    />

                    {/* Category */}
                    <ExactCell
                      guessed={el.category}
                      answer={answer.category}
                      display={el.category}
                    />

                    {/* State */}
                    <ExactCell
                      guessed={el.state}
                      answer={answer.state}
                      display={el.state}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Game over inline message */}
      {gameOver && (
        <div className="flex flex-col items-center gap-3 mt-4">
          {won ? (
            <p className="text-green-600 dark:text-green-400 font-bold text-lg">
              {"\u{1F389}"} You got it!
            </p>
          ) : (
            <p className="text-red-500 font-bold text-lg">
              The answer was{" "}
              <span className="text-zinc-800 dark:text-zinc-200">
                {answer.name} ({answer.symbol})
              </span>
            </p>
          )}
          <button
            onClick={() => setScreen("results")}
            className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-colors shadow-lg"
          >
            View Results
          </button>
        </div>
      )}

      {/* Shake + slide-in animations */}
      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-6px);
          }
          40% {
            transform: translateX(6px);
          }
          60% {
            transform: translateX(-4px);
          }
          80% {
            transform: translateX(4px);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
