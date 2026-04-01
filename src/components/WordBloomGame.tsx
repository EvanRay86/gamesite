"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { WordBloomPuzzle } from "@/types/word-bloom";
import { isValidEnglishWord } from "@/lib/dictionary";
import { getWordSet } from "@/lib/dictionary";
import { shareOrCopy } from "@/lib/share";
import { useGameStats } from "@/hooks/useGameStats";
import StatsModal from "@/components/StatsModal";

const TIME_LIMIT = 60; // seconds

// ── Scoring ────────────────────────────────────────────────────────────────
function scoreWord(word: string, allLetters: string[]): number {
  if (word.length === 4) return 1;
  const pan = allLetters.every((l) => word.toUpperCase().includes(l));
  return word.length + (pan ? 7 : 0);
}

function isPangram(word: string, allLetters: string[]): boolean {
  return allLetters.every((l) => word.toUpperCase().includes(l));
}

// ── Rank thresholds ────────────────────────────────────────────────────────
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

// ── Persistence ────────────────────────────────────────────────────────────
function stateKey(date: string) {
  return `gamesite-word-bloom-${date}`;
}

interface SavedGame {
  found: string[];
  score: number;
  finished: boolean;
  playerName?: string;
}

function loadSavedGame(date: string): SavedGame | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(stateKey(date));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveGame(date: string, data: SavedGame) {
  try {
    localStorage.setItem(stateKey(date), JSON.stringify(data));
  } catch {
    // ignore
  }
}

function loadPlayerName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("gamesite-bloom-name") || "";
}

function savePlayerName(name: string) {
  try {
    localStorage.setItem("gamesite-bloom-name", name);
  } catch {
    // ignore
  }
}

// ── Find all valid answers ─────────────────────────────────────────────────
function computeAllAnswers(letters: string[]): string[] {
  const center = letters[0].toLowerCase();
  const letterSet = new Set(letters.map((l) => l.toLowerCase()));
  const answers: string[] = [];

  for (let len = 4; len <= 12; len++) {
    const words = getWordSet(len);
    for (const word of words) {
      if (!word.includes(center)) continue;
      if ([...word].every((ch) => letterSet.has(ch))) {
        answers.push(word.toUpperCase());
      }
    }
  }
  return answers.sort();
}

// ── Leaderboard types ──────────────────────────────────────────────────────
interface LeaderboardEntry {
  player_name: string;
  score: number;
  words_found: number;
}

type Phase = "splash" | "playing" | "results";

// ── Component ──────────────────────────────────────────────────────────────

