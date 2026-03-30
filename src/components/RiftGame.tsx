"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type {
  RiftScreen,
  RiftHex,
  RiftPlayer,
  RiftSeason,
  RiftEvent,
  Faction,
  HexCoord,
  DuelPuzzleData,
  DuelResult,
} from "@/types/rift";
import { FACTION_COLORS, FACTION_NAMES } from "@/types/rift";
import { hexKey, buildHexMap, isAttackable, generateInitialMap, countFactionHexes } from "@/lib/rift-engine";
import { calculateEloChange, clampElo } from "@/lib/rift-elo";
import { pickPuzzleType, generateDuelPuzzle, calculateDuelScore } from "@/lib/rift-puzzles";
import {
  fetchOrCreateSeason,
  fetchPlayerForSeason,
  joinFaction,
  fetchHexes,
  fetchRecentEvents,
  fetchFactionCounts,
  DuelChannel,
  MapChannel,
} from "@/lib/rift-net";
import type { ChatMessage } from "@/lib/rift-net";
import { ChatChannel } from "@/lib/rift-net";
import { useAuth } from "@/contexts/AuthContext";
import RiftMap from "./RiftMap";
import RiftDuel from "./RiftDuel";
import RiftHUD from "./RiftHUD";
import RiftBattleCard from "./RiftBattleCard";
import RiftChat from "./RiftChat";

