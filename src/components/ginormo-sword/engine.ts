// Ginormo Sword – Game Engine (state machine, main loop, input)

import {
  CANVAS_W, CANVAS_H, SWING_SPEED, SWING_ARC, MAX_ENEMIES,
  HP_PER_LEVEL, BASE_STATS, UPGRADES, COMBO_WINDOW, ARENA_MARGIN,
  OVERWORLD_SPEED, ZONE_INTERACT_DIST, TOWN_INTERACT_DIST,
  WORLD_W, WORLD_H,
  clamp, dist, randRange, lineCircleIntersect, xpForLevel,
  type GameScreen, type PlayerState, type PlayerStats, type Enemy,
  type EnemyTemplate, type GoldDrop, type DamageNumber, type Particle,
  type Projectile, type Camera, type CombatState, type CombatZone, type SaveData,
  saveGame, loadGame, defaultSave,
} from "@/lib/ginormo-sword-data";
import { ZONES, TOWNS, REGIONS, isRegionUnlocked } from "@/lib/ginormo-sword-world";
import { playHit, playCrit, playKill, playBossKill, playDamage, playLevelUp, playSwing, playZoneEnter, playZoneClear } from "./audio";
import { drawOverworld, drawCombat, drawHUD, drawTransition } from "./renderer";

// ── Game State ─────────────────────────────────────────────────────────────

export interface GameState {
  screen: GameScreen;
  player: PlayerState;
  enemies: Enemy[];
  golds: GoldDrop[];
  dmgNumbers: DamageNumber[];
  particles: Particle[];
  projectiles: Projectile[];
  keys: Set<string>;
  camera: Camera;
  combat: CombatState | null;
  save: SaveData;
  shake: { x: number; y: number; intensity: number; timer: number };
  combo: { count: number; timer: number; multiplier: number };
  hitEnemies: Set<Enemy>;
  trail: Array<{ x: number; y: number; age: number }>;
  bossAlive: boolean;
  spawnTimer: number;
  nearZone: CombatZone | null;
  nearTown: string | null;
  transition: { timer: number; text: string; callback: (() => void) | null };
  zoneClearPopup: { timer: number; gold: number; xp: number } | null;
  totalPlayTime: number;
  objective: string;
}

export function createGameState(): GameState {
  const save = loadGame() ?? defaultSave();
  return {
    screen: "title",
    player: makePlayer(save),
    enemies: [],
    golds: [],
    dmgNumbers: [],
    particles: [],
    projectiles: [],
    keys: new Set(),
    camera: { x: save.overworldX ?? 600, y: save.overworldY ?? 2200, targetX: save.overworldX ?? 600, targetY: save.overworldY ?? 2200 },
    combat: null,
    save,
    shake: { x: 0, y: 0, intensity: 0, timer: 0 },
    combo: { count: 0, timer: 0, multiplier: 1 },
    hitEnemies: new Set(),
    trail: [],
    bossAlive: false,
    spawnTimer: 0,
    nearZone: null,
    nearTown: null,
    transition: { timer: 0, text: "", callback: null },
    zoneClearPopup: null,
    totalPlayTime: save.totalPlayTime ?? 0,
    objective: computeObjective(save),
  };
}

function makePlayer(save: SaveData): PlayerState {
  const stats = computeStats(save.upgradeLevels, save.level ?? 1);
  return {
    x: save.overworldX ?? 600,
    y: save.overworldY ?? 2200,
    hp: stats.maxHp,
    gold: save.gold,
    xp: save.xp ?? 0,
    level: save.level ?? 1,
    facing: 0,
    swinging: false,
    swingAngle: 0,
    swingDir: 1,
    invincibleTimer: 0,
    stats,
    charging: false,
    chargeTime: 0,
    chargedRelease: false,
    dashTimer: 0,
    dashCooldown: 0,
    dashDirX: 0,
    dashDirY: 0,
    whirlwindTimer: 0,
    whirlwindCooldown: 0,
    warcryCooldown: 0,
    attackBuff: 0,
    attackBuffTimer: 0,
  };
}

export function computeStats(upgradeLevels: number[], level: number): PlayerStats {
  const s = { ...BASE_STATS };
  for (let i = 0; i < UPGRADES.length; i++) {
    const u = UPGRADES[i];
    if (i < upgradeLevels.length) {
      (s[u.key] as number) += u.perLevel * upgradeLevels[i];
    }
  }
  s.maxHp += HP_PER_LEVEL * (level - 1);
  s.attack += Math.floor(level * 0.5);
  return s;
}

