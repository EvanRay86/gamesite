"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSupabaseClient, getPlayerId } from "@/lib/supabase-client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Upgrade {
  id: string;
  name: string;
  description: string;
  emoji: string;
  baseCost: number;
  /** Leaves per second this upgrade generates */
  lps: number;
  /** Bonus leaves per click (if any) */
  clickBonus: number;
  owned: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  value: number;
}

interface Achievement {
  id: string;
  name: string;
  emoji: string;
  description: string;
  check: (state: GameState) => boolean;
  reward: string; // description of reward
  multiplier: number; // production multiplier bonus (e.g. 1.01 = +1%)
}

interface GameState {
  leaves: number;
  totalLeaves: number;
  totalClicks: number;
  leavesPerSecond: number;
  leavesPerClick: number;
  upgrades: Upgrade[];
  prestigeLevel: number;
  essenceCount: number;
}

interface SaveData {
  leaves: number;
  totalLeaves: number;
  totalClicks: number;
  upgrades: Record<string, number>;
  lastSave: number;
  // Prestige
  prestigeLevel?: number;
  essenceCount?: number;
  lifetimeLeaves?: number;
  lifetimeClicks?: number;
  // Achievements
  unlockedAchievements?: string[];
  // Golden leaf
  goldenLeavesClicked?: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SAVE_KEY = "koala-clicker-save";

const INITIAL_UPGRADES: Upgrade[] = [
  {
    id: "baby-koala",
    name: "Baby Koala",
    emoji: "🐨",
    description: "A little helper that nibbles leaves for you.",
    baseCost: 15,
    lps: 0.1,
    clickBonus: 0,
    owned: 0,
  },
  {
    id: "eucalyptus-bush",
    name: "Eucalyptus Bush",
    emoji: "🌿",
    description: "A small bush that grows fresh leaves.",
    baseCost: 100,
    lps: 1,
    clickBonus: 0,
    owned: 0,
  },
  {
    id: "koala-paws",
    name: "Koala Paws",
    emoji: "🐾",
    description: "Stronger paws for better clicking.",
    baseCost: 250,
    lps: 0,
    clickBonus: 1,
    owned: 0,
  },
  {
    id: "eucalyptus-tree",
    name: "Eucalyptus Tree",
    emoji: "🌳",
    description: "A full tree with plenty of leaves.",
    baseCost: 500,
    lps: 8,
    clickBonus: 0,
    owned: 0,
  },
  {
    id: "koala-colony",
    name: "Koala Colony",
    emoji: "🏘️",
    description: "A cozy colony of leaf-gathering koalas.",
    baseCost: 2000,
    lps: 30,
    clickBonus: 0,
    owned: 0,
  },
  {
    id: "golden-claws",
    name: "Golden Claws",
    emoji: "✨",
    description: "Enchanted claws that make each click powerful.",
    baseCost: 5000,
    lps: 0,
    clickBonus: 10,
    owned: 0,
  },
  {
    id: "eucalyptus-forest",
    name: "Eucalyptus Forest",
    emoji: "🏞️",
    description: "An entire forest dedicated to your koalas.",
    baseCost: 10000,
    lps: 120,
    clickBonus: 0,
    owned: 0,
  },
  {
    id: "koala-sanctuary",
    name: "Koala Sanctuary",
    emoji: "🏛️",
    description: "A world-class sanctuary attracting koalas everywhere.",
    baseCost: 50000,
    lps: 500,
    clickBonus: 0,
    owned: 0,
  },
  {
    id: "leaf-portal",
    name: "Leaf Portal",
    emoji: "🌀",
    description: "A portal to a dimension made entirely of eucalyptus.",
    baseCost: 200000,
    lps: 2000,
    clickBonus: 0,
    owned: 0,
  },
  {
    id: "koala-overlord",
    name: "Koala Overlord",
    emoji: "👑",
    description: "The supreme koala. Generates leaves through sheer authority.",
    baseCost: 1000000,
    lps: 10000,
    clickBonus: 0,
    owned: 0,
  },
  // ── Tier 2: Post-million upgrades ──
  {
    id: "time-warp-tree",
    name: "Time-Warp Tree",
    emoji: "⏳",
    description: "A tree that grows leaves across multiple timelines.",
    baseCost: 5000000,
    lps: 50000,
    clickBonus: 0,
    owned: 0,
  },
  {
    id: "diamond-paws",
    name: "Diamond Paws",
    emoji: "💎",
    description: "Paws forged from crystallized eucalyptus essence.",
    baseCost: 25000000,
    lps: 0,
    clickBonus: 25000,
    owned: 0,
  },
  {
    id: "koala-dimension",
    name: "Koala Dimension",
    emoji: "🌌",
    description: "An entire dimension inhabited solely by koalas.",
    baseCost: 100000000,
    lps: 250000,
    clickBonus: 0,
    owned: 0,
  },
  {
    id: "cosmic-grove",
    name: "Cosmic Grove",
    emoji: "🪐",
    description: "A grove of eucalyptus orbiting a koala-shaped nebula.",
    baseCost: 500000000,
    lps: 1000000,
    clickBonus: 0,
    owned: 0,
  },
  {
    id: "quantum-koala",
    name: "Quantum Koala",
    emoji: "⚛️",
    description: "Exists in all states simultaneously. Produces leaves in each one.",
    baseCost: 2500000000,
    lps: 5000000,
    clickBonus: 0,
    owned: 0,
  },
  // ── Tier 3: Endgame (billions+) ──
  {
    id: "eternal-canopy",
    name: "Eternal Canopy",
    emoji: "🌅",
    description: "A canopy that stretches across infinity, always in bloom.",
    baseCost: 10000000000,
    lps: 25000000,
    clickBonus: 0,
    owned: 0,
  },
  {
    id: "omnipaws",
    name: "Omnipaws",
    emoji: "🔮",
    description: "Transcendent paws that click across all realities at once.",
    baseCost: 50000000000,
    lps: 0,
    clickBonus: 20000000,
    owned: 0,
  },
  {
    id: "multiverse-colony",
    name: "Multiverse Colony",
    emoji: "🌐",
    description: "Koala colonies spanning every universe in the multiverse.",
    baseCost: 250000000000,
    lps: 100000000,
    clickBonus: 0,
    owned: 0,
  },
  {
    id: "leaf-singularity",
    name: "Leaf Singularity",
    emoji: "☀️",
    description: "A black hole made entirely of compressed eucalyptus leaves.",
    baseCost: 1000000000000,
    lps: 500000000,
    clickBonus: 0,
    owned: 0,
  },
  {
    id: "koala-god",
    name: "Koala God",
    emoji: "🦥",
    description: "The all-knowing, all-leaf-producing koala deity.",
    baseCost: 10000000000000,
    lps: 2500000000,
    clickBonus: 0,
    owned: 0,
  },
];

// ── Achievements ─────────────────────────────────────────────────────────────

const ACHIEVEMENTS: Achievement[] = [
  // Click milestones
  { id: "click-1", name: "First Nibble", emoji: "🐾", description: "Click the koala for the first time", check: (s) => s.totalClicks >= 1, reward: "+1% production", multiplier: 1.01 },
  { id: "click-100", name: "Persistent Paws", emoji: "🐾", description: "Click 100 times", check: (s) => s.totalClicks >= 100, reward: "+1% production", multiplier: 1.01 },
  { id: "click-1k", name: "Carpal Koala", emoji: "🐾", description: "Click 1,000 times", check: (s) => s.totalClicks >= 1000, reward: "+2% production", multiplier: 1.02 },
  { id: "click-10k", name: "The Clicker", emoji: "🐾", description: "Click 10,000 times", check: (s) => s.totalClicks >= 10000, reward: "+3% production", multiplier: 1.03 },
  { id: "click-100k", name: "Finger of God", emoji: "🐾", description: "Click 100,000 times", check: (s) => s.totalClicks >= 100000, reward: "+5% production", multiplier: 1.05 },
  // Leaf milestones
  { id: "leaves-1k", name: "Leafy", emoji: "🍃", description: "Earn 1,000 total leaves", check: (s) => s.totalLeaves >= 1000, reward: "+1% production", multiplier: 1.01 },
  { id: "leaves-1m", name: "Millionaire Koala", emoji: "🍃", description: "Earn 1 million total leaves", check: (s) => s.totalLeaves >= 1e6, reward: "+2% production", multiplier: 1.02 },
  { id: "leaves-1b", name: "Billionaire Koala", emoji: "🍃", description: "Earn 1 billion total leaves", check: (s) => s.totalLeaves >= 1e9, reward: "+3% production", multiplier: 1.03 },
  { id: "leaves-1t", name: "Trillionaire Koala", emoji: "🍃", description: "Earn 1 trillion total leaves", check: (s) => s.totalLeaves >= 1e12, reward: "+5% production", multiplier: 1.05 },
  { id: "leaves-1q", name: "Quadrillionaire", emoji: "🍃", description: "Earn 1 quadrillion total leaves", check: (s) => s.totalLeaves >= 1e15, reward: "+10% production", multiplier: 1.10 },
  // LPS milestones
  { id: "lps-10", name: "Passive Income", emoji: "💤", description: "Reach 10 leaves per second", check: (s) => s.leavesPerSecond >= 10, reward: "+1% production", multiplier: 1.01 },
  { id: "lps-1k", name: "Leaf Machine", emoji: "💤", description: "Reach 1,000 leaves per second", check: (s) => s.leavesPerSecond >= 1000, reward: "+2% production", multiplier: 1.02 },
  { id: "lps-1m", name: "Leaf Factory", emoji: "💤", description: "Reach 1M leaves per second", check: (s) => s.leavesPerSecond >= 1e6, reward: "+3% production", multiplier: 1.03 },
  { id: "lps-1b", name: "Leaf Universe", emoji: "💤", description: "Reach 1B leaves per second", check: (s) => s.leavesPerSecond >= 1e9, reward: "+5% production", multiplier: 1.05 },
  // Prestige milestones
  { id: "prestige-1", name: "Rebirth", emoji: "🔄", description: "Ascend for the first time", check: (s) => s.prestigeLevel >= 1, reward: "+5% production", multiplier: 1.05 },
  { id: "prestige-5", name: "Veteran", emoji: "🔄", description: "Ascend 5 times", check: (s) => s.prestigeLevel >= 5, reward: "+10% production", multiplier: 1.10 },
  { id: "prestige-10", name: "Transcendent", emoji: "🔄", description: "Ascend 10 times", check: (s) => s.prestigeLevel >= 10, reward: "+15% production", multiplier: 1.15 },
  { id: "prestige-25", name: "Eternal Koala", emoji: "🔄", description: "Ascend 25 times", check: (s) => s.prestigeLevel >= 25, reward: "+25% production", multiplier: 1.25 },
  // Upgrade count milestones
  { id: "total-50", name: "Collector", emoji: "📦", description: "Own 50 total upgrades", check: (s) => s.upgrades.reduce((a, u) => a + u.owned, 0) >= 50, reward: "+2% production", multiplier: 1.02 },
  { id: "total-100", name: "Hoarder", emoji: "📦", description: "Own 100 total upgrades", check: (s) => s.upgrades.reduce((a, u) => a + u.owned, 0) >= 100, reward: "+3% production", multiplier: 1.03 },
  { id: "total-500", name: "Empire Builder", emoji: "📦", description: "Own 500 total upgrades", check: (s) => s.upgrades.reduce((a, u) => a + u.owned, 0) >= 500, reward: "+5% production", multiplier: 1.05 },
  { id: "total-1000", name: "Koala Tycoon", emoji: "📦", description: "Own 1,000 total upgrades", check: (s) => s.upgrades.reduce((a, u) => a + u.owned, 0) >= 1000, reward: "+10% production", multiplier: 1.10 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Cap numbers to prevent Infinity/NaN from poisoning game state */
const MAX_VALUE = 1e300;
function safeNum(n: number): number {
  if (!Number.isFinite(n)) return n !== n ? 0 : MAX_VALUE; // NaN → 0, ±Inf → cap
  return Math.min(Math.max(n, -MAX_VALUE), MAX_VALUE);
}

function getCost(upgrade: Upgrade): number {
  return Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.owned));
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "∞";
  if (n >= 1e18) return `${(n / 1e18).toFixed(1)}Qi`;
  if (n >= 1e15) return `${(n / 1e15).toFixed(1)}Qa`;
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return Math.floor(n).toLocaleString();
}

/** Calculate essence earned from ascending - based on lifetime leaves */
function calcEssenceGain(lifetimeLeaves: number, currentEssence: number): number {
  // Slower-than-sqrt scaling (exponent 0.4) so hoarding before ascending doesn't break the game
  const raw = Math.floor(Math.pow(Math.min(lifetimeLeaves, MAX_VALUE) / 1e6, 0.4));
  return Math.max(0, safeNum(raw - currentEssence));
}

/** Essence multiplier: logarithmic so it can never explode to Infinity */
function getEssenceMultiplier(essence: number): number {
  // Each essence has diminishing returns — first few are impactful, later ones are gradual
  // 1 essence → x1.35, 10 → x2.20, 100 → x3.31, 1000 → x4.45
  return 1 + Math.log(1 + essence) * 0.5;
}

/** Calculate how many lifetime leaves are needed to reach a given essence total */
function lifetimeLeavesForEssence(essenceTarget: number): number {
  // Inverse of: floor(pow(lifetime / 1e6, 0.4)) = essenceTarget
  return Math.pow(essenceTarget, 2.5) * 1e6;
}

/** Koala titles unlocked by ascending — each ascension earns a new title */
const KOALA_TITLES: { level: number; title: string; emoji: string }[] = [
  { level: 1, title: "Awakened Koala", emoji: "🌱" },
  { level: 2, title: "Enlightened Koala", emoji: "🌿" },
  { level: 3, title: "Mystic Koala", emoji: "🔮" },
  { level: 4, title: "Astral Koala", emoji: "🌙" },
  { level: 5, title: "Celestial Koala", emoji: "⭐" },
  { level: 7, title: "Ethereal Koala", emoji: "💫" },
  { level: 10, title: "Transcendent Koala", emoji: "🌀" },
  { level: 15, title: "Cosmic Koala", emoji: "🪐" },
  { level: 20, title: "Infinite Koala", emoji: "♾️" },
  { level: 25, title: "Eternal Koala", emoji: "👑" },
  { level: 30, title: "Koala Beyond Time", emoji: "🌌" },
  { level: 40, title: "Koala Singularity", emoji: "☀️" },
  { level: 50, title: "The One True Koala", emoji: "🐨" },
];

function getCurrentTitle(prestigeLevel: number): { title: string; emoji: string } | null {
  let best: (typeof KOALA_TITLES)[0] | null = null;
  for (const t of KOALA_TITLES) {
    if (prestigeLevel >= t.level) best = t;
  }
  return best;
}

function getNextTitle(prestigeLevel: number): { title: string; emoji: string; level: number } | null {
  for (const t of KOALA_TITLES) {
    if (prestigeLevel < t.level) return t;
  }
  return null;
}

function buildSaveData(
  leaves: number,
  totalLeaves: number,
  totalClicks: number,
  upgrades: Upgrade[],
  prestigeLevel: number = 0,
  essenceCount: number = 0,
  lifetimeLeaves: number = 0,
  lifetimeClicks: number = 0,
  unlockedAchievements: string[] = [],
  goldenLeavesClicked: number = 0,
): SaveData {
  return {
    leaves,
    totalLeaves,
    totalClicks,
    upgrades: Object.fromEntries(upgrades.map((u) => [u.id, u.owned])),
    lastSave: Date.now(),
    prestigeLevel,
    essenceCount,
    lifetimeLeaves,
    lifetimeClicks,
    unlockedAchievements,
    goldenLeavesClicked,
  };
}

function applySave(save: SaveData): {
  upgrades: Upgrade[];
  leaves: number;
  totalLeaves: number;
  totalClicks: number;
  prestigeLevel: number;
  essenceCount: number;
  lifetimeLeaves: number;
  lifetimeClicks: number;
  unlockedAchievements: string[];
  goldenLeavesClicked: number;
} {
  const elapsed = (Date.now() - save.lastSave) / 1000;
  const restoredUpgrades = INITIAL_UPGRADES.map((u) => ({
    ...u,
    owned: save.upgrades[u.id] || 0,
  }));
  const essenceMultiplier = safeNum(getEssenceMultiplier(save.essenceCount || 0));
  const offlineLps = safeNum(restoredUpgrades.reduce(
    (sum, u) => sum + u.lps * u.owned,
    0,
  ) * essenceMultiplier);
  const offlineEarnings = safeNum(Math.floor(
    offlineLps * Math.min(elapsed, 28800),
  )); // cap at 8hrs

  return {
    upgrades: restoredUpgrades,
    leaves: safeNum(save.leaves + offlineEarnings),
    totalLeaves: safeNum(save.totalLeaves + offlineEarnings),
    totalClicks: save.totalClicks,
    prestigeLevel: save.prestigeLevel || 0,
    essenceCount: save.essenceCount || 0,
    lifetimeLeaves: save.lifetimeLeaves || save.totalLeaves || 0,
    lifetimeClicks: save.lifetimeClicks || save.totalClicks || 0,
    unlockedAchievements: save.unlockedAchievements || [],
    goldenLeavesClicked: save.goldenLeavesClicked || 0,
  };
}

// ── Cloud save helpers ────────────────────────────────────────────────────────

async function loadCloudSave(playerId: string): Promise<SaveData | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("koala_saves")
      .select("save_data")
      .eq("player_id", playerId)
      .single();