export default function RiftGame() {
  const { user, profile } = useAuth();
  const [screen, setScreen] = useState<RiftScreen>("loading");
  const [season, setSeason] = useState<RiftSeason | null>(null);
  const [player, setPlayer] = useState<RiftPlayer | null>(null);
  const [hexes, setHexes] = useState<RiftHex[]>([]);
  const [selectedHex, setSelectedHex] = useState<HexCoord | null>(null);
  const [events, setEvents] = useState<RiftEvent[]>([]);
  const [factionCounts, setFactionCounts] = useState<Record<Faction, number>>({
    crimson: 0,
    verdant: 0,
    azure: 0,
  });

  // Duel state
  const [activePuzzle, setActivePuzzle] = useState<DuelPuzzleData | null>(null);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [lastResult, setLastResult] = useState<DuelResult | null>(null);
  const [duelOpponentFaction, setDuelOpponentFaction] = useState<Faction>("crimson");

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Refs for channels
  const mapChannelRef = useRef<MapChannel | null>(null);
  const duelChannelRef = useRef<DuelChannel | null>(null);
  const chatChannelRef = useRef<ChatChannel | null>(null);

  // ── Initialize ──────────────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      // Get or create season
      const seasonData = await fetchOrCreateSeason();
      if (!seasonData) {
        // Supabase not configured — use local demo mode
        loadDemoMode();
        return;
      }

      const s: RiftSeason = {
        id: seasonData.id,
        seasonNumber: seasonData.season_number,
        startsAt: seasonData.starts_at,
        endsAt: seasonData.ends_at,
        winnerFaction: seasonData.winner_faction,
        isActive: seasonData.is_active,
      };
      setSeason(s);

      // Check if user has a player for this season
      if (user) {
        const playerData = await fetchPlayerForSeason(user.id, s.id);
        if (playerData) {
          setPlayer(mapPlayerData(playerData));
          await loadMapData(s.id);
          setScreen("map");
        } else {
          setScreen("faction_select");
        }
      } else {
        // Not logged in — show demo/guest mode
        loadDemoMode();
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function loadDemoMode() {
    // Generate a local map for demo/guest
    const demoHexes = generateInitialMap();
    let id = 1;
    const mapped: RiftHex[] = demoHexes.map((h) => ({
      id: id++,
      q: h.q,
      r: h.r,
      hexType: h.hexType,
      faction: h.faction,
      capturedAt: h.capturedAt,
      capturedBy: null,
    }));
    setHexes(mapped);
    setFactionCounts(countFactionHexes(mapped));
    setSeason({
      id: 0,
      seasonNumber: 1,
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 28 * 86400000).toISOString(),
      winnerFaction: null,
      isActive: true,
    });

    if (!user) {
      // Guest mode — show map without player
      setScreen("map");
    } else {
      setScreen("faction_select");
    }
  }

  async function loadMapData(seasonId: number) {
    const [hexData, eventData, counts] = await Promise.all([
      fetchHexes(seasonId),
      fetchRecentEvents(seasonId),
      fetchFactionCounts(seasonId),
    ]);

    if (hexData.length > 0) {
      setHexes(hexData);
    } else {
      // Initialize map in DB (first time for this season)
      // For now, use generated local map
      const demoHexes = generateInitialMap();
      let id = 1;
      setHexes(
        demoHexes.map((h) => ({
          id: id++,
          q: h.q,
          r: h.r,
          hexType: h.hexType,
          faction: h.faction,
          capturedAt: h.capturedAt,
          capturedBy: null,
        })),
      );
    }

    setEvents(eventData);
    setFactionCounts(
      hexData.length > 0
        ? counts
        : countFactionHexes(
            hexes.length > 0
              ? hexes
              : generateInitialMap().map((h, i) => ({
                  id: i + 1,
                  q: h.q,
                  r: h.r,
                  hexType: h.hexType,
                  faction: h.faction,
                  capturedAt: h.capturedAt,
                  capturedBy: null,
                })),
          ),
    );

    // Join map channel for live updates
    if (!mapChannelRef.current) {
      const mc = new MapChannel();
      mc.join(seasonId, {
        onHexUpdate: (update) => {
          setHexes((prev) =>
            prev.map((h) =>
              h.q === update.q && h.r === update.r
                ? { ...h, faction: update.faction }
                : h,
            ),
          );
        },
        onEvent: (event) => {
          setEvents((prev) => [event, ...prev].slice(0, 50));
        },
      });
      mapChannelRef.current = mc;
    }
  }

  // ── Faction Selection ──────────────────────────────────────────────────

  const handleJoinFaction = useCallback(
    async (faction: Faction) => {
      if (!user || !season) return;

      if (season.id === 0) {
        // Demo mode — create local player
        setPlayer({
          id: crypto.randomUUID(),
          userId: user.id,
          faction,
          elo: 1000,
          seasonId: 0,
          attackTokens: 5,
          tokensRefreshedAt: new Date().toISOString(),
          wins: 0,
          losses: 0,
          hexesCaptured: 0,
          hexesDefended: 0,
          displayName: profile?.display_name || null,
        });
        setScreen("map");
        return;
      }

      const playerData = await joinFaction(user.id, season.id, faction);
      if (playerData) {
        setPlayer(mapPlayerData(playerData));
        await loadMapData(season.id);
        setScreen("map");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, season, profile],
  );

  // ── Hex Click / Attack ─────────────────────────────────────────────────

  const handleHexClick = useCallback(
    (coord: HexCoord) => {
      if (!player) return;
      if (screen !== "map") return;

      const hexMap = buildHexMap(hexes);
      const hex = hexMap.get(hexKey(coord));
      if (!hex) return;

      // If clicking own territory or non-attackable, just select
      if (!isAttackable(coord, player.faction, hexMap)) {
        setSelectedHex(coord);
        return;
      }

      // Valid attack target
      setSelectedHex(coord);
    },
    [player, screen, hexes],
  );

  const handleAttack = useCallback(() => {
    if (!player || !selectedHex) return;
    if (player.attackTokens <= 0) return;

    const hexMap = buildHexMap(hexes);
    const targetHex = hexMap.get(hexKey(selectedHex));
    if (!targetHex) return;
    if (!isAttackable(selectedHex, player.faction, hexMap)) return;

    // Deduct token locally
    setPlayer((prev) => prev ? { ...prev, attackTokens: prev.attackTokens - 1 } : null);

    // Determine opponent faction
    const oppFaction = targetHex.faction || (
      ["crimson", "verdant", "azure"].filter((f) => f !== player.faction)[0] as Faction
    );
    setDuelOpponentFaction(oppFaction);

    // Generate puzzle
    const seed = Date.now();
    const puzzleType = pickPuzzleType(seed);
    const puzzle = generateDuelPuzzle(puzzleType, seed);
    setActivePuzzle(puzzle);
    setOpponentProgress(0);

    // Simulate AI opponent progress (for MVP without matchmaking)
    simulateAIProgress();

    setScreen("duel");
  }, [player, selectedHex, hexes]);

  function simulateAIProgress() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 8 + 2;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setOpponentProgress(Math.min(progress, 100));
    }, 800);

    // Store for cleanup
    return () => clearInterval(interval);
  }

  // ── Duel Complete ──────────────────────────────────────────────────────

  const handleDuelComplete = useCallback(
    (myScore: number) => {
      if (!player || !selectedHex || !activePuzzle) return;

      // AI score (based on difficulty scaling with player ELO)
      const aiBase = 300 + Math.random() * 400;
      const eloFactor = Math.min(player.elo / 2000, 1);
      const aiScore = Math.round(aiBase + eloFactor * 200);

      const won = myScore > aiScore;

      // Calculate ELO change
      const aiElo = 800 + Math.floor(Math.random() * 400);
      const [eloChange] = calculateEloChange(player.elo, aiElo, won);
      const newElo = clampElo(player.elo + eloChange);

      // Update hex ownership if won
      if (won) {
        setHexes((prev) =>
          prev.map((h) =>
            h.q === selectedHex.q && h.r === selectedHex.r
              ? { ...h, faction: player.faction, capturedAt: new Date().toISOString() }
              : h,
          ),
        );

        // Broadcast map update
        mapChannelRef.current?.broadcastHexUpdate(selectedHex.q, selectedHex.r, player.faction);
      }

      // Update player stats
      setPlayer((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          elo: newElo,
          wins: prev.wins + (won ? 1 : 0),
          losses: prev.losses + (won ? 0 : 1),
          hexesCaptured: prev.hexesCaptured + (won ? 1 : 0),
        };
      });

      // Update faction counts
      setHexes((prev) => {
        setFactionCounts(countFactionHexes(prev));
        return prev;
      });

      const result: DuelResult = {
        won,
        myScore,
        opponentScore: aiScore,
        eloChange,
        hexCaptured: won,
        hex: selectedHex,
        puzzleType: activePuzzle.type,
        opponentName: "AI Defender",
        opponentFaction: duelOpponentFaction,
      };

      setLastResult(result);
      setScreen("result");
    },
    [player, selectedHex, activePuzzle, duelOpponentFaction],
  );

  const handleDuelProgress = useCallback((progress: number) => {
    // Could broadcast to opponent
  }, []);

  // ── Chat ───────────────────────────────────────────────────────────────

  const handleSendChat = useCallback(
    (message: string) => {
      if (!player) return;

      const msg: ChatMessage = {
        playerName: player.displayName || "Soldier",
        faction: player.faction,
        message,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, msg]);

      // Broadcast via realtime
      chatChannelRef.current?.sendMessage(msg.playerName, msg.faction, message);
    },
    [player],
  );

  // ── Cleanup ────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      mapChannelRef.current?.leave();
      duelChannelRef.current?.leave();
      chatChannelRef.current?.leave();
    };
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────

  if (screen === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">{"\u2694\uFE0F"}</div>
          <div className="text-sm text-text-muted">Loading RIFT...</div>
        </div>
      </div>
    );
  }

  if (screen === "faction_select") {
    return <FactionSelect onSelect={handleJoinFaction} />;
  }

  if (screen === "duel" && activePuzzle) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <RiftDuel
          puzzleData={activePuzzle}
          playerFaction={player?.faction || "crimson"}
          opponentFaction={duelOpponentFaction}
          opponentProgress={opponentProgress}
          onComplete={handleDuelComplete}
          onProgress={handleDuelProgress}
        />
      </div>
    );
  }

  if (screen === "result" && lastResult && player) {
    return (
      <>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center text-text-muted text-sm">
            Returning to map...
          </div>
        </div>
        <RiftBattleCard
          result={lastResult}
          playerName={player.displayName || "Soldier"}
          playerFaction={player.faction}
          playerElo={player.elo}
          onClose={() => {
            setScreen("map");
            setSelectedHex(null);
            setLastResult(null);
            setActivePuzzle(null);
          }}
        />
      </>
    );
  }

  // ── Map Screen ─────────────────────────────────────────────────────────

  const hexMap = buildHexMap(hexes);
  const selectedHexData = selectedHex ? hexMap.get(hexKey(selectedHex)) : null;
  const canAttack = selectedHex && player && isAttackable(selectedHex, player.faction, hexMap);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Title Bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-text-primary">
            RIFT
          </h1>
          <p className="text-sm text-text-muted">
            Conquer the map through brain power
          </p>
        </div>
        {!user && (
          <a
            href="/login"
            className="rounded-xl bg-coral px-6 py-2.5 text-white font-bold text-sm
                       hover:bg-coral-dark transition-colors"
          >
            Sign in to play
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Map Area */}
        <div>
          <RiftMap
            hexes={hexes}
            playerFaction={player?.faction || null}
            selectedHex={selectedHex}
            onHexClick={handleHexClick}
          />

          {/* Selected Hex Action Bar */}
          {selectedHexData && player && (
            <div className="mt-4 bg-white rounded-2xl shadow-md p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold capitalize">{selectedHexData.hexType}</span>
                  <span className="font-mono text-xs text-text-muted">
                    ({selectedHex!.q}, {selectedHex!.r})
                  </span>
                </div>
                <div className="text-xs text-text-muted">
                  {selectedHexData.faction ? (
                    <span>
                      Controlled by{" "}
                      <span
                        className="font-bold capitalize"
                        style={{ color: FACTION_COLORS[selectedHexData.faction] }}
                      >
                        {selectedHexData.faction}
                      </span>
                    </span>
                  ) : (
                    "Neutral territory"
                  )}
                </div>
              </div>

              {canAttack ? (
                <button
                  onClick={handleAttack}
                  disabled={player.attackTokens <= 0}
                  className="rounded-xl bg-coral px-6 py-2.5 text-white font-bold text-sm
                             hover:bg-coral-dark transition-colors disabled:opacity-50
                             disabled:cursor-not-allowed"
                >
                  {player.attackTokens > 0
                    ? `Attack (${player.attackTokens} tokens left)`
                    : "No tokens left"}
                </button>
              ) : (
                <span className="text-xs text-text-dim">
                  {selectedHexData.faction === player.faction
                    ? "Your territory"
                    : "Not adjacent to your territory"}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          {player ? (
            <RiftHUD
              player={player}
              factionCounts={factionCounts}
              events={events}
              seasonNumber={season?.seasonNumber || 1}
            />
          ) : (
            <div className="bg-white rounded-2xl shadow-md p-6 text-center">
              <h3 className="text-lg font-bold mb-2">Welcome to RIFT</h3>
              <p className="text-sm text-text-muted mb-4">
                Join a faction and battle for territory by winning puzzle duels against other players.
              </p>
              <div className="space-y-2 text-sm text-text-secondary text-left">
                <div className="flex gap-2">
                  <span>{"\u2694\uFE0F"}</span>
                  <span>Attack hexes adjacent to your territory</span>
                </div>
                <div className="flex gap-2">
                  <span>{"\u{1F9E9}"}</span>
                  <span>Win puzzle duels to conquer territory</span>
                </div>
                <div className="flex gap-2">
                  <span>{"\u{1F3C6}"}</span>
                  <span>Climb the ELO leaderboard</span>
                </div>
                <div className="flex gap-2">
                  <span>{"\u{1F46B}"}</span>
                  <span>Coordinate with your faction in chat</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat */}
      {player && (
        <RiftChat
          faction={player.faction}
          messages={chatMessages}
          onSendMessage={handleSendChat}
        />
      )}
    </div>
  );
}

// ── Faction Selection Screen ─────────────────────────────────────────────────

function FactionSelect({ onSelect }: { onSelect: (f: Faction) => void }) {
  const factions: { id: Faction; name: string; color: string; motto: string; icon: string }[] = [
    {
      id: "crimson",
      name: "Crimson",
      color: FACTION_COLORS.crimson,
      motto: "Victory through fire",
      icon: "\u{1F525}",
    },
    {
      id: "verdant",
      name: "Verdant",
      color: FACTION_COLORS.verdant,
      motto: "Growth conquers all",
      icon: "\u{1F33F}",
    },
    {
      id: "azure",
      name: "Azure",
      color: FACTION_COLORS.azure,
      motto: "Wisdom is power",
      icon: "\u{1F4A7}",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold font-display text-text-primary mb-2">
          Choose Your Faction
        </h1>
        <p className="text-text-muted">
          Your choice is permanent for this season. Choose wisely.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {factions.map((f) => (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            className="group bg-white rounded-2xl shadow-md hover:shadow-xl p-6 text-center
                       transition-all duration-300 hover:-translate-y-1 border-2 border-transparent
                       hover:border-current"
            style={{ color: f.color }}
          >
            <div className="text-5xl mb-4">{f.icon}</div>
            <h2 className="text-2xl font-bold mb-1">{f.name}</h2>
            <p className="text-sm opacity-70 italic mb-4">&ldquo;{f.motto}&rdquo;</p>
            <div
              className="rounded-full px-6 py-2 text-white font-bold text-sm
                         opacity-0 group-hover:opacity-100 transition-opacity mx-auto inline-block"
              style={{ backgroundColor: f.color }}
            >
              Join {f.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapPlayerData(data: Record<string, unknown>): RiftPlayer {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    faction: data.faction as Faction,
    elo: data.elo as number,
    seasonId: data.season_id as number,
    attackTokens: data.attack_tokens as number,
    tokensRefreshedAt: data.tokens_refreshed_at as string,
    wins: data.wins as number,
    losses: data.losses as number,
    hexesCaptured: data.hexes_captured as number,
    hexesDefended: data.hexes_defended as number,
    displayName: null,
  };
}
