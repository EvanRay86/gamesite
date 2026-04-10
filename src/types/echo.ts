// Types for ECHO — ghost-run roguelike where death is a tool

// ── Core Enums & Unions ─────────────────────────────────────────────────────

export type GamePhase =
  | "menu"
  | "playing"
  | "dead"
  | "victory"
  | "gameover";

export type DifficultyTier = 1 | 2 | 3 | 4;

export type Direction = "up" | "down" | "left" | "right";

export type Action = Direction | "wait";

// ── Tiles & Map ─────────────────────────────────────────────────────────────

export type TileType =
  | "floor"
  | "wall"
  | "exit"
  | "spawn"
  | "pressure_plate"
  | "lever"
  | "door"
  | "locked_door"
  | "spike_trap"
  | "timed_gate"
  | "key";

export interface Tile {
  type: TileType;
  /** ID linking doors to their trigger (plate/lever). */
  linkId?: string;
  /** Whether door/gate is currently open. */
  open?: boolean;
  /** For timed gates: turns remaining open. */
  timer?: number;
  /** For timed gates: total duration. */
  timerMax?: number;
  /** Whether a key has been picked up from this tile. */
  consumed?: boolean;
}

export interface DungeonMap {
  width: number;
  height: number;
  tiles: Tile[][];
  spawnX: number;
  spawnY: number;
  exitX: number;
  exitY: number;
  seed: number;
  tier: DifficultyTier;
}

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
  id: number;
}

// ── Entities ────────────────────────────────────────────────────────────────

export type EnemyType = "patrol" | "chase" | "guard";

export interface EnemyDef {
  type: EnemyType;
  /** For patrol: waypoints as [x,y] pairs. */
  patrol?: [number, number][];
  /** Current patrol index. */
  patrolIndex?: number;
  /** For patrol: direction (1 or -1). */
  patrolDir?: number;
}

export interface Enemy {
  id: number;
  x: number;
  y: number;
  def: EnemyDef;
  alive: boolean;
}

// ── Echo System ─────────────────────────────────────────────────────────────

export interface Echo {
  id: number;
  actions: Action[];
  /** Color for rendering. */
  color: string;
  /** Current position during replay. */
  x: number;
  y: number;
  alive: boolean;
  /** Whether this echo is carrying a key. */
  hasKey: boolean;
}

// ── Player ──────────────────────────────────────────────────────────────────

export interface PlayerState {
  x: number;
  y: number;
  alive: boolean;
  hasKey: boolean;
}

// ── Full Game State ─────────────────────────────────────────────────────────

export interface GameState {
  phase: GamePhase;
  dungeon: DungeonMap;
  player: PlayerState;
  echoes: Echo[];
  enemies: Enemy[];
  /** Actions recorded this life. */
  currentActions: Action[];
  /** Global turn counter (resets each life). */
  turn: number;
  /** Total echoes used (lives - 1). */
  echoCount: number;
  /** Current difficulty tier. */
  tier: DifficultyTier;
  /** Whether this is a daily dungeon. */
  isDaily: boolean;
  /** Dungeon seed. */
  seed: number;
  /** Timestamp when run started. */
  startTime: number;
  /** Total turns across all lives for this dungeon. */
  totalTurns: number;
  /** Door states keyed by linkId. */
  doorStates: Record<string, boolean>;
}

// ── Meta Progression (localStorage) ────────────────────────────────────────

export interface EchoMeta {
  totalRuns: number;
  dungeonCleared: number;
  totalEchoesUsed: number;
  bestEchoes: Record<number, number>; // tier → fewest echoes
  bestTurns: Record<number, number>;  // tier → fewest total turns
  dailyHistory: Record<string, { echoes: number; turns: number }>;
}

// ── Renderer Types ──────────────────────────────────────────────────────────

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface ScreenShake {
  x: number;
  y: number;
  duration: number;
  intensity: number;
  elapsed: number;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const ECHO_COLORS = [
  "#00ffff", // cyan
  "#ff00ff", // magenta
  "#00ff88", // lime
  "#ff7777", // coral
  "#ffdd44", // gold
  "#88aaff", // periwinkle
  "#ff8800", // orange
  "#88ff88", // green
];

export const TILE_SIZE = 32;
export const CANVAS_W = 800;
export const CANVAS_H = 544; // 17 rows * 32
export const GRID_W = 25;
export const GRID_H = 17;
