// Grid combat resolution system for Netherveil
// Handles card targeting, damage resolution, status effects, and turn management

import type {
  CombatState,
  GridCell,
  GridPosition,
  CardInstance,
  CardEffect,
  ActiveStatus,
  EnemyState,
  StatusType,
  TargetPattern,
  PlayerState,
  AnimationStep,
} from "@/types/netherveil";
import { getCardDef, getEffects, getEnergyCost, createCardInstance } from "./cards";
import {
  createEnemyState,
  getEnemyDef,
  rollIntent,
  executeIntent,
  tickEnemyStatuses,
  getEncounter,
  getEliteEncounter,
  getBossEncounter,
} from "./enemies";
import { shuffle, uid, pick } from "./seed";
import type { ActId } from "@/types/netherveil";

// ── Constants ───────────────────────────────────────────────────────────────

export const GRID_ROWS = 3;
export const GRID_COLS = 5;
export const STARTING_ENERGY = 3;
export const HAND_SIZE = 5;

// ── Grid Helpers ────────────────────────────────────────────────────────────

export function createEmptyGrid(): GridCell[][] {
  return Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => ({ unit: null })),
  );
}

export function getEnemyAt(grid: GridCell[][], pos: GridPosition): EnemyState | null {
  const cell = grid[pos.row]?.[pos.col];
  if (cell?.unit?.type === "enemy" && cell.unit.enemyState) {
    return cell.unit.enemyState;
  }
  return null;
}

export function getAllEnemies(grid: GridCell[][]): { enemy: EnemyState; pos: GridPosition }[] {
  const result: { enemy: EnemyState; pos: GridPosition }[] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const cell = grid[row][col];
      if (cell.unit?.type === "enemy" && cell.unit.enemyState) {
        result.push({ enemy: cell.unit.enemyState, pos: { row, col } });
      }
    }
  }
  return result;
}

export function placeEnemy(
  grid: GridCell[][],
  enemy: EnemyState,
  pos: GridPosition,
): void {
  grid[pos.row][pos.col] = {
    unit: {
      id: enemy.instanceId,
      type: "enemy",
      enemyState: enemy,
    },
  };
}

export function removeDeadEnemies(grid: GridCell[][]): EnemyState[] {
  const dead: EnemyState[] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const cell = grid[row][col];
      if (cell.unit?.type === "enemy" && cell.unit.enemyState && cell.unit.enemyState.hp <= 0) {
        dead.push(cell.unit.enemyState);
        grid[row][col] = { unit: null };
      }
    }
  }
  return dead;
}

// ── Combat Initialization ───────────────────────────────────────────────────

export function initCombat(
  deck: CardInstance[],
  act: ActId,
  floor: number,
  encounterType: "combat" | "elite" | "boss",
  rng: () => number,
): CombatState {
  const grid = createEmptyGrid();

  // Get encounter based on type
  let encounter: { enemies: EnemyState[]; positions: GridPosition[] };
  switch (encounterType) {
    case "elite":
      encounter = getEliteEncounter(act, floor, rng);
      break;
    case "boss":
      encounter = getBossEncounter(act, floor);
      break;
    default:
      encounter = getEncounter(act, floor, rng);
  }

  // Place enemies on the grid
  for (let i = 0; i < encounter.enemies.length; i++) {
    const enemy = encounter.enemies[i];
    const pos = encounter.positions[i];
    // Roll initial intent
    enemy.intent = rollIntent(enemy, rng);
    placeEnemy(grid, enemy, pos);
  }

  // Create draw pile from deck (shuffled)
  const drawPile = deck.map((c) => ({ ...c, instanceId: uid() }));
  shuffle(drawPile, rng);

  // Draw initial hand
  const hand: CardInstance[] = [];
  for (let i = 0; i < HAND_SIZE && drawPile.length > 0; i++) {
    hand.push(drawPile.pop()!);
  }

  return {
    enemyGrid: grid,
    playerStatuses: [],
    hand,
    drawPile,
    discardPile: [],
    exhaustPile: [],
    energy: STARTING_ENERGY,
    maxEnergy: STARTING_ENERGY,
    turnCount: 1,
    selectedCardInstanceId: null,
    targetingMode: false,
    validTargets: [],
  };
}