export default function WordBloomGame({ puzzle }: { puzzle: WordBloomPuzzle }) {
  const letters = puzzle.letters;
  const center = letters[0];
  const outer = letters.slice(1);

  const savedGame = useMemo(() => loadSavedGame(puzzle.puzzle_date), [puzzle.puzzle_date]);

  const [phase, setPhase] = useState<Phase>(
    savedGame?.finished ? "results" : "splash"
  );
  const [input, setInput] = useState("");
  const [found, setFound] = useState<string[]>(savedGame?.found ?? []);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "pangram";
  } | null>(null);
  const [shake, setShake] = useState(false);
  const [shared, setShared] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [playerName, setPlayerName] = useState(() => loadPlayerName());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [submitted, setSubmitted] = useState(savedGame?.finished ?? false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { stats, recordGame } = useGameStats("word-bloom", puzzle.puzzle_date);

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
  const progressPct = maxScore > 0 ? (currentScore / maxScore) * 100 : 0;

  // ── Timer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setPhase("results");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // ── End-of-game: record stats, save, fetch leaderboard ─────────────────
  useEffect(() => {
    if (phase !== "results") return;

    recordGame(currentScore > 0, found.length);
    saveGame(puzzle.puzzle_date, {
      found,
      score: currentScore,
      finished: true,
      playerName,
    });

    // Fetch leaderboard
    fetch(`/api/word-bloom/leaderboard?date=${puzzle.puzzle_date}`)
      .then((r) => r.json())
      .then((data) => setLeaderboard(data.entries ?? []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Start game ─────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    setFound([]);
    setTimeLeft(TIME_LIMIT);
    setInput("");
    setSubmitted(false);
    setPhase("playing");
  }, []);

  const showMsg = useCallback(
    (text: string, type: "success" | "error" | "pangram") => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
      setMessage({ text, type });
      messageTimeoutRef.current = setTimeout(() => setMessage(null), 1200);
    },
    []
  );

  const handleSubmit = useCallback(() => {
    if (phase !== "playing") return;
    const word = input.trim().toUpperCase();
    setInput("");

    if (word.length < 4) {
      showMsg("Too short", "error");
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    if (!word.includes(center)) {
      showMsg(`Needs ${center}`, "error");
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    const letterSet = new Set(letters.map((l) => l.toUpperCase()));
    if (![...word].every((ch) => letterSet.has(ch))) {
      showMsg("Bad letters", "error");
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    if (found.includes(word)) {
      showMsg("Already found", "error");
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    if (!isValidEnglishWord(word.toLowerCase())) {
      showMsg("Not a word", "error");
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }

    const pan = isPangram(word, letters);
    const pts = scoreWord(word, letters);
    setFound((prev) => [...prev, word].sort());
    showMsg(pan ? `Pangram! +${pts}` : `+${pts}`, pan ? "pangram" : "success");
  }, [input, center, letters, found, showMsg, phase]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSubmit();
    },
    [handleSubmit]
  );

  const addLetter = useCallback((letter: string) => {
    setInput((prev) => prev + letter);
  }, []);

  const [shuffleKey, setShuffleKey] = useState(0);

  const shuffledOuter = useMemo(() => {
    const arr = [...outer];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (shuffleKey * 7 + i * 13) % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [outer, shuffleKey]);

  // ── Submit score to leaderboard ────────────────────────────────────────
  const submitScore = useCallback(async () => {
    if (!playerName.trim()) return;
    savePlayerName(playerName.trim());

    try {
      await fetch("/api/word-bloom/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: playerName.trim(),
          score: currentScore,
          words: found.length,
          date: puzzle.puzzle_date,
        }),
      });
    } catch {
      // silent fail
    }

    setSubmitted(true);
    saveGame(puzzle.puzzle_date, {
      found,
      score: currentScore,
      finished: true,
      playerName: playerName.trim(),
    });

    // Refresh leaderboard
    try {
      const res = await fetch(
        `/api/word-bloom/leaderboard?date=${puzzle.puzzle_date}`
      );
      const data = await res.json();
      setLeaderboard(data.entries ?? []);
    } catch {
      // silent
    }
  }, [playerName, currentScore, found, puzzle.puzzle_date]);

  const handleShare = async () => {
    const pct = Math.round(progressPct);
    const pangramCount = found.filter((w) => isPangram(w, letters)).length;
    const text = [
      `Word Bloom ${puzzle.puzzle_date}`,
      `${rank.label} — ${currentScore} pts (${pct}%)`,
      `${found.length} words in 60s${pangramCount > 0 ? ` (${pangramCount} pangram${pangramCount > 1 ? "s" : ""})` : ""}`,
      `gamesite.app/daily/word-bloom`,
    ].join("\n");
    const ok = await shareOrCopy(text);
    if (ok) {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  // ── Petal positions ────────────────────────────────────────────────────
  const petalPositions = [
    { x: 0, y: -72 },
    { x: 62, y: -36 },
    { x: 62, y: 36 },
    { x: 0, y: 72 },
    { x: -62, y: 36 },
    { x: -62, y: -36 },
  ];

  // Timer color
  const timerPct = (timeLeft / TIME_LIMIT) * 100;
  const timerColor =
    timeLeft > 30 ? "#22C55E" : timeLeft > 10 ? "#F7B731" : "#FF6B6B";

  // ════════════════════════════════════════════════════════════════════════
  // SPLASH SCREEN
  // ════════════════════════════════════════════════════════════════════════
  if (phase === "splash") {
    const alreadyPlayed = savedGame?.finished;

    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-[420px] text-center">
          <h1 className="font-display text-4xl text-text-primary mb-2">
            Word Bloom
          </h1>
          <p className="text-text-muted mb-2">
            Make words from 7 letters. Always use the center.
          </p>
          <p className="text-text-muted mb-6 text-sm">
            You have <strong className="text-green">60 seconds</strong> — go fast!
          </p>

          {alreadyPlayed ? (
            <div className="space-y-3">
              <p className="text-sm text-text-muted">
                You scored <strong className="text-green">{savedGame.score} pts</strong> today.
              </p>
              <button
                onClick={() => setPhase("results")}
                className="rounded-full bg-green px-8 py-3 text-lg font-bold text-white
                           hover:bg-green/90 transition-colors"
              >
                View Results
              </button>
              <button
                onClick={startGame}
                className="block mx-auto text-sm text-text-muted hover:text-text-secondary
                           transition-colors mt-2"
              >
                Play again (won&apos;t update leaderboard)
              </button>
            </div>
          ) : (
            <button
              onClick={startGame}
              className="rounded-full bg-green px-8 py-3 text-lg font-bold text-white
                         hover:bg-green/90 transition-colors"
            >
              Start
            </button>
          )}

          {/* Rules */}
          <div className="mt-8 text-left bg-white rounded-2xl border border-border-light p-4 text-sm text-text-muted">
            <ul className="space-y-1.5 pl-4 list-disc">
              <li>Every word must include the <strong className="text-green">center letter</strong>.</li>
              <li>Words must be at least 4 letters.</li>
              <li>Letters can be reused.</li>
              <li>4-letter words = 1 pt. Longer = 1 pt per letter.</li>
              <li>
                <strong className="text-amber">Pangrams</strong> (all 7 letters) = +7 bonus!
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // RESULTS SCREEN
  // ════════════════════════════════════════════════════════════════════════
  if (phase === "results") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[520px]">
          {/* Score summary */}
          <div className="bg-white rounded-2xl border border-border-light shadow-sm p-6 text-center mb-4">
            <h2 className="font-display text-3xl text-text-primary mb-1">
              {rank.label}
            </h2>
            <p className="text-4xl font-bold text-green mb-1">{currentScore}</p>
            <p className="text-text-muted text-sm mb-4">
              {found.length} words &middot; {Math.round(progressPct)}% of max
            </p>

            {/* Progress bar */}
            <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden mb-4">
              <div
                className="h-full rounded-full bg-green transition-all duration-500 ease-out"
                style={{ width: `${Math.min(progressPct, 100)}%` }}
              />
            </div>

            {/* Found words */}
            {found.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                {found.map((word) => (
                  <span
                    key={word}
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      isPangram(word, letters)
                        ? "bg-amber/10 text-amber border border-amber/30"
                        : "bg-green/10 text-green"
                    }`}
                  >
                    {word}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleShare}
                className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-colors ${
                  shared
                    ? "bg-green text-white"
                    : "bg-green text-white hover:bg-green/90"
                }`}
              >
                {shared ? "Copied!" : "Share Results"}
              </button>
              <button
                onClick={() => setShowStats(true)}
                className="rounded-full border border-border-light px-6 py-2.5
                           text-sm font-semibold text-text-muted hover:bg-surface
                           transition-colors"
              >
                Stats
              </button>
            </div>
          </div>

          {/* Leaderboard submit */}
          {!submitted && (
            <div className="bg-white rounded-2xl border border-border-light shadow-sm p-4 mb-4">
              <h3 className="text-sm font-semibold text-text-muted mb-3 text-center">
                Submit to Today&apos;s Leaderboard
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value.slice(0, 20))}
                  placeholder="Your name..."
                  maxLength={20}
                  className="flex-1 rounded-xl border-2 border-border-light px-3 py-2
                             text-sm font-semibold focus:outline-none focus:border-green"
                />
                <button
                  onClick={submitScore}
                  disabled={!playerName.trim()}
                  className="rounded-full bg-green px-5 py-2 text-sm font-semibold
                             text-white hover:bg-green/90 transition-colors
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Submit
                </button>
              </div>
            </div>
          )}

          {/* Daily Leaderboard */}
          <div className="bg-white rounded-2xl border border-border-light shadow-sm p-4">
            <h3 className="text-sm font-semibold text-text-muted mb-3 text-center">
              Daily Leaderboard
            </h3>
            {leaderboard.length === 0 ? (
              <p className="text-text-dim text-sm text-center py-3">
                {submitted
                  ? "Loading..."
                  : "No scores yet today. Be the first!"}
              </p>
            ) : (
              <div className="space-y-1.5">
                {leaderboard.map((entry, i) => (
                  <div
                    key={`${entry.player_name}-${i}`}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                      i === 0
                        ? "bg-amber/10"
                        : i === 1
                          ? "bg-gray-100"
                          : i === 2
                            ? "bg-amber/5"
                            : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold text-text-dim w-5 text-right">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                      </span>
                      <span className="text-sm font-semibold text-text-primary">
                        {entry.player_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-dim">
                        {entry.words_found} words
                      </span>
                      <span className="text-sm font-bold text-green">
                        {entry.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Play again */}
          <div className="text-center mt-4">
            <button
              onClick={() => setPhase("splash")}
              className="text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              &larr; Back
            </button>
          </div>

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

  // ════════════════════════════════════════════════════════════════════════
  // PLAYING SCREEN
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-4">
      <div className="w-full max-w-[520px]">
        {/* Timer bar + score */}
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-2xl font-bold font-mono"
            style={{ color: timerColor }}
          >
            {timeLeft}s
          </span>
          <span className="text-sm font-semibold text-text-muted">
            {currentScore} pts &middot; {found.length} words
          </span>
        </div>
        <div className="w-full h-2 bg-surface rounded-full mb-4 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${timerPct}%`, backgroundColor: timerColor }}
          />
        </div>

        {/* Message toast */}
        <div className="h-7 flex items-center justify-center mb-1">
          {message && (
            <span
              className={`text-sm font-semibold px-4 py-0.5 rounded-full animate-[fade-in_0.15s_ease]
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
        <div className="flex justify-center mb-4">
          <div className="relative" style={{ width: 200, height: 200 }}>
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
        <div className="bg-white rounded-2xl border border-border-light shadow-sm p-4 mb-3">
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
              onClick={() => setShuffleKey((k) => k + 1)}
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

        {/* Found words compact */}
        {found.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center">
            {found.map((word) => (
              <span
                key={word}
                className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  isPangram(word, letters)
                    ? "bg-amber/10 text-amber"
                    : "bg-green/10 text-green"
                }`}
              >
                {word}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
