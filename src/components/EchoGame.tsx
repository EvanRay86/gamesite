"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { EchoEngine } from "@/lib/echo/engine";
import { EchoRenderer } from "@/lib/echo/renderer";
import { CANVAS_W, CANVAS_H } from "@/types/echo";
import type { GamePhase, DifficultyTier, EchoMeta } from "@/types/echo";
import EchoResults from "@/components/EchoResults";

// ── Component ───────────────────────────────────────────────────────────────

export default function EchoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<EchoEngine | null>(null);
  const rendererRef = useRef<EchoRenderer | null>(null);

  const [phase, setPhase] = useState<GamePhase>("menu");
  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick((t: number) => t + 1), []);

  const [deathEchoNum, setDeathEchoNum] = useState(0);
  const [meta, setMeta] = useState<EchoMeta | null>(null);

  // Touch state for swipe detection
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // ── Initialize engine (once) ──────────────────────────────────────────

  useEffect(() => {
    const engine = new EchoEngine();
    engineRef.current = engine;

    engine.onStateChange = () => {
      setPhase(engine.state.phase);
      rerender();
    };

    engine.onDeath = (echoNumber: number) => {
      setDeathEchoNum(echoNumber);
      const renderer = rendererRef.current;
      if (renderer) {
        const { player } = engine.state;
        renderer.shakeScreen(6, 0.4);
        renderer.spawnBurst(
          player.x * 32 + 16,
          player.y * 32 + 16,
          "#ff4444",
          16,
        );
      }
    };

    engine.onVictory = () => {
      const renderer = rendererRef.current;
      if (renderer) {
        const { player } = engine.state;
        renderer.spawnBurst(
          player.x * 32 + 16,
          player.y * 32 + 16,
          "#44ff88",
          24,
        );
      }
      setMeta(engine.loadMeta());
    };

    setMeta(engine.loadMeta());
  }, [rerender]);

  // ── Initialize renderer (once, on canvas mount) ───────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new EchoRenderer(canvas);
    rendererRef.current = renderer;

    renderer.startLoop((dt) => {
      const engine = engineRef.current;
      if (!engine) return;

      const ph = engine.state.phase;
      if (ph === "playing" || ph === "dead" || ph === "victory") {
        renderer.render(engine.state, dt);
      }
    });

    return () => {
      renderer.stopLoop();
      rendererRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard handler ──────────────────────────────────────────────────

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      // Menu phase: ignore game keys
      if (engine.state.phase === "menu") return;

      // Dead phase: space to respawn
      if (engine.state.phase === "dead") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          engine.respawn();
        }
        return;
      }

      // Victory/gameover: ignore
      if (engine.state.phase !== "playing") return;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          engine.move("up");
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          engine.move("down");
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          engine.move("left");
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          engine.move("right");
          break;
        case " ":
          e.preventDefault();
          engine.move("wait");
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // ── Touch handlers ────────────────────────────────────────────────────

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const engine = engineRef.current;
    if (!engine || !touchStart.current) return;

    if (engine.state.phase === "dead") {
      engine.respawn();
      touchStart.current = null;
      return;
    }

    if (engine.state.phase !== "playing") {
      touchStart.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    const minSwipe = 20;

    if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) {
      engine.move("wait");
    } else if (Math.abs(dx) > Math.abs(dy)) {
      engine.move(dx > 0 ? "right" : "left");
    } else {
      engine.move(dy > 0 ? "down" : "up");
    }

    touchStart.current = null;
  }, []);

  // ── Action handlers ───────────────────────────────────────────────────

  const handleStartRun = useCallback((tier: DifficultyTier) => {
    engineRef.current?.newRun(tier);
  }, []);

  const handleDailyRun = useCallback(() => {
    engineRef.current?.newDailyRun();
  }, []);

  const handleBackToMenu = useCallback(() => {
    engineRef.current?.backToMenu();
    setMeta(engineRef.current?.loadMeta() ?? null);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────

  const engine = engineRef.current;
  const state = engine?.state;
  const showCanvas = phase === "playing" || phase === "dead" || phase === "victory";

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-8 max-w-[850px] mx-auto">
      {/* Title */}
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold tracking-tight">ECHO</h1>
        <p className="text-sm text-gray-400 mt-1">
          Death is a tool, not a punishment
        </p>
      </div>

      {/* Menu */}
      {phase === "menu" && (
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
          <p className="text-center text-sm text-gray-300 leading-relaxed">
            Clear the dungeon by cooperating with your past selves.
            Each time you die, your previous run replays as an echo.
            Reach the exit in as few echoes as possible.
          </p>

          <div className="grid grid-cols-2 gap-2 w-full">
            {([1, 2, 3, 4] as DifficultyTier[]).map((tier) => {
              const names: Record<number, string> = {
                1: "Easy",
                2: "Medium",
                3: "Hard",
                4: "Nightmare",
              };
              const colors: Record<number, string> = {
                1: "bg-green-700 hover:bg-green-600",
                2: "bg-amber-700 hover:bg-amber-600",
                3: "bg-red-700 hover:bg-red-600",
                4: "bg-purple-700 hover:bg-purple-600",
              };
              return (
                <button
                  key={tier}
                  onClick={() => handleStartRun(tier)}
                  className={`${colors[tier]} text-white font-bold py-3 px-4 rounded-lg transition-colors text-sm`}
                >
                  {names[tier]}
                  {meta?.bestEchoes[tier] !== undefined && (
                    <span className="block text-xs font-normal opacity-70">
                      Best: {meta.bestEchoes[tier]} echoes
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleDailyRun}
            className="w-full bg-teal-700 hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-lg transition-colors text-sm"
          >
            Daily Dungeon
            {meta?.dailyHistory[new Date().toISOString().slice(0, 10)] && (
              <span className="block text-xs font-normal opacity-70">
                Today: {meta.dailyHistory[new Date().toISOString().slice(0, 10)].echoes} echoes
              </span>
            )}
          </button>

          {meta && meta.totalRuns > 0 && (
            <div className="text-xs text-gray-500 text-center space-y-0.5">
              <p>Runs: {meta.totalRuns} | Cleared: {meta.dungeonCleared} | Echoes used: {meta.totalEchoesUsed}</p>
            </div>
          )}

          {/* Controls legend */}
          <div className="text-xs text-gray-500 text-center mt-2 space-y-0.5">
            <p>Arrow keys / WASD to move | Space to wait</p>
            <p>Swipe on mobile | Tap to wait</p>
          </div>
        </div>
      )}

      {/* Canvas — always mounted, hidden when not active */}
      <div className={`relative ${showCanvas ? "" : "hidden"}`}>
        <canvas
          ref={canvasRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="w-full rounded-xl border border-gray-700"
          style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}`, maxWidth: CANVAS_W }}
        />

        {/* Death overlay */}
        {phase === "dead" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl">
            <div className="text-center space-y-2">
              <p className="text-2xl font-bold text-red-400">You Died</p>
              <p className="text-lg text-cyan-300">
                Echo #{deathEchoNum} recorded
              </p>
              <p className="text-sm text-gray-300">
                Your ghost will replay from the start
              </p>
              <button
                onClick={() => engine?.respawn()}
                className="mt-4 bg-white text-black font-bold py-2 px-6 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Continue (Space)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Victory Results */}
      {phase === "victory" && state && (
        <EchoResults
          echoCount={state.echoCount}
          totalTurns={state.totalTurns}
          tier={state.tier}
          echoes={state.echoes}
          getShareText={() => engine!.getShareText()}
          onPlayAgain={handleBackToMenu}
        />
      )}

      {/* Game Over */}
      {phase === "gameover" && (
        <div className="text-center space-y-4">
          <p className="text-xl font-bold text-red-400">Too Many Echoes</p>
          <p className="text-sm text-gray-400">The dungeon has claimed you.</p>
          <button
            onClick={handleBackToMenu}
            className="bg-white text-black font-bold py-2 px-6 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Back to Menu
          </button>
        </div>
      )}
    </div>
  );
}