// ── Targeting ───────────────────────────────────────────────────────────────

/** Get all grid positions affected by a target pattern centered on a position. */
export function getAffectedPositions(
  pattern: TargetPattern,
  target: GridPosition,
  grid: GridCell[][],
  rng?: () => number,
): GridPosition[] {
  switch (pattern) {
    case "single":
      return [target];

    case "row":
      return Array.from({ length: GRID_COLS }, (_, col) => ({ row: target.row, col }));

    case "column":
      return Array.from({ length: GRID_ROWS }, (_, row) => ({ row, col: target.col }));

    case "cross":
      return [
        target,
        ...Array.from({ length: GRID_COLS }, (_, col) => ({ row: target.row, col })),
        ...Array.from({ length: GRID_ROWS }, (_, row) => ({ row, col: target.col })),
      ].filter(
        (p, i, arr) =>
          arr.findIndex((q) => q.row === p.row && q.col === p.col) === i,
      );

    case "aoe_2x2":
      return [
        target,
        { row: target.row, col: target.col + 1 },
        { row: target.row + 1, col: target.col },
        { row: target.row + 1, col: target.col + 1 },
      ].filter((p) => p.row >= 0 && p.row < GRID_ROWS && p.col >= 0 && p.col < GRID_COLS);

    case "aoe_3x3": {
      const positions: GridPosition[] = [];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = target.row + dr;
          const c = target.col + dc;
          if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
            positions.push({ row: r, col: c });
          }
        }
      }
      return positions;
    }

    case "all_enemies":
      return getAllEnemies(grid).map((e) => e.pos);

    case "self":
    case "self_row":
      return []; // No grid targeting needed

    case "random_2":
    case "random_3": {
      const enemies = getAllEnemies(grid);
      const count = pattern === "random_2" ? 2 : 3;
      if (!rng) return enemies.slice(0, count).map((e) => e.pos);
      const shuffled = [...enemies];
      shuffle(shuffled, rng);
      return shuffled.slice(0, count).map((e) => e.pos);
    }

    default:
      return [target];
  }
}

/** Get valid target positions for a card (cells that contain enemies for attack cards). */
export function getValidTargets(
  card: CardInstance,
  grid: GridCell[][],
): GridPosition[] {
  const def = getCardDef(card.defId);
  const pattern = def.targetPattern;

  // Self-targeting cards don't need grid targets
  if (pattern === "self" || pattern === "self_row") return [];

  // All enemies doesn't need targeting
  if (pattern === "all_enemies" || pattern === "random_2" || pattern === "random_3") return [];

  // For targeted patterns, any occupied cell is valid
  // But we show ALL cells as potential targets (the pattern will determine what gets hit)
  const enemies = getAllEnemies(grid);
  if (enemies.length === 0) return [];

  // For single target, only cells with enemies
  if (pattern === "single") {
    return enemies.map((e) => e.pos);
  }

  // For AoE patterns, all cells are valid anchor points
  // (we'll highlight affected cells separately)
  const allCells: GridPosition[] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      allCells.push({ row, col });
    }
  }
  return allCells;
}

// ── Card Resolution ─────────────────────────────────────────────────────────

export interface CardPlayResult {
  damage: Map<string, number>; // instanceId -> damage dealt
  killed: EnemyState[];
  playerShieldGained: number;
  playerHealed: number;
  cardsDrawn: number;
  energyGained: number;
  animations: AnimationStep[];
}

