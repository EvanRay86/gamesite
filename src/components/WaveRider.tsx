"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  decodeAndAnalyze,
  type WaveRiderAudioData,
} from "@/lib/wave-rider/audio-analysis";
import {
  generateTerrainPoints,
  getWorldWidth,
  placeObstacles,
  placeCollectibles,
  type TerrainPoint,
  type Obstacle,
  type Collectible,
} from "@/lib/wave-rider/terrain";

// ── Types ────────────────────────────────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface ScorePopup {
  x: number;
  y: number;
  vy: number;
  text: string;
  life: number;
  maxLife: number;
  color: string;
}

interface Star {
  x: number; // 0-1 across the world field
  y: number; // canvas-space y (sky region)
  r: number;
  phase: number;
  bright: number;
}

type GameScreen = "menu" | "analyzing" | "playing" | "paused" | "gameover";

// ── Constants ────────────────────────────────────────────────────────────────

const CANVAS_W = 800;
const CANVAS_H = 400;
const GRAVITY = 0.38;
const JUMP_FORCE = -9.5;
const PLAYER_SIZE = 12;
const MAX_LIVES = 5;
const INVINCIBLE_FRAMES = 120;
const SAVE_KEY = "wave-rider-best";
const HIT_SHRINK = 4; // pixels to shrink collision box (forgiving hitbox)
const JUMP_BUFFER_FRAMES = 8; // taps land even if pressed slightly early
const COYOTE_FRAMES = 6; // brief grace to jump just after leaving the ground

// Synthwave palette
const BG_TOP = "#070418";
const BG_MID = "#1b0b3a";
const BG_BOT = "#3a1d63";
const NEON_CYAN = "#00f5d4";
const NEON_PINK = "#ff006e";
const NEON_PURPLE = "#9b5de5";
const NEON_AMBER = "#f7b731";
const NEON_RED = "#ff4444";

const PI2 = Math.PI * 2;
// Terrain occupies this vertical band (mirrors the ratios in terrain.ts).
const TERR_MIN_Y = CANVAS_H * 0.3; // highest the surface ever rises
const TERR_MAX_Y = CANVAS_H * 0.82; // lowest the surface ever sits
const HORIZON_Y = CANVAS_H * 0.52;
const SUN_X = CANVAS_W * 0.74;
const SUN_Y = CANVAS_H * 0.4;
const SUN_R = 92;

// ── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** Get terrain height at a given world-X by interpolating between points. */
function getTerrainHeightAt(terrain: TerrainPoint[], worldX: number): number {
  if (terrain.length === 0) return CANVAS_H * 0.7;
  const segW = terrain.length > 1 ? terrain[1].x - terrain[0].x : 6;
  const idx = worldX / segW;
  const i = Math.floor(idx);
  const t = idx - i;
  const a = terrain[clamp(i, 0, terrain.length - 1)];
  const b = terrain[clamp(i + 1, 0, terrain.length - 1)];
  return a.height * (1 - t) + b.height * t;
}

/** Tiny deterministic PRNG so the starfield is stable across frames. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeStars(n: number): Star[] {
  const rnd = mulberry32(20240531);
  const out: Star[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      x: rnd(),
      y: rnd() * HORIZON_Y * 0.95,
      r: 0.5 + rnd() * 1.7,
      phase: rnd() * PI2,
      bright: 0.5 + rnd() * 0.5,
    });
  }
  return out;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w <= 0) return;
  const rr = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Classic synthwave sun: warm radial core with horizontal slats, glowing on beats. */
