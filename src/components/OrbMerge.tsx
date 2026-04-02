"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ── Constants ────────────────────────────────────────────────────────────────

const CANVAS_W = 440;
const CANVAS_H = 700;
const GRAVITY = 0.1;
const FRICTION = 0.982;
const RESTITUTION_WALL = 0.2;
const RESTITUTION_ORB = 0.12; // very low — sticky, squelchy
const SLEEP_THRESHOLD = 0.2;
const DROP_COOLDOWN = 24;
const PHYSICS_SUBSTEPS = 4;
const MERGE_TOLERANCE = 3; // px tolerance beyond touching
const MERGE_SHRINK_FRAMES = 8;
const SCALE_ANIM_FRAMES = 18;
const COMBO_WINDOW = 120;
const STICKY_FORCE = 0.08; // attraction between touching non-merge orbs
const STICKY_DAMPING = 0.85; // velocity damping on contact
const SAVE_KEY = "orb-merge-best";
const STATS_KEY = "orb-merge-stats";

// ── Cup Geometry ─────────────────────────────────────────────────────────────
// Trapezoid cup: wider at top, narrower at bottom, shorter height

const CUP_RIM_Y = 200; // y-position of cup opening
const CUP_BOTTOM_Y = 520; // y-position of cup floor (shorter cup)
const CUP_TOP_W = 300; // width at rim
const CUP_BOTTOM_W = 220; // width at bottom
const CUP_CORNER_R = 25; // bottom corner rounding
const CUP_CX = CANVAS_W / 2; // cup center x
const CUP_RIM_L = CUP_CX - CUP_TOP_W / 2;
const CUP_RIM_R = CUP_CX + CUP_TOP_W / 2;
const CUP_BOT_L = CUP_CX - CUP_BOTTOM_W / 2;
const CUP_BOT_R = CUP_CX + CUP_BOTTOM_W / 2;

// Drop zone — wider than the cup so you can aim past the edges
const DROP_Y = CUP_RIM_Y - 100;
const DROP_LEFT = 30; // much wider than cup
const DROP_RIGHT = CANVAS_W - 30;

// Death line — orbs falling below this = game over
const DEATH_LINE_Y = CUP_BOTTOM_Y + 100;

// Colors
const BG_TOP = "#0f0a1e";
const BG_BOTTOM = "#1a1035";

// ── Orb Tiers ────────────────────────────────────────────────────────────────

interface TierDef {
  radius: number;
  color: string;
  glow: string;
  name: string;
}

const TIERS: TierDef[] = [
  { radius: 14, color: "#ff6b6b", glow: "rgba(255,107,107,0.4)", name: "Spark" },
  { radius: 20, color: "#ff9f43", glow: "rgba(255,159,67,0.4)", name: "Ember" },
  { radius: 26, color: "#feca57", glow: "rgba(254,202,87,0.4)", name: "Glow" },
  { radius: 34, color: "#48dbfb", glow: "rgba(72,219,251,0.4)", name: "Pulse" },
  { radius: 42, color: "#0abde3", glow: "rgba(10,189,227,0.4)", name: "Surge" },
  { radius: 52, color: "#a855f7", glow: "rgba(168,85,247,0.4)", name: "Nova" },
  { radius: 64, color: "#ff6b9d", glow: "rgba(255,107,157,0.4)", name: "Bloom" },
  { radius: 78, color: "#00d2d3", glow: "rgba(0,210,211,0.4)", name: "Nebula" },
  { radius: 94, color: "#fbbf24", glow: "rgba(251,191,36,0.4)", name: "Solar" },
  { radius: 112, color: "#ffffff", glow: "rgba(255,255,255,0.35)", name: "Cosmos" },
];

const DROP_WEIGHTS = [35, 30, 20, 10, 5];
const DROP_WEIGHT_TOTAL = DROP_WEIGHTS.reduce((a, b) => a + b, 0);

function randomDropTier(): number {
  let r = Math.random() * DROP_WEIGHT_TOTAL;
  for (let i = 0; i < DROP_WEIGHTS.length; i++) {
    r -= DROP_WEIGHTS[i];
    if (r <= 0) return i;
  }
  return 0;
}

// ── Types ────────────────────────────────────────────────────────────────────

interface Orb {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  tier: number;
  radius: number;
  merging: boolean;
  mergingTimer: number;
  mergeTargetX: number;
  mergeTargetY: number;
  justDropped: number;
  scaleAnim: number;
  scalePhase: number;
  lookX: number; // eye look direction (lerped)
  lookY: number;
  squishX: number; // 1.0 = circle, >1 = wide, <1 = tall
  squishY: number; // inverse of squishX for volume preservation
}

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
  text: string;
  color: string;
  life: number;
}

interface FlashRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  life: number;
  maxLife: number;
}

interface GameStats {
  gamesPlayed: number;
  highestTier: number;
  bestCombo: number;
}

type Phase = "menu" | "playing" | "dead";

// ── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// ── Cup wall collision ──────────────────────────────────────────────────────
// Returns the cup's inner left and right x boundary at a given y

function cupLeftX(y: number): number {
  if (y <= CUP_RIM_Y) return CUP_RIM_L;
  if (y >= CUP_BOTTOM_Y - CUP_CORNER_R) return CUP_BOT_L;
  const t = (y - CUP_RIM_Y) / (CUP_BOTTOM_Y - CUP_CORNER_R - CUP_RIM_Y);
  return CUP_RIM_L + (CUP_BOT_L - CUP_RIM_L) * t;
}

function cupRightX(y: number): number {
  if (y <= CUP_RIM_Y) return CUP_RIM_R;
  if (y >= CUP_BOTTOM_Y - CUP_CORNER_R) return CUP_BOT_R;
  const t = (y - CUP_RIM_Y) / (CUP_BOTTOM_Y - CUP_CORNER_R - CUP_RIM_Y);
  return CUP_RIM_R + (CUP_BOT_R - CUP_RIM_R) * t;
}

