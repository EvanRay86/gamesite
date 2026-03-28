"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PixelVilleEngine } from "@/lib/pixelville/engine";
import { PUBLIC_ROOMS } from "@/lib/pixelville/items";
import type { AvatarConfig, GameScreen, InventorySlot, ChatMessage } from "@/types/pixelville";
import GameCanvas from "./GameCanvas";
import ChatPanel from "./ChatPanel";
import AvatarCustomizer from "./AvatarCustomizer";
import ShopPanel from "./ShopPanel";
import InventoryPanel from "./InventoryPanel";
import RoomNav from "./RoomNav";

export default function PixelVilleGame() {
  const { user, loading: authLoading, supabase } = useAuth();
  const engineRef = useRef<PixelVilleEngine | null>(null);

  // Reactive state mirrored from engine
  const [screen, setScreen] = useState<GameScreen>("loading");
  const [coins, setCoins] = useState(0);
  const [energy, setEnergy] = useState(100);
  const [maxEnergy, setMaxEnergy] = useState(100);
  const [level, setLevel] = useState(1);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inventory, setInventory] = useState<InventorySlot[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [homeRoomId, setHomeRoomId] = useState<string | null>(null);
  const [showShop, setShowShop] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [selectedPlaceItem, setSelectedPlaceItem] = useState<string | null>(null);

  // Sync engine state → React state
  const syncState = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    setScreen(engine.state.screen);
    setCoins(engine.state.player?.coins ?? 0);
    setEnergy(engine.state.player?.energy ?? 100);
    setMaxEnergy(engine.state.player?.maxEnergy ?? 100);
    setLevel(engine.state.player?.level ?? 1);
    setMessages([...engine.state.messages]);
    setInventory([...engine.state.inventory]);
    setCurrentRoomId(engine.state.room?.id ?? null);
  }, []);

  // Initialize engine
  useEffect(() => {
    if (!user || authLoading) return;

    const engine = new PixelVilleEngine();
    engineRef.current = engine;
    engine.onStateChange = syncState;

    // Load player data
    engine.supabase = supabase;
    engine.loadPlayer(user.id).then(async () => {
      syncState();
      // Fetch home room ID
      const { data: homeRoom } = await supabase
        .from("pixelville_rooms")
        .select("id")
        .eq("owner_id", user.id)
        .eq("type", "home")
        .single();
      if (homeRoom) setHomeRoomId(homeRoom.id);
    });

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [user, authLoading, supabase, syncState]);

  // Handle avatar creation
  const handleAvatarComplete = async (name: string, config: AvatarConfig) => {
    const engine = engineRef.current;
    if (!engine || !user) return;
    await engine.createPlayer(user.id, name, config);

    // Fetch newly created home room
    const { data: homeRoom } = await supabase
      .from("pixelville_rooms")
      .select("id")
      .eq("owner_id", user.id)
      .eq("type", "home")
      .single();
    if (homeRoom) setHomeRoomId(homeRoom.id);

    // Enter town square by default
    await engine.enterRoom(PUBLIC_ROOMS.TOWN_SQUARE);
    syncState();
  };

  // Handle entering the game world after loading
  const handleEnterWorld = async () => {
    const engine = engineRef.current;
    if (!engine) return;
    const roomId = engine.state.player?.currentRoomId ?? PUBLIC_ROOMS.TOWN_SQUARE;
    await engine.enterRoom(roomId);
    syncState();
  };

  // Keyboard shortcuts for UI panels
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key === "e" || e.key === "E") {
        setShowShop(false);
        setShowInventory((prev) => !prev);
      }
      if (e.key === "b" || e.key === "B") {
        setShowInventory(false);
        setShowShop((prev) => !prev);
      }
      if (e.key === "Escape") {
        setShowShop(false);
        setShowInventory(false);
        setSelectedPlaceItem(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Handle click-to-place furniture
  useEffect(() => {
    if (!selectedPlaceItem) return;
    const engine = engineRef.current;
    if (!engine) return;

    const handlePlaceClick = async (e: MouseEvent) => {
      const canvas = engine.canvas;
      if (!canvas || !engine.tileMap) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const screenX = (e.clientX - rect.left) * scaleX;
      const screenY = (e.clientY - rect.top) * scaleY;
      const worldX = screenX + engine.camX;
      const worldY = screenY + engine.camY;
      const tileX = Math.floor(worldX / 32);
      const tileY = Math.floor(worldY / 32);

      if (selectedPlaceItem.endsWith("_seed")) {
        await engine.plantCrop(selectedPlaceItem, tileX, tileY);
      } else {
        await engine.placeFurniture(selectedPlaceItem, tileX, tileY);
      }
      syncState();
    };

    const canvas = engine.canvas;
    canvas?.addEventListener("click", handlePlaceClick);
    return () => canvas?.removeEventListener("click", handlePlaceClick);
  }, [selectedPlaceItem, syncState]);

  // ---------------------------------------------------------------------------
  // Auth guard
  // ---------------------------------------------------------------------------

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1a1a2e] text-white">
        <p className="text-white/50 animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] text-white gap-4">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)]">
          PixelVille
        </h1>
        <p className="text-white/50">
          Sign in to enter the community world
        </p>
        <a
          href="/login"
          className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 rounded-xl text-white font-semibold transition-colors"
        >
          Sign In
        </a>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Avatar creation screen
  // ---------------------------------------------------------------------------

  if (screen === "avatar_create") {
    return <AvatarCustomizer onComplete={handleAvatarComplete} />;
  }

  // ---------------------------------------------------------------------------
  // Loading / entering world
  // ---------------------------------------------------------------------------

  if (screen === "loading" || !currentRoomId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] text-white gap-6">
        <div className="text-center">
          <h1 className="text-5xl font-bold font-[family-name:var(--font-display)] mb-2">
            PixelVille
          </h1>
          <p className="text-white/40 text-sm">
            A community world where you farm, build, chat, and hang out
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="grid grid-cols-2 gap-3 text-xs text-white/50">
            <div className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/70 font-mono text-[10px]">WASD</kbd> Move</div>
            <div className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/70 font-mono text-[10px]">E</kbd> Inventory</div>
            <div className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/70 font-mono text-[10px]">B</kbd> Shop</div>
            <div className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/70 font-mono text-[10px]">Esc</kbd> Close</div>
          </div>
          <button
            onClick={handleEnterWorld}
            className="mt-2 px-10 py-3 bg-teal-500 hover:bg-teal-400 rounded-xl text-white font-semibold transition-all text-lg hover:scale-105 active:scale-95 shadow-lg shadow-teal-500/25"
          >
            Enter World
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main game view — fullscreen canvas with UI overlays
  // ---------------------------------------------------------------------------

  const energyPct = Math.round((energy / maxEnergy) * 100);

  return (
    <div className="relative w-screen h-screen bg-[#1a1a2e] overflow-hidden select-none">
      {/* Game canvas — slightly inset from edges */}
      <div className="absolute inset-4 rounded-xl overflow-hidden border border-white/10">
        {engineRef.current && <GameCanvas engine={engineRef.current} />}
      </div>

      {/* ─── HUD: Top-left stats ─── */}
      <div className="absolute top-3 left-3 z-10">
        <div className="bg-black/70 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10 space-y-2 min-w-[200px]">
          {/* Coins */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 text-lg">&#x26C5;</span>
              <span className="text-yellow-300 font-bold text-sm">{coins.toLocaleString()} coins</span>
            </div>
            <span className="text-white/40 text-xs font-medium">Lv.{level}</span>
          </div>

          {/* Energy bar */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-white/40 mb-1">
              <span>Energy</span>
              <span>{energy}/{maxEnergy}</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  energyPct > 50 ? "bg-green-400" : energyPct > 25 ? "bg-yellow-400" : "bg-red-400"
                }`}
                style={{ width: `${energyPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Room navigation (top-right) ─── */}
      {engineRef.current && (
        <RoomNav
          engine={engineRef.current}
          currentRoomId={currentRoomId}
          homeRoomId={homeRoomId}
        />
      )}

      {/* ─── Bottom toolbar ─── */}
      <div className="absolute bottom-[180px] left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        <ToolbarButton
          label="Inventory"
          shortcut="E"
          active={showInventory}
          onClick={() => {
            setShowShop(false);
            setShowInventory(!showInventory);
          }}
        />
        <ToolbarButton
          label="Shop"
          shortcut="B"
          active={showShop}
          onClick={() => {
            setShowInventory(false);
            setShowShop(!showShop);
          }}
        />
        {selectedPlaceItem && (
          <div className="flex items-center gap-2 bg-yellow-500/20 text-yellow-300 px-4 py-2 rounded-xl text-xs font-medium border border-yellow-500/30">
            <span>Placing: {selectedPlaceItem.replace(/_/g, " ")}</span>
            <button
              onClick={() => setSelectedPlaceItem(null)}
              className="text-yellow-400 hover:text-yellow-200 text-sm"
            >
              &times;
            </button>
          </div>
        )}
      </div>

      {/* ─── Chat panel ─── */}
      {engineRef.current && (
        <ChatPanel engine={engineRef.current} messages={messages} />
      )}

      {/* ─── Shop overlay ─── */}
      {showShop && engineRef.current && (
        <ShopPanel
          engine={engineRef.current}
          coins={coins}
          onClose={() => setShowShop(false)}
        />
      )}

      {/* ─── Inventory overlay ─── */}
      {showInventory && (
        <InventoryPanel
          inventory={inventory}
          onClose={() => setShowInventory(false)}
          onSelectItem={(id) => {
            setSelectedPlaceItem(id);
            setShowInventory(false);
          }}
          selectedItem={selectedPlaceItem}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toolbar button
// ---------------------------------------------------------------------------

function ToolbarButton({
  label,
  shortcut,
  active,
  onClick,
}: {
  label: string;
  shortcut: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? "bg-teal-500 text-white shadow-lg shadow-teal-500/25"
          : "bg-black/70 text-white/60 hover:bg-black/80 hover:text-white border border-white/10"
      }`}
    >
      {label}
      <kbd className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
        active ? "bg-teal-600 text-teal-200" : "bg-white/10 text-white/40"
      }`}>{shortcut}</kbd>
    </button>
  );
}
