"use client";

import { useState } from "react";
import type { DuelResult, Faction } from "@/types/rift";
import { FACTION_COLORS, FACTION_NAMES } from "@/types/rift";
import { getPuzzleTypeName } from "@/lib/rift-puzzles";
import { getEloTier } from "@/lib/rift-elo";

interface RiftBattleCardProps {
  result: DuelResult;
  playerName: string;
  playerFaction: Faction;
  playerElo: number;
  onClose: () => void;
}

export default function RiftBattleCard({
  result,
  playerName,
  playerFaction,
  playerElo,
  onClose,
}: RiftBattleCardProps) {
  const [copied, setCopied] = useState(false);

  const shareText = [
    `\u2694\uFE0F RIFT BATTLE REPORT`,
    ``,
    `${result.won ? "\u2705 VICTORY" : "\u274C DEFEAT"}`,
    `${getPuzzleTypeName(result.puzzleType)} \u2022 ${result.myScore} vs ${result.opponentScore}`,
    result.hexCaptured
      ? `Hex (${result.hex.q},${result.hex.r}) conquered!`
      : `Hex (${result.hex.q},${result.hex.r}) defended`,
    `ELO: ${playerElo} (${result.eloChange >= 0 ? "+" : ""}${result.eloChange})`,
    `Rank: ${getEloTier(playerElo)}`,
    ``,
    `gamesite.app/rift`,
  ].join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-fade-in"
      >
        {/* Header band */}
        <div
          className="px-6 py-4 text-white text-center"
          style={{
            background: result.won
              ? `linear-gradient(135deg, ${FACTION_COLORS[playerFaction]}, ${FACTION_COLORS[playerFaction]}cc)`
              : "linear-gradient(135deg, #6a6a7a, #8a8a9a)",
          }}
        >
          <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">
            Rift Battle Report
          </div>
          <div className="text-3xl font-bold">
            {result.won ? "VICTORY" : "DEFEAT"}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Matchup */}
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <div
                className="text-sm font-bold"
                style={{ color: FACTION_COLORS[playerFaction] }}
              >
                {playerName || "You"}
              </div>
              <div className="text-2xl font-bold font-grotesk">{result.myScore}</div>
            </div>
            <div className="text-text-muted font-bold text-lg px-3">vs</div>
            <div className="text-center flex-1">
              <div
                className="text-sm font-bold"
                style={{ color: FACTION_COLORS[result.opponentFaction] }}
              >
                {result.opponentName || "Opponent"}
              </div>
              <div className="text-2xl font-bold font-grotesk">{result.opponentScore}</div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-surface rounded-xl px-4 py-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Puzzle</span>
              <span className="font-medium">{getPuzzleTypeName(result.puzzleType)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Hex</span>
              <span className="font-mono font-medium">
                ({result.hex.q}, {result.hex.r})
                {result.hexCaptured ? " Captured!" : ""}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">ELO</span>
              <span className="font-bold" style={{ color: result.eloChange >= 0 ? "#22C55E" : "#FF6B6B" }}>
                {playerElo} ({result.eloChange >= 0 ? "+" : ""}{result.eloChange})
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 rounded-xl bg-coral py-3 text-white font-bold
                         hover:bg-coral-dark transition-colors text-sm"
            >
              {copied ? "Copied!" : "Share Result"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-surface py-3 text-text-primary font-bold
                         hover:bg-surface-hover transition-colors text-sm"
            >
              Back to Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
