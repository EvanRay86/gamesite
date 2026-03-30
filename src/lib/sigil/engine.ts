// ── SIGIL: Core Game Engine ─────────────────────────────────────────────────
// Handles grid pattern detection, combat resolution, status effects, and state transitions.

import type {
  GridCell, Rune, Enemy, PlayerState, CombatState, WeavingResult,
  ResolvedPattern, PatternBonus, StatusEffect, RunState, GameScreen,
  ShopItem, CharacterClass, MetaProgress, NodeType,
} from "./types";
import { getStarterDeck, getRuneRewards, mulberry32 } from "./data-runes";
import { spawnCombatEnemies, advanceEnemyIntent } from "./data-enemies";
import { getStarterRelic, getRelicReward, getShopRelics, getRandomEvent } from "./data-relics";
import { generateMap } from "./map-gen";

// ── Grid helpers ─────────────────────────────────────────────────────────────

export function createEmptyGrid(): GridCell[][] {
  return Array.from({ length: 3 }, (_, row) =>
    Array.from({ length: 3 }, (_, col) => ({ row, col, rune: null }))
  );
}

function cloneGrid(grid: GridCell[][]): GridCell[][] {
  return grid.map(row => row.map(cell => ({ ...cell, rune: cell.rune ? { ...cell.rune } : null })));
}

// ── Pattern Detection ────────────────────────────────────────────────────────

interface RawPattern {
  cells: [number, number][];
  bonus: PatternBonus;
  kind: string;
}

export function detectPatterns(grid: GridCell[][]): RawPattern[] {
  const patterns: RawPattern[] = [];
  const has = (r: number, c: number) => grid[r]?.[c]?.rune != null;

  // Horizontal lines
  for (let r = 0; r < 3; r++) {
    if (has(r, 0) && has(r, 1) && has(r, 2)) {
      patterns.push({ cells: [[r, 0], [r, 1], [r, 2]], bonus: "surge", kind: "line_h" });
    }
  }
  // Vertical lines
  for (let c = 0; c < 3; c++) {
    if (has(0, c) && has(1, c) && has(2, c)) {
      patterns.push({ cells: [[0, c], [1, c], [2, c]], bonus: "surge", kind: "line_v" });
    }
  }
  // Diagonals
  if (has(0, 0) && has(1, 1) && has(2, 2)) {
    patterns.push({ cells: [[0, 0], [1, 1], [2, 2]], bonus: "surge", kind: "line_d1" });
  }
  if (has(0, 2) && has(1, 1) && has(2, 0)) {
    patterns.push({ cells: [[0, 2], [1, 1], [2, 0]], bonus: "surge", kind: "line_d2" });
  }

  // L-shapes (check all 4 orientations)
  const lShapes: [number, number][][] = [
    [[0, 0], [1, 0], [2, 0], [2, 1]], // L bottom-right
    [[0, 0], [0, 1], [0, 2], [1, 2]], // L top-right
    [[0, 2], [1, 2], [2, 2], [2, 1]], // L bottom-left
    [[2, 0], [2, 1], [2, 2], [1, 0]], // L inverted
    [[0, 0], [1, 0], [1, 1], [1, 2]], // L rotated
    [[0, 0], [0, 1], [1, 1], [2, 1]], // L rotated 2
    [[0, 2], [1, 2], [1, 1], [1, 0]], // L rotated 3
    [[0, 1], [1, 1], [2, 1], [2, 0]], // L rotated 4
  ];
  for (const shape of lShapes) {
    if (shape.every(([r, c]) => has(r, c))) {
      // Only count if not entirely subsumed by a line — but L-shapes have 4 cells
      patterns.push({ cells: shape as [number, number][], bonus: "ricochet", kind: "l_shape" });
      break; // only one L-shape bonus per weave
    }
  }

  // Cross/Plus: center + all 4 orthogonal
  if (has(1, 1) && has(0, 1) && has(2, 1) && has(1, 0) && has(1, 2)) {
    patterns.push({ cells: [[1, 1], [0, 1], [2, 1], [1, 0], [1, 2]], bonus: "shield", kind: "cross" });
  }

  // Corners: any two diagonal cells with runes of same element
  const cornerPairs: [number, number][][] = [
    [[0, 0], [2, 2]], [[0, 2], [2, 0]], [[0, 0], [0, 2]], [[2, 0], [2, 2]],
    [[0, 0], [2, 0]], [[0, 2], [2, 2]],
  ];
  for (const [a, b] of cornerPairs) {
    if (has(a[0], a[1]) && has(b[0], b[1])) {
      const runeA = grid[a[0]][a[1]].rune!;
      const runeB = grid[b[0]][b[1]].rune!;
      if (runeA.element === runeB.element) {
        patterns.push({ cells: [a, b] as [number, number][], bonus: "leech", kind: "corners" });
        break; // only one corner bonus
      }
    }
  }

  return patterns;
}