function computeObjective(save: SaveData): string {
  const bosses = save.defeatedBosses ?? [];
  if (!bosses.includes("King Slime")) return "Defeat King Slime in Meadow Depths";
  if (!bosses.includes("Ancient Treant")) return "Defeat Ancient Treant in Ancient Grove";
  if (!bosses.includes("Sand Wyrm")) return "Defeat Sand Wyrm in Wyrm's Lair";
  if (!bosses.includes("Frost Dragon")) return "Defeat Frost Dragon at Dragon's Roost";
  if (!bosses.includes("Magma Titan")) return "Defeat Magma Titan at Titan's Forge";
  if (!bosses.includes("Void Emperor")) return "Defeat the Void Emperor";
  return "All bosses defeated! You are the champion!";
}

// ── Save helpers ───────────────────────────────────────────────────────────

export function doSave(gs: GameState) {
  const s = gs.save;
  s.gold = gs.player.gold;
  s.xp = gs.player.xp;
  s.level = gs.player.level;
  s.overworldX = gs.screen === "overworld" ? gs.player.x : s.overworldX;
  s.overworldY = gs.screen === "overworld" ? gs.player.y : s.overworldY;
  s.totalPlayTime = gs.totalPlayTime;
  saveGame(s);
}

// ── Spawn helpers ──────────────────────────────────────────────────────────

function spawnEnemyFromTemplate(template: EnemyTemplate, arenaW: number, arenaH: number): Enemy {
  // Spawn from random edge
  let x: number, y: number;
  const side = Math.floor(Math.random() * 4);
  const margin = ARENA_MARGIN;
  if (side === 0) { x = -20; y = margin + Math.random() * (arenaH - margin * 2); }
  else if (side === 1) { x = arenaW + 20; y = margin + Math.random() * (arenaH - margin * 2); }
  else if (side === 2) { x = margin + Math.random() * (arenaW - margin * 2); y = -20; }
  else { x = margin + Math.random() * (arenaW - margin * 2); y = arenaH + 20; }

  return {
    x, y,
    hp: template.hp,
    maxHp: template.hp,
    attack: template.attack,
    speed: template.speed,
    gold: template.gold,
    size: template.size,
    color: template.color,
    name: template.name,
    xpReward: template.xpReward,
    knockbackX: 0, knockbackY: 0,
    flashTimer: 0,
    dead: false,
    deathTimer: 0,
    shape: template.shape,
    behavior: template.behavior,
    isBoss: false,
    bossAttackTimer: 0,
    accentColor: "",
    animTimer: 0,
    slowTimer: 0,
    burnTimer: 0,
    burnDamage: 0,
    behaviorTimer: template.behavior === "ranged" ? 1.5 : template.behavior === "charger" ? 2 : template.behavior === "summoner" ? 5 : template.behavior === "healer" ? 3 : template.behavior === "teleporter" ? (template.teleportInterval ?? 3) : 0,
    behaviorState: "idle",
    projectileColor: template.projectileColor,
    projectileSpeed: template.projectileSpeed,
    projectileDamage: template.projectileDamage,
    chargeSpeed: template.chargeSpeed,
    summonName: template.summonName,
    healAmount: template.healAmount,
    teleportInterval: template.teleportInterval,
  };
}

function spawnBossFromDef(boss: any): Enemy {
  const e = spawnEnemyFromTemplate({
    name: boss.name, color: boss.color, hp: boss.hp, attack: boss.attack,
    speed: boss.speed, gold: boss.gold, size: boss.size, xpReward: boss.xpReward,
    shape: boss.shape, behavior: "chaser",
  }, CANVAS_W, CANVAS_H);
  e.isBoss = true;
  e.title = boss.title;
  e.accentColor = boss.accentColor;
  e.bossAttackTimer = boss.attackInterval;
  return e;
}

function addShake(gs: GameState, intensity: number) {
  gs.shake.intensity = Math.min(gs.shake.intensity + intensity, 12);
  gs.shake.timer = Math.max(gs.shake.timer, intensity * 0.04);
}

function spawnParticles(gs: GameState, x: number, y: number, color: string, count: number, type: Particle["type"], speed = 150) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = randRange(speed * 0.3, speed);
    gs.particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: randRange(0.2, 0.5),
      maxLife: 0.5,
      size: randRange(2, 5),
      color, type,
    });
  }
}

// ── Transition helper ──────────────────────────────────────────────────────

function startTransition(gs: GameState, text: string, duration: number, callback: () => void) {
  gs.screen = "zone-transition";
  gs.transition = { timer: duration, text, callback };
}

// ── Enter/Exit Combat ──────────────────────────────────────────────────────

