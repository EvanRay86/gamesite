// PixelVille — Leveling system

// XP required to reach each level (index = level - 1)
// Level 1: 0 XP, Level 2: 50 XP, Level 3: 150 XP, etc.
const XP_THRESHOLDS: number[] = [];
for (let i = 0; i < 100; i++) {
  XP_THRESHOLDS.push(i === 0 ? 0 : XP_THRESHOLDS[i - 1] + 50 + i * 25);
}

export function getLevelForXp(xp: number): number {
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getXpForLevel(level: number): number {
  return XP_THRESHOLDS[Math.min(level - 1, XP_THRESHOLDS.length - 1)] ?? 0;
}

export function getXpProgress(xp: number): { current: number; needed: number; percent: number } {
  const level = getLevelForXp(xp);
  const currentThreshold = getXpForLevel(level);
  const nextThreshold = getXpForLevel(level + 1);
  const current = xp - currentThreshold;
  const needed = nextThreshold - currentThreshold;
  return { current, needed, percent: needed > 0 ? current / needed : 1 };
}

export { XP_THRESHOLDS };
