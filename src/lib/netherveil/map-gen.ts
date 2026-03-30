// Procedural dungeon map generation for Netherveil
// Generates Slay the Spire-style branching node maps

import type { DungeonFloor, MapNode, NodeType, ActId } from "@/types/netherveil";
import { ACT_CONFIG } from "@/types/netherveil";
import { seededRandom, weightedPick } from "./seed";

// ── Constants ───────────────────────────────────────────────────────────────

const COLS = 7;
const MIN_ROWS = 2;
const MAX_ROWS = 4;

// ── Act Helpers ─────────────────────────────────────────────────────────────

export function getActForFloor(floor: number): ActId {
  if (floor <= 5) return "wastes";
  if (floor <= 10) return "depths";
  return "core";
}

export function isBossFloor(floor: number): boolean {
  return floor === 5 || floor === 10 || floor === 15;
}

export function advanceFloor(floor: number): number {
  return floor + 1;
}

// ── Node Type Selection ─────────────────────────────────────────────────────

function pickNodeType(
  col: number,
  totalCols: number,
  floor: number,
  rng: () => number,
): NodeType {
  // First column: always combat
  if (col === 0) return "combat";

  // Last column: boss
  if (col === totalCols - 1) return "boss";

  // Second-to-last: rest or shop (prepare for boss)
  if (col === totalCols - 2) {
    return rng() < 0.6 ? "rest" : "shop";
  }

  // Middle columns: weighted random
  const nodeTypes: NodeType[] = [
    "combat",
    "elite",
    "shop",
    "rest",
    "event",
    "treasure",
    "echo",
  ];
  const weights = [35, 12, 10, 10, 15, 8, 10];

  return weightedPick(nodeTypes, weights, rng);
}

// ── Map Generation ──────────────────────────────────────────────────────────

export function generateFloor(floor: number, seed: number): DungeonFloor {
  const rng = seededRandom(seed + floor * 1000);
  const act = getActForFloor(floor);

  // For boss floors, generate a simpler map
  if (isBossFloor(floor)) {
    return generateBossFloor(floor, act, rng);
  }

  const nodes: MapNode[] = [];
  const colNodes: MapNode[][] = [];

  // Generate nodes for each column
  for (let col = 0; col < COLS; col++) {
    const rowCount =
      col === 0 || col === COLS - 1
        ? 1
        : MIN_ROWS + Math.floor(rng() * (MAX_ROWS - MIN_ROWS + 1));

    const colArr: MapNode[] = [];
    for (let row = 0; row < rowCount; row++) {
      const type = pickNodeType(col, COLS, floor, rng);
      const node: MapNode = {
        id: `f${floor}_c${col}_r${row}`,
        row,
        col,
        type,
        connections: [],
        visited: false,
      };
      nodes.push(node);
      colArr.push(node);
    }
    colNodes.push(colArr);
  }

  // Generate connections between adjacent columns
  for (let col = 0; col < COLS - 1; col++) {
    const current = colNodes[col];
    const next = colNodes[col + 1];

    // Ensure every node has at least one connection
    for (const node of current) {
      if (next.length === 1) {
        node.connections.push(next[0].id);
      } else {
        // Connect to 1-2 random nodes in next column
        const count = 1 + (rng() < 0.5 ? 1 : 0);
        const indices = new Set<number>();
        for (let i = 0; i < count; i++) {
          indices.add(Math.floor(rng() * next.length));
        }
        for (const idx of indices) {
          node.connections.push(next[idx].id);
        }
      }
    }

    // Ensure every node in the next column is reachable from at least one node
    for (const nextNode of next) {
      const isReachable = current.some((n) =>
        n.connections.includes(nextNode.id),
      );
      if (!isReachable) {
        const randomParent = current[Math.floor(rng() * current.length)];
        randomParent.connections.push(nextNode.id);
      }
    }
  }

  return { nodes, act, floor };
}

function generateBossFloor(
  floor: number,
  act: ActId,
  rng: () => number,
): DungeonFloor {
  // Boss floors: combat -> rest -> boss
  const nodes: MapNode[] = [
    {
      id: `f${floor}_c0_r0`,
      row: 0,
      col: 0,
      type: "combat",
      connections: [`f${floor}_c1_r0`],
      visited: false,
    },
    {
      id: `f${floor}_c1_r0`,
      row: 0,
      col: 1,
      type: "rest",
      connections: [`f${floor}_c2_r0`],
      visited: false,
    },
    {
      id: `f${floor}_c2_r0`,
      row: 0,
      col: 2,
      type: "boss",
      connections: [],
      visited: false,
    },
  ];

  return { nodes, act, floor };
}

// ── Map Navigation ──────────────────────────────────────────────────────────

export function getAvailableNodes(
  floor: DungeonFloor,
  currentNodeId: string | null,
): MapNode[] {
  if (!currentNodeId) {
    // At start of floor, first column nodes are available
    return floor.nodes.filter((n) => n.col === 0);
  }

  const currentNode = floor.nodes.find((n) => n.id === currentNodeId);
  if (!currentNode) return [];

  return floor.nodes.filter((n) => currentNode.connections.includes(n.id));
}

/** Get node by ID. */
export function getNode(floor: DungeonFloor, nodeId: string): MapNode | undefined {
  return floor.nodes.find((n) => n.id === nodeId);
}

// ── Map Node Rendering Positions ────────────────────────────────────────────

