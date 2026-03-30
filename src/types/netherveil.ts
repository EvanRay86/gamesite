// NETHERVEIL: Echoes of the Deep — Type definitions
// A roguelike deckbuilder with tactical grid combat

// ── Core Enums & Unions ─────────────────────────────────────────────────────

export type GamePhase =
  | "menu"
  | "class_select"
  | "map"
  | "combat"
  | "reward"
  | "shop"
  | "rest"
  | "event"
  | "treasure"
  | "echo_encounter"
  | "gameover"
  | "victory";

export type ActId = "wastes" | "depths" | "core";

export type NodeType =
  | "combat"
  | "elite"
  | "shop"
  | "rest"
  | "event"
  | "treasure"
  | "echo"
  | "boss";

export type ClassId = "voidwalker" | "embercaster" | "weavekeeper" | "shadowblade";

export type CardRarity = "starter" | "common" | "uncommon" | "rare" | "legendary";

export type StatusType =
  | "burn"
  | "poison"
  | "freeze"
  | "weaken"
  | "strengthen"
  | "shield"
  | "stealth"
  | "thorns"
  | "regen"
  | "vulnerable"
  | "ember_stacks"
  | "shadow_marks"
  | "void_charges"
  | "weave_threads";

export type TargetPattern =
  | "single"
  | "row"
  | "column"
  | "cross"
  | "aoe_2x2"
  | "aoe_3x3"
  | "all_enemies"
  | "self"
  | "self_row"
  | "random_2"
  | "random_3";

export type CardEffectType =
  | "damage"
  | "shield"
  | "heal"
  | "draw"
  | "energy_gain"
  | "apply_status"
  | "move_unit"
  | "summon"
  | "discard_random"
  | "exhaust"
  | "add_temp_card";

export type IntentType = "attack" | "defend" | "buff" | "debuff" | "summon" | "special";

export type RelicTrigger =
  | "on_combat_start"
  | "on_combat_end"
  | "on_turn_start"
  | "on_turn_end"
  | "on_card_play"
  | "on_kill"
  | "on_damage_taken"
  | "on_heal"
  | "passive";

export type RelicRarity = "common" | "uncommon" | "rare" | "boss";

// ── Grid & Positioning ──────────────────────────────────────────────────────

export interface GridPosition {
  row: number; // 0-2
  col: number; // 0-4
}

export interface GridCell {
  unit: GridUnit | null;
}

export interface GridUnit {
  id: string;
  type: "enemy" | "summon";
  enemyState?: EnemyState;
  summonState?: SummonState;
}

export interface SummonState {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  maxHp: number;
  attack: number;
  statusEffects: ActiveStatus[];
}

// ── Status Effects ──────────────────────────────────────────────────────────

export interface ActiveStatus {
  type: StatusType;
  stacks: number;
  duration: number; // -1 = permanent until consumed
}

// ── Cards ───────────────────────────────────────────────────────────────────

export interface CardEffect {
  type: CardEffectType;
  value: number;
  statusType?: StatusType;
  statusDuration?: number;
}

export interface CardDef {
  id: string;
  name: string;
  classId: ClassId | "neutral";
  rarity: CardRarity;
  energyCost: number;
  targetPattern: TargetPattern;
  effects: CardEffect[];
  upgradeEffects?: CardEffect[];
  description: string;
  upgradeDescription?: string;
  emoji: string;
  keywords?: string[];
  exhaust?: boolean;
}

export interface CardInstance {
  instanceId: string;
  defId: string;
  upgraded: boolean;
}

// ── Enemies ─────────────────────────────────────────────────────────────────

export interface EnemyIntent {
  type: IntentType;
  value: number;
  label: string;
  targetPattern?: TargetPattern;
  targetPos?: GridPosition;
}

export interface EnemyAbility {
  type: string;
  value: number;
  desc: string;
}

export interface EnemyDef {
  id: string;
  name: string;
  emoji: string;
  maxHp: number;
  baseAttack: number;
  abilities: EnemyAbility[];
  act: ActId | "any";
  isElite: boolean;
  isBoss: boolean;
  preferredRow?: number;
  desc: string;
}

export interface EnemyState {
  defId: string;
  instanceId: string;
  hp: number;
  maxHp: number;
  shield: number;
  intent: EnemyIntent;
  statusEffects: ActiveStatus[];
  turnsAlive: number;
}

// ── Relics ──────────────────────────────────────────────────────────────────

export interface RelicDef {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  rarity: RelicRarity;
  trigger: RelicTrigger;
}

// ── Dungeon Map ─────────────────────────────────────────────────────────────

export interface MapNode {
  id: string;
  row: number;
  col: number;
  type: NodeType;
  connections: string[]; // IDs of nodes in the next column
  visited: boolean;
}

export interface DungeonFloor {
  nodes: MapNode[];
  act: ActId;
  floor: number;
}

// ── Events ──────────────────────────────────────────────────────────────────

export interface EventEffect {
  type: "heal" | "damage" | "gold" | "relic" | "card" | "maxHp" | "remove_card" | "upgrade_card" | "energy";
  value: number;
  relicId?: string;
  cardId?: string;
}

export interface EventOption {
  label: string;
  desc: string;
  effects: EventEffect[];
}

export interface GameEvent {
  title: string;
  emoji: string;
  desc: string;
  options: EventOption[];
}

