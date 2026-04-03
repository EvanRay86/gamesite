"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { WordBloomPuzzle } from "@/types/word-bloom";
import { isValidEnglishWord } from "@/lib/dictionary";
import { getWordSet } from "@/lib/dictionary";
import { shareOrCopy } from "@/lib/share";
import XShareButton from "@/components/XShareButton";
import { useGameStats } from "@/hooks/useGameStats";
import StatsModal from "@/components/StatsModal";

const TIME_LIMIT = 60;

export type WordBloomMode = "daily" | "quickplay" | "multiplayer";

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

type Phase = "splash" | "playing" | "endless" | "results";

// ── Multiplayer state ──────────────────────────────────────────────────────
interface MultiplayerState {
  roomId: string;
  opponentName: string;
  opponentScore: number;
  opponentWords: number;
  opponentFinished: boolean;
  isHost: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  puzzle: WordBloomPuzzle;
  mode?: WordBloomMode;
}

export default function WordBloomGame({ puzzle, mode = "daily" }: Props) {
  const letters = puzzle.letters;
  const center = letters[0];
  const outer = letters.slice(1);

  const isDaily = mode === "daily";
  const isMultiplayer = mode === "multiplayer";
  const savedGame = useMemo(
    () => (isDaily ? loadSavedGame(puzzle.puzzle_date) : null),
    [puzzle.puzzle_date, isDaily]
  );

  const [phase, setPhase] = useState<Phase>(
    isDaily && savedGame?.finished ? "results" : "splash"
  );
  const [input, setInput] = useState("");
  const [found, setFound] = useState<string[]>(
    isDaily && savedGame?.found ? savedGame.found : []
  );
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
  const [submitted, setSubmitted] = useState(
    isDaily && savedGame?.finished ? true : false
  );
  const [showTimesUp, setShowTimesUp] = useState(false);
  const [dailyScore, setDailyScore] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Multiplayer state
  const [mp, setMp] = useState<MultiplayerState | null>(null);
  const mpChannelRef = useRef<ReturnType<typeof import("@supabase/supabase-js").createClient> | null>(null);

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

  // ── Timer (only in "playing" phase) ────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setPhase("endless");
          setShowTimesUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // ── Auto-submit score when daily timer expires ────────────────────────
  useEffect(() => {
    if (!showTimesUp || !isDaily) return;
    // Lock in the daily score at time of expiry
    setDailyScore(currentScore);
    // Save progress
    recordGame(currentScore > 0, found.length);
    saveGame(puzzle.puzzle_date, {
      found,
      score: currentScore,
      finished: true,
      playerName,
    });
    // Auto-submit to leaderboard if player has a name
    if (playerName.trim()) {
      fetch("/api/word-bloom/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: playerName.trim(),
          score: currentScore,
          words: found.length,
          date: puzzle.puzzle_date,
        }),
      }).catch(() => {});
      setSubmitted(true);
    }
    // Fetch leaderboard
    fetch(`/api/word-bloom/leaderboard?date=${puzzle.puzzle_date}`)
      .then((r) => r.json())
      .then((data) => setLeaderboard(data.entries ?? []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTimesUp]);

  // ── Broadcast score in multiplayer ─────────────────────────────────────
  useEffect(() => {
    if (!isMultiplayer || !mp) return;
    // Broadcast score updates via Supabase channel
    const channel = (mpChannelRef.current as unknown as { channel?: { send: (msg: unknown) => void } })?.channel;
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "score",
        payload: { score: currentScore, words: found.length },
      });
    }
  }, [currentScore, found.length, isMultiplayer, mp]);

  // ── End-of-game ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "results") return;

    if (isDaily) {
      recordGame(currentScore > 0, found.length);
      saveGame(puzzle.puzzle_date, {
        found,
        score: currentScore,
        finished: true,
        playerName,
      });
    }

    // Fetch leaderboard for daily
    if (isDaily) {
      fetch(`/api/word-bloom/leaderboard?date=${puzzle.puzzle_date}`)
        .then((r) => r.json())
        .then((data) => setLeaderboard(data.entries ?? []))
        .catch(() => {});
    }
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

  const finishGame = useCallback(() => {
    setPhase("results");
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
    if (phase !== "playing" && phase !== "endless") return;
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
    if (submitted) return; // Already submitted (e.g. auto-submitted on timer expiry)
    savePlayerName(playerName.trim());

    // For daily mode, use the locked-in score from timer expiry
    const scoreToSubmit = isDaily && dailyScore !== null ? dailyScore : currentScore;

    try {
      await fetch("/api/word-bloom/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: playerName.trim(),
          score: scoreToSubmit,
          words: found.length,
          date: puzzle.puzzle_date,
        }),
      });
    } catch {
      // silent fail
    }

    setSubmitted(true);
    if (isDaily) {
      saveGame(puzzle.puzzle_date, {
        found,
        score: scoreToSubmit,
        finished: true,
        playerName: playerName.trim(),
      });
    }

    try {
      const res = await fetch(
        `/api/word-bloom/leaderboard?date=${puzzle.puzzle_date}`
      );
      const data = await res.json();
      setLeaderboard(data.entries ?? []);
    } catch {
      // silent
    }
  }, [playerName, currentScore, found, puzzle.puzzle_date, isDaily, submitted, dailyScore]);

  const getShareText = useCallback(() => {
    const pct = Math.round(progressPct);
    const pangramCount = found.filter((w) => isPangram(w, letters)).length;
    const modeLabel =
      mode === "quickplay" ? "Quickplay" : mode === "multiplayer" ? "Duel" : "";
    return [
      `Word Bloom ${modeLabel ? modeLabel + " " : ""}${puzzle.puzzle_date}`,
      `${rank.label} — ${currentScore} pts (${pct}%)`,
      `${found.length} words${phase === "endless" ? "" : " in 60s"}${pangramCount > 0 ? ` (${pangramCount} pangram${pangramCount > 1 ? "s" : ""})` : ""}`,
      `gamesite.app/daily/word-bloom`,
    ].join("\n");
  }, [progressPct, found, letters, mode, puzzle.puzzle_date, rank.label, currentScore, phase]);

  const handleShare = async () => {
    const ok = await shareOrCopy(getShareText());
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

  const timerPct = (timeLeft / TIME_LIMIT) * 100;
  const timerColor =
    timeLeft > 30 ? "#22C55E" : timeLeft > 10 ? "#F7B731" : "#FF6B6B";

  // ── Flower layout (shared between playing/endless) ─────────────────────
  const renderFlower = () => (
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
  );

  // ── Input area (shared between playing/endless) ────────────────────────
  const renderInput = () => (
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
  );

  // ── Found words compact list ───────────────────────────────────────────
  const renderFoundWords = () =>
    found.length > 0 ? (
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
    ) : null;

  // ════════════════════════════════════════════════════════════════════════
  // SPLASH SCREEN
  // ════════════════════════════════════════════════════════════════════════
  if (phase === "splash") {
    const alreadyPlayed = isDaily && savedGame?.finished;

    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-[420px] text-center">
          <h1 className="font-display text-4xl text-text-primary mb-2">
            Word Bloom
          </h1>
          {mode === "quickplay" && (
            <span className="inline-block rounded-full bg-purple/10 text-purple px-3 py-1 text-xs font-semibold mb-2">
              Quickplay
            </span>
          )}
          {isMultiplayer && (
            <span className="inline-block rounded-full bg-coral/10 text-coral px-3 py-1 text-xs font-semibold mb-2">
              Multiplayer
            </span>
          )}
          <p className="text-text-muted mb-2">
            Make words from 7 letters. Always use the center.
          </p>
          <p className="text-text-muted mb-6 text-sm">
            You have <strong className="text-green">60 seconds</strong> — go
            fast!
          </p>

          {alreadyPlayed ? (
            <div className="space-y-3">
              <p className="text-sm text-text-muted">
                You scored{" "}
                <strong className="text-green">{savedGame.score} pts</strong>{" "}
                today.
              </p>
              <button
                onClick={() => setPhase("results")}
                className="rounded-full bg-green px-8 py-3 text-lg font-bold text-white
                           hover:bg-green/90 transition-colors"
              >
                View Results
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

          <div className="mt-8 text-left bg-white rounded-2xl border border-border-light p-4 text-sm text-text-muted">
            <ul className="space-y-1.5 pl-4 list-disc">
              <li>
                Every word must include the{" "}
                <strong className="text-green">center letter</strong>.
              </li>
              <li>Words must be at least 4 letters.</li>
              <li>Letters can be reused.</li>
              <li>4-letter words = 1 pt. Longer = 1 pt per letter.</li>
              <li>
                <strong className="text-amber">Pangrams</strong> (all 7
                letters) = +7 bonus!
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // ENDLESS PHASE (timer expired — show modal or free play)
  // ════════════════════════════════════════════════════════════════════════
  if (phase === "endless") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-4">
        <div className="w-full max-w-[520px]">
          {/* Score header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-text-muted">
              {showTimesUp ? "" : "Endless Mode"}
            </span>
            <span className="text-sm font-semibold text-text-muted">
              {currentScore} pts &middot; {found.length} words
            </span>
          </div>

          {/* Time's up prompt — shown once, then dismissed */}
          {showTimesUp && (
            <div className="bg-white rounded-2xl border border-border-light shadow-sm p-5 mb-4 text-center">
              <p className="text-lg font-bold text-text-primary mb-1">
                Time&apos;s up!
              </p>
              <p className="text-3xl font-bold text-green mb-1">
                {(isDaily ? dailyScore ?? currentScore : currentScore)} pts
              </p>
              <p className="text-text-muted text-sm mb-1">
                {found.length} words &middot; {rank.label}
              </p>
              {isDaily && submitted && (
                <p className="text-xs text-green mb-3">Score submitted!</p>
              )}
              {isDaily && !submitted && (
                <p className="text-xs text-text-muted mb-3">Enter a name on the results screen to submit your score.</p>
              )}
              {!isDaily && (
                <div className="mb-3" />
              )}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={finishGame}
                  className="rounded-full bg-green px-6 py-2.5 text-sm font-semibold
                             text-white hover:bg-green/90 transition-colors"
                >
                  See Results
                </button>
                <button
                  onClick={() => setShowTimesUp(false)}
                  className="rounded-full border border-border-light px-6 py-2.5
                             text-sm font-semibold text-text-muted hover:bg-surface
                             transition-colors"
                >
                  Keep Going
                </button>
              </div>
            </div>
          )}

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

          {renderFlower()}
          {renderInput()}

          {/* Done button always visible in endless */}
          <div className="text-center mb-3">
            <button
              onClick={finishGame}
              className="text-sm font-semibold text-green hover:text-green/80 transition-colors"
            >
              Done — see results
            </button>
          </div>

          {renderFoundWords()}
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
          {/* Multiplayer result */}
          {isMultiplayer && mp && (
            <div className="bg-white rounded-2xl border border-border-light shadow-sm p-5 mb-4 text-center">
              <h2 className="font-display text-2xl text-text-primary mb-3">
                {currentScore > mp.opponentScore
                  ? "You Win!"
                  : currentScore < mp.opponentScore
                    ? "You Lose"
                    : "It's a Tie!"}
              </h2>
              <div className="flex justify-center gap-8">
                <div>
                  <p className="text-2xl font-bold text-green">
                    {currentScore}
                  </p>
                  <p className="text-xs text-text-muted">You</p>
                </div>
                <div className="text-2xl font-bold text-text-dim self-center">
                  vs
                </div>
                <div>
                  <p className="text-2xl font-bold text-coral">
                    {mp.opponentScore}
                  </p>
                  <p className="text-xs text-text-muted">{mp.opponentName}</p>
                </div>
              </div>
            </div>
          )}

          {/* Score summary */}
          <div className="bg-white rounded-2xl border border-border-light shadow-sm p-6 text-center mb-4">
            <h2 className="font-display text-3xl text-text-primary mb-1">
              {rank.label}
            </h2>
            <p className="text-4xl font-bold text-green mb-1">
              {isDaily && dailyScore !== null ? dailyScore : currentScore}
            </p>
            <p className="text-text-muted text-sm mb-4">
              {found.length} words &middot; {Math.round(progressPct)}% of max
            </p>
            {isDaily && dailyScore !== null && currentScore > dailyScore && (
              <p className="text-xs text-text-muted mb-2">
                +{currentScore - dailyScore} pts in endless mode (not scored)
              </p>
            )}

            <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden mb-4">
              <div
                className="h-full rounded-full bg-green transition-all duration-500 ease-out"
                style={{ width: `${Math.min(progressPct, 100)}%` }}
              />
            </div>

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
              <XShareButton getText={getShareText} />
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

          {/* Leaderboard submit (daily only, first play only) */}
          {isDaily && !submitted && (
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
          {isDaily && (
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
                          {i === 0
                            ? "🥇"
                            : i === 1
                              ? "🥈"
                              : i === 2
                                ? "🥉"
                                : `${i + 1}`}
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
          )}

          {/* Play again / back */}
          <div className="text-center mt-4">
            {mode === "quickplay" ? (
              <button
                onClick={() => {
                  // Force remount with new puzzle by reloading
                  window.location.reload();
                }}
                className="rounded-full bg-green px-6 py-2.5 text-sm font-semibold
                           text-white hover:bg-green/90 transition-colors"
              >
                Play Again
              </button>
            ) : (
              <button
                onClick={() => setPhase("splash")}
                className="text-sm text-text-muted hover:text-text-secondary transition-colors"
              >
                &larr; Back
              </button>
            )}
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

        {/* Multiplayer opponent score */}
        {isMultiplayer && mp && (
          <div className="flex items-center justify-between bg-coral/5 rounded-xl px-3 py-2 mb-3">
            <span className="text-sm text-text-muted">
              {mp.opponentName}
            </span>
            <span className="text-sm font-bold text-coral">
              {mp.opponentScore} pts &middot; {mp.opponentWords} words
            </span>
          </div>
        )}

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

        {renderFlower()}
        {renderInput()}
        {renderFoundWords()}
      </div>
    </div>
  );
}
