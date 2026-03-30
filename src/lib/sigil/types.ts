// ── SIGIL: The Runeweaving Roguelike — Type Definitions ─────────────────────

export type Element = "ignis" | "glacius" | "voltis" | "umbra" | "arcana";

export type PatternKind =
  | "line_h"      // horizontal line of 3
  | "line_v"      // vertical line of 3
  | "line_d1"     // diagonal top-left to bottom-right
  | "line_d2"     // diagonal top-right to bottom-left
  | "l_shape"     // L-shape (3 cells)
  | "cross"       // plus/cross (5 cells or 3-cell T)
  | "corners"     // diagonal pair
  | "full_row"    // entire row filled
  | "full_col";   // entire column filled

export type PatternBonus =
  | "surge"       // double power
  | "ricochet"    // hits all enemies
  | "shield"      // gain block
  | "leech"       // heal
  | "overcharge"; // bonus energy next turn

export interface GridCell {
  row: number;
  col: number;
  rune: Rune | null;
  /** Cells glow when part of a resolved pattern */
  glowElement?: Element;
  /** Animation state */
  anim?: "placing" | "resolving" | "clearing";
}

export interface Rune {
  id: string;
  name: string;
  element: Element;
  baseDamage: number;
  baseBlock: number;
  energyCost: number;
  description: string;
  /** Rarity affects drop rates and visual treatment */
  rarity: "common" | "uncommon" | "rare" | "legendary";
  /** Special keyword abilities */
  keywords: RuneKeyword[];
  /** If true, rune persists on grid after weaving (doesn't get consumed) */
  persistent?: boolean;
  /** Upgrade level (0 = base, 1 = upgraded) */
  upgraded?: boolean;
}

export type RuneKeyword =
  | "burn"        // apply 2 burn (DoT) to target
  | "freeze"      // apply 1 freeze (skip turn) to target
  | "shock"       // chain 50% damage to adjacent enemy
  | "poison"      // apply 3 poison to target
  | "duplicate"   // copy this rune to a random empty grid cell
  | "wildcard"    // copies the element of an adjacent rune
  | "amplify"     // +2 damage for each adjacent rune of same element
  | "shatter"     // deal 2x to frozen enemies
  | "ignite"      // consume all burn stacks for instant damage
  | "siphon"      // steal 1 energy from enemy (gain 1 energy)
  | "echo"        // trigger this rune's effect twice
  | "volatile"    // explodes on resolve: clears adjacent cells, +4 damage each
  | "fortify"     // +3 block for each adjacent rune
  | "drain";      // heal for 50% of damage dealt

export interface Enemy {
  id: string;
  name: string;
  emoji: string;
  maxHp: number;
  hp: number;
  element: Element;
  /** What the enemy intends to do this turn */
  intent: EnemyIntent;
  /** Status effects on the enemy */
  statuses: StatusEffect[];
  /** Pattern of intents the enemy cycles through */
  intentPattern: EnemyIntentType[];
  intentIndex: number;
  /** Damage multiplier for elites/bosses */
  damageScale: number;
  isBoss?: boolean;
  isElite?: boolean;
}

export type EnemyIntentType = "attack" | "defend" | "buff" | "debuff" | "summon";

export interface EnemyIntent {
  type: EnemyIntentType;
  value: number;
  description: string;
}

export interface StatusEffect {
  type: "burn" | "freeze" | "poison" | "weak" | "vulnerable" | "strength" | "thorns";
  stacks: number;
  /** Number of turns remaining (-1 = permanent until consumed) */
  duration: number;
}

export interface Relic {
  id: string;
  name: string;
  emoji: string;
  description: string;
  rarity: "common" | "uncommon" | "rare" | "boss";
  /** Effect is applied by the engine based on the relic ID */
  passive: boolean;
}

export type CharacterClass = "pyromancer" | "chronomancer" | "voidwalker" | "stormcaller";

export interface PlayerState {
  hp: number;
  maxHp: number;
  block: number;
  energy: number;
  maxEnergy: number;
  gold: number;
  deck: Rune[];
  hand: Rune[];
  drawPile: Rune[];
  discardPile: Rune[];
  relics: Relic[];
  characterClass: CharacterClass;
  /** Current floor in the run */
  floor: number;
  /** Current act (1-3) */
  act: number;
  /** Total score for this run */
  score: number;
  /** Meta-progression: mastery XP */
  masteryXp: number;
  /** Ascension level (difficulty modifier) */
  ascension: number;
  /** Can rewind one placement per turn (Chronomancer) */
  rewindsLeft: number;
  /** Bonus energy carried from overcharge */
  bonusEnergy: number;
}

export type NodeType = "combat" | "elite" | "shop" | "rest" | "event" | "boss" | "treasure";

export interface MapNode {
  id: string;
  row: number;
  col: number;
  type: NodeType;
  /** IDs of nodes this connects to */
  connections: string[];
  visited: boolean;
  /** Current node the player is on */
  current?: boolean;
}

export interface GameMap {
  nodes: MapNode[];
  /** Rows of node IDs for rendering */
  rows: string[][];
}

export interface ShopItem {
  rune?: Rune;
  relic?: Relic;
  price: number;
  sold: boolean;
  type: "rune" | "relic" | "remove_rune";
}

export interface EventChoice {
  text: string;
  effect: string;
  result?: EventResult;
}

export interface EventResult {
  hpChange?: number;
  goldChange?: number;
  runeReward?: Rune;
  relicReward?: Relic;
  removeRune?: boolean;
  description: string;
}

export interface GameEvent {
  id: string;
  title: string;
  emoji: string;
  description: string;
  choices: EventChoice[];
}

export type GameScreen =
  | "title"
  | "class_select"
  | "map"
  | "combat"
  | "reward"
  | "shop"
  | "rest"
  | "event"
  | "game_over"
  | "victory"
  | "codex";

export interface ResolvedPattern {
  kind: PatternKind;
  bonus: PatternBonus;
  cells: [number, number][];
  totalDamage: number;
  totalBlock: number;
}

export interface WeavingResult {
  patterns: ResolvedPattern[];
  totalDamage: number;
  totalBlock: number;
  bonusEnergy: number;
  healed: number;
  hitAll: boolean;
  cellsConsumed: [number, number][];
  statusesApplied: { target: number; status: StatusEffect }[];
}

export interface CombatState {
  enemies: Enemy[];
  grid: GridCell[][];
  turnNumber: number;
  /** Animation queue for sequencing visual effects */
  phase: "player_turn" | "weaving" | "enemy_turn" | "reward";
  weavingResult: WeavingResult | null;
}

export interface RunState {
  player: PlayerState;
  map: GameMap;
  combat: CombatState | null;
  screen: GameScreen;
  seed: number;
  /** Daily challenge flag */
  isDaily: boolean;
  /** Run history for score tracking */
  runesPlayed: number;
  patternsWoven: number;
  enemiesKilled: number;
  elitesKilled: number;
  bossesKilled: number;
  damageDealt: number;
  floorsCleared: number;
}

/** Persisted across runs */
export interface MetaProgress {
  totalRuns: number;
  totalWins: number;
  highestScore: number;
  highestFloor: number;
  masteryXp: number;
  unlockedClasses: CharacterClass[];
  unlockedAscension: number;
  codexRunes: string[];   // IDs of discovered runes
  codexRelics: string[];  // IDs of discovered relics
  codexEnemies: string[]; // IDs of encountered enemies
  dailyBestScore: number;
  dailyLastPlayed: string; // ISO date
}
