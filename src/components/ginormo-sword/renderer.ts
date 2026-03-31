// Ginormo Sword – All Canvas Rendering

import {
  CANVAS_W, CANVAS_H, SWING_ARC, ARENA_MARGIN,
  clamp, roundRect, darkenColor, xpForLevel,
  type Enemy, type Particle,
} from "@/lib/ginormo-sword-data";
import { REGIONS, ZONES, TOWNS, isRegionUnlocked } from "@/lib/ginormo-sword-world";
import type { GameState } from "./engine";

// ── Overworld rendering ────────────────────────────────────────────────────

export function drawOverworld(ctx: CanvasRenderingContext2D, gs: GameState) {
  const cam = gs.camera;
  const p = gs.player;
  const offX = -cam.x + CANVAS_W / 2;
  const offY = -cam.y + CANVAS_H / 2;

  // Background
  ctx.fillStyle = "#2a3a1a";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.save();
  ctx.translate(offX, offY);

  // Draw regions
  for (const r of REGIONS) {
    const unlocked = isRegionUnlocked(r.id, gs.save.defeatedBosses ?? []);
    ctx.fillStyle = unlocked ? r.groundColor : darkenColor(r.groundColor.startsWith("#") ? r.groundColor : "#333333", 0.5);
    ctx.globalAlpha = unlocked ? 1 : 0.4;
    ctx.fillRect(r.x, r.y, r.w, r.h);

    // Region border
    ctx.strokeStyle = unlocked ? r.accentColor : "#333";
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    // Region name
    ctx.fillStyle = unlocked ? "#fff" : "#666";
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    ctx.fillText(r.name, r.x + r.w / 2, r.y + 20);

    if (!unlocked) {
      ctx.font = "10px monospace";
      ctx.fillStyle = "#888";
      ctx.fillText("(Locked)", r.x + r.w / 2, r.y + 36);
    }

    ctx.globalAlpha = 1;

    // Decorations
    if (unlocked) {
      for (const d of r.decorations) {
        drawDecoration(ctx, d.type, d.x, d.y, d.size, d.color);
      }
    }
  }

  // Draw paths between regions (simple lines connecting region centers)
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  for (let i = 0; i < REGIONS.length - 1; i++) {
    const a = REGIONS[i];
    const b = REGIONS[i + 1];
    ctx.beginPath();
    ctx.moveTo(a.x + a.w / 2, a.y + a.h / 2);
    ctx.lineTo(b.x + b.w / 2, b.y + b.h / 2);
    ctx.stroke();
  }

  // Draw zone markers
  for (const z of ZONES) {
    const regionUnlocked = isRegionUnlocked(z.regionId, gs.save.defeatedBosses ?? []);
    if (!regionUnlocked) continue;

    const cleared = (gs.save.clearedZones ?? []).includes(z.id);
    const cx = z.x + z.w / 2;
    const cy = z.y + z.h / 2;

    // Zone box
    if (!cleared) {
      // Pulsing border for uncleared
      const pulse = 0.5 + Math.sin(Date.now() * 0.004 + z.x) * 0.3;
      ctx.strokeStyle = z.isBossZone ? `rgba(255,100,0,${pulse})` : `rgba(255,255,100,${pulse})`;
      ctx.lineWidth = z.isBossZone ? 3 : 2;
    } else {
      ctx.strokeStyle = "rgba(100,200,100,0.5)";
      ctx.lineWidth = 1;
    }
    ctx.fillStyle = cleared ? "rgba(100,200,100,0.2)" : z.isBossZone ? "rgba(255,100,0,0.15)" : "rgba(200,200,100,0.15)";
    ctx.fillRect(z.x, z.y, z.w, z.h);
    ctx.strokeRect(z.x, z.y, z.w, z.h);

    // Zone name
    ctx.fillStyle = cleared ? "#8a8" : "#fff";
    ctx.font = z.isBossZone ? "bold 9px monospace" : "8px monospace";
    ctx.textAlign = "center";
    ctx.fillText(z.name, cx, cy - 3);

    // Level recommendation
    ctx.fillStyle = cleared ? "#686" : "#aaa";
    ctx.font = "7px monospace";
    ctx.fillText(`Lv ${z.recommendedLevel}`, cx, cy + 8);

    if (z.isBossZone && !cleared) {
      ctx.fillStyle = "#ff6600";
      ctx.font = "bold 7px monospace";
      ctx.fillText("BOSS", cx, cy + 17);
    }
    if (cleared) {
      ctx.fillStyle = "#5cb85c";
      ctx.font = "7px monospace";
      ctx.fillText("\u2713", cx + z.w / 2 - 8, z.y + 10);
    }
  }

  // Draw town markers
  for (const t of TOWNS) {
    if (!isRegionUnlocked(t.regionId, gs.save.defeatedBosses ?? [])) continue;
    // House icon
    ctx.fillStyle = "#daa520";
    ctx.beginPath();
    ctx.moveTo(t.x, t.y - 10);
    ctx.lineTo(t.x - 8, t.y);
    ctx.lineTo(t.x + 8, t.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(t.x - 6, t.y, 12, 10);
    ctx.fillStyle = "#444";
    ctx.fillRect(t.x - 2, t.y + 3, 4, 7);
    // Name
    ctx.fillStyle = "#fff";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(t.name, t.x, t.y - 14);
  }

  // Draw player
  drawOverworldPlayer(ctx, p);

  ctx.restore();

  // Draw minimap
  drawMinimap(ctx, gs);

  // Interaction prompts
  if (gs.nearZone) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    roundRect(ctx, CANVAS_W / 2 - 120, CANVAS_H - 50, 240, 30, 6);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`Press SPACE to enter ${gs.nearZone.name}`, CANVAS_W / 2, CANVAS_H - 30);
  }

  if (gs.nearTown) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    roundRect(ctx, CANVAS_W / 2 - 100, CANVAS_H - 50, 200, 30, 6);
    ctx.fill();
    ctx.fillStyle = "#daa520";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`Press E for Shop (${gs.nearTown})`, CANVAS_W / 2, CANVAS_H - 30);
  }

  // Zone clear popup
  if (gs.zoneClearPopup) {
    const pop = gs.zoneClearPopup;
    const alpha = clamp(pop.timer / 0.5, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    roundRect(ctx, CANVAS_W / 2 - 100, 80, 200, 60, 8);
    ctx.fill();
    ctx.fillStyle = "#5cb85c";
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Zone Clear!", CANVAS_W / 2, 105);
    ctx.fillStyle = "#FFD700";
    ctx.font = "12px monospace";
    ctx.fillText(`+${pop.gold} Gold  +${pop.xp} XP`, CANVAS_W / 2, 125);
    ctx.globalAlpha = 1;
  }
}