    if (error || !data) return null;
    return data.save_data as SaveData;
  } catch {
    return null;
  }
}

async function writeCloudSave(
  playerId: string,
  save: SaveData,
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.from("koala_saves").upsert(
      {
        player_id: playerId,
        save_data: save,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "player_id" },
    );
  } catch {
    // Silent fail — localStorage is the backup
  }
}

/** Pick whichever save has more total progress */
function pickBestSave(a: SaveData | null, b: SaveData | null): SaveData | null {
  if (!a) return b;
  if (!b) return a;
  return a.totalLeaves >= b.totalLeaves ? a : b;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function KoalaClicker() {
  const [leaves, setLeaves] = useState(0);
  const [totalLeaves, setTotalLeaves] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [upgrades, setUpgrades] = useState<Upgrade[]>(INITIAL_UPGRADES);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [koalaScale, setKoalaScale] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<"off" | "synced" | "saving">("off");
  // Prestige
  const [prestigeLevel, setPrestigeLevel] = useState(0);
  const [essenceCount, setEssenceCount] = useState(0);
  const [lifetimeLeaves, setLifetimeLeaves] = useState(0);
  const [lifetimeClicks, setLifetimeClicks] = useState(0);
  const [showPrestigeConfirm, setShowPrestigeConfirm] = useState(false);
  const [showAscendCelebration, setShowAscendCelebration] = useState<{
    essenceGained: number;
    newTotal: number;
    oldMultiplier: number;
    newMultiplier: number;
    newPrestigeLevel: number;
    titleUnlocked: { title: string; emoji: string } | null;
  } | null>(null);
  // Achievements
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  // Golden leaf
  const [goldenLeaf, setGoldenLeaf] = useState<{ x: number; y: number } | null>(null);
  const [goldenLeavesClicked, setGoldenLeavesClicked] = useState(0);

  const floatId = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerIdRef = useRef<string>("");

  // Derived values
  const essenceMultiplier = safeNum(getEssenceMultiplier(essenceCount));
  const achievementMultiplier = ACHIEVEMENTS
    .filter((a) => unlockedAchievements.includes(a.id))
    .reduce((m, a) => m * a.multiplier, 1);
  const totalMultiplier = safeNum(essenceMultiplier * achievementMultiplier);

  const baseLeavesPerClick =
    1 + upgrades.reduce((sum, u) => sum + u.clickBonus * u.owned, 0);
  const leavesPerClick = safeNum(Math.floor(baseLeavesPerClick * totalMultiplier));
  const baseLeavesPerSecond = upgrades.reduce(
    (sum, u) => sum + u.lps * u.owned,
    0,
  );
  const leavesPerSecond = safeNum(baseLeavesPerSecond * totalMultiplier);

  // ── Load save (localStorage + cloud, pick best) ───────────────────
  useEffect(() => {
    async function load() {
      const playerId = getPlayerId();
      playerIdRef.current = playerId;

      // Load localStorage save
      let localSave: SaveData | null = null;
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) localSave = JSON.parse(raw);
      } catch {
        // Corrupted
      }

      // Load cloud save
      const cloudSave = await loadCloudSave(playerId);
      if (cloudSave) setCloudStatus("synced");

      // Pick best
      const best = pickBestSave(localSave, cloudSave);
      if (best) {
        const restored = applySave(best);
        setUpgrades(restored.upgrades);
        setLeaves(restored.leaves);
        setTotalLeaves(restored.totalLeaves);
        setTotalClicks(restored.totalClicks);
        setPrestigeLevel(restored.prestigeLevel);
        setEssenceCount(restored.essenceCount);
        setLifetimeLeaves(restored.lifetimeLeaves);
        setLifetimeClicks(restored.lifetimeClicks);
        setUnlockedAchievements(restored.unlockedAchievements);
        setGoldenLeavesClicked(restored.goldenLeavesClicked);
      }

      setLoaded(true);
    }
    load();
  }, []);

  // ── Save to localStorage ──────────────────────────────────────────
  const saveToLocal = useCallback(() => {
    const save = buildSaveData(leaves, totalLeaves, totalClicks, upgrades, prestigeLevel, essenceCount, lifetimeLeaves, lifetimeClicks, unlockedAchievements, goldenLeavesClicked);
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      // Storage full
    }
    return save;
  }, [leaves, totalLeaves, totalClicks, upgrades, prestigeLevel, essenceCount, lifetimeLeaves, lifetimeClicks, unlockedAchievements, goldenLeavesClicked]);

  // ── Save to cloud ─────────────────────────────────────────────────
  const saveToCloud = useCallback(
    async (save: SaveData) => {
      if (!playerIdRef.current) return;
      setCloudStatus("saving");
      await writeCloudSave(playerIdRef.current, save);
      setCloudStatus("synced");
    },
    [],
  );

  // ── Auto-save every 5s (local) + every 30s (cloud) ────────────────
  const cloudTickRef = useRef(0);
  useEffect(() => {
    if (!loaded) return;
    const interval = setInterval(() => {
      const save = saveToLocal();
      cloudTickRef.current++;
      // Cloud save every 6th tick (30s)
      if (cloudTickRef.current % 6 === 0) {
        saveToCloud(save);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [loaded, saveToLocal, saveToCloud]);

  // Save on unmount + visibility change (mobile browsers don't fire beforeunload)
  useEffect(() => {
    const doSave = () => {
      const save = buildSaveData(leaves, totalLeaves, totalClicks, upgrades, prestigeLevel, essenceCount, lifetimeLeaves, lifetimeClicks, unlockedAchievements, goldenLeavesClicked);
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(save));
      } catch {
        // ignore
      }
      // Best-effort cloud save via sendBeacon
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey && playerIdRef.current) {
        const body = JSON.stringify({
          player_id: playerIdRef.current,
          save_data: save,
          updated_at: new Date().toISOString(),
        });
        navigator.sendBeacon(
          `${supabaseUrl}/rest/v1/koala_saves?on_conflict=player_id`,
          new Blob([body], { type: "application/json" }),
        );
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") doSave();
    };
    window.addEventListener("beforeunload", doSave);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("beforeunload", doSave);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [leaves, totalLeaves, totalClicks, upgrades, prestigeLevel, essenceCount, lifetimeLeaves, lifetimeClicks, unlockedAchievements, goldenLeavesClicked]);

  // ── Production tick (10 times/sec) ──────────────────────────────────
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (leavesPerSecond > 0) {
      tickRef.current = setInterval(() => {
        const increment = leavesPerSecond / 10;
        setLeaves((l) => safeNum(l + increment));
        setTotalLeaves((t) => safeNum(t + increment));
        setLifetimeLeaves((lt) => safeNum(lt + increment));
      }, 100);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [leavesPerSecond]);

  // ── Click handler ───────────────────────────────────────────────────
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      setLeaves((l) => safeNum(l + leavesPerClick));
      setTotalLeaves((t) => safeNum(t + leavesPerClick));
      setLifetimeLeaves((lt) => safeNum(lt + leavesPerClick));
      setTotalClicks((c) => safeNum(c + 1));
      setLifetimeClicks((c) => safeNum(c + 1));

      // Bounce animation
      setKoalaScale(1.15);
      setTimeout(() => setKoalaScale(1), 100);

      // Floating text
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left + (Math.random() - 0.5) * 40;
      const y = e.clientY - rect.top - 20;
      const id = floatId.current++;
      setFloatingTexts((prev) => [
        ...prev,
        { id, x, y, value: leavesPerClick },
      ]);
      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((f) => f.id !== id));
      }, 800);
    },
    [leavesPerClick],
  );

  // ── Buy upgrade ─────────────────────────────────────────────────────
  const buyUpgrade = useCallback(
    (upgradeId: string) => {
      const upgrade = upgrades.find((u) => u.id === upgradeId);
      if (!upgrade) return;
      const cost = getCost(upgrade);
      if (leaves < cost) return;

      const newLeaves = leaves - cost;
      const newUpgrades = upgrades.map((u) =>
        u.id === upgradeId ? { ...u, owned: u.owned + 1 } : u,
      );
      setLeaves(newLeaves);
      setUpgrades(newUpgrades);

      // Save immediately after purchase
      try {
        const save = buildSaveData(newLeaves, totalLeaves, totalClicks, newUpgrades, prestigeLevel, essenceCount, lifetimeLeaves, lifetimeClicks, unlockedAchievements, goldenLeavesClicked);
        localStorage.setItem(SAVE_KEY, JSON.stringify(save));
      } catch {
        // ignore
      }
    },
    [leaves, totalLeaves, totalClicks, upgrades, prestigeLevel, essenceCount, lifetimeLeaves, lifetimeClicks, unlockedAchievements, goldenLeavesClicked],
  );

  // ── Prestige / Ascend ──────────────────────────────────────────────
  const essenceGain = calcEssenceGain(lifetimeLeaves, essenceCount);
  const canAscend = essenceGain > 0;

  const doAscend = useCallback(() => {
    if (!canAscend) return;
    const newPrestige = prestigeLevel + 1;
    const newEssence = essenceCount + essenceGain;
    const oldMult = totalMultiplier;
    const newMult = getEssenceMultiplier(newEssence) * achievementMultiplier;

    // Check if a new title is unlocked by this ascension
    const prevTitle = getCurrentTitle(prestigeLevel);
    const nextTitle = getCurrentTitle(newPrestige);
    const titleUnlocked = nextTitle && nextTitle !== prevTitle ? nextTitle : null;

    setPrestigeLevel(newPrestige);
    setEssenceCount(newEssence);
    // Reset progress but keep prestige stuff
    setLeaves(0);
    setTotalLeaves(0);
    setTotalClicks(0);
    setUpgrades(INITIAL_UPGRADES.map((u) => ({ ...u, owned: 0 })));
    setShowPrestigeConfirm(false);

    // Show celebration
    setShowAscendCelebration({
      essenceGained: essenceGain,
      newTotal: newEssence,
      oldMultiplier: oldMult,
      newMultiplier: newMult,
      newPrestigeLevel: newPrestige,
      titleUnlocked,
    });
  }, [canAscend, essenceGain, prestigeLevel, essenceCount, totalMultiplier, achievementMultiplier]);

  // ── Achievement checking ───────────────────────────────────────────
  useEffect(() => {
    if (!loaded) return;
    const state: GameState = {
      leaves, totalLeaves, totalClicks, leavesPerSecond, leavesPerClick,
      upgrades, prestigeLevel, essenceCount,
    };
    for (const ach of ACHIEVEMENTS) {
      if (!unlockedAchievements.includes(ach.id) && ach.check(state)) {
        setUnlockedAchievements((prev) => [...prev, ach.id]);
        setNewAchievement(ach);
        setTimeout(() => setNewAchievement(null), 3000);
        break; // one at a time
      }
    }
  }, [loaded, leaves, totalLeaves, totalClicks, leavesPerSecond, leavesPerClick, upgrades, prestigeLevel, essenceCount, unlockedAchievements]);

  // (lifetime leaves are tracked directly in the click handler and production tick)

  // ── Golden leaf random event ───────────────────────────────────────
  useEffect(() => {
    if (!loaded) return;
    const spawnGolden = () => {
      if (!goldenLeaf) {
        setGoldenLeaf({
          x: 10 + Math.random() * 70,
          y: 15 + Math.random() * 60,
        });
        // Auto-despawn after 10 seconds
        setTimeout(() => setGoldenLeaf(null), 10000);
      }
    };
    // Spawn every 60-180 seconds
    const interval = setInterval(spawnGolden, (60 + Math.random() * 120) * 1000);
    // First one after 30-60s
    const firstTimeout = setTimeout(spawnGolden, (30 + Math.random() * 30) * 1000);
    return () => { clearInterval(interval); clearTimeout(firstTimeout); };
  }, [loaded, goldenLeaf]);

  const clickGoldenLeaf = useCallback(() => {
    if (!goldenLeaf) return;
    // Golden leaf gives 10% of current LPS * 60 seconds, or 1000 leaves minimum
    const bonus = safeNum(Math.max(1000, Math.floor(leavesPerSecond * 60 * 0.1)));
    setLeaves((l) => safeNum(l + bonus));
    setTotalLeaves((t) => safeNum(t + bonus));
    setLifetimeLeaves((lt) => safeNum(lt + bonus));
    setGoldenLeavesClicked((g) => g + 1);
    setGoldenLeaf(null);

    // Show floating text for golden leaf
    const id = floatId.current++;
    setFloatingTexts((prev) => [
      ...prev,
      { id, x: 100, y: 100, value: bonus },
    ]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((f) => f.id !== id));
    }, 800);
  }, [goldenLeaf, leavesPerSecond]);

  // ── Visual progression ──────────────────────────────────────────────
  const owned = (id: string) => upgrades.find((u) => u.id === id)?.owned ?? 0;
  const totalOwned = upgrades.reduce((s, u) => s + u.owned, 0);

  const hasBabies = owned("baby-koala");
  const hasBushes = owned("eucalyptus-bush");
  const hasPaws = owned("koala-paws");
  const hasTrees = owned("eucalyptus-tree");
  const hasColony = owned("koala-colony");
  const hasGolden = owned("golden-claws");
  const hasForest = owned("eucalyptus-forest");
  const hasSanctuary = owned("koala-sanctuary");
  const hasPortal = owned("leaf-portal");
  const hasOverlord = owned("koala-overlord");
  const hasTimeWarp = owned("time-warp-tree");
  const hasDiamondPaws = owned("diamond-paws");
  const hasDimension = owned("koala-dimension");
  const hasCosmicGrove = owned("cosmic-grove");
  const hasQuantum = owned("quantum-koala");
  const hasEternalCanopy = owned("eternal-canopy");
  const hasOmnipaws = owned("omnipaws");
  const hasMultiverse = owned("multiverse-colony");
  const hasSingularity = owned("leaf-singularity");
  const hasKoalaGod = owned("koala-god");

  // Background evolves based on progression — tiers match unlock order
  // Tier key: which visual "era" are we in?
  type VisualTier = "default" | "bush" | "tree" | "colony" | "golden" | "forest"
    | "sanctuary" | "portal" | "overlord" | "timewarp" | "dimension"
    | "cosmic" | "quantum" | "canopy" | "multiverse" | "singularity" | "god";
  const tier: VisualTier = hasKoalaGod ? "god"
    : hasSingularity ? "singularity"
    : hasMultiverse ? "multiverse"
    : hasEternalCanopy ? "canopy" // omnipaws is a click upgrade, skip for bg
    : hasQuantum ? "quantum"
    : hasCosmicGrove ? "cosmic"
    : hasDimension ? "dimension"
    : hasTimeWarp ? "timewarp" // diamond-paws is a click upgrade, skip for bg
    : hasOverlord ? "overlord"
    : hasPortal ? "portal"
    : hasSanctuary ? "sanctuary"
    : hasForest ? "forest"
    : hasGolden ? "golden"
    : hasColony ? "colony"
    : hasTrees ? "tree"
    : hasBushes ? "bush"
    : "default";

  const bgClass = {
    god:         "from-amber-950 via-yellow-900 to-orange-950",
    singularity: "from-gray-950 via-orange-950 to-red-950",
    multiverse:  "from-slate-950 via-violet-950 to-blue-950",
    canopy:      "from-teal-950 via-emerald-900 to-cyan-950",
    quantum:     "from-cyan-950 via-blue-900 to-indigo-950",
    cosmic:      "from-blue-950 via-indigo-900 to-violet-950",
    dimension:   "from-violet-950 via-fuchsia-900 to-pink-950",
    timewarp:    "from-slate-900 via-purple-900 to-indigo-950",
    overlord:    "from-gray-900 via-indigo-900 to-purple-900",
    portal:      "from-indigo-950 via-purple-900 to-emerald-900",
    sanctuary:   "from-emerald-900 via-teal-800 to-green-900",
    forest:      "from-emerald-800 via-green-700 to-teal-800",
    golden:      "from-green-200 via-amber-50 to-emerald-100",
    colony:      "from-emerald-200 via-green-100 to-lime-100",
    tree:        "from-emerald-200 via-green-100 to-teal-100",
    bush:        "from-green-100 via-emerald-50 to-lime-50",
    default:     "from-green-50 to-emerald-50",
  }[tier];

  // Is it a "dark" theme tier? (for panel styling)
  const isDark = ["portal", "overlord", "timewarp", "dimension", "cosmic", "quantum", "canopy", "multiverse", "singularity", "god"].includes(tier);
  // Is it a "mid" dark tier? (sanctuary/forest — dark bg but green-tinted)
  const isMidDark = ["sanctuary", "forest"].includes(tier);

  const darkTextColors: Record<string, string> = { god: "text-amber-200", singularity: "text-orange-200", multiverse: "text-violet-200", canopy: "text-cyan-200", quantum: "text-cyan-200", cosmic: "text-indigo-200", dimension: "text-fuchsia-200", timewarp: "text-purple-200", overlord: "text-purple-200", portal: "text-purple-200" };
  const darkSubtextColors: Record<string, string> = { god: "text-amber-300", singularity: "text-orange-300", multiverse: "text-violet-300", canopy: "text-cyan-300", quantum: "text-cyan-300", cosmic: "text-indigo-300", dimension: "text-fuchsia-300", timewarp: "text-purple-300", overlord: "text-purple-300", portal: "text-purple-300" };
  const darkDimTextColors: Record<string, string> = { god: "text-amber-300/70", singularity: "text-orange-300/70", multiverse: "text-violet-300/70", canopy: "text-cyan-300/70", quantum: "text-cyan-300/70", cosmic: "text-indigo-300/70", dimension: "text-fuchsia-300/70", timewarp: "text-purple-300/70", overlord: "text-purple-300/70", portal: "text-purple-300/70" };

  const textClass = isDark
    ? darkTextColors[tier] ?? "text-purple-200"
    : isMidDark ? "text-emerald-100"
    : "text-emerald-800";

  const subtextClass = isDark
    ? darkSubtextColors[tier] ?? "text-purple-300"
    : isMidDark ? "text-emerald-200"
    : "text-emerald-600";

  const dimTextClass = isDark
    ? darkDimTextColors[tier] ?? "text-purple-300/70"
    : isMidDark ? "text-emerald-300/70"
    : "text-emerald-500/70";

  // Panel accent colors keyed by dark tier
  const darkPanelAccent: Record<string, { bg950: string; bg900: string; border: string }> = {
    god:         { bg950: "bg-amber-950",   bg900: "bg-amber-900",   border: "border-amber-500/30" },
    singularity: { bg950: "bg-orange-950",  bg900: "bg-orange-900",  border: "border-orange-500/30" },
    multiverse:  { bg950: "bg-violet-950",  bg900: "bg-violet-900",  border: "border-violet-500/30" },
    canopy:      { bg950: "bg-teal-950",    bg900: "bg-teal-900",    border: "border-teal-500/30" },
    quantum:     { bg950: "bg-cyan-950",    bg900: "bg-cyan-900",    border: "border-cyan-500/30" },
    cosmic:      { bg950: "bg-indigo-950",  bg900: "bg-indigo-900",  border: "border-indigo-500/30" },
    dimension:   { bg950: "bg-fuchsia-950", bg900: "bg-fuchsia-900", border: "border-fuchsia-500/30" },
    timewarp:    { bg950: "bg-purple-950",  bg900: "bg-purple-900",  border: "border-purple-500/30" },
    overlord:    { bg950: "bg-indigo-950",  bg900: "bg-indigo-900",  border: "border-indigo-500/30" },
    portal:      { bg950: "bg-indigo-950",  bg900: "bg-purple-900",  border: "border-purple-500/30" },
  };
  const da = isDark ? darkPanelAccent[tier] : null;

  const panelBg = da
    ? `${da.bg950}/80 ${da.border}`
    : isMidDark ? "bg-emerald-900/60 border-emerald-500/30"
    : "bg-white/80 border-emerald-200";

  const panelHeaderBg = da
    ? `${da.bg950}/90 ${da.border}`
    : isMidDark ? "bg-emerald-900/80 border-emerald-500/30"
    : "bg-white/90 border-emerald-200";

  const headerTextClass = isDark ? "text-white/90" : isMidDark ? "text-emerald-100" : "text-emerald-900";
  const headerSubClass = isDark ? "text-white/60" : isMidDark ? "text-emerald-300" : "text-emerald-600";

  const cardBgAfford = da
    ? `border-white/20 ${da.bg900}/40 hover:border-white/40 hover:shadow-md cursor-pointer`
    : isMidDark
      ? "border-emerald-500/40 bg-emerald-900/30 hover:border-emerald-400 hover:shadow-md cursor-pointer"
      : "border-emerald-300 bg-white hover:border-emerald-500 hover:shadow-md cursor-pointer";

  const cardBgLocked = da
    ? `border-white/10 ${da.bg950}/30 opacity-50 cursor-not-allowed`
    : isMidDark
      ? "border-emerald-800/30 bg-emerald-950/30 opacity-50 cursor-not-allowed"
      : "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed";

  const cardNameClass = isDark ? "text-white/90" : isMidDark ? "text-emerald-100" : "text-gray-900";
  const cardDescClass = isDark ? "text-white/50" : isMidDark ? "text-emerald-300" : "text-gray-500";
  const cardCostClass = isDark ? "text-white/60" : isMidDark ? "text-emerald-300" : "text-emerald-600";
  const cardStatClass = isDark ? "text-white/40" : isMidDark ? "text-emerald-400" : "text-gray-400";
  const badgeBg = isDark ? "text-white/70 bg-white/10" : isMidDark ? "text-emerald-200 bg-emerald-800/50" : "text-emerald-700 bg-emerald-100";
  const statCardBg = da
    ? `${da.bg900}/40 ${da.border}`
    : isMidDark ? "bg-emerald-900/30 border-emerald-500/30" : "bg-white/60 border-emerald-200";

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className={`h-[calc(100vh-3rem)] md:h-[calc(100vh-3.5rem)] bg-gradient-to-b ${bgClass} flex flex-col lg:flex-row transition-colors duration-1000 overflow-hidden`}>
      {/* ── Left Panel: Koala + Scene ──────────────────────────────────── */}
      <div className="shrink-0 lg:flex-1 flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-hidden">

        {/* ── Sky layer (portal+) ──────────────────────────────────── */}
        {isDark && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Stars */}
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={`star-${i}`}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${(i * 37 + 13) % 100}%`,
                  top: `${(i * 23 + 7) % 60}%`,
                  opacity: 0.3 + (i % 3) * 0.3,
                  animation: `koala-twinkle ${2 + (i % 3)}s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
            {/* Portal swirl */}
            {hasPortal > 0 && (
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20"
                style={{
                  background: hasKoalaGod
                    ? "conic-gradient(from 0deg, transparent, #f59e0b, transparent, #ef4444, transparent)"
                    : hasSingularity
                      ? "conic-gradient(from 0deg, transparent, #f97316, transparent, #ef4444, transparent)"
                      : hasMultiverse
                        ? "conic-gradient(from 0deg, transparent, #8b5cf6, transparent, #6366f1, transparent)"
                        : hasEternalCanopy
                          ? "conic-gradient(from 0deg, transparent, #2dd4bf, transparent, #06b6d4, transparent)"
                          : hasQuantum
                            ? "conic-gradient(from 0deg, transparent, #06b6d4, transparent, #3b82f6, transparent)"
                            : hasCosmicGrove
                              ? "conic-gradient(from 0deg, transparent, #6366f1, transparent, #8b5cf6, transparent)"
                              : hasDimension
                                ? "conic-gradient(from 0deg, transparent, #d946ef, transparent, #ec4899, transparent)"
                                : "conic-gradient(from 0deg, transparent, #a855f7, transparent, #22c55e, transparent)",
                  animation: `koala-spin ${hasSingularity ? 4 : hasMultiverse ? 5 : 8}s linear infinite`,
                }}
              />
            )}
            {/* Time-warp vortex ring */}
            {hasTimeWarp > 0 && (
              <div
                className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full border-2 border-purple-400/20"
                style={{ animation: "koala-warp 6s ease-in-out infinite" }}
              />
            )}
            {/* Singularity — pulsing core */}
            {hasSingularity > 0 && (
              <div
                className="absolute top-1/2 left-1/2 w-40 h-40 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(249,115,22,0.3) 0%, rgba(239,68,68,0.1) 50%, transparent 70%)",
                  animation: "koala-singularity-pull 3s ease-in-out infinite",
                }}
              />
            )}
            {/* Koala God — radiant halo */}
            {hasKoalaGod > 0 && (
              <div
                className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.05) 50%, transparent 70%)",
                  animation: "koala-halo 5s ease-in-out infinite",
                }}
              />
            )}
          </div>
        )}

        {/* ── Ground layer ─────────────────────────────────────────── */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          {hasBushes > 0 && (
            <div className={`h-16 ${isDark ? "bg-gradient-to-t from-black/30 to-transparent" : isMidDark ? "bg-gradient-to-t from-emerald-900/30 to-transparent" : "bg-gradient-to-t from-emerald-200/60 to-transparent"}`} />
          )}
          {hasBushes > 0 && (
            <div className={`h-1 ${isDark ? "bg-white/10" : isMidDark ? "bg-emerald-600/30" : "bg-emerald-300/50"}`} />
          )}
        </div>

        {/* ── Scene elements (behind koala) ─────────────────────────── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {hasBushes > 0 && Array.from({ length: Math.min(hasBushes, 6) }).map((_, i) => (
            <div key={`bush-${i}`} className="absolute bottom-12 text-2xl sm:text-3xl"
              style={{ left: `${10 + i * 15}%`, animation: `koala-sway ${3 + i * 0.5}s ease-in-out infinite` }}>
              🌿
            </div>
          ))}
          {hasTrees > 0 && Array.from({ length: Math.min(hasTrees, 5) }).map((_, i) => (
            <div key={`tree-${i}`} className="absolute bottom-10 text-4xl sm:text-5xl"
              style={{ left: `${5 + i * 20}%`, animation: `koala-sway ${4 + i * 0.3}s ease-in-out infinite` }}>
              🌳
            </div>
          ))}
          {hasColony > 0 && Array.from({ length: Math.min(hasColony, 4) }).map((_, i) => (
            <div key={`hut-${i}`} className="absolute bottom-10 text-2xl sm:text-3xl"
              style={{ left: `${15 + i * 22}%` }}>
              🏠
            </div>
          ))}
          {hasForest > 0 && (
            <div className="absolute bottom-8 left-0 right-0 flex justify-around opacity-50 text-3xl">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={`forest-${i}`} style={{ animation: `koala-sway ${5 + i * 0.2}s ease-in-out infinite` }}>🌲</span>
              ))}
            </div>
          )}
          {hasSanctuary > 0 && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-4xl sm:text-5xl opacity-60"
              style={{ transform: "translateX(-50%) translateY(-40px)" }}>🏛️</div>
          )}
          {/* Cosmic grove — orbiting planets */}
          {hasCosmicGrove > 0 && Array.from({ length: Math.min(hasCosmicGrove, 4) }).map((_, i) => (
            <div key={`planet-${i}`} className="absolute top-1/2 left-1/2 text-2xl sm:text-3xl"
              style={{ "--orbit-r": `${100 + i * 35}px`, animation: `koala-orbit ${8 + i * 3}s linear ${i * 1.5}s infinite` } as React.CSSProperties}>
              {["🪐", "🌍", "🌙", "☄️"][i]}
            </div>
          ))}
          {/* Eternal canopy — aurora-like glow bands at top */}
          {hasEternalCanopy > 0 && (
            <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none opacity-30"
              style={{ background: "linear-gradient(180deg, rgba(45,212,191,0.4) 0%, rgba(6,182,212,0.2) 40%, transparent 100%)", animation: "koala-halo 4s ease-in-out infinite" }} />
          )}
          {/* Multiverse — flickering portal rifts */}
          {hasMultiverse > 0 && Array.from({ length: Math.min(hasMultiverse, 5) }).map((_, i) => (
            <div key={`rift-${i}`} className="absolute w-0.5 rounded-full"
              style={{
                left: `${12 + i * 18}%`,
                top: `${15 + (i * 17) % 50}%`,
                height: `${30 + i * 10}px`,
                background: `linear-gradient(to bottom, transparent, ${["#8b5cf6", "#6366f1", "#a78bfa", "#818cf8", "#7c3aed"][i]}, transparent)`,
                opacity: 0.5,
                animation: `koala-flicker ${2 + i * 0.7}s ease-in-out ${i * 0.4}s infinite`,
              }}
            />
          ))}
        </div>

        {/* ── Floating particles ────────────────────────────────────── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {hasBushes > 0 && Array.from({ length: Math.min(3 + totalOwned, 15) }).map((_, i) => (
            <div key={`leaf-${i}`} className="absolute text-sm"
              style={{ left: `${(i * 29 + 11) % 100}%`, animation: `koala-drift ${6 + (i % 4) * 2}s linear ${i * 0.8}s infinite`, opacity: 0.4 + (i % 3) * 0.2 }}>
              🍃
            </div>
          ))}
          {hasGolden > 0 && Array.from({ length: Math.min(hasGolden * 2, 10) }).map((_, i) => (
            <div key={`sparkle-${i}`} className="absolute text-xs"
              style={{ left: `${(i * 31 + 17) % 90 + 5}%`, top: `${(i * 23 + 13) % 80 + 10}%`, animation: `koala-twinkle ${1.5 + (i % 3)}s ease-in-out ${i * 0.3}s infinite` }}>
              ✨
            </div>
          ))}
          {/* Time-warp — floating hourglasses drifting upward */}
          {hasTimeWarp > 0 && Array.from({ length: Math.min(3 + hasTimeWarp, 6) }).map((_, i) => (
            <div key={`warp-${i}`} className="absolute text-sm"
              style={{ left: `${(i * 23 + 7) % 90 + 5}%`, animation: `koala-rise ${7 + (i % 3) * 2}s linear ${i * 1.2}s infinite`, opacity: 0.35 }}>
              ⏳
            </div>
          ))}
          {/* Diamond paws — floating diamonds */}
          {hasDiamondPaws > 0 && Array.from({ length: Math.min(hasDiamondPaws, 5) }).map((_, i) => (
            <div key={`diamond-${i}`} className="absolute text-xs"
              style={{ left: `${(i * 19 + 25) % 85 + 8}%`, top: `${(i * 29 + 11) % 70 + 15}%`, animation: `koala-twinkle ${2 + (i % 3)}s ease-in-out ${i * 0.5}s infinite`, opacity: 0.5 }}>
              💎
            </div>
          ))}
          {/* Omnipaws — glowing orbs */}
          {hasOmnipaws > 0 && Array.from({ length: Math.min(hasOmnipaws, 6) }).map((_, i) => (
            <div key={`orb-${i}`} className="absolute text-sm"
              style={{ left: `${(i * 17 + 13) % 80 + 10}%`, top: `${(i * 31 + 9) % 70 + 15}%`, animation: `koala-twinkle ${2.5 + (i % 2)}s ease-in-out ${i * 0.6}s infinite`, opacity: 0.4 }}>
              🔮
            </div>
          ))}
          {/* Singularity — rising embers/fire particles */}
          {hasSingularity > 0 && Array.from({ length: Math.min(4 + hasSingularity, 10) }).map((_, i) => (
            <div key={`ember-${i}`} className="absolute text-xs"
              style={{ left: `${(i * 13 + 20) % 80 + 10}%`, animation: `koala-rise ${4 + (i % 3) * 1.5}s linear ${i * 0.6}s infinite`, opacity: 0.5 }}>
              {i % 2 === 0 ? "🔥" : "☀️"}
            </div>
          ))}
        </div>

        {/* ── Baby koalas around the main koala ────────────────────── */}
        {hasBabies > 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            {Array.from({ length: Math.min(hasBabies, 8) }).map((_, i) => {
              const angle = (i / Math.min(hasBabies, 8)) * Math.PI * 2;
              const radius = 140 + (i % 2) * 20;
              return (
                <div key={`baby-${i}`} className="absolute text-xl sm:text-2xl"
                  style={{ left: Math.cos(angle) * radius - 12, top: Math.sin(angle) * radius - 12, animation: `koala-bob ${2 + (i % 3) * 0.5}s ease-in-out ${i * 0.3}s infinite` }}>
                  🐨
                </div>
              );
            })}
          </div>
        )}

        {/* ── Golden Leaf (random event) ───────────────────────────── */}
        {goldenLeaf && (
          <button
            onClick={clickGoldenLeaf}
            className="absolute z-30 text-4xl cursor-pointer animate-bounce drop-shadow-[0_0_20px_rgba(247,183,49,0.8)] hover:scale-125 transition-transform"
            style={{ left: `${goldenLeaf.x}%`, top: `${goldenLeaf.y}%` }}
            title="Click for bonus leaves!"
          >
            🍂
          </button>
        )}

        {/* ── Prestige / Essence info bar ──────────────────────────── */}
        {(essenceCount > 0 || prestigeLevel > 0) && (
          <div className={`absolute top-3 left-3 flex flex-col gap-1 rounded-lg px-3 py-1.5 text-xs ${isDark ? "bg-black/30" : hasForest ? "bg-black/40" : "bg-white/60"} backdrop-blur z-20`}>
            {getCurrentTitle(prestigeLevel) && (
              <div className={`font-bold ${textClass}`}>
                {getCurrentTitle(prestigeLevel)!.emoji} {getCurrentTitle(prestigeLevel)!.title}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className={dimTextClass}>Essence: <span className={`font-bold ${textClass}`}>{essenceCount}</span></span>
              <span className={dimTextClass}>|</span>
              <span className={dimTextClass}>x{totalMultiplier.toFixed(2)}</span>
              {prestigeLevel > 0 && <>
                <span className={dimTextClass}>|</span>
                <span className={dimTextClass}>Ascensions: {prestigeLevel}</span>
              </>}
            </div>
          </div>
        )}

        {/* ── Achievements button ──────────────────────────────────── */}
        <button
          onClick={() => setShowAchievements(!showAchievements)}
          className={`absolute top-3 right-3 rounded-lg px-3 py-1.5 text-xs z-20 cursor-pointer ${isDark ? "bg-black/30 hover:bg-black/50" : hasForest ? "bg-black/40 hover:bg-black/50" : "bg-white/60 hover:bg-white/80"} backdrop-blur transition-colors ${dimTextClass}`}
        >
          🏆 {unlockedAchievements.length}/{ACHIEVEMENTS.length}
        </button>

        {/* Leaf counter */}
        <div className="text-center mb-2 sm:mb-6 relative z-10">
          <div className={`text-3xl sm:text-6xl font-bold tabular-nums ${textClass} transition-colors duration-1000 ${hasGolden ? "drop-shadow-[0_0_12px_rgba(247,183,49,0.4)]" : ""}`}>
            {formatNumber(leaves)}
          </div>
          <div className={`font-semibold mt-1 ${subtextClass} transition-colors duration-1000`}>
            eucalyptus leaves
          </div>
          <div className={`text-sm mt-1 tabular-nums ${dimTextClass} transition-colors duration-1000`}>
            {leavesPerSecond > 0 && (
              <span>{formatNumber(leavesPerSecond)} per second</span>
            )}
            {leavesPerSecond > 0 && leavesPerClick > 1 && (
              <span> &middot; </span>
            )}
            {leavesPerClick > 1 && (
              <span>+{formatNumber(leavesPerClick)} per click</span>
            )}
          </div>
        </div>

        {/* Koala button */}
        <div className="relative z-10">
          <button
            onClick={handleClick}
            className={`relative w-36 h-36 sm:w-56 sm:h-56 rounded-full cursor-pointer
                       transition-shadow duration-200 select-none
                       flex items-center justify-center
                       ${{ god: "bg-gradient-to-br from-amber-900 to-orange-950 border-4 border-amber-400 shadow-[0_0_60px_rgba(245,158,11,0.4)] hover:shadow-[0_0_80px_rgba(245,158,11,0.6)]",
                         singularity: "bg-gradient-to-br from-gray-900 to-red-950 border-4 border-orange-400 shadow-[0_0_60px_rgba(249,115,22,0.4)] hover:shadow-[0_0_80px_rgba(249,115,22,0.6)]",
                         multiverse: "bg-gradient-to-br from-slate-900 to-violet-950 border-4 border-violet-400 shadow-[0_0_60px_rgba(139,92,246,0.4)] hover:shadow-[0_0_80px_rgba(139,92,246,0.6)]",
                         canopy: "bg-gradient-to-br from-teal-900 to-cyan-950 border-4 border-teal-400 shadow-[0_0_60px_rgba(45,212,191,0.4)] hover:shadow-[0_0_80px_rgba(45,212,191,0.6)]",
                         quantum: "bg-gradient-to-br from-cyan-900 to-blue-950 border-4 border-cyan-400 shadow-[0_0_60px_rgba(6,182,212,0.4)] hover:shadow-[0_0_80px_rgba(6,182,212,0.6)]",
                         cosmic: "bg-gradient-to-br from-blue-900 to-violet-950 border-4 border-indigo-400 shadow-[0_0_60px_rgba(99,102,241,0.4)] hover:shadow-[0_0_80px_rgba(99,102,241,0.6)]",
                         dimension: "bg-gradient-to-br from-fuchsia-900 to-pink-950 border-4 border-fuchsia-400 shadow-[0_0_60px_rgba(217,70,239,0.4)] hover:shadow-[0_0_80px_rgba(217,70,239,0.6)]",
                         timewarp: "bg-gradient-to-br from-slate-800 to-purple-950 border-4 border-purple-400 shadow-[0_0_60px_rgba(168,85,247,0.3)] hover:shadow-[0_0_80px_rgba(168,85,247,0.5)]",
                         overlord: "bg-gradient-to-br from-gray-800 to-indigo-900 border-4 border-indigo-400 shadow-[0_0_60px_rgba(129,140,248,0.3)] hover:shadow-[0_0_80px_rgba(129,140,248,0.5)]",
                         portal: "bg-gradient-to-br from-purple-900 to-indigo-900 border-4 border-purple-400 shadow-[0_0_60px_rgba(168,85,247,0.4)] hover:shadow-[0_0_80px_rgba(168,85,247,0.6)]",
                         sanctuary: "bg-gradient-to-br from-emerald-800 to-teal-900 border-4 border-teal-400 shadow-[0_8px_40px_rgba(45,212,191,0.3)] hover:shadow-[0_12px_50px_rgba(45,212,191,0.5)]",
                         forest: "bg-gradient-to-br from-emerald-800 to-green-900 border-4 border-emerald-400 shadow-[0_8px_40px_rgba(34,197,94,0.3)] hover:shadow-[0_12px_50px_rgba(34,197,94,0.5)]",
                         golden: "bg-white border-4 border-amber-400 shadow-[0_0_40px_rgba(247,183,49,0.3)] hover:shadow-[0_0_50px_rgba(247,183,49,0.5)]",
                         colony: "bg-gradient-to-br from-green-50 to-emerald-100 border-4 border-emerald-400 shadow-[0_8px_40px_rgba(34,197,94,0.25)] hover:shadow-[0_12px_50px_rgba(34,197,94,0.4)]",
                         tree: "bg-gradient-to-br from-green-50 to-lime-50 border-4 border-emerald-300 shadow-[0_8px_40px_rgba(34,197,94,0.2)] hover:shadow-[0_12px_50px_rgba(34,197,94,0.35)]",
                         bush: "bg-white border-4 border-emerald-300 shadow-[0_8px_40px_rgba(34,197,94,0.2)] hover:shadow-[0_12px_50px_rgba(34,197,94,0.35)]",
                         default: "bg-white border-4 border-emerald-300 shadow-[0_8px_40px_rgba(34,197,94,0.2)] hover:shadow-[0_12px_50px_rgba(34,197,94,0.35)]",
                       }[tier]}
                       active:scale-95`}
            style={{
              transform: `scale(${koalaScale})`,
              transition: "transform 0.1s ease",
            }}
          >
            <span className="text-7xl sm:text-9xl leading-none pointer-events-none relative">
              🐨
              {/* Top accessory — only show the highest tier's */}
              {tier === "god" && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-3xl sm:text-4xl"
                  style={{ animation: "koala-twinkle 1.5s ease-in-out infinite" }}>☀️</span>
              )}
              {tier === "singularity" && (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-2xl sm:text-3xl"
                  style={{ animation: "koala-twinkle 1.8s ease-in-out infinite" }}>🌟</span>
              )}
              {tier === "multiverse" && (
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl sm:text-3xl"
                  style={{ animation: "koala-bob 3s ease-in-out infinite" }}>🌐</span>
              )}
              {tier === "canopy" && (
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl sm:text-3xl"
                  style={{ animation: "koala-bob 4s ease-in-out infinite" }}>🌅</span>
              )}
              {tier === "quantum" && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl sm:text-3xl"
                  style={{ animation: "koala-twinkle 1.5s ease-in-out infinite" }}>⚛️</span>
              )}
              {tier === "cosmic" && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl sm:text-3xl"
                  style={{ animation: "koala-bob 3s ease-in-out infinite" }}>🪐</span>
              )}
              {tier === "dimension" && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl sm:text-3xl"
                  style={{ animation: "koala-twinkle 2s ease-in-out infinite" }}>🌌</span>
              )}
              {tier === "timewarp" && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl sm:text-3xl"
                  style={{ animation: "koala-bob 2.5s ease-in-out infinite" }}>⏳</span>
              )}
              {tier === "overlord" && (
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl sm:text-4xl"
                  style={{ animation: "koala-bob 3s ease-in-out infinite" }}>👑</span>
              )}
              {tier === "golden" && (
                <span className="absolute -top-4 right-0 text-xl"
                  style={{ animation: "koala-twinkle 2s ease-in-out infinite" }}>✨</span>
              )}
              {/* Bottom accessory — paw upgrades */}
              {hasDiamondPaws > 0 && (
                <span className="absolute -bottom-1 right-0 text-lg">💎</span>
              )}
              {hasPaws > 0 && !hasDiamondPaws && (
                <span className="absolute -bottom-1 right-0 text-lg">🐾</span>
              )}
              {hasOmnipaws > 0 && (
                <span className="absolute -bottom-1 left-0 text-lg"
                  style={{ animation: "koala-twinkle 2s ease-in-out infinite" }}>🔮</span>
              )}
            </span>
          </button>

          {/* Floating click text */}
          {floatingTexts.map((ft) => (
            <div key={ft.id}
              className={`absolute pointer-events-none font-bold text-lg ${
                { god: "text-amber-400", singularity: "text-orange-400", multiverse: "text-violet-400", canopy: "text-teal-400", quantum: "text-cyan-400", cosmic: "text-indigo-400", dimension: "text-fuchsia-400", timewarp: "text-purple-400", overlord: "text-indigo-300", portal: "text-purple-300", sanctuary: "text-emerald-300", forest: "text-emerald-300", golden: "text-amber-400", colony: "text-emerald-600", tree: "text-emerald-600", bush: "text-emerald-600", default: "text-emerald-600" }[tier]
              }`}
              style={{ left: ft.x, top: ft.y, animation: "koala-float-up 0.8s ease-out forwards" }}>
              +{formatNumber(ft.value)}
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-8 hidden sm:grid grid-cols-2 gap-4 text-center relative z-10">
          <div className={`rounded-xl px-4 py-3 border ${statCardBg}`}>
            <div className={`text-lg font-bold tabular-nums ${textClass}`}>{formatNumber(totalLeaves)}</div>
            <div className={`text-xs ${subtextClass}`}>Total earned</div>
            {prestigeLevel > 0 && (
              <div className={`text-[10px] tabular-nums ${dimTextClass}`}>Lifetime: {formatNumber(lifetimeLeaves)}</div>
            )}
          </div>
          <div className={`rounded-xl px-4 py-3 border ${statCardBg}`}>
            <div className={`text-lg font-bold tabular-nums ${textClass}`}>{totalClicks.toLocaleString()}</div>
            <div className={`text-xs ${subtextClass}`}>Total clicks</div>
            {prestigeLevel > 0 && (
              <div className={`text-[10px] tabular-nums ${dimTextClass}`}>Lifetime: {lifetimeClicks.toLocaleString()}</div>
            )}
          </div>
        </div>

        {/* Cloud sync indicator */}
        <div className={`mt-4 hidden sm:flex items-center gap-1.5 text-[11px] ${dimTextClass} relative z-10`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            cloudStatus === "synced" ? "bg-emerald-400" : cloudStatus === "saving" ? "bg-amber-400 animate-pulse" : "bg-gray-300"
          }`} />
          {cloudStatus === "synced" && "Cloud saved"}
          {cloudStatus === "saving" && "Saving..."}
          {cloudStatus === "off" && "Local save only"}
        </div>
      </div>

      {/* ── Achievement Toast ─────────────────────────────────────────── */}
      {newAchievement && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-amber-100 border-2 border-amber-400 rounded-xl px-6 py-3 shadow-lg"
          style={{ animation: "slide-down 0.3s ease-out" }}>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-800">🏆 Achievement Unlocked!</div>
            <div className="text-sm text-amber-700">{newAchievement.emoji} {newAchievement.name} — {newAchievement.reward}</div>
          </div>
        </div>
      )}

      {/* ── Achievements Modal ────────────────────────────────────────── */}
      {showAchievements && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowAchievements(false)}>
          <div className={`w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl border-2 p-4 ${
            isDark ? "bg-gray-900 border-white/20 text-white" : "bg-white border-emerald-300 text-gray-900"
          }`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">🏆 Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS.length})</h3>
              <button onClick={() => setShowAchievements(false)} className="text-lg cursor-pointer opacity-60 hover:opacity-100">✕</button>
            </div>
            <div className="space-y-2">
              {ACHIEVEMENTS.map((ach) => {
                const unlocked = unlockedAchievements.includes(ach.id);
                return (
                  <div key={ach.id} className={`rounded-lg p-3 border ${unlocked
                    ? isDark ? "border-amber-500/40 bg-amber-900/20" : "border-amber-300 bg-amber-50"
                    : isDark ? "border-white/10 bg-white/5 opacity-50" : "border-gray-200 bg-gray-50 opacity-50"
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{unlocked ? ach.emoji : "🔒"}</span>
                      <div className="flex-1">
                        <div className="font-bold text-sm">{unlocked ? ach.name : "???"}</div>
                        <div className={`text-xs ${isDark ? "text-white/50" : "text-gray-500"}`}>
                          {unlocked ? ach.description : "???"}
                        </div>
                      </div>
                      {unlocked && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                          {ach.reward}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Prestige Confirmation Modal ───────────────────────────────── */}
      {showPrestigeConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowPrestigeConfirm(false)}>
          <div className={`w-full max-w-sm rounded-2xl border-2 p-6 text-center ${
            isDark ? "bg-gray-900 border-purple-500/40 text-white" : "bg-white border-purple-300 text-gray-900"
          }`} onClick={(e) => e.stopPropagation()}
            style={{ animation: "koala-ascend-modal 0.3s ease-out" }}>
            <div className="text-5xl mb-3">✨</div>
            <h3 className="text-xl font-bold mb-1">Ready to Ascend</h3>
            <p className={`text-xs mb-4 ${isDark ? "text-white/40" : "text-gray-400"}`}>
              Your koala has gathered enough wisdom to transcend
            </p>

            {/* What you gain */}
            <div className={`rounded-xl p-3 mb-3 ${isDark ? "bg-purple-900/30 border border-purple-500/20" : "bg-purple-50 border border-purple-200"}`}>
              <div className={`text-xs font-bold mb-2 ${isDark ? "text-purple-300" : "text-purple-700"}`}>What you gain</div>
              <div className="flex items-center justify-center gap-4">
                <div>
                  <div className="text-2xl font-bold text-purple-400">+{essenceGain}</div>
                  <div className={`text-[10px] ${isDark ? "text-white/40" : "text-gray-500"}`}>Essence</div>
                </div>
                <div className={`text-lg ${isDark ? "text-white/20" : "text-gray-300"}`}>→</div>
                <div>
                  <div className="text-lg font-bold">
                    <span className={isDark ? "text-white/50" : "text-gray-400"}>x{totalMultiplier.toFixed(2)}</span>
                    {" → "}
                    <span className="text-purple-400">x{(getEssenceMultiplier(essenceCount + essenceGain) * achievementMultiplier).toFixed(2)}</span>
                  </div>
                  <div className={`text-[10px] ${isDark ? "text-white/40" : "text-gray-500"}`}>Production boost</div>
                </div>
              </div>
              {(() => {
                const nextT = getCurrentTitle(prestigeLevel + 1);
                const prevT = getCurrentTitle(prestigeLevel);
                if (nextT && nextT !== prevT) {
                  return (
                    <div className="mt-2 pt-2 border-t border-purple-500/20">
                      <div className={`text-xs ${isDark ? "text-purple-300" : "text-purple-600"}`}>
                        New title: <span className="font-bold">{nextT.emoji} {nextT.title}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* What resets */}
            <div className={`rounded-xl p-3 mb-4 ${isDark ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-200"}`}>
              <div className={`text-xs mb-1 ${isDark ? "text-white/40" : "text-gray-500"}`}>Resets: leaves, upgrades, clicks</div>
              <div className={`text-xs ${isDark ? "text-white/40" : "text-gray-500"}`}>Keeps: essence, achievements, titles, lifetime stats</div>
            </div>

            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowPrestigeConfirm(false)}
                className={`px-4 py-2 rounded-lg cursor-pointer ${isDark ? "bg-white/10 hover:bg-white/20" : "bg-gray-100 hover:bg-gray-200"}`}>
                Not yet
              </button>
              <button onClick={doAscend}
                className="px-4 py-2 rounded-lg cursor-pointer bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-500 hover:to-fuchsia-500 font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                ✨ Ascend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Ascend Celebration Overlay ──────────────────────────────────── */}
      {showAscendCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ animation: "koala-ascend-bg 3s ease-out forwards" }}>
          {/* Particle burst */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => {
              const angle = (i / 40) * Math.PI * 2;
              const distance = 200 + Math.random() * 300;
              const size = 8 + Math.random() * 16;
              const emojis = ["✨", "🌟", "💜", "🍃", "⭐", "🔮", "💫"];
              return (
                <div
                  key={`particle-${i}`}
                  className="absolute text-lg"
                  style={{
                    left: "50%",
                    top: "50%",
                    fontSize: `${size}px`,
                    animation: `koala-ascend-particle 1.5s ease-out ${i * 0.02}s forwards`,
                    // CSS custom properties for the particle direction
                    ["--px" as string]: `${Math.cos(angle) * distance}px`,
                    ["--py" as string]: `${Math.sin(angle) * distance}px`,
                  }}
                >
                  {emojis[i % emojis.length]}
                </div>
              );
            })}
          </div>

          {/* Celebration card */}
          <div className="relative z-10 w-full max-w-sm rounded-2xl border-2 border-purple-500/60 bg-gray-900/95 text-white p-6 text-center backdrop-blur-xl"
            style={{ animation: "koala-ascend-card 0.6s ease-out 0.3s both" }}>
            <div className="text-6xl mb-2" style={{ animation: "koala-ascend-glow 2s ease-in-out infinite" }}>✨</div>
            <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              Ascended!
            </h2>
            <p className="text-white/40 text-xs mb-4">Ascension #{showAscendCelebration.newPrestigeLevel}</p>

            {/* Stats recap */}
            <div className="space-y-3 mb-4">
              <div className="rounded-xl bg-purple-900/40 border border-purple-500/30 p-3">
                <div className="text-3xl font-bold text-purple-400">+{showAscendCelebration.essenceGained}</div>
                <div className="text-xs text-white/50">Eucalyptus Essence earned</div>
                <div className="text-xs text-white/30 mt-1">Total: {showAscendCelebration.newTotal} essence</div>
              </div>

              <div className="rounded-xl bg-fuchsia-900/30 border border-fuchsia-500/20 p-3">
                <div className="text-lg font-bold">
                  <span className="text-white/40">x{showAscendCelebration.oldMultiplier.toFixed(2)}</span>
                  <span className="text-white/20 mx-2">→</span>
                  <span className="text-fuchsia-400">x{showAscendCelebration.newMultiplier.toFixed(2)}</span>
                </div>
                <div className="text-xs text-white/50">Production multiplier</div>
                <div className="text-xs text-emerald-400 mt-1">
                  +{(((showAscendCelebration.newMultiplier / showAscendCelebration.oldMultiplier) - 1) * 100).toFixed(1)}% faster than before!
                </div>
              </div>

              {showAscendCelebration.titleUnlocked && (
                <div className="rounded-xl bg-amber-900/30 border border-amber-500/30 p-3"
                  style={{ animation: "koala-ascend-title 0.5s ease-out 1s both" }}>
                  <div className="text-xs text-amber-400 font-bold mb-1">New Title Unlocked!</div>
                  <div className="text-xl">
                    {showAscendCelebration.titleUnlocked.emoji} <span className="font-bold text-amber-300">{showAscendCelebration.titleUnlocked.title}</span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowAscendCelebration(null)}
              className="px-6 py-2.5 rounded-lg cursor-pointer bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-500 hover:to-fuchsia-500 font-bold shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all"
            >
              Continue your journey
            </button>
          </div>
        </div>
      )}

      {/* ── Right Panel: Upgrades ──────────────────────────────────────── */}
      <div className={`w-full lg:w-[400px] backdrop-blur border-l overflow-y-auto flex-1 lg:max-h-screen min-h-0 ${panelBg} transition-colors duration-1000`}>
        <div className={`sticky top-0 backdrop-blur border-b p-4 z-10 ${panelHeaderBg}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-lg font-bold ${headerTextClass}`}>Upgrades</h2>
              <p className={`text-xs mt-0.5 ${headerSubClass}`}>Build your koala empire</p>
            </div>
            {/* Ascend button */}
            <button
              onClick={() => canAscend && setShowPrestigeConfirm(true)}
              disabled={!canAscend}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                canAscend
                  ? "bg-purple-600 text-white hover:bg-purple-500 cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.3)] animate-pulse"
                  : `${isDark ? "bg-white/5 text-white/20" : "bg-gray-100 text-gray-400"} cursor-not-allowed`
              }`}
              title={canAscend ? `Ascend for +${essenceGain} essence` : `Earn more lifetime leaves to ascend`}
            >
              ✨ Ascend{canAscend ? ` (+${essenceGain})` : ""}
            </button>
          </div>
          {/* Multiplier bar */}
          {totalMultiplier > 1 && (
            <div className={`text-[10px] mt-1 ${headerSubClass}`}>
              Production multiplier: x{totalMultiplier.toFixed(2)}
              {essenceCount > 0 && <span> ({essenceCount} essence)</span>}
              {unlockedAchievements.length > 0 && <span> ({unlockedAchievements.length} achievements)</span>}
            </div>
          )}
          {/* Ascend progress bar */}
          {(() => {
            const nextEssenceTarget = essenceCount + 1;
            const leavesNeeded = lifetimeLeavesForEssence(nextEssenceTarget);
            const remaining = Math.max(0, leavesNeeded - lifetimeLeaves);
            // How much of the deficit existed when this run started?
            const deficitAtRunStart = remaining + totalLeaves;
            const progressThisRun = deficitAtRunStart > 0
              ? Math.min(1, Math.max(0, totalLeaves / deficitAtRunStart))
              : 0;
            const afterNextMultiplier = getEssenceMultiplier(nextEssenceTarget) * achievementMultiplier;
            return (
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className={headerSubClass}>
                    {canAscend
                      ? <span className="text-purple-400 font-bold">Ready to ascend!</span>
                      : <>{formatNumber(remaining)} leaves to next essence</>
                    }
                  </span>
                  <span className={headerSubClass}>
                    {canAscend
                      ? <>x{totalMultiplier.toFixed(2)} → <span className="text-purple-400 font-bold">x{(getEssenceMultiplier(essenceCount + essenceGain) * achievementMultiplier).toFixed(2)}</span></>
                      : <>→ x{afterNextMultiplier.toFixed(2)}</>
                    }
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-gray-200"}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      canAscend
                        ? "bg-gradient-to-r from-purple-500 to-fuchsia-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                        : "bg-gradient-to-r from-purple-600 to-purple-400"
                    }`}
                    style={{ width: `${canAscend ? 100 : progressThisRun * 100}%` }}
                  />
                </div>
                {getNextTitle(prestigeLevel) && (
                  <div className={`text-[9px] mt-0.5 ${headerSubClass} opacity-60`}>
                    Next title: {getNextTitle(prestigeLevel)!.emoji} {getNextTitle(prestigeLevel)!.title} (ascension {getNextTitle(prestigeLevel)!.level})
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        <div className="p-3 space-y-2">
          {upgrades.map((upgrade) => {
            const cost = getCost(upgrade);
            const canAfford = leaves >= cost;
            return (
              <button
                key={upgrade.id}
                onClick={() => buyUpgrade(upgrade.id)}
                disabled={!canAfford}
                className={`w-full text-left rounded-xl border-2 p-3 transition-all duration-150
                  ${canAfford ? cardBgAfford : cardBgLocked}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0 mt-0.5">{upgrade.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-sm ${cardNameClass}`}>{upgrade.name}</span>
                      <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${badgeBg}`}>{upgrade.owned}</span>
                    </div>
                    <div className={`text-xs mt-0.5 ${cardDescClass}`}>{upgrade.description}</div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className={`text-xs font-bold tabular-nums ${canAfford ? cardCostClass : "text-red-400"}`}>
                        🍃 {formatNumber(cost)}
                      </span>
                      <span className={`text-[10px] ${cardStatClass}`}>
                        {upgrade.lps > 0 && `+${formatNumber(upgrade.lps)}/s`}
                        {upgrade.clickBonus > 0 && `+${formatNumber(upgrade.clickBonus)}/click`}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
