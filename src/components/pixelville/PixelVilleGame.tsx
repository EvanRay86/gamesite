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
    // Enter the last room or town square
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] text-white gap-4">
        <h1 className="text-4xl font-bold font-[family-name:var(--font-display)]">
          PixelVille
        </h1>
        <p className="text-white/50 text-sm max-w-md text-center">
          A community world where you farm, build, chat, and hang out.
          Walk with WASD, press E for inventory, B for shop.
        </p>
        <button
          onClick={handleEnterWorld}
          className="px-8 py-3 bg-teal-500 hover:bg-teal-400 rounded-xl text-white font-semibold transition-colors text-lg"
        >
          Enter World
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main game view
  // ---------------------------------------------------------------------------

  return (
    <div className="relative w-full h-screen bg-[#1a1a2e] overflow-hidden">
      {/* Game canvas */}
      <div className="w-full h-full">
        {engineRef.current && <GameCanvas engine={engineRef.current} />}
      </div>

      {/* Room navigation */}
      {engineRef.current && (
        <RoomNav
          engine={engineRef.current}
          currentRoomId={currentRoomId}
          homeRoomId={homeRoomId}
        />
      )}

      {/* Bottom toolbar */}
      <div className="absolute bottom-40 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        <ToolbarButton
          label="Inventory (E)"
          active={showInventory}
          onClick={() => {
            setShowShop(false);
            setShowInventory(!showInventory);
          }}
        />
        <ToolbarButton
          label="Shop (B)"
          active={showShop}
          onClick={() => {
            setShowInventory(false);
            setShowShop(!showShop);
          }}
        />
        {selectedPlaceItem && (
          <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-lg text-xs font-medium">
            <span>Placing: {selectedPlaceItem.replace(/_/g, " ")}</span>
            <button
              onClick={() => setSelectedPlaceItem(null)}
              className="ml-1 text-yellow-400 hover:text-yellow-200"
            >
              &times;
            </button>
          </div>
        )}
      </div>

      {/* Chat panel */}
      {engineRef.current && (
        <ChatPanel engine={engineRef.current} messages={messages} />
      )}

      {/* Shop overlay */}
      {showShop && engineRef.current && (
        <ShopPanel
          engine={engineRef.current}
          coins={coins}
          onClose={() => setShowShop(false)}
        />
      )}

      {/* Inventory overlay */}
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
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
        active
          ? "bg-teal-500 text-white"
          : "bg-black/60 text-white/60 hover:bg-black/80 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
