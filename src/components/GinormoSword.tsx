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
  BOSSES,
  BOSS_SPAWN_KILLS,
  COMBO_WINDOW,
  xpForLevel,
  upgradeCost,
  saveGame,
  loadGame,
  type PlayerState,
  type PlayerStats,
  type Enemy,
  type EnemyTemplate,
  type GoldDrop,
  type DamageNumber,
  type Particle,
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

function randRange(lo: number, hi: number) {
  return lo + Math.random() * (hi - lo);
}

// ── Simple synth SFX ────────────────────────────────────────────────────────

let audioCtx: AudioContext | null = null;
function getAudio(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playHit() {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch { /* audio not available */ }
}

function playCrit() {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.06);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch { /* audio not available */ }
}

function playKill() {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(330, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch { /* audio not available */ }
}

function playBossKill() {
  try {
    const ctx = getAudio();
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      const t = ctx.currentTime + i * 0.1;
      osc.frequency.setValueAtTime(330 + i * 110, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.2);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    }
  } catch { /* audio not available */ }
}

function playDamage() {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch { /* audio not available */ }
}

function playLevelUp() {
  try {
    const ctx = getAudio();
    const notes = [523, 659, 784];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const t = ctx.currentTime + i * 0.08;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  } catch { /* audio not available */ }
}

function playSwing() {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch { /* audio not available */ }
}

// ── Component ───────────────────────────────────────────────────────────────

type Screen = "title" | "play" | "shop" | "gameover";

