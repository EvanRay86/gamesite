// Types for the Wordsmith daily roguelike word game

export interface LetterTile {
  letter: string;
  value: number;
  id: number;
  isWildcard?: boolean;
}

export type PowerUpId =
  | "inferno"
  | "surge"
  | "gem-cutter"
  | "vortex"
  | "precision"
  | "chain"
  | "stardust"
  | "reroll"
  | "echo"
  | "tidal"
  | "shield"
  | "alchemy";

export type PowerUpType = "persistent" | "one-time" | "immediate";

export interface PowerUp {
  id: PowerUpId;
  name: string;
  emoji: string;
  description: string;
  type: PowerUpType;
}

export interface ScoreBonus {
  label: string;
  value: number;
}

export interface LetterScoreDetail {
  letter: string;
  baseValue: number;
  modifiedValue: number;
  modifiers: string[];
}

export interface RoundResult {
  roundNumber: number;
  word: string;
  tiles: LetterTile[];
  baseScore: number;
  lengthMultiplier: number;
  bonuses: ScoreBonus[];
  totalScore: number;
  powerUpChosen: PowerUp | null;
}

export type GamePhase =
  | "splash"
  | "playing"
  | "score-breakdown"
  | "choosing-powerup"
  | "rerolling"
  | "results";

export interface WordsmithStats {
  streak: number;
  bestScore: number;
  averageScore: number;
  gamesPlayed: number;
  lastDate: string;
}

export interface WordsmithSavedGame {
  date: string;
  rounds: RoundResult[];
  activePowerUps: PowerUpId[];
  currentRound: number;
  phase: GamePhase;
  totalScore: number;
  allTiles: LetterTile[][];
  allOfferings: PowerUp[][];
  previousWord: string | null;
  rerollUsed: boolean;
  echoUsed: boolean;
}
