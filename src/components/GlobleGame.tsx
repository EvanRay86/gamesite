"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  globleCountries,
  globleCountryNames,
  haversineDistance,
  proximityPct,
  proximityColor,
  bearing,
  directionArrow,
  getGloblePuzzle,
  type GlobleCountry,
} from "@/data/globle-countries";
import { useGameStats } from "@/hooks/useGameStats";
import { shareOrCopy } from "@/lib/share";
import GlobleGlobe from "./GlobleGlobe";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Guess {
  country: GlobleCountry;
  distance: number;
  pct: number;
}

// ---------------------------------------------------------------------------
// Pick a random country (not the daily one)
// ---------------------------------------------------------------------------

function randomCountry(exclude?: string): GlobleCountry {
  const pool = exclude
    ? globleCountries.filter((c) => c.code !== exclude)
    : globleCountries;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GlobleGame() {
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const dailyTarget = useMemo(() => getGloblePuzzle(today), [today]);
  const { stats, recordGame } = useGameStats("globle", today);

  // Mode: "daily" or "quickplay"
  const [mode, setMode] = useState<"daily" | "quickplay">("daily");
  const [quickplayTarget, setQuickplayTarget] = useState<GlobleCountry>(() =>
    randomCountry(dailyTarget.code),
  );
  const [quickplayRound, setQuickplayRound] = useState(0);

  const target = mode === "daily" ? dailyTarget : quickplayTarget;

  // Restore saved daily guesses from localStorage
  const savedKey = `globle-guesses-${today}`;
  const [dailyGuesses, setDailyGuesses] = useState<Guess[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(savedKey);
      if (raw) {
        const saved: { code: string; distance: number; pct: number }[] =
          JSON.parse(raw);
        return saved
          .map((s) => {
            const country = globleCountries.find((c) => c.code === s.code);
            if (!country) return null;
            return { country, distance: s.distance, pct: s.pct };
          })
          .filter(Boolean) as Guess[];
      }
    } catch {
      /* ignore */
    }
    return [];
  });

  const [quickplayGuesses, setQuickplayGuesses] = useState<Guess[]>([]);

  const guesses = mode === "daily" ? dailyGuesses : quickplayGuesses;
  const setGuesses = mode === "daily" ? setDailyGuesses : setQuickplayGuesses;

  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const won = guesses.some((g) => g.country.code === target.code);
  const dailyWon = dailyGuesses.some(
    (g) => g.country.code === dailyTarget.code,
  );

  // Persist daily guesses
  useEffect(() => {
    if (dailyGuesses.length > 0) {
      const data = dailyGuesses.map((g) => ({
        code: g.country.code,
        distance: g.distance,
        pct: g.pct,
      }));
      localStorage.setItem(savedKey, JSON.stringify(data));
    }
  }, [dailyGuesses, savedKey]);

  // Filtered suggestions
  const suggestions = useMemo(() => {
    const q = input.trim().toLowerCase();
    if (q.length < 1) return [];
    const guessedCodes = new Set(guesses.map((g) => g.country.code));
    return globleCountryNames
      .filter(
        (name) =>
          name.toLowerCase().includes(q) &&
          !guessedCodes.has(
            globleCountries.find((c) => c.name === name)!.code,
          ),
      )
      .slice(0, 6);
  }, [input, guesses]);

  // Submit a guess
  const submitGuess = useCallback(
    (countryName: string) => {
      if (won) return;
      const country = globleCountries.find(
        (c) => c.name.toLowerCase() === countryName.toLowerCase(),
      );
      if (!country) {
        setError("Country not found. Try again.");
        return;
      }
      if (guesses.some((g) => g.country.code === country.code)) {
        setError("Already guessed!");
        return;
      }
      setError("");
      const dist = haversineDistance(
        country.lat,
        country.lng,
        target.lat,
        target.lng,
      );
      const pct = proximityPct(dist);
      const newGuess: Guess = { country, distance: dist, pct };
      const updated = [...guesses, newGuess];
      setGuesses(updated);
      setInput("");
      setShowSuggestions(false);

      if (country.code === target.code) {
        if (mode === "daily") {
          recordGame(true, updated.length);
        }
        setShowStats(true);
      }
    },
    [won, guesses, target, recordGame, mode, setGuesses],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        submitGuess(suggestions[0]);
      } else if (input.trim()) {
        submitGuess(input.trim());
      }
    }
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Start quickplay
  const startQuickplay = useCallback(() => {
    setQuickplayTarget(randomCountry());
    setQuickplayGuesses([]);
    setQuickplayRound((r) => r + 1);
    setMode("quickplay");
    setInput("");
    setError("");
    setShowStats(false);
    setCopied(false);
    // Focus the input after mode switch
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Back to daily
  const backToDaily = useCallback(() => {
    setMode("daily");
    setInput("");
    setError("");
    setShowStats(false);
  }, []);

  // Build share text (daily only)
  const shareText = useMemo(() => {
    if (!dailyWon) return "";
    const squares = dailyGuesses.map((g) => {
      if (g.pct >= 95) return "🟥";
      if (g.pct >= 75) return "🟧";
      if (g.pct >= 55) return "🟨";
      if (g.pct >= 35) return "🟩";
      return "🟦";
    });
    return `🌍 Globle ${today}\n🎯 ${dailyGuesses.length} guesses\n${squares.join("")}\nhttps://playdailygames.com/daily/globle`;
  }, [dailyWon, dailyGuesses, today]);

  const handleShare = async () => {
    const ok = await shareOrCopy(shareText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Sorted guesses for the list (closest first)
  const sortedGuesses = useMemo(
    () => [...guesses].sort((a, b) => a.distance - b.distance),
    [guesses],
  );

  // Globe guesses (for the component) — include quickplayRound as dep to reset
  const globeGuesses = useMemo(
    () => guesses.map((g) => ({ country: g.country, distance: g.distance })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [guesses, quickplayRound],
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          🌍 Globle
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          {mode === "daily"
            ? "Guess the mystery country. The hotter the color, the closer you are!"
            : "Quickplay — practice with a random country!"}
        </p>
      </div>

      {/* Mode tabs */}
      {dailyWon && (
        <div className="mb-4 flex justify-center gap-2">
          <button
            onClick={backToDaily}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
              mode === "daily"
                ? "bg-green-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => {
              if (mode !== "quickplay") startQuickplay();
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
              mode === "quickplay"
                ? "bg-purple-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            Quickplay
          </button>
        </div>
      )}

      {/* Input — above the globe, wrapped in form to hide iOS toolbar */}
      {!won ? (
        <form
          className="relative mb-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (suggestions.length > 0) {
              submitGuess(suggestions[0]);
            } else if (input.trim()) {
              submitGuess(input.trim());
            }
          }}
        >
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showSuggestions && suggestions.length > 0}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestions(true);
              setError("");
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder="Type a country name..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-teal/60 focus:ring-2 focus:ring-teal/30 transition-all [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
            name="globle-country-search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
          />
          {error && <p className="mt-1 text-sm text-red-400">{error}</p>}

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-800 shadow-2xl"
            >
              {suggestions.map((name) => {
                const c = globleCountries.find((c) => c.name === name)!;
                return (
                  <button
                    type="button"
                    key={c.code}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-white hover:bg-zinc-700/60 transition-colors first:rounded-t-xl last:rounded-b-xl"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      submitGuess(name);
                    }}
                  >
                    <span className="text-lg">{c.flag}</span>
                    <span>{name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </form>
      ) : (
        /* Won — show banner above globe */
        <div className="mb-4 rounded-2xl bg-gradient-to-r from-green-900/50 to-teal-900/50 p-5 ring-1 ring-green-500/30 text-center">
          <p className="text-xl font-bold text-green-400">
            {target.flag} {target.name}!
          </p>
          <p className="mt-1 text-sm text-zinc-300">
            Found in <strong>{guesses.length}</strong> guess
            {guesses.length !== 1 ? "es" : ""}
          </p>
          <div className="mt-4 flex justify-center gap-3 flex-wrap">
            {mode === "daily" && (
              <button
                onClick={handleShare}
                className="rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-teal-dark active:scale-95 transition-all"
              >
                {copied ? "Copied!" : "Share result"}
              </button>
            )}
            <button
              onClick={() => setShowStats(true)}
              className="rounded-full bg-zinc-700 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-zinc-600 active:scale-95 transition-all"
            >
              Stats
            </button>
            {mode === "quickplay" && (
              <button
                onClick={startQuickplay}
                className="rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-purple-500 active:scale-95 transition-all"
              >
                Play again
              </button>
            )}
            {mode === "daily" && !dailyWon ? null : mode === "daily" && (
              <button
                onClick={startQuickplay}
                className="rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-purple-500 active:scale-95 transition-all"
              >
                Quickplay
              </button>
            )}
          </div>
        </div>
      )}

      {/* Globe */}
      <div
        className="mx-auto mb-6 max-w-lg rounded-2xl bg-zinc-900/60 ring-1 ring-white/10 shadow-xl overflow-hidden"
        style={{ height: "min(420px, 60vw)" }}
      >
        <GlobleGlobe guesses={globeGuesses} target={target} won={won} />
      </div>

      {/* Color legend */}
      <div className="mb-4 flex items-center justify-center gap-1.5">
        <span className="text-xs text-zinc-500">Far</span>
        {[0, 15, 30, 45, 60, 75, 90].map((pct) => (
          <div
            key={pct}
            className="h-3.5 w-5 rounded-sm"
            style={{ backgroundColor: proximityColor(pct) }}
          />
        ))}
        <span className="text-xs text-zinc-500">Close</span>
      </div>

      {/* Guess list */}
      {guesses.length > 0 && (
        <div className="space-y-1.5">
          <h2 className="mb-2 text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Guesses ({guesses.length})
          </h2>
          {sortedGuesses.map((g) => {
            const isTarget = g.country.code === target.code;
            const bear = bearing(
              g.country.lat,
              g.country.lng,
              target.lat,
              target.lng,
            );
            return (
              <div
                key={g.country.code}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all ${
                  isTarget
                    ? "bg-green-900/40 ring-1 ring-green-500/30"
                    : "bg-zinc-800/60"
                }`}
              >
                {/* Color bar */}
                <div
                  className="h-8 w-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: isTarget
                      ? "#22c55e"
                      : proximityColor(g.pct),
                  }}
                />
                <span className="text-lg flex-shrink-0">
                  {g.country.flag}
                </span>
                <span className="flex-1 text-sm font-medium text-white truncate">
                  {g.country.name}
                </span>
                {isTarget ? (
                  <span className="text-sm font-bold text-green-400">
                    ✓ Correct!
                  </span>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <span>
                      {Math.round(g.distance).toLocaleString()} km
                    </span>
                    <span>{directionArrow(bear)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stats modal */}
      {showStats && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowStats(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl bg-zinc-900 p-6 ring-1 ring-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Statistics</h3>
              <button
                onClick={() => setShowStats(false)}
                className="text-zinc-500 hover:text-white transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Detailed stats rows */}
            <div className="space-y-2.5 mb-5">
              {[
                { label: "Last win", value: stats.lastPlayedDate || "—" },
                {
                  label: "Today's guesses",
                  value: mode === "daily" && dailyWon
                    ? dailyGuesses.length
                    : mode === "quickplay" && won
                      ? guesses.length
                      : "—",
                },
                { label: "Games won", value: stats.gamesWon },
                { label: "Current streak", value: stats.currentStreak },
                { label: "Max streak", value: stats.maxStreak },
                {
                  label: "Avg. guesses",
                  value: stats.gamesWon > 0
                    ? Math.round(
                        Object.entries(stats.guessDistribution)
                          .filter(([k]) => k !== "X")
                          .reduce((sum, [k, v]) => sum + Number(k) * v, 0) /
                          stats.gamesWon,
                      )
                    : "—",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between border-b border-zinc-800 pb-2"
                >
                  <span className="text-sm text-zinc-400">{row.label}</span>
                  <span className="text-sm font-semibold text-white">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              {mode === "daily" && dailyWon && (
                <button
                  onClick={startQuickplay}
                  className="flex-1 rounded-full bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-purple-500 active:scale-95 transition-all"
                >
                  Practice
                </button>
              )}
              {mode === "quickplay" && won && (
                <button
                  onClick={startQuickplay}
                  className="flex-1 rounded-full bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-purple-500 active:scale-95 transition-all"
                >
                  Play again
                </button>
              )}
              {won && mode === "daily" && (
                <button
                  onClick={handleShare}
                  className="flex-1 rounded-full bg-teal px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-teal-dark active:scale-95 transition-all"
                >
                  {copied ? "Copied!" : "Share"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
