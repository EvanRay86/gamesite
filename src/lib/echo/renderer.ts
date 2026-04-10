// Canvas renderer for ECHO
// Draws dungeon tiles, player, echoes, enemies, particles, and HUD
// Enhanced with smooth visuals while keeping 60fps via offscreen caching

import type {
  GameState,
  Particle,
  Tile,
  Echo,
  Enemy,
  ScreenShake,
} from "@/types/echo";
import { TILE_SIZE, CANVAS_W, CANVAS_H, GRID_W, GRID_H } from "@/types/echo";

// ── Colors ──────────────────────────────────────────────────────────────────

const COL = {
  bg: "#08080f",
  floor: "#16162a",
  floorAlt: "#191932",
  floorLine: "#1e1e38",
  wall: "#2c2c48",
  wallTop: "#3a3a5c",
  wallEdge: "#1a1a30",
  player: "#ffffff",
  playerGlow: "rgba(255, 238, 136, 0.3)",
  playerCore: "#fffbe6",
  exit: "#44ff88",
  exitGlow: "#22cc66",
  spawn: "#1e2838",
  plate: "#4488ff",
  plateGlow: "#2266dd",
  plateActive: "#66aaff",
  lever: "#ff8844",
  leverOn: "#44ff88",
  door: "#cc8800",
  doorDark: "#8a5500",
  doorOpen: "#443300",
  lockedDoor: "#ff4444",
  lockedDoorDark: "#aa2222",
  key: "#ffdd00",
  keyShine: "#fff8cc",
  spike: "#ff2222",
  spikeBase: "#881111",
  timedGate: "#aa44ff",
  timedGateDark: "#7722cc",
  enemy: "#ff3344",
  enemyCore: "#ff6677",
  guard: "#ff6644",
  chase: "#ff2266",
  hud: "#ffffff",
  hudDim: "#888899",
};

// ── Renderer Class ──────────────────────────────────────────────────────────

