// Procedural dungeon map generation for Lexicon Quest
// Generates Slay the Spire-style branching node maps

import type {
  DungeonFloor,
  MapNode,
  NodeType,
  ActId,
  GameEvent,
} from "@/types/lexicon-quest";

// ── Seeded RNG (shared pattern from wordsmith-engine) ───────────────────────

export function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

export function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Act configuration ───────────────────────────────────────────────────────

export const ACT_CONFIG: Record<
  ActId,
  { name: string; floors: [number, number]; emoji: string; bgColor: string }
> = {
  crypt: { name: "The Crypt", floors: [1, 5], emoji: "💀", bgColor: "#1a1a2e" },
  caverns: { name: "The Caverns", floors: [6, 10], emoji: "🗿", bgColor: "#16213e" },
  abyss: { name: "The Abyss", floors: [11, 15], emoji: "🕳️", bgColor: "#0f0f23" },
};

export function getActForFloor(floor: number): ActId {
  if (floor <= 5) return "crypt";
  if (floor <= 10) return "caverns";
  return "abyss";
}

export function isBossFloor(floor: number): boolean {
  return floor === 5 || floor === 10 || floor === 15;
}

// ── Map generation ──────────────────────────────────────────────────────────

const COLS = 7; // columns in the map (left to right progression)
const MIN_ROWS = 2;
const MAX_ROWS = 4;

function pickNodeType(
  col: number,
  totalCols: number,
  floor: number,
  rng: () => number,
): NodeType {
  // First column is always combat
  if (col === 0) return "combat";
  // Last column is boss on boss floors
  if (col === totalCols - 1 && isBossFloor(floor)) return "boss";
  // Last column is treasure on non-boss floors
  if (col === totalCols - 1) return "treasure";

  const r = rng();
  // Elites appear from floor 3+
  const eliteChance = floor >= 3 ? 0.12 : 0;

  if (r < 0.40) return "combat";
  if (r < 0.40 + eliteChance) return "elite";
  if (r < 0.60 + eliteChance) return "event";
  if (r < 0.72 + eliteChance) return "shop";
  if (r < 0.84 + eliteChance) return "rest";
  return "combat";
}

export function generateFloor(
  floor: number,
  rng: () => number,
): DungeonFloor {
  const act = getActForFloor(floor);
  const nodes: MapNode[] = [];
  const colNodes: string[][] = [];

  // Generate nodes per column
  for (let col = 0; col < COLS; col++) {
    const numRows =
      col === 0
        ? MIN_ROWS + (rng() < 0.5 ? 1 : 0) // 2-3 start nodes
        : col === COLS - 1
          ? 1 // 1 final node
          : MIN_ROWS + Math.floor(rng() * (MAX_ROWS - MIN_ROWS + 1));

    const ids: string[] = [];
    for (let row = 0; row < numRows; row++) {
      const id = `${floor}-${col}-${row}`;
      const type = pickNodeType(col, COLS, floor, rng);
      nodes.push({
        id,
        row,
        col,
        type,
        connections: [],
        visited: false,
      });
      ids.push(id);
    }
    colNodes.push(ids);
  }

  // Connect nodes: each node connects to 1-2 nodes in the next column
  for (let col = 0; col < COLS - 1; col++) {
    const current = colNodes[col];
    const next = colNodes[col + 1];

    // Ensure every node in current has at least one connection
    for (const nodeId of current) {
      const node = nodes.find((n) => n.id === nodeId)!;
      const connectCount = rng() < 0.6 ? 1 : Math.min(2, next.length);

      // Pick random connections
      const available = [...next];
      for (let c = 0; c < connectCount && available.length > 0; c++) {
        const idx = Math.floor(rng() * available.length);
        node.connections.push(available[idx]);
        available.splice(idx, 1);
      }
    }

    // Ensure every node in next has at least one incoming connection
    for (const nextId of next) {
      const hasIncoming = current.some((curId) => {
        const cur = nodes.find((n) => n.id === curId)!;
        return cur.connections.includes(nextId);
      });
      if (!hasIncoming) {
        // Connect a random current node to this orphan
        const randomCur = current[Math.floor(rng() * current.length)];
        const curNode = nodes.find((n) => n.id === randomCur)!;
        curNode.connections.push(nextId);
      }
    }
  }

  // Ensure at least one shop and one rest in the floor
  ensureNodeType(nodes, "shop", rng);
  ensureNodeType(nodes, "rest", rng);

  return { nodes, act, floor };
}

function ensureNodeType(
  nodes: MapNode[],
  type: NodeType,
  rng: () => number,
): void {
  if (nodes.some((n) => n.type === type)) return;

  // Find a combat node in the middle columns to convert
  const candidates = nodes.filter(
    (n) => n.type === "combat" && n.col > 0 && n.col < COLS - 1,
  );
  if (candidates.length > 0) {
    const pick = candidates[Math.floor(rng() * candidates.length)];
    pick.type = type;
  }
}

// ── Node positions for rendering ────────────────────────────────────────────

