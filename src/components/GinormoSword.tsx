"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import {
  CANVAS_W,
  CANVAS_H,
  GROUND_Y,
  SWING_SPEED,
  SWING_ARC,
  SPAWN_INTERVAL,
  MAX_ENEMIES,
  HP_PER_LEVEL,
  BASE_STATS,
  UPGRADES,
  AREAS,
  xpForLevel,
  upgradeCost,
  type PlayerState,
  type PlayerStats,
  type Enemy,
  type EnemyTemplate,
  type GoldDrop,
  type DamageNumber,
} from "@/lib/ginormo-sword-data";

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(ax - bx, ay - by);
}

function lineCircleIntersect(
  x1: number, y1: number, x2: number, y2: number,
  cx: number, cy: number, r: number, lineWidth: number,
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - cx;
  const fy = y1 - cy;
  const effectiveR = r + lineWidth / 2;
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - effectiveR * effectiveR;
  let disc = b * b - 4 * a * c;
  if (disc < 0) return false;
  disc = Math.sqrt(disc);
  const t1 = (-b - disc) / (2 * a);
  const t2 = (-b + disc) / (2 * a);
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1) || (t1 < 0 && t2 > 1);
}

// ── Component ───────────────────────────────────────────────────────────────

type Screen = "title" | "play" | "shop" | "gameover";