// ── Weaving Resolution ───────────────────────────────────────────────────────

export function resolveWeaving(
  grid: GridCell[][],
  player: PlayerState,
  enemies: Enemy[],
  relicIds: string[],
): WeavingResult {
  const patterns = detectPatterns(grid);
  let totalDamage = 0;
  let totalBlock = 0;
  let bonusEnergy = 0;
  let healed = 0;
  let hitAll = false;
  const cellsConsumed = new Set<string>();
  const statusesApplied: { target: number; status: StatusEffect }[] = [];
  const resolvedPatterns: ResolvedPattern[] = [];

  const hasRelic = (id: string) => relicIds.includes(id);
  const whetBonus = hasRelic("relic_whetstone") ? 1 : 0;
  const runicLensBonus = hasRelic("relic_runic_lens") ? 3 : 0;

  // Calculate base damage/block from ALL runes on the grid
  let baseDamage = 0;
  let baseBlock = 0;
  const allRunes: { rune: Rune; row: number; col: number }[] = [];

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const rune = grid[r][c].rune;
      if (rune) {
        allRunes.push({ rune, row: r, col: c });
        let dmg = rune.baseDamage + whetBonus;
        let blk = rune.baseBlock;

        // Amplify keyword: +2 per adjacent same-element rune
        if (rune.keywords.includes("amplify")) {
          const adj = getAdjacentCells(r, c);
          for (const [ar, ac] of adj) {
            const adjRune = grid[ar]?.[ac]?.rune;
            if (adjRune) {
              if (rune.element === "arcana" || adjRune.element === rune.element) {
                dmg += 2;
              }
            }
          }
        }

        // Fortify keyword: +3 block per adjacent rune
        if (rune.keywords.includes("fortify")) {
          const adj = getAdjacentCells(r, c);
          for (const [ar, ac] of adj) {
            if (grid[ar]?.[ac]?.rune) blk += 3;
          }
        }

        // Upgraded rune bonus
        if (rune.upgraded && hasRelic("relic_runeweaver_tome")) {
          dmg += 3;
        }

        // Element-specific relic bonuses
        if (rune.element === "ignis" && hasRelic("relic_ember_crown")) dmg += 4;

        baseDamage += dmg;
        baseBlock += blk;

        // Apply keyword statuses
        for (const kw of rune.keywords) {
          const targetIdx = 0; // primary target
          switch (kw) {
            case "burn":
              statusesApplied.push({
                target: targetIdx,
                status: { type: "burn", stacks: 2 + (hasRelic("relic_ember_ring") ? 1 : 0), duration: -1 },
              });
              break;
            case "freeze":
              statusesApplied.push({
                target: targetIdx,
                status: { type: "freeze", stacks: 1, duration: 1 + (hasRelic("relic_frost_amulet") ? 1 : 0) },
              });
              break;
            case "poison": {
              const poisonAmt = (kw === "poison" ? 3 : 2) + (hasRelic("relic_venom_gland") ? 2 : 0);
              statusesApplied.push({
                target: targetIdx,
                status: { type: "poison", stacks: hasRelic("relic_void_mask") ? poisonAmt * 2 : poisonAmt, duration: -1 },
              });
              break;
            }
            case "shock":
              // Chain damage handled below
              break;
            case "siphon":
              bonusEnergy += 1;
              break;
            case "drain":
              healed += Math.floor(dmg * 0.5);
              break;
          }
        }

        // Echo keyword: double the rune's damage
        if (rune.keywords.includes("echo")) {
          baseDamage += dmg;
        }
      }
    }
  }

  // Apply pattern bonuses
  for (const pattern of patterns) {
    let patternDmg = 0;
    let patternBlk = 0;

    // Sum damage of runes in this pattern
    for (const [r, c] of pattern.cells) {
      const rune = grid[r][c].rune;
      if (rune) {
        patternDmg += rune.baseDamage;
        // Mark cells for consumption (unless persistent)
        if (!rune.persistent) {
          cellsConsumed.add(`${r},${c}`);
        }
      }
    }

    switch (pattern.bonus) {
      case "surge":
        patternDmg = Math.floor(patternDmg * 0.5) + runicLensBonus; // +50% bonus
        break;
      case "ricochet":
        hitAll = true;
        patternDmg = runicLensBonus;
        break;
      case "shield":
        patternBlk = Math.floor(patternDmg * 0.7) + runicLensBonus;
        patternDmg = runicLensBonus;
        break;
      case "leech":
        healed += Math.floor(patternDmg * 0.3);
        patternDmg = runicLensBonus;
        break;
      case "overcharge":
        bonusEnergy += 1;
        patternDmg = runicLensBonus;
        break;
    }

    if (hasRelic("relic_storm_crown") && pattern.bonus !== "overcharge") {
      bonusEnergy += 1;
    }

    totalDamage += patternDmg;
    totalBlock += patternBlk;

    resolvedPatterns.push({
      kind: pattern.kind as ResolvedPattern["kind"],
      bonus: pattern.bonus,
      cells: pattern.cells,
      totalDamage: patternDmg,
      totalBlock: patternBlk,
    });
  }

  totalDamage += baseDamage;
  totalBlock += baseBlock;

  // If no patterns were found, still consume placed runes
  if (patterns.length === 0) {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (grid[r][c].rune && !grid[r][c].rune!.persistent) {
          cellsConsumed.add(`${r},${c}`);
        }
      }
    }
  }

  // Shock chain damage
  const shockRunes = allRunes.filter(r => r.rune.keywords.includes("shock"));
  if (shockRunes.length > 0) {
    const chainPct = hasRelic("relic_conduit_rod") ? 0.75 : (hasRelic("relic_storm_eye") ? 1.0 : 0.5);
    for (const sr of shockRunes) {
      const chainDmg = Math.floor(sr.rune.baseDamage * chainPct);
      // Add chain damage for each additional enemy
      if (enemies.length > 1) {
        totalDamage += chainDmg * (enemies.length - 1);
      }
    }
  }

  // Volatile: explode adjacent cells for bonus damage
  const volatileRunes = allRunes.filter(r => r.rune.keywords.includes("volatile"));
  for (const vr of volatileRunes) {
    const adj = getAdjacentCells(vr.row, vr.col);
    for (const [ar, ac] of adj) {
      if (grid[ar]?.[ac]?.rune && !grid[ar][ac].rune!.persistent) {
        cellsConsumed.add(`${ar},${ac}`);
        totalDamage += 4;
      }
    }
  }

  // Shatter: 2x to frozen enemies
  const shatterRunes = allRunes.filter(r => r.rune.keywords.includes("shatter"));
  if (shatterRunes.length > 0) {
    for (const enemy of enemies) {
      if (enemy.statuses.some(s => s.type === "freeze")) {
        totalDamage += shatterRunes.reduce((sum, sr) => sum + sr.rune.baseDamage, 0);
      }
    }
  }

  // Ignite: consume all burn stacks for instant damage
  const igniteRunes = allRunes.filter(r => r.rune.keywords.includes("ignite"));
  if (igniteRunes.length > 0) {
    for (const enemy of enemies) {
      const burnStatus = enemy.statuses.find(s => s.type === "burn");
      if (burnStatus) {
        totalDamage += burnStatus.stacks * 2;
      }
    }
  }

  // Mirror Shard relic: first pattern triggers twice
  if (hasRelic("relic_mirror_shard") && resolvedPatterns.length > 0) {
    const first = resolvedPatterns[0];
    totalDamage += first.totalDamage;
    totalBlock += first.totalBlock;
  }

  const consumed = Array.from(cellsConsumed).map(s => {
    const [r, c] = s.split(",").map(Number);
    return [r, c] as [number, number];
  });

  return {
    patterns: resolvedPatterns,
    totalDamage,
    totalBlock,
    bonusEnergy,
    healed,
    hitAll,
    cellsConsumed: consumed,
    statusesApplied,
  };
}

