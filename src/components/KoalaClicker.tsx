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

function buildSaveData(
  leaves: number,
  totalLeaves: number,
  totalClicks: number,
  upgrades: Upgrade[],
): SaveData {
  return {
    leaves,
    totalLeaves,
    totalClicks,
    upgrades: Object.fromEntries(upgrades.map((u) => [u.id, u.owned])),
    lastSave: Date.now(),
  };
}

function applySave(save: SaveData): {
  upgrades: Upgrade[];
  leaves: number;
  totalLeaves: number;
  totalClicks: number;
} {
  const elapsed = (Date.now() - save.lastSave) / 1000;
  const restoredUpgrades = INITIAL_UPGRADES.map((u) => ({
    ...u,
    owned: save.upgrades[u.id] || 0,
  }));
  const offlineLps = restoredUpgrades.reduce(
    (sum, u) => sum + u.lps * u.owned,
    0,
  );
  const offlineEarnings = Math.floor(
    offlineLps * Math.min(elapsed, 28800),
  ); // cap at 8hrs

  return {
    upgrades: restoredUpgrades,
    leaves: save.leaves + offlineEarnings,
    totalLeaves: save.totalLeaves + offlineEarnings,
    totalClicks: save.totalClicks,
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
  const floatId = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerIdRef = useRef<string>("");

  // Derived values
  const leavesPerClick =
    1 + upgrades.reduce((sum, u) => sum + u.clickBonus * u.owned, 0);
  const leavesPerSecond = upgrades.reduce(
    (sum, u) => sum + u.lps * u.owned,
    0,
  );

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
      }

      setLoaded(true);
    }
    load();
  }, []);

  // ── Save to localStorage ──────────────────────────────────────────
  const saveToLocal = useCallback(() => {
    const save = buildSaveData(leaves, totalLeaves, totalClicks, upgrades);
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      // Storage full
    }
    return save;
  }, [leaves, totalLeaves, totalClicks, upgrades]);

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

  // ── Auto-save every 15s (local) + every 30s (cloud) ───────────────
  const cloudTickRef = useRef(0);
  useEffect(() => {
    if (!loaded) return;
    const interval = setInterval(() => {
      const save = saveToLocal();
      cloudTickRef.current++;
      // Cloud save every other tick (30s)
      if (cloudTickRef.current % 2 === 0) {
        saveToCloud(save);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [loaded, saveToLocal, saveToCloud]);

  // Save on unmount
  useEffect(() => {
    const handleUnload = () => {
      const save = buildSaveData(leaves, totalLeaves, totalClicks, upgrades);
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
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
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

      setLeaves((l) => l - cost);
      setUpgrades((prev) =>
        prev.map((u) =>
          u.id === upgradeId ? { ...u, owned: u.owned + 1 } : u,
        ),
      );
    },
    [leaves, upgrades],
  );

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

  // Background evolves based on progression
  const bgClass = hasPortal
    ? "from-indigo-950 via-purple-900 to-emerald-900"
    : hasForest
      ? "from-emerald-800 via-green-700 to-teal-800"
      : hasTrees
        ? "from-emerald-200 via-green-100 to-teal-100"
        : hasBushes
          ? "from-green-100 via-emerald-50 to-lime-50"
          : "from-green-50 to-emerald-50";

  const textClass = hasPortal
    ? "text-purple-200"
    : hasForest
      ? "text-emerald-100"
      : "text-emerald-800";

  const subtextClass = hasPortal
    ? "text-purple-300"
    : hasForest
      ? "text-emerald-200"
      : "text-emerald-600";

  const dimTextClass = hasPortal
    ? "text-purple-300/70"
    : hasForest
      ? "text-emerald-300/70"
      : "text-emerald-500/70";

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${bgClass} flex flex-col lg:flex-row transition-colors duration-1000`}>
      {/* ── Left Panel: Koala + Scene ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">

        {/* ── Sky layer (portal/sanctuary) ──────────────────────────── */}
        {hasPortal > 0 && (
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
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20"
              style={{
                background: "conic-gradient(from 0deg, transparent, #a855f7, transparent, #22c55e, transparent)",
                animation: "koala-spin 8s linear infinite",
              }}
            />
          </div>
        )}

        {/* ── Ground layer ─────────────────────────────────────────── */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          {/* Grass - appears with bushes */}
          {hasBushes > 0 && (
            <div className={`h-16 ${hasPortal ? "bg-gradient-to-t from-emerald-900/50 to-transparent" : hasForest ? "bg-gradient-to-t from-emerald-900/30 to-transparent" : "bg-gradient-to-t from-emerald-200/60 to-transparent"}`} />
          )}

          {/* Ground line */}
          {hasBushes > 0 && (
            <div className={`h-1 ${hasPortal ? "bg-emerald-500/30" : hasForest ? "bg-emerald-600/30" : "bg-emerald-300/50"}`} />
          )}
        </div>

        {/* ── Scene elements (behind koala) ─────────────────────────── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Bushes */}
          {hasBushes > 0 && Array.from({ length: Math.min(hasBushes, 6) }).map((_, i) => (
            <div
              key={`bush-${i}`}
              className="absolute bottom-12 text-2xl sm:text-3xl"
              style={{
                left: `${10 + i * 15}%`,
                animation: `koala-sway ${3 + i * 0.5}s ease-in-out infinite`,
              }}
            >
              🌿
            </div>
          ))}

          {/* Trees */}
          {hasTrees > 0 && Array.from({ length: Math.min(hasTrees, 5) }).map((_, i) => (
            <div
              key={`tree-${i}`}
              className="absolute bottom-10 text-4xl sm:text-5xl"
              style={{
                left: `${5 + i * 20}%`,
                animation: `koala-sway ${4 + i * 0.3}s ease-in-out infinite`,
              }}
            >
              🌳
            </div>
          ))}

          {/* Colony huts */}
          {hasColony > 0 && Array.from({ length: Math.min(hasColony, 4) }).map((_, i) => (
            <div
              key={`hut-${i}`}
              className="absolute bottom-10 text-2xl sm:text-3xl"
              style={{ left: `${15 + i * 22}%` }}
            >
              🏠
            </div>
          ))}

          {/* Forest layer (dense trees behind everything) */}
          {hasForest > 0 && (
            <div className="absolute bottom-8 left-0 right-0 flex justify-around opacity-50 text-3xl">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={`forest-${i}`} style={{ animation: `koala-sway ${5 + i * 0.2}s ease-in-out infinite` }}>
                  🌲
                </span>
              ))}
            </div>
          )}

          {/* Sanctuary */}
          {hasSanctuary > 0 && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-4xl sm:text-5xl opacity-60"
              style={{ transform: "translateX(-50%) translateY(-40px)" }}>
              🏛️
            </div>
          )}
        </div>

        {/* ── Floating particles ────────────────────────────────────── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Floating leaves */}
          {hasBushes > 0 && Array.from({ length: Math.min(3 + totalOwned, 15) }).map((_, i) => (
            <div
              key={`leaf-${i}`}
              className="absolute text-sm"
              style={{
                left: `${(i * 29 + 11) % 100}%`,
                animation: `koala-drift ${6 + (i % 4) * 2}s linear ${i * 0.8}s infinite`,
                opacity: 0.4 + (i % 3) * 0.2,
              }}
            >
              🍃
            </div>
          ))}

          {/* Sparkles for golden claws */}
          {hasGolden > 0 && Array.from({ length: Math.min(hasGolden * 2, 10) }).map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute text-xs"
              style={{
                left: `${(i * 31 + 17) % 90 + 5}%`,
                top: `${(i * 23 + 13) % 80 + 10}%`,
                animation: `koala-twinkle ${1.5 + (i % 3)}s ease-in-out ${i * 0.3}s infinite`,
              }}
            >
              ✨
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
                <div
                  key={`baby-${i}`}
                  className="absolute text-xl sm:text-2xl"
                  style={{
                    left: Math.cos(angle) * radius - 12,
                    top: Math.sin(angle) * radius - 12,
                    animation: `koala-bob ${2 + (i % 3) * 0.5}s ease-in-out ${i * 0.3}s infinite`,
                  }}
                >
                  🐨
                </div>
              );
            })}
          </div>
        )}

        {/* Leaf counter */}
        <div className="text-center mb-6 relative z-10">
          <div className={`text-5xl sm:text-6xl font-bold tabular-nums ${textClass} transition-colors duration-1000 ${hasGolden ? "drop-shadow-[0_0_12px_rgba(247,183,49,0.4)]" : ""}`}>
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
            className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-full cursor-pointer
                       transition-shadow duration-200 select-none
                       flex items-center justify-center
                       ${hasPortal
                         ? "bg-gradient-to-br from-purple-900 to-indigo-900 border-4 border-purple-400 shadow-[0_0_60px_rgba(168,85,247,0.4)] hover:shadow-[0_0_80px_rgba(168,85,247,0.6)]"
                         : hasForest
                           ? "bg-gradient-to-br from-emerald-800 to-green-900 border-4 border-emerald-400 shadow-[0_8px_40px_rgba(34,197,94,0.3)] hover:shadow-[0_12px_50px_rgba(34,197,94,0.5)]"
                           : hasGolden
                             ? "bg-white border-4 border-amber-400 shadow-[0_0_40px_rgba(247,183,49,0.3)] hover:shadow-[0_0_50px_rgba(247,183,49,0.5)]"
                             : "bg-white border-4 border-emerald-300 shadow-[0_8px_40px_rgba(34,197,94,0.2)] hover:shadow-[0_12px_50px_rgba(34,197,94,0.35)]"
                       }
                       active:scale-95`}
            style={{
              transform: `scale(${koalaScale})`,
              transition: "transform 0.1s ease",
            }}
          >
            {/* Koala with accessories */}
            <span className="text-8xl sm:text-9xl leading-none pointer-events-none relative">
              🐨
              {/* Crown for overlord */}
              {hasOverlord > 0 && (
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl sm:text-4xl"
                  style={{ animation: "koala-bob 3s ease-in-out infinite" }}>
                  👑
                </span>
              )}
              {/* Paw sparkle for golden claws */}
              {hasGolden > 0 && !hasOverlord && (
                <span className="absolute -top-4 right-0 text-xl"
                  style={{ animation: "koala-twinkle 2s ease-in-out infinite" }}>
                  ✨
                </span>
              )}
              {/* Paw glow for koala paws */}
              {hasPaws > 0 && !hasGolden && (
                <span className="absolute -bottom-1 right-0 text-lg">
                  🐾
                </span>
              )}
            </span>
          </button>

          {/* Floating click text */}
          {floatingTexts.map((ft) => (
            <div
              key={ft.id}
              className={`absolute pointer-events-none font-bold text-lg ${
                hasGolden ? "text-amber-400" : hasPortal ? "text-purple-300" : "text-emerald-600"
              }`}
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
        <div className="mt-8 grid grid-cols-2 gap-4 text-center relative z-10">
          <div className={`rounded-xl px-4 py-3 border ${
            hasPortal ? "bg-purple-900/40 border-purple-500/30" : hasForest ? "bg-emerald-900/30 border-emerald-500/30" : "bg-white/60 border-emerald-200"
          }`}>
            <div className={`text-lg font-bold tabular-nums ${textClass}`}>
              {formatNumber(totalLeaves)}
            </div>
            <div className={`text-xs ${subtextClass}`}>Total earned</div>
          </div>
          <div className={`rounded-xl px-4 py-3 border ${
            hasPortal ? "bg-purple-900/40 border-purple-500/30" : hasForest ? "bg-emerald-900/30 border-emerald-500/30" : "bg-white/60 border-emerald-200"
          }`}>
            <div className={`text-lg font-bold tabular-nums ${textClass}`}>
              {totalClicks.toLocaleString()}
            </div>
            <div className={`text-xs ${subtextClass}`}>Total clicks</div>
          </div>
        </div>

        {/* Cloud sync indicator */}
        <div className={`mt-4 flex items-center gap-1.5 text-[11px] ${dimTextClass} relative z-10`}>
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              cloudStatus === "synced"
                ? "bg-emerald-400"
                : cloudStatus === "saving"
                  ? "bg-amber-400 animate-pulse"
                  : "bg-gray-300"
            }`}
          />
          {cloudStatus === "synced" && "Cloud saved"}
          {cloudStatus === "saving" && "Saving..."}
          {cloudStatus === "off" && "Local save only"}
        </div>
      </div>

      {/* ── Right Panel: Upgrades ──────────────────────────────────────── */}
      <div className={`w-full lg:w-[400px] backdrop-blur border-l overflow-y-auto max-h-screen ${
        hasPortal
          ? "bg-indigo-950/80 border-purple-500/30"
          : hasForest
            ? "bg-emerald-900/60 border-emerald-500/30"
            : "bg-white/80 border-emerald-200"
      } transition-colors duration-1000`}>
        <div className={`sticky top-0 backdrop-blur border-b p-4 z-10 ${
          hasPortal
            ? "bg-indigo-950/90 border-purple-500/30"
            : hasForest
              ? "bg-emerald-900/80 border-emerald-500/30"
              : "bg-white/90 border-emerald-200"
        }`}>
          <h2 className={`text-lg font-bold ${hasPortal ? "text-purple-100" : hasForest ? "text-emerald-100" : "text-emerald-900"}`}>
            Upgrades
          </h2>
          <p className={`text-xs mt-0.5 ${hasPortal ? "text-purple-300" : hasForest ? "text-emerald-300" : "text-emerald-600"}`}>
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
                  ${canAfford
                    ? hasPortal
                      ? "border-purple-500/40 bg-purple-900/40 hover:border-purple-400 hover:shadow-md cursor-pointer"
                      : hasForest
                        ? "border-emerald-500/40 bg-emerald-900/30 hover:border-emerald-400 hover:shadow-md cursor-pointer"
                        : "border-emerald-300 bg-white hover:border-emerald-500 hover:shadow-md cursor-pointer"
                    : hasPortal
                      ? "border-purple-800/30 bg-purple-950/30 opacity-50 cursor-not-allowed"
                      : hasForest
                        ? "border-emerald-800/30 bg-emerald-950/30 opacity-50 cursor-not-allowed"
                        : "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0 mt-0.5">
                    {upgrade.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-sm ${hasPortal ? "text-purple-100" : hasForest ? "text-emerald-100" : "text-gray-900"}`}>
                        {upgrade.name}
                      </span>
                      <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${
                        hasPortal ? "text-purple-200 bg-purple-800/50" : hasForest ? "text-emerald-200 bg-emerald-800/50" : "text-emerald-700 bg-emerald-100"
                      }`}>
                        {upgrade.owned}
                      </span>
                    </div>
                    <div className={`text-xs mt-0.5 ${hasPortal ? "text-purple-300" : hasForest ? "text-emerald-300" : "text-gray-500"}`}>
                      {upgrade.description}
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span
                        className={`text-xs font-bold tabular-nums ${
                          canAfford
                            ? hasPortal ? "text-purple-300" : hasForest ? "text-emerald-300" : "text-emerald-600"
                            : "text-red-400"
                        }`}
                      >
                        🍃 {formatNumber(cost)}
                      </span>
                      <span className={`text-[10px] ${hasPortal ? "text-purple-400" : hasForest ? "text-emerald-400" : "text-gray-400"}`}>
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
