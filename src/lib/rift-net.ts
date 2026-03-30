// RIFT — Supabase Realtime networking layer
// Handles matchmaking, duel sync, and live map updates

import { getSupabase } from "./supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Faction, RiftHex, RiftPlayer, RiftEvent, RiftDuel } from "@/types/rift";

// ── Duel Channel ─────────────────────────────────────────────────────────────

export interface DuelChannelCallbacks {
  onOpponentReady?: () => void;
  onOpponentScore?: (score: number) => void;
  onOpponentProgress?: (progress: number) => void;
  onDuelComplete?: (result: { winnerId: string; attackerScore: number; defenderScore: number }) => void;
  onDisconnect?: () => void;
}

export class DuelChannel {
  private channel: RealtimeChannel | null = null;
  private playerId: string;
  private duelId: string;

  constructor(duelId: string, playerId: string) {
    this.duelId = duelId;
    this.playerId = playerId;
  }

  join(callbacks: DuelChannelCallbacks): void {
    const supabase = getSupabase();
    if (!supabase) return;

    this.channel = supabase.channel(`rift-duel-${this.duelId}`, {
      config: { presence: { key: this.playerId } },
    });

    this.channel
      .on("broadcast", { event: "ready" }, (payload) => {
        if (payload.payload?.playerId !== this.playerId) {
          callbacks.onOpponentReady?.();
        }
      })
      .on("broadcast", { event: "score" }, (payload) => {
        if (payload.payload?.playerId !== this.playerId) {
          callbacks.onOpponentScore?.(payload.payload?.score ?? 0);
        }
      })
      .on("broadcast", { event: "progress" }, (payload) => {
        if (payload.payload?.playerId !== this.playerId) {
          callbacks.onOpponentProgress?.(payload.payload?.progress ?? 0);
        }
      })
      .on("broadcast", { event: "complete" }, (payload) => {
        callbacks.onDuelComplete?.(payload.payload as {
          winnerId: string;
          attackerScore: number;
          defenderScore: number;
        });
      })
      .on("presence", { event: "leave" }, () => {
        callbacks.onDisconnect?.();
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await this.channel?.track({ playerId: this.playerId });
        }
      });
  }

  sendReady(): void {
    this.channel?.send({
      type: "broadcast",
      event: "ready",
      payload: { playerId: this.playerId },
    });
  }

  sendProgress(progress: number): void {
    this.channel?.send({
      type: "broadcast",
      event: "progress",
      payload: { playerId: this.playerId, progress },
    });
  }

  sendScore(score: number): void {
    this.channel?.send({
      type: "broadcast",
      event: "score",
      payload: { playerId: this.playerId, score },
    });
  }

  sendComplete(winnerId: string, attackerScore: number, defenderScore: number): void {
    this.channel?.send({
      type: "broadcast",
      event: "complete",
      payload: { winnerId, attackerScore, defenderScore },
    });
  }

  leave(): void {
    if (this.channel) {
      const supabase = getSupabase();
      supabase?.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

// ── Map Channel (global live updates) ────────────────────────────────────────

export interface MapChannelCallbacks {
  onHexUpdate?: (hex: { q: number; r: number; faction: Faction | null }) => void;
  onEvent?: (event: RiftEvent) => void;
}

export class MapChannel {
  private channel: RealtimeChannel | null = null;

  join(seasonId: number, callbacks: MapChannelCallbacks): void {
    const supabase = getSupabase();
    if (!supabase) return;

    this.channel = supabase.channel(`rift-map-${seasonId}`);

    this.channel
      .on("broadcast", { event: "hex_update" }, (payload) => {
        callbacks.onHexUpdate?.(payload.payload as { q: number; r: number; faction: Faction | null });
      })
      .on("broadcast", { event: "event" }, (payload) => {
        callbacks.onEvent?.(payload.payload as RiftEvent);
      })
      .subscribe();
  }

  broadcastHexUpdate(q: number, r: number, faction: Faction | null): void {
    this.channel?.send({
      type: "broadcast",
      event: "hex_update",
      payload: { q, r, faction },
    });
  }

  broadcastEvent(event: RiftEvent): void {
    this.channel?.send({
      type: "broadcast",
      event: "event",
      payload: event,
    });
  }

  leave(): void {
    if (this.channel) {
      const supabase = getSupabase();
      supabase?.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

// ── Faction Chat Channel ─────────────────────────────────────────────────────

export interface ChatMessage {
  playerName: string;
  faction: Faction;
  message: string;
  timestamp: number;
}

export interface ChatChannelCallbacks {
  onMessage?: (msg: ChatMessage) => void;
}

export class ChatChannel {
  private channel: RealtimeChannel | null = null;

  join(seasonId: number, faction: Faction, callbacks: ChatChannelCallbacks): void {
    const supabase = getSupabase();
    if (!supabase) return;

    this.channel = supabase.channel(`rift-chat-${seasonId}-${faction}`);

    this.channel
      .on("broadcast", { event: "message" }, (payload) => {
        callbacks.onMessage?.(payload.payload as ChatMessage);
      })
      .subscribe();
  }

  sendMessage(playerName: string, faction: Faction, message: string): void {
    this.channel?.send({
      type: "broadcast",
      event: "message",
      payload: {
        playerName,
        faction,
        message,
        timestamp: Date.now(),
      },
    });
  }

  leave(): void {
    if (this.channel) {
      const supabase = getSupabase();
      supabase?.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

// ── Data fetching helpers ────────────────────────────────────────────────────

export async function fetchActiveSeason() {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data } = await supabase
    .from("rift_seasons")
    .select("*")
    .eq("is_active", true)
    .single();

  return data;
}

export async function fetchOrCreateSeason() {
  const supabase = getSupabase();
  if (!supabase) return null;

  // Try to get active season
  let { data: season } = await supabase
    .from("rift_seasons")
    .select("*")
    .eq("is_active", true)
    .single();

  if (!season) {
    // Create season 1
    const now = new Date();
    const endsAt = new Date(now);
    endsAt.setDate(endsAt.getDate() + 28);

    const { data: newSeason } = await supabase
      .from("rift_seasons")
      .insert({
        season_number: 1,
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    season = newSeason;
  }

  return season;
}

export async function fetchPlayerForSeason(userId: string, seasonId: number) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data } = await supabase
    .from("rift_players")
    .select("*")
    .eq("user_id", userId)
    .eq("season_id", seasonId)
    .single();

  return data;
}

export async function joinFaction(userId: string, seasonId: number, faction: Faction) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data } = await supabase
    .from("rift_players")
    .insert({
      user_id: userId,
      season_id: seasonId,
      faction,
      elo: 1000,
      attack_tokens: 5,
    })
    .select()
    .single();

  return data;
}

export async function fetchHexes(seasonId: number): Promise<RiftHex[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from("rift_hexes")
    .select("*")
    .eq("season_id", seasonId);

  if (!data) return [];

  return data.map((h: Record<string, unknown>) => ({
    id: h.id as number,
    q: h.q as number,
    r: h.r as number,
    hexType: h.hex_type as RiftHex["hexType"],
    faction: h.faction as Faction | null,
    capturedAt: h.captured_at as string | null,
    capturedBy: h.captured_by as string | null,
  }));
}

export async function fetchRecentEvents(seasonId: number, limit: number = 20): Promise<RiftEvent[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from("rift_events")
    .select("*")
    .eq("season_id", seasonId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];

  return data.map((e: Record<string, unknown>) => ({
    id: e.id as number,
    seasonId: e.season_id as number,
    eventType: e.event_type as RiftEvent["eventType"],
    data: e.data as RiftEvent["data"],
    createdAt: e.created_at as string,
  }));
}

export async function fetchLeaderboard(seasonId: number, limit: number = 20) {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from("rift_players")
    .select("id, faction, elo, wins, hexes_captured, user_id")
    .eq("season_id", seasonId)
    .order("elo", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function fetchFactionCounts(seasonId: number): Promise<Record<Faction, number>> {
  const supabase = getSupabase();
  const counts: Record<Faction, number> = { crimson: 0, verdant: 0, azure: 0 };
  if (!supabase) return counts;

  const { data } = await supabase
    .from("rift_hexes")
    .select("faction")
    .eq("season_id", seasonId)
    .not("faction", "is", null);

  if (data) {
    for (const row of data) {
      const f = row.faction as Faction;
      if (f) counts[f]++;
    }
  }

  return counts;
}
