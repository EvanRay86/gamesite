// Canvas renderer for Netherveil — combat grid, map, animations, particles

import type {
  GameState,
  CombatState,
  DungeonFloor,
  MapNode,
  EnemyState,
  GridPosition,
  DamageNumber,
  Particle,
  ActId,
  ActiveStatus,
} from "@/types/netherveil";
import { ACT_CONFIG, CLASS_COLORS, STATUS_COLORS, RARITY_COLORS } from "@/types/netherveil";
import { getEnemyDef } from "./enemies";
import { GRID_ROWS, GRID_COLS, getAllEnemies } from "./combat";
import { getNodePosition, NODE_INFO } from "./map-gen";

// ── Constants ───────────────────────────────────────────────────────────────

export const CANVAS_W = 900;
export const CANVAS_H = 500;

const CELL_SIZE = 56;
const CELL_GAP = 4;
const GRID_ORIGIN_X = 210;
const GRID_ORIGIN_Y = 60;
const HP_BAR_W = 48;
const HP_BAR_H = 5;
const ENEMY_FONT_SIZE = 28;

// ── Renderer Class ──────────────────────────────────────────────────────────

export class NetherveilRenderer {
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

    const combat = state.combat!;
    const act = state.act;

    // Background
    this.drawCombatBackground(act);

    // Grid
    this.drawGrid(combat, state);

    // Particles
    this.updateAndDrawParticles(dt);

    // Damage numbers
    this.updateAndDrawDamageNumbers(dt);

    // Enemy intents
    this.drawIntents(combat);

