"use client";

import type { PlayerState, RunStats, ActId } from "@/types/netherveil";
import { ACT_CONFIG, CLASS_COLORS } from "@/types/netherveil";
import { getRelicDef } from "@/lib/netherveil/relics";
import { getClassDef } from "@/lib/netherveil/classes";

interface RunHUDProps {
  player: PlayerState;
  stats: RunStats;
  act: ActId;
  floor: number;
  deckSize: number;
  energy?: number;
  maxEnergy?: number;
}

export default function RunHUD({
  player,
  stats,
  act,
  floor,
  deckSize,
  energy,
  maxEnergy,
}: RunHUDProps) {
  const classDef = getClassDef(player.classId);
  const hpPercent = Math.max(0, (player.hp / player.maxHp) * 100);
  const hpColor =
    hpPercent > 50 ? "#22C55E" : hpPercent > 25 ? "#F59E0B" : "#EF4444";

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2 rounded-xl bg-black/30 backdrop-blur-sm border border-white/5 text-sm">
      {/* Class icon */}
      <div className="flex items-center gap-1.5">
        <span className="text-lg">{classDef.emoji}</span>
        <span className="font-semibold" style={{ color: classDef.color }}>
          {classDef.name}
        </span>
      </div>

      {/* HP bar */}
      <div className="flex items-center gap-1.5">
        <span className="text-red-400 text-xs">❤️</span>
        <div className="w-28 h-3 bg-black/50 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${hpPercent}%`, backgroundColor: hpColor }}
          />
        </div>
        <span className="text-xs text-slate-300 tabular-nums">
          {player.hp}/{player.maxHp}
        </span>
      </div>

      {/* Energy */}
      {energy !== undefined && maxEnergy !== undefined && (
        <div className="flex items-center gap-1">
          <span className="text-blue-400 text-xs">⚡</span>
          <span className="text-xs font-bold text-blue-300 tabular-nums">
            {energy}/{maxEnergy}
          </span>
        </div>
      )}

      {/* Gold */}
      <div className="flex items-center gap-1">
        <span className="text-amber-400 text-xs">🪙</span>
        <span className="text-xs text-amber-300 tabular-nums">{player.gold}</span>
      </div>

      {/* Deck */}
      <div className="flex items-center gap-1">
        <span className="text-xs">🃏</span>
        <span className="text-xs text-slate-300 tabular-nums">{deckSize}</span>
      </div>

      {/* Floor */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-400">
          {ACT_CONFIG[act].emoji} F{floor}
        </span>
      </div>

      {/* Score */}
      <div className="flex items-center gap-1 ml-auto">
        <span className="text-xs text-slate-400">Score:</span>
        <span className="text-xs font-bold text-white tabular-nums">
          {stats.score}
        </span>
      </div>

      {/* Relics */}
      {player.relics.length > 0 && (
        <div className="flex items-center gap-0.5">
          {player.relics.map((relicId) => {
            const def = getRelicDef(relicId);
            return (
              <span
                key={relicId}
                title={`${def.name}: ${def.desc}`}
                className="text-sm cursor-help"
              >
                {def.emoji}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