function getAdjacentCells(row: number, col: number): [number, number][] {
  const adj: [number, number][] = [];
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3) adj.push([nr, nc]);
  }
  return adj;
}

// ── Combat Turn Resolution ───────────────────────────────────────────────────

export function applyWeavingToEnemies(
  enemies: Enemy[],
  result: WeavingResult,
): Enemy[] {
  let updated = enemies.map(e => ({ ...e, statuses: [...e.statuses.map(s => ({ ...s }))] }));

  // Apply statuses
  for (const { target, status } of result.statusesApplied) {
    const idx = Math.min(target, updated.length - 1);
    if (idx >= 0) {
      const existing = updated[idx].statuses.find(s => s.type === status.type);
      if (existing) {
        existing.stacks += status.stacks;
        if (status.duration > 0) existing.duration = Math.max(existing.duration, status.duration);
      } else {
        updated[idx].statuses.push({ ...status });
      }
    }
  }

  // Deal damage
  if (result.hitAll) {
    updated = updated.map(e => {
      const vuln = e.statuses.find(s => s.type === "vulnerable");
      const mult = vuln ? 1.5 : 1;
      return { ...e, hp: Math.max(0, e.hp - Math.floor(result.totalDamage * mult)) };
    });
  } else {
    // Damage first enemy
    if (updated.length > 0) {
      const vuln = updated[0].statuses.find(s => s.type === "vulnerable");
      const mult = vuln ? 1.5 : 1;
      updated[0] = { ...updated[0], hp: Math.max(0, updated[0].hp - Math.floor(result.totalDamage * mult)) };
    }
  }

  return updated;
}

