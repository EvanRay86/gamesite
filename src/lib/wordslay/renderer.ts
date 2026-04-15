// Canvas renderer for Wordslay — combat arena, map, animations, SFX

import type {
  GameState,
  EnemyState,
  DungeonFloor,
  MapNode,
  DamageNumber,
  Particle,
  ActId,
} from "@/types/wordslay";
import { getNodePosition, NODE_INFO, ACT_CONFIG } from "./dungeon-gen";
import { TIER_COLORS, type WordTier } from "./word-scoring";

// ── Constants ───────────────────────────────────────────────────────────────

export const CANVAS_W = 800;
export const CANVAS_H = 500;

const ENEMY_SIZE = 48;
const HP_BAR_W = 60;
const HP_BAR_H = 6;

// ── Renderer Class ──────────────────────────────────────────────────────────

export class LexiconQuestRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  particles: Particle[] = [];
  damageNumbers: DamageNumber[] = [];
  private shakeX = 0;
  private shakeY = 0;
  private shakeDuration = 0;
  private shakeIntensity = 0;
  private animFrame = 0;
  private running = false;
  private animId = 0;
  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────

  startLoop(renderFn: (dt: number) => void) {
    this.running = true;
    this.lastTime = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;
      this.animFrame++;
      renderFn(dt);
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  stopLoop() {
    this.running = false;
    cancelAnimationFrame(this.animId);
  }

  clear() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  }

  // ── Screen Shake ──────────────────────────────────────────────────────

  shakeScreen(intensity: number, duration: number) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  private updateShake(dt: number) {
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  private applyShake() {
    this.ctx.translate(this.shakeX, this.shakeY);
  }

  // ── Combat Scene ──────────────────────────────────────────────────────

  renderCombatScene(state: GameState, dt: number) {
    this.updateShake(dt);
    this.clear();
    this.ctx.save();
    this.applyShake();

    // Background
    this.drawCombatBackground(state.act);

    // Enemies
    if (state.combat) {
      const alive = state.combat.enemies.filter((e) => e.hp > 0);
      const spacing = CANVAS_W / (alive.length + 1);
      alive.forEach((enemy, i) => {
        const x = spacing * (i + 1);
        const y = CANVAS_H * 0.35;
        this.drawEnemy(enemy, x, y);
      });
    }

    // Damage numbers
    this.updateAndDrawDamageNumbers(dt);

    // Particles
    this.updateAndDrawParticles(dt);

    this.ctx.restore();
  }

  private drawCombatBackground(act: ActId) {
    const config = ACT_CONFIG[act];
    const ctx = this.ctx;

    // Dark gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, config.bgColor);
    grad.addColorStop(1, "#000000");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Subtle atmospheric particles
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 20; i++) {
      const x = ((this.animFrame * 0.3 + i * 137) % CANVAS_W);
      const y = ((this.animFrame * 0.1 + i * 89) % CANVAS_H);
      const size = 1 + (i % 3);
      ctx.fillStyle = act === "crypt" ? "#6b7280" : act === "caverns" ? "#3b82f6" : "#a855f7";
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Floor line
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_H * 0.7);
    ctx.lineTo(CANVAS_W, CANVAS_H * 0.7);
    ctx.stroke();
  }

  // ── Enemy Drawing ─────────────────────────────────────────────────────

  private drawEnemy(enemy: EnemyState, x: number, y: number) {
    const ctx = this.ctx;
    const pulse = Math.sin(this.animFrame * 0.05) * 3;

    // Glow aura
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.shadowBlur = 20 + pulse;
    ctx.shadowColor = this.getEnemyGlowColor(enemy);
    ctx.beginPath();
    ctx.arc(x, y, ENEMY_SIZE * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.01)";
    ctx.fill();
    ctx.restore();

    // Enemy emoji
    ctx.font = `${ENEMY_SIZE}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(enemy.def.emoji, x, y);

    // Name
    ctx.font = "bold 12px 'Outfit', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(enemy.def.name, x, y - ENEMY_SIZE * 0.8);

    // HP bar
    this.drawHPBar(
      x - HP_BAR_W / 2,
      y + ENEMY_SIZE * 0.6,
      HP_BAR_W,
      HP_BAR_H,
      enemy.hp,
      enemy.maxHp,
      "#ef4444",
    );

    // Shield indicator
    if (enemy.shield > 0) {
      ctx.font = "bold 11px 'Outfit', sans-serif";
      ctx.fillStyle = "#60a5fa";
      ctx.fillText(`🛡️ ${enemy.shield}`, x, y + ENEMY_SIZE * 0.6 + 18);
    }

    // Intent indicator
    this.drawIntent(enemy, x, y - ENEMY_SIZE - 10);

    // Phase indicator for multi-phase bosses
    if (enemy.phase === 2) {
      ctx.font = "10px 'Outfit', sans-serif";
      ctx.fillStyle = "#f87171";
      ctx.fillText("⚡ ENRAGED", x, y + ENEMY_SIZE * 0.6 + 30);
    }

    // Banned letter
    if (enemy.bannedLetter) {
      ctx.font = "bold 11px 'Outfit', sans-serif";
      ctx.fillStyle = "#f87171";
      ctx.fillText(
        `🚫 ${enemy.bannedLetter}`,
        x + HP_BAR_W * 0.6,
        y - ENEMY_SIZE * 0.3,
      );
    }

    // Ability descriptions
    let abilityY = y + ENEMY_SIZE * 0.6 + (enemy.phase === 2 ? 44 : 30);
    ctx.font = "italic 10px 'Outfit', sans-serif";
    ctx.fillStyle = "#fbbf24";
    for (const ability of enemy.def.abilities) {
      ctx.fillText(ability.desc, x, abilityY);
      abilityY += 14;
    }
  }

  private getEnemyGlowColor(enemy: EnemyState): string {
    switch (enemy.def.id) {
      case "lich-lord": return "#a855f7";
      case "crystal-dragon": return "#3b82f6";
      case "word-eater": return "#ef4444";
      default: return "#f59e0b";
    }
  }

  private drawIntent(enemy: EnemyState, x: number, y: number) {
    const ctx = this.ctx;
    const intent = enemy.intent;

    ctx.font = "bold 11px 'Outfit', sans-serif";
    ctx.textAlign = "center";

    if (intent.type === "attack") {
      ctx.fillStyle = "#f87171";
      ctx.fillText(`⚔️ ${intent.value}`, x, y);
    } else if (intent.type === "defend") {
      ctx.fillStyle = "#60a5fa";
      ctx.fillText(`🛡️ +${intent.value}`, x, y);
    } else {
      ctx.fillStyle = "#fbbf24";
      ctx.fillText(`✨ ${intent.label}`, x, y);
    }
  }

  // ── HP Bar ────────────────────────────────────────────────────────────

  private drawHPBar(
    x: number,
    y: number,
    w: number,
    h: number,
    current: number,
    max: number,
    color: string,
  ) {
    const ctx = this.ctx;
    const pct = Math.max(0, current / max);

    // Background
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x, y, w, h);

    // Fill
    ctx.fillStyle = pct > 0.5 ? color : pct > 0.25 ? "#f59e0b" : "#ef4444";
    ctx.fillRect(x, y, w * pct, h);

    // Border
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    // HP text
    ctx.font = "bold 9px 'Outfit', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.max(0, current)}`, x + w / 2, y + h + 10);
  }

  // ── Map Rendering ─────────────────────────────────────────────────────

  renderMap(floor: DungeonFloor, currentNodeId: string | null) {
    this.clear();
    const ctx = this.ctx;

    // Background
    const config = ACT_CONFIG[floor.act];
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, config.bgColor);
    grad.addColorStop(0.5, "#0a0a1a");
    grad.addColorStop(1, config.bgColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Act title
    ctx.font = "bold 14px 'Space Grotesk', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.textAlign = "center";
    ctx.fillText(
      `${config.emoji} ${config.name} — Floor ${floor.floor}`,
      CANVAS_W / 2,
      25,
    );

    // Draw connections first (lines)
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    for (const node of floor.nodes) {
      const from = getNodePosition(node, CANVAS_W, CANVAS_H - 40, floor.nodes);
      from.y += 40; // offset for title
      for (const connId of node.connections) {
        const target = floor.nodes.find((n) => n.id === connId);
        if (!target) continue;
        const to = getNodePosition(target, CANVAS_W, CANVAS_H - 40, floor.nodes);
        to.y += 40;

        // Highlight available paths
        const isAvailablePath = this.isNodeAvailable(
          node,
          target,
          floor,
          currentNodeId,
        );
        if (isAvailablePath) {
          ctx.strokeStyle = "rgba(255,255,255,0.4)";
          ctx.lineWidth = 3;
        } else if (node.visited) {
          ctx.strokeStyle = "rgba(255,255,255,0.25)";
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = "rgba(255,255,255,0.1)";
          ctx.lineWidth = 1;
        }

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
    }

    // Draw nodes
    for (const node of floor.nodes) {
      const pos = getNodePosition(node, CANVAS_W, CANVAS_H - 40, floor.nodes);
      pos.y += 40;
      this.drawMapNode(node, pos.x, pos.y, currentNodeId, floor);
    }
  }

  private isNodeAvailable(
    from: MapNode,
    to: MapNode,
    floor: DungeonFloor,
    currentNodeId: string | null,
  ): boolean {
    if (!currentNodeId) return from.col === 0;
    return from.id === currentNodeId && from.connections.includes(to.id);
  }

  private drawMapNode(
    node: MapNode,
    x: number,
    y: number,
    currentNodeId: string | null,
    floor: DungeonFloor,
  ) {
    const ctx = this.ctx;
    const info = NODE_INFO[node.type];
    const isAvailable =
      currentNodeId === null
        ? node.col === 0
        : floor.nodes
            .find((n) => n.id === currentNodeId)
            ?.connections.includes(node.id) ?? false;
    const isCurrent = node.id === currentNodeId;
    const radius = isCurrent ? 22 : isAvailable ? 20 : 16;

    // Node circle
    ctx.save();
    if (isAvailable || isCurrent) {
      ctx.shadowBlur = 12;
      ctx.shadowColor = info.color;
    }

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);

    if (node.visited) {
      ctx.fillStyle = "rgba(255,255,255,0.1)";
    } else if (isAvailable) {
      ctx.fillStyle = info.color + "40";
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.05)";
    }
    ctx.fill();

    ctx.strokeStyle = node.visited
      ? "rgba(255,255,255,0.2)"
      : isAvailable
        ? info.color
        : "rgba(255,255,255,0.15)";
    ctx.lineWidth = isAvailable ? 2.5 : 1.5;
    ctx.stroke();
    ctx.restore();

    // Node emoji
    ctx.font = `${isCurrent ? 20 : 16}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(info.emoji, x, y);

    // Current node indicator
    if (isCurrent) {
      ctx.font = "8px serif";
      ctx.fillText("📍", x, y - radius - 8);
    }
  }

  // ── Get clicked node ──────────────────────────────────────────────────

  getClickedNode(
    clientX: number,
    clientY: number,
    floor: DungeonFloor,
  ): MapNode | null {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    for (const node of floor.nodes) {
      const pos = getNodePosition(node, CANVAS_W, CANVAS_H - 40, floor.nodes);
      pos.y += 40;
      const dist = Math.hypot(x - pos.x, y - pos.y);
      if (dist < 24) return node;
    }
    return null;
  }

  // ── Damage Numbers ────────────────────────────────────────────────────

  spawnDamageNumber(
    x: number,
    y: number,
    amount: number,
    tier: WordTier = "normal",
    isHeal: boolean = false,
  ) {
    this.damageNumbers.push({
      x: x + (Math.random() - 0.5) * 20,
      y,
      amount,
      color: isHeal ? "#22c55e" : TIER_COLORS[tier],
      life: 1.5,
      maxLife: 1.5,
      isCrit: tier === "critical" || tier === "legendary" || tier === "mythic",
    });
  }

  spawnDodgeText(x: number, y: number) {
    this.damageNumbers.push({
      x: x + (Math.random() - 0.5) * 20,
      y,
      amount: 0,
      color: "#fbbf24",
      life: 1.5,
      maxLife: 1.5,
      isCrit: true,
      label: "DODGED!",
    });
  }

  private updateAndDrawDamageNumbers(dt: number) {
    const ctx = this.ctx;
    this.damageNumbers = this.damageNumbers.filter((d) => {
      d.life -= dt;
      d.y -= 40 * dt;
      if (d.life <= 0) return false;

      const alpha = d.life / d.maxLife;
      const scale = d.isCrit ? 1.4 : 1;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${Math.round(16 * scale)}px 'Space Grotesk', sans-serif`;
      ctx.fillStyle = d.color;
      ctx.textAlign = "center";
      ctx.shadowBlur = d.isCrit ? 8 : 0;
      ctx.shadowColor = d.color;

      const text = (d as any).label ?? `${d.color === "#22c55e" ? "+" : "-"}${d.amount}`;
      ctx.fillText(text, d.x, d.y);
      ctx.restore();
      return true;
    });
  }

  // ── Particles ─────────────────────────────────────────────────────────

  spawnParticles(
    x: number,
    y: number,
    count: number,
    color: string,
    speed: number = 80,
  ) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.5 + Math.random() * 0.5);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  spawnWordParticles(x: number, y: number, tier: WordTier) {
    const color = TIER_COLORS[tier];
    const count = tier === "mythic" ? 30 : tier === "legendary" ? 20 : tier === "critical" ? 15 : 8;
    this.spawnParticles(x, y, count, color, tier === "normal" ? 60 : 100);
  }

  private updateAndDrawParticles(dt: number) {
    const ctx = this.ctx;
    this.particles = this.particles.filter((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 100 * dt; // gravity
      if (p.life <= 0) return false;

      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return true;
    });
  }

  // ── Get enemy position for animations ─────────────────────────────────

  getEnemyPositions(enemies: EnemyState[]): { x: number; y: number }[] {
    const alive = enemies.filter((e) => e.hp > 0);
    const spacing = CANVAS_W / (alive.length + 1);
    return alive.map((_, i) => ({
      x: spacing * (i + 1),
      y: CANVAS_H * 0.35,
    }));
  }
}

// ── SFX (Web Audio API synth) ───────────────────────────────────────────────

let audioCtx: AudioContext | null = null;
function getAudio(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function playWordSubmit(wordLen: number) {
  try {
    const ctx = getAudio();
    const baseFreq = 300 + wordLen * 40;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      baseFreq * 1.5,
      ctx.currentTime + 0.12,
    );
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch { /* audio unavailable */ }
}

export function playCritical() {
  try {
    const ctx = getAudio();
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const freq = [523, 659, 784][i]; // C5, E5, G5 chord
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + 0.3 + i * 0.05,
      );
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch { /* */ }
}

export function playEnemyHit() {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch { /* */ }
}

export function playDamageTaken() {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch { /* */ }
}

export function playHeal() {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch { /* */ }
}

export function playEnemyDeath() {
  try {
    const ctx = getAudio();
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300 + i * 100, ctx.currentTime + i * 0.04);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + 0.2 + i * 0.04,
      );
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.04);
      osc.stop(ctx.currentTime + 0.25 + i * 0.04);
    }
  } catch { /* */ }
}