// ── Shop ────────────────────────────────────────────────────────────────────

export interface ShopItem {
  type: "card" | "relic" | "remove_card";
  id?: string;
  price: number;
  sold: boolean;
}

// ── Character Classes ───────────────────────────────────────────────────────

export interface ClassDef {
  id: ClassId;
  name: string;
  emoji: string;
  description: string;
  color: string;
  starterDeckIds: string[];
  startingRelicId: string;
  mechanic: {
    name: string;
    desc: string;
    statusType: StatusType;
  };
  locked?: boolean;
}

// ── Combat State ────────────────────────────────────────────────────────────

export interface CombatState {
  enemyGrid: (GridCell)[][]; // 3 rows x 5 cols
  playerStatuses: ActiveStatus[];
  hand: CardInstance[];
  drawPile: CardInstance[];
  discardPile: CardInstance[];
  exhaustPile: CardInstance[];
  energy: number;
  maxEnergy: number;
  turnCount: number;
  selectedCardInstanceId: string | null;
  targetingMode: boolean;
  validTargets: GridPosition[];
}

// ── Player State ────────────────────────────────────────────────────────────

export interface PlayerState {
  hp: number;
  maxHp: number;
  gold: number;
  classId: ClassId;
  deck: CardInstance[];
  relics: string[];
}

// ── Run Stats ───────────────────────────────────────────────────────────────

export interface RunStats {
  totalDamage: number;
  cardsPlayed: number;
  enemiesKilled: number;
  elitesKilled: number;
  bossesKilled: number;
  floorsCleared: number;
  goldEarned: number;
  highestSingleHit: number;
  score: number;
}

// ── Rewards ─────────────────────────────────────────────────────────────────

export type RewardType = "card" | "relic" | "gold";

export interface CardRewardChoice {
  defId: string;
}

export interface RewardSet {
  gold: number;
  cardChoices: CardRewardChoice[];
  relicId?: string;
}

// ── Full Game State ─────────────────────────────────────────────────────────

export interface GameState {
  phase: GamePhase;
  player: PlayerState;
  stats: RunStats;
  currentFloor: DungeonFloor | null;
  act: ActId;
  floor: number;
  seed: number;
  combat: CombatState | null;
  rewards: RewardSet | null;
  shop: ShopItem[] | null;
  event: GameEvent | null;
  currentNodeId: string | null;
  isDailyRun: boolean;
}

// ── Meta Progression (localStorage) ─────────────────────────────────────────

export interface MetaProgress {
  voidEssence: number;
  unlockedCards: string[];
  unlockedRelics: string[];
  unlockedClasses: ClassId[];
  totalRuns: number;
  totalVictories: number;
  bestScore: number;
  bestFloor: number;
  classStats: Record<ClassId, { runs: number; wins: number; bestScore: number }>;
}

// ── Echo System ─────────────────────────────────────────────────────────────

export interface EchoData {
  id: string;
  displayName: string;
  classId: ClassId;
  floor: number;
  deck: CardInstance[];
  relics: string[];
  hpAtDeath: number;
  scoreAtDeath: number;
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
  rotation?: number;
  rotationSpeed?: number;
}

export interface AnimationStep {
  type:
    | "card_play"
    | "projectile"
    | "impact"
    | "damage_number"
    | "status_apply"
    | "unit_death"
    | "enemy_turn"
    | "draw_cards"
    | "heal"
    | "shield_apply"
    | "screen_shake";
  duration: number;
  data: Record<string, unknown>;
  onStart?: () => void;
  onComplete?: () => void;
}

// ── Act Configuration ───────────────────────────────────────────────────────

export const ACT_CONFIG: Record<
  ActId,
  { name: string; floors: [number, number]; emoji: string; bgColor: string; fogColor: string }
> = {
  wastes: {
    name: "The Fractured Wastes",
    floors: [1, 5],
    emoji: "🏚️",
    bgColor: "#1a1a2e",
    fogColor: "#2d1b4e",
  },
  depths: {
    name: "The Abyssal Depths",
    floors: [6, 10],
    emoji: "🌊",
    bgColor: "#0d1b2a",
    fogColor: "#1b2d4e",
  },
  core: {
    name: "The Core",
    floors: [11, 15],
    emoji: "🔮",
    bgColor: "#0a0014",
    fogColor: "#1a0033",
  },
};

// ── Color Constants ─────────────────────────────────────────────────────────

export const CLASS_COLORS: Record<ClassId, string> = {
  voidwalker: "#A855F7",
  embercaster: "#F97316",
  weavekeeper: "#22C55E",
  shadowblade: "#64748B",
};

export const RARITY_COLORS: Record<CardRarity, string> = {
  starter: "#94A3B8",
  common: "#E2E8F0",
  uncommon: "#3B82F6",
  rare: "#F59E0B",
  legendary: "#A855F7",
};

export const STATUS_COLORS: Record<StatusType, string> = {
  burn: "#F97316",
  poison: "#22C55E",
  freeze: "#38BDF8",
  weaken: "#F87171",
  strengthen: "#FBBF24",
  shield: "#60A5FA",
  stealth: "#64748B",
  thorns: "#A3E635",
  regen: "#4ADE80",
  vulnerable: "#FB923C",
  ember_stacks: "#EF4444",
  shadow_marks: "#475569",
  void_charges: "#C084FC",
  weave_threads: "#34D399",
};