// ── Face Drawing (with look-around + blink) ─────────────────────────────────

function drawFace(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  tier: number,
  lookX: number,
  lookY: number,
  frame: number,
  orbId: number
) {
  const s = r / 30;

  // Blink: each orb has unique cycle based on id
  const blinkCycle = 180 + (orbId * 37) % 120; // 180-300 frames
  const blinkFrame = (frame + orbId * 53) % blinkCycle;
  const isBlinking = blinkFrame < 4;

  // Clamp look direction
  const maxLook = 3 * s;
  const lx = clamp(lookX, -maxLook, maxLook);
  const ly = clamp(lookY, -maxLook, maxLook);

  if (tier <= 2) {
    // Small orbs: dot eyes + tiny smile
    const eyeR = Math.max(1.5, 2 * s);
    const eyeSpacing = 5 * s;
    const eyeY = y - 2 * s;

    if (isBlinking) {
      // Closed eyes — horizontal lines
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.lineWidth = Math.max(1, 1.2 * s);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x - eyeSpacing - eyeR, eyeY);
      ctx.lineTo(x - eyeSpacing + eyeR, eyeY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + eyeSpacing - eyeR, eyeY);
      ctx.lineTo(x + eyeSpacing + eyeR, eyeY);
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.beginPath();
      ctx.arc(x - eyeSpacing + lx * 0.3, eyeY + ly * 0.3, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + eyeSpacing + lx * 0.3, eyeY + ly * 0.3, eyeR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Smile
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = Math.max(1, 1.2 * s);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(x, y + 1 * s, 4 * s, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else if (tier <= 5) {
    // Medium orbs: circle eyes with pupils
    const eyeR = Math.max(2, 3.5 * s);
    const pupilR = Math.max(1, 1.8 * s);
    const eyeSpacing = 7 * s;
    const eyeY = y - 3 * s;

    if (isBlinking) {
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.lineWidth = Math.max(1, 1.5 * s);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x - eyeSpacing - eyeR, eyeY);
      ctx.lineTo(x - eyeSpacing + eyeR, eyeY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + eyeSpacing - eyeR, eyeY);
      ctx.lineTo(x + eyeSpacing + eyeR, eyeY);
      ctx.stroke();
    } else {
      // Eye whites
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.arc(x - eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
      ctx.fill();

      // Pupils — track look direction
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.beginPath();
      ctx.arc(x - eyeSpacing + lx * 0.5, eyeY + ly * 0.4, pupilR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + eyeSpacing + lx * 0.5, eyeY + ly * 0.4, pupilR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Smile
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = Math.max(1, 1.5 * s);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(x, y + 2 * s, 6 * s, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  } else if (tier <= 8) {
    // Large orbs: expressive eyes with brows, big grin
    const eyeR = Math.max(3, 4.5 * s);
    const pupilR = Math.max(1.5, 2.2 * s);
    const eyeSpacing = 9 * s;
    const eyeY = y - 4 * s;

    if (isBlinking) {
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = Math.max(1.5, 2 * s);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(x - eyeSpacing, eyeY, eyeR * 0.7, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + eyeSpacing, eyeY, eyeR * 0.7, 0, Math.PI);
      ctx.stroke();
    } else {
      // Eye whites
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.beginPath();
      ctx.arc(x - eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
      ctx.fill();

      // Pupils
      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.beginPath();
      ctx.arc(x - eyeSpacing + lx * 0.6, eyeY + ly * 0.5, pupilR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + eyeSpacing + lx * 0.6, eyeY + ly * 0.5, pupilR, 0, Math.PI * 2);
      ctx.fill();

      // Eye shine
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.arc(x - eyeSpacing - 1 * s, eyeY - 1 * s, pupilR * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + eyeSpacing - 1 * s, eyeY - 1 * s, pupilR * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Eyebrows
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = Math.max(1.2, 1.8 * s);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - eyeSpacing - 3 * s, eyeY - eyeR - 2 * s);
    ctx.lineTo(x - eyeSpacing + 3 * s, eyeY - eyeR - 3 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + eyeSpacing - 3 * s, eyeY - eyeR - 3 * s);
    ctx.lineTo(x + eyeSpacing + 3 * s, eyeY - eyeR - 2 * s);
    ctx.stroke();

    // Big grin
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.arc(x, y + 3 * s, 7 * s, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = Math.max(1, 1 * s);
    ctx.beginPath();
    ctx.moveTo(x - 6 * s, y + 3 * s);
    ctx.lineTo(x + 6 * s, y + 3 * s);
    ctx.stroke();
  } else {
    // Cosmos (tier 9): star eyes, biggest grin
    const eyeSpacing = 10 * s;
    const eyeY = y - 5 * s;
    const starR = Math.max(3, 4.5 * s);

    if (isBlinking) {
      ctx.strokeStyle = "rgba(255,215,0,0.7)";
      ctx.lineWidth = Math.max(1.5, 2 * s);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(x - eyeSpacing, eyeY, starR * 0.7, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + eyeSpacing, eyeY, starR * 0.7, 0, Math.PI);
      ctx.stroke();
    } else {
      for (const sx of [x - eyeSpacing + lx * 0.3, x + eyeSpacing + lx * 0.3]) {
        const sy = eyeY + ly * 0.3;
        ctx.fillStyle = "rgba(255,215,0,0.9)";
        ctx.beginPath();
        for (let p = 0; p < 5; p++) {
          const angle = -Math.PI / 2 + (p * 2 * Math.PI) / 5;
          const innerAngle = angle + Math.PI / 5;
          const ox = sx + Math.cos(angle) * starR;
          const oy = sy + Math.sin(angle) * starR;
          const ix = sx + Math.cos(innerAngle) * starR * 0.45;
          const iy = sy + Math.sin(innerAngle) * starR * 0.45;
          if (p === 0) ctx.moveTo(ox, oy);
          else ctx.lineTo(ox, oy);
          ctx.lineTo(ix, iy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.beginPath();
        ctx.arc(sx, sy, starR * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Eyebrows
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = Math.max(1.5, 2 * s);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(x - eyeSpacing, eyeY - starR - 4 * s, 5 * s, 1.1 * Math.PI, 1.9 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + eyeSpacing, eyeY - starR - 4 * s, 5 * s, 1.1 * Math.PI, 1.9 * Math.PI);
    ctx.stroke();

    // Huge grin
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.arc(x, y + 4 * s, 9 * s, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = Math.max(1, 1.2 * s);
    ctx.beginPath();
    ctx.moveTo(x - 8 * s, y + 4 * s);
    ctx.lineTo(x + 8 * s, y + 4 * s);
    ctx.stroke();
  }
}

// ── Draw Cup Shape ──────────────────────────────────────────────────────────

function drawCup(ctx: CanvasRenderingContext2D, frame: number) {
  // Cup body (filled background)
  ctx.fillStyle = "rgba(15, 10, 35, 0.5)";
  ctx.beginPath();
  ctx.moveTo(CUP_RIM_L, CUP_RIM_Y);
  ctx.lineTo(CUP_BOT_L, CUP_BOTTOM_Y - CUP_CORNER_R);
  ctx.quadraticCurveTo(CUP_BOT_L, CUP_BOTTOM_Y, CUP_BOT_L + CUP_CORNER_R, CUP_BOTTOM_Y);
  ctx.lineTo(CUP_BOT_R - CUP_CORNER_R, CUP_BOTTOM_Y);
  ctx.quadraticCurveTo(CUP_BOT_R, CUP_BOTTOM_Y, CUP_BOT_R, CUP_BOTTOM_Y - CUP_CORNER_R);
  ctx.lineTo(CUP_RIM_R, CUP_RIM_Y);
  ctx.closePath();
  ctx.fill();

  // Cup border — glass-like
  const borderAlpha = 0.3 + 0.05 * Math.sin(frame * 0.03);
  ctx.strokeStyle = `rgba(168, 85, 247, ${borderAlpha})`;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(CUP_RIM_L, CUP_RIM_Y);
  ctx.lineTo(CUP_BOT_L, CUP_BOTTOM_Y - CUP_CORNER_R);
  ctx.quadraticCurveTo(CUP_BOT_L, CUP_BOTTOM_Y, CUP_BOT_L + CUP_CORNER_R, CUP_BOTTOM_Y);
  ctx.lineTo(CUP_BOT_R - CUP_CORNER_R, CUP_BOTTOM_Y);
  ctx.quadraticCurveTo(CUP_BOT_R, CUP_BOTTOM_Y, CUP_BOT_R, CUP_BOTTOM_Y - CUP_CORNER_R);
  ctx.lineTo(CUP_RIM_R, CUP_RIM_Y);
  ctx.stroke();

  // Glass shine on left wall
  ctx.strokeStyle = `rgba(255, 255, 255, 0.06)`;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(CUP_RIM_L + 4, CUP_RIM_Y + 20);
  ctx.lineTo(CUP_BOT_L + 4, CUP_BOTTOM_Y - CUP_CORNER_R - 20);
  ctx.stroke();

  // Rim highlight
  ctx.fillStyle = "rgba(168, 85, 247, 0.2)";
  ctx.fillRect(CUP_RIM_L - 3, CUP_RIM_Y - 2, 6, 4);
  ctx.fillRect(CUP_RIM_R - 3, CUP_RIM_Y - 2, 6, 4);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function OrbMerge() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const frameRef = useRef(0);
  const nextIdRef = useRef(0);

  // Game state refs
  const phaseRef = useRef<Phase>("menu");
  const orbsRef = useRef<Orb[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const popupsRef = useRef<ScorePopup[]>([]);
  const flashRingsRef = useRef<FlashRing[]>([]);
  const scoreRef = useRef(0);
  const bestRef = useRef(0);
  const comboRef = useRef(0);
  const comboTimerRef = useRef(0);
  const highestTierRef = useRef(0);
  const bestComboRef = useRef(0);
  const dropCooldownRef = useRef(0);
  const cursorXRef = useRef(CANVAS_W / 2);
  const currentTierRef = useRef(0);
  const nextTierRef = useRef(0);
  const shakeRef = useRef({ x: 0, y: 0, intensity: 0 });
  const statsRef = useRef<GameStats>({
    gamesPlayed: 0,
    highestTier: 0,
    bestCombo: 0,
  });

  // React state for overlays
  const [displayPhase, setDisplayPhase] = useState<Phase>("menu");
  const [displayScore, setDisplayScore] = useState(0);
  const [displayBest, setDisplayBest] = useState(0);
  const [scale, setScale] = useState(1);

  // ── Load saved data ────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const n = parseInt(saved, 10);
        bestRef.current = n;
        setDisplayBest(n);
      }
      const stats = localStorage.getItem(STATS_KEY);
      if (stats) statsRef.current = JSON.parse(stats);
    } catch {}
  }, []);

  // ── Responsive scaling ─────────────────────────────────────────────────
  useEffect(() => {
    function resize() {
      if (!wrapperRef.current) return;
      const parent = wrapperRef.current.parentElement;
      if (!parent) return;
      const maxW = Math.min(parent.clientWidth - 16, CANVAS_W);
      const maxH = window.innerHeight - 160;
      const s = Math.min(maxW / CANVAS_W, maxH / CANVAS_H, 1);
      setScale(s);
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ── Spawn particles ────────────────────────────────────────────────────
  const spawnBurst = useCallback(
    (x: number, y: number, count: number, color: string, speed: number) => {
      const p = particlesRef.current;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = speed * (0.4 + Math.random() * 0.8);
        p.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          life: 20 + Math.random() * 20,
          maxLife: 35,
          color,
          size: 2 + Math.random() * 4,
        });
      }
      if (p.length > 200) particlesRef.current = p.slice(-200);
    },
    []
  );

  // ── Reset game ─────────────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    orbsRef.current = [];
    particlesRef.current = [];
    popupsRef.current = [];
    flashRingsRef.current = [];
    scoreRef.current = 0;
    comboRef.current = 0;
    comboTimerRef.current = 0;
    highestTierRef.current = 0;
    bestComboRef.current = 0;
    dropCooldownRef.current = 0;
    currentTierRef.current = randomDropTier();
    nextTierRef.current = randomDropTier();
    nextIdRef.current = 0;
    shakeRef.current = { x: 0, y: 0, intensity: 0 };
    frameRef.current = 0;
  }, []);

  // ── Drop orb ───────────────────────────────────────────────────────────
  const dropOrb = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    if (dropCooldownRef.current > 0) return;

    const tier = currentTierRef.current;
    const def = TIERS[tier];
    const x = clamp(cursorXRef.current, DROP_LEFT + def.radius, DROP_RIGHT - def.radius);

    orbsRef.current.push({
      id: nextIdRef.current++,
      x,
      y: DROP_Y,
      vx: 0,
      vy: 1,
      tier,
      radius: def.radius,
      merging: false,
      mergingTimer: 0,
      mergeTargetX: 0,
      mergeTargetY: 0,
      justDropped: 60,
      scaleAnim: 1,
      scalePhase: 0,
      lookX: 0,
      lookY: 0,
      squishX: 1,
      squishY: 1,
    });

    currentTierRef.current = nextTierRef.current;
    nextTierRef.current = randomDropTier();
    dropCooldownRef.current = DROP_COOLDOWN;
  }, []);

  // ── Physics step ───────────────────────────────────────────────────────
  const physicsStep = useCallback(() => {
    const orbs = orbsRef.current;

    for (const orb of orbs) {
      if (orb.merging) continue;

      // Gravity
      orb.vy += GRAVITY / PHYSICS_SUBSTEPS;

      // Friction
      const fric = Math.pow(FRICTION, 1 / PHYSICS_SUBSTEPS);
      orb.vx *= fric;
      orb.vy *= fric;

      // Sleep
      const speed = Math.abs(orb.vx) + Math.abs(orb.vy);
      if (speed < SLEEP_THRESHOLD && orb.y + orb.radius >= CUP_BOTTOM_Y - 4) {
        orb.vx *= 0.5;
        orb.vy = 0;
      }

      // Update position
      orb.x += orb.vx;
      orb.y += orb.vy;

      // Cup wall collisions — treat walls as solid from both sides
      // but orbs above the rim are free (can go over the top)
      if (orb.y > CUP_RIM_Y && orb.y < CUP_BOTTOM_Y) {
        const leftWall = cupLeftX(orb.y);
        const rightWall = cupRightX(orb.y);

        // Left wall — solid barrier. Check if orb overlaps it.
        const leftOverlap = leftWall - (orb.x - orb.radius);
        if (leftOverlap > 0 && leftOverlap < orb.radius * 2) {
          // Orb overlaps the left wall — push to nearest side
          const distToInside = leftWall + orb.radius - orb.x; // push right (inside)
          const distToOutside = orb.x + orb.radius - leftWall; // push left (outside)

          if (distToInside <= distToOutside) {
            // Closer to inside — push inward
            orb.x = leftWall + orb.radius;
          } else {
            // Closer to outside — push outward
            orb.x = leftWall - orb.radius;
          }

          const wallDx = CUP_BOT_L - CUP_RIM_L;
          const wallDy = (CUP_BOTTOM_Y - CUP_CORNER_R) - CUP_RIM_Y;
          const wallLen = Math.sqrt(wallDx * wallDx + wallDy * wallDy);
          const nx = -wallDy / wallLen;
          const ny = wallDx / wallLen;
          const dot = orb.vx * nx + orb.vy * ny;
          if (orb.x > leftWall ? dot < 0 : dot > 0) {
            orb.vx -= 2 * dot * nx * (1 - RESTITUTION_WALL);
            orb.vy -= 2 * dot * ny * (1 - RESTITUTION_WALL);
            orb.vx *= 0.7;
            orb.vy *= 0.7;
          }

          // Wall squish
          const impact = Math.abs(orb.vx);
          const squishAmt = Math.min(0.4, impact * 0.1);
          orb.squishX = Math.max(0.55, orb.squishX - squishAmt);
          orb.squishY = Math.min(1.45, orb.squishY + squishAmt);
        }

        // Right wall — solid barrier
        const rightOverlap = (orb.x + orb.radius) - rightWall;
        if (rightOverlap > 0 && rightOverlap < orb.radius * 2) {
          const distToInside = orb.x - (rightWall - orb.radius);
          const distToOutside = rightWall + orb.radius - orb.x;

          if (distToInside <= distToOutside) {
            orb.x = rightWall - orb.radius;
          } else {
            orb.x = rightWall + orb.radius;
          }

          const wallDx = CUP_BOT_R - CUP_RIM_R;
          const wallDy = (CUP_BOTTOM_Y - CUP_CORNER_R) - CUP_RIM_Y;
          const wallLen = Math.sqrt(wallDx * wallDx + wallDy * wallDy);
          const nx = wallDy / wallLen;
          const ny = -wallDx / wallLen;
          const dot = orb.vx * nx + orb.vy * ny;
          if (orb.x < rightWall ? dot < 0 : dot > 0) {
            orb.vx -= 2 * dot * nx * (1 - RESTITUTION_WALL);
            orb.vy -= 2 * dot * ny * (1 - RESTITUTION_WALL);
            orb.vx *= 0.7;
            orb.vy *= 0.7;
          }

          const impact = Math.abs(orb.vx);
          const squishAmt = Math.min(0.4, impact * 0.1);
          orb.squishX = Math.max(0.55, orb.squishX - squishAmt);
          orb.squishY = Math.min(1.45, orb.squishY + squishAmt);
        }
      }

      // Bottom collision — only if orb center is inside the cup
      if (orb.y + orb.radius > CUP_BOTTOM_Y && orb.x > cupLeftX(orb.y) && orb.x < cupRightX(orb.y)) {
        const impact = Math.abs(orb.vy);
        orb.y = CUP_BOTTOM_Y - orb.radius;
        orb.vy = -Math.abs(orb.vy) * RESTITUTION_WALL;
        orb.vx *= 0.85;
        const squishAmt = Math.min(0.5, impact * 0.12);
        orb.squishX = Math.min(1.5, orb.squishX + squishAmt);
        orb.squishY = Math.max(0.5, orb.squishY - squishAmt);
      }

      // Decay squish back to circle (slow spring for jelly feel)
      orb.squishX += (1 - orb.squishX) * 0.08;
      orb.squishY += (1 - orb.squishY) * 0.08;

      if (orb.justDropped > 0) orb.justDropped--;
    }

    // Orb-orb collisions with sticky physics
    for (let i = 0; i < orbs.length; i++) {
      const a = orbs[i];
      if (a.merging) continue;
      for (let j = i + 1; j < orbs.length; j++) {
        const b = orbs[j];
        if (b.merging) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.radius + b.radius;

        if (d < minDist && d > 0.01) {
          // Push apart
          const nx = dx / d;
          const ny = dy / d;
          const overlap = minDist - d;
          const massA = a.radius * a.radius;
          const massB = b.radius * b.radius;
          const totalMass = massA + massB;

          a.x -= nx * overlap * (massB / totalMass);
          a.y -= ny * overlap * (massB / totalMass);
          b.x += nx * overlap * (massA / totalMass);
          b.y += ny * overlap * (massA / totalMass);

          // Transfer momentum (low restitution = sticky)
          const dvx = a.vx - b.vx;
          const dvy = a.vy - b.vy;
          const dvDotN = dvx * nx + dvy * ny;

          if (dvDotN > 0) {
            const impulse = dvDotN * (1 + RESTITUTION_ORB) / totalMass;
            a.vx -= impulse * massB * nx;
            a.vy -= impulse * massB * ny;
            b.vx += impulse * massA * nx;
            b.vy += impulse * massA * ny;
          }

          // Sticky damping — heavily damp on contact
          a.vx *= STICKY_DAMPING;
          a.vy *= STICKY_DAMPING;
          b.vx *= STICKY_DAMPING;
          b.vy *= STICKY_DAMPING;

          // Squish on orb-orb contact (much squishier)
          const impactSpeed = Math.abs(dvDotN);
          const sqAmt = Math.min(0.4, impactSpeed * 0.1);
          if (sqAmt > 0.015) {
            const absNx = Math.abs(nx);
            const absNy = Math.abs(ny);
            if (absNx > absNy) {
              a.squishX = Math.max(0.55, a.squishX - sqAmt);
              a.squishY = Math.min(1.45, a.squishY + sqAmt);
              b.squishX = Math.max(0.55, b.squishX - sqAmt);
              b.squishY = Math.min(1.45, b.squishY + sqAmt);
            } else {
              a.squishX = Math.min(1.45, a.squishX + sqAmt);
              a.squishY = Math.max(0.55, a.squishY - sqAmt);
              b.squishX = Math.min(1.45, b.squishX + sqAmt);
              b.squishY = Math.max(0.55, b.squishY - sqAmt);
            }
          }
        }

        // Sticky attraction — slight pull between nearby orbs
        if (d < minDist * 1.15 && d > 0.01) {
          const nx = dx / d;
          const ny = dy / d;
          const pullStrength = STICKY_FORCE / PHYSICS_SUBSTEPS;
          const massA = a.radius * a.radius;
          const massB = b.radius * b.radius;
          const totalMass = massA + massB;
          a.vx += nx * pullStrength * (massB / totalMass);
          a.vy += ny * pullStrength * (massB / totalMass);
          b.vx -= nx * pullStrength * (massA / totalMass);
          b.vy -= ny * pullStrength * (massA / totalMass);
        }
      }
    }
  }, []);

  // ── Update eye look targets ────────────────────────────────────────────
  const updateEyes = useCallback(() => {
    const orbs = orbsRef.current;
    const cx = cursorXRef.current;
    const cy = DROP_Y;

    for (const orb of orbs) {
      if (orb.merging) continue;

      // Find nearest same-tier orb to look at
      let targetX = cx; // default: look at cursor
      let targetY = cy;
      let bestDist = 999999;

      for (const other of orbs) {
        if (other.id === orb.id || other.merging) continue;
        if (other.tier === orb.tier) {
          const d = dist(orb.x, orb.y, other.x, other.y);
          if (d < bestDist) {
            bestDist = d;
            targetX = other.x;
            targetY = other.y;
          }
        }
      }

      // Compute look direction (normalized, small magnitude)
      const dx = targetX - orb.x;
      const dy = targetY - orb.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 0.01) {
        const maxLook = 3 * (orb.radius / 30);
        const goalX = (dx / d) * maxLook;
        const goalY = (dy / d) * maxLook;
        // Smooth lerp
        orb.lookX = lerp(orb.lookX, goalX, 0.06);
        orb.lookY = lerp(orb.lookY, goalY, 0.06);
      }
    }
  }, []);

  // ── Check merges ───────────────────────────────────────────────────────
  const checkMerges = useCallback(() => {
    const orbs = orbsRef.current;
    let merged = false;

    // Process shrinking orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];
      if (orb.merging && orb.mergingTimer > 0) {
        orb.mergingTimer--;
        orb.x += (orb.mergeTargetX - orb.x) * 0.25;
        orb.y += (orb.mergeTargetY - orb.y) * 0.25;
        orb.vx = 0;
        orb.vy = 0;
        if (orb.mergingTimer <= 0) {
          orbs.splice(i, 1);
        }
      }
    }

    // Update scale animations
    for (const orb of orbs) {
      if (orb.scalePhase > 0) {
        orb.scalePhase--;
        const progress = 1 - orb.scalePhase / SCALE_ANIM_FRAMES;
        if (progress < 0.5) {
          orb.scaleAnim = progress * 2 * 1.2;
        } else {
          orb.scaleAnim = 1.2 - (progress - 0.5) * 2 * 0.2;
        }
      }
    }

    // Check for new merges — contact-based (touch = merge)
    for (let i = 0; i < orbs.length; i++) {
      const a = orbs[i];
      if (a.merging || a.tier >= TIERS.length - 1) continue;

      for (let j = i + 1; j < orbs.length; j++) {
        const b = orbs[j];
        if (b.merging || b.tier !== a.tier) continue;

        const d = dist(a.x, a.y, b.x, b.y);
        const touchDist = a.radius + b.radius + MERGE_TOLERANCE;

        if (d < touchDist) {
          const newTier = a.tier + 1;
          const def = TIERS[newTier];
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;

          a.merging = true;
          a.mergingTimer = MERGE_SHRINK_FRAMES;
          a.mergeTargetX = mx;
          a.mergeTargetY = my;
          b.merging = true;
          b.mergingTimer = MERGE_SHRINK_FRAMES;
          b.mergeTargetX = mx;
          b.mergeTargetY = my;

          orbs.push({
            id: nextIdRef.current++,
            x: mx,
            y: my,
            vx: (a.vx + b.vx) * 0.2,
            vy: (a.vy + b.vy) * 0.2 - 1,
            tier: newTier,
            radius: def.radius,
            merging: false,
            mergingTimer: 0,
            mergeTargetX: 0,
            mergeTargetY: 0,
            justDropped: 10,
            scaleAnim: 0.1,
            scalePhase: SCALE_ANIM_FRAMES,
            lookX: 0,
            lookY: 0,
            squishX: 1,
            squishY: 1,
          });

          // Score
          const points = (newTier + 1) * (newTier + 1) * 10;
          if (comboTimerRef.current > 0) {
            comboRef.current++;
          } else {
            comboRef.current = 1;
          }
          comboTimerRef.current = COMBO_WINDOW;
          const combo = comboRef.current;
          const totalPoints = points * combo;
          scoreRef.current += totalPoints;

          if (newTier > highestTierRef.current) highestTierRef.current = newTier;
          if (combo > bestComboRef.current) bestComboRef.current = combo;

          spawnBurst(mx, my, 16 + newTier * 4, def.color, 2.5 + newTier * 0.6);
          popupsRef.current.push({
            x: mx,
            y: my,
            text: combo > 1 ? `+${totalPoints} x${combo}` : `+${totalPoints}`,
            color: def.color,
            life: 60,
          });
          flashRingsRef.current.push({
            x: mx,
            y: my,
            radius: def.radius * 0.5,
            maxRadius: def.radius * 2.5,
            color: def.color,
            life: 15,
            maxLife: 15,
          });
          shakeRef.current.intensity = Math.min(3 + newTier * 1.5, 15);

          merged = true;
          break;
        }
      }
      if (merged) break;
    }

    return merged;
  }, [spawnBurst]);

  // ── Main game loop ─────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    function loop() {
      rafRef.current = requestAnimationFrame(loop);
      const frame = frameRef.current++;
      const phase = phaseRef.current;
      const orbs = orbsRef.current;
      const particles = particlesRef.current;
      const popups = popupsRef.current;
      const flashRings = flashRingsRef.current;
      const shake = shakeRef.current;

      // ── Update ────────────────────────────────────────────────────────

      if (phase === "playing") {
        for (let s = 0; s < PHYSICS_SUBSTEPS; s++) physicsStep();

        let mergePass = 0;
        while (checkMerges() && mergePass < 5) mergePass++;

        // Update eyes every frame
        updateEyes();

        if (dropCooldownRef.current > 0) dropCooldownRef.current--;

        if (comboTimerRef.current > 0) {
          comboTimerRef.current--;
          if (comboTimerRef.current <= 0) comboRef.current = 0;
        }

        // Death check — any orb fallen below the death line?
        let fallen = false;
        for (const orb of orbs) {
          if (orb.justDropped > 0 || orb.merging) continue;
          if (orb.y > DEATH_LINE_Y) {
            fallen = true;
            break;
          }
        }
        if (fallen) {
          phaseRef.current = "dead";
          setDisplayPhase("dead");
          setDisplayScore(scoreRef.current);

          if (scoreRef.current > bestRef.current) {
            bestRef.current = scoreRef.current;
            setDisplayBest(scoreRef.current);
            try {
              localStorage.setItem(SAVE_KEY, String(scoreRef.current));
            } catch {}
          }

          const st = statsRef.current;
          st.gamesPlayed++;
          if (highestTierRef.current > st.highestTier)
            st.highestTier = highestTierRef.current;
          if (bestComboRef.current > st.bestCombo)
            st.bestCombo = bestComboRef.current;
          try {
            localStorage.setItem(STATS_KEY, JSON.stringify(st));
          } catch {}
        }
      }

      // Screen shake decay
      if (shake.intensity > 0) {
        shake.x = (Math.random() - 0.5) * shake.intensity * 2;
        shake.y = (Math.random() - 0.5) * shake.intensity * 2;
        shake.intensity *= 0.88;
        if (shake.intensity < 0.3) shake.intensity = 0;
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.vx *= 0.97;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
      }

      // Update popups
      for (let i = popups.length - 1; i >= 0; i--) {
        const p = popups[i];
        p.y -= 1.2;
        p.life--;
        if (p.life <= 0) popups.splice(i, 1);
      }

      // Update flash rings
      for (let i = flashRings.length - 1; i >= 0; i--) {
        const f = flashRings[i];
        f.life--;
        const progress = 1 - f.life / f.maxLife;
        f.radius = f.maxRadius * 0.5 + (f.maxRadius - f.maxRadius * 0.5) * progress;
        if (f.life <= 0) flashRings.splice(i, 1);
      }

      // ── Render ────────────────────────────────────────────────────────

      ctx.save();
      ctx.translate(shake.x, shake.y);

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, BG_TOP);
      grad.addColorStop(1, BG_BOTTOM);
      ctx.fillStyle = grad;
      ctx.fillRect(-10, -10, CANVAS_W + 20, CANVAS_H + 20);

      // Draw cup
      drawCup(ctx, frame);

      // Death line indicator
      if (phase === "playing") {
        ctx.strokeStyle = "rgba(239, 68, 68, 0.2)";
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(20, DEATH_LINE_Y);
        ctx.lineTo(CANVAS_W - 20, DEATH_LINE_Y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Small "X" labels at death line edges
        ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
        ctx.font = "bold 11px 'Space Grotesk', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("x", 30, DEATH_LINE_Y + 4);
        ctx.fillText("x", CANVAS_W - 30, DEATH_LINE_Y + 4);
      }

      // ── Draw orbs ───────────────────────────────────────────────────
      for (const orb of orbs) {
        const def = TIERS[orb.tier];
        const drawScale = orb.merging
          ? Math.max(0, orb.mergingTimer / MERGE_SHRINK_FRAMES)
          : orb.scaleAnim;
        const r = orb.radius * drawScale;

        if (r < 0.5) continue;

        const sx = orb.squishX;
        const sy = orb.squishY;

        // Shadow (not squished)
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.beginPath();
        ctx.ellipse(orb.x, orb.y + r * sy + 3, r * sx * 0.7, r * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glow (not squished — stays circular)
        const glowGrad = ctx.createRadialGradient(
          orb.x, orb.y, r * 0.3,
          orb.x, orb.y, r * 1.6
        );
        glowGrad.addColorStop(0, def.glow);
        glowGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, r * 1.6, 0, Math.PI * 2);
        ctx.fill();

        // Draw squished body, border, highlight, and face
        ctx.save();
        ctx.translate(orb.x, orb.y);
        ctx.scale(sx, sy);

        // Body
        const bodyGrad = ctx.createRadialGradient(
          -r * 0.25, -r * 0.25, r * 0.1,
          0, 0, r
        );
        bodyGrad.addColorStop(0, "#ffffff");
        bodyGrad.addColorStop(0.3, def.color);
        bodyGrad.addColorStop(1, def.color + "aa");
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 1 / Math.max(sx, sy); // keep border width consistent
        ctx.stroke();

        // Highlight
        ctx.beginPath();
        ctx.arc(-r * 0.25, -r * 0.3, r * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fill();

        // Face (drawn in squished space so it deforms with the orb)
        if (!orb.merging && drawScale > 0.5) {
          drawFace(ctx, 0, 0, r, orb.tier, orb.lookX, orb.lookY, frame, orb.id);
        }

        ctx.restore();
      }

      // Flash rings
      for (const f of flashRings) {
        const alpha = f.life / f.maxLife;
        ctx.globalAlpha = alpha * 0.6;
        ctx.strokeStyle = f.color;
        ctx.lineWidth = 2 + alpha * 3;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Particles
      for (const p of particles) {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Score popups
      for (const p of popups) {
        const alpha = Math.min(1, p.life / 20);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.font = "bold 16px 'Space Grotesk', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(p.text, p.x, p.y);
      }
      ctx.globalAlpha = 1;

      // ── Drop cursor / guide ─────────────────────────────────────────
      if (phase === "playing" && dropCooldownRef.current <= 0) {
        const tier = currentTierRef.current;
        const def = TIERS[tier];
        const cx2 = clamp(cursorXRef.current, DROP_LEFT + def.radius, DROP_RIGHT - def.radius);

        // Guide line (down into cup)
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cx2, DROP_Y);
        ctx.lineTo(cx2, CUP_BOTTOM_Y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Preview orb
        const previewGrad = ctx.createRadialGradient(
          cx2 - def.radius * 0.2, DROP_Y - def.radius * 0.2,
          def.radius * 0.1, cx2, DROP_Y, def.radius
        );
        previewGrad.addColorStop(0, "#ffffff");
        previewGrad.addColorStop(0.3, def.color);
        previewGrad.addColorStop(1, def.color + "88");
        ctx.fillStyle = previewGrad;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(cx2, DROP_Y, def.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // ── HUD ─────────────────────────────────────────────────────────
      if (phase === "playing" || phase === "dead") {
        // Score
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = "bold 26px 'Space Grotesk', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(String(scoreRef.current), 30, 38);

        // Best
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.font = "13px 'Space Grotesk', sans-serif";
        ctx.fillText(`Best: ${bestRef.current}`, 30, 58);

        // Combo
        if (comboRef.current > 1) {
          ctx.fillStyle = TIERS[Math.min(comboRef.current, TIERS.length - 1)].color;
          ctx.font = "bold 20px 'Space Grotesk', sans-serif";
          ctx.textAlign = "right";
          ctx.fillText(`x${comboRef.current}`, CANVAS_W - 30, 38);
        }

        // Next orb preview
        if (phase === "playing") {
          const nextDef = TIERS[nextTierRef.current];
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.font = "12px 'Space Grotesk', sans-serif";
          ctx.textAlign = "left";
          ctx.fillText("Next", 30, CUP_BOTTOM_Y + 35);

          ctx.fillStyle = nextDef.color;
          ctx.beginPath();
          ctx.arc(80, CUP_BOTTOM_Y + 31, nextDef.radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Highest tier badge
        if (highestTierRef.current > 0) {
          const htDef = TIERS[highestTierRef.current];
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.font = "12px 'Space Grotesk', sans-serif";
          ctx.textAlign = "right";
          ctx.fillText("Max", CANVAS_W - 30, CUP_BOTTOM_Y + 35);

          ctx.fillStyle = htDef.color;
          ctx.beginPath();
          ctx.arc(CANVAS_W - 80, CUP_BOTTOM_Y + 31, htDef.radius * 0.35, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.font = "bold 10px 'Space Grotesk', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(htDef.name, CANVAS_W - 80, CUP_BOTTOM_Y + 48);
        }
      }

      // ── Menu title screen ───────────────────────────────────────────
      if (phase === "menu") {
        const t = frame * 0.02;
        for (let i = 0; i < 6; i++) {
          const tier = i;
          const def = TIERS[tier];
          const ox = CUP_CX - 100 + (200 * i) / 5;
          const oy = CUP_RIM_Y + 180 + Math.sin(t + i * 1.2) * 40 + Math.cos(t * 0.7 + i) * 20;

          const gGrad = ctx.createRadialGradient(ox, oy, def.radius * 0.3, ox, oy, def.radius * 1.5);
          gGrad.addColorStop(0, def.glow);
          gGrad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = gGrad;
          ctx.beginPath();
          ctx.arc(ox, oy, def.radius * 1.5, 0, Math.PI * 2);
          ctx.fill();

          const bGrad = ctx.createRadialGradient(
            ox - def.radius * 0.2, oy - def.radius * 0.2, def.radius * 0.1,
            ox, oy, def.radius
          );
          bGrad.addColorStop(0, "#ffffff");
          bGrad.addColorStop(0.3, def.color);
          bGrad.addColorStop(1, def.color + "aa");
          ctx.fillStyle = bGrad;
          ctx.beginPath();
          ctx.arc(ox, oy, def.radius, 0, Math.PI * 2);
          ctx.fill();

          // Draw face on menu demo orbs too
          drawFace(ctx, ox, oy, def.radius, tier, Math.sin(t + i) * 2, Math.cos(t * 0.5 + i) * 1, frame, i + 1000);
        }

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 38px 'DM Serif Display', serif";
        ctx.textAlign = "center";
        ctx.fillText("Orb Merge", CANVAS_W / 2, CUP_RIM_Y + 70);

        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "15px 'Space Grotesk', sans-serif";
        ctx.fillText("Drop. Match. Merge.", CANVAS_W / 2, CUP_RIM_Y + 98);

        if (bestRef.current > 0) {
          ctx.fillStyle = "rgba(255,255,255,0.35)";
          ctx.font = "14px 'Space Grotesk', sans-serif";
          ctx.fillText(`Best: ${bestRef.current}`, CANVAS_W / 2, CUP_BOTTOM_Y - 30);
        }
      }

      ctx.restore();
    }

    loop();
    return () => cancelAnimationFrame(rafRef.current);
  }, [physicsStep, checkMerges, updateEyes]);

  // ── Pointer tracking ───────────────────────────────────────────────────
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (phaseRef.current !== "playing") return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
      cursorXRef.current = clamp(x, DROP_LEFT + 10, DROP_RIGHT - 10);
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const phase = phaseRef.current;

      if (phase === "menu") {
        resetGame();
        phaseRef.current = "playing";
        setDisplayPhase("playing");
        return;
      }

      if (phase === "dead") {
        phaseRef.current = "menu";
        setDisplayPhase("menu");
        return;
      }

      if (phase === "playing") {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const x = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
          cursorXRef.current = clamp(x, DROP_LEFT + 10, DROP_RIGHT - 10);
        }
        dropOrb();
      }
    },
    [resetGame, dropOrb]
  );

  // ── Keyboard ───────────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        const phase = phaseRef.current;
        if (phase === "menu") {
          resetGame();
          phaseRef.current = "playing";
          setDisplayPhase("playing");
        } else if (phase === "playing") {
          dropOrb();
        } else if (phase === "dead") {
          phaseRef.current = "menu";
          setDisplayPhase("menu");
        }
      }
      if (e.code === "ArrowLeft") {
        cursorXRef.current = clamp(cursorXRef.current - 8, DROP_LEFT + 10, DROP_RIGHT - 10);
      }
      if (e.code === "ArrowRight") {
        cursorXRef.current = clamp(cursorXRef.current + 8, DROP_LEFT + 10, DROP_RIGHT - 10);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [resetGame, dropOrb]);

  // ── Render JSX ─────────────────────────────────────────────────────────
  return (
    <section className="flex flex-col items-center gap-4 py-6 px-4">
      <h1 className="font-display text-2xl text-text-primary">Orb Merge</h1>

      <div
        ref={wrapperRef}
        className="relative rounded-2xl border-2 border-purple/30 overflow-hidden cursor-pointer select-none touch-none"
        style={{
          width: CANVAS_W * scale,
          height: CANVAS_H * scale,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            width: CANVAS_W * scale,
            height: CANVAS_H * scale,
          }}
        />

        {/* Menu overlay */}
        {displayPhase === "menu" && (
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 pointer-events-none">
            <p className="text-white/70 text-lg font-body animate-pulse">
              Tap to play
            </p>
          </div>
        )}

        {/* Death overlay */}
        {displayPhase === "dead" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 pointer-events-none">
            <p className="text-white/50 text-sm font-body mb-1">Game Over</p>
            <p className="text-white text-4xl font-display mb-2">
              {displayScore.toLocaleString()}
            </p>
            {displayScore >= displayBest && displayBest > 0 && (
              <p className="text-amber-400 text-sm font-body mb-1">
                New best!
              </p>
            )}
            <p className="text-white/40 text-sm font-body mb-1">
              Best: {displayBest.toLocaleString()}
            </p>
            {highestTierRef.current > 0 && (
              <p className="text-white/40 text-xs font-body">
                Highest: {TIERS[highestTierRef.current].name} (Tier{" "}
                {highestTierRef.current + 1})
              </p>
            )}
            <p className="text-white/50 text-sm font-body mt-8 animate-pulse">
              Tap to continue
            </p>
          </div>
        )}
      </div>

      <p className="text-text-dim text-sm max-w-md text-center">
        Drop orbs into the cup — matching orbs merge on contact into bigger
        tiers. Don&apos;t let any fall out!
      </p>
    </section>
  );
}
