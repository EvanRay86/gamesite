"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface Star {
  x: number;
  y: number;
  speed: number;
  brightness: number;
  size: number;
}

interface Bullet {
  x: number;
  y: number;
  vy: number;
  vx: number;
  color: string;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  rotation: number;
  rotSpeed: number;
  color: string;
  points: number;
}

interface PowerUp {
  x: number;
  y: number;
  vy: number;
  type: "shield" | "rapid" | "spread" | "nuke";
  pulse: number;
}

interface Ship {
  x: number;
  y: number;
  width: number;
  height: number;
  shieldTimer: number;
  rapidTimer: number;
  spreadTimer: number;
  invincible: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CANVAS_W = 400;
const CANVAS_H = 600;
const SHIP_W = 32;
const SHIP_H = 36;
const SHOOT_INTERVAL = 180;
const RAPID_SHOOT_INTERVAL = 80;
const SAVE_KEY = "meteor-mayhem-best";

const METEOR_COLORS = ["#FF6B6B", "#F7B731", "#A855F7", "#45B7D1", "#FF8C42"];
const POWERUP_COLORS: Record<string, string> = {
  shield: "#4ECDC4",
  rapid: "#F7B731",
  spread: "#A855F7",
  nuke: "#FF6B6B",
};
const POWERUP_ICONS: Record<string, string> = {
  shield: "S",
  rapid: "R",
  spread: "W",
  nuke: "!",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MeteorMayhem() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "over">("menu");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wave, setWave] = useState(1);