function enterCombat(gs: GameState, zone: CombatZone) {
  playZoneEnter();
  startTransition(gs, zone.name, 1.2, () => {
    gs.screen = "combat";
    gs.player.x = CANVAS_W / 2;
    gs.player.y = CANVAS_H / 2;
    gs.player.hp = gs.player.stats.maxHp;
    gs.enemies = [];
    gs.golds = [];
    gs.projectiles = [];
    gs.particles = [];
    gs.dmgNumbers = [];
    gs.spawnTimer = 0.5;
    gs.bossAlive = false;
    gs.combo = { count: 0, timer: 0, multiplier: 1 };
    gs.hitEnemies.clear();
    gs.trail = [];
    gs.combat = {
      zone,
      currentWave: 1,
      waveEnemiesSpawned: 0,
      waveEnemiesKilled: 0,
      waveEnemiesTotal: zone.enemiesPerWave,
      waveClearDelay: 0,
      bossSpawned: false,
      zoneComplete: false,
      retreating: false,
    };
  });
}

function exitCombat(gs: GameState, victory: boolean) {
  const zone = gs.combat?.zone;
  if (!zone) return;

  if (victory) {
    playZoneClear();
    // Mark zone cleared
    if (!gs.save.clearedZones) gs.save.clearedZones = [];
    if (!gs.save.clearedZones.includes(zone.id)) {
      gs.save.clearedZones.push(zone.id);
    }
    // Boss defeated
    if (zone.isBossZone && zone.boss) {
      if (!gs.save.defeatedBosses) gs.save.defeatedBosses = [];
      if (!gs.save.defeatedBosses.includes(zone.boss.name)) {
        gs.save.defeatedBosses.push(zone.boss.name);
      }
    }
    // Reward
    const repeat = (gs.save.clearedZones ?? []).includes(zone.id) && !victory;
    const mult = repeat ? 0.25 : 1;
    const goldReward = Math.floor(zone.completionReward.gold * mult);
    const xpReward = Math.floor(zone.completionReward.xp * mult);
    gs.player.gold += goldReward;
    gs.player.xp += xpReward;
    // Level ups from completion reward
    checkLevelUp(gs);
    gs.zoneClearPopup = { timer: 2.5, gold: goldReward, xp: xpReward };
  }

  gs.objective = computeObjective(gs.save);
  gs.combat = null;

  startTransition(gs, victory ? "Victory!" : "Retreating...", 0.8, () => {
    // Return to overworld near the zone
    gs.screen = "overworld";
    if (zone) {
      gs.player.x = zone.x + zone.w / 2;
      gs.player.y = zone.y + zone.h + 30;
    }
    gs.camera.x = gs.player.x;
    gs.camera.y = gs.player.y;
    gs.camera.targetX = gs.player.x;
    gs.camera.targetY = gs.player.y;
    doSave(gs);
  });
}

function checkLevelUp(gs: GameState) {
  const p = gs.player;
  while (p.xp >= xpForLevel(p.level)) {
    p.xp -= xpForLevel(p.level);
    p.level++;
    p.stats = computeStats(gs.save.upgradeLevels, p.level);
    p.hp = Math.min(p.hp + 10, p.stats.maxHp);
    playLevelUp();
    spawnParticles(gs, p.x, p.y, "#FFD700", 15, "spark", 200);
    gs.dmgNumbers.push({ x: p.x, y: p.y - 40, amount: -1, life: 1.2, color: "#FFD700" });
  }
}

// ── Main game loop ─────────────────────────────────────────────────────────

export function gameLoop(gs: GameState, ctx: CanvasRenderingContext2D, dt: number) {
  gs.totalPlayTime += dt;

  if (gs.screen === "zone-transition") {
    updateTransition(gs, dt);
    drawTransition(ctx, gs);
    return;
  }

  if (gs.screen === "overworld") {
    updateOverworld(gs, dt);
    drawOverworld(ctx, gs);
    drawHUD(ctx, gs);
    return;
  }

  if (gs.screen === "combat") {
    updateCombat(gs, dt);
    drawCombat(ctx, gs);
    drawHUD(ctx, gs);
    return;
  }
}

// ── Transition update ──────────────────────────────────────────────────────

function updateTransition(gs: GameState, dt: number) {
  gs.transition.timer -= dt;
  if (gs.transition.timer <= 0 && gs.transition.callback) {
    gs.transition.callback();
    gs.transition.callback = null;
  }
}

// ── Overworld update ───────────────────────────────────────────────────────

