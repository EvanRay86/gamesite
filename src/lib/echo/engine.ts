// Game engine for ECHO — ghost-run roguelike
// State machine: menu → playing → dead → playing → ... → victory

import type {
  GameState,
  GamePhase,
  Action,
  DifficultyTier,
  Echo,
  Enemy,
  EchoMeta,
} from "@/types/echo";
import { generateDungeon, dateToSeed } from "./dungeon-gen";
import {
  createEcho,
  stepEcho,
  recordAction,
  isWalkable,
  getTargetPosition,
} from "./echo-system";
import { stepEnemy, checkEnemyKill } from "./enemies";
import {
  updatePressurePlates,
  checkLeverInteraction,
  checkKeyPickup,
  tryUnlockDoor,
  tickTimedGates,
  isOnSpikeTrap,
} from "./interactables";

const META_KEY = "echo_meta";

// ── Engine Class ────────────────────────────────────────────────────────────

export class EchoEngine {
  state!: GameState;
  onStateChange?: () => void;
  /** Fired on death with the echo number. */
  onDeath?: (echoNumber: number) => void;
  /** Fired on victory. */
  onVictory?: () => void;

  private initialEnemies: Enemy[] = [];

  constructor() {
    this.state = this.createMenuState();
  }

  // ── State Change Notification ───────────────────────────────────────────

  private emit(): void {
    this.onStateChange?.();
  }

  // ── Menu State ──────────────────────────────────────────────────────────

  private createMenuState(): GameState {
    const { map, enemies } = generateDungeon(Date.now(), 1);
    return {
      phase: "menu",
      dungeon: map,
      player: { x: map.spawnX, y: map.spawnY, alive: true, hasKey: false },
      echoes: [],
      enemies,
      currentActions: [],
      turn: 0,
      echoCount: 0,
      tier: 1,
      isDaily: false,
      seed: map.seed,
      startTime: Date.now(),
      totalTurns: 0,
      doorStates: {},
    };
  }

  // ── New Run ─────────────────────────────────────────────────────────────

  newRun(tier: DifficultyTier): void {
    const seed = Date.now();
    this.startDungeon(seed, tier, false);
  }

  newDailyRun(): void {
    const today = new Date().toISOString().slice(0, 10);
    const seed = dateToSeed(today);
    this.startDungeon(seed, 2, true);
  }

  private startDungeon(seed: number, tier: DifficultyTier, isDaily: boolean): void {
    const { map, enemies } = generateDungeon(seed, tier);
    this.initialEnemies = JSON.parse(JSON.stringify(enemies));

    this.state = {
      phase: "playing",
      dungeon: map,
      player: { x: map.spawnX, y: map.spawnY, alive: true, hasKey: false },
      echoes: [],
      enemies,
      currentActions: [],
      turn: 0,
      echoCount: 0,
      tier,
      isDaily,
      seed,
      startTime: Date.now(),
      totalTurns: 0,
      doorStates: {},
    };
    this.emit();
  }

  // ── Player Movement ─────────────────────────────────────────────────────

  move(action: Action): void {
    if (this.state.phase !== "playing" || !this.state.player.alive) return;

    const { player, dungeon, doorStates } = this.state;
    const [nx, ny] = getTargetPosition(player.x, player.y, action);

    // Bounds check
    if (nx < 0 || nx >= dungeon.width || ny < 0 || ny >= dungeon.height) {
      // Record wait instead
      this.processTurn("wait");
      return;
    }

    const tile = dungeon.tiles[ny][nx];

    // Check locked door — try to use key
    if (tile.type === "locked_door" && tile.linkId && !doorStates[tile.linkId]) {
      if (player.hasKey) {
        // Try to unlock this specific door
        doorStates[tile.linkId] = true;
        player.hasKey = false;
        this.processTurn(action);
        return;
      }
      // Can't pass, treat as wall
      this.processTurn("wait");
      return;
    }

    if (!isWalkable(tile, doorStates)) {
      this.processTurn("wait");
      return;
    }

    // Move player
    player.x = nx;
    player.y = ny;
    this.processTurn(action);
  }

  // ── Turn Processing ─────────────────────────────────────────────────────