  // Refs for game loop
  const stateRef = useRef(gameState);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const waveRef = useRef(1);
  const shipRef = useRef<Ship>({
    x: CANVAS_W / 2,
    y: CANVAS_H - 60,
    width: SHIP_W,
    height: SHIP_H,
    shieldTimer: 0,
    rapidTimer: 0,
    spreadTimer: 0,
    invincible: 0,
  });
  const bulletsRef = useRef<Bullet[]>([]);
  const meteorsRef = useRef<Meteor[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const shootTimerRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const frameRef = useRef(0);
  const animRef = useRef<number>(0);
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const screenShakeRef = useRef(0);

  // Load best score
  useEffect(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  // Sync refs
  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  const addScore = useCallback((pts: number) => {
    const multiplier = 1 + Math.floor(comboRef.current / 5) * 0.5;
    const total = Math.round(pts * multiplier);
    scoreRef.current += total;
    comboRef.current += 1;
    setScore(scoreRef.current);
    setCombo(comboRef.current);
  }, []);

  const spawnParticles = useCallback(
    (x: number, y: number, color: string, count: number, speed = 3) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const s = randomBetween(0.5, speed);
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * s,
          vy: Math.sin(angle) * s,
          life: randomBetween(20, 40),
          maxLife: 40,
          color,
          size: randomBetween(1.5, 4),
        });
      }
    },
    [],
  );

  const spawnMeteor = useCallback(() => {
    const w = waveRef.current;
    const big = Math.random() < 0.15 + w * 0.02;
    const radius = big ? randomBetween(28, 40) : randomBetween(12, 22);
    const hp = big ? 3 + Math.floor(w / 3) : 1;
    const speed = randomBetween(1, 2 + w * 0.3);
    const color = METEOR_COLORS[Math.floor(Math.random() * METEOR_COLORS.length)];

    meteorsRef.current.push({
      x: randomBetween(radius, CANVAS_W - radius),
      y: -radius,
      vx: randomBetween(-0.8, 0.8),
      vy: speed,
      radius,
      hp,
      maxHp: hp,
      rotation: 0,
      rotSpeed: randomBetween(-0.03, 0.03),
      color,
      points: big ? 50 : 10,
    });
  }, []);

  const endGame = useCallback(() => {
    setGameState("over");
    stateRef.current = "over";
    const best = Math.max(scoreRef.current, parseInt(localStorage.getItem(SAVE_KEY) || "0", 10));
    localStorage.setItem(SAVE_KEY, String(best));
    setBestScore(best);
  }, []);

  const startGame = useCallback(() => {
    scoreRef.current = 0;
    comboRef.current = 0;
    waveRef.current = 1;
    setScore(0);
    setCombo(0);
    setWave(1);
    shipRef.current = {
      x: CANVAS_W / 2,
      y: CANVAS_H - 60,
      width: SHIP_W,
      height: SHIP_H,
      shieldTimer: 0,
      rapidTimer: 0,
      spreadTimer: 0,
      invincible: 120,
    };
    bulletsRef.current = [];
    meteorsRef.current = [];
    powerUpsRef.current = [];
    particlesRef.current = [];
    shootTimerRef.current = 0;
    spawnTimerRef.current = 0;
    frameRef.current = 0;
    screenShakeRef.current = 0;
    setGameState("playing");
    stateRef.current = "playing";
  }, []);

  // Init stars
  useEffect(() => {
    starsRef.current = Array.from({ length: 80 }, () => ({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      speed: randomBetween(0.3, 1.5),
      brightness: randomBetween(0.3, 1),
      size: randomBetween(0.5, 2),
    }));
  }, []);

  // Keyboard input
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === " " || e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
      if (e.key === "Enter" && stateRef.current !== "playing") startGame();
    };
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [startGame]);

  // Touch input
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getPos = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const touch = e.touches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    };

    const onStart = (e: TouchEvent) => {
      e.preventDefault();
      touchRef.current = getPos(e);
      if (stateRef.current !== "playing") startGame();
    };
    const onMove = (e: TouchEvent) => {
      e.preventDefault();
      touchRef.current = getPos(e);
    };
    const onEnd = (e: TouchEvent) => {
      e.preventDefault();
      touchRef.current = null;
    };

    canvas.addEventListener("touchstart", onStart, { passive: false });
    canvas.addEventListener("touchmove", onMove, { passive: false });
    canvas.addEventListener("touchend", onEnd, { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", onStart);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("touchend", onEnd);
    };
  }, [startGame]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const loop = () => {
      animRef.current = requestAnimationFrame(loop);
      frameRef.current++;
      const frame = frameRef.current;

      // ── Update stars ─────────────────────────────────────────────────
      for (const star of starsRef.current) {
        star.y += star.speed;
        if (star.y > CANVAS_H) {
          star.y = 0;
          star.x = Math.random() * CANVAS_W;
        }
      }

      if (stateRef.current !== "playing") {
        // Draw idle screen
        ctx.fillStyle = "#0a0a1a";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        for (const star of starsRef.current) {
          ctx.globalAlpha = star.brightness * (0.5 + 0.5 * Math.sin(frame * 0.02 + star.x));
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        if (stateRef.current === "menu") {
          // Title
          ctx.fillStyle = "#FF6B6B";
          ctx.font = "bold 36px 'Outfit', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("METEOR", CANVAS_W / 2, CANVAS_H / 2 - 60);
          ctx.fillStyle = "#F7B731";
          ctx.fillText("MAYHEM", CANVAS_W / 2, CANVAS_H / 2 - 20);

          // Subtitle
          ctx.fillStyle = "rgba(255,255,255,0.6)";
          ctx.font = "14px 'Outfit', sans-serif";
          ctx.fillText("Blast asteroids. Chase high scores.", CANVAS_W / 2, CANVAS_H / 2 + 20);

          // CTA
          const pulse = 0.7 + 0.3 * Math.sin(frame * 0.06);
          ctx.globalAlpha = pulse;
          ctx.fillStyle = "#4ECDC4";
          ctx.font = "bold 18px 'Outfit', sans-serif";
          ctx.fillText("TAP OR PRESS ENTER", CANVAS_W / 2, CANVAS_H / 2 + 70);
          ctx.globalAlpha = 1;

          // Controls hint
          ctx.fillStyle = "rgba(255,255,255,0.35)";
          ctx.font = "12px 'Outfit', sans-serif";
          ctx.fillText("Arrow keys / WASD to move • Auto-fire", CANVAS_W / 2, CANVAS_H / 2 + 100);
        }

        if (stateRef.current === "over") {
          // Overlay
          ctx.fillStyle = "rgba(0,0,0,0.7)";
          ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

          ctx.fillStyle = "#FF6B6B";
          ctx.font = "bold 32px 'Outfit', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("GAME OVER", CANVAS_W / 2, CANVAS_H / 2 - 70);

          ctx.fillStyle = "#fff";
          ctx.font = "bold 48px 'Outfit', sans-serif";
          ctx.fillText(String(scoreRef.current), CANVAS_W / 2, CANVAS_H / 2 - 20);

          ctx.fillStyle = "rgba(255,255,255,0.5)";
          ctx.font = "14px 'Outfit', sans-serif";
          ctx.fillText(`BEST: ${Math.max(scoreRef.current, parseInt(localStorage.getItem(SAVE_KEY) || "0", 10))}`, CANVAS_W / 2, CANVAS_H / 2 + 15);

          ctx.fillText(`Wave ${waveRef.current} • Max combo: ${comboRef.current}x`, CANVAS_W / 2, CANVAS_H / 2 + 45);

          const pulse = 0.7 + 0.3 * Math.sin(frame * 0.06);
          ctx.globalAlpha = pulse;
          ctx.fillStyle = "#F7B731";
          ctx.font = "bold 20px 'Outfit', sans-serif";
          ctx.fillText("PLAY AGAIN", CANVAS_W / 2, CANVAS_H / 2 + 90);
          ctx.globalAlpha = 1;

          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.font = "12px 'Outfit', sans-serif";
          ctx.fillText("Tap or press Enter", CANVAS_W / 2, CANVAS_H / 2 + 115);
        }

        return;
      }

      // ── PLAYING ───────────────────────────────────────────────────────
      const ship = shipRef.current;
      const keys = keysRef.current;
      const speed = 5;

      // Ship movement
      if (touchRef.current) {
        const tx = touchRef.current.x;
        const ty = touchRef.current.y;
        const dx = tx - ship.x;
        const dy = ty - ship.y;
        const d = Math.hypot(dx, dy);
        if (d > 3) {
          ship.x += (dx / d) * Math.min(speed + 1, d);
          ship.y += (dy / d) * Math.min(speed + 1, d);
        }
      } else {
        if (keys.has("ArrowLeft") || keys.has("a")) ship.x -= speed;
        if (keys.has("ArrowRight") || keys.has("d")) ship.x += speed;
        if (keys.has("ArrowUp") || keys.has("w")) ship.y -= speed;
        if (keys.has("ArrowDown") || keys.has("s")) ship.y += speed;
      }
      ship.x = clamp(ship.x, ship.width / 2, CANVAS_W - ship.width / 2);
      ship.y = clamp(ship.y, ship.height / 2, CANVAS_H - ship.height / 2);

      // Timers
      if (ship.shieldTimer > 0) ship.shieldTimer--;
      if (ship.rapidTimer > 0) ship.rapidTimer--;
      if (ship.spreadTimer > 0) ship.spreadTimer--;
      if (ship.invincible > 0) ship.invincible--;
      if (screenShakeRef.current > 0) screenShakeRef.current--;

      // Auto-fire
      const interval = ship.rapidTimer > 0 ? RAPID_SHOOT_INTERVAL : SHOOT_INTERVAL;
      shootTimerRef.current++;
      if (shootTimerRef.current >= interval) {
        shootTimerRef.current = 0;
        if (ship.spreadTimer > 0) {
          bulletsRef.current.push(
            { x: ship.x, y: ship.y - ship.height / 2, vy: -7, vx: 0, color: "#A855F7" },
            { x: ship.x, y: ship.y - ship.height / 2, vy: -6.8, vx: -2, color: "#A855F7" },
            { x: ship.x, y: ship.y - ship.height / 2, vy: -6.8, vx: 2, color: "#A855F7" },
          );
        } else {
          bulletsRef.current.push({
            x: ship.x,
            y: ship.y - ship.height / 2,
            vy: -7,
            vx: 0,
            color: ship.rapidTimer > 0 ? "#F7B731" : "#4ECDC4",
          });
        }
      }

      // Wave progression
      if (frame % 1200 === 0 && frame > 0) {
        waveRef.current++;
        setWave(waveRef.current);
      }

      // Spawn meteors
      const spawnRate = Math.max(20, 60 - waveRef.current * 5);
      spawnTimerRef.current++;
      if (spawnTimerRef.current >= spawnRate) {
        spawnTimerRef.current = 0;
        spawnMeteor();
      }

      // Update bullets
      bulletsRef.current = bulletsRef.current.filter((b) => {
        b.x += b.vx;
        b.y += b.vy;
        return b.y > -10 && b.x > -10 && b.x < CANVAS_W + 10;
      });

      // Update meteors
      meteorsRef.current = meteorsRef.current.filter((m) => {
        m.x += m.vx;
        m.y += m.vy;
        m.rotation += m.rotSpeed;
        // Bounce off walls
        if (m.x - m.radius < 0 || m.x + m.radius > CANVAS_W) m.vx *= -1;
        return m.y < CANVAS_H + m.radius + 10;
      });

      // Update power-ups
      powerUpsRef.current = powerUpsRef.current.filter((p) => {
        p.y += p.vy;
        p.pulse += 0.08;
        return p.y < CANVAS_H + 20;
      });

      // Update particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.life--;
        return p.life > 0;
      });

      // ── Collisions: bullets vs meteors ────────────────────────────────
      for (let bi = bulletsRef.current.length - 1; bi >= 0; bi--) {
        const b = bulletsRef.current[bi];
        for (let mi = meteorsRef.current.length - 1; mi >= 0; mi--) {
          const m = meteorsRef.current[mi];
          if (dist(b.x, b.y, m.x, m.y) < m.radius + 4) {
            bulletsRef.current.splice(bi, 1);
            m.hp--;
            spawnParticles(b.x, b.y, m.color, 4, 2);
            if (m.hp <= 0) {
              spawnParticles(m.x, m.y, m.color, 12, 4);
              addScore(m.points);
              // Drop power-up chance
              if (Math.random() < 0.12) {
                const types: PowerUp["type"][] = ["shield", "rapid", "spread", "nuke"];
                powerUpsRef.current.push({
                  x: m.x,
                  y: m.y,
                  vy: 1.5,
                  type: types[Math.floor(Math.random() * types.length)],
                  pulse: 0,
                });
              }
              meteorsRef.current.splice(mi, 1);
            }
            break;
          }
        }
      }

      // ── Collisions: ship vs power-ups ─────────────────────────────────
      for (let pi = powerUpsRef.current.length - 1; pi >= 0; pi--) {
        const p = powerUpsRef.current[pi];
        if (dist(ship.x, ship.y, p.x, p.y) < 24) {
          powerUpsRef.current.splice(pi, 1);
          spawnParticles(p.x, p.y, POWERUP_COLORS[p.type], 10, 3);
          if (p.type === "shield") ship.shieldTimer = 360;
          else if (p.type === "rapid") ship.rapidTimer = 360;
          else if (p.type === "spread") ship.spreadTimer = 360;
          else if (p.type === "nuke") {
            // Destroy all meteors on screen
            for (const m of meteorsRef.current) {
              spawnParticles(m.x, m.y, m.color, 8, 4);
              addScore(m.points);
            }
            meteorsRef.current = [];
            screenShakeRef.current = 15;
          }
        }
      }

      // ── Collisions: ship vs meteors ───────────────────────────────────
      if (ship.invincible <= 0) {
        for (const m of meteorsRef.current) {
          if (dist(ship.x, ship.y, m.x, m.y) < m.radius + 14) {
            if (ship.shieldTimer > 0) {
              // Shield absorbs hit
              ship.shieldTimer = 0;
              spawnParticles(ship.x, ship.y, "#4ECDC4", 20, 5);
              m.hp = 0;
              spawnParticles(m.x, m.y, m.color, 10, 4);
              meteorsRef.current = meteorsRef.current.filter((mm) => mm !== m);
              screenShakeRef.current = 8;
            } else {
              // Death
              spawnParticles(ship.x, ship.y, "#FF6B6B", 30, 6);
              spawnParticles(ship.x, ship.y, "#F7B731", 20, 5);
              screenShakeRef.current = 20;
              endGame();
            }
            break;
          }
        }
      }

      // Reset combo on miss (meteor passes bottom)
      // (handled by meteor filter above — when meteor goes off screen, we keep combo for now
      // but we break combo if no hits for 120 frames)

      // ── DRAW ──────────────────────────────────────────────────────────
      ctx.save();

      // Screen shake
      if (screenShakeRef.current > 0) {
        const intensity = screenShakeRef.current * 0.5;
        ctx.translate(randomBetween(-intensity, intensity), randomBetween(-intensity, intensity));
      }

      // Background
      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(-5, -5, CANVAS_W + 10, CANVAS_H + 10);

      // Stars
      for (const star of starsRef.current) {
        ctx.globalAlpha = star.brightness * (0.5 + 0.5 * Math.sin(frame * 0.02 + star.x));
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Particles
      for (const p of particlesRef.current) {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Power-ups
      for (const p of powerUpsRef.current) {
        const glow = 0.5 + 0.5 * Math.sin(p.pulse);
        ctx.save();
        ctx.translate(p.x, p.y);

        // Glow
        ctx.shadowColor = POWERUP_COLORS[p.type];
        ctx.shadowBlur = 12 + glow * 8;
        ctx.fillStyle = POWERUP_COLORS[p.type];
        ctx.beginPath();
        ctx.arc(0, 0, 10 + glow * 2, 0, Math.PI * 2);
        ctx.fill();

        // Icon
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px 'Outfit', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(POWERUP_ICONS[p.type], 0, 0);
        ctx.restore();
      }

      // Meteors
      for (const m of meteorsRef.current) {
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(m.rotation);

        // Glow
        ctx.shadowColor = m.color;
        ctx.shadowBlur = 8;

        // Body (jagged circle)
        ctx.fillStyle = m.color;
        ctx.beginPath();
        const segments = 8;
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          const jag = m.radius * (0.8 + 0.2 * Math.sin(angle * 3 + m.rotation));
          const px = Math.cos(angle) * jag;
          const py = Math.sin(angle) * jag;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // HP indicator (darker craters for damaged)
        if (m.hp < m.maxHp) {
          ctx.fillStyle = "rgba(0,0,0,0.3)";
          const craters = m.maxHp - m.hp;
          for (let c = 0; c < craters; c++) {
            const ca = (c / m.maxHp) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(Math.cos(ca) * m.radius * 0.4, Math.sin(ca) * m.radius * 0.4, m.radius * 0.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Bullets
      for (const b of bulletsRef.current) {
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 6;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x - 2, b.y - 6, 4, 12);
        ctx.shadowBlur = 0;
      }

      // Ship
      if (stateRef.current === "playing") {
        ctx.save();
        ctx.translate(ship.x, ship.y);

        // Blink during invincibility
        if (ship.invincible > 0 && Math.floor(frame / 4) % 2 === 0) {
          ctx.globalAlpha = 0.3;
        }

        // Engine glow
        ctx.shadowColor = "#4ECDC4";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "#4ECDC4";
        ctx.beginPath();
        ctx.moveTo(-6, ship.height / 2 - 4);
        ctx.lineTo(0, ship.height / 2 + 6 + Math.random() * 6);
        ctx.lineTo(6, ship.height / 2 - 4);
        ctx.closePath();
        ctx.fill();

        // Hull
        ctx.shadowColor = "#fff";
        ctx.shadowBlur = 4;
        ctx.fillStyle = "#e0e0e0";
        ctx.beginPath();
        ctx.moveTo(0, -ship.height / 2);
        ctx.lineTo(-ship.width / 2, ship.height / 2);
        ctx.lineTo(-ship.width / 4, ship.height / 3);
        ctx.lineTo(ship.width / 4, ship.height / 3);
        ctx.lineTo(ship.width / 2, ship.height / 2);
        ctx.closePath();
        ctx.fill();

        // Cockpit
        ctx.fillStyle = "#4ECDC4";
        ctx.beginPath();
        ctx.arc(0, -2, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Shield bubble
        if (ship.shieldTimer > 0) {
          const flickering = ship.shieldTimer < 60 && Math.floor(frame / 6) % 2 === 0;
          if (!flickering) {
            ctx.strokeStyle = "rgba(78, 205, 196, 0.5)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 24, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // ── HUD ─────────────────────────────────────────────────────────
      // Score
      ctx.fillStyle = "#fff";
      ctx.font = "bold 20px 'Outfit', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(String(scoreRef.current), 12, 30);

      // Combo
      if (comboRef.current >= 5) {
        const comboColor = comboRef.current >= 20 ? "#FF6B6B" : comboRef.current >= 10 ? "#F7B731" : "#4ECDC4";
        ctx.fillStyle = comboColor;
        ctx.font = "bold 14px 'Outfit', sans-serif";
        ctx.fillText(`${comboRef.current}x COMBO`, 12, 50);
      }

      // Wave
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "12px 'Outfit', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`WAVE ${waveRef.current}`, CANVAS_W - 12, 30);

      // Power-up indicators
      let iconY = 50;
      if (ship.rapidTimer > 0) {
        ctx.fillStyle = "#F7B731";
        ctx.font = "bold 11px 'Outfit', sans-serif";
        ctx.fillText(`RAPID ${Math.ceil(ship.rapidTimer / 60)}s`, CANVAS_W - 12, iconY);
        iconY += 16;
      }
      if (ship.spreadTimer > 0) {
        ctx.fillStyle = "#A855F7";
        ctx.font = "bold 11px 'Outfit', sans-serif";
        ctx.fillText(`SPREAD ${Math.ceil(ship.spreadTimer / 60)}s`, CANVAS_W - 12, iconY);
        iconY += 16;
      }
      if (ship.shieldTimer > 0) {
        ctx.fillStyle = "#4ECDC4";
        ctx.font = "bold 11px 'Outfit', sans-serif";
        ctx.fillText(`SHIELD ${Math.ceil(ship.shieldTimer / 60)}s`, CANVAS_W - 12, iconY);
      }

      ctx.restore();
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [addScore, endGame, spawnMeteor, spawnParticles]);

  return (
    <div className="mx-auto max-w-[960px] px-4 py-10">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-border-light p-6 sm:p-8 mb-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-body text-2xl sm:text-3xl font-bold text-text-primary">
              Meteor Mayhem
            </h1>
            <p className="mt-1 text-text-muted text-sm">
              Blast meteors, grab power-ups, chase your high score.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-text-dim uppercase tracking-wider">Best</div>
              <div className="text-xl font-bold text-coral">{bestScore}</div>
            </div>
            {gameState === "playing" && (
              <>
                <div className="text-right">
                  <div className="text-xs text-text-dim uppercase tracking-wider">Score</div>
                  <div className="text-xl font-bold text-text-primary">{score}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-text-dim uppercase tracking-wider">Wave</div>
                  <div className="text-xl font-bold text-amber">{wave}</div>
                </div>
                {combo >= 5 && (
                  <div className="text-right">
                    <div className="text-xs text-text-dim uppercase tracking-wider">Combo</div>
                    <div className={`text-xl font-bold ${combo >= 20 ? "text-coral" : combo >= 10 ? "text-amber" : "text-teal"}`}>
                      {combo}x
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="rounded-2xl border-2 border-border-light shadow-lg max-w-full"
          style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}`, width: "100%", maxWidth: CANVAS_W }}
        />
      </div>

      {/* Controls hint */}
      <div className="mt-4 text-center text-xs text-text-dim">
        <span className="hidden sm:inline">Arrow keys or WASD to move • Auto-fire enabled • Collect power-ups for shields, rapid fire &amp; spread shots</span>
        <span className="sm:hidden">Tap &amp; drag to move • Auto-fire enabled</span>
      </div>
    </div>
  );
}
