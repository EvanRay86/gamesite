"use client";

import type { RewardSet, PlayerState } from "@/types/netherveil";
import { RARITY_COLORS } from "@/types/netherveil";
import { getCardDef } from "@/lib/netherveil/cards";
import { getRelicDef } from "@/lib/netherveil/relics";

interface RewardScreenProps {
  rewards: RewardSet;
  player: PlayerState;
  onCollectGold: () => void;
  onSelectCard: (index: number) => void;
  onCollectRelic: () => void;
  onSkip: () => void;
}

export default function RewardScreen({
  rewards,
  player,
  onCollectGold,
  onSelectCard,
  onCollectRelic,
  onSkip,
}: RewardScreenProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4 max-w-lg mx-auto">
      <h2
        className="text-2xl font-bold text-white"
        style={{ fontFamily: "'DM Serif Display', serif" }}
      >
        ✨ Victory
      </h2>

      {/* Gold reward */}
      {rewards.gold > 0 && (
        <button
          onClick={onCollectGold}
          className="w-full p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-colors flex items-center justify-between"
        >
          <span className="text-amber-300 font-semibold">
            🪙 +{rewards.gold} Gold
          </span>
          <span className="text-xs text-slate-400">Click to collect</span>
        </button>
      )}

      {/* Relic reward */}
      {rewards.relicId && (
        <button
          onClick={onCollectRelic}
          className="w-full p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 transition-colors flex items-center gap-3"
        >
          {(() => {
            const def = getRelicDef(rewards.relicId!);
            return (
              <>
                <span className="text-2xl">{def.emoji}</span>
                <div className="text-left">
                  <div className="text-purple-300 font-semibold text-sm">
                    {def.name}
                  </div>
                  <div className="text-xs text-slate-400">{def.desc}</div>
                </div>
              </>
            );
          })()}
        </button>
      )}

      {/* Card choices */}
      {rewards.cardChoices.length > 0 && (
        <div className="w-full">
          <h3 className="text-sm text-slate-400 text-center mb-3">
            Choose a card to add to your deck
          </h3>
          <div className="flex gap-3 justify-center">
            {rewards.cardChoices.map((choice, i) => {
              const def = getCardDef(choice.defId);
              const rarityColor = RARITY_COLORS[def.rarity];
              return (
                <button
                  key={i}
                  onClick={() => onSelectCard(i)}
                  className="flex flex-col items-center w-[140px] p-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-all hover:-translate-y-1"
                >
                  <div className="text-xs font-bold text-blue-400 mb-1">
                    ⚡{def.energyCost}
                  </div>
                  <span className="text-2xl">{def.emoji}</span>
                  <span
                    className="text-xs font-semibold mt-1"
                    style={{ color: rarityColor }}
                  >
                    {def.name}
                  </span>
                  <span className="text-[9px] text-slate-400 text-center mt-1 leading-tight">
                    {def.description}
                  </span>
                  <span className="text-[8px] text-slate-500 mt-1 uppercase">
                    {def.targetPattern.replace(/_/g, " ")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Skip / Continue */}
      <button
        onClick={onSkip}
        className="px-6 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-sm hover:bg-white/10 hover:text-white transition-colors"
      >
        {rewards.cardChoices.length > 0 ? "Skip Card" : "Continue"} →
      </button>
    </div>
  );
}
