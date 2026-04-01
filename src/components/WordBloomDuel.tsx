"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSupabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import WordBloomGame from "@/components/WordBloomGame";

type DuelPhase = "lobby" | "waiting" | "countdown" | "playing";

function loadPlayerName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("gamesite-bloom-name") || "";
}

function savePlayerName(name: string) {
  try {
    localStorage.setItem("gamesite-bloom-name", name);
  } catch {
    // ignore
  }
}

export default function WordBloomDuel() {
  const [phase, setPhase] = useState<DuelPhase>("lobby");
  const [playerName, setPlayerName] = useState(() => loadPlayerName());
  const [roomId, setRoomId] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [letters, setLetters] = useState<string[] | null>(null);
  const [opponentName, setOpponentName] = useState("");
  const [countdown, setCountdown] = useState(3);
  const [isHost, setIsHost] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        const supabase = getSupabase();
        if (supabase) supabase.removeChannel(channelRef.current);
      }
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Join the realtime channel for the room
  const joinChannel = useCallback(
    (rid: string, host: boolean) => {
      const supabase = getSupabase();
      if (!supabase) return;

      const channel = supabase.channel(`bloom-duel-${rid}`);

      channel
        .on("broadcast", { event: "start" }, () => {
          // Both players start the countdown
          setPhase("countdown");
        })
        .on("broadcast", { event: "joined" }, (payload) => {
          const name = payload.payload?.name as string;
          if (name) setOpponentName(name);
          // Host sees guest joined → start the game
          if (host) {
            setTimeout(() => {
              channel.send({
                type: "broadcast",
                event: "start",
                payload: {},
              });
              setPhase("countdown");
            }, 500);
          }
        })
        .subscribe();

      channelRef.current = channel;
    },
    []
  );

  // ── Create room ────────────────────────────────────────────────────────
  const handleCreate = useCallback(async () => {
    if (!playerName.trim()) return;
    savePlayerName(playerName.trim());
    setError("");

    try {
      const res = await fetch("/api/word-bloom/duel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: playerName.trim(), action: "create" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create room");
        return;
      }

      setRoomId(data.roomId);
      setLetters(data.letters);
      setIsHost(true);
      setPhase("waiting");

      joinChannel(data.roomId, true);
    } catch {
      setError("Network error");
    }
  }, [playerName, joinChannel]);

  // ── Join room ──────────────────────────────────────────────────────────
  const handleJoin = useCallback(async () => {
    if (!playerName.trim() || !joinCode.trim()) return;
    savePlayerName(playerName.trim());
    setError("");

    try {
      const res = await fetch("/api/word-bloom/duel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: playerName.trim(),
          action: "join",
          roomId: joinCode.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to join");
        return;
      }

      setRoomId(data.roomId);
      setLetters(data.letters);
      setOpponentName(data.hostName);
      setIsHost(false);

      joinChannel(data.roomId, false);

      // Notify host that guest joined
      setTimeout(() => {
        channelRef.current?.send({
          type: "broadcast",
          event: "joined",
          payload: { name: playerName.trim() },
        });
      }, 500);
    } catch {
      setError("Network error");
    }
  }, [playerName, joinCode, joinChannel]);

  // ── Countdown ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "countdown") return;

    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase("playing");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // ════════════════════════════════════════════════════════════════════════
  // LOBBY
  // ════════════════════════════════════════════════════════════════════════
  if (phase === "lobby") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-6">
            <h1 className="font-display text-4xl text-text-primary mb-1">
              Word Bloom Duel
            </h1>
            <p className="text-text-muted text-sm">
              Challenge a friend — same letters, 60 seconds, highest score wins!
            </p>
          </div>

          {/* Name input */}
          <div className="bg-white rounded-2xl border border-border-light shadow-sm p-5 mb-4">
            <label className="text-sm font-semibold text-text-muted block mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.slice(0, 20))}
              placeholder="Enter your name..."
              maxLength={20}
              className="w-full rounded-xl border-2 border-border-light px-4 py-3
                         text-sm font-semibold focus:outline-none focus:border-green"
            />
          </div>

          {/* Create */}
          <button
            onClick={handleCreate}
            disabled={!playerName.trim()}
            className="w-full rounded-2xl bg-green px-6 py-4 text-lg font-bold
                       text-white hover:bg-green/90 transition-colors mb-3
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create Room
          </button>

          {/* Join */}
          <div className="bg-white rounded-2xl border border-border-light shadow-sm p-5">
            <label className="text-sm font-semibold text-text-muted block mb-2">
              Or Join a Room
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) =>
                  setJoinCode(e.target.value.toUpperCase().slice(0, 4))
                }
                placeholder="Room code..."
                maxLength={4}
                className="flex-1 rounded-xl border-2 border-border-light px-4 py-3
                           text-center text-lg font-bold tracking-widest uppercase
                           focus:outline-none focus:border-green"
              />
              <button
                onClick={handleJoin}
                disabled={!playerName.trim() || joinCode.length < 4}
                className="rounded-xl bg-green px-5 py-3 text-sm font-bold
                           text-white hover:bg-green/90 transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Join
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center mt-3">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // WAITING FOR OPPONENT (host only)
  // ════════════════════════════════════════════════════════════════════════
  if (phase === "waiting") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-[420px] text-center">
          <h2 className="font-display text-3xl text-text-primary mb-4">
            Waiting for opponent...
          </h2>

          <div className="bg-white rounded-2xl border border-border-light shadow-sm p-6 mb-4">
            <p className="text-text-muted text-sm mb-3">
              Share this code with your friend:
            </p>
            <div className="text-5xl font-bold tracking-[0.3em] text-green mb-4">
              {roomId}
            </div>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(roomId);
                } catch {
                  // silent
                }
              }}
              className="rounded-full border border-border-light px-5 py-2
                         text-sm font-semibold text-text-muted hover:bg-surface
                         transition-colors"
            >
              Copy Code
            </button>
          </div>

          <div className="animate-pulse text-text-dim text-sm">
            Listening for players...
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // COUNTDOWN
  // ════════════════════════════════════════════════════════════════════════
  if (phase === "countdown") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-[420px] text-center">
          <p className="text-text-muted text-sm mb-2">
            {isHost ? "You" : playerName} vs {opponentName || "Opponent"}
          </p>
          <div className="text-8xl font-bold text-green animate-pulse">
            {countdown}
          </div>
          <p className="text-text-muted mt-4">Get ready!</p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // PLAYING — render the game with multiplayer mode
  // ════════════════════════════════════════════════════════════════════════
  if (phase === "playing" && letters) {
    const puzzle = {
      id: `duel-${roomId}`,
      puzzle_date: new Date().toISOString().split("T")[0],
      letters,
    };

    return <WordBloomGame puzzle={puzzle} mode="multiplayer" />;
  }

  return null;
}