export default function GinormoSword() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [screen, setScreen] = useState<Screen>("title");
  const [currentArea, setCurrentArea] = useState(0);
  const [unlockedAreas, setUnlockedAreas] = useState<boolean[]>(() => {
    const saved = loadGame();
    return saved?.unlockedAreas ?? AREAS.map((_, i) => i === 0);
  });
  const [upgradeLevels, setUpgradeLevels] = useState<number[]>(() => {
    const saved = loadGame();
    return saved?.upgradeLevels ?? UPGRADES.map(() => 0);
  });
  const [totalGold, setTotalGold] = useState(() => {
    const saved = loadGame();
    return saved?.gold ?? 0;
  });
  const [sfxEnabled, setSfxEnabled] = useState(true);

  // Mutable game state refs
  const playerRef = useRef<PlayerState>(makePlayer());
  const enemiesRef = useRef<Enemy[]>([]);
  const goldsRef = useRef<GoldDrop[]>([]);
  const dmgNumbersRef = useRef<DamageNumber[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const spawnTimerRef = useRef(0);
  const hitEnemiesRef = useRef<Set<Enemy>>(new Set());

  // Screen shake
  const shakeRef = useRef({ x: 0, y: 0, intensity: 0, timer: 0 });

  // Combo system
  const comboRef = useRef({ count: 0, timer: 0, multiplier: 1 });

  // Kill counter & boss tracking
  const killsRef = useRef(0);
  const totalKillsRef = useRef(loadGame()?.totalKills ?? 0);
  const highestComboRef = useRef(loadGame()?.highestCombo ?? 0);
  const bossAliveRef = useRef(false);

  // Swing trail positions
  const trailRef = useRef<{ x: number; y: number; age: number }[]>([]);

  function computeStats(): PlayerStats {
    const s = { ...BASE_STATS };
    for (let i = 0; i < UPGRADES.length; i++) {
      const u = UPGRADES[i];
      (s[u.key] as number) += u.perLevel * upgradeLevels[i];
    }
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

  function spawnBoss() {
    if (bossAliveRef.current) return;
    const boss = BOSSES[currentArea];
    if (!boss) return;
    bossAliveRef.current = true;
    const side = Math.random() < 0.5 ? -50 : CANVAS_W + 50;
    const e: Enemy = {
      x: side,
      y: GROUND_Y - boss.size - 10,
      hp: boss.hp,
      maxHp: boss.hp,
      attack: boss.attack,
      speed: boss.speed,
      gold: boss.gold,
      size: boss.size,
      color: boss.color,
      name: boss.name,
      xpReward: boss.xpReward,
      knockbackX: 0,
      knockbackY: 0,
      flashTimer: 0,
      dead: false,
      deathTimer: 0,
      isBoss: true,
      title: boss.title,
    };
    enemiesRef.current.push(e);
  }

  function addShake(intensity: number) {
    const s = shakeRef.current;
    s.intensity = Math.min(s.intensity + intensity, 12);
    s.timer = Math.max(s.timer, intensity * 0.04);
  }

  function spawnParticles(x: number, y: number, color: string, count: number, type: Particle["type"], speed = 150) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = randRange(speed * 0.3, speed);
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - randRange(20, 80),
        life: randRange(0.2, 0.5),
        maxLife: 0.5,
        size: randRange(2, 5),
        color,
        type,
      });
    }
  }

  // ── Game loop ─────────────────────────────────────────────────────────────

  const gameLoop = useCallback(
    (ctx: CanvasRenderingContext2D, dt: number) => {
      const p = playerRef.current;
      const keys = keysRef.current;
      const area = AREAS[currentArea];
      const combo = comboRef.current;
      const shake = shakeRef.current;

      p.stats = computeStats();

      // ── Screen shake update ───────────────────────────────────────────
      if (shake.timer > 0) {
        shake.timer -= dt;
        shake.x = (Math.random() - 0.5) * shake.intensity * 2;
        shake.y = (Math.random() - 0.5) * shake.intensity * 2;
        shake.intensity *= 0.9;
      } else {
        shake.x = 0;
        shake.y = 0;
      }

      // ── Combo timer ───────────────────────────────────────────────────
      if (combo.timer > 0) {
        combo.timer -= dt;
        if (combo.timer <= 0) {
          combo.count = 0;
          combo.multiplier = 1;
        }
      }

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
      if ((keys.has(" ") || keys.has("j")) && !p.swinging) {
        p.swinging = true;
        p.swingAngle = 0;
        p.swingDir = 1;
        hitEnemiesRef.current.clear();
        trailRef.current = [];
        if (sfxEnabled) playSwing();
      }

      if (p.swinging) {
        p.swingAngle += SWING_SPEED * dt;
        // Record trail
        const trailAngle = p.facing - SWING_ARC / 2 + p.swingAngle;
        const tipX = p.x + Math.cos(trailAngle) * p.stats.swordLength;
        const tipY = p.y + Math.sin(trailAngle) * p.stats.swordLength;
        trailRef.current.push({ x: tipX, y: tipY, age: 0 });
        if (trailRef.current.length > 12) trailRef.current.shift();

        if (p.swingAngle >= SWING_ARC) {
          p.swinging = false;
          p.swingAngle = 0;
        }
      }

      // Age trail
      for (const t of trailRef.current) t.age += dt;
      trailRef.current = trailRef.current.filter((t) => t.age < 0.15);

      // ── HP regen ──────────────────────────────────────────────────────
      p.hp = Math.min(p.stats.maxHp, p.hp + p.stats.hpRegen * dt);

      // ── Invincibility ─────────────────────────────────────────────────
      if (p.invincibleTimer > 0) p.invincibleTimer -= dt;

      // ── Spawn enemies ─────────────────────────────────────────────────
      spawnTimerRef.current -= dt;
      if (spawnTimerRef.current <= 0 && enemiesRef.current.length < MAX_ENEMIES) {
        spawnEnemy();
        spawnTimerRef.current = SPAWN_INTERVAL;
      }

      // Boss spawn check
      if (killsRef.current > 0 && killsRef.current % BOSS_SPAWN_KILLS === 0 && !bossAliveRef.current) {
        spawnBoss();
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
          lineCircleIntersect(swordX1, swordY1, swordX2, swordY2, e.x, e.y, e.size, p.stats.swordWidth)
        ) {
          hitEnemiesRef.current.add(e);
          const isCrit = Math.random() < p.stats.critChance;
          let dmg = p.stats.attack + Math.floor(Math.random() * 3);
          if (isCrit) dmg = Math.floor(dmg * 2);
          // Combo bonus
          dmg = Math.floor(dmg * combo.multiplier);
          e.hp -= dmg;
          e.flashTimer = 0.12;
          const knockAngle = Math.atan2(e.y - p.y, e.x - p.x);
          const knockForce = e.isBoss ? 30 : 60;
          e.knockbackX = Math.cos(knockAngle) * knockForce;
          e.knockbackY = Math.sin(knockAngle) * (knockForce * 0.66);

          // Spawn hit sparks
          spawnParticles(
            (p.x + e.x) / 2, (p.y + e.y) / 2,
            isCrit ? "#FFD700" : "#fff",
            isCrit ? 8 : 4, "spark", 120,
          );
          addShake(isCrit ? 4 : 2);

          if (sfxEnabled) { isCrit ? playCrit() : playHit(); }

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
            killsRef.current++;

            // Combo
            combo.count++;
            combo.timer = COMBO_WINDOW;
            combo.multiplier = 1 + Math.min(combo.count, 20) * 0.1;
            if (combo.count > highestComboRef.current) {
              highestComboRef.current = combo.count;
            }

            // Death particles
            spawnParticles(e.x, e.y, e.color, e.isBoss ? 30 : 12, "death", e.isBoss ? 250 : 150);
            addShake(e.isBoss ? 10 : 3);

            if (sfxEnabled) { e.isBoss ? playBossKill() : playKill(); }
            if (e.isBoss) bossAliveRef.current = false;

            // Level up check
            while (p.xp >= xpForLevel(p.level)) {
              p.xp -= xpForLevel(p.level);
              p.level++;
              p.hp = Math.min(p.hp + 10, computeStats().maxHp);
              if (sfxEnabled) playLevelUp();
              dmgNumbersRef.current.push({
                x: p.x, y: p.y - 40,
                amount: -1,
                life: 1.2,
                color: "#FFD700",
              });
              // Level up particles
              spawnParticles(p.x, p.y, "#FFD700", 15, "spark", 200);
            }

            // Gold drop
            goldsRef.current.push({
              x: e.x, y: e.y,
              amount: e.gold + Math.floor(Math.random() * (e.gold * 0.3 + 1)),
              vy: -120,
              life: 3,
            });

            // Combo text
            if (combo.count >= 3) {
              dmgNumbersRef.current.push({
                x: p.x + randRange(-20, 20), y: p.y - 55,
                amount: -combo.count,
                life: 1.0,
                color: combo.count >= 10 ? "#ff4500" : combo.count >= 5 ? "#FFD700" : "#87CEEB",
              });
            }
          }
        }

        // Enemy damages player
        if (!e.dead && p.invincibleTimer <= 0 && dist(p.x, p.y, e.x, e.y) < e.size + 14) {
          const rawDmg = Math.max(1, e.attack - p.stats.defense);
          p.hp -= rawDmg;
          p.invincibleTimer = 0.5;
          addShake(5);
          if (sfxEnabled) playDamage();
          spawnParticles(p.x, p.y, "#FF6B6B", 6, "blood", 100);
          dmgNumbersRef.current.push({
            x: p.x, y: p.y - 30,
            amount: rawDmg,
            life: 0.6,
            color: "#FF6B6B",
          });
          if (p.hp <= 0) {
            p.hp = 0;
            setTotalGold(p.gold);
            // Auto-save on death
            doSave(p.gold);
            setScreen("gameover");
          }
        }
      }

      // Remove dead enemies
      enemiesRef.current = enemiesRef.current.filter((e) => !e.dead || e.deathTimer > 0);

      // ── Particles ─────────────────────────────────────────────────────
      for (const pt of particlesRef.current) {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vy += 300 * dt; // gravity
        pt.life -= dt;
      }
      particlesRef.current = particlesRef.current.filter((pt) => pt.life > 0);

      // ── Gold drops ────────────────────────────────────────────────────
      for (const g of goldsRef.current) {
        g.vy += 400 * dt;
        g.y += g.vy * dt;
        if (g.y > GROUND_Y - 4) { g.y = GROUND_Y - 4; g.vy = 0; }
        g.life -= dt;
        if (dist(p.x, p.y, g.x, g.y) < 50) {
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

      // ═══════════════════════════════════════════════════════════════════
      // ── DRAW ──────────────────────────────────────────────────────────
      // ═══════════════════════════════════════════════════════════════════

      ctx.save();
      ctx.translate(shake.x, shake.y);

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      skyGrad.addColorStop(0, area.sky);
      skyGrad.addColorStop(1, mixColor(area.sky, area.bg, 0.3));
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-10, -10, CANVAS_W + 20, GROUND_Y + 10);

      // Parallax clouds
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      for (let i = 0; i < 6; i++) {
        const speed = 0.008 + i * 0.003;
        const cx = ((i * 173 + Date.now() * speed) % (CANVAS_W + 120)) - 60;
        const cy = 30 + i * 28;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 45 + i * 8, 14 + i * 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 30, cy - 5, 30, 12, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ground with gradient
      const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
      groundGrad.addColorStop(0, area.bg);
      groundGrad.addColorStop(1, darkenColor(area.bg, 0.3));
      ctx.fillStyle = groundGrad;
      ctx.fillRect(-10, GROUND_Y, CANVAS_W + 20, CANVAS_H - GROUND_Y + 10);

      // Ground detail
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, GROUND_Y);
      ctx.lineTo(CANVAS_W + 10, GROUND_Y);
      ctx.stroke();

      // Grass tufts
      ctx.strokeStyle = darkenColor(area.bg, -0.15);
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 20; i++) {
        const gx = (i * 43 + 10) % CANVAS_W;
        ctx.beginPath();
        ctx.moveTo(gx, GROUND_Y);
        ctx.lineTo(gx - 3, GROUND_Y - 6);
        ctx.moveTo(gx, GROUND_Y);
        ctx.lineTo(gx + 2, GROUND_Y - 5);
        ctx.stroke();
      }

      // ── Particles (behind entities) ───────────────────────────────────
      for (const pt of particlesRef.current) {
        const alpha = clamp(pt.life / pt.maxLife, 0, 1);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = pt.color;
        if (pt.type === "spark") {
          // Diamond spark
          ctx.save();
          ctx.translate(pt.x, pt.y);
          ctx.rotate(Math.atan2(pt.vy, pt.vx));
          ctx.fillRect(-pt.size, -pt.size * 0.4, pt.size * 2, pt.size * 0.8);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size * alpha, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // ── Gold drops ────────────────────────────────────────────────────
      for (const g of goldsRef.current) {
        const pulse = 1 + Math.sin(Date.now() * 0.01 + g.x) * 0.15;
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.arc(g.x, g.y, 5 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(g.x - 1, g.y - 1, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
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

        const drawSize = e.dead ? e.size * (1 + (0.3 - e.deathTimer) * 2) : e.size;

        // Boss glow
        if (e.isBoss && !e.dead) {
          ctx.fillStyle = e.color + "40";
          ctx.beginPath();
          ctx.arc(e.x, e.y, drawSize + 8 + Math.sin(Date.now() * 0.005) * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Body
        ctx.fillStyle = e.flashTimer > 0 ? "#fff" : e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, drawSize, 0, Math.PI * 2);
        ctx.fill();

        // Body outline
        if (!e.dead) {
          ctx.strokeStyle = "rgba(0,0,0,0.3)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Eyes
        if (!e.dead) {
          const eyeOff = e.size * 0.3;
          const eyeSize = e.size * 0.22;
          // White
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(e.x - eyeOff, e.y - e.size * 0.2, eyeSize, 0, Math.PI * 2);
          ctx.arc(e.x + eyeOff, e.y - e.size * 0.2, eyeSize, 0, Math.PI * 2);
          ctx.fill();
          // Pupils (look at player)
          const lookX = clamp((p.x - e.x) * 0.02, -2, 2);
          const lookY = clamp((p.y - e.y) * 0.02, -1, 1);
          ctx.fillStyle = e.isBoss ? "#f00" : "#111";
          ctx.beginPath();
          ctx.arc(e.x - eyeOff + lookX, e.y - e.size * 0.18 + lookY, eyeSize * 0.55, 0, Math.PI * 2);
          ctx.arc(e.x + eyeOff + lookX, e.y - e.size * 0.18 + lookY, eyeSize * 0.55, 0, Math.PI * 2);
          ctx.fill();
        }

        // HP bar
        if (!e.dead && e.hp < e.maxHp) {
          const bw = e.size * 2.2;
          const bx = e.x - bw / 2;
          const by = e.y - e.size - 12;
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(bx - 1, by - 1, bw + 2, 6);
          const hpRatio = e.hp / e.maxHp;
          ctx.fillStyle = hpRatio > 0.5 ? "#5cb85c" : hpRatio > 0.25 ? "#f0ad4e" : "#FF6B6B";
          ctx.fillRect(bx, by, bw * hpRatio, 4);
        }

        // Boss name plate
        if (e.isBoss && !e.dead) {
          ctx.fillStyle = "#fff";
          ctx.font = "bold 10px monospace";
          ctx.textAlign = "center";
          ctx.fillText(e.title ?? e.name, e.x, e.y - e.size - 18);
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

        // Sword trail
        if (trailRef.current.length > 1) {
          ctx.globalAlpha = 0.3;
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = p.stats.swordWidth * 0.6;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(trailRef.current[0].x, trailRef.current[0].y);
          for (let i = 1; i < trailRef.current.length; i++) {
            ctx.lineTo(trailRef.current[i].x, trailRef.current[i].y);
          }
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // ── Sword ─────────────────────────────────────────────────────
        const sAngle = p.swinging
          ? p.facing - SWING_ARC / 2 + p.swingAngle
          : p.facing;

        const tipX = p.x + Math.cos(sAngle) * p.stats.swordLength;
        const tipY = p.y + Math.sin(sAngle) * p.stats.swordLength;

        // Glow for large swords
        if (p.stats.swordLength > 80) {
          ctx.strokeStyle = `rgba(255,255,100,${0.15 + Math.sin(Date.now() * 0.003) * 0.1})`;
          ctx.lineWidth = p.stats.swordWidth + 10;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(tipX, tipY);
          ctx.stroke();
        }

        // Blade
        const gradient = ctx.createLinearGradient(p.x, p.y, tipX, tipY);
        gradient.addColorStop(0, "#a0a0a0");
        gradient.addColorStop(0.6, "#d8d8d8");
        gradient.addColorStop(1, "#ffffff");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = p.stats.swordWidth;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // Blade edge highlight
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 1;
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
        ctx.moveTo(hx + Math.cos(perpAngle) * 7, hy + Math.sin(perpAngle) * 7);
        ctx.lineTo(hx - Math.cos(perpAngle) * 7, hy - Math.sin(perpAngle) * 7);
        ctx.stroke();
        // Hilt gem
        ctx.fillStyle = "#FF6B6B";
        ctx.beginPath();
        ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = "#4488cc";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#336699";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
        ctx.stroke();

        // Head
        ctx.fillStyle = "#f5d0a0";
        ctx.beginPath();
        ctx.arc(p.x, p.y - 16, 10, 0, Math.PI * 2);
        ctx.fill();

        // Hair
        ctx.fillStyle = "#5a3a1a";
        ctx.beginPath();
        ctx.arc(p.x, p.y - 20, 8, Math.PI, Math.PI * 2);
        ctx.fill();

        // Eyes
        const lookDir = Math.cos(p.facing) >= 0 ? 1 : -1;
        ctx.fillStyle = "#222";
        ctx.beginPath();
        ctx.arc(p.x + lookDir * 3, p.y - 17, 2, 0, Math.PI * 2);
        ctx.fill();
        // Eye highlight
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(p.x + lookDir * 3 + 0.5, p.y - 17.5, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Damage numbers ────────────────────────────────────────────────
      ctx.textAlign = "center";
      for (const d of dmgNumbersRef.current) {
        ctx.globalAlpha = clamp(d.life / 0.3, 0, 1);
        let text: string;
        let font: string;
        if (d.amount === -1) {
          text = "LEVEL UP!";
          font = "bold 16px monospace";
        } else if (d.amount < -1) {
          text = `${-d.amount}x COMBO!`;
          font = "bold 14px monospace";
        } else {
          text = `${d.amount}`;
          font = d.color === "#FFD700" ? "bold 18px monospace" : "bold 14px monospace";
        }
        ctx.font = font;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.strokeText(text, d.x, d.y);
        ctx.fillStyle = d.color;
        ctx.fillText(text, d.x, d.y);
      }
      ctx.globalAlpha = 1;

      // ── HUD ───────────────────────────────────────────────────────────
      ctx.restore(); // undo shake for HUD

      // HP bar
      const hpRatio = p.hp / p.stats.maxHp;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      roundRect(ctx, 10, 10, 170, 18, 4);
      ctx.fill();
      ctx.fillStyle = hpRatio > 0.5 ? "#5cb85c" : hpRatio > 0.25 ? "#f0ad4e" : "#FF6B6B";
      roundRect(ctx, 10, 10, 170 * hpRatio, 18, 4);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`HP ${Math.ceil(p.hp)}/${p.stats.maxHp}`, 14, 23);

      // XP bar
      const xpNeeded = xpForLevel(p.level);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      roundRect(ctx, 10, 32, 170, 12, 3);
      ctx.fill();
      ctx.fillStyle = "#7B68EE";
      roundRect(ctx, 10, 32, 170 * (p.xp / xpNeeded), 12, 3);
      ctx.fill();
      ctx.fillStyle = "#ddd";
      ctx.font = "9px monospace";
      ctx.fillText(`LV ${p.level}  XP ${p.xp}/${xpNeeded}`, 14, 42);

      // Gold
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 13px monospace";
      ctx.fillText(`Gold: ${p.gold}`, 10, 60);

      // Kill counter
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "10px monospace";
      ctx.fillText(`Kills: ${killsRef.current}`, 10, 74);

      // Combo display
      if (combo.count >= 2) {
        const comboAlpha = clamp(combo.timer / 0.5, 0.4, 1);
        ctx.globalAlpha = comboAlpha;
        const comboSize = combo.count >= 10 ? 20 : combo.count >= 5 ? 16 : 13;
        ctx.font = `bold ${comboSize}px monospace`;
        ctx.fillStyle = combo.count >= 10 ? "#ff4500" : combo.count >= 5 ? "#FFD700" : "#87CEEB";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        const comboText = `${combo.count}x COMBO`;
        ctx.strokeText(comboText, CANVAS_W / 2, 90);
        ctx.fillText(comboText, CANVAS_W / 2, 90);
        ctx.font = "10px monospace";
        ctx.fillStyle = "#fff";
        ctx.strokeText(`${combo.multiplier.toFixed(1)}x dmg`, CANVAS_W / 2, 104);
        ctx.fillText(`${combo.multiplier.toFixed(1)}x dmg`, CANVAS_W / 2, 104);
        ctx.globalAlpha = 1;
      }

      // Area name
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "11px monospace";
      ctx.textAlign = "right";
      ctx.fillText(area.name, CANVAS_W - 10, 22);

      // Boss warning
      if (bossAliveRef.current) {
        const pulse = 0.5 + Math.sin(Date.now() * 0.006) * 0.5;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = "#ff4500";
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillText("BOSS!", CANVAS_W / 2, 30);
        ctx.globalAlpha = 1;
      }

      // Controls hint
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "WASD/Arrows = Move  |  Space/J = Swing  |  E = Shop",
        CANVAS_W / 2,
        CANVAS_H - 8,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentArea, upgradeLevels, sfxEnabled],
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
      if (key === "m") {
        setSfxEnabled((v) => !v);
      }
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

  // ── Save helper ───────────────────────────────────────────────────────

  function doSave(gold: number) {
    saveGame({
      gold,
      upgradeLevels,
      unlockedAreas,
      totalKills: totalKillsRef.current,
      highestCombo: highestComboRef.current,
    });
  }

  // ── Start / restart ───────────────────────────────────────────────────

  function startGame() {
    const p = makePlayer();
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
    particlesRef.current = [];
    spawnTimerRef.current = 0;
    killsRef.current = 0;
    bossAliveRef.current = false;
    comboRef.current = { count: 0, timer: 0, multiplier: 1 };
    trailRef.current = [];
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
    const newLevels = [...upgradeLevels];
    newLevels[index]++;
    setUpgradeLevels(newLevels);
    doSave(p.gold);
  }

  // ── Unlock area ───────────────────────────────────────────────────────

  function unlockArea(index: number) {
    const area = AREAS[index];
    const p = playerRef.current;
    if (p.gold < area.unlockCost) return;
    p.gold -= area.unlockCost;
    setTotalGold(p.gold);
    const newUnlocked = [...unlockedAreas];
    newUnlocked[index] = true;
    setUnlockedAreas(newUnlocked);
    doSave(p.gold);
  }

  function travelTo(index: number) {
    if (!unlockedAreas[index]) return;
    setCurrentArea(index);
    enemiesRef.current = [];
    spawnTimerRef.current = 0;
    bossAliveRef.current = false;
    killsRef.current = 0;
  }

  function closeShop() {
    setTotalGold(playerRef.current.gold);
    doSave(playerRef.current.gold);
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
              {loadGame() ? "Continue" : "Start Game"}
            </button>
            {loadGame() && (
              <p className="text-gray-400 text-xs mt-2">
                Saved: {loadGame()?.gold ?? 0} gold
              </p>
            )}
            <p className="text-gray-500 text-xs mt-4">
              WASD / Arrows to move &bull; Space / J to attack &bull; E for Shop &bull; M to mute
            </p>
          </div>
        )}

        {/* Game over overlay */}
        {screen === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <h2 className="text-4xl font-bold text-red-400 mb-2" style={{ textShadow: "0 0 15px rgba(255,0,0,0.5)" }}>
              YOU DIED
            </h2>
            <p className="text-gray-300 mb-1">
              Level {playerRef.current.level} &bull; Gold kept: {playerRef.current.gold}
            </p>
            <p className="text-gray-400 text-sm">
              Kills: {killsRef.current} &bull; Best combo: {comboRef.current.count}x
            </p>
            <p className="text-gray-500 text-xs mb-6">
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

      {/* SFX toggle below canvas */}
      <button
        onClick={() => setSfxEnabled((v) => !v)}
        className="text-text-muted text-xs hover:text-text-primary transition-colors cursor-pointer"
      >
        Sound: {sfxEnabled ? "ON" : "OFF"} (M)
      </button>
    </div>
  );
}

// ── Canvas drawing helpers ──────────────────────────────────────────────────

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function mixColor(c1: string, c2: string, t: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16);
  const g1 = parseInt(c1.slice(3, 5), 16);
  const b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16);
  const g2 = parseInt(c2.slice(3, 5), 16);
  const b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

function darkenColor(hex: string, amount: number): string {
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) * (1 - amount)));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) * (1 - amount)));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) * (1 - amount)));
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}