/** Play a card from hand, resolving all its effects. */
export function resolveCard(
  card: CardInstance,
  target: GridPosition | null,
  combat: CombatState,
  player: PlayerState,
  rng: () => number,
): CardPlayResult {
  const def = getCardDef(card.defId);
  const effects = getEffects(card);
  const result: CardPlayResult = {
    damage: new Map(),
    killed: [],
    playerShieldGained: 0,
    playerHealed: 0,
    cardsDrawn: 0,
    energyGained: 0,
    animations: [],
  };

  // Determine affected positions
  const affectedPos = target
    ? getAffectedPositions(def.targetPattern, target, combat.enemyGrid, rng)
    : [];

  // Apply each effect
  for (const effect of effects) {
    switch (effect.type) {
      case "damage": {
        // Check player strengthen status
        const strengthen = combat.playerStatuses.find((s) => s.type === "strengthen");
        const bonusDmg = strengthen ? strengthen.stacks : 0;

        for (const pos of affectedPos) {
          const enemy = getEnemyAt(combat.enemyGrid, pos);
          if (!enemy) continue;

          let dmg = effect.value + bonusDmg;

          // Check enemy vulnerable status
          const vulnerable = enemy.statusEffects.find((s) => s.type === "vulnerable");
          if (vulnerable) dmg = Math.round(dmg * 1.5);

          // Check phase ability (50% reduction every other turn)
          const def2 = getEnemyDef(enemy.defId);
          const hasPhase = def2.abilities.some((a) => a.type === "phase");
          if (hasPhase && enemy.turnsAlive % 2 === 1) {
            dmg = Math.round(dmg * 0.5);
          }

          // Apply damage to shield first, then HP
          if (enemy.shield > 0) {
            const shieldDmg = Math.min(enemy.shield, dmg);
            enemy.shield -= shieldDmg;
            dmg -= shieldDmg;
          }
          enemy.hp -= dmg;

          const prev = result.damage.get(enemy.instanceId) || 0;
          result.damage.set(enemy.instanceId, prev + dmg);

          // Add impact animation
          result.animations.push({
            type: "impact",
            duration: 0.3,
            data: { pos, damage: dmg, enemyId: enemy.instanceId },
          });
        }
        break;
      }

      case "shield":
        result.playerShieldGained += effect.value;
        break;

      case "heal": {
        const healAmount = Math.min(effect.value, player.maxHp - player.hp);
        result.playerHealed += healAmount;
        break;
      }

      case "draw":
        result.cardsDrawn += effect.value;
        break;

      case "energy_gain":
        result.energyGained += effect.value;
        break;

      case "apply_status": {
        if (!effect.statusType) break;
        const duration = effect.statusDuration ?? 2;

        // Determine if this applies to enemies or player
        const isPlayerBuff = [
          "shield",
          "strengthen",
          "stealth",
          "thorns",
          "regen",
          "ember_stacks",
          "shadow_marks",
          "void_charges",
          "weave_threads",
        ].includes(effect.statusType);

        if (isPlayerBuff) {
          applyStatus(combat.playerStatuses, effect.statusType, effect.value, duration);
        } else {
          // Apply to all affected enemies
          for (const pos of affectedPos) {
            const enemy = getEnemyAt(combat.enemyGrid, pos);
            if (!enemy) continue;
            applyStatus(enemy.statusEffects, effect.statusType, effect.value, duration);
          }
        }
        break;
      }
    }
  }

  // Remove dead enemies
  result.killed = removeDeadEnemies(combat.enemyGrid);

  return result;
}

// ── Status Effect Helpers ───────────────────────────────────────────────────

export function applyStatus(
  statuses: ActiveStatus[],
  type: StatusType,
  stacks: number,
  duration: number,
): void {
  const existing = statuses.find((s) => s.type === type);
  if (existing) {
    existing.stacks += stacks;
    existing.duration = Math.max(existing.duration, duration);
  } else {
    statuses.push({ type, stacks, duration });
  }
}

export function tickPlayerStatuses(statuses: ActiveStatus[]): {
  damage: number;
  heal: number;
} {
  let damage = 0;
  let heal = 0;

  for (const status of statuses) {
    if (status.type === "burn") damage += status.stacks;
    if (status.type === "poison") damage += status.stacks;
    if (status.type === "regen") heal += status.stacks;

    if (status.duration > 0) {
      status.duration--;
    }
  }

  // Remove expired (but keep permanent ones with duration -1)
  const remaining = statuses.filter((s) => s.duration !== 0);
  statuses.length = 0;
  statuses.push(...remaining);

  return { damage, heal };
}

// ── Turn Management ─────────────────────────────────────────────────────────

/** Draw cards from draw pile into hand. If draw pile is empty, shuffle discard into draw. */
export function drawCards(combat: CombatState, count: number, rng: () => number): CardInstance[] {
  const drawn: CardInstance[] = [];

  for (let i = 0; i < count; i++) {
    if (combat.drawPile.length === 0) {
      // Shuffle discard pile into draw pile
      combat.drawPile = [...combat.discardPile];
      combat.discardPile = [];
      shuffle(combat.drawPile, rng);
    }

    if (combat.drawPile.length > 0) {
      const card = combat.drawPile.pop()!;
      drawn.push(card);
    }
  }

  return drawn;
}

