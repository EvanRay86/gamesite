"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ── Constants ────────────────────────────────────────────────────────────────

const CANVAS_W = 440;
const CANVAS_H = 700;
const GRAVITY = 0.25;
const FRICTION = 0.995;
const RESTITUTION_WALL = 0.35;
const RESTITUTION_ORB = 0.25;
const SLEEP_THRESHOLD = 0.15;
const MERGE_OVERLAP = 0.25; // fraction of radius overlap needed
const DROP_COOLDOWN = 28; // frames (~0.47s at 60fps)
const DANGER_Y = 155; // y-position of danger line (relative to container top)
const DANGER_GRACE = 90; // frames above danger line before game over
const COMBO_WINDOW = 120; // frames to chain combos (~2s)
const GRAVITY_SHIFT_DURATION = 180; // frames (~3s)
const GRAVITY_SHIFT_MAX_CHARGES = 3;
const GRAVITY_SHIFT_RECHARGE = 1800; // frames (~30s)
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
  justDropped: number; // frames since drop (ignore danger line briefly)
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
      justDropped: 60, // ~1s grace period
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

      // Apply gravity
      orb.vx += gx;
      orb.vy += gy;

      // Apply friction
      orb.vx *= FRICTION;
      orb.vy *= FRICTION;

      // Sleep
      if (Math.abs(orb.vx) < SLEEP_THRESHOLD && Math.abs(orb.vy) < SLEEP_THRESHOLD) {
        // Only sleep vy if resting on bottom
        if (orb.y + orb.radius >= CB - 2) {
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
        }
      }
    }
  }, []);

  // ── Check merges ───────────────────────────────────────────────────────
  const checkMerges = useCallback(() => {
    const orbs = orbsRef.current;
    let merged = false;

    for (let i = 0; i < orbs.length; i++) {
      const a = orbs[i];
      if (a.merging || a.tier >= TIERS.length - 1) continue;

      for (let j = i + 1; j < orbs.length; j++) {
        const b = orbs[j];
        if (b.merging || b.tier !== a.tier) continue;

        const d = dist(a.x, a.y, b.x, b.y);
        const mergeThreshold = (a.radius + b.radius) * (1 - MERGE_OVERLAP);

        if (d < mergeThreshold) {
          // Merge! Create new orb at midpoint
          const newTier = a.tier + 1;
          const def = TIERS[newTier];
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;

          a.merging = true;
          b.merging = true;

          orbs.push({
            id: nextIdRef.current++,
            x: mx,
            y: my,
            vx: (a.vx + b.vx) * 0.3,
            vy: (a.vy + b.vy) * 0.3 - 1,
            tier: newTier,
            radius: def.radius,
            merging: false,
            justDropped: 10,
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

          // Effects
          spawnBurst(mx, my, 12 + newTier * 3, def.color, 2 + newTier * 0.5);
          popupsRef.current.push({
            x: mx,
            y: my,
            text: combo > 1 ? `+${totalPoints} ×${combo}` : `+${totalPoints}`,
            color: def.color,
            life: 60,
          });

          // Screen shake scales with tier
          shakeRef.current.intensity = Math.min(3 + newTier * 1.5, 15);

          merged = true;
          break; // restart scan after a merge
        }
      }
      if (merged) break;
    }

    // Remove merged orbs
    orbsRef.current = orbs.filter((o) => !o.merging);

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
      const shake = shakeRef.current;
      const gs = gravShiftRef.current;

      // ── Update ────────────────────────────────────────────────────────

      if (phase === "playing") {
        // Physics (2 sub-steps)
        physicsStep();
        physicsStep();

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

      // ── Draw orbs ───────────────────────────────────────────────────
      for (const orb of orbs) {
        const def = TIERS[orb.tier];

        // Glow
        const glowGrad = ctx.createRadialGradient(
          orb.x, orb.y, orb.radius * 0.3,
          orb.x, orb.y, orb.radius * 1.6
        );
        glowGrad.addColorStop(0, def.glow);
        glowGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius * 1.6, 0, Math.PI * 2);
        ctx.fill();

        // Body gradient
        const bodyGrad = ctx.createRadialGradient(
          orb.x - orb.radius * 0.25,
          orb.y - orb.radius * 0.25,
          orb.radius * 0.1,
          orb.x,
          orb.y,
          orb.radius
        );
        bodyGrad.addColorStop(0, "#ffffff");
        bodyGrad.addColorStop(0.3, def.color);
        bodyGrad.addColorStop(1, def.color + "aa");
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle border
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Highlight
        ctx.beginPath();
        ctx.arc(
          orb.x - orb.radius * 0.25,
          orb.y - orb.radius * 0.3,
          orb.radius * 0.25,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fill();

        // Tier number (for larger orbs)
        if (orb.tier >= 3) {
          ctx.fillStyle = "rgba(255,255,255,0.8)";
          ctx.font = `bold ${Math.max(10, orb.radius * 0.45)}px 'Space Grotesk', sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(orb.tier + 1), orb.x, orb.y + 1);
        }
      }

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
