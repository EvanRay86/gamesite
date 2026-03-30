// RIFT — ELO rating calculation
// Standard ELO with K-factor scaling

import type { EloTier } from "@/types/rift";

const BASE_K = 32;

/**
 * Calculate expected score for player A against player B.
 */
function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * K-factor decreases as rating increases (stabilizes high-rated players).
 */
function kFactor(rating: number): number {
  if (rating < 1200) return BASE_K;
  if (rating < 1600) return 24;
  return 16;
}

/**
 * Calculate ELO changes after a duel.
 * Returns [attackerChange, defenderChange].
 */
export function calculateEloChange(
  attackerElo: number,
  defenderElo: number,
  attackerWon: boolean,
): [number, number] {
  const eA = expectedScore(attackerElo, defenderElo);
  const eB = expectedScore(defenderElo, attackerElo);

  const sA = attackerWon ? 1 : 0;
  const sB = attackerWon ? 0 : 1;

  const kA = kFactor(attackerElo);
  const kB = kFactor(defenderElo);

  const changeA = Math.round(kA * (sA - eA));
  const changeB = Math.round(kB * (sB - eB));

  return [changeA, changeB];
}

/**
 * Get the tier name for an ELO rating.
 */
export function getEloTier(elo: number): EloTier {
  if (elo >= 1800) return "Warlord";
  if (elo >= 1600) return "General";
  if (elo >= 1400) return "Commander";
  if (elo >= 1200) return "Captain";
  if (elo >= 1000) return "Soldier";
  return "Recruit";
}

/**
 * Get the color associated with an ELO tier for display.
 */
export function getEloTierColor(tier: EloTier): string {
  switch (tier) {
    case "Warlord":
      return "#FF6B6B";
    case "General":
      return "#A855F7";
    case "Commander":
      return "#F7B731";
    case "Captain":
      return "#45B7D1";
    case "Soldier":
      return "#22C55E";
    case "Recruit":
      return "#6a6a7a";
  }
}

/**
 * Ensure ELO never drops below a floor.
 */
export function clampElo(elo: number): number {
  return Math.max(100, elo);
}
