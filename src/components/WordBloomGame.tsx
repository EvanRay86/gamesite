"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { WordBloomPuzzle } from "@/types/word-bloom";
import { isValidEnglishWord } from "@/lib/dictionary";
import { getWordSet } from "@/lib/dictionary";
import { shareOrCopy } from "@/lib/share";
import { useGameStats } from "@/hooks/useGameStats";
import StatsModal from "@/components/StatsModal";

// ── Scoring ────────────────────────────────────────────────────────────────
function scoreWord(word: string, allLetters: string[]): number {
  if (word.length === 4) return 1;
  const isPangram = allLetters.every((l) =>
    word.toUpperCase().includes(l)
  );
  return word.length + (isPangram ? 7 : 0);
}

function isPangram(word: string, allLetters: string[]): boolean {
  return allLetters.every((l) => word.toUpperCase().includes(l));
}

// ── Rank thresholds (percentage of max score) ──────────────────────────────
const RANKS: { pct: number; label: string }[] = [
  { pct: 0, label: "Seedling" },
  { pct: 5, label: "Sprout" },
  { pct: 15, label: "Bud" },
  { pct: 30, label: "Bloom" },
  { pct: 50, label: "Full Bloom" },
  { pct: 70, label: "Garden" },
  { pct: 100, label: "Botanist" },
];

function getRank(score: number, maxScore: number) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (pct >= r.pct) rank = r;
  }
  return rank;
}

function getNextRank(score: number, maxScore: number) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  for (const r of RANKS) {
    if (pct < r.pct) return r;
  }
  return null;
}

// ── Persistence ────────────────────────────────────────────────────────────
function stateKey(date: string) {
  return `gamesite-word-bloom-${date}`;
}

