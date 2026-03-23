"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  CANVAS_W,
  CANVAS_H,
  createInitialState,
  updateGame,
  renderGame,
  serializeState,
  deserializeState,
} from "@/lib/slime-engine";
import type { PlayerInput, GameState, SerializedState } from "@/lib/slime-engine";
import {
  quickPlay,
  createPrivateRoom,
  joinPrivateRoom,
  GameChannel,
  cleanupRoom,
} from "@/lib/slime-net";
import type { RoomInfo } from "@/lib/slime-net";

type Screen = "menu" | "searching" | "waiting" | "joining" | "playing" | "disconnected";

export default function SlimeVolleyball() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>(createInitialState());
  const localInputRef = useRef<PlayerInput>({ left: false, right: false, jump: false });
  const guestInputRef = useRef<PlayerInput>({ left: false, right: false, jump: false });
  const channelRef = useRef<GameChannel | null>(null);
  const roomInfoRef = useRef<RoomInfo | null>(null);
  const frameRef = useRef<number>(0);
  const loopRef = useRef<number>(0);

  // ── Keyboard input ────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent, down: boolean) => {
      const input = localInputRef.current;
      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          input.left = down;
          e.preventDefault();
          break;
        case "ArrowRight":
        case "d":
        case "D":
          input.right = down;
          e.preventDefault();
          break;
        case "ArrowUp":
        case "w":
        case "W":
        case " ":
          input.jump = down;
          e.preventDefault();
          break;
      }
    };

    const down = (e: KeyboardEvent) => onKey(e, true);
    const up = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // ── Cleanup on unmount ────────────────────────────────
  useEffect(() => {
    return () => {
      channelRef.current?.disconnect();
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
    };
  }, []);

  // ── Start game loop ───────────────────────────────────
  const startGameLoop = useCallback((isHost: boolean, playerNum: 1 | 2) => {
    gameStateRef.current = createInitialState();
    frameRef.current = 0;

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        loopRef.current = requestAnimationFrame(loop);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (isHost) {
        // Host runs physics
        const p1Input = playerNum === 1 ? localInputRef.current : guestInputRef.current;
        const p2Input = playerNum === 2 ? localInputRef.current : guestInputRef.current;
        updateGame(gameStateRef.current, p1Input, p2Input);

        // Broadcast state every 2nd frame
        frameRef.current++;
        if (frameRef.current % 2 === 0 && channelRef.current) {
          channelRef.current.broadcastGameState(
            serializeState(gameStateRef.current)
          );
        }
      } else {
        // Guest sends input every 3rd frame
        frameRef.current++;
        if (frameRef.current % 3 === 0 && channelRef.current) {
          channelRef.current.broadcastInput({ ...localInputRef.current });
        }
      }

      renderGame(ctx, gameStateRef.current, playerNum);
      loopRef.current = requestAnimationFrame(loop);
    };

    loopRef.current = requestAnimationFrame(loop);
  }, []);

  // ── Connect channel and start game ────────────────────
  const connectAndPlay = useCallback(
    (info: RoomInfo) => {
      roomInfoRef.current = info;
      const channel = new GameChannel(info.roomCode);
      channelRef.current = channel;

      const playerNum: 1 | 2 = info.isHost ? 1 : 2;

      if (info.isHost) {
        // Host waits for guest
        channel.onGuestJoined = () => {
          setScreen("playing");
          startGameLoop(true, playerNum);
        };

        channel.onGuestInput = (input) => {
          guestInputRef.current = input;
        };
      } else {
        // Guest receives game state from host
        channel.onGameState = (state: SerializedState) => {
          gameStateRef.current = deserializeState(state);
        };

        // Guest starts immediately
        setScreen("playing");
        startGameLoop(false, playerNum);
      }

      channel.onOpponentDisconnect = () => {
        if (loopRef.current) cancelAnimationFrame(loopRef.current);
        setScreen("disconnected");
      };

      channel.connect(info.isHost, info.playerId);
    },
    [startGameLoop]
  );

  // ── Quick Play ────────────────────────────────────────
  const handleQuickPlay = async () => {
    setError("");
    setScreen("searching");

    const info = await quickPlay();
    if (!info) {
      setError("Could not connect. Try again.");
      setScreen("menu");
      return;
    }

    setRoomCode(info.roomCode);

    if (info.isHost) {
      // Created a room, waiting for someone to join
      setScreen("waiting");
      connectAndPlay(info);

      // Poll for a match (timeout after 30s, auto-refresh the room)
      setTimeout(async () => {
        // If still waiting, cleanup and retry
        if (channelRef.current && !roomInfoRef.current) {
          channelRef.current.disconnect();
          await cleanupRoom(info.roomCode);
        }
      }, 60000);
    } else {
      // Joined an existing room
      connectAndPlay(info);
    }
  };

  // ── Private Room ──────────────────────────────────────
  const handleCreateRoom = async () => {
    setError("");
    const info = await createPrivateRoom();
    if (!info) {
      setError("Could not create room.");
      return;
    }
    setRoomCode(info.roomCode);
    setScreen("waiting");
    connectAndPlay(info);
  };

  const handleJoinRoom = async () => {
    if (joinCode.length < 4) {
      setError("Enter a 4-character room code.");
      return;
    }
    setError("");
    setScreen("searching");

    const info = await joinPrivateRoom(joinCode);
    if (!info) {
      setError("Room not found or already full.");
      setScreen("joining");
      return;
    }
    setRoomCode(info.roomCode);
    connectAndPlay(info);
  };

  // ── Back to menu ──────────────────────────────────────
  const handleBackToMenu = () => {
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    channelRef.current?.disconnect();
    channelRef.current = null;
    roomInfoRef.current = null;
    localInputRef.current = { left: false, right: false, jump: false };
    guestInputRef.current = { left: false, right: false, jump: false };
    setScreen("menu");
    setRoomCode("");
    setJoinCode("");
    setError("");
  };

  // ── Render ────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6">
      {/* Menu */}
      {screen === "menu" && (
        <div className="text-center animate-[fade-up_0.4s_ease_forwards]">
          <h1 className="font-display text-5xl text-text-primary tracking-tight mb-2">
            Slime Volleyball
          </h1>
          <p className="text-text-muted text-base mb-10">
            First to 7 wins. Arrow keys or WASD to move, Up/W/Space to jump.
          </p>

          <div className="flex flex-col gap-3 items-center mb-8">
            <button
              onClick={handleQuickPlay}
              className="bg-gradient-to-br from-coral to-coral-dark text-white border-none
                         px-10 py-4 rounded-full text-lg font-bold cursor-pointer w-64
                         shadow-[0_4px_24px_rgba(255,107,107,0.3)]
                         hover:scale-105 hover:shadow-[0_6px_32px_rgba(255,107,107,0.5)]
                         transition-all duration-200"
            >
              Quick Play
            </button>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCreateRoom}
                className="bg-surface text-text-muted border-[1.5px] border-border-light
                           rounded-full px-6 py-3 text-sm font-semibold cursor-pointer
                           transition-all hover:bg-surface-hover hover:text-text-secondary"
              >
                Create Private Room
              </button>
              <button
                onClick={() => setScreen("joining")}
                className="bg-surface text-text-muted border-[1.5px] border-border-light
                           rounded-full px-6 py-3 text-sm font-semibold cursor-pointer
                           transition-all hover:bg-surface-hover hover:text-text-secondary"
              >
                Join Room
              </button>
            </div>
          </div>

          {error && (
            <p className="text-error text-sm mt-2">{error}</p>
          )}
        </div>
      )}

      {/* Join Room Input */}
      {screen === "joining" && (
        <div className="text-center animate-[fade-up_0.4s_ease_forwards]">
          <h2 className="font-display text-3xl text-text-primary mb-6">Join Room</h2>
          <input
            type="text"
            maxLength={4}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="ABCD"
            className="bg-surface text-text-primary text-center text-2xl font-bold
                       border-2 border-border-light rounded-xl px-6 py-3 w-40
                       uppercase tracking-[0.3em] outline-none
                       focus:border-coral transition-colors"
          />
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={handleBackToMenu}
              className="bg-surface text-text-muted border-[1.5px] border-border-light
                         rounded-full px-6 py-2.5 text-sm font-semibold cursor-pointer
                         transition-all hover:bg-surface-hover hover:text-text-secondary"
            >
              Back
            </button>
            <button
              onClick={handleJoinRoom}
              className="bg-gradient-to-br from-coral to-coral-dark text-white border-none
                         rounded-full px-8 py-2.5 text-sm font-bold cursor-pointer
                         shadow-[0_4px_16px_rgba(255,107,107,0.3)]
                         hover:scale-105 transition-all duration-200"
            >
              Join
            </button>
          </div>
          {error && <p className="text-error text-sm mt-4">{error}</p>}
        </div>
      )}

      {/* Searching */}
      {screen === "searching" && (
        <div className="text-center animate-[fade-up_0.4s_ease_forwards]">
          <div className="w-10 h-10 border-4 border-border-light border-t-coral rounded-full animate-spin mx-auto mb-6" />
          <h2 className="font-display text-2xl text-text-primary mb-2">Finding opponent...</h2>
          <p className="text-text-muted text-sm">This should only take a moment</p>
          <button
            onClick={handleBackToMenu}
            className="mt-6 bg-surface text-text-muted border-[1.5px] border-border-light
                       rounded-full px-6 py-2.5 text-sm font-semibold cursor-pointer
                       transition-all hover:bg-surface-hover hover:text-text-secondary"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Waiting for opponent */}
      {screen === "waiting" && (
        <div className="text-center animate-[fade-up_0.4s_ease_forwards]">
          <div className="w-10 h-10 border-4 border-border-light border-t-teal rounded-full animate-spin mx-auto mb-6" />
          <h2 className="font-display text-2xl text-text-primary mb-2">Waiting for opponent</h2>
          {roomCode && (
            <div className="mt-4">
              <p className="text-text-muted text-sm mb-2">Room code:</p>
              <div className="text-3xl font-bold text-coral tracking-[0.3em]">
                {roomCode}
              </div>
              <p className="text-text-dim text-xs mt-2">Share this code with a friend</p>
            </div>
          )}
          <button
            onClick={handleBackToMenu}
            className="mt-8 bg-surface text-text-muted border-[1.5px] border-border-light
                       rounded-full px-6 py-2.5 text-sm font-semibold cursor-pointer
                       transition-all hover:bg-surface-hover hover:text-text-secondary"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Playing */}
      {screen === "playing" && (
        <div className="animate-[fade-up_0.3s_ease_forwards]">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="rounded-xl border-2 border-border max-w-full cursor-pointer"
            style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
            onClick={(e) => {
              if (gameStateRef.current.winner === 0) return;
              const rect = canvasRef.current!.getBoundingClientRect();
              const scaleX = CANVAS_W / rect.width;
              const scaleY = CANVAS_H / rect.height;
              const cx = (e.clientX - rect.left) * scaleX;
              const cy = (e.clientY - rect.top) * scaleY;
              const btnW = 160, btnH = 40;
              const btnX = CANVAS_W / 2 - btnW / 2;
              const btnY = CANVAS_H / 2 + 50;
              if (cx >= btnX && cx <= btnX + btnW && cy >= btnY && cy <= btnY + btnH) {
                handleBackToMenu();
              }
            }}
          />
          <div className="flex justify-between items-center mt-3 px-1">
            <p className="text-text-dim text-xs">
              Arrow keys / WASD to move &middot; Up / W / Space to jump
            </p>
            <button
              onClick={handleBackToMenu}
              className="text-text-dim text-xs hover:text-text-muted transition-colors cursor-pointer"
            >
              Leave
            </button>
          </div>
        </div>
      )}

      {/* Disconnected */}
      {screen === "disconnected" && (
        <div className="text-center animate-[fade-up_0.4s_ease_forwards]">
          <h2 className="font-display text-2xl text-text-primary mb-2">Opponent disconnected</h2>
          <p className="text-text-muted text-sm mb-6">The other player left the game.</p>
          <button
            onClick={handleBackToMenu}
            className="bg-gradient-to-br from-coral to-coral-dark text-white border-none
                       rounded-full px-8 py-3 text-base font-bold cursor-pointer
                       shadow-[0_4px_16px_rgba(255,107,107,0.3)]
                       hover:scale-105 transition-all duration-200"
          >
            Back to Menu
          </button>
        </div>
      )}
    </div>
  );
}