  private processTurn(action: Action): void {
    const { state } = this;

    // 1. Record action
    recordAction(state.currentActions, action);

    // 2. Check player interactions at new position
    this.handlePlayerInteractions();

    // 3. Step all echoes
    for (const echo of state.echoes) {
      if (!echo.alive) continue;
      const prevX = echo.x;
      const prevY = echo.y;
      stepEcho(
        echo,
        state.turn,
        state.dungeon.tiles,
        state.doorStates,
        state.dungeon.width,
        state.dungeon.height,
      );
      // Echo interactions
      this.handleEchoInteractions(echo, prevX, prevY);
    }

    // 4. Step all enemies
    for (const enemy of state.enemies) {
      stepEnemy(
        enemy,
        state.player.x,
        state.player.y,
        state.echoes,
        state.dungeon.tiles,
        state.doorStates,
        state.dungeon.width,
        state.dungeon.height,
      );
    }

    // 5. Update pressure plates (must be after movement)
    updatePressurePlates(state);

    // 6. Tick timed gates
    tickTimedGates(state);

    // 7. Check for deaths (enemy collisions)
    this.checkDeaths();

    // 8. Check victory
    if (
      state.player.alive &&
      state.player.x === state.dungeon.exitX &&
      state.player.y === state.dungeon.exitY
    ) {
      state.phase = "victory";
      state.totalTurns += state.turn;
      this.saveMeta();
      this.onVictory?.();
      this.emit();
      return;
    }

    // 9. Advance turn
    state.turn++;
    this.emit();
  }

  // ── Player Interactions ─────────────────────────────────────────────────

  private handlePlayerInteractions(): void {
    const { player, dungeon, doorStates } = this.state;

    // Lever toggle
    checkLeverInteraction(this.state, player.x, player.y);

    // Key pickup
    const keyId = checkKeyPickup(dungeon.tiles, player.x, player.y);
    if (keyId) {
      player.hasKey = true;
      // Automatically unlock adjacent door with matching key
      tryUnlockDoor(dungeon.tiles, doorStates, player.x, player.y, keyId);
    }
  }

  // ── Echo Interactions ───────────────────────────────────────────────────

  private handleEchoInteractions(echo: Echo, _prevX: number, _prevY: number): void {
    const { dungeon, doorStates } = this.state;

    // Lever toggle
    checkLeverInteraction(this.state, echo.x, echo.y);

    // Key pickup
    const keyId = checkKeyPickup(dungeon.tiles, echo.x, echo.y);
    if (keyId) {
      echo.hasKey = true;
      tryUnlockDoor(dungeon.tiles, doorStates, echo.x, echo.y, keyId);
    }
  }

  // ── Death Checks ────────────────────────────────────────────────────────

  private checkDeaths(): void {
    const { state } = this;

    // Check player death from enemies
    if (state.player.alive) {
      const killer = checkEnemyKill(state.enemies, state.player.x, state.player.y);
      if (killer) {
        this.handlePlayerDeath();
        return;
      }

      // Check spike trap
      if (isOnSpikeTrap(state.dungeon.tiles, state.player.x, state.player.y)) {
        this.handlePlayerDeath();
        return;
      }
    }

    // Check echo deaths from enemies
    for (const echo of state.echoes) {
      if (!echo.alive) continue;

      const killer = checkEnemyKill(state.enemies, echo.x, echo.y);
      if (killer) {
        echo.alive = false;
        // Echo absorbs the hit — destroy the enemy too (sacrificial block)
        killer.alive = false;
        continue;
      }

      // Echo on spike trap
      if (isOnSpikeTrap(state.dungeon.tiles, echo.x, echo.y)) {
        echo.alive = false;
      }
    }
  }

  // ── Player Death & Respawn ──────────────────────────────────────────────

  private handlePlayerDeath(): void {
    const { state } = this;
    state.player.alive = false;
    state.phase = "dead";

    // Record total turns from this life
    state.totalTurns += state.turn;

    // Create echo from this life's recording
    const newEcho = createEcho(
      state.echoCount,
      state.currentActions,
      state.dungeon.spawnX,
      state.dungeon.spawnY,
    );
    state.echoCount++;

    // Safety: cap echoes at 20
    if (state.echoCount > 20) {
      state.phase = "gameover";
      this.emit();
      return;
    }

    this.onDeath?.(state.echoCount);
    this.emit();

    // Store the new echo for respawn
    (state as GameState & { pendingEcho: Echo }).pendingEcho = newEcho;
  }

