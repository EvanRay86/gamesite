// Character class definitions for Netherveil

import type { ClassDef } from "@/types/netherveil";

export const CLASS_DEFS: Record<string, ClassDef> = {
  voidwalker: {
    id: "voidwalker",
    name: "Voidwalker",
    emoji: "🌀",
    description:
      "Master of manipulation and control. Void Charges amplify your abilities and debilitate enemies.",
    color: "#A855F7",
    starterDeckIds: [
      "strike", "strike", "strike", "strike",
      "defend", "defend", "defend",
      "void_bolt", "void_bolt",
      "phase_shift",
    ],
    startingRelicId: "void_crystal",
    mechanic: {
      name: "Void Charges",
      desc: "Accumulate Void Charges to power up void abilities. Each charge increases void card damage by 1.",
      statusType: "void_charges",
    },
  },
  embercaster: {
    id: "embercaster",
    name: "Embercaster",
    emoji: "🔥",
    description:
      "Wields devastating fire magic. Ember Stacks increase the damage of all burn effects.",
    color: "#F97316",
    starterDeckIds: [
      "strike", "strike", "strike", "strike",
      "defend", "defend", "defend",
      "ember_bolt", "ember_bolt",
      "ignite",
    ],
    startingRelicId: "ember_heart",
    mechanic: {
      name: "Ember Stacks",
      desc: "Each Ember Stack increases all burn damage by 1. Fire spells add stacks.",
      statusType: "ember_stacks",
    },
  },
  weavekeeper: {
    id: "weavekeeper",
    name: "Weavekeeper",
    emoji: "🧵",
    description:
      "The master of defense and sustain. Weave Threads create connections that share shields and healing.",
    color: "#22C55E",
    starterDeckIds: [
      "strike", "strike", "strike",
      "defend", "defend", "defend", "defend",
      "mending_thread", "mending_thread",
      "thorn_stitch",
    ],
    startingRelicId: "woven_ward",
    mechanic: {
      name: "Weave Threads",
      desc: "Weave Threads increase shield gained by 1 per stack. Defensive cards add threads.",
      statusType: "weave_threads",
    },
    locked: true,
  },
  shadowblade: {
    id: "shadowblade",
    name: "Shadowblade",
    emoji: "🗡️",
    description:
      "A lethal assassin. Shadow Marks on enemies increase damage dealt to them.",
    color: "#64748B",
    starterDeckIds: [
      "strike", "strike", "strike",
      "defend", "defend", "defend",
      "shadow_strike", "shadow_strike",
      "backstab",
      "smoke_bomb",
    ],
    startingRelicId: "shadow_cloak",
    mechanic: {
      name: "Shadow Marks",
      desc: "Each Shadow Mark on an enemy increases damage dealt to them by 2.",
      statusType: "shadow_marks",
    },
    locked: true,
  },
};

export function getClassDef(id: string): ClassDef {
  const def = CLASS_DEFS[id];
  if (!def) throw new Error(`Unknown class: ${id}`);
  return def;
}

export function getAvailableClasses(unlockedClasses: string[]): ClassDef[] {
  return Object.values(CLASS_DEFS).filter(
    (c) => !c.locked || unlockedClasses.includes(c.id),
  );
}