export function getNodePosition(
  node: MapNode,
  width: number,
  height: number,
  totalNodes: MapNode[],
): { x: number; y: number } {
  const colNodes = totalNodes.filter((n) => n.col === node.col);
  const rowCount = colNodes.length;
  const rowIndex = colNodes.indexOf(node);

  const colSpacing = width / (COLS + 1);
  const x = colSpacing * (node.col + 1);

  const rowSpacing = height / (rowCount + 1);
  const y = rowSpacing * (rowIndex + 1);

  return { x, y };
}

// ── Available nodes ─────────────────────────────────────────────────────────

export function getAvailableNodes(
  floor: DungeonFloor,
  currentNodeId: string | null,
): MapNode[] {
  if (!currentNodeId) {
    // Start: first column nodes are available
    return floor.nodes.filter((n) => n.col === 0);
  }

  const current = floor.nodes.find((n) => n.id === currentNodeId);
  if (!current) return [];

  return floor.nodes.filter((n) => current.connections.includes(n.id));
}

// ── Floor advancement ───────────────────────────────────────────────────────

export function advanceFloor(
  currentFloor: number,
): { floor: number; act: ActId } | "victory" {
  if (currentFloor >= 15) return "victory";
  const nextFloor = currentFloor + 1;
  return { floor: nextFloor, act: getActForFloor(nextFloor) };
}

// ── Node display info ───────────────────────────────────────────────────────

export const NODE_INFO: Record<
  NodeType,
  { emoji: string; label: string; color: string }
> = {
  combat: { emoji: "⚔️", label: "Combat", color: "#ef4444" },
  elite: { emoji: "💀", label: "Elite", color: "#f59e0b" },
  boss: { emoji: "👑", label: "Boss", color: "#dc2626" },
  shop: { emoji: "🛒", label: "Shop", color: "#22c55e" },
  rest: { emoji: "🏕️", label: "Rest", color: "#3b82f6" },
  event: { emoji: "❓", label: "Event", color: "#a855f7" },
  treasure: { emoji: "🎁", label: "Treasure", color: "#eab308" },
};

// ── Random events ───────────────────────────────────────────────────────────

const EVENT_POOL: GameEvent[] = [
  {
    title: "Mysterious Shrine",
    emoji: "⛩️",
    desc: "A glowing shrine pulses with ancient power. It demands a sacrifice.",
    options: [
      {
        label: "Offer blood",
        desc: "Lose 10 HP, gain a random relic.",
        effect: { type: "relic", value: -10 },
      },
      {
        label: "Walk away",
        desc: "Leave the shrine undisturbed.",
        effect: { type: "heal", value: 0 },
      },
    ],
  },
  {
    title: "Wandering Merchant",
    emoji: "🧳",
    desc: "A hooded figure offers a suspicious deal.",
    options: [
      {
        label: "Pay 25 gold",
        desc: "Receive a random potion.",
        effect: { type: "potion", value: -25 },
      },
      {
        label: "Decline",
        desc: "Keep your gold.",
        effect: { type: "gold", value: 0 },
      },
    ],
  },
  {
    title: "Healing Spring",
    emoji: "⛲",
    desc: "Crystal-clear water bubbles up from the dungeon floor.",
    options: [
      {
        label: "Drink deeply",
        desc: "Heal 25 HP.",
        effect: { type: "heal", value: 25 },
      },
      {
        label: "Bottle it",
        desc: "Gain a Health Potion.",
        effect: { type: "potion", value: 0, potionId: "health-potion" },
      },
    ],
  },
  {
    title: "Treasure Goblin",
    emoji: "🧌",
    desc: "A cackling goblin drops a pouch as it flees into the darkness.",
    options: [
      {
        label: "Grab the gold",
        desc: "Gain 30 gold.",
        effect: { type: "gold", value: 30 },
      },
      {
        label: "Chase it",
        desc: "Risk 8 HP for a chance at 60 gold.",
        effect: { type: "gold", value: 60 },
      },
    ],
  },
  {
    title: "Ancient Library",
    emoji: "📚",
    desc: "Shelves of forgotten tomes line the walls. Knowledge awaits.",
    options: [
      {
        label: "Study the texts",
        desc: "Gain +5 max HP from arcane knowledge.",
        effect: { type: "maxHp", value: 5 },
      },
      {
        label: "Burn them for warmth",
        desc: "Heal 15 HP.",
        effect: { type: "heal", value: 15 },
      },
    ],
  },
  {
    title: "Word Spirit",
    emoji: "✨",
    desc: "A spectral being made of floating letters materializes before you.",
    options: [
      {
        label: "Accept its blessing",
        desc: "Gain +10% attack multiplier.",
        effect: { type: "tiles", value: 10 },
      },
      {
        label: "Absorb its essence",
        desc: "Heal 20 HP.",
        effect: { type: "heal", value: 20 },
      },
    ],
  },
];

export function getRandomEvent(rng: () => number): GameEvent {
  return EVENT_POOL[Math.floor(rng() * EVENT_POOL.length)];
}
