"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { GamePhase, Projectile, Particle, AimState, LevelResult, SaveData, Vec2 } from "@/types/warp";
import {
  v2, DT, SUB_STEPS, MAX_POWER, TRAIL_LEN, PROJ_RADIUS,
  computeGravAccel, verletStep, checkCollisions, predictTrajectory,
  calcLaunchVelocity, calcScore, calcStars, createProjectile,
} from "@/lib/warp/physics";
import { levels } from "@/lib/warp/levels";
import {
  generateStarfield, drawBackground, drawGravBody, drawGravityField,
  drawProjectile, drawTarget, drawAimLine, drawLaunchPoint,
  drawParticles, drawSuccessRing, drawHUD,
  type Star,
} from "@/lib/warp/renderer";

const CW = 800, CH = 600;
const SAVE_KEY = "warp-progress";
const TIER_UNLOCK_THRESHOLD = 7; // stars needed to unlock next tier

// ── Save / Load ──────────────────────────────────────────────────────────────

function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { results: {} };
}

function writeSave(data: SaveData) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch {}
}

function getTierStars(save: SaveData, tierLevels: number[]): number {
  return tierLevels.reduce((sum, id) => sum + (save.results[id]?.stars ?? 0), 0);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function WarpGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Game state in refs (no re-renders during 60fps loop)
  const phaseRef = useRef<GamePhase>("menu");
  const levelIdRef = useRef(1);
  const projectileRef = useRef<Projectile | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const aimRef = useRef<AimState>({ dragging: false, start: v2.zero(), end: v2.zero(), power: 0, angle: 0 });
  const predictedRef = useRef<Vec2[]>([]);
  const shotsRef = useRef(0);
  const frameRef = useRef(0);
  const successFrameRef = useRef(0);
  const starsFieldRef = useRef<Star[]>([]);
  const rafRef = useRef(0);

  // React state for UI overlays
  const [displayPhase, setDisplayPhase] = useState<GamePhase>("menu");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [displayShots, setDisplayShots] = useState(0);
  const [displayStars, setDisplayStars] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [save, setSave] = useState<SaveData>({ results: {} });
  const [scale, setScale] = useState(1);

  // ── Level Loading ────────────────────────────────────────────────────────

  const loadLevel = useCallback((id: number) => {
    const level = levels.find(l => l.id === id);
    if (!level) return;
    levelIdRef.current = id;
    projectileRef.current = null;
    particlesRef.current = [];
    aimRef.current = { dragging: false, start: v2.zero(), end: v2.zero(), power: 0, angle: 0 };
    predictedRef.current = [];
    shotsRef.current = 0;
    frameRef.current = 0;
    successFrameRef.current = 0;
    starsFieldRef.current = generateStarfield(level.bounds.w, level.bounds.h);
    phaseRef.current = "aiming";
    setDisplayPhase("aiming");
    setCurrentLevel(id);
    setDisplayShots(0);
  }, []);

  // ── Init ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    setSave(loadSave());
  }, []);

  // ── Responsive Scaling ───────────────────────────────────────────────────

  useEffect(() => {
    const resize = () => {
      if (!wrapperRef.current) return;
      const pw = wrapperRef.current.parentElement?.clientWidth ?? CW;
      const s = Math.min(pw / CW, (window.innerHeight - 200) / CH, 1);
      setScale(s);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ── Particle Burst ───────────────────────────────────────────────────────

  const spawnParticles = useCallback((pos: Vec2, count: number, colors: string[]) => {
    const p: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 1 + Math.random() * 3;
      p.push({
        pos: { ...pos },
        vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        life: 40 + Math.random() * 30,
        maxLife: 70,
        color: colors[i % colors.length],
        size: 2 + Math.random() * 3,
      });
    }
    particlesRef.current = [...particlesRef.current, ...p];
  }, []);

  // ── Game Loop ────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function loop() {
      if (!ctx) return;
      const frame = frameRef.current++;
      const phase = phaseRef.current;
      const level = levels.find(l => l.id === levelIdRef.current);
      if (!level) { rafRef.current = requestAnimationFrame(loop); return; }

      // ── Physics ────────────────────────────────────────────────────────
      if (phase === "flying" && projectileRef.current) {
        const proj = projectileRef.current;
        const subDt = DT / SUB_STEPS;

        for (let s = 0; s < SUB_STEPS; s++) {
          verletStep(proj, level.bodies, subDt);
          const hit = checkCollisions(proj, level.bodies, level.target, level.bounds);

          if (hit === "target") {
            phaseRef.current = "success";
            successFrameRef.current = frame;
            const shots = shotsRef.current;
            const stars = calcStars(shots, level.par);
            const score = calcScore(shots, level.par);
            setDisplayPhase("success");
            setDisplayStars(stars);
            setDisplayScore(score);
            spawnParticles(level.target.pos, 30, ["#22C55E", "#4ECDC4", "#F7B731", "#FFFFFF"]);

            // Save best result
            const prev = save.results[level.id];
            if (!prev || stars > prev.stars || (stars === prev.stars && score > prev.score)) {
              const newSave = { ...save, results: { ...save.results, [level.id]: { shots, stars, score } } };
              setSave(newSave);
              writeSave(newSave);
            }
            break;
          }

          if (hit === "body" || hit === "oob") {
            proj.alive = false;
            phaseRef.current = "fail";
            setDisplayPhase("fail");
            if (hit === "body") {
              spawnParticles(proj.pos, 15, ["#FF6B6B", "#F7B731", "#FFFFFF"]);
            }
            break;
          }
        }

        // Update trail
        if (proj.alive) {
          proj.trail.push({ ...proj.pos });
          if (proj.trail.length > TRAIL_LEN) proj.trail.shift();
        }
      }

      // Update particles
      particlesRef.current = particlesRef.current
        .map(p => ({
          ...p,
          pos: { x: p.pos.x + p.vel.x, y: p.pos.y + p.vel.y },
          vel: { x: p.vel.x * 0.97, y: p.vel.y * 0.97 },
          life: p.life - 1,
        }))
        .filter(p => p.life > 0);

      // ── Rendering ──────────────────────────────────────────────────────
      drawBackground(ctx, CW, CH, starsFieldRef.current, frame);
      drawGravityField(ctx, level.bodies, frame);
      for (const b of level.bodies) drawGravBody(ctx, b, frame);
      drawTarget(ctx, level.target, frame);

      if (phase === "aiming") {
        drawLaunchPoint(ctx, level.launch.pos, frame);
        drawAimLine(ctx, level.launch.pos, aimRef.current, predictedRef.current);
      }

      if (projectileRef.current?.alive) {
        drawProjectile(ctx, projectileRef.current, frame);
      }

      drawParticles(ctx, particlesRef.current);

      if (phase === "success") {
        drawSuccessRing(ctx, level.target.pos, frame, successFrameRef.current);
      }

      drawHUD(ctx, CW, CH, level.name, level.id, shotsRef.current, level.par, phase);

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [save]);

  // ── Input Handling ───────────────────────────────────────────────────────

  const getCanvasPos = useCallback((e: React.PointerEvent): Vec2 => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CW / rect.width),
      y: (e.clientY - rect.top) * (CH / rect.height),
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (phaseRef.current !== "aiming") return;
    e.preventDefault();
    const pos = getCanvasPos(e);
    const level = levels.find(l => l.id === levelIdRef.current);
    if (!level) return;

    // Must click near launch point to start aiming
    if (v2.dist(pos, level.launch.pos) > 60) return;

    aimRef.current = {
      dragging: true,
      start: { ...level.launch.pos },
      end: pos,
      power: 0,
      angle: 0,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [getCanvasPos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!aimRef.current.dragging) return;
    e.preventDefault();
    const pos = getCanvasPos(e);
    const aim = aimRef.current;
    const level = levels.find(l => l.id === levelIdRef.current);
    if (!level) return;

    aim.end = pos;
    const dx = pos.x - aim.start.x;
    const dy = pos.y - aim.start.y;
    aim.angle = Math.atan2(dy, dx);
    aim.power = Math.min(v2.dist(pos, aim.start) / 20, MAX_POWER);

    // Predict trajectory
    if (aim.power > 0.5) {
      const vel = calcLaunchVelocity(aim);
      predictedRef.current = predictTrajectory(aim.start, vel, level.bodies);
    } else {
      predictedRef.current = [];
    }
  }, [getCanvasPos]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!aimRef.current.dragging) return;
    e.preventDefault();
    const aim = aimRef.current;
    aim.dragging = false;

    if (aim.power < 0.5) {
      predictedRef.current = [];
      return;
    }

    const level = levels.find(l => l.id === levelIdRef.current);
    if (!level) return;

    const vel = calcLaunchVelocity(aim);
    projectileRef.current = createProjectile(level.launch.pos, vel, level.bodies);
    shotsRef.current++;
    setDisplayShots(shotsRef.current);
    phaseRef.current = "flying";
    setDisplayPhase("flying");
    predictedRef.current = [];
  }, []);

  // ── Keyboard ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") {
        loadLevel(levelIdRef.current);
      }
      if (e.key === "Escape") {
        phaseRef.current = "levelSelect";
        setDisplayPhase("levelSelect");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loadLevel]);

  // ── Tier Unlock Logic ────────────────────────────────────────────────────

  const orbitIds = levels.filter(l => l.tier === "orbit").map(l => l.id);
  const nebulaIds = levels.filter(l => l.tier === "nebula").map(l => l.id);
  const orbitStars = getTierStars(save, orbitIds);
  const nebulaStars = getTierStars(save, nebulaIds);
  const nebulaUnlocked = orbitStars >= TIER_UNLOCK_THRESHOLD;
  const voidUnlocked = nebulaStars >= TIER_UNLOCK_THRESHOLD;

  const isLevelUnlocked = (id: number): boolean => {
    const level = levels.find(l => l.id === id);
    if (!level) return false;
    if (level.tier === "orbit") return true;
    if (level.tier === "nebula") return nebulaUnlocked;
    if (level.tier === "void") return voidUnlocked;
    return false;
  };

  // ── Retry (relaunch from same level, keep shot count) ────────────────────

  const retry = useCallback(() => {
    const level = levels.find(l => l.id === levelIdRef.current);
    if (!level) return;
    projectileRef.current = null;
    particlesRef.current = [];
    aimRef.current = { dragging: false, start: v2.zero(), end: v2.zero(), power: 0, angle: 0 };
    predictedRef.current = [];
    phaseRef.current = "aiming";
    setDisplayPhase("aiming");
  }, []);

  const nextLevel = useCallback(() => {
    const next = levelIdRef.current + 1;
    if (next > levels.length) {
      phaseRef.current = "levelSelect";
      setDisplayPhase("levelSelect");
      return;
    }
    if (isLevelUnlocked(next)) {
      loadLevel(next);
    } else {
      phaseRef.current = "levelSelect";
      setDisplayPhase("levelSelect");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadLevel, nebulaUnlocked, voidUnlocked]);

  // ── Render ───────────────────────────────────────────────────────────────

  const tierLabel = (tier: string) =>
    tier === "orbit" ? "ORBIT" : tier === "nebula" ? "NEBULA" : "VOID";

  const tierColor = (tier: string) =>
    tier === "orbit" ? "#4ECDC4" : tier === "nebula" ? "#A855F7" : "#FF6B6B";

  const starIcons = (count: number, max = 3) =>
    Array.from({ length: max }, (_, i) => (
      <span key={i} className={i < count ? "text-amber-400" : "text-white/20"}>
        ★
      </span>
    ));

  return (
    <div className="flex flex-col items-center gap-4 py-6 px-4">
      {/* Title */}
      <h1 className="text-3xl font-bold tracking-wider text-white/90" style={{ fontFamily: "'Space Grotesk', monospace" }}>
        WARP
      </h1>

      {/* Canvas Wrapper */}
      <div
        ref={wrapperRef}
        className="relative rounded-xl overflow-hidden border border-white/10"
        style={{ width: CW * scale, height: CH * scale, touchAction: "none" }}
      >
        <canvas
          ref={canvasRef}
          width={CW}
          height={CH}
          style={{ width: CW * scale, height: CH * scale, display: "block" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />

        {/* ── Level Select Overlay ──────────────────────────────────────── */}
        {(displayPhase === "menu" || displayPhase === "levelSelect") && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-[#0E0E1A] border border-white/10 rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90%] overflow-y-auto">
              <h2 className="text-xl font-bold text-white/90 text-center mb-4" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                Select Level
              </h2>

              {(["orbit", "nebula", "void"] as const).map(tier => {
                const tierLevels = levels.filter(l => l.tier === tier);
                const unlocked = tier === "orbit" || (tier === "nebula" && nebulaUnlocked) || (tier === "void" && voidUnlocked);
                const starsNeeded = tier === "nebula" ? TIER_UNLOCK_THRESHOLD - orbitStars : tier === "void" ? TIER_UNLOCK_THRESHOLD - nebulaStars : 0;

                return (
                  <div key={tier} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold tracking-widest" style={{ color: tierColor(tier) }}>
                        {tierLabel(tier)}
                      </span>
                      {!unlocked && (
                        <span className="text-xs text-white/30">
                          ({starsNeeded} more ★ needed)
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {tierLevels.map(l => {
                        const locked = !unlocked;
                        const result = save.results[l.id];
                        return (
                          <button
                            key={l.id}
                            disabled={locked}
                            onClick={() => { loadLevel(l.id); }}
                            className={`
                              relative p-2 rounded-lg text-center transition-all
                              ${locked
                                ? "bg-white/5 text-white/20 cursor-not-allowed"
                                : "bg-white/10 hover:bg-white/20 text-white/80 cursor-pointer"
                              }
                            `}
                          >
                            <div className="text-sm font-bold">{l.id}</div>
                            <div className="text-[10px] leading-tight text-white/40 truncate">{l.name}</div>
                            {result && (
                              <div className="text-xs mt-0.5">{starIcons(result.stars)}</div>
                            )}
                            {locked && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white/20 text-lg">🔒</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Success Overlay ──────────────────────────────────────────── */}
        {displayPhase === "success" && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-[#0E0E1A] border border-green-500/30 rounded-2xl p-6 text-center min-w-[260px]">
              <div className="text-2xl mb-1">{starIcons(displayStars)}</div>
              <div className="text-lg font-bold text-green-400 mb-1">Level Complete!</div>
              <div className="text-sm text-white/60 mb-1">
                Shots: {displayShots} | Par: {levels.find(l => l.id === currentLevel)?.par}
              </div>
              <div className="text-sm text-white/40 mb-4">
                Score: {displayScore}
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => loadLevel(currentLevel)}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-sm transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={nextLevel}
                  className="px-4 py-2 rounded-lg bg-green-600/80 hover:bg-green-600 text-white text-sm font-bold transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Fail Overlay ────────────────────────────────────────────── */}
        {displayPhase === "fail" && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-[#0E0E1A] border border-red-500/30 rounded-2xl p-6 text-center min-w-[240px]">
              <div className="text-lg font-bold text-red-400 mb-2">Shot Lost!</div>
              <div className="text-sm text-white/50 mb-4">Shots used: {displayShots}</div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { phaseRef.current = "levelSelect"; setDisplayPhase("levelSelect"); }}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-sm transition-colors"
                >
                  Levels
                </button>
                <button
                  onClick={retry}
                  className="px-4 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-sm font-bold transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls hint */}
      {displayPhase === "aiming" && (
        <div className="text-xs text-white/30 flex gap-4">
          <span><kbd className="px-1 py-0.5 bg-white/10 rounded text-[10px]">R</kbd> Reset</span>
          <span><kbd className="px-1 py-0.5 bg-white/10 rounded text-[10px]">Esc</kbd> Levels</span>
        </div>
      )}
    </div>
  );
}
