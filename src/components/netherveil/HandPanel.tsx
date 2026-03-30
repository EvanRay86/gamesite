"use client";

import type { CardInstance } from "@/types/netherveil";
import { RARITY_COLORS } from "@/types/netherveil";
import { getCardDef, getDescription, getEnergyCost } from "@/lib/netherveil/cards";

interface HandPanelProps {
  hand: CardInstance[];
  energy: number;
  selectedCardId: string | null;
  onSelectCard: (instanceId: string) => void;
  onCancelTargeting: () => void;
  targetingMode: boolean;
}

export default function HandPanel({
  hand,
  energy,
  selectedCardId,
  onSelectCard,
  onCancelTargeting,
  targetingMode,
}: HandPanelProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      {targetingMode && (
        <button
          onClick={onCancelTargeting}
          className="px-3 py-1 text-xs rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition-colors"
        >
          Cancel Targeting (click a cell on the grid)
        </button>
      )}
      <div className="flex justify-center gap-2 flex-wrap max-w-[750px]">
        {hand.map((card) => {
          const def = getCardDef(card.defId);
          const cost = getEnergyCost(card);
          const canPlay = cost <= energy;
          const isSelected = card.instanceId === selectedCardId;
          const desc = getDescription(card);
          const rarityColor = RARITY_COLORS[def.rarity];

          return (
            <button
              key={card.instanceId}
              onClick={() => onSelectCard(card.instanceId)}
              disabled={!canPlay && !isSelected}
              className={`
                relative flex flex-col w-[120px] p-2.5 rounded-xl border transition-all duration-150
                ${
                  isSelected
                    ? "border-yellow-400 bg-yellow-400/10 -translate-y-2 shadow-lg shadow-yellow-400/20"
                    : canPlay
                    ? "border-white/15 bg-white/5 hover:-translate-y-1 hover:bg-white/10 hover:border-white/25 cursor-pointer"
                    : "border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed"
                }
              `}
            >
              {/* Energy cost badge */}
              <div
                className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  canPlay ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-400"
                }`}
              >
                {cost}
              </div>

              {/* Upgraded indicator */}
              {card.upgraded && (
                <div className="absolute -top-1 -right-1 text-xs text-green-400">
                  ★
                </div>
              )}

              {/* Card content */}
              <div className="text-center mt-1">
                <span className="text-xl">{def.emoji}</span>
              </div>
              <div className="mt-1 text-center">
                <span
                  className="text-[11px] font-semibold leading-tight"
                  style={{ color: rarityColor }}
                >
                  {def.name}
                  {card.upgraded ? "+" : ""}
                </span>
              </div>
              <div className="mt-1 text-center">
                <span className="text-[9px] text-slate-400 leading-tight block">
                  {desc}
                </span>
              </div>

              {/* Target pattern indicator */}
              <div className="mt-1 text-center">
                <span className="text-[8px] text-slate-500 uppercase tracking-wider">
                  {def.targetPattern.replace(/_/g, " ")}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
