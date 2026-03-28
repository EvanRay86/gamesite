"use client";

import { useState } from "react";
import type { PixelVilleEngine } from "@/lib/pixelville/engine";

interface ShopItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  rarity: string;
}

const SHOP_ITEMS: ShopItem[] = [
  // Seeds
  { id: "tomato_seed", name: "Tomato Seeds", category: "seed", description: "Grows in 1 min", price: 10, rarity: "common" },
  { id: "corn_seed", name: "Corn Seeds", category: "seed", description: "Grows in 2 min", price: 15, rarity: "common" },
  { id: "carrot_seed", name: "Carrot Seeds", category: "seed", description: "Grows in 1.25 min", price: 12, rarity: "common" },
  { id: "sunflower_seed", name: "Sunflower Seeds", category: "seed", description: "Grows in 1.5 min", price: 20, rarity: "common" },
  { id: "pumpkin_seed", name: "Pumpkin Seeds", category: "seed", description: "Grows in 3 min", price: 25, rarity: "uncommon" },
  { id: "strawberry_seed", name: "Strawberry Seeds", category: "seed", description: "Grows in 2.5 min", price: 30, rarity: "uncommon" },
  // Furniture
  { id: "wooden_table", name: "Wooden Table", category: "furniture", description: "A sturdy oak table", price: 50, rarity: "common" },
  { id: "wooden_chair", name: "Wooden Chair", category: "furniture", description: "A simple chair", price: 30, rarity: "common" },
  { id: "cozy_rug", name: "Cozy Rug", category: "furniture", description: "A soft, colorful rug", price: 40, rarity: "common" },
  { id: "table_lamp", name: "Table Lamp", category: "furniture", description: "A warm glowing lamp", price: 35, rarity: "common" },
  { id: "flower_pot", name: "Flower Pot", category: "furniture", description: "A decorative plant", price: 25, rarity: "common" },
  { id: "bookshelf", name: "Bookshelf", category: "furniture", description: "Filled with old stories", price: 80, rarity: "uncommon" },
  { id: "single_bed", name: "Single Bed", category: "furniture", description: "A cozy bed", price: 100, rarity: "common" },
  { id: "garden_bench", name: "Garden Bench", category: "furniture", description: "Sit and enjoy the view", price: 60, rarity: "common" },
  { id: "fence", name: "Wooden Fence", category: "furniture", description: "A short picket fence", price: 15, rarity: "common" },
  { id: "fireplace", name: "Fireplace", category: "furniture", description: "A warm crackling fire", price: 200, rarity: "rare" },
  { id: "fountain", name: "Stone Fountain", category: "furniture", description: "A beautiful fountain", price: 500, rarity: "rare" },
];

const CATEGORIES = ["all", "seed", "furniture"];

const RARITY_COLORS: Record<string, string> = {
  common: "text-white/60",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  legendary: "text-yellow-400",
};

interface ShopPanelProps {
  engine: PixelVilleEngine;
  coins: number;
  onClose: () => void;
}

export default function ShopPanel({ engine, coins, onClose }: ShopPanelProps) {
  const [category, setCategory] = useState("all");
  const [buying, setBuying] = useState<string | null>(null);

  const filtered = category === "all"
    ? SHOP_ITEMS
    : SHOP_ITEMS.filter((i) => i.category === category);

  const handleBuy = async (item: ShopItem) => {
    setBuying(item.id);
    await engine.buyItem(item.id, item.price);
    setBuying(null);
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#1a1a2e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <h3 className="text-lg font-bold text-white font-[family-name:var(--font-display)]">
            Shop
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-yellow-400 font-semibold text-sm">
              {coins} coins
            </span>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white text-xl leading-none"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 px-5 py-2 border-b border-white/5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 text-xs rounded-md capitalize transition-colors ${
                category === cat
                  ? "bg-teal-500 text-white"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {cat === "all" ? "All" : cat + "s"}
            </button>
          ))}
        </div>

        {/* Item grid */}
        <div className="h-80 overflow-y-auto p-4 grid grid-cols-1 gap-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 hover:bg-white/10 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium truncate">
                    {item.name}
                  </span>
                  <span className={`text-[10px] uppercase ${RARITY_COLORS[item.rarity]}`}>
                    {item.rarity}
                  </span>
                </div>
                <p className="text-white/40 text-xs truncate">{item.description}</p>
              </div>
              <button
                onClick={() => handleBuy(item)}
                disabled={coins < item.price || buying === item.id}
                className={`ml-3 flex-shrink-0 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  coins >= item.price
                    ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                    : "bg-white/5 text-white/20 cursor-not-allowed"
                }`}
              >
                {buying === item.id ? "..." : `${item.price} coins`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