function drawSun(
  ctx: CanvasRenderingContext2D,
  bgGrad: CanvasGradient,
  energy: number,
  beat: number
) {
  ctx.save();
  ctx.shadowBlur = 26 + energy * 34 + beat * 44;
  ctx.shadowColor = NEON_PINK;
  const g = ctx.createRadialGradient(SUN_X, SUN_Y, 4, SUN_X, SUN_Y, SUN_R);
  g.addColorStop(0, "#ffe79e");
  g.addColorStop(0.4, "#ff9e5e");
  g.addColorStop(0.74, "#ff4d8d");
  g.addColorStop(1, "rgba(155, 93, 229, 0.12)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(SUN_X, SUN_Y, SUN_R, 0, PI2);
  ctx.fill();
  ctx.restore();

  // Slats: paint the background gradient back over the lower half in widening bands.
  ctx.save();
  ctx.fillStyle = bgGrad;
  let y = SUN_Y + 6;
  let gap = 1.5;
  const thickness = 2.5;
  while (y < SUN_Y + SUN_R) {
    ctx.fillRect(SUN_X - SUN_R - 2, y, SUN_R * 2 + 4, gap);
    y += gap + thickness;
    gap *= 1.34;
  }
  ctx.restore();
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  scrollX: number,
  frame: number
) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  for (const s of stars) {
    const sx = (((s.x * CANVAS_W - scrollX * 0.05) % CANVAS_W) + CANVAS_W) % CANVAS_W;
    ctx.globalAlpha =
      (0.25 + 0.75 * Math.abs(Math.sin(frame * 0.02 + s.phase))) * s.bright;
    ctx.beginPath();
    ctx.arc(sx, s.y, s.r, 0, PI2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawMountains(ctx: CanvasRenderingContext2D, scrollX: number) {
  const ridge = (
    color: string,
    parallax: number,
    amp: number,
    base: number,
    f1: number,
    f2: number
  ) => {
    const off = scrollX * parallax;
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_H);
    for (let x = 0; x <= CANVAS_W; x += 6) {
      const y =
        HORIZON_Y +
        base -
        (Math.sin((x + off) * f1) * amp + Math.sin((x + off) * f2 + 1.3) * amp * 0.5);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(CANVAS_W, CANVAS_H);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  ridge("#2a1550", 0.12, 18, 16, 0.01, 0.027);
  ridge("#190a36", 0.22, 30, 2, 0.013, 0.031);
}

/** A little surfer on a glowing board, tilted with motion. */
function drawSurfer(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  tilt: number,
  stoked: boolean,
  hue: number
) {
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(tilt);

  // Board
  ctx.save();
  ctx.shadowBlur = 12;
  ctx.shadowColor = NEON_CYAN;
  ctx.fillStyle = NEON_CYAN;
  ctx.beginPath();
  ctx.ellipse(0, PLAYER_SIZE * 0.62, PLAYER_SIZE + 6, 3.4, 0, 0, PI2);
  ctx.fill();
  // nose flick
  ctx.beginPath();
  ctx.moveTo(PLAYER_SIZE + 5, PLAYER_SIZE * 0.62);
  ctx.lineTo(PLAYER_SIZE + 12, PLAYER_SIZE * 0.62 - 3);
  ctx.lineTo(PLAYER_SIZE + 5, PLAYER_SIZE * 0.62 - 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Rider
  const rc = stoked ? `hsl(${hue}, 90%, 66%)` : NEON_PINK;
  ctx.save();
  ctx.shadowBlur = 14;
  ctx.shadowColor = rc;
  ctx.fillStyle = rc;
  ctx.beginPath();
  ctx.moveTo(-4, PLAYER_SIZE * 0.45);
  ctx.lineTo(4, PLAYER_SIZE * 0.45);
  ctx.lineTo(1.6, -PLAYER_SIZE * 0.5);
  ctx.lineTo(-1.6, -PLAYER_SIZE * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -PLAYER_SIZE * 0.64, 3.1, 0, PI2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

// ── Component ────────────────────────────────────────────────────────────────

export default function WaveRider() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [screen, setScreen] = useState<GameScreen>("menu");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [analyzeProgress, setAnalyzeProgress] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [songName, setSongName] = useState("");

  // Refs for game loop (avoid re-renders in hot path)
  const screenRef = useRef(screen);
  const scoreRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);
  const animRef = useRef(0);
  const frameRef = useRef(0);

  // Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioStartTimeRef = useRef(0);

  // Game world refs
  const terrainRef = useRef<TerrainPoint[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const collectiblesRef = useRef<Collectible[]>([]);
  const worldWidthRef = useRef(0);
  const audioDataRef = useRef<WaveRiderAudioData | null>(null);

  // Player refs
  const playerRef = useRef({ x: 150, y: 200, vy: 0, isJumping: false });
  const invincibleRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const comboRef = useRef(0);

  // Feel + juice refs
  const jumpBufferRef = useRef(0);
  const coyoteRef = useRef(0);
  const historyRef = useRef<number[]>([]); // recent player-y for the wake ribbon
  const popupsRef = useRef<ScorePopup[]>([]);
  const shakeRef = useRef(0);
  const hitFlashRef = useRef(0);

  // Music-reactive visual refs
  const energyRef = useRef(0);
  const beatPulseRef = useRef(0);
  const beatXsRef = useRef<number[]>([]);
  const beatPtrRef = useRef(0);
  const starsRef = useRef<Star[]>([]);

  // Load best
  useEffect(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  // ── Audio playback helpers ───────────────────────────────────────────────

  const stopAudio = useCallback(() => {
    try { sourceNodeRef.current?.stop(); } catch { /* ignore */ }
    try { audioCtxRef.current?.close(); } catch { /* ignore */ }
    sourceNodeRef.current = null;
    audioCtxRef.current = null;
  }, []);

  const playFileAudio = useCallback(async () => {
    if (!audioBufferRef.current) return;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    // After the async decode chain the user-gesture activation may have lapsed,
    // leaving the context suspended — its clock wouldn't advance and the world
    // would never scroll. Resume before starting so progress tracks correctly.
    if (ctx.state === "suspended") {
      try { await ctx.resume(); } catch { /* ignore */ }
    }
    const source = ctx.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(ctx.destination);
    source.onended = () => {
      if (screenRef.current === "playing") {
        // Inline stop to avoid calling stopAudio on already-ended source
        try { audioCtxRef.current?.close(); } catch { /* ignore */ }
        sourceNodeRef.current = null;
        audioCtxRef.current = null;
        const final = scoreRef.current;
        const best = parseInt(localStorage.getItem(SAVE_KEY) || "0", 10);
        if (final > best) {
          localStorage.setItem(SAVE_KEY, String(final));
        }
        setScore(final);
        setBestScore(Math.max(final, best));
        setScreen("gameover");
      }
    };
    source.start();
    audioStartTimeRef.current = ctx.currentTime;
    sourceNodeRef.current = source;
  }, []);

  const getProgress = useCallback((): number => {
    if (audioCtxRef.current && audioDataRef.current) {
      const elapsed = audioCtxRef.current.currentTime - audioStartTimeRef.current;
      return clamp(elapsed / audioDataRef.current.duration, 0, 1);
    }
    return 0;
  }, []);

  // ── Analyze + Start ──────────────────────────────────────────────────────

  const handleFileUpload = useCallback(async (file: File) => {
    setScreen("analyzing");
    setErrorMsg("");
    setAnalyzeProgress("Decoding audio...");
    setSongName(file.name.replace(/\.[^.]+$/, ""));

    try {
      const data = await decodeAndAnalyze(file);

      // Keep the audio buffer for playback (returned by decodeAndAnalyze)
      audioBufferRef.current = data.audioBuffer ?? null;

      setAnalyzeProgress("Generating terrain...");
      audioDataRef.current = data;

      const terrain = generateTerrainPoints(data, CANVAS_H);
      const obstacles = placeObstacles(terrain);
      terrainRef.current = terrain;
      obstaclesRef.current = obstacles;
      collectiblesRef.current = placeCollectibles(terrain, obstacles, CANVAS_H);
      worldWidthRef.current = getWorldWidth(data);

      startGame();
    } catch (err) {
      setErrorMsg("Could not decode audio file. Try a different MP3 or WAV.");
      setScreen("menu");
      console.error(err);
    }
  }, []);

  // ── Game lifecycle ─────────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    scoreRef.current = 0;
    livesRef.current = MAX_LIVES;
    comboRef.current = 0;
    invincibleRef.current = 0;
    frameRef.current = 0;
    particlesRef.current = [];
    popupsRef.current = [];
    historyRef.current = [];
    shakeRef.current = 0;
    hitFlashRef.current = 0;
    energyRef.current = 0;
    beatPulseRef.current = 0;
    beatPtrRef.current = 0;
    jumpBufferRef.current = 0;
    coyoteRef.current = 0;

    // Precompute beat world-X positions for music-synced visual pulses.
    const bx: number[] = [];
    for (const pt of terrainRef.current) if (pt.isBeat) bx.push(pt.x);
    beatXsRef.current = bx;

    if (starsRef.current.length === 0) starsRef.current = makeStars(64);

    // Snap player to terrain height at start position
    const startTerrainY = getTerrainHeightAt(terrainRef.current, 150);
    playerRef.current = { x: 150, y: startTerrainY - PLAYER_SIZE, vy: 0, isJumping: false };

    // Reset obstacles/collectibles
    for (const o of obstaclesRef.current) o.hit = false;
    for (const c of collectiblesRef.current) c.collected = false;

    setScore(0);
    setLives(MAX_LIVES);
    setScreen("playing");

    // Start audio (Web Audio playback drives world scroll via getProgress)
    void playFileAudio();
  }, [playFileAudio]);

  const endGame = useCallback(() => {
    stopAudio();
    const final = scoreRef.current;
    setScore(final);
    if (final > bestScore) {
      setBestScore(final);
      localStorage.setItem(SAVE_KEY, String(final));
    }
    setScreen("gameover");
  }, [bestScore, stopAudio]);

  // ── Input ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (!e.repeat) jumpBufferRef.current = JUMP_BUFFER_FRAMES;
      }
      if (e.code === "Escape" && screenRef.current === "playing") {
        stopAudio();
        setScreen("gameover");
      }
    };
    window.addEventListener("keydown", onDown);
    return () => {
      window.removeEventListener("keydown", onDown);
    };
  }, [stopAudio]);

  // Touch controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onTouch = (e: TouchEvent) => {
      e.preventDefault();
      jumpBufferRef.current = JUMP_BUFFER_FRAMES;
    };
    canvas.addEventListener("touchstart", onTouch, { passive: false });
    return () => canvas.removeEventListener("touchstart", onTouch);
  }, [screen]);

  // ── Particle helper ────────────────────────────────────────────────────────

  const spawnParticles = useCallback(
    (x: number, y: number, color: string, count: number, speed = 3) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const s = 0.5 + Math.random() * speed;
        particlesRef.current.push({
          x, y,
          vx: Math.cos(angle) * s,
          vy: Math.sin(angle) * s,
          life: 20 + Math.random() * 25,
          maxLife: 45,
          color,
          size: 1.5 + Math.random() * 3,
        });
      }
      // Cap particles
      if (particlesRef.current.length > 180) {
        particlesRef.current = particlesRef.current.slice(-120);
      }
    }, []
  );

  // ── Game loop ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (screen !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const loop = () => {
      if (screenRef.current !== "playing") return;
      frameRef.current++;
      const frame = frameRef.current;
      const hue = (frame * 5) % 360;

      // ── Progress & scroll ──
      const progress = getProgress();
      const worldW = worldWidthRef.current;
      const scrollX = progress * worldW;
      const terrain = terrainRef.current;
      const player = playerRef.current;

      // ── Player physics (with jump buffering + coyote time) ──
      const terrainY = getTerrainHeightAt(terrain, scrollX + player.x);
      const landingY = terrainY - PLAYER_SIZE;

      if (!player.isJumping) {
        coyoteRef.current = COYOTE_FRAMES;
      } else if (coyoteRef.current > 0) {
        coyoteRef.current--;
      }

      if (
        jumpBufferRef.current > 0 &&
        (!player.isJumping || coyoteRef.current > 0)
      ) {
        player.vy = JUMP_FORCE;
        player.isJumping = true;
        coyoteRef.current = 0;
        jumpBufferRef.current = 0;
        spawnParticles(player.x - 4, player.y + PLAYER_SIZE * 0.5, NEON_CYAN, 6, 2.6);
      }
      if (jumpBufferRef.current > 0) jumpBufferRef.current--;

      if (player.isJumping) {
        // In air — apply gravity
        player.vy += GRAVITY;
        player.y += player.vy;

        // Land on terrain
        if (player.y >= landingY) {
          player.y = landingY;
          player.vy = 0;
          player.isJumping = false;
          spawnParticles(player.x, landingY + PLAYER_SIZE * 0.5, "#bffff2", 7, 2.2);
        }
      } else {
        // On terrain — smoothly follow the surface (lerp to avoid jarring snaps)
        const diff = landingY - player.y;
        if (Math.abs(diff) < 2) {
          player.y = landingY;
        } else {
          player.y += diff * 0.3;
        }
        player.vy = 0;
      }

      // Clamp to canvas
      player.y = clamp(player.y, 10, CANVAS_H - PLAYER_SIZE);

      // Record the wake ribbon trail
      const hist = historyRef.current;
      hist.unshift(player.y);
      if (hist.length > 28) hist.pop();

      // Surfer tilt: from vertical speed in the air, from slope on the ground
      let tilt: number;
      if (player.isJumping) {
        tilt = clamp(player.vy * 0.045, -0.5, 0.7);
      } else {
        const hA = getTerrainHeightAt(terrain, scrollX + player.x - 12);
        const hB = getTerrainHeightAt(terrain, scrollX + player.x + 12);
        tilt = Math.atan2(hB - hA, 24);
      }

      // Invincibility countdown
      if (invincibleRef.current > 0) invincibleRef.current--;

      // ── Music-reactive energy + beat pulse ──
      const frontX = scrollX + CANVAS_W * 0.55;
      const fY = getTerrainHeightAt(terrain, frontX);
      const eTarget = clamp((TERR_MAX_Y - fY) / (TERR_MAX_Y - TERR_MIN_Y), 0, 1);
      energyRef.current += (eTarget - energyRef.current) * 0.15;
      const energy = energyRef.current;

      const bxs = beatXsRef.current;
      let bp = beatPtrRef.current;
      while (bp < bxs.length && bxs[bp] <= frontX) {
        beatPulseRef.current = 1;
        bp++;
      }
      beatPtrRef.current = bp;
      beatPulseRef.current *= 0.9;
      const beat = beatPulseRef.current;

      const stoked = comboRef.current >= 8;

      // ── Collision detection ──
      const playerWorldX = scrollX + player.x;

      // Obstacles — forgiving hitbox (shrunk by HIT_SHRINK on each side)
      for (const obs of obstaclesRef.current) {
        if (obs.hit) continue;
        const hs = HIT_SHRINK;
        if (
          obs.x + hs < playerWorldX + PLAYER_SIZE - hs &&
          obs.x + obs.width - hs > playerWorldX - PLAYER_SIZE + hs &&
          obs.y + hs < player.y + PLAYER_SIZE - hs &&
          obs.y + obs.height - hs > player.y - PLAYER_SIZE + hs
        ) {
          if (invincibleRef.current <= 0) {
            obs.hit = true;
            livesRef.current--;
            comboRef.current = 0;
            invincibleRef.current = INVINCIBLE_FRAMES;
            setLives(livesRef.current);
            spawnParticles(player.x, player.y, NEON_RED, 14, 4);
            shakeRef.current = 9;
            hitFlashRef.current = 1;
            popupsRef.current.push({
              x: player.x, y: player.y - 14, vy: -0.7,
              text: "−1", life: 45, maxLife: 45, color: NEON_RED,
            });
            if (livesRef.current <= 0) {
              endGame();
              return;
            }
          }
        }
      }

      // Collectibles
      for (const col of collectiblesRef.current) {
        if (col.collected) continue;
        const dx = col.x - playerWorldX;
        const dy = col.y - player.y;
        if (Math.abs(dx) < 22 && Math.abs(dy) < 22) {
          col.collected = true;
          comboRef.current++;
          const multiplier = 1 + Math.floor(comboRef.current / 5) * 0.5;
          const pts = Math.round(10 * multiplier);
          scoreRef.current += pts;
          setScore(scoreRef.current);
          const nowStoked = comboRef.current >= 8;
          spawnParticles(
            col.x - scrollX,
            col.y,
            nowStoked ? `hsl(${hue}, 90%, 60%)` : NEON_AMBER,
            10,
            2.6
          );
          popupsRef.current.push({
            x: col.x - scrollX, y: col.y - 8, vy: -0.85,
            text: `+${pts}`, life: 50, maxLife: 50,
            color: nowStoked ? "#ff8ad1" : NEON_AMBER,
          });
        }
      }

      // Time-based score
      if (frame % 60 === 0) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
      }

      // Update particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.life--;
        return p.life > 0;
      });

      // ── Render ──

      const shake = shakeRef.current;
      const shX = shake > 0.1 ? Math.sin(frame * 1.7) * shake : 0;
      const shY = shake > 0.1 ? Math.cos(frame * 2.3) * shake : 0;
      shakeRef.current *= 0.85;

      ctx.save();
      ctx.translate(shX, shY);

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      bgGrad.addColorStop(0, BG_TOP);
      bgGrad.addColorStop(0.55, BG_MID);
      bgGrad.addColorStop(1, BG_BOT);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(-24, -24, CANVAS_W + 48, CANVAS_H + 48);

      // Sky: sun, stars, distant ridges
      drawSun(ctx, bgGrad, energy, beat);
      drawStars(ctx, starsRef.current, scrollX, frame);
      drawMountains(ctx, scrollX);

      // Grid lines (synthwave floor effect) — brightens with energy + beats
      const gridAlpha = 0.08 + energy * 0.12 + beat * 0.18;
      ctx.strokeStyle = `rgba(155, 93, 229, ${gridAlpha})`;
      ctx.lineWidth = 1;
      for (let gy = CANVAS_H * 0.45; gy < CANVAS_H; gy += 26) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(CANVAS_W, gy);
        ctx.stroke();
      }
      // Vertical grid lines (perspective fan toward a vanishing point)
      const vpX = CANVAS_W / 2;
      const gridOffset = (scrollX * 0.3) % 60;
      for (let gx = -gridOffset; gx < CANVAS_W + 60; gx += 60) {
        ctx.beginPath();
        ctx.moveTo(vpX + (gx - vpX) * 0.35, CANVAS_H * 0.45);
        ctx.lineTo(gx, CANVAS_H);
        ctx.stroke();
      }

      // Terrain
      ctx.save();
      ctx.beginPath();
      const segW = terrain.length > 1 ? terrain[1].x - terrain[0].x : 6;
      const viewStart = Math.max(0, Math.floor(scrollX / segW) - 2);
      const viewEnd = Math.min(terrain.length - 1, viewStart + Math.ceil(CANVAS_W / segW) + 4);

      if (terrain.length > 0) {
        ctx.moveTo(terrain[viewStart].x - scrollX, CANVAS_H);
        for (let i = viewStart; i <= viewEnd; i++) {
          ctx.lineTo(terrain[i].x - scrollX, terrain[i].height);
        }
        ctx.lineTo(terrain[viewEnd].x - scrollX, CANVAS_H);
        ctx.closePath();

        // Gradient fill
        const terrGrad = ctx.createLinearGradient(0, CANVAS_H * 0.2, 0, CANVAS_H);
        terrGrad.addColorStop(0, "rgba(0, 245, 212, 0.55)");
        terrGrad.addColorStop(0.5, "rgba(155, 93, 229, 0.4)");
        terrGrad.addColorStop(1, "rgba(255, 0, 110, 0.12)");
        ctx.fillStyle = terrGrad;
        ctx.fill();

        // Glowing top edge — punchier on the beat
        ctx.beginPath();
        for (let i = viewStart; i <= viewEnd; i++) {
          const sx = terrain[i].x - scrollX;
          if (i === viewStart) ctx.moveTo(sx, terrain[i].height);
          else ctx.lineTo(sx, terrain[i].height);
        }
        ctx.shadowBlur = 12 + beat * 16;
        ctx.shadowColor = NEON_CYAN;
        ctx.strokeStyle = beat > 0.4 ? "#ccfff7" : NEON_CYAN;
        ctx.lineWidth = 2 + beat * 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Foam sparkles on beat peaks
        for (let i = viewStart; i <= viewEnd; i++) {
          if (!terrain[i].isBeat) continue;
          const sx = terrain[i].x - scrollX;
          ctx.save();
          ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(frame * 0.1 + i));
          ctx.fillStyle = "#ccfff7";
          ctx.beginPath();
          ctx.arc(sx, terrain[i].height, 1.6, 0, PI2);
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.restore();

      // Obstacles — menacing neon crystals
      for (const obs of obstaclesRef.current) {
        const ox = obs.x - scrollX;
        if (ox < -30 || ox > CANVAS_W + 30) continue;
        if (obs.hit) continue;

        const bob = Math.sin(frame * 0.06 + obs.x * 0.05) * 2;
        const cx = ox + obs.width / 2;
        const cy = obs.y + obs.height / 2 + bob;
        ctx.save();
        ctx.shadowBlur = 10 + beat * 10;
        ctx.shadowColor = NEON_RED;
        const og = ctx.createLinearGradient(cx, cy - obs.height / 2, cx, cy + obs.height / 2);
        og.addColorStop(0, "#ff9aae");
        og.addColorStop(0.5, NEON_RED);
        og.addColorStop(1, "#b3002d");
        ctx.fillStyle = og;
        ctx.beginPath();
        ctx.moveTo(cx, cy - obs.height / 2);
        ctx.lineTo(cx + obs.width / 2, cy);
        ctx.lineTo(cx, cy + obs.height / 2);
        ctx.lineTo(cx - obs.width / 2, cy);
        ctx.closePath();
        ctx.fill();
        // facet highlight
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy - obs.height / 2);
        ctx.lineTo(cx, cy + obs.height / 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // Collectibles — rotating sparkle stars
      for (const col of collectiblesRef.current) {
        const cx = col.x - scrollX;
        if (cx < -20 || cx > CANVAS_W + 20) continue;
        if (col.collected) continue;

        const pulse = 1 + Math.sin(frame * 0.08 + col.x) * 0.2;
        ctx.save();
        ctx.translate(cx, col.y + Math.sin(frame * 0.05 + col.x * 0.1) * 2);
        ctx.rotate(frame * 0.03 + col.x);
        ctx.shadowBlur = 12 * pulse;
        ctx.shadowColor = NEON_AMBER;
        ctx.fillStyle = NEON_AMBER;
        ctx.beginPath();
        const R = 6.5 * pulse;
        const r = 2.4;
        for (let k = 0; k <= 8; k++) {
          const ang = (k * Math.PI) / 4;
          const rad = k % 2 === 0 ? R : r;
          if (k === 0) ctx.moveTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
          else ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff7e0";
        ctx.beginPath();
        ctx.arc(0, 0, 1.6, 0, PI2);
        ctx.fill();
        ctx.restore();
      }

      // Particles
      for (const p of particlesRef.current) {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Wake ribbon behind the surfer
      if (hist.length > 1) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.lineCap = "round";
        for (let i = 1; i < hist.length; i++) {
          const x1 = player.x - (i - 1) * 4.2;
          const x2 = player.x - i * 4.2;
          const a = (1 - i / hist.length) * 0.5;
          ctx.strokeStyle = stoked
            ? `hsla(${(hue + i * 8) % 360}, 90%, 62%, ${a})`
            : `rgba(0, 245, 212, ${a})`;
          ctx.lineWidth = Math.max(1, (1 - i / hist.length) * 7);
          ctx.beginPath();
          ctx.moveTo(x1, hist[i - 1]);
          ctx.lineTo(x2, hist[i]);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Player
      const blink = invincibleRef.current > 0 && frame % 6 < 3;
      if (!blink) {
        drawSurfer(ctx, player.x, player.y, tilt, stoked, hue);
      }

      // Floating score popups
      popupsRef.current = popupsRef.current.filter((p) => {
        p.y += p.vy;
        p.vy *= 0.96;
        p.life--;
        return p.life > 0;
      });
      for (const p of popupsRef.current) {
        const a = clamp(p.life / p.maxLife, 0, 1);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.font = "bold 13px 'Outfit', sans-serif";
        ctx.textAlign = "center";
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // Damage vignette
      if (hitFlashRef.current > 0.02) {
        const f = hitFlashRef.current;
        const vg = ctx.createRadialGradient(
          CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.2,
          CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.78
        );
        vg.addColorStop(0, "rgba(255, 40, 60, 0)");
        vg.addColorStop(1, `rgba(255, 40, 60, ${0.55 * f})`);
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        hitFlashRef.current *= 0.9;
      }

      ctx.restore(); // end shake transform — HUD stays steady

      // ── HUD ──
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px 'Outfit', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${scoreRef.current}`, 12, 26);

      // Stoke meter
      const meterW = 150;
      const mx = 12;
      const my = 34;
      ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
      roundRect(ctx, mx, my, meterW, 7, 3.5);
      ctx.fill();
      const sl = clamp(comboRef.current / 12, 0, 1);
      const mg = ctx.createLinearGradient(mx, 0, mx + meterW, 0);
      mg.addColorStop(0, NEON_CYAN);
      mg.addColorStop(1, NEON_PINK);
      ctx.save();
      if (stoked) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = NEON_PINK;
      }
      ctx.fillStyle = mg;
      roundRect(ctx, mx, my, meterW * sl, 7, 3.5);
      ctx.fill();
      ctx.restore();
      ctx.font = "9px 'Outfit', sans-serif";
      ctx.fillStyle = stoked ? "#ff8ad1" : "rgba(255, 255, 255, 0.5)";
      ctx.fillText(stoked ? "STOKED!" : "STOKE", mx, my + 19);

      // Lives as hearts
      ctx.textAlign = "right";
      ctx.fillStyle = NEON_PINK;
      ctx.font = "bold 16px 'Outfit', sans-serif";
      for (let i = 0; i < livesRef.current; i++) {
        ctx.fillText("♥", CANVAS_W - 12 - i * 22, 26);
      }

      // Combo indicator
      if (comboRef.current >= 5) {
        ctx.textAlign = "center";
        ctx.font = "bold 15px 'Outfit', sans-serif";
        ctx.save();
        if (stoked) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = NEON_PINK;
          ctx.fillStyle = `hsl(${hue}, 90%, 66%)`;
        } else {
          ctx.fillStyle = NEON_AMBER;
        }
        ctx.fillText(`${comboRef.current}× COMBO`, CANVAS_W / 2, 26);
        ctx.restore();
      }

      // Progress bar at bottom
      ctx.fillStyle = "rgba(0, 245, 212, 0.25)";
      ctx.fillRect(0, CANVAS_H - 3, CANVAS_W, 3);
      ctx.fillStyle = NEON_CYAN;
      ctx.fillRect(0, CANVAS_H - 3, CANVAS_W * progress, 3);

      // Song name
      if (songName) {
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.font = "11px 'Outfit', sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(songName, CANVAS_W - 12, CANVAS_H - 10);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [screen, getProgress, spawnParticles, endGame, songName]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  // ── Render JSX ─────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-[960px] px-4 py-10">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-border-light p-6 sm:p-8 mb-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-body text-2xl sm:text-3xl font-bold text-text-primary">
              Wave Rider
            </h1>
            <p className="mt-1 text-text-muted text-sm">
              Pick a track from your device and surf its waveform — nothing is uploaded.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-text-dim uppercase tracking-wider">Best</div>
              <div className="text-xl font-bold text-purple">{bestScore}</div>
            </div>
            {screen === "playing" && (
              <>
                <div className="text-right">
                  <div className="text-xs text-text-dim uppercase tracking-wider">Score</div>
                  <div className="text-xl font-bold text-text-primary">{score}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-text-dim uppercase tracking-wider">Lives</div>
                  <div className="text-xl font-bold text-coral">
                    {Array.from({ length: lives }).map((_, i) => (
                      <span key={i}>{"♥"}</span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Menu */}
      {screen === "menu" && (
        <div className="bg-white rounded-2xl border border-border-light p-6 sm:p-8 mb-6 shadow-sm space-y-6">
          {/* Synthwave hero banner */}
          <WaveRiderBanner />

          {errorMsg && (
            <p className="text-coral text-sm font-medium text-center">{errorMsg}</p>
          )}

          <div className="space-y-3 text-center">
            <h2 className="font-body text-lg font-semibold text-text-primary">
              Choose a Song
            </h2>
            <p className="text-sm text-text-muted">
              MP3, WAV, or OGG — read on your device, never uploaded
            </p>
            <label className="inline-flex cursor-pointer items-center gap-2 px-6 py-3 rounded-xl bg-purple text-white font-semibold hover:opacity-90 transition-opacity">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Choose File
              <input
                type="file"
                accept=".mp3,.wav,.ogg,audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </label>
          </div>
        </div>
      )}

      {/* Analyzing */}
      {screen === "analyzing" && (
        <div className="bg-white rounded-2xl border border-border-light p-8 mb-6 shadow-sm text-center space-y-4">
          <div className="inline-block w-10 h-10 border-4 border-purple/30 border-t-purple rounded-full animate-spin" />
          <p className="text-text-muted text-sm">{analyzeProgress}</p>
        </div>
      )}

      {/* Canvas */}
      {(screen === "playing" || screen === "gameover") && (
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="rounded-2xl border-2 border-border-light shadow-lg max-w-full"
            style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}`, width: "100%", maxWidth: CANVAS_W }}
          />
        </div>
      )}

      {/* Game Over overlay */}
      {screen === "gameover" && (
        <div className="mt-6 bg-white rounded-2xl border border-border-light p-8 shadow-sm text-center space-y-4">
          <h2 className="font-body text-2xl font-bold text-text-primary">
            {livesRef.current <= 0 ? "Wipeout!" : "Song Complete!"}
          </h2>
          <div className="flex justify-center gap-8">
            <div>
              <div className="text-xs text-text-dim uppercase tracking-wider">Score</div>
              <div className="text-3xl font-bold text-purple">{score}</div>
            </div>
            <div>
              <div className="text-xs text-text-dim uppercase tracking-wider">Best</div>
              <div className="text-3xl font-bold text-amber">{bestScore}</div>
            </div>
          </div>
          {songName && (
            <p className="text-sm text-text-muted">{songName}</p>
          )}
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => {
                // Reset and replay same song
                if (audioDataRef.current) {
                  const data = audioDataRef.current;
                  const terrain = generateTerrainPoints(data, CANVAS_H);
                  const obstacles = placeObstacles(terrain);
                  terrainRef.current = terrain;
                  obstaclesRef.current = obstacles;
                  collectiblesRef.current = placeCollectibles(terrain, obstacles, CANVAS_H);
                  startGame();
                }
              }}
              className="px-6 py-2.5 rounded-xl bg-purple text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Replay
            </button>
            <button
              onClick={() => {
                stopAudio();
                setScreen("menu");
                setSongName("");
                setErrorMsg("");
              }}
              className="px-6 py-2.5 rounded-xl border border-border-light text-text-primary font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              New Song
            </button>
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div className="mt-4 text-center text-xs text-text-dim">
        <span className="hidden sm:inline">Space or &uarr; to jump &bull; Dodge red crystals &bull; Collect golden orbs &bull; Build your stoke &bull; Escape to quit</span>
        <span className="sm:hidden">Tap to jump &bull; Dodge crystals &bull; Collect orbs</span>
      </div>
    </div>
  );
}

/* ─── Synthwave hero banner (menu) ───────────────────────────────────────── */

function WaveRiderBanner() {
  return (
    <div
      className="relative overflow-hidden rounded-xl h-32 select-none"
      style={{ background: "linear-gradient(180deg, #070418 0%, #1b0b3a 55%, #3a1d63 100%)" }}
      aria-hidden="true"
    >
      {/* Sun */}
      <div
        className="absolute"
        style={{
          left: "50%", top: 14, width: 88, height: 88,
          transform: "translateX(-50%)", borderRadius: "9999px",
          background:
            "radial-gradient(circle at 50% 40%, #ffe79e, #ff9e5e 42%, #ff4d8d 72%, rgba(155,93,229,0.15))",
          boxShadow: "0 0 28px rgba(255,77,141,0.5)",
          animation: "wr-sun-glow 3.2s ease-in-out infinite",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            borderRadius: "9999px",
            background:
              "repeating-linear-gradient(to bottom, transparent 0 7px, rgba(10,4,25,0.92) 7px 10px)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 46%, #000 46%)",
            maskImage: "linear-gradient(to bottom, transparent 46%, #000 46%)",
          }}
        />
      </div>

      {/* Stars */}
      {Array.from({ length: 14 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: 2, height: 2,
            left: `${(i * 53) % 100}%`,
            top: `${(i * 29) % 40}%`,
            opacity: 0.5,
            animation: `wr-twinkle ${1.6 + (i % 4) * 0.4}s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}

      {/* Synthwave floor */}
      <div
        className="absolute bottom-0 left-0 right-0 h-16"
        style={{
          background:
            "repeating-linear-gradient(to bottom, rgba(0,245,212,0.10) 0 1px, transparent 1px 14px), repeating-linear-gradient(to right, rgba(0,245,212,0.08) 0 1px, transparent 1px 26px)",
        }}
      />

      {/* Waveform terrain */}
      <svg className="absolute bottom-0 left-0 w-full" height="66" viewBox="0 0 400 66" preserveAspectRatio="none">
        <path
          d="M0,48 L20,40 L40,30 L60,46 L80,22 L100,38 L120,14 L140,42 L160,28 L180,48 L200,20 L220,44 L240,30 L260,50 L280,18 L300,40 L320,26 L340,46 L360,32 L380,48 L400,36 L400,66 L0,66 Z"
          fill="rgba(0,245,212,0.12)"
        />
        <polyline
          points="0,48 20,40 40,30 60,46 80,22 100,38 120,14 140,42 160,28 180,48 200,20 220,44 240,30 260,50 280,18 300,40 320,26 340,46 360,32 380,48 400,36"
          fill="none"
          stroke="#00f5d4"
          strokeWidth="2"
          style={{ filter: "drop-shadow(0 0 3px #00f5d4)" }}
        />
      </svg>

      {/* Surfer */}
      <div className="absolute" style={{ left: "29%", bottom: 40, animation: "wr-bob 1.6s ease-in-out infinite" }}>
        <svg width="34" height="26" viewBox="0 0 34 26" fill="none">
          <ellipse cx="17" cy="20" rx="16" ry="3.2" fill="#00f5d4" style={{ filter: "drop-shadow(0 0 4px #00f5d4)" }} />
          <polygon points="13,17 21,17 18.5,6 15.5,6" fill="#ff006e" style={{ filter: "drop-shadow(0 0 4px #ff006e)" }} />
          <circle cx="17" cy="4.5" r="3" fill="#ff006e" />
        </svg>
      </div>

      {/* Title */}
      <div
        className="absolute left-3 top-2.5 font-bold text-sm tracking-wide text-white"
        style={{ textShadow: "0 0 10px rgba(255,0,110,0.7)" }}
      >
        Surf your sound
      </div>
    </div>
  );
}
