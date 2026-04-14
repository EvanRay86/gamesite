// Types for Lexicon Quest — word-powered roguelike dungeon crawler

// ── Core Enums & Unions ─────────────────────────────────────────────────────

export type GamePhase =
  | "menu"
  | "map"
  | "combat"
  | "reward"
  | "shop"
  | "rest"
  | "event"
  | "gameover"
  | "victory";

export type ActId = "crypt" | "caverns" | "abyss";

export type NodeType =
  | "combat"
  | "elite"
  | "shop"
  | "rest"
  | "event"
  | "treasure"
  | "boss";

export type TileModifier = "normal" | "golden" | "cursed" | "wildcard" | "frozen";

// ── Letter Tiles ────────────────────────────────────────────────────────────

export interface LetterTile {
  id: number;
  letter: string;
  value: number;
  modifier: TileModifier;
  /** Letter assigned by the player when this is a wildcard tile. */
  assignedLetter?: string;
}

// ── Word Scoring ────────────────────────────────────────────────────────────

export interface DamageBonus {
  label: string;
  amount: number;
}

export type WordTier = "normal" | "strong" | "critical" | "legendary" | "mythic";

export interface WordResult {
  word: string;
  tiles: LetterTile[];
  baseScore: number;
  lengthBonus: number;
  bonuses: DamageBonus[];
  totalDamage: number;
  tier: WordTier;
  isPalindrome: boolean;
  allVowelsUsed: boolean;
}

// ── Enemies ─────────────────────────────────────────────────────────────────

export type EnemyAbilityType =
  | "armor"
  | "dodge_short"
  | "reflect"
  | "steal_tile"
  | "regen"
  | "curse_tile"
  | "burn_tile"
  | "scramble"
  | "ban_letter"
  | "enrage"
  | "summon"
  | "multi_phase";

export interface EnemyAbility {
  type: EnemyAbilityType;
  value: number;
  desc: string;
}

export interface EnemyDef {
  id: string;
  name: string;
  emoji: string;
  maxHp: number;
  baseAttack: number;
  defense: number;
  abilities: EnemyAbility[];
  desc: string;
}

export type IntentType = "attack" | "defend" | "buff" | "debuff" | "special";

export interface EnemyIntent {
  type: IntentType;
  value: number;
  label: string;
}

export interface StatusEffect {
  type: string;
  duration: number;
  value: number;
}

export interface EnemyState {
  def: EnemyDef;
  hp: number;
  maxHp: number;
  shield: number;
  intent: EnemyIntent;
  statusEffects: StatusEffect[];
  phase?: number;
  bannedLetter?: string;
}

// ── Relics ──────────────────────────────────────────────────────────────────

export type RelicRarity = "common" | "uncommon" | "rare";

export type RelicTrigger =
  | "on_word"
  | "on_combat_start"
  | "on_combat_end"
  | "on_kill"
  | "on_damage_taken"
  | "passive";

export interface RelicDef {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  rarity: RelicRarity;
  trigger: RelicTrigger;
}

// ── Potions ─────────────────────────────────────────────────────────────────

export interface PotionDef {
  id: string;
  name: string;
  emoji: string;
  desc: string;
}

// ── Dungeon Map ─────────────────────────────────────────────────────────────

export interface MapNode {
  id: string;
  row: number;
  col: number;
  type: NodeType;
  connections: string[];
  visited: boolean;
}

export interface DungeonFloor {
  nodes: MapNode[];
  act: ActId;
  floor: number;
}

// ── Events ──────────────────────────────────────────────────────────────────

export interface EventOption {
  label: string;
  desc: string;
  effect: EventEffect;
}

export interface EventEffect {
  type: "heal" | "damage" | "gold" | "relic" | "potion" | "maxHp" | "tiles";
  value: number;
  relicId?: string;
  potionId?: string;
}

export interface GameEvent {
  title: string;
  emoji: string;
  desc: string;
  options: EventOption[];
}

// ── Player State ────────────────────────────────────────────────────────────

export interface PlayerState {
  hp: number;
  maxHp: number;
  gold: number;
  attackMult: number;
  defense: number;
  relics: string[];
  potions: string[];
  maxPotions: number;
}

export interface RunStats {
  totalDamage: number;
  longestWord: string;
  highestWordDamage: number;
  wordsFormed: number;
  floorsCleared: number;
  enemiesKilled: number;
  goldEarned: number;
  score: number;
}

// ── Combat State ────────────────────────────────────────────────────────────

export interface CombatState {
  enemies: EnemyState[];
  tiles: LetterTile[];
  selectedTileIds: number[];
  turnCount: number;
  playerShield: number;
  wordsThisCombat: string[];
}

// ── Rewards ─────────────────────────────────────────────────────────────────

export type RewardType = "relic" | "potion" | "gold" | "maxHp";

export interface RewardChoice {
  type: RewardType;
  relicId?: string;
  potionId?: string;
  amount?: number;
}

// ── Shop ────────────────────────────────────────────────────────────────────

export interface ShopItem {
  type: "relic" | "potion" | "heal" | "removeCurse";
  id?: string;
  price: number;
  sold: boolean;
}

// ── Full Game State ─────────────────────────────────────────────────────────

export interface GameState {
  phase: GamePhase;
  player: PlayerState;
  stats: RunStats;
  currentFloor: DungeonFloor;
  act: ActId;
  floor: number;
  seed: number;
  combat: CombatState | null;
  rewards: RewardChoice[] | null;
  shop: ShopItem[] | null;
  event: GameEvent | null;
  currentNodeId: string | null;
  isDailyRun: boolean;
}

// ── Meta Progression (localStorage) ─────────────────────────────────────────

export interface MetaProgress {
  totalRuns: number;
  bestFloor: number;
  bestScore: number;
  longestWord: string;
  highestDamage: number;
  enemiesDefeated: number;
  dailyHistory: Record<string, { score: number; floor: number }>;
}

// ── Renderer Types ──────────────────────────────────────────────────────────

export interface DamageNumber {
  x: number;
  y: number;
  amount: number;
  color: string;
  life: number;
  maxLife: number;
  isCrit: boolean;
}

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

export interface CombatAnimation {
  type: "word_attack" | "enemy_attack" | "heal" | "death" | "shield";
  progress: number;
  duration: number;
  data: Record<string, unknown>;
}