function loadState(date: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(stateKey(date));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveState(date: string, found: string[]) {
  try {
    localStorage.setItem(stateKey(date), JSON.stringify(found));
  } catch {
    // ignore
  }
}

// ── Find all valid answers for a puzzle ─────────────────────────────────────
function computeAllAnswers(letters: string[]): string[] {
  const center = letters[0].toLowerCase();
  const letterSet = new Set(letters.map((l) => l.toLowerCase()));
  const answers: string[] = [];

  for (let len = 4; len <= 12; len++) {
    const words = getWordSet(len);
    for (const word of words) {
      // Must contain center letter
      if (!word.includes(center)) continue;
      // All letters must be from the set (reuse allowed)
      if ([...word].every((ch) => letterSet.has(ch))) {
        answers.push(word.toUpperCase());
      }
    }
  }

  return answers.sort();
}

// ── Component ──────────────────────────────────────────────────────────────

export default function WordBloomGame({ puzzle }: { puzzle: WordBloomPuzzle }) {
  const letters = puzzle.letters;
  const center = letters[0];
  const outer = letters.slice(1);

  const [input, setInput] = useState("");
  const [found, setFound] = useState<string[]>(() =>
    loadState(puzzle.puzzle_date)
  );
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "pangram";
  } | null>(null);
  const [shake, setShake] = useState(false);
  const [shared, setShared] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { stats, recordGame } = useGameStats("word-bloom", puzzle.puzzle_date);

  // Compute all valid answers once
  const allAnswers = useMemo(() => computeAllAnswers(letters), [letters]);

  const maxScore = useMemo(
    () => allAnswers.reduce((sum, w) => sum + scoreWord(w, letters), 0),
    [allAnswers, letters]
  );

  const currentScore = useMemo(
    () => found.reduce((sum, w) => sum + scoreWord(w, letters), 0),
    [found, letters]
  );

  const rank = getRank(currentScore, maxScore);
  const nextRank = getNextRank(currentScore, maxScore);
  const progressPct = maxScore > 0 ? (currentScore / maxScore) * 100 : 0;

  // Persist found words
  useEffect(() => {
    saveState(puzzle.puzzle_date, found);
  }, [found, puzzle.puzzle_date]);

  // Record stats when player reaches "Full Bloom" (50%+) for the first time
  useEffect(() => {
    if (found.length > 0 && currentScore >= maxScore * 0.5) {
      recordGame(true, found.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScore]);

  const showMessage = useCallback(
    (text: string, type: "success" | "error" | "pangram") => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
      setMessage({ text, type });
      messageTimeoutRef.current = setTimeout(() => setMessage(null), 1800);
    },
    []
  );

  const handleSubmit = useCallback(() => {
    const word = input.trim().toUpperCase();
    setInput("");

    if (word.length < 4) {
      showMessage("Too short — need 4+ letters", "error");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (!word.includes(center)) {
      showMessage(`Must include center letter ${center}`, "error");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    const letterSet = new Set(letters.map((l) => l.toUpperCase()));
    if (![...word].every((ch) => letterSet.has(ch))) {
      showMessage("Uses letters not in the bloom", "error");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (found.includes(word)) {
      showMessage("Already found!", "error");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (!isValidEnglishWord(word.toLowerCase())) {
      showMessage("Not in word list", "error");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    // Valid word!
    const pan = isPangram(word, letters);
    const pts = scoreWord(word, letters);
    setFound((prev) => [...prev, word].sort());

    if (pan) {
      showMessage(`Pangram! +${pts} points`, "pangram");
    } else {
      showMessage(
        pts === 1 ? "+1 point" : `+${pts} points`,
        "success"
      );
    }
  }, [input, center, letters, found, showMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const addLetter = useCallback((letter: string) => {
    setInput((prev) => prev + letter);
  }, []);

  const handleShuffle = useCallback(() => {
    // We don't mutate puzzle data — just shuffle the outer petals visually
    // This is handled by shuffling the render order
    setShuffleKey((k) => k + 1);
  }, []);

  const [shuffleKey, setShuffleKey] = useState(0);

  // Shuffled outer letters
  const shuffledOuter = useMemo(() => {
    const arr = [...outer];
    // Fisher-Yates seeded by shuffleKey
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (shuffleKey * 7 + i * 13) % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [outer, shuffleKey]);

  const handleShare = async () => {
    const pct = Math.round(progressPct);
    const pangramCount = found.filter((w) => isPangram(w, letters)).length;
    const text = [
      `Word Bloom ${puzzle.puzzle_date}`,
      `${rank.label} — ${currentScore}/${maxScore} points (${pct}%)`,
      `${found.length} words found${pangramCount > 0 ? ` (${pangramCount} pangram${pangramCount > 1 ? "s" : ""})` : ""}`,
      `gamesite.app/daily/word-bloom`,
    ].join("\n");
    const ok = await shareOrCopy(text);
    if (ok) {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  // ── Petal positions (hexagonal flower layout) ────────────────────────────
  const petalPositions = [
    { x: 0, y: -72 },   // top
    { x: 62, y: -36 },  // top-right
    { x: 62, y: 36 },   // bottom-right
    { x: 0, y: 72 },    // bottom
    { x: -62, y: 36 },  // bottom-left
    { x: -62, y: -36 }, // top-left
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[520px]">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl sm:text-4xl text-text-primary mb-1">
            Word Bloom
          </h1>
          <p className="text-text-muted text-sm">
            Make words using the letters. Always include the center letter.
          </p>
        </div>

        {/* Rank & progress */}
        <div className="bg-white rounded-2xl border border-border-light shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-green">
              {rank.label}
            </span>
            <span className="text-xs text-text-muted">
              {currentScore} / {maxScore} pts
              {nextRank && (
                <span className="ml-1 text-text-dim">
                  — {Math.ceil(maxScore * (nextRank.pct / 100)) - currentScore} to{" "}
                  {nextRank.label}
                </span>
              )}
            </span>
          </div>
          <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-green transition-all duration-500 ease-out"
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </div>
        </div>

        {/* Message toast */}
        <div className="h-8 flex items-center justify-center mb-2">
          {message && (
            <span
              className={`text-sm font-semibold px-4 py-1 rounded-full animate-[fade-in_0.15s_ease]
                ${
                  message.type === "pangram"
                    ? "bg-amber/10 text-amber"
                    : message.type === "success"
                      ? "bg-green/10 text-green"
                      : "bg-red-50 text-red-500"
                }`}
            >
              {message.text}
            </span>
          )}
        </div>

        {/* Flower layout */}
        <div className="flex justify-center mb-6">
          <div className="relative" style={{ width: 200, height: 200 }}>
            {/* Center petal */}
            <button
              onClick={() => addLetter(center)}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                         w-16 h-16 rounded-full bg-green text-white
                         font-bold text-2xl flex items-center justify-center
                         hover:bg-green/90 active:scale-95 transition-all
                         shadow-md cursor-pointer select-none"
            >
              {center}
            </button>
            {/* Outer petals */}
            {shuffledOuter.map((letter, i) => {
              const pos = petalPositions[i];
              return (
                <button
                  key={`${letter}-${i}-${shuffleKey}`}
                  onClick={() => addLetter(letter)}
                  className="absolute left-1/2 top-1/2
                             w-14 h-14 rounded-full bg-surface border-2 border-border-light
                             text-text-primary font-bold text-xl
                             flex items-center justify-center
                             hover:bg-green/10 hover:border-green/40
                             active:scale-95 transition-all
                             cursor-pointer select-none"
                  style={{
                    transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                  }}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Input area */}
        <div className="bg-white rounded-2xl border border-border-light shadow-sm p-4 sm:p-6 mb-4">
          <div className="flex gap-2 mb-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              inputMode="none"
              placeholder="Tap the petals..."
              autoComplete="off"
              autoCapitalize="characters"
              className={`flex-1 rounded-xl border-2 px-4 py-3 text-center text-lg
                         font-semibold tracking-widest uppercase
                         focus:outline-none focus:border-green
                         ${shake ? "border-red-400 animate-[shake_0.4s_ease-in-out]" : "border-border-light"}`}
            />
          </div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setInput((prev) => prev.slice(0, -1))}
              className="rounded-full border border-border-light px-5 py-2
                         text-sm font-semibold text-text-muted hover:bg-surface
                         transition-colors"
            >
              Delete
            </button>
            <button
              onClick={handleShuffle}
              className="rounded-full border border-border-light px-5 py-2
                         text-sm font-semibold text-text-muted hover:bg-surface
                         transition-colors"
            >
              Shuffle
            </button>
            <button
              onClick={handleSubmit}
              disabled={input.trim().length === 0}
              className="rounded-full bg-green px-6 py-2 text-sm font-semibold
                         text-white hover:bg-green/90 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Enter
            </button>
          </div>
        </div>

        {/* Found words */}
        <div className="bg-white rounded-2xl border border-border-light shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-muted">
              Found Words ({found.length}/{allAnswers.length})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowStats(true)}
                aria-label="View stats"
                className="w-8 h-8 flex items-center justify-center rounded-full
                           text-text-dim hover:text-text-primary hover:bg-surface
                           transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="12" width="4" height="8" rx="1" />
                  <rect x="10" y="6" width="4" height="14" rx="1" />
                  <rect x="16" y="2" width="4" height="18" rx="1" />
                </svg>
              </button>
              <button
                onClick={handleShare}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  shared
                    ? "bg-green text-white"
                    : "border border-border-light text-text-muted hover:bg-surface"
                }`}
              >
                {shared ? "Copied!" : "Share"}
              </button>
            </div>
          </div>

          {found.length === 0 ? (
            <p className="text-text-dim text-sm text-center py-4">
              No words found yet. Start typing!
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {found.map((word) => (
                <span
                  key={word}
                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    isPangram(word, letters)
                      ? "bg-amber/10 text-amber border border-amber/30"
                      : "bg-green/10 text-green"
                  }`}
                >
                  {word}
                  <span className="ml-1 opacity-60">
                    +{scoreWord(word, letters)}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Rules */}
        <details className="mt-4 text-sm text-text-muted">
          <summary className="cursor-pointer hover:text-text-secondary transition-colors">
            How to play
          </summary>
          <ul className="mt-2 space-y-1 pl-4 list-disc">
            <li>Make words using the 7 available letters.</li>
            <li>Every word must include the <strong className="text-green">center letter</strong>.</li>
            <li>Words must be at least 4 letters long.</li>
            <li>Letters can be reused in a single word.</li>
            <li>4-letter words = 1 point. Longer words = 1 point per letter.</li>
            <li>
              <strong className="text-amber">Pangrams</strong> (using all 7
              letters) earn +7 bonus points!
            </li>
          </ul>
        </details>

        <StatsModal
          open={showStats}
          onClose={() => setShowStats(false)}
          stats={stats}
          gameName="Word Bloom"
          color="green"
        />
      </div>
    </div>
  );
}