    this.ctx.restore();
  }

  private drawCombatBackground(act: ActId) {
    const config = ACT_CONFIG[act];
    const ctx = this.ctx;

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, config.bgColor);
    grad.addColorStop(1, config.fogColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Floating void particles (ambient)
    const time = this.animFrame * 0.02;
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 8; i++) {
      const x = ((Math.sin(time + i * 2.5) + 1) / 2) * CANVAS_W;
      const y = ((Math.cos(time * 0.7 + i * 1.8) + 1) / 2) * CANVAS_H;
      const r = 15 + Math.sin(time + i) * 8;
      const orbGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
      orbGrad.addColorStop(0, act === "wastes" ? "#A855F7" : act === "depths" ? "#3B82F6" : "#EF4444");
      orbGrad.addColorStop(1, "transparent");
      ctx.fillStyle = orbGrad;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
  }

  private drawGrid(combat: CombatState, state: GameState) {
    const ctx = this.ctx;

    // Draw grid cells
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const x = GRID_ORIGIN_X + col * (CELL_SIZE + CELL_GAP);
        const y = GRID_ORIGIN_Y + row * (CELL_SIZE + CELL_GAP);

        // Cell background
        const isValidTarget = combat.validTargets.some(
          (t) => t.row === row && t.col === col,
        );

        ctx.fillStyle = isValidTarget
          ? "rgba(255, 255, 100, 0.15)"
          : "rgba(255, 255, 255, 0.04)";
        ctx.strokeStyle = isValidTarget
          ? "rgba(255, 255, 100, 0.5)"
          : "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;

        this.roundRect(x, y, CELL_SIZE, CELL_SIZE, 6);
        ctx.fill();
        ctx.stroke();

        // Draw enemy if present
        const cell = combat.enemyGrid[row][col];
        if (cell.unit?.type === "enemy" && cell.unit.enemyState) {
          this.drawEnemy(cell.unit.enemyState, x, y);
        }
      }
    }

    // Draw player status icons below the grid
    this.drawPlayerStatuses(combat.playerStatuses, state);
  }

  private drawEnemy(enemy: EnemyState, x: number, y: number) {
    const ctx = this.ctx;
    const def = getEnemyDef(enemy.defId);

    // Enemy emoji
    ctx.font = `${ENEMY_FONT_SIZE}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Glow effect for elites/bosses
    if (def.isElite || def.isBoss) {
      ctx.shadowColor = def.isBoss ? "#EF4444" : "#F59E0B";
      ctx.shadowBlur = 12;
    }

    // Shake animation when hit (recent damage)
    const cx = x + CELL_SIZE / 2;
    const cy = y + CELL_SIZE / 2 - 4;
    ctx.fillText(def.emoji, cx, cy);
    ctx.shadowBlur = 0;

    // HP bar
    const hpBarX = x + (CELL_SIZE - HP_BAR_W) / 2;
    const hpBarY = y + CELL_SIZE - 12;
    const hpPercent = Math.max(0, enemy.hp / enemy.maxHp);

    // Background
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    this.roundRect(hpBarX, hpBarY, HP_BAR_W, HP_BAR_H, 2);
    ctx.fill();

    // HP fill
    const hpColor =
      hpPercent > 0.5 ? "#22C55E" : hpPercent > 0.25 ? "#F59E0B" : "#EF4444";
    ctx.fillStyle = hpColor;
    this.roundRect(hpBarX, hpBarY, HP_BAR_W * hpPercent, HP_BAR_H, 2);
    ctx.fill();

    // Shield indicator
    if (enemy.shield > 0) {
      ctx.fillStyle = "#60A5FA";
      ctx.font = "bold 10px 'Outfit', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`🛡${enemy.shield}`, x + CELL_SIZE - 2, y + 12);
    }

    // Status effect icons
    const statuses = enemy.statusEffects;
    if (statuses.length > 0) {
      ctx.font = "9px 'Outfit', sans-serif";
      ctx.textAlign = "left";
      let sx = x + 2;
      for (const s of statuses.slice(0, 3)) {
        const color = STATUS_COLORS[s.type] || "#FFF";
        ctx.fillStyle = color;
        ctx.fillText(`${s.stacks}`, sx, y + 12);
        sx += 14;
      }
    }
  }

  private drawIntents(combat: CombatState) {
    const ctx = this.ctx;
    const enemies = getAllEnemies(combat.enemyGrid);

    for (const { enemy, pos } of enemies) {
      const x = GRID_ORIGIN_X + pos.col * (CELL_SIZE + CELL_GAP);
      const y = GRID_ORIGIN_Y + pos.row * (CELL_SIZE + CELL_GAP) - 18;

      // Intent icon + value
      let icon = "";
      let color = "#FFF";
      switch (enemy.intent.type) {
        case "attack":
          icon = "⚔️";
          color = "#EF4444";
          break;
        case "defend":
          icon = "🛡️";
          color = "#60A5FA";
          break;
        case "buff":
          icon = "⬆️";
          color = "#FBBF24";
          break;
        case "debuff":
          icon = "⬇️";
          color = "#F87171";
          break;
        case "summon":
          icon = "✨";
          color = "#A855F7";
          break;
        case "special":
          icon = "💀";
          color = "#EF4444";
          break;
      }

      ctx.font = "12px serif";
      ctx.textAlign = "center";
      ctx.fillText(icon, x + CELL_SIZE / 2, y);

      if (enemy.intent.value > 0) {
        ctx.font = "bold 10px 'Outfit', sans-serif";
        ctx.fillStyle = color;
        ctx.fillText(
          `${enemy.intent.value}`,
          x + CELL_SIZE / 2,
          y + 12,
        );
      }
    }
  }

  private drawPlayerStatuses(statuses: ActiveStatus[], state: GameState) {
    const ctx = this.ctx;
    const startX = GRID_ORIGIN_X;
    const y = GRID_ORIGIN_Y + GRID_ROWS * (CELL_SIZE + CELL_GAP) + 12;

    ctx.font = "11px 'Outfit', sans-serif";
    ctx.textAlign = "left";

    let x = startX;
    for (const s of statuses) {
      const color = STATUS_COLORS[s.type] || "#FFF";
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      this.roundRect(x, y, 60, 20, 4);
      ctx.fill();

      ctx.fillStyle = color;
      const label = s.type.replace(/_/g, " ");
      ctx.fillText(`${label} ${s.stacks}`, x + 4, y + 14);
      x += 66;
    }
  }

  // ── Map Scene ─────────────────────────────────────────────────────────

  renderMapScene(
    floor: DungeonFloor,
    currentNodeId: string | null,
    availableNodeIds: string[],
    dt: number,
  ) {
    this.clear();
    const ctx = this.ctx;
    const config = ACT_CONFIG[floor.act];

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, config.bgColor);
    grad.addColorStop(0.5, config.fogColor);
    grad.addColorStop(1, config.bgColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Title
    ctx.font = "bold 16px 'DM Serif Display', serif";
    ctx.fillStyle = "#E2E8F0";
    ctx.textAlign = "center";
    ctx.fillText(
      `${config.emoji} ${config.name} — Floor ${floor.floor}`,
      CANVAS_W / 2,
      30,
    );

    // Draw connections first (lines behind nodes)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    for (const node of floor.nodes) {
      const from = getNodePosition(node, floor, CANVAS_W, CANVAS_H);
      for (const connId of node.connections) {
        const connNode = floor.nodes.find((n) => n.id === connId);
        if (!connNode) continue;
        const to = getNodePosition(connNode, floor, CANVAS_W, CANVAS_H);

        // Visited paths are brighter
        if (node.visited) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        } else {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        }

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        // Bezier curve for smoother paths
        const midX = (from.x + to.x) / 2;
        ctx.quadraticCurveTo(midX, from.y, to.x, to.y);
        ctx.stroke();
      }
    }

    // Draw nodes
    for (const node of floor.nodes) {
      const pos = getNodePosition(node, floor, CANVAS_W, CANVAS_H);
      const info = NODE_INFO[node.type];
      const isAvailable = availableNodeIds.includes(node.id);
      const isCurrent = node.id === currentNodeId;

      // Node circle
      const radius = 22;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);

      if (isCurrent) {
        ctx.fillStyle = info.color;
        ctx.shadowColor = info.color;
        ctx.shadowBlur = 15;
      } else if (node.visited) {
        ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
      } else if (isAvailable) {
        ctx.fillStyle = info.color + "44";
        // Pulsing glow for available nodes
        const pulse = Math.sin(this.animFrame * 0.08) * 0.3 + 0.7;
        ctx.shadowColor = info.color;
        ctx.shadowBlur = 8 * pulse;
      } else {
        ctx.fillStyle = "rgba(40, 40, 60, 0.6)";
      }

      ctx.fill();
      ctx.shadowBlur = 0;

      // Border
      ctx.strokeStyle = isAvailable ? info.color : "rgba(255,255,255,0.15)";
      ctx.lineWidth = isAvailable ? 2 : 1;
      ctx.stroke();

      // Node emoji
      ctx.font = "18px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = node.visited && !isCurrent ? "rgba(255,255,255,0.3)" : "#FFF";
      ctx.fillText(info.emoji, pos.x, pos.y);

      // Label below node
      ctx.font = "10px 'Outfit', sans-serif";
      ctx.fillStyle = isAvailable ? "#E2E8F0" : "rgba(255,255,255,0.3)";
      ctx.fillText(info.label, pos.x, pos.y + radius + 12);
    }
  }

  // ── Particles ─────────────────────────────────────────────────────────

  spawnParticles(
    x: number,
    y: number,
    count: number,
    color: string,
    speed = 80,
  ) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.3 + Math.random() * 0.7);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 0.5 + Math.random() * 0.5,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  spawnDamageNumber(x: number, y: number, amount: number, isCrit = false) {
    this.damageNumbers.push({
      x: x + (Math.random() - 0.5) * 20,
      y,
      amount,
      color: isCrit ? "#F59E0B" : "#EF4444",
      life: 1.2,
      maxLife: 1.2,
      isCrit,
    });
  }

  spawnHealNumber(x: number, y: number, amount: number) {
    this.damageNumbers.push({
      x: x + (Math.random() - 0.5) * 20,
      y,
      amount,
      color: "#22C55E",
      life: 1.0,
      maxLife: 1.0,
      isCrit: false,
    });
  }

  private updateAndDrawParticles(dt: number) {
    const ctx = this.ctx;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 50 * dt; // gravity
      p.life -= dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private updateAndDrawDamageNumbers(dt: number) {
    const ctx = this.ctx;
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const d = this.damageNumbers[i];
      d.y -= 40 * dt; // float up
      d.life -= dt;

      if (d.life <= 0) {
        this.damageNumbers.splice(i, 1);
        continue;
      }

      const alpha = Math.min(1, d.life / (d.maxLife * 0.5));
      ctx.globalAlpha = alpha;
      ctx.font = d.isCrit
        ? "bold 20px 'Outfit', sans-serif"
        : "bold 14px 'Outfit', sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = d.color;

      // Shadow for readability
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(`${d.amount}`, d.x, d.y);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  // ── Utilities ─────────────────────────────────────────────────────────

  private roundRect(
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }

  /** Convert a grid position to canvas pixel coordinates (center of cell). */
  gridToPixel(row: number, col: number): { x: number; y: number } {
    return {
      x: GRID_ORIGIN_X + col * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
      y: GRID_ORIGIN_Y + row * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
    };
  }

  /** Convert canvas pixel coordinates to grid position. Returns null if outside grid. */
  pixelToGrid(px: number, py: number): GridPosition | null {
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const x = GRID_ORIGIN_X + col * (CELL_SIZE + CELL_GAP);
        const y = GRID_ORIGIN_Y + row * (CELL_SIZE + CELL_GAP);
        if (px >= x && px <= x + CELL_SIZE && py >= y && py <= y + CELL_SIZE) {
          return { row, col };
        }
      }
    }
    return null;
  }

  /** Get the canvas pixel position for a map node (for click detection). */
  getMapNodeAt(
    px: number,
    py: number,
    floor: DungeonFloor,
  ): MapNode | null {
    for (const node of floor.nodes) {
      const pos = getNodePosition(node, floor, CANVAS_W, CANVAS_H);
      const dx = px - pos.x;
      const dy = py - pos.y;
      if (dx * dx + dy * dy < 25 * 25) {
        return node;
      }
    }
    return null;
  }
}
