// RIFT — Conquer the Map Through Brain Power
// TypeScript type definitions

// ── Factions ─────────────────────────────────────────────────────────────────

export type Faction = "crimson" | "verdant" | "azure";

export const FACTION_COLORS: Record<Faction, string> = {
  crimson: "#FF6B6B",
  verdant: "#22C55E",
  azure: "#45B7D1",
};

export const FACTION_NAMES: Record<Faction, string> = {
  crimson: "Crimson",
  verdant: "Verdant",
  azure: "Azure",
};

// ── Hex Grid ─────────────────────────────────────────────────────────────────

export type HexType = "plains" | "fortress" | "capital" | "ruins";

export interface HexCoord {
  q: number;
  r: number;
}

export interface RiftHex {
  id: number;
  q: number;
  r: number;
  hexType: HexType;
  faction: Faction | null;
  capturedAt: string | null;
  capturedBy: string | null;
}

// ── Players ──────────────────────────────────────────────────────────────────

export type EloTier =
  | "Recruit"
  | "Soldier"
  | "Captain"
  | "Commander"
  | "General"
  | "Warlord";

export interface RiftPlayer {
  id: string;
  userId: string;
  faction: Faction;
  elo: number;
  seasonId: number;
  attackTokens: number;
  tokensRefreshedAt: string;
  wins: number;
  losses: number;
  hexesCaptured: number;
  hexesDefended: number;
  displayName: string | null;
}

// ── Duels ────────────────────────────────────────────────────────────────────

export type DuelPuzzleType =
  | "word_blitz"
  | "number_crunch"
  | "quick_fire"
  | "chain_link"
  | "letter_lock"
  | "rank_it";

export type DuelStatus = "pending" | "active" | "completed" | "expired";

export interface DuelPuzzleData {
  type: DuelPuzzleType;
  seed: number;
  /** Puzzle-specific payload (varies by type) */
  payload: Record<string, unknown>;
}

export interface RiftDuel {
  id: string;
  seasonId: number;
  hexId: number;
  attackerId: string;
  defenderId: string | null;
  puzzleType: DuelPuzzleType;
  puzzleData: DuelPuzzleData;
  attackerScore: number | null;
  defenderScore: number | null;
  winnerId: string | null;
  attackerEloChange: number | null;
  defenderEloChange: number | null;
  status: DuelStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface DuelResult {
  won: boolean;
  myScore: number;
  opponentScore: number;
  eloChange: number;
  hexCaptured: boolean;
  hex: HexCoord;
  puzzleType: DuelPuzzleType;
  opponentName: string | null;
  opponentFaction: Faction;
}

// ── Seasons ──────────────────────────────────────────────────────────────────

export interface RiftSeason {
  id: number;
  seasonNumber: number;
  startsAt: string;
  endsAt: string;
  winnerFaction: Faction | null;
  isActive: boolean;
}

// ── Events / Activity Feed ───────────────────────────────────────────────────

export type RiftEventType =
  | "capture"
  | "defend"
  | "season_start"
  | "season_end";

export interface RiftEvent {
  id: number;
  seasonId: number;
  eventType: RiftEventType;
  data: {
    playerName?: string;
    faction?: Faction;
    hex?: HexCoord;
    defenderFaction?: Faction;
    winnerFaction?: Faction;
  };
  createdAt: string;
}

// ── Game State (client-side) ─────────────────────────────────────────────────

export type RiftScreen =
  | "loading"
  | "faction_select"
  | "map"
  | "searching"
  | "duel"
  | "result";

export interface RiftGameState {
  screen: RiftScreen;
  season: RiftSeason | null;
  player: RiftPlayer | null;
  hexes: RiftHex[];
  selectedHex: HexCoord | null;
  activeDuel: RiftDuel | null;
  lastResult: DuelResult | null;
  events: RiftEvent[];
  factionCounts: Record<Faction, number>;
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export interface RiftChatMessage {
  id: string;
  playerName: string;
  faction: Faction;
  message: string;
  createdAt: string;
}

// ── Leaderboard ──────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  faction: Faction;
  elo: number;
  wins: number;
  hexesCaptured: number;
}
