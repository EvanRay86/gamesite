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
// Component
// ---------------------------------------------------------------------------

export default function GlobleGame() {
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const target = useMemo(() => getGloblePuzzle(today), [today]);
  const { stats, recordGame } = useGameStats("globle", today);

  // Restore saved state from localStorage
  const savedKey = `globle-guesses-${today}`;
  const [guesses, setGuesses] = useState<Guess[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(savedKey);
      if (raw) {
        const saved: { code: string; distance: number; pct: number }[] = JSON.parse(raw);
        return saved
          .map((s) => {
            const country = globleCountries.find((c) => c.code === s.code);
            if (!country) return null;
            return { country, distance: s.distance, pct: s.pct };
          })
          .filter(Boolean) as Guess[];
      }
    } catch { /* ignore */ }
    return [];
  });

  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const won = guesses.some((g) => g.country.code === target.code);

  // Persist guesses
  useEffect(() => {
    if (guesses.length > 0) {
      const data = guesses.map((g) => ({
        code: g.country.code,
        distance: g.distance,
        pct: g.pct,
      }));
      localStorage.setItem(savedKey, JSON.stringify(data));
    }
  }, [guesses, savedKey]);

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
        recordGame(true, updated.length);
        setShowStats(true);
      }
    },
    [won, guesses, target, recordGame],
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

  // Build share text
  const shareText = useMemo(() => {
    if (!won) return "";
    const squares = guesses.map((g) => {
      if (g.pct >= 95) return "🟥";
      if (g.pct >= 75) return "🟧";
      if (g.pct >= 55) return "🟨";
      if (g.pct >= 35) return "🟩";
      return "🟦";
    });
    return `🌍 Globle ${today}\n🎯 ${guesses.length} guesses\n${squares.join("")}\nhttps://playdailygames.com/daily/globle`;
  }, [won, guesses, today]);

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

  // Globe guesses (for the component)
  const globeGuesses = useMemo(
    () => guesses.map((g) => ({ country: g.country, distance: g.distance })),
    [guesses],
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          🌍 Globle
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Guess the mystery country. The hotter the color, the closer you are!
        </p>
      </div>

      {/* Globe */}
      <div className="mx-auto mb-6 max-w-lg rounded-2xl bg-zinc-900/60 ring-1 ring-white/10 shadow-xl overflow-hidden" style={{ height: "min(420px, 60vw)" }}>
        <GlobleGlobe
          guesses={globeGuesses}
          target={target}
          won={won}
        />
      </div>

      {/* Input */}
      {!won && (
        <div className="relative mb-4">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestions(true);
              setError("");
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder="Type a country name..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-teal/60 focus:ring-2 focus:ring-teal/30 transition-all"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {error && (
            <p className="mt-1 text-sm text-red-400">{error}</p>
          )}

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
        </div>
      )}

      {/* Win banner */}
      {won && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-green-900/50 to-teal-900/50 p-5 ring-1 ring-green-500/30 text-center">
          <p className="text-xl font-bold text-green-400">
            {target.flag} {target.name}!
          </p>
          <p className="mt-1 text-sm text-zinc-300">
            Found in <strong>{guesses.length}</strong> guess{guesses.length !== 1 ? "es" : ""}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={handleShare}
              className="rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-teal-dark active:scale-95 transition-all"
            >
              {copied ? "Copied!" : "Share result"}
            </button>
            <button
              onClick={() => setShowStats(true)}
              className="rounded-full bg-zinc-700 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-zinc-600 active:scale-95 transition-all"
            >
              Stats
            </button>
          </div>
        </div>
      )}

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
                <span className="text-lg flex-shrink-0">{g.country.flag}</span>
                <span className="flex-1 text-sm font-medium text-white truncate">
                  {g.country.name}
                </span>
                {isTarget ? (
                  <span className="text-sm font-bold text-green-400">
                    ✓ Correct!
                  </span>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <span>{Math.round(g.distance).toLocaleString()} km</span>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Statistics</h3>
              <button
                onClick={() => setShowStats(false)}
                className="text-zinc-500 hover:text-white transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center mb-4">
              {[
                { label: "Played", value: stats.gamesPlayed },
                {
                  label: "Win %",
                  value: stats.gamesPlayed
                    ? Math.round(
                        (stats.gamesWon / stats.gamesPlayed) * 100,
                      )
                    : 0,
                },
                { label: "Current", value: stats.currentStreak },
                { label: "Max", value: stats.maxStreak },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-zinc-500">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Guess distribution */}
            {Object.keys(stats.guessDistribution).length > 0 && (
              <div className="mt-4">
                <h4 className="mb-2 text-sm font-semibold text-zinc-400">
                  Guess Distribution
                </h4>
                {Object.entries(stats.guessDistribution)
                  .sort(([a], [b]) => {
                    if (a === "X") return 1;
                    if (b === "X") return -1;
                    return Number(a) - Number(b);
                  })
                  .map(([key, count]) => {
                    const max = Math.max(
                      ...Object.values(stats.guessDistribution),
                    );
                    const pct = max > 0 ? (count / max) * 100 : 0;
                    return (
                      <div
                        key={key}
                        className="mb-1 flex items-center gap-2 text-sm"
                      >
                        <span className="w-4 text-right text-zinc-400">
                          {key}
                        </span>
                        <div
                          className="rounded bg-teal px-2 py-0.5 text-right text-xs font-semibold text-white"
                          style={{
                            minWidth: "1.5rem",
                            width: `${Math.max(8, pct)}%`,
                          }}
                        >
                          {count}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {won && (
              <button
                onClick={handleShare}
                className="mt-4 w-full rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-teal-dark active:scale-95 transition-all"
              >
                {copied ? "Copied!" : "Share result"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
