"use client";

import type { PlayerState, CardInstance } from "@/types/netherveil";
import { getCardDef, getDescription } from "@/lib/netherveil/cards";
import { RARITY_COLORS } from "@/types/netherveil";
import { useState } from "react";

interface RestScreenProps {
  player: PlayerState;
  onHeal: () => void;
  onUpgrade: (instanceId: string) => void;
}

export default function RestScreen({ player, onHeal, onUpgrade }: RestScreenProps) {
  const [mode, setMode] = useState<"choose" | "upgrade">("choose");
  const healAmount = Math.round(player.maxHp * 0.3);
  const upgradable = player.deck.filter((c) => !c.upgraded);

  if (mode === "upgrade") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 px-4 max-w-lg mx-auto">
        <h2
          className="text-xl font-bold text-white"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          🔥 Upgrade a Card
        </h2>
        <p className="text-xs text-slate-400">
          Select a card to upgrade. Upgrades improve its effects.
        </p>

        <div className="flex flex-wrap gap-2 justify-center max-w-md">
          {upgradable.map((card) => {
            const def = getCardDef(card.defId);
            return (
              <button
                key={card.instanceId}
                onClick={() => onUpgrade(card.instanceId)}
                className="flex flex-col items-center w-[110px] p-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-green-400/30 transition-all"
              >
                <span className="text-xl">{def.emoji}</span>
                <span
                  className="text-[10px] font-semibold mt-1"
                  style={{ color: RARITY_COLORS[def.rarity] }}
                >
                  {def.name}
                </span>
                <span className="text-[8px] text-green-400 mt-0.5">
                  {def.upgradeDescription || "Improved stats"}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setMode("choose")}
          className="text-xs text-slate-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4 max-w-md mx-auto">
      <div className="text-5xl">🔥</div>
      <h2
        className="text-xl font-bold text-white"
        style={{ fontFamily: "'DM Serif Display', serif" }}
      >
        Rest Site
      </h2>
      <p className="text-sm text-slate-400">
        A moment of respite in the Netherveil.
      </p>

      <div className="flex gap-4">
        <button
          onClick={onHeal}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 transition-colors w-40"
        >
          <span className="text-2xl">💚</span>
          <span className="text-sm font-semibold text-green-300">Rest</span>
          <span className="text-[10px] text-slate-400">
            Heal {healAmount} HP ({player.hp}/{player.maxHp})
          </span>
        </button>

        <button
          onClick={() => setMode("upgrade")}
          disabled={upgradable.length === 0}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-colors w-40 disabled:opacity-30"
        >
          <span className="text-2xl">⬆️</span>
          <span className="text-sm font-semibold text-amber-300">Upgrade</span>
          <span className="text-[10px] text-slate-400">
            Upgrade a card ({upgradable.length} available)
          </span>
        </button>
      </div>
    </div>
  );
}