export function processEnemyTurn(
  enemies: Enemy[],
  player: PlayerState,
  turnNumber: number,
): { enemies: Enemy[]; player: PlayerState } {
  let p = { ...player };
  let updatedEnemies = enemies.map(e => ({ ...e, statuses: [...e.statuses.map(s => ({ ...s }))] }));

  for (let i = 0; i < updatedEnemies.length; i++) {
    const e = updatedEnemies[i];
    if (e.hp <= 0) continue;

    // Check freeze — skip turn
    const freezeStatus = e.statuses.find(s => s.type === "freeze");
    if (freezeStatus && freezeStatus.stacks > 0) {
      freezeStatus.stacks--;
      if (freezeStatus.stacks <= 0) {
        e.statuses = e.statuses.filter(s => s.type !== "freeze");
      }
      continue; // frozen, skip
    }

    // Process poison DoT
    const poison = e.statuses.find(s => s.type === "poison");
    if (poison) {
      e.hp = Math.max(0, e.hp - poison.stacks);
      poison.stacks = Math.max(0, poison.stacks - 1);
      if (poison.stacks <= 0) e.statuses = e.statuses.filter(s => s.type !== "poison");
    }

    // Process burn DoT
    const burn = e.statuses.find(s => s.type === "burn");
    if (burn) {
      e.hp = Math.max(0, e.hp - burn.stacks);
      burn.stacks = Math.max(0, burn.stacks - 1);
      if (burn.stacks <= 0) e.statuses = e.statuses.filter(s => s.type !== "burn");
    }

    if (e.hp <= 0) continue;

    // Execute intent
    const weak = e.statuses.find(s => s.type === "weak");
    switch (e.intent.type) {
      case "attack": {
        let dmg = e.intent.value;
        if (weak) dmg = Math.floor(dmg * 0.75);
        // Apply block
        const blocked = Math.min(p.block, dmg);
        p.block -= blocked;
        dmg -= blocked;
        p.hp = Math.max(0, p.hp - dmg);
        break;
      }
      case "defend":
        // Enemy gains no visible block in our simplified model — just reduce next damage taken
        break;
      case "buff": {
        const str = e.statuses.find(s => s.type === "strength");
        if (str) {
          str.stacks += e.intent.value;
        } else {
          e.statuses.push({ type: "strength", stacks: e.intent.value, duration: -1 });
        }
        break;
      }
      case "debuff": {
        const existing = p.block; // apply weak to player indirectly through reduced damage calc
        // We'll track this via the enemy applying vulnerable
        break;
      }
    }

    // Advance intent for next turn
    updatedEnemies[i] = advanceEnemyIntent(e, turnNumber);
  }

  // Blood Pact relic: lose 1 HP per turn
  if (p.relics.some(r => r.id === "relic_blood_pact")) {
    p.hp = Math.max(0, p.hp - 1);
  }

  return { enemies: updatedEnemies, player: p };
}

// ── Run Initialization ───────────────────────────────────────────────────────

