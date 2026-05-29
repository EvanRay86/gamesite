// Outrank — shared types for the "Which Is More?" duel game.

export interface OutrankItem {
  id: string;
  category: string;
  label: string;
  /** Comparable value in the category's canonical unit. */
  value: number;
  emoji: string | null;
  image_url: string | null;
  source: string | null;
  blurb: string | null;
}

export interface OutrankChallenge {
  id: string;
  /** 32-bit seed the challenger played; the friend replays it exactly. */
  seed: number;
  challengerName: string;
  challengerScore: number;
  categorySet: string;
  poolVersion: number;
}