export function getNodePosition(
  node: MapNode,
  floor: DungeonFloor,
  canvasW: number,
  canvasH: number,
): { x: number; y: number } {
  // Find max columns and max rows per column for this floor
  const maxCol = Math.max(...floor.nodes.map((n) => n.col));
  const nodesInCol = floor.nodes.filter((n) => n.col === node.col);
  const maxRowInCol = nodesInCol.length;

  const paddingX = 80;
  const paddingY = 60;
  const usableW = canvasW - paddingX * 2;
  const usableH = canvasH - paddingY * 2;

  const x = paddingX + (maxCol > 0 ? (node.col / maxCol) * usableW : usableW / 2);
  const rowIndex = nodesInCol.indexOf(node);
  const y =
    paddingY +
    (maxRowInCol > 1
      ? (rowIndex / (maxRowInCol - 1)) * usableH
      : usableH / 2);

  return { x, y };
}

// ── Node Type Metadata ──────────────────────────────────────────────────────

export const NODE_INFO: Record<
  NodeType,
  { emoji: string; label: string; color: string }
> = {
  combat: { emoji: "⚔️", label: "Combat", color: "#EF4444" },
  elite: { emoji: "💀", label: "Elite", color: "#F59E0B" },
  boss: { emoji: "👑", label: "Boss", color: "#DC2626" },
  shop: { emoji: "🛒", label: "Shop", color: "#3B82F6" },
  rest: { emoji: "🔥", label: "Rest", color: "#22C55E" },
  event: { emoji: "❓", label: "Event", color: "#A855F7" },
  treasure: { emoji: "💎", label: "Treasure", color: "#FBBF24" },
  echo: { emoji: "👤", label: "Echo", color: "#64748B" },
};

// ── Events ──────────────────────────────────────────────────────────────────

import type { GameEvent } from "@/types/netherveil";

const EVENTS: GameEvent[] = [
  {
    title: "Forgotten Shrine",
    emoji: "⛩️",
    desc: "You discover an ancient shrine humming with void energy. It seems to respond to offerings.",
    options: [
      {
        label: "Offer 25 gold",
        desc: "The shrine rewards your piety.",
        effects: [
          { type: "gold", value: -25 },
          { type: "maxHp", value: 5 },
        ],
      },
      {
        label: "Pray",
        desc: "You feel renewed strength.",
        effects: [{ type: "heal", value: 15 }],
      },
      {
        label: "Leave",
        desc: "Some things are best left alone.",
        effects: [],
      },
    ],
  },
  {
    title: "The Wandering Merchant",
    emoji: "🧙",
    desc: "A hooded figure materializes from the void. 'I have something special for you...'",
    options: [
      {
        label: "Pay 50 gold for a relic",
        desc: "A mysterious artifact changes hands.",
        effects: [
          { type: "gold", value: -50 },
          { type: "relic", value: 1 },
        ],
      },
      {
        label: "Trade 10 HP for 30 gold",
        desc: "Pain for profit.",
        effects: [
          { type: "damage", value: 10 },
          { type: "gold", value: 30 },
        ],
      },
      {
        label: "Decline",
        desc: "The figure fades back into the void.",
        effects: [],
      },
    ],
  },
  {
    title: "Void Rift",
    emoji: "🌀",
    desc: "A tear in reality crackles before you. You can feel power — and danger — on the other side.",
    options: [
      {
        label: "Reach through",
        desc: "Risk and reward in equal measure.",
        effects: [
          { type: "damage", value: 8 },
          { type: "upgrade_card", value: 1 },
        ],
      },
      {
        label: "Study the rift",
        desc: "Knowledge is its own reward.",
        effects: [{ type: "gold", value: 20 }],
      },
      {
        label: "Close the rift",
        desc: "Seal it shut. Gain a moment of peace.",
        effects: [{ type: "heal", value: 10 }],
      },
    ],
  },
  {
    title: "Crystal Fountain",
    emoji: "💎",
    desc: "A fountain of liquid crystal bubbles up from the ground. Its waters shimmer with restorative energy.",
    options: [
      {
        label: "Drink deeply",
        desc: "Full restoration.",
        effects: [{ type: "heal", value: 25 }],
      },
      {
        label: "Bottle some for later",
        desc: "Gain gold from the crystal residue.",
        effects: [{ type: "gold", value: 25 }],
      },
    ],
  },
  {
    title: "The Gambler",
    emoji: "🎰",
    desc: "A spectral figure deals ethereal cards. 'Double or nothing, Veilwalker?'",
    options: [
      {
        label: "Gamble 30 gold",
        desc: "50/50 chance to double or lose it all.",
        effects: [{ type: "gold", value: 30 }], // Engine will randomize
      },
      {
        label: "Walk away",
        desc: "Keep your gold.",
        effects: [],
      },
    ],
  },
  {
    title: "Echoing Memory",
    emoji: "🪞",
    desc: "A mirror shows a version of yourself from another timeline. It offers to strengthen one of your cards.",
    options: [
      {
        label: "Accept the gift",
        desc: "Upgrade a random card in your deck.",
        effects: [{ type: "upgrade_card", value: 1 }],
      },
      {
        label: "Shatter the mirror",
        desc: "Gain 15 gold from the shards.",
        effects: [{ type: "gold", value: 15 }],
      },
    ],
  },
];

export function getRandomEvent(rng: () => number): GameEvent {
  return EVENTS[Math.floor(rng() * EVENTS.length)];
}