  /**
   * Call after death screen to respawn with all echoes replaying.
   */
  respawn(): void {
    if (this.state.phase !== "dead") return;

    const { state } = this;
    const pendingEcho = (state as GameState & { pendingEcho?: Echo }).pendingEcho;
    if (pendingEcho) {
      state.echoes.push(pendingEcho);
      delete (state as GameState & { pendingEcho?: Echo }).pendingEcho;
    }

    // Reset player to spawn
    state.player.x = state.dungeon.spawnX;
    state.player.y = state.dungeon.spawnY;
    state.player.alive = true;
    state.player.hasKey = false;

    // Reset all echoes to spawn
    for (const echo of state.echoes) {
      echo.x = state.dungeon.spawnX;
      echo.y = state.dungeon.spawnY;
      echo.alive = true;
      echo.hasKey = false;
    }

    // Reset enemies to initial state
    state.enemies = JSON.parse(JSON.stringify(this.initialEnemies));

    // Reset all dynamic tile states
    state.doorStates = {};
    for (let y = 0; y < state.dungeon.height; y++) {
      for (let x = 0; x < state.dungeon.width; x++) {
        const tile = state.dungeon.tiles[y][x];
        if (tile.type === "key") tile.consumed = false;
        if (tile.type === "timed_gate") tile.timer = 0;
      }
    }

    // Reset turn counter & recording
    state.currentActions = [];
    state.turn = 0;
    state.phase = "playing";
    this.emit();
  }

  // ── Back to Menu ────────────────────────────────────────────────────────

  backToMenu(): void {
    this.state = this.createMenuState();
    this.emit();
  }

  // ── Meta Progression ────────────────────────────────────────────────────

  loadMeta(): EchoMeta {
    if (typeof window === "undefined") return this.defaultMeta();
    try {
      const raw = localStorage.getItem(META_KEY);
      return raw ? JSON.parse(raw) : this.defaultMeta();
    } catch {
      return this.defaultMeta();
    }
  }

  private saveMeta(): void {
    if (typeof window === "undefined") return;
    const meta = this.loadMeta();
    const { state } = this;

    meta.totalRuns++;
    meta.dungeonCleared++;
    meta.totalEchoesUsed += state.echoCount;

    const tier = state.tier;
    if (!meta.bestEchoes[tier] || state.echoCount < meta.bestEchoes[tier]) {
      meta.bestEchoes[tier] = state.echoCount;
    }
    if (!meta.bestTurns[tier] || state.totalTurns < meta.bestTurns[tier]) {
      meta.bestTurns[tier] = state.totalTurns;
    }

    if (state.isDaily) {
      const today = new Date().toISOString().slice(0, 10);
      meta.dailyHistory[today] = {
        echoes: state.echoCount,
        turns: state.totalTurns,
      };
    }

    try {
      localStorage.setItem(META_KEY, JSON.stringify(meta));
    } catch {
      // Ignore storage errors
    }
  }

  private defaultMeta(): EchoMeta {
    return {
      totalRuns: 0,
      dungeonCleared: 0,
      totalEchoesUsed: 0,
      bestEchoes: {},
      bestTurns: {},
      dailyHistory: {},
    };
  }

  // ── Share Text ──────────────────────────────────────────────────────────

  getShareText(): string {
    const { state } = this;
    const tierNames: Record<number, string> = {
      1: "Easy",
      2: "Medium",
      3: "Hard",
      4: "Nightmare",
    };

    const lines = [
      `ECHO - ${tierNames[state.tier]} Dungeon`,
      `Cleared in ${state.echoCount} ${state.echoCount === 1 ? "echo" : "echoes"} (${state.totalTurns} turns)`,
      "",
    ];

    // Add echo descriptions
    for (let i = 0; i < state.echoes.length; i++) {
      const echo = state.echoes[i];
      const alive = echo.alive ? "" : " (fallen)";
      lines.push(`Echo ${i + 1}: ${echo.actions.length} steps${alive}`);
    }
    lines.push(`Me: Walked to freedom`);
    lines.push("");
    lines.push("gamesite.app/arcade/echo");

    return lines.join("\n");
  }
}
