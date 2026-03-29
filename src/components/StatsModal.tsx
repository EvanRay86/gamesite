"use client";

import { useEffect, useRef } from "react";
import type { GameStats } from "@/hooks/useGameStats";
import type { GameColor } from "@/lib/game-registry";

const COLOR_MAP: Record<GameColor, string> = {
  coral: "#FF6B6B",
  teal: "#4ECDC4",
  sky: "#45B7D1",
  amber: "#F7B731",
  purple: "#A855F7",
  green: "#22C55E",
};

interface Props {
  open: boolean;
  onClose: () => void;
  stats: GameStats;
  gameName: string;
  color: GameColor;
  maxGuesses?: number;
}

export default function StatsModal({
  open,
  onClose,
  stats,
  gameName,
  color,
  maxGuesses,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const winRate =
    stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0;

  // Build distribution bars
  const dist = stats.guessDistribution;
  const maxCount = Math.max(1, ...Object.values(dist));
  const accent = COLOR_MAP[color];

  // Generate distribution keys (1..maxGuesses + "X")
  const distKeys: string[] = [];
  if (maxGuesses) {
    for (let i = 1; i <= maxGuesses; i++) distKeys.push(String(i));
  } else {
    // Fallback: use whatever keys exist, sorted
    const numericKeys = Object.keys(dist)
      .filter((k) => k !== "X")
      .sort((a, b) => Number(a) - Number(b));
    distKeys.push(...numericKeys);
  }
  distKeys.push("X");

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-[fade-in_0.2s_ease]"
    >
      <div className="bg-[#1a1a2e] rounded-2xl shadow-2xl w-[90vw] max-w-sm p-6 relative animate-[fade-up_0.3s_ease_forwards]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full
                     text-text-dim hover:text-text-primary hover:bg-white/10 transition-colors text-lg"
          aria-label="Close stats"
        >
          &times;
        </button>

        {/* Title */}
        <h2 className="font-display text-2xl text-text-primary text-center mb-5">
          {gameName} Stats
        </h2>

        {/* Stat boxes */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { value: stats.gamesPlayed, label: "Played" },
            { value: `${winRate}%`, label: "Win %" },
            { value: stats.currentStreak, label: "Streak" },
            { value: stats.maxStreak, label: "Best" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold text-text-primary">{value}</div>
              <div className="text-[11px] text-text-dim mt-0.5 uppercase tracking-wider">
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Guess distribution */}
        {distKeys.some((k) => (dist[k] || 0) > 0) && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim mb-3">
              Guess Distribution
            </h3>
            <div className="space-y-1.5">
              {distKeys.map((key) => {
                const count = dist[key] || 0;
                const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;

                return (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <span className="w-4 text-right text-text-dim font-mono text-xs shrink-0">
                      {key}
                    </span>
                    <div className="flex-1 h-5 relative">
                      <div
                        className="h-full rounded-sm flex items-center justify-end px-1.5 text-[11px] font-bold text-white transition-all duration-500"
                        style={{
                          width: `${Math.max(pct, count > 0 ? 8 : 0)}%`,
                          backgroundColor: key === "X" ? "#666" : accent,
                          minWidth: count > 0 ? "20px" : "0",
                        }}
                      >
                        {count > 0 ? count : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {stats.gamesPlayed === 0 && (
          <p className="text-center text-text-dim text-sm mt-2">
            Play your first game to see stats here!
          </p>
        )}
      </div>
    </div>
  );
}