export class EchoRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  particles: Particle[] = [];
  shake: ScreenShake = { x: 0, y: 0, duration: 0, intensity: 0, elapsed: 0 };
  private running = false;
  private animId = 0;
  private lastTime = 0;
  private animFrame = 0;
  private ambientTimer = 0;

  // Offscreen caches for expensive static draws
  private dungeonCache: HTMLCanvasElement | null = null;
  private dungeonCacheCtx: CanvasRenderingContext2D | null = null;
  private dungeonDirty = true;
  private vignetteCache: HTMLCanvasElement | null = null;
  private lastDoorStateKey = "";

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    this.initCaches();
  }

  private initCaches(): void {
    // Dungeon offscreen canvas
    this.dungeonCache = document.createElement("canvas");
    this.dungeonCache.width = CANVAS_W;
    this.dungeonCache.height = CANVAS_H;
    this.dungeonCacheCtx = this.dungeonCache.getContext("2d")!;

    // Vignette overlay (render once, never changes)
    this.vignetteCache = document.createElement("canvas");
    this.vignetteCache.width = CANVAS_W;
    this.vignetteCache.height = CANVAS_H;
    const vCtx = this.vignetteCache.getContext("2d")!;
    const vignette = vCtx.createRadialGradient(
      CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.3,
      CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.7,
    );
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.3)");
    vCtx.fillStyle = vignette;
    vCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  /** Call when dungeon layout changes (new level, door toggled, etc.) */
  invalidateDungeon(): void {
    this.dungeonDirty = true;
  }

  // ── Animation Loop ────────────────────────────────────────────────────

  startLoop(renderFn: (dt: number) => void): void {
    this.running = true;
    this.lastTime = performance.now();

    const loop = () => {
      if (!this.running) return;
      const now = performance.now();
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;
      this.animFrame++;
      renderFn(dt);
      this.scheduleFrame(loop);
    };

    this.scheduleFrame(loop);
  }

  private scheduleFrame(fn: () => void): void {
    if (typeof document !== "undefined" && !document.hidden) {
      this.animId = requestAnimationFrame(() => fn());
    } else {
      this.animId = window.setTimeout(fn, 16) as unknown as number;
    }
  }

  stopLoop(): void {
    this.running = false;
    cancelAnimationFrame(this.animId);
    clearTimeout(this.animId);
  }

  // ── Main Render ───────────────────────────────────────────────────────

  render(state: GameState, dt: number): void {
    const { ctx } = this;

    ctx.save();

    // Update shake
    this.updateShake(dt);
    ctx.translate(this.shake.x, this.shake.y);

    // Clear
    ctx.fillStyle = COL.bg;
    ctx.fillRect(-10, -10, CANVAS_W + 20, CANVAS_H + 20);

    // Check if door states changed → invalidate dungeon cache
    const doorKey = JSON.stringify(state.doorStates);
    if (doorKey !== this.lastDoorStateKey) {
      this.lastDoorStateKey = doorKey;
      this.dungeonDirty = true;
    }

    // Draw dungeon (cached offscreen)
    if (this.dungeonDirty && this.dungeonCacheCtx) {
      this.renderDungeonToCache(state);
      this.dungeonDirty = false;
    }
    if (this.dungeonCache) {
      ctx.drawImage(this.dungeonCache, 0, 0);
    }

    // Animated interactables (exit glow, key bob — drawn every frame)
    this.drawAnimatedInteractables(state);

    // Ambient dust
    this.spawnAmbientParticles(dt);

    // Draw enemies
    this.drawEnemies(state);

    // Draw echoes
    this.drawEchoes(state);

    // Draw player
    if (state.player.alive) {
      this.drawPlayer(state);
    }

    // Update & draw particles
    this.updateParticles(dt);
    this.drawParticles();

    // Vignette (cached)
    if (this.vignetteCache) {
      ctx.drawImage(this.vignetteCache, 0, 0);
    }

    ctx.restore();

    // Draw HUD (not affected by shake)
    this.drawHUD(state);
  }

  // ── Dungeon Cache (static tiles → offscreen canvas) ───────────────────

  private renderDungeonToCache(state: GameState): void {
    const ctx = this.dungeonCacheCtx!;
    const { tiles } = state.dungeon;
    const { doorStates } = state;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const tile = tiles[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        switch (tile.type) {
          case "wall":
            this.drawWallCached(ctx, px, py, x, y, tiles);
            break;
          case "floor":
          case "spawn":
            this.drawFloorCached(ctx, px, py, x, y, tile.type === "spawn");
            break;
          case "exit":
            // Floor underneath; animated glow drawn each frame
            this.drawFloorCached(ctx, px, py, x, y, false);
            break;
          case "pressure_plate":
            this.drawFloorCached(ctx, px, py, x, y, false);
            this.drawPressurePlateCached(ctx, px, py, x, y, tile, doorStates);
            break;
          case "lever":
            this.drawFloorCached(ctx, px, py, x, y, false);
            this.drawLeverCached(ctx, px, py, tile, doorStates);
            break;
          case "door":
          case "locked_door":
          case "timed_gate":
            this.drawFloorCached(ctx, px, py, x, y, false);
            this.drawDoorCached(ctx, px, py, tile, doorStates);
            break;
          case "spike_trap":
            this.drawFloorCached(ctx, px, py, x, y, false);
            this.drawSpikeTrapCached(ctx, px, py);
            break;
          case "key":
            // Floor underneath; animated key drawn each frame
            this.drawFloorCached(ctx, px, py, x, y, false);
            break;
          default:
            this.drawFloorCached(ctx, px, py, x, y, false);
            break;
        }
      }
    }
  }

  private drawWallCached(ctx: CanvasRenderingContext2D, px: number, py: number, gx: number, gy: number, tiles: Tile[][]): void {
    // Top portion lighter, bottom darker
    ctx.fillStyle = COL.wallTop;
    ctx.fillRect(px, py, TILE_SIZE, 6);
    ctx.fillStyle = COL.wall;
    ctx.fillRect(px, py + 6, TILE_SIZE, TILE_SIZE - 10);
    ctx.fillStyle = COL.wallEdge;
    ctx.fillRect(px, py + TILE_SIZE - 4, TILE_SIZE, 4);

    // Shadow below wall onto adjacent floor
    const below = gy + 1 < GRID_H ? tiles[gy + 1]?.[gx] : null;
    if (below && below.type !== "wall") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(px, py + TILE_SIZE, TILE_SIZE, 5);
    }

    // Brick texture (offset every other row)
    ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(px, py + TILE_SIZE / 2);
    ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE / 2);
    ctx.stroke();
    const offset = (gy % 2) * (TILE_SIZE / 2);
    ctx.beginPath();
    ctx.moveTo(px + offset, py);
    ctx.lineTo(px + offset, py + TILE_SIZE / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px + TILE_SIZE / 2 + offset - (offset > 0 ? TILE_SIZE / 2 : 0), py + TILE_SIZE / 2);
    ctx.lineTo(px + TILE_SIZE / 2 + offset - (offset > 0 ? TILE_SIZE / 2 : 0), py + TILE_SIZE);
    ctx.stroke();

    // Top edge shine
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(px, py, TILE_SIZE, 1);
  }

  private drawFloorCached(ctx: CanvasRenderingContext2D, px: number, py: number, gx: number, gy: number, isSpawn: boolean): void {
    // Checkerboard variation
    const isAlt = (gx + gy) % 2 === 0;
    ctx.fillStyle = isSpawn ? COL.spawn : (isAlt ? COL.floor : COL.floorAlt);
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // Recessed edge
    ctx.strokeStyle = COL.floorLine;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);

    // Occasional floor detail (deterministic from position)
    const hash = ((gx * 7 + gy * 13) * 2654435761) >>> 0;
    if (hash % 7 === 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
      ctx.fillRect(px + 8 + (hash % 12), py + 8 + ((hash >> 4) % 12), 3, 3);
    }
    if (hash % 11 === 0) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
      ctx.fillRect(px + 4 + (hash % 16), py + 12 + ((hash >> 3) % 8), 5, 1);
    }
  }

  private drawPressurePlateCached(ctx: CanvasRenderingContext2D, px: number, py: number, _gx: number, _gy: number, tile: Tile, doorStates: Record<string, boolean>): void {
    const cx = px + TILE_SIZE / 2;
    const cy = py + TILE_SIZE / 2;
    const active = tile.linkId ? doorStates[tile.linkId] : false;

    // Plate base
    ctx.fillStyle = active ? COL.plateActive : COL.plateGlow;
    ctx.globalAlpha = active ? 0.6 : 0.35;
    const inset = active ? 6 : 5;
    ctx.fillRect(px + inset, py + inset, TILE_SIZE - inset * 2, TILE_SIZE - inset * 2);

    // Diamond indicator
    ctx.globalAlpha = active ? 0.9 : 0.5;
    ctx.strokeStyle = COL.plate;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, py + 8);
    ctx.lineTo(px + TILE_SIZE - 8, cy);
    ctx.lineTo(cx, py + TILE_SIZE - 8);
    ctx.lineTo(px + 8, cy);
    ctx.closePath();
    ctx.stroke();

    if (active) {
      ctx.fillStyle = COL.plate;
      ctx.globalAlpha = 0.15;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    }

    ctx.globalAlpha = 1;
  }

  private drawLeverCached(ctx: CanvasRenderingContext2D, px: number, py: number, tile: Tile, doorStates: Record<string, boolean>): void {
    const cx = px + TILE_SIZE / 2;
    const cy = py + TILE_SIZE / 2;
    const active = tile.linkId ? doorStates[tile.linkId] : false;
    const col = active ? COL.leverOn : COL.lever;

    // Base pedestal
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fillRect(cx - 6, cy + 2, 12, 6);

    // Base circle
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(cx, cy + 2, 5, 0, Math.PI * 2);
    ctx.fill();

    // Lever arm
    ctx.strokeStyle = col;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx, cy + 2);
    ctx.lineTo(active ? cx + 8 : cx - 8, cy - 10);
    ctx.stroke();
    ctx.lineCap = "butt";

    // Handle ball
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(active ? cx + 8 : cx - 8, cy - 10, 3, 0, Math.PI * 2);
    ctx.fill();

    if (active) {
      ctx.fillStyle = "rgba(68, 255, 136, 0.12)";
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    }
  }

  private drawDoorCached(ctx: CanvasRenderingContext2D, px: number, py: number, tile: Tile, doorStates: Record<string, boolean>): void {
    const cx = px + TILE_SIZE / 2;
    const cy = py + TILE_SIZE / 2;
    const isOpen = tile.linkId ? doorStates[tile.linkId] : tile.open;

    if (isOpen) {
      ctx.strokeStyle = COL.doorOpen;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    } else {
      const col = tile.type === "locked_door" ? COL.lockedDoor
        : tile.type === "timed_gate" ? COL.timedGate
        : COL.door;
      const darkCol = tile.type === "locked_door" ? COL.lockedDoorDark
        : tile.type === "timed_gate" ? COL.timedGateDark
        : COL.doorDark;

      // Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.fillRect(px + 2, py + 2, TILE_SIZE - 3, TILE_SIZE - 3);

      // Door body — lighter top, darker bottom (no gradient)
      ctx.fillStyle = col;
      ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, (TILE_SIZE - 6) / 2);
      ctx.fillStyle = darkCol;
      ctx.fillRect(px + 3, py + 3 + (TILE_SIZE - 6) / 2, TILE_SIZE - 6, (TILE_SIZE - 6) / 2);

      // Cross brace
      ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 6, py + 6);
      ctx.lineTo(px + TILE_SIZE - 6, py + TILE_SIZE - 6);
      ctx.moveTo(px + TILE_SIZE - 6, py + 6);
      ctx.lineTo(px + 6, py + TILE_SIZE - 6);
      ctx.stroke();

      // Border highlight
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.strokeRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6);

      if (tile.type === "locked_door") {
        // Padlock
        ctx.fillStyle = COL.key;
        ctx.fillRect(cx - 4, cy, 8, 6);
        ctx.strokeStyle = COL.key;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy - 1, 4, Math.PI, 0);
        ctx.stroke();
      }
    }
  }

  private drawSpikeTrapCached(ctx: CanvasRenderingContext2D, px: number, py: number): void {
    const cx = px + TILE_SIZE / 2;
    const cy = py + TILE_SIZE / 2;

    // Danger tint
    ctx.fillStyle = "rgba(255, 34, 34, 0.1)";
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // Base plate
    ctx.fillStyle = COL.spikeBase;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    ctx.globalAlpha = 1;

    // Spike triangles
    ctx.fillStyle = COL.spike;
    ctx.globalAlpha = 0.7;
    const s = 5;
    const positions = [
      [px + 7, py + 7], [px + 15, py + 7],
      [px + TILE_SIZE - 7, py + 7], [px + TILE_SIZE - 15, py + 7],
      [px + 7, py + TILE_SIZE - 7], [px + 15, py + TILE_SIZE - 7],
      [px + TILE_SIZE - 7, py + TILE_SIZE - 7], [px + TILE_SIZE - 15, py + TILE_SIZE - 7],
      [cx, cy],
    ];
    for (const [sx, sy] of positions) {
      ctx.beginPath();
      ctx.moveTo(sx, sy - s);
      ctx.lineTo(sx + s * 0.5, sy + s * 0.4);
      ctx.lineTo(sx - s * 0.5, sy + s * 0.4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ── Animated Interactables (drawn every frame) ────────────────────────

  private drawAnimatedInteractables(state: GameState): void {
    const { ctx } = this;
    const { tiles } = state.dungeon;

    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const tile = tiles[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        const cx = px + TILE_SIZE / 2;
        const cy = py + TILE_SIZE / 2;

        if (tile.type === "exit") {
          this.drawExitAnimated(px, py, cx, cy);
        } else if (tile.type === "key" && !tile.consumed) {
          this.drawKeyAnimated(px, py, cx, cy);
        } else if (tile.type === "timed_gate" && !tile.open) {
          const isOpen = tile.linkId ? state.doorStates[tile.linkId] : tile.open;
          if (!isOpen && tile.timer !== undefined && tile.timer > 0) {
            // Timer overlay
            ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
            ctx.beginPath();
            ctx.arc(cx, cy, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 10px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`${tile.timer}`, cx, cy);
          }
        } else if (tile.type === "spike_trap") {
          // Animated pulse on spikes
          const pulse = 0.3 * Math.sin(this.animFrame * 0.1);
          if (pulse > 0) {
            ctx.fillStyle = COL.spike;
            ctx.globalAlpha = pulse * 0.3;
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.globalAlpha = 1;
          }
        }
      }
    }
  }

  private drawExitAnimated(px: number, py: number, cx: number, cy: number): void {
    const { ctx } = this;
    const pulse = 0.5 + 0.5 * Math.sin(this.animFrame * 0.05);

    // Outer glow (simple circle, no gradient)
    ctx.fillStyle = COL.exitGlow;
    ctx.globalAlpha = 0.15 + 0.1 * pulse;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();

    // Inner diamond
    ctx.fillStyle = COL.exitGlow;
    ctx.globalAlpha = 0.4 + 0.25 * pulse;
    ctx.beginPath();
    ctx.moveTo(cx, py + 4);
    ctx.lineTo(px + TILE_SIZE - 4, cy);
    ctx.lineTo(cx, py + TILE_SIZE - 4);
    ctx.lineTo(px + 4, cy);
    ctx.closePath();
    ctx.fill();

    // Bright core diamond
    ctx.fillStyle = COL.exit;
    ctx.globalAlpha = 0.5 + 0.3 * pulse;
    ctx.beginPath();
    ctx.moveTo(cx, py + 10);
    ctx.lineTo(px + TILE_SIZE - 10, cy);
    ctx.lineTo(cx, py + TILE_SIZE - 10);
    ctx.lineTo(px + 10, cy);
    ctx.closePath();
    ctx.fill();

    // Staircase icon
    ctx.strokeStyle = COL.exit;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy + 4);
    ctx.lineTo(cx - 1, cy + 4);
    ctx.lineTo(cx - 1, cy);
    ctx.lineTo(cx + 3, cy);
    ctx.lineTo(cx + 3, cy - 4);
    ctx.lineTo(cx + 7, cy - 4);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  private drawKeyAnimated(px: number, py: number, cx: number, cy: number): void {
    const { ctx } = this;
    const pulse = 0.7 + 0.3 * Math.sin(this.animFrame * 0.08);
    const bob = Math.sin(this.animFrame * 0.06) * 2;

    // Glow
    ctx.fillStyle = COL.key;
    ctx.globalAlpha = 0.15 * pulse;
    ctx.beginPath();
    ctx.arc(cx, cy + bob, 14, 0, Math.PI * 2);
    ctx.fill();

    // Key shape
    ctx.globalAlpha = 0.9;
    ctx.save();
    ctx.translate(cx, cy + bob);

    ctx.strokeStyle = COL.key;
    ctx.lineWidth = 2.5;
    // Ring
    ctx.beginPath();
    ctx.arc(-2, -3, 5, 0, Math.PI * 2);
    ctx.stroke();
    // Shaft
    ctx.beginPath();
    ctx.moveTo(3, -3);
    ctx.lineTo(10, -3);
    ctx.stroke();
    // Teeth
    ctx.beginPath();
    ctx.moveTo(7, -3);
    ctx.lineTo(7, 1);
    ctx.moveTo(10, -3);
    ctx.lineTo(10, 2);
    ctx.stroke();

    // Shine
    ctx.fillStyle = COL.keyShine;
    ctx.globalAlpha = 0.5 * pulse;
    ctx.beginPath();
    ctx.arc(-3, -5, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // ── Enemies ───────────────────────────────────────────────────────────

  private drawEnemies(state: GameState): void {
    const { ctx } = this;

    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;

      const px = enemy.x * TILE_SIZE;
      const py = enemy.y * TILE_SIZE;
      const cx = px + TILE_SIZE / 2;
      const cy = py + TILE_SIZE / 2;

      const isGuard = enemy.def.type === "guard";
      const isChase = enemy.def.type === "chase";
      const col = isGuard ? COL.guard : isChase ? COL.chase : COL.enemy;

      // Idle bob
      const bob = Math.sin(this.animFrame * 0.08 + enemy.id * 2) * 1.5;

      // Guard range indicator
      if (isGuard) {
        const guardAlpha = 0.1 + 0.06 * Math.sin(this.animFrame * 0.04);
        ctx.fillStyle = COL.guard;
        ctx.globalAlpha = guardAlpha;
        ctx.fillRect(px - TILE_SIZE, py - TILE_SIZE, TILE_SIZE * 3, TILE_SIZE * 3);
        ctx.globalAlpha = guardAlpha + 0.08;
        ctx.strokeStyle = COL.guard;
        ctx.lineWidth = 1;
        ctx.strokeRect(px - TILE_SIZE + 1, py - TILE_SIZE + 1, TILE_SIZE * 3 - 2, TILE_SIZE * 3 - 2);
        ctx.globalAlpha = 1;
      }

      // Chase sense lines
      if (isChase) {
        const chasePulse = 0.2 + 0.15 * Math.sin(this.animFrame * 0.1);
        ctx.strokeStyle = COL.chase;
        ctx.globalAlpha = chasePulse;
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const r = 14 + i * 4;
          ctx.beginPath();
          ctx.arc(cx, cy + bob, r, -0.4, 0.4);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx, cy + bob, r, Math.PI - 0.4, Math.PI + 0.4);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // Glow (simple semi-transparent circle, no gradient)
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.arc(cx, cy + bob, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.beginPath();
      ctx.ellipse(cx, cy + 12, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(cx, cy + bob, 10, 0, Math.PI * 2);
      ctx.fill();

      // Body highlight
      ctx.fillStyle = COL.enemyCore;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(cx - 2, cy + bob - 3, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Eyes
      const eyeY = cy + bob - 2;
      ctx.fillStyle = "#1a0000";
      ctx.beginPath();
      ctx.arc(cx - 3, eyeY, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 3, eyeY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Eye glints
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.beginPath();
      ctx.arc(cx - 2.5, eyeY - 1, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 3.5, eyeY - 1, 1, 0, Math.PI * 2);
      ctx.fill();

      // Mouth by type
      if (isGuard) {
        ctx.strokeStyle = "#1a0000";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 3, cy + bob + 3);
        ctx.lineTo(cx + 3, cy + bob + 3);
        ctx.stroke();
      } else if (isChase) {
        ctx.strokeStyle = "#1a0000";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy + bob + 1, 4, 0.2, Math.PI - 0.2);
        ctx.stroke();
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.fillRect(cx - 3, cy + bob + 2, 2, 2);
        ctx.fillRect(cx + 1, cy + bob + 2, 2, 2);
      } else {
        ctx.fillStyle = "#1a0000";
        ctx.beginPath();
        ctx.arc(cx, cy + bob + 3, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ── Echoes ────────────────────────────────────────────────────────────

  private drawEchoes(state: GameState): void {
    const { ctx } = this;

    for (const echo of state.echoes) {
      if (!echo.alive) continue;

      const px = echo.x * TILE_SIZE;
      const py = echo.y * TILE_SIZE;
      const cx = px + TILE_SIZE / 2;
      const cy = py + TILE_SIZE / 2;
      const bob = Math.sin(this.animFrame * 0.07 + echo.id * 1.5) * 1;

      // Trail particles
      if (this.animFrame % 5 === 0) {
        this.spawnParticle(cx + (Math.random() - 0.5) * 8, cy + 6, echo.color, 0.3, 0.5);
      }

      // Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.beginPath();
      ctx.ellipse(cx, cy + 12, 7, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Outer glow (simple)
      ctx.fillStyle = echo.color;
      ctx.globalAlpha = 0.1;
      ctx.beginPath();
      ctx.arc(cx, cy + bob, 16, 0, Math.PI * 2);
      ctx.fill();

      // Ghost body with wavy bottom
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = echo.color;
      ctx.beginPath();
      ctx.arc(cx, cy + bob - 2, 11, Math.PI, 0);
      const waveOffset = this.animFrame * 0.1;
      ctx.lineTo(cx + 11, cy + bob + 6);
      for (let i = 0; i <= 4; i++) {
        const wx = cx + 11 - (i * 22) / 4;
        const wy = cy + bob + 6 + Math.sin(waveOffset + i * 1.5) * 3;
        ctx.lineTo(wx, wy);
      }
      ctx.closePath();
      ctx.fill();

      // Inner highlight
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(cx - 2, cy + bob - 5, 5, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(cx - 3, cy + bob - 3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 3, cy + bob - 3, 3, 0, Math.PI * 2);
      ctx.fill();
      // Pupils
      ctx.fillStyle = echo.color;
      ctx.beginPath();
      ctx.arc(cx - 3, cy + bob - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 3, cy + bob - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Number
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${echo.id + 1}`, cx, cy + bob + 2);

      // Key indicator
      if (echo.hasKey) {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = COL.key;
        ctx.strokeStyle = COL.key;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx + 10, cy + bob - 10, 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }
  }

  // ── Player ────────────────────────────────────────────────────────────

  private drawPlayer(state: GameState): void {
    const { ctx } = this;
    const { player } = state;
    const px = player.x * TILE_SIZE;
    const py = player.y * TILE_SIZE;
    const cx = px + TILE_SIZE / 2;
    const cy = py + TILE_SIZE / 2;
    const breathe = Math.sin(this.animFrame * 0.06) * 0.5;

    // Light pool (simple circle, no gradient)
    ctx.fillStyle = "rgba(255, 238, 136, 0.06)";
    ctx.beginPath();
    ctx.arc(cx, cy, TILE_SIZE * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 238, 136, 0.04)";
    ctx.beginPath();
    ctx.arc(cx, cy, TILE_SIZE * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Glow ring
    const glowPulse = 0.25 + 0.12 * Math.sin(this.animFrame * 0.06);
    ctx.fillStyle = "rgba(255, 238, 136, " + glowPulse + ")";
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fill();

    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 13, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = COL.player;
    ctx.beginPath();
    ctx.arc(cx, cy, 11 + breathe, 0, Math.PI * 2);
    ctx.fill();

    // Body core highlight
    ctx.fillStyle = COL.playerCore;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 3, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Outline glow
    ctx.strokeStyle = "rgba(255, 238, 136, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 11 + breathe, 0, Math.PI * 2);
    ctx.stroke();

    // Eyes
    ctx.fillStyle = "#222244";
    ctx.beginPath();
    ctx.ellipse(cx - 4, cy - 2, 2, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 4, cy - 2, 2, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye highlights
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.beginPath();
    ctx.arc(cx - 3.5, cy - 3, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 4.5, cy - 3, 1, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = "#222244";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy + 1, 3, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Key indicator
    if (player.hasKey) {
      const keyBob = Math.sin(this.animFrame * 0.1) * 2;
      ctx.strokeStyle = COL.key;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx + 11, cy - 13 + keyBob, 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 14, cy - 13 + keyBob);
      ctx.lineTo(cx + 18, cy - 13 + keyBob);
      ctx.stroke();
    }
  }

  // ── HUD ───────────────────────────────────────────────────────────────

  private drawHUD(state: GameState): void {
    const { ctx } = this;

    // Background bar
    ctx.fillStyle = "rgba(8, 8, 15, 0.8)";
    ctx.fillRect(0, 0, CANVAS_W, 32);

    // Bottom border
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.fillRect(0, 31, CANVAS_W, 1);

    ctx.font = "bold 12px monospace";
    ctx.textBaseline = "middle";

    // Echo count
    ctx.fillStyle = COL.hud;
    ctx.textAlign = "left";
    ctx.fillText(`Echoes: ${state.echoCount}`, 8, 16);

    // Turn
    ctx.textAlign = "center";
    ctx.fillStyle = COL.hudDim;
    ctx.fillText(`Turn ${state.turn}`, CANVAS_W / 2, 16);

    // Tier
    const tierNames: Record<number, string> = { 1: "Easy", 2: "Medium", 3: "Hard", 4: "Nightmare" };
    const tierColors: Record<number, string> = { 1: "#44ff88", 2: "#ffdd44", 3: "#ff8844", 4: "#ff3344" };
    ctx.textAlign = "right";
    ctx.fillStyle = tierColors[state.tier] ?? COL.hudDim;
    ctx.fillText(tierNames[state.tier] ?? "", CANVAS_W - 8, 16);

    // Echo dots
    if (state.echoes.length > 0) {
      const startX = 100;
      for (let i = 0; i < state.echoes.length; i++) {
        const echo = state.echoes[i];
        ctx.fillStyle = echo.color;
        ctx.globalAlpha = echo.alive ? 0.8 : 0.2;
        ctx.beginPath();
        ctx.arc(startX + i * 16, 16, 5, 0, Math.PI * 2);
        ctx.fill();
        if (echo.alive) {
          ctx.strokeStyle = echo.color;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.arc(startX + i * 16, 16, 7, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  // ── Ambient Particles ─────────────────────────────────────────────────

  private spawnAmbientParticles(dt: number): void {
    this.ambientTimer += dt;
    if (this.ambientTimer < 0.25) return;
    this.ambientTimer = 0;

    // Floating dust mote
    this.particles.push({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      vx: (Math.random() - 0.5) * 3,
      vy: -Math.random() * 6 - 1,
      life: 1.5 + Math.random(),
      maxLife: 2.5,
      color: "rgba(150, 170, 220, 0.3)",
      size: 1 + Math.random(),
    });
  }

  // ── Particles ─────────────────────────────────────────────────────────

  spawnParticle(
    x: number,
    y: number,
    color: string,
    speed: number = 1,
    maxLife: number = 0.6,
  ): void {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * speed * 30,
      vy: (Math.random() - 0.5) * speed * 30,
      life: maxLife,
      maxLife,
      color,
      size: 2 + Math.random() * 2,
    });
  }

  spawnBurst(
    x: number,
    y: number,
    color: string,
    count: number = 12,
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 40 + Math.random() * 40;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private drawParticles(): void {
    const { ctx } = this;
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      const sz = p.size * (p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ── Screen Shake ──────────────────────────────────────────────────────

  shakeScreen(intensity: number = 4, duration: number = 0.3): void {
    this.shake.intensity = intensity;
    this.shake.duration = duration;
    this.shake.elapsed = 0;
  }

  private updateShake(dt: number): void {
    if (this.shake.duration <= 0) {
      this.shake.x = 0;
      this.shake.y = 0;
      return;
    }

    this.shake.elapsed += dt;
    if (this.shake.elapsed >= this.shake.duration) {
      this.shake.duration = 0;
      this.shake.x = 0;
      this.shake.y = 0;
      return;
    }

    const progress = this.shake.elapsed / this.shake.duration;
    const fade = 1 - progress;
    this.shake.x = (Math.random() - 0.5) * this.shake.intensity * fade;
    this.shake.y = (Math.random() - 0.5) * this.shake.intensity * fade;
  }
}
