"use client";

import type { ShopItem, PlayerState } from "@/types/netherveil";
import { RARITY_COLORS } from "@/types/netherveil";
import { getCardDef } from "@/lib/netherveil/cards";
import { getRelicDef } from "@/lib/netherveil/relics";

interface ShopScreenProps {
  items: ShopItem[];
  player: PlayerState;
  onPurchase: (index: number) => void;
  onLeave: () => void;
}

export default function ShopScreen({
  items,
  player,
  onPurchase,
  onLeave,
}: ShopScreenProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4 max-w-lg mx-auto">
      <h2
        className="text-2xl font-bold text-white"
        style={{ fontFamily: "'DM Serif Display', serif" }}
      >
        🛒 Merchant
      </h2>
      <p className="text-sm text-amber-300">🪙 {player.gold} Gold</p>

      <div className="w-full flex flex-col gap-2">
        {items.map((item, i) => {
          const canAfford = player.gold >= item.price && !item.sold;
          let label = "";
          let emoji = "";
          let desc = "";

          if (item.type === "card" && item.id) {
            const def = getCardDef(item.id);
            label = def.name;
            emoji = def.emoji;
            desc = def.description;
          } else if (item.type === "relic" && item.id) {
            const def = getRelicDef(item.id);
            label = def.name;
            emoji = def.emoji;
            desc = def.desc;
          } else if (item.type === "remove_card") {
            label = "Remove a Card";
            emoji = "🗑️";
            desc = "Remove a random non-starter card from your deck.";
          }

          return (
            <button
              key={i}
              onClick={() => onPurchase(i)}
              disabled={!canAfford}
              className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-all ${
                item.sold
                  ? "border-white/5 bg-white/[0.01] opacity-30"
                  : canAfford
                  ? "border-white/15 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/25"
                  : "border-white/5 bg-white/[0.01] opacity-50"
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-white">
                  {label}
                  {item.sold && (
                    <span className="text-red-400 ml-2">SOLD</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400">{desc}</div>
              </div>
              {!item.sold && (
                <span className="text-amber-300 font-bold text-sm">
                  🪙 {item.price}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={onLeave}
        className="px-6 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-sm hover:bg-white/10 hover:text-white transition-colors"
      >
        Leave Shop →
      </button>
    </div>
  );
}