/** Start a new player turn: reset energy, draw cards. */
export function startPlayerTurn(combat: CombatState, rng: () => number): void {
  combat.energy = combat.maxEnergy;

  // Discard remaining hand
  combat.discardPile.push(...combat.hand);
  combat.hand = [];

  // Draw new hand
  const drawn = drawCards(combat, HAND_SIZE, rng);
  combat.hand.push(...drawn);

  combat.turnCount++;
  combat.selectedCardInstanceId = null;
  combat.targetingMode = false;
  combat.validTargets = [];
}

/** Process the enemy turn: all enemies execute their intents, then roll new ones. */
export function processEnemyTurn(
  combat: CombatState,
  player: PlayerState,
  rng: () => number,
): {
  totalDamage: number;
  enemyActions: { enemyId: string; intent: string; damage: number }[];
} {
  const enemies = getAllEnemies(combat.enemyGrid);
  let totalDamage = 0;
  const enemyActions: { enemyId: string; intent: string; damage: number }[] = [];

  // Player shield from this turn (resets each turn)
  let playerShield = 0;
  const shieldStatus = combat.playerStatuses.find((s) => s.type === "shield");
  if (shieldStatus) {
    playerShield = shieldStatus.stacks;
  }

  // Check stealth - if stealthed, enemies skip their attack
  const stealth = combat.playerStatuses.find((s) => s.type === "stealth");
  if (stealth && stealth.stacks > 0) {
    // Stealth blocks attacks this turn
    for (const { enemy } of enemies) {
      enemyActions.push({
        enemyId: enemy.instanceId,
        intent: "Missed (stealth)",
        damage: 0,
      });
      enemy.turnsAlive++;
      enemy.intent = rollIntent(enemy, rng);
    }
    return { totalDamage: 0, enemyActions };
  }

  for (const { enemy } of enemies) {
    const result = executeIntent(enemy);

    // Handle enemy shield gain
    if (result.shield > 0) {
      enemy.shield += result.shield;
    }

    // Handle enemy attack damage
    if (result.damage > 0) {
      let dmg = result.damage;

      // Thorns: damage back to enemy
      const thorns = combat.playerStatuses.find((s) => s.type === "thorns");
      if (thorns && thorns.stacks > 0) {
        enemy.hp -= thorns.stacks;
      }

      // Shield absorbs damage first
      if (playerShield > 0) {
        const absorbed = Math.min(playerShield, dmg);
        playerShield -= absorbed;
        dmg -= absorbed;
      }

      totalDamage += dmg;
      enemyActions.push({
        enemyId: enemy.instanceId,
        intent: enemy.intent.label,
        damage: dmg,
      });
    } else {
      enemyActions.push({
        enemyId: enemy.instanceId,
        intent: enemy.intent.label,
        damage: 0,
      });
    }

    // Apply debuffs from enemy
    if (result.statusApplied) {
      applyStatus(
        combat.playerStatuses,
        result.statusApplied.type,
        result.statusApplied.stacks,
        result.statusApplied.duration,
      );
    }

    // Tick enemy status effects (burn/poison damage)
    const tickDmg = tickEnemyStatuses(enemy);
    if (tickDmg > 0) {
      enemy.hp -= tickDmg;
    }

    // Advance enemy turn counter and roll new intent
    enemy.turnsAlive++;
    enemy.intent = rollIntent(enemy, rng);
  }

  // Update player shield status
  if (shieldStatus) {
    shieldStatus.stacks = playerShield;
    if (playerShield <= 0) {
      combat.playerStatuses = combat.playerStatuses.filter((s) => s.type !== "shield");
    }
  }

  // Remove dead enemies from tick damage
  removeDeadEnemies(combat.enemyGrid);

  return { totalDamage, enemyActions };
}

/** Check if all enemies are dead. */
export function isCombatWon(grid: GridCell[][]): boolean {
  return getAllEnemies(grid).length === 0;
}

/** Check if player is dead. */
export function isPlayerDead(player: PlayerState): boolean {
  return player.hp <= 0;
}
