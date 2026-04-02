"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ── Constants ────────────────────────────────────────────────────────────────

const CANVAS_W = 440;
const CANVAS_H = 700;
const GRAVITY = 0.55;
const FRICTION = 0.985;
const RESTITUTION_WALL = 0.25;
const RESTITUTION_ORB = 0.35;
const SLEEP_THRESHOLD = 0.3;
const MERGE_OVERLAP = 0.25; // fraction of radius overlap needed
const DROP_COOLDOWN = 22; // frames (~0.37s at 60fps)
const PHYSICS_SUBSTEPS = 4;
const DANGER_Y = 155; // y-position of danger line (relative to container top)
const DANGER_GRACE = 90; // frames above danger line before game over
const COMBO_WINDOW = 120; // frames to chain combos (~2s)
const GRAVITY_SHIFT_DURATION = 180; // frames (~3s)
const GRAVITY_SHIFT_MAX_CHARGES = 3;
const GRAVITY_SHIFT_RECHARGE = 1800; // frames (~30s)
const MERGE_SHRINK_FRAMES = 8;
const SCALE_ANIM_FRAMES = 18;
const SAVE_KEY = "orb-merge-best";
const STATS_KEY = "orb-merge-stats";

// Container bounds (within canvas)
const CX = 40; // container left
const CY = 110; // container top
const CW = CANVAS_W - 80; // container width
const CH = CANVAS_H - 180; // container height
const CR = CX + CW; // container right
const CB = CY + CH; // container bottom

// Colors
const BG_TOP = "#0f0a1e";
const BG_BOTTOM = "#1a1035";
const CONTAINER_BORDER = "rgba(168, 85, 247, 0.35)";
const CONTAINER_BG = "rgba(15, 10, 30, 0.6)";
const DANGER_COLOR = "#ef4444";

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

// Drop weights for tiers 0-4
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
  merging: boolean; // marked for removal after merge
  mergingTimer: number; // frames left in shrink animation (0 = not shrinking)
  mergeTargetX: number; // midpoint to shrink toward
  mergeTargetY: number;
  justDropped: number; // frames since drop (ignore danger line briefly)
  scaleAnim: number; // 0→1.15→1.0 bounce on spawn from merge
  scalePhase: number; // frames into scale animation (0 = done)
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

// ── Face Drawing ────────────────────────────────────────────────────────────

