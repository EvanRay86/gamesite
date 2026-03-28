"use client";

import type { InventorySlot } from "@/types/pixelville";

const ITEM_NAMES: Record<string, string> = {
  tomato_seed: "Tomato Seeds",
  corn_seed: "Corn Seeds",
  carrot_seed: "Carrot Seeds",
  sunflower_seed: "Sunflower Seeds",
  pumpkin_seed: "Pumpkin Seeds",
  strawberry_seed: "Strawberry Seeds",
  tomato: "Tomato",
  corn: "Corn",
  carrot: "Carrot",
  sunflower: "Sunflower",
  pumpkin: "Pumpkin",
  strawberry: "Strawberry",
  basic_hoe: "Basic Hoe",
  watering_can: "Watering Can",
  bronze_hoe: "Bronze Hoe",
  silver_hoe: "Silver Hoe",
  wooden_table: "Wooden Table",
  wooden_chair: "Wooden Chair",
  cozy_rug: "Cozy Rug",
  table_lamp: "Table Lamp",
  flower_pot: "Flower Pot",
  bookshelf: "Bookshelf",
  single_bed: "Single Bed",
  garden_bench: "Garden Bench",
  fence: "Wooden Fence",
  fireplace: "Fireplace",
  fountain: "Stone Fountain",
  mailbox: "Mailbox",
};

interface InventoryPanelProps {
  inventory: InventorySlot[];
  onClose: () => void;
  onSelectItem?: (itemId: string) => void;
  selectedItem?: string | null;
}

export default function InventoryPanel({
  inventory,
  onClose,
  onSelectItem,
  selectedItem,
}: InventoryPanelProps) {
  const seeds = inventory.filter((s) => s.itemId.endsWith("_seed"));
  const furniture = inventory.filter(
    (s) =>
      !s.itemId.endsWith("_seed") &&
      !["tomato", "corn", "carrot", "sunflower", "pumpkin", "strawberry"].includes(s.itemId) &&
      !s.itemId.startsWith("basic_") &&
      !s.itemId.startsWith("bronze_") &&
      !s.itemId.startsWith("silver_") &&
      !s.itemId.endsWith("_can"),
  );
  const tools = inventory.filter(
    (s) =>
      s.itemId.startsWith("basic_") ||
      s.itemId.startsWith("bronze_") ||
      s.itemId.startsWith("silver_") ||
      s.itemId.endsWith("_can"),
  );
  const crops = inventory.filter((s) =>
    ["tomato", "corn", "carrot", "sunflower", "pumpkin", "strawberry"].includes(s.itemId),
  );

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1a1a2e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <h3 className="text-lg font-bold text-white font-[family-name:var(--font-display)]">
            Inventory
          </h3>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Items */}
        <div className="h-80 overflow-y-auto p-4 space-y-4">
          {inventory.length === 0 && (
            <p className="text-white/30 text-sm text-center py-8">
              Your inventory is empty. Visit the shop!
            </p>
          )}

          {seeds.length > 0 && (
            <Section title="Seeds" items={seeds} onSelect={onSelectItem} selectedItem={selectedItem} />
          )}
          {crops.length > 0 && (
            <Section title="Crops" items={crops} onSelect={onSelectItem} selectedItem={selectedItem} />
          )}
          {furniture.length > 0 && (
            <Section title="Furniture" items={furniture} onSelect={onSelectItem} selectedItem={selectedItem} />
          )}
          {tools.length > 0 && (
            <Section title="Tools" items={tools} onSelect={onSelectItem} selectedItem={selectedItem} />
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  items,
  onSelect,
  selectedItem,
}: {
  title: string;
  items: InventorySlot[];
  onSelect?: (id: string) => void;
  selectedItem?: string | null;
}) {
  return (
    <div>
      <h4 className="text-xs uppercase text-white/40 font-semibold mb-1.5">{title}</h4>
      <div className="grid grid-cols-2 gap-1.5">
        {items.map((slot) => (
          <button
            key={slot.id}
            onClick={() => onSelect?.(slot.itemId)}
            className={`flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 text-left transition-colors ${
              selectedItem === slot.itemId
                ? "ring-2 ring-teal-400 bg-teal-500/10"
                : "hover:bg-white/10"
            }`}
          >
            <span className="text-white text-xs font-medium truncate">
              {ITEM_NAMES[slot.itemId] ?? slot.itemId}
            </span>
            <span className="text-white/40 text-xs ml-1">x{slot.quantity}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
