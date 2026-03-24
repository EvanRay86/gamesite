"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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

interface SaveData {
  leaves: number;
  totalLeaves: number;
  totalClicks: number;
  upgrades: Record<string, number>;
  lastSave: number;
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
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCost(upgrade: Upgrade): number {
  return Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.owned));
}

function formatNumber(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return Math.floor(n).toLocaleString();
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
  const floatId = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derived values
  const leavesPerClick = 1 + upgrades.reduce((sum, u) => sum + u.clickBonus * u.owned, 0);
  const leavesPerSecond = upgrades.reduce((sum, u) => sum + u.lps * u.owned, 0);

  // ── Load save ───────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const save: SaveData = JSON.parse(raw);
        // Calculate offline earnings
        const elapsed = (Date.now() - save.lastSave) / 1000;
        const restoredUpgrades = INITIAL_UPGRADES.map((u) => ({
          ...u,
          owned: save.upgrades[u.id] || 0,
        }));
        const offlineLps = restoredUpgrades.reduce(
          (sum, u) => sum + u.lps * u.owned,
          0,
        );
        const offlineEarnings = Math.floor(offlineLps * Math.min(elapsed, 28800)); // cap at 8hrs

        setUpgrades(restoredUpgrades);
        setLeaves(save.leaves + offlineEarnings);
        setTotalLeaves(save.totalLeaves + offlineEarnings);
        setTotalClicks(save.totalClicks);
      }
    } catch {
      // Corrupted save, start fresh
    }
    setLoaded(true);
  }, []);

  // ── Auto-save every 15s ─────────────────────────────────────────────
  useEffect(() => {
    if (!loaded) return;
    const interval = setInterval(() => {
      saveGame();
    }, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, leaves, upgrades, totalLeaves, totalClicks]);

  // Save on unmount
  useEffect(() => {
    return () => saveGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveGame = useCallback(() => {
    const save: SaveData = {
      leaves,
      totalLeaves,
      totalClicks,
      upgrades: Object.fromEntries(upgrades.map((u) => [u.id, u.owned])),
      lastSave: Date.now(),
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      // Storage full or unavailable
    }
  }, [leaves, totalLeaves, totalClicks, upgrades]);

  // ── Production tick (10 times/sec) ──────────────────────────────────
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (leavesPerSecond > 0) {
      tickRef.current = setInterval(() => {
        const increment = leavesPerSecond / 10;
        setLeaves((l) => l + increment);
        setTotalLeaves((t) => t + increment);
      }, 100);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [leavesPerSecond]);

  // ── Click handler ───────────────────────────────────────────────────
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      setLeaves((l) => l + leavesPerClick);
      setTotalLeaves((t) => t + leavesPerClick);
      setTotalClicks((c) => c + 1);

      // Bounce animation
      setKoalaScale(1.15);
      setTimeout(() => setKoalaScale(1), 100);

      // Floating text
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left + (Math.random() - 0.5) * 40;
      const y = e.clientY - rect.top - 20;
      const id = floatId.current++;
      setFloatingTexts((prev) => [...prev, { id, x, y, value: leavesPerClick }]);
      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((f) => f.id !== id));
      }, 800);
    },
    [leavesPerClick],
  );

  // ── Buy upgrade ─────────────────────────────────────────────────────
  const buyUpgrade = useCallback(
    (upgradeId: string) => {
      setUpgrades((prev) =>
        prev.map((u) => {
          if (u.id !== upgradeId) return u;
          const cost = getCost(u);
          if (leaves < cost) return u;
          setLeaves((l) => l - cost);
          return { ...u, owned: u.owned + 1 };
        }),
      );
    },
    [leaves],
  );

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-50 flex flex-col lg:flex-row">
      {/* ── Left Panel: Koala + Stats ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Leaf counter */}
        <div className="text-center mb-6">
          <div className="text-5xl sm:text-6xl font-bold text-emerald-800 tabular-nums">
            {formatNumber(leaves)}
          </div>
          <div className="text-emerald-600 font-semibold mt-1">
            eucalyptus leaves
          </div>
          <div className="text-emerald-500/70 text-sm mt-1 tabular-nums">
            {leavesPerSecond > 0 && (
              <span>{formatNumber(leavesPerSecond)} per second</span>
            )}
            {leavesPerSecond > 0 && leavesPerClick > 1 && <span> &middot; </span>}
            {leavesPerClick > 1 && (
              <span>+{formatNumber(leavesPerClick)} per click</span>
            )}
          </div>
        </div>

        {/* Koala button */}
        <div className="relative">
          <button
            onClick={handleClick}
            className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-white border-4 border-emerald-300
                       shadow-[0_8px_40px_rgba(34,197,94,0.2)] cursor-pointer
                       hover:shadow-[0_12px_50px_rgba(34,197,94,0.35)]
                       active:shadow-[0_4px_20px_rgba(34,197,94,0.2)]
                       transition-shadow duration-200 select-none
                       flex items-center justify-center"
            style={{
              transform: `scale(${koalaScale})`,
              transition: "transform 0.1s ease",
            }}
          >
            <span className="text-8xl sm:text-9xl leading-none pointer-events-none">
              🐨
            </span>
          </button>

          {/* Floating click text */}
          {floatingTexts.map((ft) => (
            <div
              key={ft.id}
              className="absolute pointer-events-none font-bold text-emerald-600 text-lg"
              style={{
                left: ft.x,
                top: ft.y,
                animation: "koala-float-up 0.8s ease-out forwards",
              }}
            >
              +{formatNumber(ft.value)}
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 text-center">
          <div className="bg-white/60 rounded-xl px-4 py-3 border border-emerald-200">
            <div className="text-lg font-bold text-emerald-800 tabular-nums">
              {formatNumber(totalLeaves)}
            </div>
            <div className="text-xs text-emerald-600">Total earned</div>
          </div>
          <div className="bg-white/60 rounded-xl px-4 py-3 border border-emerald-200">
            <div className="text-lg font-bold text-emerald-800 tabular-nums">
              {totalClicks.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-600">Total clicks</div>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Upgrades ──────────────────────────────────────── */}
      <div className="w-full lg:w-[400px] bg-white/80 backdrop-blur border-l border-emerald-200 overflow-y-auto max-h-screen">
        <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-emerald-200 p-4 z-10">
          <h2 className="text-lg font-bold text-emerald-900">Upgrades</h2>
          <p className="text-xs text-emerald-600 mt-0.5">
            Build your koala empire
          </p>
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
                  ${
                    canAfford
                      ? "border-emerald-300 bg-white hover:border-emerald-500 hover:shadow-md cursor-pointer"
                      : "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0 mt-0.5">
                    {upgrade.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-gray-900">
                        {upgrade.name}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">
                        {upgrade.owned}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {upgrade.description}
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span
                        className={`text-xs font-bold tabular-nums ${
                          canAfford ? "text-emerald-600" : "text-red-400"
                        }`}
                      >
                        🍃 {formatNumber(cost)}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {upgrade.lps > 0 &&
                          `+${formatNumber(upgrade.lps)}/s`}
                        {upgrade.clickBonus > 0 &&
                          `+${formatNumber(upgrade.clickBonus)}/click`}
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