function updateOverworld(gs: GameState, dt: number) {
  const p = gs.player;
  const keys = gs.keys;

  // Movement
  let dx = 0, dy = 0;
  if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
  if (keys.has("arrowright") || keys.has("d")) dx += 1;
  if (keys.has("arrowup") || keys.has("w")) dy -= 1;
  if (keys.has("arrowdown") || keys.has("s")) dy += 1;
  const mag = Math.hypot(dx, dy) || 1;
  p.x += (dx / mag) * OVERWORLD_SPEED * dt;
  p.y += (dy / mag) * OVERWORLD_SPEED * dt;
  p.x = clamp(p.x, 20, WORLD_W - 20);
  p.y = clamp(p.y, 20, WORLD_H - 20);
  if (dx !== 0 || dy !== 0) p.facing = Math.atan2(dy, dx);

  // Camera follow
  gs.camera.targetX = p.x;
  gs.camera.targetY = p.y;
  gs.camera.x += (gs.camera.targetX - gs.camera.x) * 0.08;
  gs.camera.y += (gs.camera.targetY - gs.camera.y) * 0.08;

  // Zone proximity check
  gs.nearZone = null;
  for (const z of ZONES) {
    const region = REGIONS.find(r => r.id === z.regionId);
    if (region && !isRegionUnlocked(z.regionId, gs.save.defeatedBosses ?? [])) continue;
    const cx = z.x + z.w / 2;
    const cy = z.y + z.h / 2;
    if (dist(p.x, p.y, cx, cy) < ZONE_INTERACT_DIST + Math.max(z.w, z.h) / 2) {
      gs.nearZone = z;
      break;
    }
  }

  // Town proximity check
  gs.nearTown = null;
  for (const t of TOWNS) {
    if (!isRegionUnlocked(t.regionId, gs.save.defeatedBosses ?? [])) continue;
    if (dist(p.x, p.y, t.x, t.y) < TOWN_INTERACT_DIST) {
      gs.nearTown = t.name;
      break;
    }
  }

  // Zone clear popup timer
  if (gs.zoneClearPopup) {
    gs.zoneClearPopup.timer -= dt;
    if (gs.zoneClearPopup.timer <= 0) gs.zoneClearPopup = null;
  }

  // Auto-save periodically
  if (Math.floor(gs.totalPlayTime) % 60 === 0 && Math.floor(gs.totalPlayTime) > 0) {
    gs.save.overworldX = p.x;
    gs.save.overworldY = p.y;
    doSave(gs);
  }
}

// ── Combat update ──────────────────────────────────────────────────────────

