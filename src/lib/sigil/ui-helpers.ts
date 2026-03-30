// ── SIGIL: Element color/style utilities ────────────────────────────────────

import type { Element, Rune, Enemy, NodeType, CharacterClass } from "./types";

export const ELEMENT_COLORS: Record<Element, { bg: string; text: string; border: string; glow: string; light: string }> = {
  ignis:   { bg: "bg-red-500",    text: "text-red-400",    border: "border-red-400",    glow: "shadow-red-500/40",    light: "bg-red-500/20" },
  glacius: { bg: "bg-cyan-400",   text: "text-cyan-300",   border: "border-cyan-300",   glow: "shadow-cyan-400/40",   light: "bg-cyan-400/20" },
  voltis:  { bg: "bg-yellow-400", text: "text-yellow-300", border: "border-yellow-300", glow: "shadow-yellow-400/40", light: "bg-yellow-400/20" },
  umbra:   { bg: "bg-purple-500", text: "text-purple-300", border: "border-purple-300", glow: "shadow-purple-500/40", light: "bg-purple-500/20" },
  arcana:  { bg: "bg-pink-400",   text: "text-pink-300",   border: "border-pink-300",   glow: "shadow-pink-400/40",   light: "bg-pink-400/20" },
};

export const ELEMENT_EMOJI: Record<Element, string> = {
  ignis: "🔥", glacius: "❄️", voltis: "⚡", umbra: "🌑", arcana: "✨",
};

export const ELEMENT_NAMES: Record<Element, string> = {
  ignis: "Ignis", glacius: "Glacius", voltis: "Voltis", umbra: "Umbra", arcana: "Arcana",
};

export const RARITY_COLORS: Record<Rune["rarity"], string> = {
  common: "border-slate-400",
  uncommon: "border-green-400",
  rare: "border-blue-400",
  legendary: "border-amber-400",
};

export const RARITY_BG: Record<Rune["rarity"], string> = {
  common: "bg-slate-800/80",
  uncommon: "bg-green-900/60",
  rare: "bg-blue-900/60",
  legendary: "bg-amber-900/60",
};

export const NODE_EMOJI: Record<NodeType, string> = {
  combat: "⚔️", elite: "💀", boss: "👑", shop: "🛒", rest: "🏕️", event: "❓", treasure: "💎",
};

export const NODE_LABEL: Record<NodeType, string> = {
  combat: "Combat", elite: "Elite", boss: "Boss", shop: "Shop", rest: "Rest", event: "Event", treasure: "Treasure",
};

export const CLASS_INFO: Record<CharacterClass, { name: string; emoji: string; desc: string; color: string }> = {
  pyromancer:   { name: "Pyromancer",   emoji: "🔥", desc: "Ignis-focused. Burn damage +1. Start with fire runes.", color: "text-red-400" },
  chronomancer: { name: "Chronomancer", emoji: "💠", desc: "Balanced deck. Can rewind 1 rune placement per turn.", color: "text-pink-400" },
  voidwalker:   { name: "Voidwalker",   emoji: "🌑", desc: "Umbra-focused. Enemies start poisoned. 65 HP.", color: "text-purple-400" },
  stormcaller:  { name: "Stormcaller",  emoji: "⚡", desc: "Voltis-focused. Chain damage hits extra target.", color: "text-yellow-400" },
};