function drawOverworldPlayer(ctx: CanvasRenderingContext2D, p: { x: number; y: number; facing: number }) {
  // Body circle
  ctx.fillStyle = "#4488cc";
  ctx.beginPath();
  ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#336699";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Facing indicator (small triangle)
  const fx = p.x + Math.cos(p.facing) * 14;
  const fy = p.y + Math.sin(p.facing) * 14;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(fx, fy, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawDecoration(ctx: CanvasRenderingContext2D, type: string, x: number, y: number, size: number, color: string) {
  ctx.fillStyle = color;
  switch (type) {
    case "tree":
      // Trunk
      ctx.fillStyle = "#5a3a1a";
      ctx.fillRect(x - 2, y, 4, size);
      // Canopy
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y - 2, size * 0.8, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "rock":
      ctx.beginPath();
      ctx.ellipse(x, y, size, size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "bush":
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y - size * 0.3, size * 0.7, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "cactus":
      ctx.fillStyle = color;
      ctx.fillRect(x - 2, y - size, 4, size);
      ctx.fillRect(x - size * 0.5, y - size * 0.7, size * 0.3, 3);
      ctx.fillRect(x + 2, y - size * 0.5, size * 0.4, 3);
      break;
    case "mushroom":
      ctx.fillStyle = "#8a6a4a";
      ctx.fillRect(x - 1, y, 2, size * 0.6);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, size * 0.6, Math.PI, 0);
      ctx.fill();
      break;
    case "ruin":
      ctx.fillRect(x - size * 0.5, y - size, size * 0.3, size);
      ctx.fillRect(x + size * 0.2, y - size * 0.7, size * 0.3, size * 0.7);
      break;
    case "lava_pool":
      ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.003 + x) * 0.2;
      ctx.beginPath();
      ctx.ellipse(x, y, size, size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      break;
    case "ice_crystal":
      ctx.fillStyle = color;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(0.3);
      ctx.fillRect(-2, -size, 4, size);
      ctx.rotate(-0.6);
      ctx.fillRect(-2, -size * 0.8, 4, size * 0.8);
      ctx.restore();
      break;
    case "pillar":
      ctx.fillRect(x - 3, y - size, 6, size);
      ctx.fillRect(x - 5, y - size, 10, 3);
      break;
  }
}

function drawMinimap(ctx: CanvasRenderingContext2D, gs: GameState) {
  const mmW = 120, mmH = 90;
  const mmX = CANVAS_W - mmW - 8, mmY = 8;
  const scaleX = mmW / 4000, scaleY = mmH / 3000;

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(mmX, mmY, mmW, mmH);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(mmX, mmY, mmW, mmH);

  // Regions
  for (const r of REGIONS) {
    const unlocked = isRegionUnlocked(r.id, gs.save.defeatedBosses ?? []);
    ctx.fillStyle = unlocked ? r.groundColor : "#333";
    ctx.globalAlpha = unlocked ? 0.6 : 0.2;
    ctx.fillRect(mmX + r.x * scaleX, mmY + r.y * scaleY, r.w * scaleX, r.h * scaleY);
  }
  ctx.globalAlpha = 1;

  // Player dot
  ctx.fillStyle = "#4488cc";
  ctx.beginPath();
  ctx.arc(mmX + gs.player.x * scaleX, mmY + gs.player.y * scaleY, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(mmX + gs.player.x * scaleX, mmY + gs.player.y * scaleY, 1, 0, Math.PI * 2);
  ctx.fill();
}

// ── Combat rendering ───────────────────────────────────────────────────────

export function drawCombat(ctx: CanvasRenderingContext2D, gs: GameState) {
  const p = gs.player;
  const combat = gs.combat!;
  const shake = gs.shake;

  ctx.save();
  ctx.translate(shake.x, shake.y);

  // Arena floor
  ctx.fillStyle = combat.zone.arenaColor;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Arena border
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 2;
  ctx.strokeRect(ARENA_MARGIN, ARENA_MARGIN, CANVAS_W - ARENA_MARGIN * 2, CANVAS_H - ARENA_MARGIN * 2);

  // Grid lines for visual reference
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  for (let x = 0; x < CANVAS_W; x += 50) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
  }
  for (let y = 0; y < CANVAS_H; y += 50) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
  }

  // Particles
  drawParticles(ctx, gs.particles);

  // Gold drops
  for (const g of gs.golds) {
    const pulse = 1 + Math.sin(Date.now() * 0.01 + g.x) * 0.15;
    const alpha = clamp(g.life / 1, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(g.x, g.y, 5 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = alpha * 0.5;
    ctx.beginPath();
    ctx.arc(g.x - 1, g.y - 1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Projectiles
  for (const proj of gs.projectiles) {
    ctx.fillStyle = proj.color;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, proj.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Enemies
  for (const e of gs.enemies) {
    drawEnemy(ctx, e, p);
  }

  // Player
  drawCombatPlayer(ctx, gs);

  // Damage numbers
  drawDamageNumbers(ctx, gs.dmgNumbers);

  ctx.restore(); // undo shake

  // Combat HUD (wave counter, boss warning)
  drawCombatHUD(ctx, gs);
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const pt of particles) {
    const alpha = clamp(pt.life / pt.maxLife, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = pt.color;
    if (pt.type === "spark") {
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
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, p: { x: number; y: number }) {
  const alpha = e.dead ? e.deathTimer / 0.3 : 1;
  ctx.globalAlpha = alpha;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(e.x, e.y + e.size, e.size * 0.7, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  const drawSize = e.dead ? e.size * (1 + (0.3 - e.deathTimer) * 2) : e.size;

  // Boss glow
  if (e.isBoss && !e.dead) {
    ctx.fillStyle = e.color + "40";
    ctx.beginPath();
    ctx.arc(e.x, e.y, drawSize + 8 + Math.sin(Date.now() * 0.005) * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Charger telegraph
  if (e.behavior === "charger" && e.behaviorState === "telegraph" && !e.dead) {
    ctx.strokeStyle = "rgba(255,0,0,0.5)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    const len = 100;
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.lineTo(e.x + (e.chargeDirX ?? 0) * len, e.y + (e.chargeDirY ?? 0) * len);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Body
  ctx.fillStyle = e.flashTimer > 0 ? "#fff" : e.color;
  ctx.beginPath();
  ctx.arc(e.x, e.y, drawSize, 0, Math.PI * 2);
  ctx.fill();

  // Outline
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
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(e.x - eyeOff, e.y - e.size * 0.15, eyeSize, 0, Math.PI * 2);
    ctx.arc(e.x + eyeOff, e.y - e.size * 0.15, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    const lookX = clamp((p.x - e.x) * 0.02, -2, 2);
    const lookY = clamp((p.y - e.y) * 0.02, -1, 1);
    ctx.fillStyle = e.isBoss ? "#f00" : "#111";
    ctx.beginPath();
    ctx.arc(e.x - eyeOff + lookX, e.y - e.size * 0.13 + lookY, eyeSize * 0.55, 0, Math.PI * 2);
    ctx.arc(e.x + eyeOff + lookX, e.y - e.size * 0.13 + lookY, eyeSize * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Behavior indicator
    if (e.behavior === "healer") {
      ctx.fillStyle = "#5cb85c";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.fillText("+", e.x, e.y + 3);
    }
    if (e.behavior === "ranged") {
      ctx.fillStyle = e.projectileColor ?? "#f00";
      ctx.beginPath();
      ctx.arc(e.x, e.y + e.size * 0.3, 2, 0, Math.PI * 2);
      ctx.fill();
    }
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

function drawCombatPlayer(ctx: CanvasRenderingContext2D, gs: GameState) {
  const p = gs.player;
  const blink = p.invincibleTimer > 0 && Math.floor(p.invincibleTimer * 10) % 2 === 0;
  if (blink) return;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 14, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sword trail
  if (gs.trail.length > 1) {
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = p.stats.swordWidth * 0.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(gs.trail[0].x, gs.trail[0].y);
    for (let i = 1; i < gs.trail.length; i++) ctx.lineTo(gs.trail[i].x, gs.trail[i].y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Sword
  const sAngle = p.swinging ? p.facing - SWING_ARC / 2 + p.swingAngle : p.facing;
  const tipX = p.x + Math.cos(sAngle) * p.stats.swordLength;
  const tipY = p.y + Math.sin(sAngle) * p.stats.swordLength;

  if (p.stats.swordLength > 80) {
    ctx.strokeStyle = `rgba(255,255,100,${0.15 + Math.sin(Date.now() * 0.003) * 0.1})`;
    ctx.lineWidth = p.stats.swordWidth + 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
  }

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
  const hx = p.x + Math.cos(sAngle) * 8;
  const hy = p.y + Math.sin(sAngle) * 8;
  const perpAngle = sAngle + Math.PI / 2;
  ctx.beginPath();
  ctx.moveTo(hx + Math.cos(perpAngle) * 7, hy + Math.sin(perpAngle) * 7);
  ctx.lineTo(hx - Math.cos(perpAngle) * 7, hy - Math.sin(perpAngle) * 7);
  ctx.stroke();
  ctx.fillStyle = "#FF6B6B";
  ctx.beginPath();
  ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Body (top-down circle)
  ctx.fillStyle = "#4488cc";
  ctx.beginPath();
  ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#336699";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
  ctx.stroke();

  // Face direction indicator
  ctx.fillStyle = "#f5d0a0";
  const faceX = p.x + Math.cos(p.facing) * 6;
  const faceY = p.y + Math.sin(p.facing) * 6;
  ctx.beginPath();
  ctx.arc(faceX, faceY, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawDamageNumbers(ctx: CanvasRenderingContext2D, dmgNumbers: Array<{ x: number; y: number; amount: number; life: number; color: string }>) {
  ctx.textAlign = "center";
  for (const d of dmgNumbers) {
    ctx.globalAlpha = clamp(d.life / 0.3, 0, 1);
    let text: string;
    let font: string;
    if (d.amount === -1) { text = "LEVEL UP!"; font = "bold 16px monospace"; }
    else if (d.amount === -999) { text = "BOSS!"; font = "bold 20px monospace"; }
    else if (d.amount < -100) { text = `Wave ${-d.amount - 100}`; font = "bold 14px monospace"; }
    else if (d.amount < -1) { text = `${-d.amount}x COMBO!`; font = "bold 14px monospace"; }
    else { text = `${d.amount}`; font = d.color === "#FFD700" ? "bold 18px monospace" : "bold 14px monospace"; }
    ctx.font = font;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.strokeText(text, d.x, d.y);
    ctx.fillStyle = d.color;
    ctx.fillText(text, d.x, d.y);
  }
  ctx.globalAlpha = 1;
}

function drawCombatHUD(ctx: CanvasRenderingContext2D, gs: GameState) {
  const combat = gs.combat!;
  const combo = gs.combo;

  // Wave counter
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`${combat.zone.name}  |  Wave ${combat.currentWave}/${combat.zone.waveCount}`, 10, CANVAS_H - 8);

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
    ctx.strokeText(`${combo.count}x COMBO`, CANVAS_W / 2, 90);
    ctx.fillText(`${combo.count}x COMBO`, CANVAS_W / 2, 90);
    ctx.font = "10px monospace";
    ctx.fillStyle = "#fff";
    ctx.strokeText(`${combo.multiplier.toFixed(1)}x dmg`, CANVAS_W / 2, 104);
    ctx.fillText(`${combo.multiplier.toFixed(1)}x dmg`, CANVAS_W / 2, 104);
    ctx.globalAlpha = 1;
  }

  // Boss warning
  if (gs.bossAlive) {
    const pulse = 0.5 + Math.sin(Date.now() * 0.006) * 0.5;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = "#ff4500";
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    ctx.fillText("BOSS!", CANVAS_W / 2, 30);
    ctx.globalAlpha = 1;
  }

  // Controls hint
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.font = "9px monospace";
  ctx.textAlign = "right";
  ctx.fillText("Walk to edge to retreat", CANVAS_W - 10, CANVAS_H - 8);
}

// ── Shared HUD ─────────────────────────────────────────────────────────────

export function drawHUD(ctx: CanvasRenderingContext2D, gs: GameState) {
  const p = gs.player;

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

  // Objective (overworld only)
  if (gs.screen === "overworld") {
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.fillText(gs.objective, 10, 76);
  }

  // Controls hint
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    gs.screen === "combat"
      ? "WASD = Move  |  Space/J = Swing  |  M = Mute"
      : "WASD = Move  |  Space = Enter Zone  |  E = Shop  |  M = Mute",
    CANVAS_W / 2, CANVAS_H - 22,
  );
}

// ── Transition screen ──────────────────────────────────────────────────────

export function drawTransition(ctx: CanvasRenderingContext2D, gs: GameState) {
  const t = gs.transition;
  const progress = 1 - (t.timer / 1.2);

  // Full black overlay
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Zone name text
  const alpha = progress < 0.3 ? progress / 0.3 : progress > 0.7 ? (1 - progress) / 0.3 : 1;
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 24px monospace";
  ctx.textAlign = "center";
  ctx.fillText(t.text, CANVAS_W / 2, CANVAS_H / 2);
  ctx.globalAlpha = 1;
}