export function createNewRun(characterClass: CharacterClass, ascension: number, isDaily: boolean): RunState {
  const seed = isDaily ? getDailySeed() : Math.floor(Math.random() * 999999999);
  const deck = getStarterDeck(characterClass);
  const starterRelic = getStarterRelic(characterClass);
  const shuffled = shuffleDeck(deck, seed);

  const player: PlayerState = {
    hp: characterClass === "voidwalker" ? 65 : 70,
    maxHp: characterClass === "voidwalker" ? 65 : 70,
    block: 0,
    energy: 3,
    maxEnergy: 3,
    gold: 50,
    deck,
    hand: [],
    drawPile: shuffled,
    discardPile: [],
    relics: [starterRelic],
    characterClass,
    floor: 0,
    act: 1,
    score: 0,
    masteryXp: 0,
    ascension,
    rewindsLeft: characterClass === "chronomancer" ? 1 : 0,
    bonusEnergy: 0,
  };

  const map = generateMap(1, seed);

  return {
    player,
    map,
    combat: null,
    screen: "map",
    seed,
    isDaily,
    runesPlayed: 0,
    patternsWoven: 0,
    enemiesKilled: 0,
    elitesKilled: 0,
    bossesKilled: 0,
    damageDealt: 0,
    floorsCleared: 0,
  };
}

export function startCombat(run: RunState, nodeType: "combat" | "elite" | "boss"): RunState {
  const combatSeed = run.seed + run.player.floor * 1000 + 42;
  const enemies = spawnCombatEnemies(run.player.act, nodeType, combatSeed, run.player.ascension);

  // Apply relic effects at combat start
  let block = 0;
  if (run.player.relics.some(r => r.id === "relic_iron_skin")) block += 5;

  // Void Heart: enemies start with 3 poison
  if (run.player.relics.some(r => r.id === "relic_void_heart") || run.player.characterClass === "voidwalker") {
    for (const e of enemies) {
      e.statuses.push({ type: "poison", stacks: 3, duration: -1 });
    }
  }

  // Burning Heart: enemies start with 1 burn
  if (run.player.relics.some(r => r.id === "relic_burning_heart")) {
    for (const e of enemies) {
      e.statuses.push({ type: "burn", stacks: 1, duration: -1 });
    }
  }

  const drawCount = 5 + (run.player.relics.some(r => r.id === "relic_hourglass") ? 1 : 0);
  const { hand, drawPile } = drawCards(run.player.drawPile, run.player.discardPile, drawCount);

  return {
    ...run,
    screen: "combat",
    player: {
      ...run.player,
      block,
      energy: run.player.maxEnergy + run.player.bonusEnergy,
      bonusEnergy: 0,
      hand,
      drawPile,
      discardPile: run.player.discardPile,
      rewindsLeft: run.player.characterClass === "chronomancer" ? 1 : 0,
    },
    combat: {
      enemies,
      grid: createEmptyGrid(),
      turnNumber: 1,
      phase: "player_turn",
      weavingResult: null,
    },
  };
}

export function drawCards(
  drawPile: Rune[],
  discardPile: Rune[],
  count: number,
): { hand: Rune[]; drawPile: Rune[]; discardPile: Rune[] } {
  let dp = [...drawPile];
  let disc = [...discardPile];
  const hand: Rune[] = [];

  for (let i = 0; i < count; i++) {
    if (dp.length === 0) {
      if (disc.length === 0) break;
      dp = shuffleDeck(disc, Date.now() + i);
      disc = [];
    }
    hand.push(dp.pop()!);
  }

  return { hand, drawPile: dp, discardPile: disc };
}

