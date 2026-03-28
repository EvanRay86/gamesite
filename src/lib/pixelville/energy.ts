// PixelVille — Energy system (calculated from timestamp, no background workers)

const ENERGY_REGEN_INTERVAL_MS = 60_000; // 1 energy per minute
const MAX_ENERGY_DEFAULT = 100;

export function calculateCurrentEnergy(
  storedEnergy: number,
  maxEnergy: number,
  energyRechargedAt: string,
): number {
  if (storedEnergy >= maxEnergy) return maxEnergy;

  const elapsed = Date.now() - new Date(energyRechargedAt).getTime();
  const regained = Math.floor(elapsed / ENERGY_REGEN_INTERVAL_MS);
  return Math.min(maxEnergy, storedEnergy + regained);
}

export function canSpendEnergy(
  storedEnergy: number,
  maxEnergy: number,
  energyRechargedAt: string,
  cost: number,
): boolean {
  return calculateCurrentEnergy(storedEnergy, maxEnergy, energyRechargedAt) >= cost;
}

export function spendEnergy(
  storedEnergy: number,
  maxEnergy: number,
  energyRechargedAt: string,
  cost: number,
): { newEnergy: number; newRechargedAt: string } {
  const current = calculateCurrentEnergy(storedEnergy, maxEnergy, energyRechargedAt);
  if (current < cost) throw new Error("Not enough energy");
  return {
    newEnergy: current - cost,
    newRechargedAt: new Date().toISOString(),
  };
}

export { MAX_ENERGY_DEFAULT, ENERGY_REGEN_INTERVAL_MS };
