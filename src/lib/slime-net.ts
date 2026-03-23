import { getSupabase } from "./supabase";
import type { SerializedState } from "./slime-engine";
import type { PlayerInput } from "./slime-engine";
import type { RealtimeChannel } from "@supabase/supabase-js";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generatePlayerId(): string {
  return crypto.randomUUID();
}

export interface RoomInfo {
  roomCode: string;
  isHost: boolean;
  playerId: string;
}

// ── Quick Play matchmaking ────────────────────────────────
export async function quickPlay(): Promise<RoomInfo | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const playerId = generatePlayerId();

  // Look for a waiting room (created in the last 30 seconds)
  const cutoff = new Date(Date.now() - 30000).toISOString();
  const { data: rooms } = await supabase
    .from("rooms")
    .select("room_code")
    .eq("status", "waiting")
    .gte("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(1);

  if (rooms && rooms.length > 0) {
    const roomCode = rooms[0].room_code;
    // Try to claim this room
    const { error } = await supabase
      .from("rooms")
      .update({ status: "playing", guest_id: playerId })
      .eq("room_code", roomCode)
      .eq("status", "waiting");

    if (!error) {
      return { roomCode, isHost: false, playerId };
    }
  }

  // No waiting rooms found — create one
  const roomCode = generateRoomCode();
  const { error } = await supabase.from("rooms").insert({
    room_code: roomCode,
    status: "waiting",
    host_id: playerId,
  });

  if (error) return null;
  return { roomCode, isHost: true, playerId };
}

// ── Private room ──────────────────────────────────────────
export async function createPrivateRoom(): Promise<RoomInfo | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const playerId = generatePlayerId();
  const roomCode = generateRoomCode();

  const { error } = await supabase.from("rooms").insert({
    room_code: roomCode,
    status: "waiting",
    host_id: playerId,
  });

  if (error) return null;
  return { roomCode, isHost: true, playerId };
}

export async function joinPrivateRoom(
  roomCode: string
): Promise<RoomInfo | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const playerId = generatePlayerId();
  const { data, error } = await supabase
    .from("rooms")
    .update({ status: "playing", guest_id: playerId })
    .eq("room_code", roomCode.toUpperCase())
    .eq("status", "waiting")
    .select()
    .single();

  if (error || !data) return null;
  return { roomCode: roomCode.toUpperCase(), isHost: false, playerId };
}

// ── Game Channel (Supabase Realtime) ──────────────────────
export class GameChannel {
  private channel: RealtimeChannel | null = null;
  private roomCode: string;
  public onGuestJoined: (() => void) | null = null;
  public onGameState: ((state: SerializedState) => void) | null = null;
  public onGuestInput: ((input: PlayerInput) => void) | null = null;
  public onOpponentDisconnect: (() => void) | null = null;

  constructor(roomCode: string) {
    this.roomCode = roomCode;
  }

  connect(isHost: boolean, playerId: string): void {
    const supabase = getSupabase();
    if (!supabase) return;

    this.channel = supabase.channel(`slime-${this.roomCode}`, {
      config: { presence: { key: playerId } },
    });

    // Listen for game state (guest receives this)
    this.channel.on("broadcast", { event: "game-state" }, ({ payload }) => {
      if (this.onGameState) this.onGameState(payload as SerializedState);
    });

    // Listen for guest input (host receives this)
    this.channel.on("broadcast", { event: "player-input" }, ({ payload }) => {
      if (this.onGuestInput) this.onGuestInput(payload as PlayerInput);
    });

    // Presence for detecting joins/disconnects
    this.channel.on("presence", { event: "join" }, ({ newPresences }) => {
      if (isHost && newPresences.length > 0) {
        // Check if it's not ourselves
        const others = newPresences.filter(
          (p) => p.presence_ref !== playerId
        );
        if (others.length > 0 && this.onGuestJoined) {
          this.onGuestJoined();
        }
      }
    });

    this.channel.on("presence", { event: "leave" }, () => {
      if (this.onOpponentDisconnect) this.onOpponentDisconnect();
    });

    this.channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await this.channel!.track({ player_id: playerId, is_host: isHost });
      }
    });
  }

  broadcastGameState(state: SerializedState): void {
    if (!this.channel) return;
    this.channel.send({
      type: "broadcast",
      event: "game-state",
      payload: state,
    });
  }

  broadcastInput(input: PlayerInput): void {
    if (!this.channel) return;
    this.channel.send({
      type: "broadcast",
      event: "player-input",
      payload: input,
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

// ── Cleanup old rooms ─────────────────────────────────────
export async function cleanupRoom(roomCode: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("rooms").delete().eq("room_code", roomCode);
}