function updateCombat(gs: GameState, dt: number) {
  const p = gs.player;
  const keys = gs.keys;
  const combat = gs.combat!;
  const combo = gs.combo;
  const shake = gs.shake;

  p.stats = computeStats(gs.save.upgradeLevels, p.level);

  // Screen shake
  if (shake.timer > 0) {
    shake.timer -= dt;
    shake.x = (Math.random() - 0.5) * shake.intensity * 2;
    shake.y = (Math.random() - 0.5) * shake.intensity * 2;
    shake.intensity *= 0.9;
  } else {
    shake.x = 0; shake.y = 0;
  }

  // Combo timer
  if (combo.timer > 0) {
    combo.timer -= dt;
    if (combo.timer <= 0) { combo.count = 0; combo.multiplier = 1; }
  }

  // Input & Movement (top-down, full arena)
  let dx = 0, dy = 0;
  if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
  if (keys.has("arrowright") || keys.has("d")) dx += 1;
  if (keys.has("arrowup") || keys.has("w")) dy -= 1;
  if (keys.has("arrowdown") || keys.has("s")) dy += 1;
  const mag = Math.hypot(dx, dy) || 1;
  p.x += (dx / mag) * p.stats.speed * dt;
  p.y += (dy / mag) * p.stats.speed * dt;
  p.x = clamp(p.x, ARENA_MARGIN, CANVAS_W - ARENA_MARGIN);
  p.y = clamp(p.y, ARENA_MARGIN, CANVAS_H - ARENA_MARGIN);
  if (dx !== 0 || dy !== 0) p.facing = Math.atan2(dy, dx);

  // Retreat check (walk to edge)
  if (p.x <= ARENA_MARGIN + 5 || p.x >= CANVAS_W - ARENA_MARGIN - 5 ||
      p.y <= ARENA_MARGIN + 5 || p.y >= CANVAS_H - ARENA_MARGIN - 5) {
    if (!combat.retreating) {
      combat.retreating = true;
      // Only allow retreat if not in boss fight
      if (!combat.zone.isBossZone || !gs.bossAlive) {
        exitCombat(gs, false);
        return;
      }
      combat.retreating = false; // Can't retreat from boss
    }
  } else {
    combat.retreating = false;
  }

  // Swing
  if ((keys.has(" ") || keys.has("j")) && !p.swinging) {
    p.swinging = true;
    p.swingAngle = 0;
    p.swingDir = 1;
    gs.hitEnemies.clear();
    gs.trail = [];
    playSwing();
  }

  if (p.swinging) {
    p.swingAngle += SWING_SPEED * dt;
    const trailAngle = p.facing - SWING_ARC / 2 + p.swingAngle;
    const tipX = p.x + Math.cos(trailAngle) * p.stats.swordLength;
    const tipY = p.y + Math.sin(trailAngle) * p.stats.swordLength;
    gs.trail.push({ x: tipX, y: tipY, age: 0 });
    if (gs.trail.length > 12) gs.trail.shift();
    if (p.swingAngle >= SWING_ARC) { p.swinging = false; p.swingAngle = 0; }
  }

  for (const t of gs.trail) t.age += dt;
  gs.trail = gs.trail.filter(t => t.age < 0.15);

  // HP regen
  p.hp = Math.min(p.stats.maxHp, p.hp + p.stats.hpRegen * dt);

  // Invincibility
  if (p.invincibleTimer > 0) p.invincibleTimer -= dt;

  // Wave spawning
  if (!combat.zoneComplete) {
    if (combat.waveClearDelay > 0) {
      combat.waveClearDelay -= dt;
    } else if (combat.waveEnemiesSpawned < combat.waveEnemiesTotal) {
      gs.spawnTimer -= dt;
      if (gs.spawnTimer <= 0 && gs.enemies.filter(e => !e.dead).length < MAX_ENEMIES) {
        const pool = combat.zone.enemyPool;
        const template = pool[Math.floor(Math.random() * pool.length)];
        gs.enemies.push(spawnEnemyFromTemplate(template, CANVAS_W, CANVAS_H));
        combat.waveEnemiesSpawned++;
        gs.spawnTimer = 0.4;
      }
    } else if (gs.enemies.filter(e => !e.dead).length === 0 && combat.waveEnemiesKilled >= combat.waveEnemiesTotal) {
      // Wave cleared
      if (combat.currentWave < combat.zone.waveCount) {
        combat.currentWave++;
        combat.waveEnemiesSpawned = 0;
        combat.waveEnemiesKilled = 0;
        combat.waveEnemiesTotal = combat.zone.enemiesPerWave;
        combat.waveClearDelay = 1.5;
        gs.dmgNumbers.push({ x: CANVAS_W / 2, y: CANVAS_H / 2 - 30, amount: -combat.currentWave - 100, life: 1.5, color: "#87CEEB" });
      } else if (combat.zone.isBossZone && combat.zone.boss && !combat.bossSpawned) {
        // Spawn boss
        combat.bossSpawned = true;
        gs.bossAlive = true;
        gs.enemies.push(spawnBossFromDef(combat.zone.boss));
        gs.dmgNumbers.push({ x: CANVAS_W / 2, y: 60, amount: -999, life: 2, color: "#ff4500" });
      } else if (combat.zone.miniBoss && !combat.bossSpawned && combat.currentWave === combat.zone.waveCount) {
        // Spawn mini-boss on last wave for non-boss zones
        combat.bossSpawned = true;
        const mb = spawnEnemyFromTemplate(combat.zone.miniBoss, CANVAS_W, CANVAS_H);
        mb.isBoss = true;
        mb.title = combat.zone.miniBoss.name;
        gs.bossAlive = true;
        gs.enemies.push(mb);
      } else {
        // Zone complete!
        combat.zoneComplete = true;
        exitCombat(gs, true);
        return;
      }
    }
  }

  // Sword tip for hit detection
  const swordTipAngle = p.swinging ? p.facing - SWING_ARC / 2 + p.swingAngle : p.facing;
  const swordX1 = p.x, swordY1 = p.y;
  const swordX2 = p.x + Math.cos(swordTipAngle) * p.stats.swordLength;
  const swordY2 = p.y + Math.sin(swordTipAngle) * p.stats.swordLength;

  // Update enemies
  for (const e of gs.enemies) {
    if (e.dead) { e.deathTimer -= dt; continue; }

    // Knockback
    if (Math.abs(e.knockbackX) > 0.5 || Math.abs(e.knockbackY) > 0.5) {
      e.x += e.knockbackX * dt * 8;
      e.y += e.knockbackY * dt * 8;
      e.knockbackX *= 0.9;
      e.knockbackY *= 0.9;
    }

    e.flashTimer = Math.max(0, e.flashTimer - dt);
    e.animTimer += dt;

    // Behavior AI
    updateEnemyBehavior(gs, e, p, dt);

    // Clamp to arena
    e.x = clamp(e.x, -10, CANVAS_W + 10);
    e.y = clamp(e.y, -10, CANVAS_H + 10);

    // Sword hit check
    if (p.swinging && !gs.hitEnemies.has(e) &&
        lineCircleIntersect(swordX1, swordY1, swordX2, swordY2, e.x, e.y, e.size, p.stats.swordWidth)) {
      gs.hitEnemies.add(e);
      const isCrit = Math.random() < p.stats.critChance;
      let dmg = p.stats.attack + Math.floor(Math.random() * 3);
      if (isCrit) dmg = Math.floor(dmg * 2);
      dmg = Math.floor(dmg * combo.multiplier);
      e.hp -= dmg;
      e.flashTimer = 0.12;
      const knockAngle = Math.atan2(e.y - p.y, e.x - p.x);
      const knockForce = e.isBoss ? 30 : 60;
      e.knockbackX = Math.cos(knockAngle) * knockForce;
      e.knockbackY = Math.sin(knockAngle) * knockForce;

      spawnParticles(gs, (p.x + e.x) / 2, (p.y + e.y) / 2, isCrit ? "#FFD700" : "#fff", isCrit ? 8 : 4, "spark", 120);
      addShake(gs, isCrit ? 4 : 2);
      isCrit ? playCrit() : playHit();

      gs.dmgNumbers.push({
        x: e.x, y: e.y - e.size - 5, amount: dmg, life: 0.8,
        color: isCrit ? "#FFD700" : "#fff",
      });

      if (e.hp <= 0) {
        e.dead = true;
        e.deathTimer = 0.3;
        p.xp += e.xpReward;
        combat.waveEnemiesKilled++;

        // Combo
        combo.count++;
        combo.timer = COMBO_WINDOW;
        combo.multiplier = 1 + Math.min(combo.count, 20) * 0.1;
        if (combo.count > gs.save.highestCombo) gs.save.highestCombo = combo.count;

        spawnParticles(gs, e.x, e.y, e.color, e.isBoss ? 30 : 12, "death", e.isBoss ? 250 : 150);
        addShake(gs, e.isBoss ? 10 : 3);
        e.isBoss ? playBossKill() : playKill();
        if (e.isBoss) gs.bossAlive = false;

        gs.save.totalKills++;
        checkLevelUp(gs);

        // Gold drop
        gs.golds.push({
          x: e.x, y: e.y,
          amount: e.gold + Math.floor(Math.random() * (e.gold * 0.3 + 1)),
          vy: 0,
          life: 4,
        });

        // Combo text
        if (combo.count >= 3) {
          gs.dmgNumbers.push({
            x: p.x + randRange(-20, 20), y: p.y - 55,
            amount: -combo.count, life: 1.0,
            color: combo.count >= 10 ? "#ff4500" : combo.count >= 5 ? "#FFD700" : "#87CEEB",
          });
        }

        // Check if boss killed = zone clear
        if (e.isBoss && combat.bossSpawned && gs.enemies.filter(en => !en.dead).length <= 1) {
          // Wait for death animation then zone complete
          combat.zoneComplete = true;
        }
      }
    }

    // Enemy damages player
    if (!e.dead && p.invincibleTimer <= 0 && dist(p.x, p.y, e.x, e.y) < e.size + 14) {
      const rawDmg = Math.max(1, e.attack - p.stats.defense);
      p.hp -= rawDmg;
      p.invincibleTimer = 0.5;
      addShake(gs, 5);
      playDamage();
      spawnParticles(gs, p.x, p.y, "#FF6B6B", 6, "blood", 100);
      gs.dmgNumbers.push({ x: p.x, y: p.y - 30, amount: rawDmg, life: 0.6, color: "#FF6B6B" });
      if (p.hp <= 0) {
        p.hp = 0;
        doSave(gs);
        gs.screen = "gameover";
        return;
      }
    }
  }

  // Zone complete after boss death animation
  if (combat.zoneComplete && gs.enemies.filter(e => !e.dead || e.deathTimer > 0).length === 0) {
    exitCombat(gs, true);
    return;
  }

  // Remove dead enemies
  gs.enemies = gs.enemies.filter(e => !e.dead || e.deathTimer > 0);

  // Update projectiles
  for (const proj of gs.projectiles) {
    proj.x += proj.vx * dt;
    proj.y += proj.vy * dt;
    proj.life -= dt;
    // Hit player
    if (proj.fromEnemy && p.invincibleTimer <= 0 && dist(p.x, p.y, proj.x, proj.y) < proj.size + 12) {
      const rawDmg = Math.max(1, proj.damage - p.stats.defense);
      p.hp -= rawDmg;
      p.invincibleTimer = 0.5;
      addShake(gs, 3);
      playDamage();
      spawnParticles(gs, p.x, p.y, "#FF6B6B", 4, "blood", 80);
      gs.dmgNumbers.push({ x: p.x, y: p.y - 30, amount: rawDmg, life: 0.6, color: "#FF6B6B" });
      proj.life = 0;
      if (p.hp <= 0) {
        p.hp = 0;
        doSave(gs);
        gs.screen = "gameover";
        return;
      }
    }
  }
  gs.projectiles = gs.projectiles.filter(pr => pr.life > 0);

  // Particles (no gravity in top-down)
  for (const pt of gs.particles) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vx *= 0.95;
    pt.vy *= 0.95;
    pt.life -= dt;
  }
  gs.particles = gs.particles.filter(pt => pt.life > 0);

  // Gold drops (float in place in top-down)
  for (const g of gs.golds) {
    g.life -= dt;
    if (dist(p.x, p.y, g.x, g.y) < 50) {
      p.gold += g.amount;
      g.life = 0;
    }
  }
  gs.golds = gs.golds.filter(g => g.life > 0);

  // Damage numbers
  for (const d of gs.dmgNumbers) { d.y -= 40 * dt; d.life -= dt; }
  gs.dmgNumbers = gs.dmgNumbers.filter(d => d.life > 0);
}

