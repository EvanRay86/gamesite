"use client";

import { useState, useRef, useEffect } from "react";
import type { AvatarConfig } from "@/types/pixelville";
import { DEFAULT_AVATAR } from "@/types/pixelville";
import { getAvatarSprite } from "@/lib/pixelville/avatar";
import {
  SKIN_TONES,
  HAIR_COLORS,
  SHIRT_COLORS,
  PANTS_COLORS,
  SHOE_COLORS,
} from "@/lib/pixelville/sprites";

interface AvatarCustomizerProps {
  onComplete: (name: string, config: AvatarConfig) => void;
}

const HAIR_STYLES = ["None", "Short", "Long", "Curly", "Spiky", "Bun"];
const HAT_STYLES = ["None", "Cap", "Cowboy", "Beanie", "Crown"];
const ACCESSORY_STYLES = ["None", "Glasses", "Scarf", "Necklace"];

export default function AvatarCustomizer({ onComplete }: AvatarCustomizerProps) {
  const [name, setName] = useState("");
  const [config, setConfig] = useState<AvatarConfig>({ ...DEFAULT_AVATAR });
  const previewRef = useRef<HTMLCanvasElement>(null);

  // Render avatar preview
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    // Draw at 4x scale for preview
    const sprite = getAvatarSprite(config, 0, "idle", 0);
    ctx.drawImage(sprite, 0, 0, 32, 48, 16, 8, 128, 192);
  }, [config]);

  const update = (key: keyof AvatarConfig, value: number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onComplete(trimmed, config);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] text-white p-4">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold text-center mb-1 font-[family-name:var(--font-display)]">
          Create Your Villager
        </h2>
        <p className="text-white/50 text-center text-sm mb-6">
          Customize your look and pick a name
        </p>

        {/* Preview */}
        <div className="flex justify-center mb-6">
          <div className="bg-[#4CAF50]/20 rounded-xl p-4 border border-[#4CAF50]/30">
            <canvas
              ref={previewRef}
              width={160}
              height={208}
              style={{ imageRendering: "pixelated" }}
              className="block"
            />
          </div>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-white/70 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
            placeholder="Enter your name..."
            className="w-full bg-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400/50 placeholder:text-white/30"
          />
        </div>

        {/* Skin tone */}
        <ColorRow
          label="Skin Tone"
          colors={SKIN_TONES}
          selected={config.body}
          onSelect={(i) => update("body", i)}
        />

        {/* Hair style */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-white/70 mb-1">Hair Style</label>
          <div className="flex flex-wrap gap-1.5">
            {HAIR_STYLES.map((style, i) => (
              <button
                key={style}
                onClick={() => update("hair", i)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  config.hair === i
                    ? "bg-teal-500 text-white"
                    : "bg-white/10 text-white/60 hover:bg-white/20"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Hair color */}
        {config.hair > 0 && (
          <ColorRow
            label="Hair Color"
            colors={HAIR_COLORS}
            selected={config.hairColor}
            onSelect={(i) => update("hairColor", i)}
          />
        )}

        {/* Shirt color */}
        <ColorRow
          label="Shirt"
          colors={SHIRT_COLORS}
          selected={config.shirt}
          onSelect={(i) => update("shirt", i)}
        />

        {/* Pants color */}
        <ColorRow
          label="Pants"
          colors={PANTS_COLORS}
          selected={config.pants}
          onSelect={(i) => update("pants", i)}
        />

        {/* Shoes */}
        <ColorRow
          label="Shoes"
          colors={SHOE_COLORS}
          selected={config.shoes}
          onSelect={(i) => update("shoes", i)}
        />

        {/* Hat */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-white/70 mb-1">Hat</label>
          <div className="flex flex-wrap gap-1.5">
            {HAT_STYLES.map((style, i) => (
              <button
                key={style}
                onClick={() => update("hat", i)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  config.hat === i
                    ? "bg-teal-500 text-white"
                    : "bg-white/10 text-white/60 hover:bg-white/20"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Accessory */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-white/70 mb-1">Accessory</label>
          <div className="flex flex-wrap gap-1.5">
            {ACCESSORY_STYLES.map((style, i) => (
              <button
                key={style}
                onClick={() => update("accessory", i)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  config.accessory === i
                    ? "bg-teal-500 text-white"
                    : "bg-white/10 text-white/60 hover:bg-white/20"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="w-full py-3 bg-teal-500 hover:bg-teal-400 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          Enter PixelVille
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Color swatch row
// ---------------------------------------------------------------------------

function ColorRow({
  label,
  colors,
  selected,
  onSelect,
}: {
  label: string;
  colors: string[];
  selected: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-white/70 mb-1">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {colors.map((color, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`w-7 h-7 rounded-md border-2 transition-all ${
              selected === i
                ? "border-teal-400 scale-110"
                : "border-transparent hover:border-white/30"
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
}