export default function GinormoSword() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [screen, setScreen] = useState<Screen>("title");
  const [currentArea, setCurrentArea] = useState(0);
  const [unlockedAreas, setUnlockedAreas] = useState<boolean[]>(() =>
    AREAS.map((_, i) => i === 0),
  );
  const [upgradeLevels, setUpgradeLevels] = useState<number[]>(() =>
    UPGRADES.map(() => 0),
  );
  const [totalGold, setTotalGold] = useState(0);

  // Mutable game state refs (not in React state to avoid re-renders each frame)
  const playerRef = useRef<PlayerState>(makePlayer());
  const enemiesRef = useRef<Enemy[]>([]);
  const goldsRef = useRef<GoldDrop[]>([]);
  const dmgNumbersRef = useRef<DamageNumber[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const spawnTimerRef = useRef(0);
  const hitEnemiesRef = useRef<Set<Enemy>>(new Set());

  function computeStats(): PlayerStats {
    const s = { ...BASE_STATS };
    for (let i = 0; i < UPGRADES.length; i++) {
      const u = UPGRADES[i];
      (s[u.key] as number) += u.perLevel * upgradeLevels[i];
    }
    // level bonuses
    const p = playerRef.current;
    s.maxHp += HP_PER_LEVEL * (p.level - 1);
    s.attack += Math.floor(p.level * 0.5);
    return s;
  }

  function makePlayer(): PlayerState {
    return {
      x: CANVAS_W / 2,
      y: GROUND_Y - 20,
      hp: BASE_STATS.maxHp,
      gold: 0,
      xp: 0,
      level: 1,
      facing: 0,
      swinging: false,
      swingAngle: 0,
      swingDir: 1,
      invincibleTimer: 0,
      stats: { ...BASE_STATS },
    };
  }

  function spawnEnemy() {
    const area = AREAS[currentArea];
    const template: EnemyTemplate =
      area.enemies[Math.floor(Math.random() * area.enemies.length)];
    const side = Math.random() < 0.5 ? -30 : CANVAS_W + 30;
    const e: Enemy = {
      x: side,
      y: GROUND_Y - template.size - Math.random() * 40,
      hp: template.hp,
      maxHp: template.hp,
      attack: template.attack,
      speed: template.speed,
      gold: template.gold,
      size: template.size,
      color: template.color,
      name: template.name,
      xpReward: template.xpReward,
      knockbackX: 0,
      knockbackY: 0,
      flashTimer: 0,
      dead: false,
      deathTimer: 0,
    };
    enemiesRef.current.push(e);
  }

  // ── Game loop ─────────────────────────────────────────────────────────────

  const gameLoop = useCallback(
    (ctx: CanvasRenderingContext2D, dt: number) => {
      const p = playerRef.current;
      const keys = keysRef.current;
      const area = AREAS[currentArea];

      // Recompute stats each frame (cheap)
      p.stats = computeStats();

      // ── Input & Movement ──────────────────────────────────────────────
      let dx = 0;
      let dy = 0;
      if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
      if (keys.has("arrowright") || keys.has("d")) dx += 1;
      if (keys.has("arrowup") || keys.has("w")) dy -= 1;
      if (keys.has("arrowdown") || keys.has("s")) dy += 1;
      const mag = Math.hypot(dx, dy) || 1;
      p.x += (dx / mag) * p.stats.speed * dt;
      p.y += (dy / mag) * p.stats.speed * dt;
      p.x = clamp(p.x, 20, CANVAS_W - 20);
      p.y = clamp(p.y, GROUND_Y - 120, GROUND_Y - 10);

      if (dx !== 0 || dy !== 0) {
        p.facing = Math.atan2(dy, dx);
      }

      // ── Swing ─────────────────────────────────────────────────────────
      if (
        (keys.has(" ") || keys.has("j")) &&
        !p.swinging
      ) {
        p.swinging = true;
        p.swingAngle = 0;
        p.swingDir = 1;
        hitEnemiesRef.current.clear();
      }

      if (p.swinging) {
        p.swingAngle += SWING_SPEED * dt;
        if (p.swingAngle >= SWING_ARC) {
          p.swinging = false;
          p.swingAngle = 0;
        }
      }

      // ── HP regen ──────────────────────────────────────────────────────
      p.hp = Math.min(p.stats.maxHp, p.hp + p.stats.hpRegen * dt);

      // ── Invincibility ─────────────────────────────────────────────────
      if (p.invincibleTimer > 0) p.invincibleTimer -= dt;

      // ── Spawn enemies ─────────────────────────────────────────────────
      spawnTimerRef.current -= dt;
      if (
        spawnTimerRef.current <= 0 &&
        enemiesRef.current.length < MAX_ENEMIES
      ) {
        spawnEnemy();
        spawnTimerRef.current = SPAWN_INTERVAL;
      }

      // ── Update enemies ────────────────────────────────────────────────
      const swordTipAngle = p.swinging
        ? p.facing - SWING_ARC / 2 + p.swingAngle
        : p.facing;
      const swordX1 = p.x;
      const swordY1 = p.y;
      const swordX2 = p.x + Math.cos(swordTipAngle) * p.stats.swordLength;
      const swordY2 = p.y + Math.sin(swordTipAngle) * p.stats.swordLength;

      for (const e of enemiesRef.current) {
        if (e.dead) {
          e.deathTimer -= dt;
          continue;
        }

        // knockback
        if (Math.abs(e.knockbackX) > 0.5 || Math.abs(e.knockbackY) > 0.5) {
          e.x += e.knockbackX * dt * 8;
          e.y += e.knockbackY * dt * 8;
          e.knockbackX *= 0.9;
          e.knockbackY *= 0.9;
        }

        e.flashTimer = Math.max(0, e.flashTimer - dt);

        // Move toward player
        const ex = p.x - e.x;
        const ey = p.y - e.y;
        const ed = Math.hypot(ex, ey) || 1;
        e.x += (ex / ed) * e.speed * dt;
        e.y += (ey / ed) * e.speed * dt;
        e.y = clamp(e.y, GROUND_Y - 130, GROUND_Y - e.size);

        // Sword hit check
        if (
          p.swinging &&
          !hitEnemiesRef.current.has(e) &&
          lineCircleIntersect(
            swordX1, swordY1, swordX2, swordY2,
            e.x, e.y, e.size, p.stats.swordWidth,
          )
        ) {
          hitEnemiesRef.current.add(e);
          const isCrit = Math.random() < p.stats.critChance;
          let dmg = p.stats.attack + Math.floor(Math.random() * 3);
          if (isCrit) dmg = Math.floor(dmg * 2);
          e.hp -= dmg;
          e.flashTimer = 0.12;
          const knockAngle = Math.atan2(e.y - p.y, e.x - p.x);
          e.knockbackX = Math.cos(knockAngle) * 60;
          e.knockbackY = Math.sin(knockAngle) * 40;
          dmgNumbersRef.current.push({
            x: e.x,
            y: e.y - e.size - 5,
            amount: dmg,
            life: 0.8,
            color: isCrit ? "#FFD700" : "#fff",
          });
          if (e.hp <= 0) {
            e.dead = true;
            e.deathTimer = 0.3;
            p.xp += e.xpReward;
            // level up check
            while (p.xp >= xpForLevel(p.level)) {
              p.xp -= xpForLevel(p.level);
              p.level++;
              p.hp = Math.min(p.hp + 10, computeStats().maxHp);
              dmgNumbersRef.current.push({
                x: p.x,
                y: p.y - 40,
                amount: -1, // signals "LEVEL UP"
                life: 1.2,
                color: "#FFD700",
              });
            }
            goldsRef.current.push({
              x: e.x,
              y: e.y,
              amount: e.gold + Math.floor(Math.random() * (e.gold * 0.3 + 1)),
              vy: -120,
              life: 3,
            });
          }
        }

        // Enemy damages player
        if (
          !e.dead &&
          p.invincibleTimer <= 0 &&
          dist(p.x, p.y, e.x, e.y) < e.size + 14
        ) {
          const rawDmg = Math.max(1, e.attack - p.stats.defense);
          p.hp -= rawDmg;
          p.invincibleTimer = 0.5;
          dmgNumbersRef.current.push({
            x: p.x,
            y: p.y - 30,
            amount: rawDmg,
            life: 0.6,
            color: "#FF6B6B",
          });
          if (p.hp <= 0) {
            p.hp = 0;
            setScreen("gameover");
          }
        }
      }

      // Remove dead enemies whose deathTimer expired
      enemiesRef.current = enemiesRef.current.filter(
        (e) => !e.dead || e.deathTimer > 0,
      );

      // ── Gold drops ────────────────────────────────────────────────────
      for (const g of goldsRef.current) {
        g.vy += 400 * dt;
        g.y += g.vy * dt;
        if (g.y > GROUND_Y - 4) {
          g.y = GROUND_Y - 4;
          g.vy = 0;
        }
        g.life -= dt;
        // Auto-collect when near
        if (dist(p.x, p.y, g.x, g.y) < 40) {
          p.gold += g.amount;
          g.life = 0;
        }
      }
      goldsRef.current = goldsRef.current.filter((g) => g.life > 0);

      // ── Damage numbers ────────────────────────────────────────────────
      for (const d of dmgNumbersRef.current) {
        d.y -= 40 * dt;
        d.life -= dt;
      }
      dmgNumbersRef.current = dmgNumbersRef.current.filter((d) => d.life > 0);

      // ── DRAW ──────────────────────────────────────────────────────────
      // Sky
      ctx.fillStyle = area.sky;
      ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

      // Simple clouds
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      for (let i = 0; i < 5; i++) {
        const cx = ((i * 191 + Date.now() * 0.01) % (CANVAS_W + 100)) - 50;
        ctx.beginPath();
        ctx.ellipse(cx, 50 + i * 30, 50, 18, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ground
      ctx.fillStyle = area.bg;
      ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

      // Ground detail line
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(CANVAS_W, GROUND_Y);
      ctx.stroke();

      // ── Gold drops ────────────────────────────────────────────────────
      for (const g of goldsRef.current) {
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.arc(g.x, g.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#b8860b";
        ctx.beginPath();
        ctx.arc(g.x, g.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Enemies ───────────────────────────────────────────────────────
      for (const e of enemiesRef.current) {
        const alpha = e.dead ? e.deathTimer / 0.3 : 1;
        ctx.globalAlpha = alpha;
        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.beginPath();
        ctx.ellipse(e.x, GROUND_Y, e.size * 0.8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Body
        ctx.fillStyle = e.flashTimer > 0 ? "#fff" : e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.dead ? e.size * (1 + (0.3 - e.deathTimer)) : e.size, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        if (!e.dead) {
          const eyeOff = e.size * 0.3;
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(e.x - eyeOff, e.y - e.size * 0.2, e.size * 0.22, 0, Math.PI * 2);
          ctx.arc(e.x + eyeOff, e.y - e.size * 0.2, e.size * 0.22, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#111";
          ctx.beginPath();
          ctx.arc(e.x - eyeOff + 1, e.y - e.size * 0.18, e.size * 0.12, 0, Math.PI * 2);
          ctx.arc(e.x + eyeOff + 1, e.y - e.size * 0.18, e.size * 0.12, 0, Math.PI * 2);
          ctx.fill();
        }
        // HP bar
        if (!e.dead && e.hp < e.maxHp) {
          const bw = e.size * 2;
          const bx = e.x - bw / 2;
          const by = e.y - e.size - 10;
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.fillRect(bx, by, bw, 4);
          ctx.fillStyle = "#5cb85c";
          ctx.fillRect(bx, by, bw * (e.hp / e.maxHp), 4);
        }
        ctx.globalAlpha = 1;
      }

      // ── Player ────────────────────────────────────────────────────────
      const blink = p.invincibleTimer > 0 && Math.floor(p.invincibleTimer * 10) % 2 === 0;
      if (!blink) {
        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.beginPath();
        ctx.ellipse(p.x, GROUND_Y, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = "#4488cc";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = "#f5d0a0";
        ctx.beginPath();
        ctx.arc(p.x, p.y - 16, 10, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        const lookDir = Math.cos(p.facing) >= 0 ? 1 : -1;
        ctx.fillStyle = "#222";
        ctx.beginPath();
        ctx.arc(p.x + lookDir * 3, p.y - 17, 2, 0, Math.PI * 2);
        ctx.fill();

        // ── Sword ────────────────────────────────────────────────────────
        const sAngle = p.swinging
          ? p.facing - SWING_ARC / 2 + p.swingAngle
          : p.facing;

        const tipX = p.x + Math.cos(sAngle) * p.stats.swordLength;
        const tipY = p.y + Math.sin(sAngle) * p.stats.swordLength;

        // Glow for large swords
        if (p.stats.swordLength > 80) {
          ctx.strokeStyle = "rgba(255,255,100,0.3)";
          ctx.lineWidth = p.stats.swordWidth + 8;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(tipX, tipY);
          ctx.stroke();
        }

        // Blade
        const gradient = ctx.createLinearGradient(p.x, p.y, tipX, tipY);
        gradient.addColorStop(0, "#a0a0a0");
        gradient.addColorStop(0.7, "#e0e0e0");
        gradient.addColorStop(1, "#ffffff");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = p.stats.swordWidth;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // Hilt
        ctx.strokeStyle = "#8B4513";
        ctx.lineWidth = p.stats.swordWidth + 4;
        ctx.beginPath();
        const hx = p.x + Math.cos(sAngle) * 8;
        const hy = p.y + Math.sin(sAngle) * 8;
        const perpAngle = sAngle + Math.PI / 2;
        ctx.moveTo(hx + Math.cos(perpAngle) * 6, hy + Math.sin(perpAngle) * 6);
        ctx.lineTo(hx - Math.cos(perpAngle) * 6, hy - Math.sin(perpAngle) * 6);
        ctx.stroke();
      }

      // ── Damage numbers ────────────────────────────────────────────────
      ctx.textAlign = "center";
      for (const d of dmgNumbersRef.current) {
        ctx.globalAlpha = clamp(d.life / 0.3, 0, 1);
        ctx.font = d.amount === -1 ? "bold 16px monospace" : "bold 14px monospace";
        ctx.fillStyle = d.color;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        const text = d.amount === -1 ? "LEVEL UP!" : `${d.amount}`;
        ctx.strokeText(text, d.x, d.y);
        ctx.fillText(text, d.x, d.y);
      }
      ctx.globalAlpha = 1;

      // ── HUD ───────────────────────────────────────────────────────────
      // HP bar
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(10, 10, 160, 16);
      ctx.fillStyle = p.hp / p.stats.maxHp > 0.3 ? "#5cb85c" : "#FF6B6B";
      ctx.fillRect(10, 10, 160 * (p.hp / p.stats.maxHp), 16);
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, 160, 16);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `HP ${Math.ceil(p.hp)}/${p.stats.maxHp}`,
        14,
        23,
      );

      // XP bar
      const xpNeeded = xpForLevel(p.level);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(10, 30, 160, 10);
      ctx.fillStyle = "#7B68EE";
      ctx.fillRect(10, 30, 160 * (p.xp / xpNeeded), 10);
      ctx.fillStyle = "#ddd";
      ctx.font = "9px monospace";
      ctx.fillText(`LV ${p.level}  XP ${p.xp}/${xpNeeded}`, 14, 39);

      // Gold
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 13px monospace";
      ctx.fillText(`Gold: ${p.gold}`, 10, 58);

      // Area name
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "11px monospace";
      ctx.textAlign = "right";
      ctx.fillText(area.name, CANVAS_W - 10, 22);

      // Controls hint
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "WASD/Arrows = Move  |  Space/J = Swing  |  E = Shop",
        CANVAS_W / 2,
        CANVAS_H - 8,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentArea, upgradeLevels],
  );

  // ── Canvas animation loop ─────────────────────────────────────────────

  useEffect(() => {
    if (screen !== "play") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let lastTime = performance.now();
    let rafId = 0;

    function frame(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      gameLoop(ctx, dt);
      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [screen, gameLoop]);

  // ── Keyboard ──────────────────────────────────────────────────────────

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      keysRef.current.add(key);

      if (screen === "play" && key === "e") {
        setScreen("shop");
      }
      if (screen === "shop" && (key === "escape" || key === "e")) {
        setScreen("play");
      }
      if (screen === "title" && (key === "enter" || key === " ")) {
        startGame();
      }
      if (screen === "gameover" && (key === "enter" || key === " ")) {
        startGame();
      }
      // Prevent page scroll on space
      if (key === " " && ["play", "title", "gameover"].includes(screen)) {
        e.preventDefault();
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      keysRef.current.delete(e.key.toLowerCase());
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // ── Start / restart ───────────────────────────────────────────────────

  function startGame() {
    const p = makePlayer();
    // Reapply upgrades
    p.stats = { ...BASE_STATS };
    for (let i = 0; i < UPGRADES.length; i++) {
      const u = UPGRADES[i];
      (p.stats[u.key] as number) += u.perLevel * upgradeLevels[i];
    }
    p.hp = p.stats.maxHp;
    p.gold = totalGold;
    playerRef.current = p;
    enemiesRef.current = [];
    goldsRef.current = [];
    dmgNumbersRef.current = [];
    spawnTimerRef.current = 0;
    setScreen("play");
  }

  // ── Buy upgrade ───────────────────────────────────────────────────────

  function buyUpgrade(index: number) {
    const u = UPGRADES[index];
    const lvl = upgradeLevels[index];
    if (lvl >= u.maxLevel) return;
    const cost = upgradeCost(u, lvl);
    const p = playerRef.current;
    if (p.gold < cost) return;
    p.gold -= cost;
    setTotalGold(p.gold);
    setUpgradeLevels((prev) => {
      const next = [...prev];
      next[index]++;
      return next;
    });
  }

  // ── Unlock area ───────────────────────────────────────────────────────

  function unlockArea(index: number) {
    const area = AREAS[index];
    const p = playerRef.current;
    if (p.gold < area.unlockCost) return;
    p.gold -= area.unlockCost;
    setTotalGold(p.gold);
    setUnlockedAreas((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
  }

  // ── Travel to area ───────────────────────────────────────────────────

  function travelTo(index: number) {
    if (!unlockedAreas[index]) return;
    setCurrentArea(index);
    enemiesRef.current = [];
    spawnTimerRef.current = 0;
  }

  // ── Close shop ────────────────────────────────────────────────────────

  function closeShop() {
    setTotalGold(playerRef.current.gold);
    setScreen("play");
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center gap-4 py-6 px-4 max-w-[960px] mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-text-primary">Big Ah Sword</h1>
        <p className="text-text-muted text-sm mt-1">
          Slay monsters, collect gold, and grow your sword to absurd proportions
        </p>
      </div>

      <div className="relative rounded-xl overflow-hidden shadow-lg border-2 border-border-light">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="block bg-black"
          tabIndex={0}
          style={{ maxWidth: "100%", height: "auto" }}
        />

        {/* Title screen overlay */}
        {screen === "title" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <h2 className="text-5xl font-bold text-white mb-2 tracking-tight" style={{ textShadow: "0 0 20px rgba(255,107,107,0.7)" }}>
              BIG AH SWORD
            </h2>
            <p className="text-gray-300 text-sm mb-6">
              Fight monsters. Get gold. Grow your sword.
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-coral text-white font-bold rounded-lg text-lg
                         hover:bg-coral/80 transition-colors shadow-lg cursor-pointer"
            >
              Start Game
            </button>
            <p className="text-gray-500 text-xs mt-4">
              WASD / Arrows to move &bull; Space / J to attack &bull; E for Shop
            </p>
          </div>
        )}

        {/* Game over overlay */}
        {screen === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <h2 className="text-4xl font-bold text-red-400 mb-2">YOU DIED</h2>
            <p className="text-gray-300 mb-1">
              Level {playerRef.current.level} &bull; Gold kept: {playerRef.current.gold}
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Your gold and upgrades are saved!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setTotalGold(playerRef.current.gold);
                  setScreen("shop");
                }}
                className="px-6 py-2 bg-amber-500 text-white font-bold rounded-lg
                           hover:bg-amber-400 transition-colors cursor-pointer"
              >
                Shop
              </button>
              <button
                onClick={startGame}
                className="px-6 py-2 bg-coral text-white font-bold rounded-lg
                           hover:bg-coral/80 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Shop overlay */}
        {screen === "shop" && (
          <div className="absolute inset-0 bg-gray-900/95 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-white">Shop</h2>
              <div className="flex items-center gap-4">
                <span className="text-yellow-400 font-bold text-sm">
                  Gold: {playerRef.current.gold}
                </span>
                <button
                  onClick={closeShop}
                  className="px-4 py-1 bg-gray-700 text-white rounded hover:bg-gray-600
                             transition-colors text-sm font-bold cursor-pointer"
                >
                  Close (E)
                </button>
              </div>
            </div>

            {/* Upgrades grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {UPGRADES.map((u, i) => {
                const lvl = upgradeLevels[i];
                const maxed = lvl >= u.maxLevel;
                const cost = maxed ? 0 : upgradeCost(u, lvl);
                const canBuy = !maxed && playerRef.current.gold >= cost;
                return (
                  <button
                    key={u.key}
                    onClick={() => buyUpgrade(i)}
                    disabled={!canBuy}
                    className={`p-2 rounded-lg text-left transition-colors border cursor-pointer
                      ${canBuy
                        ? "bg-gray-800 border-gray-600 hover:border-yellow-500 hover:bg-gray-700"
                        : "bg-gray-800/50 border-gray-700 opacity-60 cursor-not-allowed"
                      }`}
                  >
                    <div className="text-white font-bold text-xs">{u.name}</div>
                    <div className="text-gray-400 text-[10px]">{u.description}</div>
                    <div className="text-gray-500 text-[10px] mt-1">
                      Lv {lvl}/{u.maxLevel}
                    </div>
                    {!maxed && (
                      <div className={`text-xs mt-0.5 font-bold ${canBuy ? "text-yellow-400" : "text-gray-500"}`}>
                        {cost} gold
                      </div>
                    )}
                    {maxed && (
                      <div className="text-green-400 text-xs mt-0.5 font-bold">
                        MAXED
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Areas */}
            <h3 className="text-sm font-bold text-white mb-2">Travel</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {AREAS.map((a, i) => {
                const unlocked = unlockedAreas[i];
                const active = currentArea === i;
                const canAfford = playerRef.current.gold >= a.unlockCost;
                return (
                  <button
                    key={a.name}
                    onClick={() => unlocked ? travelTo(i) : canAfford ? unlockArea(i) : undefined}
                    disabled={!unlocked && !canAfford}
                    className={`p-2 rounded-lg text-center transition-colors border cursor-pointer text-[11px]
                      ${active
                        ? "bg-teal/30 border-teal text-white"
                        : unlocked
                          ? "bg-gray-800 border-gray-600 hover:border-teal text-gray-300"
                          : canAfford
                            ? "bg-gray-800 border-yellow-700 hover:border-yellow-500 text-gray-400"
                            : "bg-gray-800/40 border-gray-700 text-gray-600 cursor-not-allowed"
                      }`}
                  >
                    <div className="font-bold">{a.name}</div>
                    {!unlocked && (
                      <div className={`text-[10px] ${canAfford ? "text-yellow-400" : "text-gray-600"}`}>
                        {a.unlockCost} gold
                      </div>
                    )}
                    {active && <div className="text-teal text-[10px]">Current</div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