// ── Enemy behavior AI ──────────────────────────────────────────────────────

function updateEnemyBehavior(gs: GameState, e: Enemy, p: PlayerState, dt: number) {
  const ex = p.x - e.x;
  const ey = p.y - e.y;
  const ed = Math.hypot(ex, ey) || 1;

  switch (e.behavior) {
    case "chaser":
      e.x += (ex / ed) * e.speed * dt;
      e.y += (ey / ed) * e.speed * dt;
      break;

    case "ranged":
      e.behaviorTimer -= dt;
      if (ed > 150) {
        // Move closer
        e.x += (ex / ed) * e.speed * dt;
        e.y += (ey / ed) * e.speed * dt;
      } else if (ed < 80) {
        // Back away
        e.x -= (ex / ed) * e.speed * 0.5 * dt;
        e.y -= (ey / ed) * e.speed * 0.5 * dt;
      }
      if (e.behaviorTimer <= 0) {
        // Fire projectile
        const speed = e.projectileSpeed ?? 140;
        gs.projectiles.push({
          x: e.x, y: e.y,
          vx: (ex / ed) * speed, vy: (ey / ed) * speed,
          size: 5, damage: e.projectileDamage ?? e.attack,
          color: e.projectileColor ?? "#f00", life: 3, fromEnemy: true,
        });
        e.behaviorTimer = 1.5 + Math.random() * 0.5;
      }
      break;

    case "charger":
      e.behaviorTimer -= dt;
      if (e.behaviorState === "idle") {
        // Slowly approach
        e.x += (ex / ed) * e.speed * 0.3 * dt;
        e.y += (ey / ed) * e.speed * 0.3 * dt;
        if (e.behaviorTimer <= 0) {
          e.behaviorState = "telegraph";
          e.behaviorTimer = 0.5;
          e.chargeDirX = ex / ed;
          e.chargeDirY = ey / ed;
        }
      } else if (e.behaviorState === "telegraph") {
        e.behaviorTimer -= dt;
        if (e.behaviorTimer <= 0) {
          e.behaviorState = "attacking";
          e.behaviorTimer = 0.4;
        }
      } else if (e.behaviorState === "attacking") {
        const cspd = e.chargeSpeed ?? 250;
        e.x += (e.chargeDirX ?? 0) * cspd * dt;
        e.y += (e.chargeDirY ?? 0) * cspd * dt;
        e.behaviorTimer -= dt;
        if (e.behaviorTimer <= 0) {
          e.behaviorState = "cooldown";
          e.behaviorTimer = 1;
        }
      } else {
        e.behaviorTimer -= dt;
        if (e.behaviorTimer <= 0) {
          e.behaviorState = "idle";
          e.behaviorTimer = 2 + Math.random();
        }
      }
      break;

    case "summoner":
      e.x += (ex / ed) * e.speed * 0.5 * dt;
      e.y += (ey / ed) * e.speed * 0.5 * dt;
      e.behaviorTimer -= dt;
      if (e.behaviorTimer <= 0 && gs.enemies.filter(en => !en.dead).length < MAX_ENEMIES) {
        // Summon a small enemy
        const summon = gs.combat?.zone.enemyPool.find(t => t.name === e.summonName) ?? gs.combat?.zone.enemyPool[0];
        if (summon) {
          const s = spawnEnemyFromTemplate(summon, CANVAS_W, CANVAS_H);
          s.x = e.x + randRange(-30, 30);
          s.y = e.y + randRange(-30, 30);
          s.hp = Math.floor(s.hp * 0.6);
          s.gold = Math.floor(s.gold * 0.3);
          s.xpReward = Math.floor(s.xpReward * 0.3);
          gs.enemies.push(s);
          spawnParticles(gs, e.x, e.y, "#aa44ff", 6, "spark", 80);
        }
        e.behaviorTimer = 5 + Math.random() * 2;
      }
      break;

    case "healer":
      // Move toward nearest injured ally
      let healTarget: Enemy | null = null;
      let minDist = 200;
      for (const ally of gs.enemies) {
        if (ally === e || ally.dead || ally.hp >= ally.maxHp) continue;
        const d = dist(e.x, e.y, ally.x, ally.y);
        if (d < minDist) { minDist = d; healTarget = ally; }
      }
      if (healTarget) {
        const hx = healTarget.x - e.x;
        const hy = healTarget.y - e.y;
        const hd = Math.hypot(hx, hy) || 1;
        e.x += (hx / hd) * e.speed * dt;
        e.y += (hy / hd) * e.speed * dt;
      } else {
        e.x += (ex / ed) * e.speed * 0.4 * dt;
        e.y += (ey / ed) * e.speed * 0.4 * dt;
      }
      e.behaviorTimer -= dt;
      if (e.behaviorTimer <= 0) {
        // Heal nearby allies
        for (const ally of gs.enemies) {
          if (ally === e || ally.dead) continue;
          if (dist(e.x, e.y, ally.x, ally.y) < 80) {
            ally.hp = Math.min(ally.maxHp, ally.hp + (e.healAmount ?? 5));
            spawnParticles(gs, ally.x, ally.y, "#5cb85c", 4, "spark", 60);
          }
        }
        e.behaviorTimer = 3 + Math.random();
      }
      break;

    case "teleporter":
      e.x += (ex / ed) * e.speed * 0.3 * dt;
      e.y += (ey / ed) * e.speed * 0.3 * dt;
      e.behaviorTimer -= dt;
      if (e.behaviorTimer <= 0) {
        // Teleport to random position near player
        spawnParticles(gs, e.x, e.y, e.color, 6, "spark", 100);
        e.x = p.x + randRange(-150, 150);
        e.y = p.y + randRange(-150, 150);
        e.x = clamp(e.x, ARENA_MARGIN, CANVAS_W - ARENA_MARGIN);
        e.y = clamp(e.y, ARENA_MARGIN, CANVAS_H - ARENA_MARGIN);
        spawnParticles(gs, e.x, e.y, e.color, 6, "spark", 100);
        e.behaviorTimer = e.teleportInterval ?? 3;
      }
      break;
  }
}

