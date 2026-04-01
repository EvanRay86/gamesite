// ── Snake Arena Networking ──────────────────────────────────
// Multi-player room management & real-time sync via Supabase Realtime

import { getSupabase } from "./supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Direction, SerializedSnakeState } from "./snake-engine";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generatePlayerId(): string {
  return crypto.randomUUID();
}

export interface SnakeRoomInfo {
  roomCode: string;
  isHost: boolean;
  playerId: string;
}

// ── Quick Play matchmaking ─────────────────────────────────
export async function quickPlaySnake(): Promise<SnakeRoomInfo | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const playerId = generatePlayerId();

  // Look for a waiting snake room (created in last 2 minutes — longer window for lobbies)
  const cutoff = new Date(Date.now() - 120000).toISOString();
  const { data: rooms } = await supabase
    .from("rooms")
    .select("room_code")
    .eq("status", "waiting")
    .eq("game_type", "snake")
    .gte("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(1);

  if (rooms && rooms.length > 0) {
    const roomCode = rooms[0].room_code;
    return { roomCode, isHost: false, playerId };
  }

  // No waiting rooms — create one
  const roomCode = generateRoomCode();
  const { error } = await supabase.from("rooms").insert({
    room_code: roomCode,
    status: "waiting",
    host_id: playerId,
    game_type: "snake",
    max_players: 10,
  });

  if (error) return null;
  return { roomCode, isHost: true, playerId };
}

// ── Private room ───────────────────────────────────────────
export async function createPrivateSnakeRoom(): Promise<SnakeRoomInfo | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const playerId = generatePlayerId();
  const roomCode = generateRoomCode();

  const { error } = await supabase.from("rooms").insert({
    room_code: roomCode,
    status: "waiting",
    host_id: playerId,
    game_type: "snake",
    max_players: 10,
  });

  if (error) return null;
  return { roomCode, isHost: true, playerId };
}

export async function joinPrivateSnakeRoom(
  roomCode: string
): Promise<SnakeRoomInfo | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  // Verify the room exists and is a snake room
  const { data } = await supabase
    .from("rooms")
    .select("room_code, game_type, status")
    .eq("room_code", roomCode.toUpperCase())
    .in("status", ["waiting", "playing"])
    .single();

  if (!data || data.game_type !== "snake") return null;

  const playerId = generatePlayerId();
  return { roomCode: roomCode.toUpperCase(), isHost: false, playerId };
}

// ── Snake Channel (Supabase Realtime) ──────────────────────
export interface PresencePlayer {
  playerId: string;
  name: string;
  isHost: boolean;
}

export class SnakeChannel {
  private channel: RealtimeChannel | null = null;
  private roomCode: string;

  // Callbacks
  public onPresenceSync: ((players: PresencePlayer[]) => void) | null = null;
  public onGameState: ((state: SerializedSnakeState) => void) | null = null;
  public onPlayerInput:
    | ((playerId: string, direction: Direction) => void)
    | null = null;
  public onGameStart: (() => void) | null = null;
  public onPlayerDisconnect: ((playerId: string) => void) | null = null;

  constructor(roomCode: string) {
    this.roomCode = roomCode;
  }

  connect(playerId: string, playerName: string, isHost: boolean): void {
    const supabase = getSupabase();
    if (!supabase) return;

    this.channel = supabase.channel(`snake-${this.roomCode}`, {
      config: { presence: { key: playerId } },
    });

    // Game state (clients receive from host)
    this.channel.on("broadcast", { event: "snake-state" }, ({ payload }) => {
      if (this.onGameState)
        this.onGameState(payload as SerializedSnakeState);
    });

    // Player input (host receives from clients)
    this.channel.on("broadcast", { event: "snake-input" }, ({ payload }) => {
      const { playerId: pid, direction } = payload as {
        playerId: string;
        direction: Direction;
      };
      if (this.onPlayerInput) this.onPlayerInput(pid, direction);
    });

    // Game start signal
    this.channel.on("broadcast", { event: "game-start" }, () => {
      if (this.onGameStart) this.onGameStart();
    });

    // Presence for tracking who is in the room
    this.channel.on("presence", { event: "sync" }, () => {
      if (!this.channel) return;
      const presenceState = this.channel.presenceState();
      const players: PresencePlayer[] = [];
      for (const [, presences] of Object.entries(presenceState)) {
        const p = presences[0] as unknown as {
          player_id: string;
          name: string;
          is_host: boolean;
        };
        if (p) {
          players.push({
            playerId: p.player_id,
            name: p.name,
            isHost: p.is_host,
          });
        }
      }
      if (this.onPresenceSync) this.onPresenceSync(players);
    });

    this.channel.on("presence", { event: "leave" }, ({ leftPresences }) => {
      if (!this.onPlayerDisconnect) return;
      for (const p of leftPresences) {
        const data = p as unknown as { player_id: string };
        if (data.player_id) this.onPlayerDisconnect(data.player_id);
      }
    });

    this.channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await this.channel!.track({
          player_id: playerId,
          name: playerName,
          is_host: isHost,
        });
      }
    });
  }

  broadcastGameState(state: SerializedSnakeState): void {
    if (!this.channel) return;
    this.channel.send({
      type: "broadcast",
      event: "snake-state",
      payload: state,
    });
  }

  broadcastDirection(playerId: string, direction: Direction): void {
    if (!this.channel) return;
    this.channel.send({
      type: "broadcast",
      event: "snake-input",
      payload: { playerId, direction },
    });
  }

  broadcastGameStart(): void {
    if (!this.channel) return;
    this.channel.send({
      type: "broadcast",
      event: "game-start",
      payload: {},
    });
  }

  disconnect(): void {
    if (this.channel) {
      const supabase = getSupabase();
      if (supabase) {
        supabase.removeChannel(this.channel);
      }
      this.channel = null;
    }
  }
}

// ── Cleanup ────────────────────────────────────────────────
export async function cleanupSnakeRoom(roomCode: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("rooms").delete().eq("room_code", roomCode);
}