function drawFace(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, tier: number) {
  const s = r / 30; // scale factor relative to a "standard" 30px radius

  if (tier <= 2) {
    // Small orbs: simple dot eyes + tiny smile
    const eyeR = Math.max(1.5, 2 * s);
    const eyeSpacing = 5 * s;
    const eyeY = y - 2 * s;

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.beginPath();
    ctx.arc(x - eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = Math.max(1, 1.2 * s);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(x, y + 1 * s, 4 * s, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else if (tier <= 5) {
    // Medium orbs: circle eyes with pupils, wider smile
    const eyeR = Math.max(2, 3.5 * s);
    const pupilR = Math.max(1, 1.8 * s);
    const eyeSpacing = 7 * s;
    const eyeY = y - 3 * s;

    // Eye whites
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(x - eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();

    // Pupils (slightly toward center-bottom for a cute look)
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.beginPath();
    ctx.arc(x - eyeSpacing + 0.5 * s, eyeY + 0.5 * s, pupilR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + eyeSpacing - 0.5 * s, eyeY + 0.5 * s, pupilR, 0, Math.PI * 2);
    ctx.fill();

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
    ctx.arc(x - eyeSpacing + 0.5 * s, eyeY + 0.5 * s, pupilR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + eyeSpacing - 0.5 * s, eyeY + 0.5 * s, pupilR, 0, Math.PI * 2);
    ctx.fill();

    // Eye shine
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.arc(x - eyeSpacing - 1 * s, eyeY - 1 * s, pupilR * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + eyeSpacing - 1 * s, eyeY - 1 * s, pupilR * 0.5, 0, Math.PI * 2);
    ctx.fill();

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

    // Teeth (white line)
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

    // Star eyes
    for (const sx of [x - eyeSpacing, x + eyeSpacing]) {
      ctx.fillStyle = "rgba(255,215,0,0.9)";
      ctx.beginPath();
      for (let p = 0; p < 5; p++) {
        const angle = -Math.PI / 2 + (p * 2 * Math.PI) / 5;
        const innerAngle = angle + Math.PI / 5;
        const ox = sx + Math.cos(angle) * starR;
        const oy = eyeY + Math.sin(angle) * starR;
        const ix = sx + Math.cos(innerAngle) * starR * 0.45;
        const iy = eyeY + Math.sin(innerAngle) * starR * 0.45;
        if (p === 0) ctx.moveTo(ox, oy);
        else ctx.lineTo(ox, oy);
        ctx.lineTo(ix, iy);
      }
      ctx.closePath();
      ctx.fill();

      // Center dot
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.beginPath();
      ctx.arc(sx, eyeY, starR * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Excited eyebrows (raised)
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

    // Teeth
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = Math.max(1, 1.2 * s);
    ctx.beginPath();
    ctx.moveTo(x - 8 * s, y + 4 * s);
    ctx.lineTo(x + 8 * s, y + 4 * s);
    ctx.stroke();
  }
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
  const dangerTimerRef = useRef(0);
  const shakeRef = useRef({ x: 0, y: 0, intensity: 0 });
  const gravShiftRef = useRef({
    active: false,
    timer: 0,
    charges: GRAVITY_SHIFT_MAX_CHARGES,
    rechargeTimer: 0,
    angle: 0, // 0 = down, PI/2 = right, PI = up, -PI/2 = left
  });
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
    dangerTimerRef.current = 0;
    currentTierRef.current = randomDropTier();
    nextTierRef.current = randomDropTier();
    nextIdRef.current = 0;
    shakeRef.current = { x: 0, y: 0, intensity: 0 };
    gravShiftRef.current = {
      active: false,
      timer: 0,
      charges: GRAVITY_SHIFT_MAX_CHARGES,
      rechargeTimer: 0,
      angle: 0,
    };
    frameRef.current = 0;
  }, []);

  // ── Drop orb ───────────────────────────────────────────────────────────
  const dropOrb = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    if (dropCooldownRef.current > 0) return;

    const tier = currentTierRef.current;
    const def = TIERS[tier];
    const x = clamp(cursorXRef.current, CX + def.radius + 4, CR - def.radius - 4);

    orbsRef.current.push({
      id: nextIdRef.current++,
      x,
      y: CY + 10,
      vx: 0,
      vy: 1,
      tier,
      radius: def.radius,
      merging: false,
      mergingTimer: 0,
      mergeTargetX: 0,
      mergeTargetY: 0,
      justDropped: 60, // ~1s grace period
      scaleAnim: 1,
      scalePhase: 0,
    });

    currentTierRef.current = nextTierRef.current;
    nextTierRef.current = randomDropTier();
    dropCooldownRef.current = DROP_COOLDOWN;
  }, []);

  // ── Activate gravity shift ─────────────────────────────────────────────
  const activateGravityShift = useCallback(() => {
    const gs = gravShiftRef.current;
    if (gs.active || gs.charges <= 0 || phaseRef.current !== "playing") return;
    gs.active = true;
    gs.timer = GRAVITY_SHIFT_DURATION;
    gs.charges--;
    // Rotate 90° clockwise
    gs.angle = Math.PI / 2;
  }, []);

  // ── Physics step ───────────────────────────────────────────────────────
  const physicsStep = useCallback(() => {
    const orbs = orbsRef.current;
    const gs = gravShiftRef.current;

    // Gravity direction
    let gx = 0;
    let gy = GRAVITY;
    if (gs.active) {
      gx = Math.sin(gs.angle) * GRAVITY;
      gy = Math.cos(gs.angle) * GRAVITY;
    }

    for (const orb of orbs) {
      if (orb.merging) continue;

      // Apply gravity (scaled for substep)
      orb.vx += gx / PHYSICS_SUBSTEPS;
      orb.vy += gy / PHYSICS_SUBSTEPS;

      // Apply friction
      const fric = Math.pow(FRICTION, 1 / PHYSICS_SUBSTEPS);
      orb.vx *= fric;
      orb.vy *= fric;

      // Extra horizontal damping when resting on surface (prevents sliding on piles)
      if (orb.y + orb.radius >= CB - 4) {
        orb.vx *= 0.92;
      }

      // Sleep
      if (Math.abs(orb.vx) < SLEEP_THRESHOLD && Math.abs(orb.vy) < SLEEP_THRESHOLD) {
        if (orb.y + orb.radius >= CB - 4) {
          orb.vy = 0;
        }
        if (Math.abs(orb.vx) < SLEEP_THRESHOLD * 0.5) orb.vx = 0;
      }

      // Update position
      orb.x += orb.vx;
      orb.y += orb.vy;

      // Wall collisions
      if (orb.x - orb.radius < CX) {
        orb.x = CX + orb.radius;
        orb.vx = Math.abs(orb.vx) * RESTITUTION_WALL;
      }
      if (orb.x + orb.radius > CR) {
        orb.x = CR - orb.radius;
        orb.vx = -Math.abs(orb.vx) * RESTITUTION_WALL;
      }
      if (orb.y + orb.radius > CB) {
        orb.y = CB - orb.radius;
        orb.vy = -Math.abs(orb.vy) * RESTITUTION_WALL;
      }
      // Top wall (soft - only push back gently)
      if (orb.y - orb.radius < CY) {
        orb.y = CY + orb.radius;
        orb.vy = Math.abs(orb.vy) * 0.1;
      }

      if (orb.justDropped > 0) orb.justDropped--;
    }

    // Orb-orb collisions
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

          // Transfer momentum
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

          // Extra damping on contact to help stacking settle
          a.vx *= 0.98;
          a.vy *= 0.98;
          b.vx *= 0.98;
          b.vy *= 0.98;
        }
      }
    }
  }, []);

  // ── Check merges ───────────────────────────────────────────────────────
  const checkMerges = useCallback(() => {
    const orbs = orbsRef.current;
    let merged = false;

    // First: process orbs that are currently shrinking (merge animation)
    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];
      if (orb.merging && orb.mergingTimer > 0) {
        orb.mergingTimer--;
        // Lerp toward merge target
        orb.x += (orb.mergeTargetX - orb.x) * 0.25;
        orb.y += (orb.mergeTargetY - orb.y) * 0.25;
        orb.vx = 0;
        orb.vy = 0;

        if (orb.mergingTimer <= 0) {
          // Actually remove — the new orb was already spawned when merge started
          orbs.splice(i, 1);
        }
      }
    }

    // Update scale animations
    for (const orb of orbs) {
      if (orb.scalePhase > 0) {
        orb.scalePhase--;
        const progress = 1 - orb.scalePhase / SCALE_ANIM_FRAMES;
        // Bounce easing: overshoot to 1.2 then settle to 1.0
        if (progress < 0.5) {
          orb.scaleAnim = progress * 2 * 1.2; // 0 → 1.2
        } else {
          orb.scaleAnim = 1.2 - (progress - 0.5) * 2 * 0.2; // 1.2 → 1.0
        }
      }
    }

    // Check for new merges
    for (let i = 0; i < orbs.length; i++) {
      const a = orbs[i];
      if (a.merging || a.tier >= TIERS.length - 1) continue;

      for (let j = i + 1; j < orbs.length; j++) {
        const b = orbs[j];
        if (b.merging || b.tier !== a.tier) continue;

        const d = dist(a.x, a.y, b.x, b.y);
        const mergeThreshold = (a.radius + b.radius) * (1 - MERGE_OVERLAP);

        if (d < mergeThreshold) {
          // Merge! Start shrink animation on source orbs
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

          // Spawn new orb immediately with scale animation
          orbs.push({
            id: nextIdRef.current++,
            x: mx,
            y: my,
            vx: (a.vx + b.vx) * 0.3,
            vy: (a.vy + b.vy) * 0.3 - 1.5,
            tier: newTier,
            radius: def.radius,
            merging: false,
            mergingTimer: 0,
            mergeTargetX: 0,
            mergeTargetY: 0,
            justDropped: 10,
            scaleAnim: 0.1,
            scalePhase: SCALE_ANIM_FRAMES,
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

          // Track stats
          if (newTier > highestTierRef.current) highestTierRef.current = newTier;
          if (combo > bestComboRef.current) bestComboRef.current = combo;

          // Enhanced effects
          spawnBurst(mx, my, 16 + newTier * 4, def.color, 2.5 + newTier * 0.6);
          popupsRef.current.push({
            x: mx,
            y: my,
            text: combo > 1 ? `+${totalPoints} x${combo}` : `+${totalPoints}`,
            color: def.color,
            life: 60,
          });

          // Flash ring
          flashRingsRef.current.push({
            x: mx,
            y: my,
            radius: def.radius * 0.5,
            maxRadius: def.radius * 2.5,
            color: def.color,
            life: 15,
            maxLife: 15,
          });

          // Screen shake scales with tier
          shakeRef.current.intensity = Math.min(3 + newTier * 1.5, 15);

          merged = true;
          break; // restart scan after a merge
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
      const gs = gravShiftRef.current;

      // ── Update ────────────────────────────────────────────────────────

      if (phase === "playing") {
        // Physics substeps
        for (let s = 0; s < PHYSICS_SUBSTEPS; s++) physicsStep();

        // Check merges (multiple passes for chains)
        let mergePass = 0;
        while (checkMerges() && mergePass < 5) mergePass++;

        // Drop cooldown
        if (dropCooldownRef.current > 0) dropCooldownRef.current--;

        // Combo timer
        if (comboTimerRef.current > 0) {
          comboTimerRef.current--;
          if (comboTimerRef.current <= 0) comboRef.current = 0;
        }

        // Gravity shift
        if (gs.active) {
          gs.timer--;
          if (gs.timer <= 0) {
            gs.active = false;
            gs.angle = 0;
          }
        }
        if (gs.charges < GRAVITY_SHIFT_MAX_CHARGES) {
          gs.rechargeTimer++;
          if (gs.rechargeTimer >= GRAVITY_SHIFT_RECHARGE) {
            gs.charges++;
            gs.rechargeTimer = 0;
          }
        }

        // Danger check
        let inDanger = false;
        for (const orb of orbs) {
          if (orb.justDropped > 0) continue;
          if (orb.y - orb.radius < CY + DANGER_Y) {
            inDanger = true;
            break;
          }
        }
        if (inDanger) {
          dangerTimerRef.current++;
          if (dangerTimerRef.current >= DANGER_GRACE) {
            // Game over
            phaseRef.current = "dead";
            setDisplayPhase("dead");
            setDisplayScore(scoreRef.current);

            // Save best
            if (scoreRef.current > bestRef.current) {
              bestRef.current = scoreRef.current;
              setDisplayBest(scoreRef.current);
              try {
                localStorage.setItem(SAVE_KEY, String(scoreRef.current));
              } catch {}
            }

            // Save stats
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
        } else {
          dangerTimerRef.current = Math.max(0, dangerTimerRef.current - 2);
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

      // Container background
      ctx.fillStyle = CONTAINER_BG;
      ctx.beginPath();
      ctx.roundRect(CX - 2, CY - 2, CW + 4, CH + 4, 8);
      ctx.fill();

      // Container border
      ctx.strokeStyle = gs.active
        ? `rgba(34, 211, 238, ${0.5 + 0.3 * Math.sin(frame * 0.15)})`
        : CONTAINER_BORDER;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(CX - 2, CY - 2, CW + 4, CH + 4, 8);
      ctx.stroke();

      // Danger line
      if (phase === "playing") {
        const dangerAlpha =
          dangerTimerRef.current > 0
            ? 0.4 + 0.4 * Math.sin(frame * 0.15)
            : 0.15;
        ctx.strokeStyle = `rgba(239, 68, 68, ${dangerAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(CX + 4, CY + DANGER_Y);
        ctx.lineTo(CR - 4, CY + DANGER_Y);
        ctx.stroke();
        ctx.setLineDash([]);

        if (dangerTimerRef.current > 30) {
          ctx.fillStyle = `rgba(239, 68, 68, ${0.03 + 0.04 * Math.sin(frame * 0.1)})`;
          ctx.fillRect(CX, CY, CW, DANGER_Y);
        }
      }

      // ── Proximity hints (draw before orbs so they appear behind) ───
      if (phase === "playing") {
        for (let i = 0; i < orbs.length; i++) {
          const a = orbs[i];
          if (a.merging || a.tier >= TIERS.length - 1) continue;
          for (let j = i + 1; j < orbs.length; j++) {
            const b = orbs[j];
            if (b.merging || b.tier !== a.tier) continue;
            const d = dist(a.x, a.y, b.x, b.y);
            const mergeThreshold = (a.radius + b.radius) * (1 - MERGE_OVERLAP);
            const hintThreshold = mergeThreshold * 2.2;
            if (d < hintThreshold && d > 0.01) {
              const proximity = 1 - (d - mergeThreshold) / (hintThreshold - mergeThreshold);
              const alpha = Math.max(0, proximity) * 0.4 * (0.7 + 0.3 * Math.sin(frame * 0.12));
              const def = TIERS[a.tier];
              // Glow line between matching orbs
              ctx.strokeStyle = def.color;
              ctx.globalAlpha = alpha;
              ctx.lineWidth = 2 + proximity * 2;
              ctx.setLineDash([4, 4]);
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
              ctx.setLineDash([]);
              ctx.globalAlpha = 1;
            }
          }
        }
      }

      // ── Draw orbs ───────────────────────────────────────────────────
      for (const orb of orbs) {
        const def = TIERS[orb.tier];
        const drawScale = orb.merging
          ? Math.max(0, orb.mergingTimer / MERGE_SHRINK_FRAMES)
          : orb.scaleAnim;
        const r = orb.radius * drawScale;

        if (r < 0.5) continue; // too small to draw

        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.beginPath();
        ctx.ellipse(orb.x, orb.y + r + 3, r * 0.7, r * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glow
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

        // Body gradient
        const bodyGrad = ctx.createRadialGradient(
          orb.x - r * 0.25,
          orb.y - r * 0.25,
          r * 0.1,
          orb.x,
          orb.y,
          r
        );
        bodyGrad.addColorStop(0, "#ffffff");
        bodyGrad.addColorStop(0.3, def.color);
        bodyGrad.addColorStop(1, def.color + "aa");
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Subtle border
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Highlight
        ctx.beginPath();
        ctx.arc(
          orb.x - r * 0.25,
          orb.y - r * 0.3,
          r * 0.25,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fill();

        // Face (only on non-merging orbs that are big enough)
        if (!orb.merging && drawScale > 0.5) {
          drawFace(ctx, orb.x, orb.y, r, orb.tier);
        }
      }

      // ── Flash rings ─────────────────────────────────────────────────
      for (const f of flashRings) {
        const alpha = f.life / f.maxLife;
        ctx.globalAlpha = alpha * 0.6;
        ctx.strokeStyle = f.color;
        ctx.lineWidth = 2 + alpha * 3;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.stroke();
        // Inner white flash
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // ── Particles ───────────────────────────────────────────────────
      for (const p of particles) {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // ── Score popups ────────────────────────────────────────────────
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
        const cx2 = clamp(cursorXRef.current, CX + def.radius + 4, CR - def.radius - 4);

        // Guide line
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cx2, CY + 10);
        ctx.lineTo(cx2, CB);
        ctx.stroke();
        ctx.setLineDash([]);

        // Preview orb
        const previewGrad = ctx.createRadialGradient(
          cx2 - def.radius * 0.2, CY + 10 - def.radius * 0.2,
          def.radius * 0.1, cx2, CY + 10, def.radius
        );
        previewGrad.addColorStop(0, "#ffffff");
        previewGrad.addColorStop(0.3, def.color);
        previewGrad.addColorStop(1, def.color + "88");
        ctx.fillStyle = previewGrad;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(cx2, CY + 10, def.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // ── HUD ─────────────────────────────────────────────────────────
      if (phase === "playing" || phase === "dead") {
        // Score
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = "bold 26px 'Space Grotesk', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(String(scoreRef.current), CX, 38);

        // Best
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.font = "13px 'Space Grotesk', sans-serif";
        ctx.fillText(`Best: ${bestRef.current}`, CX, 58);

        // Combo
        if (comboRef.current > 1) {
          ctx.fillStyle = TIERS[Math.min(comboRef.current, TIERS.length - 1)].color;
          ctx.font = "bold 20px 'Space Grotesk', sans-serif";
          ctx.textAlign = "right";
          ctx.fillText(`×${comboRef.current}`, CR, 38);
        }

        // Gravity shift charges
        ctx.textAlign = "right";
        const gsCharges = gravShiftRef.current.charges;
        for (let i = 0; i < GRAVITY_SHIFT_MAX_CHARGES; i++) {
          const bx = CR - i * 28 - 2;
          const by = 54;
          const filled = i < gsCharges;
          ctx.beginPath();
          ctx.arc(bx, by, 9, 0, Math.PI * 2);
          ctx.fillStyle = filled
            ? "rgba(34, 211, 238, 0.8)"
            : "rgba(34, 211, 238, 0.15)";
          ctx.fill();
          ctx.strokeStyle = "rgba(34, 211, 238, 0.4)";
          ctx.lineWidth = 1;
          ctx.stroke();
          if (filled) {
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.font = "bold 10px 'Space Grotesk', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("⟳", bx, by + 3.5);
          }
        }

        // Next orb preview
        if (phase === "playing") {
          const nextDef = TIERS[nextTierRef.current];
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.font = "12px 'Space Grotesk', sans-serif";
          ctx.textAlign = "left";
          ctx.fillText("Next", CX, CB + 24);

          ctx.fillStyle = nextDef.color;
          ctx.beginPath();
          ctx.arc(CX + 50, CB + 20, nextDef.radius * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Highest tier badge
        if (highestTierRef.current > 0) {
          const htDef = TIERS[highestTierRef.current];
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.font = "12px 'Space Grotesk', sans-serif";
          ctx.textAlign = "right";
          ctx.fillText("Max", CR, CB + 24);

          ctx.fillStyle = htDef.color;
          ctx.beginPath();
          ctx.arc(CR - 40, CB + 20, htDef.radius * 0.4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.font = "bold 10px 'Space Grotesk', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(htDef.name, CR - 40, CB + 38);
        }
      }

      // ── Menu title screen ───────────────────────────────────────────
      if (phase === "menu") {
        // Animated demo orbs bouncing in container
        const t = frame * 0.02;
        for (let i = 0; i < 6; i++) {
          const tier = i;
          const def = TIERS[tier];
          const ox = CX + CW * 0.2 + (CW * 0.6 * i) / 5;
          const oy =
            CY + CH * 0.5 +
            Math.sin(t + i * 1.2) * 40 +
            Math.cos(t * 0.7 + i) * 20;

          // Glow
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
        }

        // Title
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 38px 'DM Serif Display', serif";
        ctx.textAlign = "center";
        ctx.fillText("Orb Merge", CANVAS_W / 2, CY + 80);

        // Subtitle
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "15px 'Space Grotesk', sans-serif";
        ctx.fillText("Drop. Match. Merge.", CANVAS_W / 2, CY + 108);

        // Best score
        if (bestRef.current > 0) {
          ctx.fillStyle = "rgba(255,255,255,0.35)";
          ctx.font = "14px 'Space Grotesk', sans-serif";
          ctx.fillText(`Best: ${bestRef.current}`, CANVAS_W / 2, CY + CH - 40);
        }
      }

      ctx.restore(); // shake transform
    }

    loop();
    return () => cancelAnimationFrame(rafRef.current);
  }, [physicsStep, checkMerges]);

  // ── Pointer tracking ───────────────────────────────────────────────────
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (phaseRef.current !== "playing") return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
      cursorXRef.current = clamp(x, CX + 10, CR - 10);
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
        // Update cursor position first
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const x = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
          cursorXRef.current = clamp(x, CX + 10, CR - 10);
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
      if (e.code === "KeyG" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
        activateGravityShift();
      }
      if (e.code === "ArrowLeft") {
        cursorXRef.current = clamp(cursorXRef.current - 8, CX + 10, CR - 10);
      }
      if (e.code === "ArrowRight") {
        cursorXRef.current = clamp(cursorXRef.current + 8, CX + 10, CR - 10);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [resetGame, dropOrb, activateGravityShift]);

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
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-20 pointer-events-none">
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

        {/* Gravity shift button */}
        {displayPhase === "playing" && (
          <button
            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-body hover:bg-cyan-500/30 transition-colors pointer-events-auto"
            onPointerDown={(e) => {
              e.stopPropagation();
              activateGravityShift();
            }}
          >
            Shift ⟳
          </button>
        )}
      </div>

      <p className="text-text-dim text-sm max-w-md text-center">
        Drop orbs to merge matching colors into bigger tiers. Use{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-xs">Shift</kbd>{" "}
        to flip gravity and trigger cascades. Don&apos;t let them overflow!
      </p>
    </section>
  );
}