// ── Key handler ────────────────────────────────────────────────────────────

export function handleKeyDown(gs: GameState, key: string, callbacks: {
  setScreen: (s: GameScreen) => void;
  openShop: () => void;
  toggleSfx: () => void;
  startGame: () => void;
}) {
  gs.keys.add(key);

  if (key === "m") callbacks.toggleSfx();

  if (gs.screen === "overworld") {
    if ((key === " " || key === "enter") && gs.nearZone) {
      enterCombat(gs, gs.nearZone);
    }
    if (key === "e" && gs.nearTown) {
      callbacks.openShop();
    }
  }

  if (gs.screen === "title" && (key === "enter" || key === " ")) {
    callbacks.startGame();
  }

  if (gs.screen === "gameover" && (key === "enter" || key === " ")) {
    callbacks.startGame();
  }

  if (key === " " && ["combat", "title", "gameover"].includes(gs.screen)) {
    // prevent scroll
  }
}

export function handleKeyUp(gs: GameState, key: string) {
  gs.keys.delete(key);
}

// ── Start game (new or continue) ───────────────────────────────────────────

export function startGame(gs: GameState) {
  const save = gs.save;
  gs.player = makePlayer(save);
  gs.player.hp = gs.player.stats.maxHp;
  gs.player.gold = save.gold;
  gs.enemies = [];
  gs.golds = [];
  gs.dmgNumbers = [];
  gs.particles = [];
  gs.projectiles = [];
  gs.combat = null;
  gs.bossAlive = false;
  gs.combo = { count: 0, timer: 0, multiplier: 1 };
  gs.hitEnemies.clear();
  gs.trail = [];
  gs.screen = "overworld";
  gs.camera = { x: save.overworldX ?? 600, y: save.overworldY ?? 2200, targetX: save.overworldX ?? 600, targetY: save.overworldY ?? 2200 };
  gs.objective = computeObjective(save);
}

// ── Respawn after death ────────────────────────────────────────────────────

export function respawnAtTown(gs: GameState) {
  const town = TOWNS.find(t => t.name === gs.save.lastTown) ?? TOWNS[0];
  gs.save.overworldX = town.x;
  gs.save.overworldY = town.y;
  doSave(gs);
  startGame(gs);
}
