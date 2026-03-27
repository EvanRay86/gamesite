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
import type { PlayerInput, GameState, SerializedState, RenderTheme } from "@/lib/slime-engine";
import {
  quickPlay,
  createPrivateRoom,
  joinPrivateRoom,
  GameChannel,
  cleanupRoom,
} from "@/lib/slime-net";
import type { RoomInfo } from "@/lib/slime-net";
import { AI_LEVELS, computeAIInput, resetAIState } from "@/lib/slime-ai";
import type { AILevel } from "@/lib/slime-ai";

type Screen =
  | "menu"
  | "searching"
  | "waiting"
  | "joining"
  | "playing"
  | "disconnected"
  | "campaign"
  | "single-playing"
  | "level-complete"
  | "level-failed"
  | "campaign-complete";

export default function SlimeVolleyball() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [currentLevel, setCurrentLevel] = useState(0);
  const [highestLevel, setHighestLevel] = useState(0);
  const [lastScore, setLastScore] = useState<[number, number]>([0, 0]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>(createInitialState());
  const localInputRef = useRef<PlayerInput>({ left: false, right: false, jump: false });
  const guestInputRef = useRef<PlayerInput>({ left: false, right: false, jump: false });
  const channelRef = useRef<GameChannel | null>(null);
  const roomInfoRef = useRef<RoomInfo | null>(null);
  const frameRef = useRef<number>(0);
  const loopRef = useRef<number>(0);
  const aiLevelRef = useRef<AILevel | null>(null);
  const renderThemeRef = useRef<RenderTheme | null>(null);

  // Load progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("slime-campaign-level");
      if (saved) setHighestLevel(parseInt(saved, 10));
    } catch {}
  }, []);

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

  // ── Start multiplayer game loop ───────────────────────
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
        const p1Input = playerNum === 1 ? localInputRef.current : guestInputRef.current;
        const p2Input = playerNum === 2 ? localInputRef.current : guestInputRef.current;
        updateGame(gameStateRef.current, p1Input, p2Input);

        frameRef.current++;
        if (frameRef.current % 2 === 0 && channelRef.current) {
          channelRef.current.broadcastGameState(
            serializeState(gameStateRef.current)
          );
        }
      } else {
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

  // ── Start single-player game loop ────────────────────
  const startSinglePlayerLoop = useCallback((levelIndex: number) => {
    gameStateRef.current = createInitialState();
    frameRef.current = 0;
    const level = AI_LEVELS[levelIndex];
    aiLevelRef.current = level;
    renderThemeRef.current = {
      p2Color: level.color,
      p2Dark: level.colorDark,
      bgTop: level.bgTop,
      bgBottom: level.bgBottom,
      groundColor: level.groundColor,
    };
    resetAIState();

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        loopRef.current = requestAnimationFrame(loop);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const state = gameStateRef.current;

      // Check for game end
      if (state.winner !== 0) {
        renderGame(ctx, state, 1, renderThemeRef.current ?? undefined);
        // Don't continue updating, just keep rendering
        loopRef.current = requestAnimationFrame(loop);
        return;
      }

      // Compute AI input
      const aiInput = computeAIInput(state, aiLevelRef.current!);
      updateGame(state, localInputRef.current, aiInput);

      // Check if someone just won this frame
      if (state.winner !== 0) {
        setLastScore([...state.score] as [number, number]);
        if (state.winner === 1) {
          // Player won
          const newHighest = Math.max(highestLevel, levelIndex + 1);
          setHighestLevel(newHighest);
          try {
            localStorage.setItem("slime-campaign-level", String(newHighest));
          } catch {}
          if (levelIndex >= AI_LEVELS.length - 1) {
            setScreen("campaign-complete");
          } else {
            setScreen("level-complete");
          }
        } else {
          // AI won
          setScreen("level-failed");
        }
      }

      renderGame(ctx, state, 1, renderThemeRef.current ?? undefined);
      loopRef.current = requestAnimationFrame(loop);
    };

    loopRef.current = requestAnimationFrame(loop);
  }, [highestLevel]);

  // ── Connect channel and start game ────────────────────
  const connectAndPlay = useCallback(
    (info: RoomInfo) => {
      roomInfoRef.current = info;
      const channel = new GameChannel(info.roomCode);
      channelRef.current = channel;

      const playerNum: 1 | 2 = info.isHost ? 1 : 2;

      if (info.isHost) {
        channel.onGuestJoined = () => {
          setScreen("playing");
          startGameLoop(true, playerNum);
        };

        channel.onGuestInput = (input) => {
          guestInputRef.current = input;
        };
      } else {
        channel.onGameState = (state: SerializedState) => {
          gameStateRef.current = deserializeState(state);
        };

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
      setScreen("waiting");
      connectAndPlay(info);

      setTimeout(async () => {
        if (channelRef.current && !roomInfoRef.current) {
          channelRef.current.disconnect();
          await cleanupRoom(info.roomCode);
        }
      }, 60000);
    } else {
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

  // ── Single Player ─────────────────────────────────────
  const handleStartLevel = (levelIndex: number) => {
    setCurrentLevel(levelIndex);
    setScreen("single-playing");
    // Small delay to ensure canvas is mounted
    setTimeout(() => startSinglePlayerLoop(levelIndex), 50);
  };

  const handleNextLevel = () => {
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    const next = currentLevel + 1;
    setCurrentLevel(next);
    setScreen("single-playing");
    setTimeout(() => startSinglePlayerLoop(next), 50);
  };

  const handleRetryLevel = () => {
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    setScreen("single-playing");
    setTimeout(() => startSinglePlayerLoop(currentLevel), 50);
  };

  // ── Back to menu ──────────────────────────────────────
  const handleBackToMenu = () => {
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    channelRef.current?.disconnect();
    channelRef.current = null;
    roomInfoRef.current = null;
    aiLevelRef.current = null;
    renderThemeRef.current = null;
    localInputRef.current = { left: false, right: false, jump: false };
    guestInputRef.current = { left: false, right: false, jump: false };
    setScreen("menu");
    setRoomCode("");
    setJoinCode("");
    setError("");
  };

  const handleBackToCampaign = () => {
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    aiLevelRef.current = null;
    renderThemeRef.current = null;
    localInputRef.current = { left: false, right: false, jump: false };
    setScreen("campaign");
  };

  // ── Render ────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-6">
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
              onClick={() => setScreen("campaign")}
              className="bg-gradient-to-br from-coral to-coral-dark text-white border-none
                         px-10 py-4 rounded-full text-lg font-bold cursor-pointer w-64
                         shadow-[0_4px_24px_rgba(255,107,107,0.3)]
                         hover:scale-105 hover:shadow-[0_6px_32px_rgba(255,107,107,0.5)]
                         transition-all duration-200"
            >
              Single Player
            </button>

            <button
              onClick={handleQuickPlay}
              className="bg-surface text-text-muted border-[1.5px] border-border-light
                         rounded-full px-10 py-4 text-lg font-semibold cursor-pointer w-64
                         transition-all hover:bg-surface-hover hover:text-text-secondary"
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

      {/* Campaign Level Select */}
      {screen === "campaign" && (
        <div className="text-center animate-[fade-up_0.4s_ease_forwards] w-full max-w-lg">
          <h2 className="font-display text-3xl text-text-primary mb-2">Campaign</h2>
          <p className="text-text-muted text-sm mb-8">
            Defeat each opponent to unlock the next challenger
          </p>

          <div className="flex flex-col gap-2.5 mb-8">
            {AI_LEVELS.map((level, i) => {
              const unlocked = i <= highestLevel;
              const beaten = i < highestLevel;
              return (
                <button
                  key={i}
                  onClick={() => unlocked && handleStartLevel(i)}
                  disabled={!unlocked}
                  className={`flex items-center gap-4 px-5 py-3.5 rounded-xl text-left transition-all w-full
                    ${
                      unlocked
                        ? "bg-surface border-[1.5px] border-border-light cursor-pointer hover:bg-surface-hover hover:border-border-light hover:scale-[1.02]"
                        : "bg-surface/50 border-[1.5px] border-border-light/50 cursor-not-allowed opacity-40"
                    }`}
                >
                  {/* Slime preview dot */}
                  <div
                    className="w-10 h-5 rounded-t-full shrink-0"
                    style={{
                      backgroundColor: unlocked ? level.color : "#555",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text-primary text-sm">
                        Level {i + 1}
                      </span>
                      <span
                        className="font-semibold text-sm"
                        style={{ color: unlocked ? level.color : "#555" }}
                      >
                        {level.name}
                      </span>
                      {beaten && (
                        <span className="text-xs text-green-400 ml-auto">&#10003;</span>
                      )}
                    </div>
                    <p className="text-text-dim text-xs mt-0.5">{level.subtitle}</p>
                  </div>
                  {!unlocked && (
                    <span className="text-text-dim text-lg">&#128274;</span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleBackToMenu}
            className="bg-surface text-text-muted border-[1.5px] border-border-light
                       rounded-full px-6 py-2.5 text-sm font-semibold cursor-pointer
                       transition-all hover:bg-surface-hover hover:text-text-secondary"
          >
            Back
          </button>
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

      {/* Playing (Multiplayer) */}
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

      {/* Playing (Single Player) */}
      {screen === "single-playing" && (
        <div className="animate-[fade-up_0.3s_ease_forwards]">
          <div className="flex justify-between items-center mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-text-dim text-xs">Level {currentLevel + 1}</span>
              <span
                className="font-bold text-sm"
                style={{ color: AI_LEVELS[currentLevel].color }}
              >
                {AI_LEVELS[currentLevel].name}
              </span>
            </div>
          </div>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="rounded-xl border-2 border-border max-w-full"
            style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
          />
          <div className="flex justify-between items-center mt-3 px-1">
            <p className="text-text-dim text-xs">
              Arrow keys / WASD to move &middot; Up / W / Space to jump
            </p>
            <button
              onClick={handleBackToCampaign}
              className="text-text-dim text-xs hover:text-text-muted transition-colors cursor-pointer"
            >
              Quit
            </button>
          </div>
        </div>
      )}

      {/* Level Complete */}
      {screen === "level-complete" && (
        <div className="text-center animate-[fade-up_0.4s_ease_forwards]">
          <h2 className="font-display text-4xl text-green-400 mb-2">Victory!</h2>
          <p className="text-text-muted text-base mb-1">
            You defeated{" "}
            <span style={{ color: AI_LEVELS[currentLevel].color }} className="font-bold">
              {AI_LEVELS[currentLevel].name}
            </span>
          </p>
          <p className="text-text-dim text-sm mb-8">
            {lastScore[0]} &ndash; {lastScore[1]}
          </p>

          {currentLevel < AI_LEVELS.length - 1 && (
            <div className="mb-4 p-4 rounded-xl bg-surface border-[1.5px] border-border-light inline-block">
              <p className="text-text-dim text-xs mb-1">Next opponent</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-4 rounded-t-full"
                  style={{ backgroundColor: AI_LEVELS[currentLevel + 1].color }}
                />
                <div>
                  <span
                    className="font-bold text-sm"
                    style={{ color: AI_LEVELS[currentLevel + 1].color }}
                  >
                    {AI_LEVELS[currentLevel + 1].name}
                  </span>
                  <p className="text-text-dim text-xs">
                    {AI_LEVELS[currentLevel + 1].subtitle}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={handleBackToCampaign}
              className="bg-surface text-text-muted border-[1.5px] border-border-light
                         rounded-full px-6 py-2.5 text-sm font-semibold cursor-pointer
                         transition-all hover:bg-surface-hover hover:text-text-secondary"
            >
              Level Select
            </button>
            {currentLevel < AI_LEVELS.length - 1 && (
              <button
                onClick={handleNextLevel}
                className="bg-gradient-to-br from-coral to-coral-dark text-white border-none
                           rounded-full px-8 py-2.5 text-sm font-bold cursor-pointer
                           shadow-[0_4px_16px_rgba(255,107,107,0.3)]
                           hover:scale-105 transition-all duration-200"
              >
                Next Level
              </button>
            )}
          </div>
        </div>
      )}

      {/* Level Failed */}
      {screen === "level-failed" && (
        <div className="text-center animate-[fade-up_0.4s_ease_forwards]">
          <h2 className="font-display text-4xl text-text-muted mb-2">Defeated</h2>
          <p className="text-text-muted text-base mb-1">
            <span style={{ color: AI_LEVELS[currentLevel].color }} className="font-bold">
              {AI_LEVELS[currentLevel].name}
            </span>{" "}
            wins
          </p>
          <p className="text-text-dim text-sm mb-8">
            {lastScore[0]} &ndash; {lastScore[1]}
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleBackToCampaign}
              className="bg-surface text-text-muted border-[1.5px] border-border-light
                         rounded-full px-6 py-2.5 text-sm font-semibold cursor-pointer
                         transition-all hover:bg-surface-hover hover:text-text-secondary"
            >
              Level Select
            </button>
            <button
              onClick={handleRetryLevel}
              className="bg-gradient-to-br from-coral to-coral-dark text-white border-none
                         rounded-full px-8 py-2.5 text-sm font-bold cursor-pointer
                         shadow-[0_4px_16px_rgba(255,107,107,0.3)]
                         hover:scale-105 transition-all duration-200"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Campaign Complete */}
      {screen === "campaign-complete" && (
        <div className="text-center animate-[fade-up_0.4s_ease_forwards]">
          <h2 className="font-display text-5xl mb-3" style={{ color: "#FBBF24" }}>
            Champion!
          </h2>
          <p className="text-text-muted text-base mb-2">
            You defeated all 7 opponents!
          </p>
          <p className="text-text-dim text-sm mb-8">
            Final score: {lastScore[0]} &ndash; {lastScore[1]}
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleBackToMenu}
              className="bg-surface text-text-muted border-[1.5px] border-border-light
                         rounded-full px-6 py-2.5 text-sm font-semibold cursor-pointer
                         transition-all hover:bg-surface-hover hover:text-text-secondary"
            >
              Main Menu
            </button>
            <button
              onClick={handleBackToCampaign}
              className="bg-gradient-to-br from-coral to-coral-dark text-white border-none
                         rounded-full px-8 py-2.5 text-sm font-bold cursor-pointer
                         shadow-[0_4px_16px_rgba(255,107,107,0.3)]
                         hover:scale-105 transition-all duration-200"
            >
              Play Again
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
