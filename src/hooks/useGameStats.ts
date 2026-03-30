"use client";

import { useState, useCallback, useEffect } from "react";

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayedDate: string;
  /** Maps guess count → frequency. Key "X" tracks losses. */
  guessDistribution: Record<string, number>;
}

const EMPTY_STATS: GameStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastPlayedDate: "",
  guessDistribution: {},
};

function storageKey(gameSlug: string): string {
  return `gamesite-stats-${gameSlug}`;
}

function loadStats(gameSlug: string): GameStats {
  if (typeof window === "undefined") return { ...EMPTY_STATS };
  try {
    const raw = localStorage.getItem(storageKey(gameSlug));
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...EMPTY_STATS, ...parsed };
    }
  } catch {
    // ignore
  }
  return { ...EMPTY_STATS };
}

function persistStats(gameSlug: string, stats: GameStats) {
  try {
    localStorage.setItem(storageKey(gameSlug), JSON.stringify(stats));
  } catch {
    // ignore
  }
}

/** Check if two ISO date strings are consecutive calendar days. */
function isConsecutiveDay(prev: string, next: string): boolean {
  if (!prev) return false;
  const d1 = new Date(prev);
  const d2 = new Date(next);
  const diff = d2.getTime() - d1.getTime();
  return diff > 0 && diff <= 86400000 * 1.5;
}

/**
 * Unified stats hook for all daily games.
 *
 * @param gameSlug  — unique identifier (e.g. "hexle", "cluster", "geo-guess")
 * @param puzzleDate — today's puzzle date string (YYYY-MM-DD)
 */
export function useGameStats(gameSlug: string, puzzleDate: string) {
  const [stats, setStats] = useState<GameStats>(() => loadStats(gameSlug));

  // Re-load when slug changes (shouldn't normally happen, but safe)
  useEffect(() => {
    setStats(loadStats(gameSlug));
  }, [gameSlug]);

  /**
   * Record a completed game.
   *
   * @param won        — did the player win?
   * @param guessCount — number of guesses used (or attempts, steps, etc.)
   */
  const recordGame = useCallback(
    (won: boolean, guessCount: number) => {
      setStats((prev) => {
        // Prevent double-recording for the same date
        if (prev.lastPlayedDate === puzzleDate) return prev;

        const newStreak = won
          ? isConsecutiveDay(prev.lastPlayedDate, puzzleDate)
            ? prev.currentStreak + 1
            : 1
          : 0;

        const dist = { ...prev.guessDistribution };
        const key = won ? String(guessCount) : "X";
        dist[key] = (dist[key] || 0) + 1;

        const updated: GameStats = {
          gamesPlayed: prev.gamesPlayed + 1,
          gamesWon: prev.gamesWon + (won ? 1 : 0),
          currentStreak: newStreak,
          maxStreak: Math.max(prev.maxStreak, newStreak),
          lastPlayedDate: puzzleDate,
          guessDistribution: dist,
        };

        persistStats(gameSlug, updated);
        return updated;
      });
    },
    [gameSlug, puzzleDate],
  );

  return { stats, recordGame };
}
