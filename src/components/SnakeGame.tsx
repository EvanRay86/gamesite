"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  createSnakeGame,
  addPlayer,
  removePlayer,
  setPlayerDirection,
  tickGame,
  serializeState,
  deserializeState,
  renderSnakeGame,
  TICK_MS,
  DIR_UP,
  DIR_DOWN,
  DIR_LEFT,
  DIR_RIGHT,
  SNAKE_COLORS,
} from "@/lib/snake-engine";
import type { SnakeGameState, Direction } from "@/lib/snake-engine";
import {
  quickPlaySnake,
  createPrivateSnakeRoom,
  joinPrivateSnakeRoom,
  SnakeChannel,
  cleanupSnakeRoom,
} from "@/lib/snake-net";
import type { SnakeRoomInfo, PresencePlayer } from "@/lib/snake-net";

type Screen =
  | "menu"
  | "searching"
  | "lobby"
  | "joining"
  | "playing"
  | "gameover"
  | "disconnected";

const NAME_KEY = "snake-arena-name";

function getStoredName(): string {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem(NAME_KEY) ||
    `Snake${Math.floor(Math.random() * 9000) + 1000}`
  );
}

export default function SnakeGame() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [lobbyPlayers, setLobbyPlayers] = useState<PresencePlayer[]>([]);
  const [isHost, setIsHost] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<SnakeGameState>(createSnakeGame());
  const channelRef = useRef<SnakeChannel | null>(null);
  const roomInfoRef = useRef<SnakeRoomInfo | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loopRef = useRef<number>(0);
  const playersInLobbyRef = useRef<PresencePlayer[]>([]);

  // Load stored name on mount
  useEffect(() => {
    setPlayerName(getStoredName());
  }, []);

  // Save name whenever it changes
  const handleNameChange = (name: string) => {
    setPlayerName(name);
    if (typeof window !== "undefined") {
      localStorage.setItem(NAME_KEY, name);
    }
  };

  // ── Keyboard input ─────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      let dir: Direction | null = null;
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          dir = DIR_UP;
          break;
        case "ArrowRight":
        case "d":
        case "D":
          dir = DIR_RIGHT;
          break;
        case "ArrowDown":
        case "s":
        case "S":
          dir = DIR_DOWN;
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          dir = DIR_LEFT;
          break;
      }

      if (dir === null) return;
      e.preventDefault();

      const info = roomInfoRef.current;
      if (!info) return;

      if (isHost) {
        // Host applies directly
        setPlayerDirection(gameStateRef.current, info.playerId, dir);
      } else {
        // Client sends to host
        setPlayerDirection(gameStateRef.current, info.playerId, dir);
        channelRef.current?.broadcastDirection(info.playerId, dir);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isHost]);

  // ── Touch / swipe controls ─────────────────────────────
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) < 20) return; // too small

      let dir: Direction;
      if (absDx > absDy) {
        dir = dx > 0 ? DIR_RIGHT : DIR_LEFT;
      } else {
        dir = dy > 0 ? DIR_DOWN : DIR_UP;
      }

      const info = roomInfoRef.current;
      if (!info) return;

      setPlayerDirection(gameStateRef.current, info.playerId, dir);
      if (!isHost) {
        channelRef.current?.broadcastDirection(info.playerId, dir);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isHost]);

  // ── Cleanup on unmount ─────────────────────────────────
  useEffect(() => {
    return () => {
      channelRef.current?.disconnect();
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, []);

  // ── Canvas resize ──────────────────────────────────────
  const getCanvasDimensions = useCallback(() => {
    const maxW = Math.min(window.innerWidth - 32, 800);
    const maxH = window.innerHeight - 200;
    const size = Math.min(maxW, maxH);
    return { w: size, h: size };
  }, []);

  // ── Start game loop (host only) ────────────────────────
  const startGameAsHost = useCallback(() => {
    const state = createSnakeGame();
    gameStateRef.current = state;

    // Add all lobby players
    for (const lp of playersInLobbyRef.current) {
      addPlayer(state, lp.playerId, lp.name);
    }

    // Game tick (host runs physics)
    tickIntervalRef.current = setInterval(() => {
      const gs = gameStateRef.current;
      tickGame(gs);

      // Broadcast state every tick
      channelRef.current?.broadcastGameState(serializeState(gs));

      if (gs.gameOver) {
        if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
        setScreen("gameover");
      }
    }, TICK_MS);

    // Render loop (60fps)
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        loopRef.current = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { w, h } = getCanvasDimensions();
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      renderSnakeGame(
        ctx,
        gameStateRef.current,
        roomInfoRef.current?.playerId || "",
        w,
        h
      );
      loopRef.current = requestAnimationFrame(render);
    };

    loopRef.current = requestAnimationFrame(render);
  }, [getCanvasDimensions]);

  // ── Start game loop (client only) ──────────────────────
  const startGameAsClient = useCallback(() => {
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        loopRef.current = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { w, h } = getCanvasDimensions();
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      renderSnakeGame(
        ctx,
        gameStateRef.current,
        roomInfoRef.current?.playerId || "",
        w,
        h
      );

      if (gameStateRef.current.gameOver) {
        setScreen("gameover");
      }

      loopRef.current = requestAnimationFrame(render);
    };

    loopRef.current = requestAnimationFrame(render);
  }, [getCanvasDimensions]);

  // ── Connect to room ────────────────────────────────────
  const connectToRoom = useCallback(
    (info: SnakeRoomInfo) => {
      roomInfoRef.current = info;
      setIsHost(info.isHost);

      const channel = new SnakeChannel(info.roomCode);
      channelRef.current = channel;

      // Presence sync — updates lobby player list
      channel.onPresenceSync = (players) => {
        playersInLobbyRef.current = players;
        setLobbyPlayers([...players]);
      };

      // Game state (clients receive from host)
      channel.onGameState = (serialized) => {
        // Only apply if we're not host
        if (!info.isHost) {
          gameStateRef.current = deserializeState(serialized);
        }
      };

      // Player input (host receives from clients)
      channel.onPlayerInput = (playerId, direction) => {
        if (info.isHost) {
          setPlayerDirection(gameStateRef.current, playerId, direction);
        }
      };

      // Game start signal
      channel.onGameStart = () => {
        if (!info.isHost) {
          setScreen("playing");
          startGameAsClient();
        }
      };

      // Player disconnect
      channel.onPlayerDisconnect = (playerId) => {
        if (info.isHost) {
          removePlayer(gameStateRef.current, playerId);
        }
      };

      channel.connect(info.playerId, playerName, info.isHost);

      // Go to lobby
      setScreen("lobby");
    },
    [playerName, startGameAsClient]
  );

  // ── Host starts the game ───────────────────────────────
  const handleStartGame = () => {
    if (!roomInfoRef.current) return;

    // Signal all clients
    channelRef.current?.broadcastGameStart();

    // Host starts
    setScreen("playing");
    startGameAsHost();
  };

  // ── Quick Play ─────────────────────────────────────────
  const handleQuickPlay = async () => {
    setError("");
    setScreen("searching");

    const info = await quickPlaySnake();
    if (!info) {
      setError("Could not connect. Try again.");
      setScreen("menu");
      return;
    }

    setRoomCode(info.roomCode);
    connectToRoom(info);
  };

  // ── Private Room ───────────────────────────────────────
  const handleCreateRoom = async () => {
    setError("");
    const info = await createPrivateSnakeRoom();
    if (!info) {
      setError("Could not create room.");
      return;
    }
    setRoomCode(info.roomCode);
    connectToRoom(info);
  };

  const handleJoinRoom = async () => {
    if (joinCode.length < 4) {
      setError("Enter a 4-character room code.");
      return;
    }
    setError("");
    setScreen("searching");

    const info = await joinPrivateSnakeRoom(joinCode);
    if (!info) {
      setError("Room not found.");
      setScreen("joining");
      return;
    }
    setRoomCode(info.roomCode);
    connectToRoom(info);
  };

  // ── Back to menu ───────────────────────────────────────
  const handleBackToMenu = useCallback(() => {
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    tickIntervalRef.current = null;
    channelRef.current?.disconnect();
    channelRef.current = null;
    roomInfoRef.current = null;
    playersInLobbyRef.current = [];
    setScreen("menu");
    setRoomCode("");
    setJoinCode("");
    setError("");
    setLobbyPlayers([]);
    setIsHost(false);
  }, []);

  // ── D-Pad button handler ───────────────────────────────
  const handleDPad = (dir: Direction) => {
    const info = roomInfoRef.current;
    if (!info) return;
    setPlayerDirection(gameStateRef.current, info.playerId, dir);
    if (!isHost) {
      channelRef.current?.broadcastDirection(info.playerId, dir);
    }
  };

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-6">
      {/* Menu */}
      {screen === "menu" && (
        <div className="text-center animate-[fade-up_0.4s_ease_forwards]">
          <h1 className="font-display text-5xl text-text-primary tracking-tight mb-2">
            Snake Arena
          </h1>
          <p className="text-text-muted text-base mb-6">
            Eat, grow, and devour other players. Most points in 3 minutes wins.
          </p>

          {/* Name input */}
          <div className="mb-8">
            <label className="text-text-dim text-xs block mb-1">Your name</label>
            <input
              type="text"
              maxLength={12}
              value={playerName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="bg-surface text-text-primary text-center text-lg font-semibold
                         border-2 border-border-light rounded-xl px-4 py-2 w-48
                         outline-none focus:border-green transition-colors"
            />
          </div>

          <div className="flex flex-col gap-3 items-center mb-8">
            <button
              onClick={handleQuickPlay}
              className="bg-gradient-to-br from-green to-emerald-600 text-white border-none
                         px-10 py-4 rounded-full text-lg font-bold cursor-pointer w-64
                         shadow-[0_4px_24px_rgba(34,197,94,0.3)]
                         hover:scale-105 hover:shadow-[0_6px_32px_rgba(34,197,94,0.5)]
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

          <div className="text-text-dim text-xs space-y-1">
            <p>Arrow keys or WASD to steer. Swipe on mobile.</p>
            <p>Eat food to grow. Crash into other snakes to eat them!</p>
          </div>

          {error && <p className="text-error text-sm mt-4">{error}</p>}
        </div>
      )}

      {/* Join Room Input */}
      {screen === "joining" && (
        <div className="text-center animate-[fade-up_0.4s_ease_forwards]">
          <h2 className="font-display text-3xl text-text-primary mb-6">
            Join Room
          </h2>
          <input
            type="text"
            maxLength={4}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="ABCD"
            className="bg-surface text-text-primary text-center text-2xl font-bold
                       border-2 border-border-light rounded-xl px-6 py-3 w-40
                       uppercase tracking-[0.3em] outline-none
                       focus:border-green transition-colors"
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
              className="bg-gradient-to-br from-green to-emerald-600 text-white border-none
                         rounded-full px-8 py-2.5 text-sm font-bold cursor-pointer
                         shadow-[0_4px_16px_rgba(34,197,94,0.3)]
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
          <div className="w-10 h-10 border-4 border-border-light border-t-green rounded-full animate-spin mx-auto mb-6" />
          <h2 className="font-display text-2xl text-text-primary mb-2">
            Finding a game...
          </h2>
          <p className="text-text-muted text-sm">
            This should only take a moment
          </p>
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

      {/* Lobby */}
      {screen === "lobby" && (
        <div className="text-center animate-[fade-up_0.4s_ease_forwards]">
          <h2 className="font-display text-3xl text-text-primary mb-2">
            Game Lobby
          </h2>

          {roomCode && (
            <div className="mt-2 mb-6">
              <p className="text-text-muted text-sm mb-1">Room code:</p>
              <div className="text-3xl font-bold text-green tracking-[0.3em]">
                {roomCode}
              </div>
              <p className="text-text-dim text-xs mt-1">
                Share this code with friends
              </p>
            </div>
          )}

          {/* Player list */}
          <div className="bg-surface border border-border-light rounded-xl p-4 w-72 mx-auto mb-6">
            <p className="text-text-dim text-xs uppercase tracking-wider mb-3">
              Players ({lobbyPlayers.length}/10)
            </p>
            <div className="space-y-2">
              {lobbyPlayers.map((p, i) => (
                <div
                  key={p.playerId}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-hover"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        SNAKE_COLORS[i % SNAKE_COLORS.length],
                    }}
                  />
                  <span className="text-text-primary text-sm font-medium flex-1 text-left">
                    {p.name}
                    {p.playerId === roomInfoRef.current?.playerId && (
                      <span className="text-text-dim text-xs ml-1">(you)</span>
                    )}
                  </span>
                  {p.isHost && (
                    <span className="text-amber text-xs font-semibold">
                      HOST
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={lobbyPlayers.length < 1}
              className="bg-gradient-to-br from-green to-emerald-600 text-white border-none
                         rounded-full px-10 py-3 text-base font-bold cursor-pointer
                         shadow-[0_4px_24px_rgba(34,197,94,0.3)]
                         hover:scale-105 hover:shadow-[0_6px_32px_rgba(34,197,94,0.5)]
                         transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100"
            >
              Start Game
            </button>
          ) : (
            <p className="text-text-muted text-sm">
              Waiting for host to start the game...
            </p>
          )}

          <button
            onClick={() => {
              channelRef.current?.disconnect();
              if (roomInfoRef.current) {
                cleanupSnakeRoom(roomInfoRef.current.roomCode);
              }
              handleBackToMenu();
            }}
            className="mt-4 bg-surface text-text-muted border-[1.5px] border-border-light
                       rounded-full px-6 py-2.5 text-sm font-semibold cursor-pointer
                       transition-all hover:bg-surface-hover hover:text-text-secondary"
          >
            Leave
          </button>
        </div>
      )}

      {/* Playing */}
      {screen === "playing" && (
        <div className="animate-[fade-up_0.3s_ease_forwards] flex flex-col items-center">
          <canvas
            ref={canvasRef}
            className="rounded-xl border-2 border-border max-w-full"
            style={{ touchAction: "none" }}
          />

          {/* Mobile D-Pad */}
          <div className="mt-4 md:hidden select-none">
            <div className="grid grid-cols-3 gap-1 w-36 mx-auto">
              <div />
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleDPad(DIR_UP);
                }}
                className="bg-surface border border-border-light rounded-lg p-3
                           text-text-muted text-xl active:bg-surface-hover"
              >
                &uarr;
              </button>
              <div />
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleDPad(DIR_LEFT);
                }}
                className="bg-surface border border-border-light rounded-lg p-3
                           text-text-muted text-xl active:bg-surface-hover"
              >
                &larr;
              </button>
              <div />
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleDPad(DIR_RIGHT);
                }}
                className="bg-surface border border-border-light rounded-lg p-3
                           text-text-muted text-xl active:bg-surface-hover"
              >
                &rarr;
              </button>
              <div />
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleDPad(DIR_DOWN);
                }}
                className="bg-surface border border-border-light rounded-lg p-3
                           text-text-muted text-xl active:bg-surface-hover"
              >
                &darr;
              </button>
              <div />
            </div>
          </div>

          <div className="flex justify-between items-center mt-3 px-1 w-full max-w-[800px]">
            <p className="text-text-dim text-xs">
              Arrow keys / WASD to steer &middot; Swipe on mobile
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

      {/* Game Over */}
      {screen === "gameover" && (
        <div className="text-center animate-[fade-up_0.4s_ease_forwards]">
          <h2 className="font-display text-4xl text-text-primary mb-6">
            Game Over!
          </h2>

          {/* Final rankings */}
          <div className="bg-surface border border-border-light rounded-xl p-5 w-80 mx-auto mb-8">
            <p className="text-text-dim text-xs uppercase tracking-wider mb-4">
              Final Rankings
            </p>
            <div className="space-y-2">
              {Object.values(gameStateRef.current.players)
                .sort((a, b) => b.score - a.score)
                .map((p, i) => {
                  const medal =
                    i === 0 ? "1st" : i === 1 ? "2nd" : i === 2 ? "3rd" : `#${i + 1}`;
                  const isLocal =
                    p.id === roomInfoRef.current?.playerId;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                        isLocal ? "bg-green/10 border border-green/30" : "bg-surface-hover"
                      }`}
                    >
                      <span className="text-text-dim text-xs w-6">{medal}</span>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            SNAKE_COLORS[p.colorIndex % SNAKE_COLORS.length],
                        }}
                      />
                      <span
                        className={`text-sm font-medium flex-1 text-left ${
                          isLocal ? "text-green" : "text-text-primary"
                        }`}
                      >
                        {isLocal ? "You" : p.name}
                      </span>
                      <span className="text-text-muted text-sm font-bold">
                        {p.score}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            {isHost && (
              <button
                onClick={() => {
                  // Restart game with same lobby
                  channelRef.current?.broadcastGameStart();
                  setScreen("playing");
                  startGameAsHost();
                }}
                className="bg-gradient-to-br from-green to-emerald-600 text-white border-none
                           rounded-full px-8 py-3 text-base font-bold cursor-pointer
                           shadow-[0_4px_16px_rgba(34,197,94,0.3)]
                           hover:scale-105 transition-all duration-200"
              >
                Play Again
              </button>
            )}
            <button
              onClick={handleBackToMenu}
              className="bg-surface text-text-muted border-[1.5px] border-border-light
                         rounded-full px-8 py-3 text-sm font-semibold cursor-pointer
                         transition-all hover:bg-surface-hover hover:text-text-secondary"
            >
              Back to Menu
            </button>
          </div>
        </div>
      )}

      {/* Disconnected */}
      {screen === "disconnected" && (
        <div className="text-center animate-[fade-up_0.4s_ease_forwards]">
          <h2 className="font-display text-2xl text-text-primary mb-2">
            Disconnected
          </h2>
          <p className="text-text-muted text-sm mb-6">
            Lost connection to the game.
          </p>
          <button
            onClick={handleBackToMenu}
            className="bg-gradient-to-br from-green to-emerald-600 text-white border-none
                       rounded-full px-8 py-3 text-base font-bold cursor-pointer
                       shadow-[0_4px_16px_rgba(34,197,94,0.3)]
                       hover:scale-105 transition-all duration-200"
          >
            Back to Menu
          </button>
        </div>
      )}
    </div>
  );
}