export function shuffleDeck(deck: Rune[], seed: number): Rune[] {
  const rng = mulberry32(seed);
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getDailySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

// ── End of Combat ────────────────────────────────────────────────────────────

export function endCombat(run: RunState, victory: boolean): RunState {
  if (!victory) {
    // Check Phoenix Feather
    const phoenixIdx = run.player.relics.findIndex(r => r.id === "relic_phoenix_feather");
    if (phoenixIdx >= 0) {
      const newRelics = [...run.player.relics];
      newRelics.splice(phoenixIdx, 1); // consumed
      return {
        ...run,
        player: {
          ...run.player,
          hp: Math.floor(run.player.maxHp * 0.3),
          relics: newRelics,
        },
      };
    }
    return { ...run, screen: "game_over" };
  }

  const goldReward = 15 + Math.floor(Math.random() * 10);
  const healReward = run.player.relics.some(r => r.id === "relic_healing_herb") ? 3 : 0;
  const goldBonus = run.player.relics.some(r => r.id === "relic_lucky_coin") ? Math.floor(goldReward * 0.15) : 0;

  const enemiesKilled = run.combat?.enemies.filter(e => e.hp <= 0).length ?? 0;
  const elitesKilled = run.combat?.enemies.filter(e => e.hp <= 0 && e.isElite).length ?? 0;
  const bossesKilled = run.combat?.enemies.filter(e => e.hp <= 0 && e.isBoss).length ?? 0;

  // Discard hand back
  const allCards = [...run.player.hand, ...run.player.discardPile];

  return {
    ...run,
    screen: "reward",
    player: {
      ...run.player,
      gold: run.player.gold + goldReward + goldBonus,
      hp: Math.min(run.player.maxHp, run.player.hp + healReward),
      hand: [],
      discardPile: allCards,
      score: run.player.score + (enemiesKilled * 10) + (elitesKilled * 25) + (bossesKilled * 50),
      floor: run.player.floor + 1,
    },
    combat: null,
    enemiesKilled: run.enemiesKilled + enemiesKilled,
    elitesKilled: run.elitesKilled + elitesKilled,
    bossesKilled: run.bossesKilled + bossesKilled,
    floorsCleared: run.floorsCleared + 1,
  };
}

export function advanceToNextAct(run: RunState): RunState {
  const nextAct = run.player.act + 1;
  if (nextAct > 3) {
    return { ...run, screen: "victory" };
  }
  const map = generateMap(nextAct, run.seed + nextAct * 10000);
  return {
    ...run,
    player: { ...run.player, act: nextAct, floor: 0 },
    map,
    screen: "map",
  };
}

// ── Shop ─────────────────────────────────────────────────────────────────────

export function generateShop(run: RunState): ShopItem[] {
  const seed = run.seed + run.player.floor * 777;
  const runes = getRuneRewards(run.player.act, 3, seed);
  const relics = getShopRelics(seed + 1, run.player.relics.map(r => r.id));
  const items: ShopItem[] = [];

  for (const rune of runes) {
    const price = rune.rarity === "common" ? 30 : rune.rarity === "uncommon" ? 60 : 100;
    items.push({ rune, price, sold: false, type: "rune" });
  }
  for (const relic of relics) {
    const price = relic.rarity === "common" ? 80 : 120;
    items.push({ relic, price, sold: false, type: "relic" });
  }
  items.push({ price: 50, sold: false, type: "remove_rune" });

  return items;
}

// ── Meta Progression ─────────────────────────────────────────────────────────

const META_KEY = "sigil_meta";

export function loadMeta(): MetaProgress {
  if (typeof window === "undefined") return defaultMeta();
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return defaultMeta();
}

export function saveMeta(meta: MetaProgress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch { /* ignore */ }
}

function defaultMeta(): MetaProgress {
  return {
    totalRuns: 0,
    totalWins: 0,
    highestScore: 0,
    highestFloor: 0,
    masteryXp: 0,
    unlockedClasses: ["pyromancer"],
    unlockedAscension: 0,
    codexRunes: [],
    codexRelics: [],
    codexEnemies: [],
    dailyBestScore: 0,
    dailyLastPlayed: "",
  };
}

export function updateMetaAfterRun(meta: MetaProgress, run: RunState, won: boolean): MetaProgress {
  const updated = { ...meta };
  updated.totalRuns++;
  if (won) updated.totalWins++;
  updated.highestScore = Math.max(updated.highestScore, run.player.score);
  updated.highestFloor = Math.max(updated.highestFloor, run.floorsCleared);
  updated.masteryXp += run.player.score;

  // Unlock classes based on wins
  if (updated.totalWins >= 1 && !updated.unlockedClasses.includes("chronomancer")) {
    updated.unlockedClasses.push("chronomancer");
  }
  if (updated.totalWins >= 3 && !updated.unlockedClasses.includes("voidwalker")) {
    updated.unlockedClasses.push("voidwalker");
  }
  if (updated.totalWins >= 5 && !updated.unlockedClasses.includes("stormcaller")) {
    updated.unlockedClasses.push("stormcaller");
  }
  if (won) {
    updated.unlockedAscension = Math.min(20, updated.unlockedAscension + 1);
  }

  return updated;
}
