// Core game engine for Wordslay — state machine managing all game flow

import type {
  GameState,
  GamePhase,
  PlayerState,
  RunStats,
  CombatState,
  EnemyState,
  LetterTile,
  WordResult,
  RewardChoice,
  ShopItem,
  MetaProgress,
  ActId,
} from "@/types/wordslay";
import {
  generateFloor,
  getAvailableNodes,
  getActForFloor,
  isBossFloor,
  advanceFloor,
  getRandomEvent,
  seededRandom,
  dateToSeed,
} from "./dungeon-gen";
import {
  generatePlayableTiles,
  DEFAULT_TILE_COUNT,
  removeTile,
  curseTile,
  scrambleTiles,
  resetTileIds,
} from "./tiles";
import { calculateWordResult } from "./word-scoring";
import { isValidEnglishWord } from "@/lib/dictionary";
import {
  getEncounter,
  getBoss,
  rollEnemyIntent,
  executeEnemyTurn,
  applyDamageToEnemy,
  type EnemyTurnResult,
} from "./enemies";
import {
  getRewardRelics,
  getRelicDef,
  getPotionDef,
  getShopRelics,
  getShopPotions,
  RELIC_DEFS,
} from "./relics";

// ── Constants ───────────────────────────────────────────────────────────────

const META_KEY = "wordslay-meta";
const DAILY_KEY_PREFIX = "wordslay-daily-";
const STARTING_HP = 80;
const STARTING_GOLD = 0;
const MAX_POTIONS = 3;
const REST_HEAL_PERCENT = 0.3;

// ── Engine ──────────────────────────────────────────────────────────────────

export class LexiconQuestEngine {
  state: GameState;
  rng: () => number;
  onStateChange?: () => void;
  private lastWord: string = "";
  private powerPotionActive: boolean = false;
  private hastePotionActive: boolean = false;
  private phoenixUsed: boolean = false;

  constructor() {
    this.rng = seededRandom(Date.now());
    this.state = this.createInitialState(0, false);
  }

  private createInitialState(seed: number, isDaily: boolean): GameState {
    return {
      phase: "menu",
      player: {
        hp: STARTING_HP,
        maxHp: STARTING_HP,
        gold: STARTING_GOLD,
        attackMult: 1.0,
        defense: 0,
        relics: [],
        potions: [],
        maxPotions: MAX_POTIONS,
      },
      stats: {
        totalDamage: 0,
        longestWord: "",
        highestWordDamage: 0,
        wordsFormed: 0,
        floorsCleared: 0,
        enemiesKilled: 0,
        goldEarned: 0,
        score: 0,
      },
      currentFloor: { nodes: [], act: "crypt", floor: 1 },
      act: "crypt",
      floor: 1,
      seed,
      combat: null,
      rewards: null,
      shop: null,
      event: null,
      currentNodeId: null,
      isDailyRun: isDaily,
    };
  }

  private emit() {
    this.onStateChange?.();
  }

  // ── New Game ────────────────────────────────────────────────────────────

  newRun(seed?: number) {
    const s = seed ?? Math.floor(Math.random() * 2147483647);
    this.rng = seededRandom(s);
    resetTileIds();
    this.state = this.createInitialState(s, false);
    this.lastWord = "";
    this.powerPotionActive = false;
    this.hastePotionActive = false;
    this.phoenixUsed = false;
    this.applyPassiveRelics();
    this.state.currentFloor = generateFloor(1, this.rng);
    this.state.phase = "map";
    this.emit();
  }

  newDailyRun(dateStr: string) {
    const seed = dateToSeed(dateStr);
    this.rng = seededRandom(seed);
    resetTileIds();
    this.state = this.createInitialState(seed, true);
    this.lastWord = "";
    this.powerPotionActive = false;
    this.hastePotionActive = false;
    this.phoenixUsed = false;
    this.state.currentFloor = generateFloor(1, this.rng);
    this.state.phase = "map";
    this.emit();
  }

  // ── Map Navigation ──────────────────────────────────────────────────────

  selectNode(nodeId: string) {
    const node = this.state.currentFloor.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const available = getAvailableNodes(
      this.state.currentFloor,
      this.state.currentNodeId,
    );
    if (!available.some((n) => n.id === nodeId)) return;

    node.visited = true;
    this.state.currentNodeId = nodeId;

    switch (node.type) {
      case "combat":
        this.startCombat(
          getEncounter(this.state.act, this.state.floor, false, this.rng),
        );
        break;
      case "elite":
        this.startCombat(
          getEncounter(this.state.act, this.state.floor, true, this.rng),
        );
        break;
      case "boss":
        this.startCombat([getBoss(this.state.act, this.state.floor)]);
        break;
      case "shop":
        this.openShop();
        break;
      case "rest":
        this.state.phase = "rest";
        break;
      case "event":
        this.state.event = getRandomEvent(this.rng);
        this.state.phase = "event";
        break;
      case "treasure":
        this.openTreasure();
        break;
    }

    this.emit();
  }

  // ── Combat ──────────────────────────────────────────────────────────────

  private startCombat(enemies: EnemyState[]) {
    const tileCount = this.getTileCount();
    const tiles = generatePlayableTiles(
      this.rng,
      tileCount,
      this.state.floor,
      this.state.player.relics,
    );

    // Lexicon Crown: all golden on first turn
    if (this.state.player.relics.includes("lexicon-crown")) {
      for (const tile of tiles) {
        if (tile.modifier === "normal") tile.modifier = "golden";
      }
    }

    // Roll initial intents
    for (const enemy of enemies) {
      enemy.intent = rollEnemyIntent(enemy, 1, this.rng);
    }

    this.state.combat = {
      enemies,
      tiles,
      selectedTileIds: [],
      turnCount: 1,
      playerShield: 0,
      wordsThisCombat: [],
    };
    this.state.phase = "combat";
    this.powerPotionActive = false;
    this.hastePotionActive = false;
  }

  private getTileCount(): number {
    let count = DEFAULT_TILE_COUNT;
    if (this.state.player.relics.includes("infinite-ink")) count += 1;
    return count;
  }

  // ── Tile Selection ──────────────────────────────────────────────────────

  selectTile(tileId: number) {
    if (!this.state.combat) return;
    if (this.state.combat.selectedTileIds.includes(tileId)) return;
    this.state.combat.selectedTileIds.push(tileId);
    this.emit();
  }

  deselectTile(tileId: number) {
    if (!this.state.combat) return;
    this.state.combat.selectedTileIds = this.state.combat.selectedTileIds.filter(
      (id) => id !== tileId,
    );
    this.emit();
  }

  clearSelection() {
    if (!this.state.combat) return;
    this.state.combat.selectedTileIds = [];
    this.emit();
  }

  getSelectedWord(): string {
    if (!this.state.combat) return "";
    return this.state.combat.selectedTileIds
      .map((id) => this.state.combat!.tiles.find((t) => t.id === id))
      .filter((t): t is LetterTile => t !== undefined)
      .map((t) => t.modifier === "wildcard" && t.assignedLetter ? t.assignedLetter : t.letter)
      .join("");
  }

  /** Assign a letter to a wildcard tile. */
  assignWildcard(tileId: number, letter: string) {
    if (!this.state.combat) return;
    const tile = this.state.combat.tiles.find((t) => t.id === tileId);
    if (tile && tile.modifier === "wildcard") {
      tile.assignedLetter = letter.toUpperCase();
      this.emit();
    }
  }

  // ── Submit Word ─────────────────────────────────────────────────────────

  submitWord(): {
    result: WordResult | null;
    enemyResults: EnemyTurnResult[];
    error: string | null;
  } {
    if (!this.state.combat) return { result: null, enemyResults: [], error: "Not in combat" };

    const word = this.getSelectedWord();
    if (word.length < 3) return { result: null, enemyResults: [], error: "Word must be at least 3 letters" };

    // Validate: word must contain only letters (no unresolved wildcards)
    if (/[^A-Za-z]/.test(word)) {
      return { result: null, enemyResults: [], error: "Assign a letter to each wildcard tile" };
    }

    if (!isValidEnglishWord(word.toLowerCase())) {
      return { result: null, enemyResults: [], error: "Not a valid word" };
    }

    // Check if word was already used this combat
    if (this.state.combat.wordsThisCombat.includes(word.toUpperCase())) {
      return { result: null, enemyResults: [], error: "Word already used this combat" };
    }

    // Calculate damage
    let attackMult = this.state.player.attackMult;
    if (this.powerPotionActive) {
      attackMult *= 2;
      this.powerPotionActive = false;
    }

    // Thesaurus relic bonus
    if (
      this.state.player.relics.includes("thesaurus") &&
      this.lastWord &&
      word[0].toUpperCase() === this.lastWord[0].toUpperCase()
    ) {
      attackMult += 0.3;
    }

    const result = calculateWordResult(
      word,
      this.state.combat.selectedTileIds,
      this.state.combat.tiles,
      this.state.player.relics,
      attackMult,
    );

    // Apply damage to first alive enemy (or all if AoE via allVowelsUsed)
    const aliveEnemies = this.state.combat.enemies.filter((e) => e.hp > 0);
    let totalReflected = 0;
    let dodged = false;

    if (result.allVowelsUsed) {
      // AoE: damage all enemies
      for (const enemy of aliveEnemies) {
        const dmgResult = applyDamageToEnemy(
          enemy,
          result.totalDamage,
          word.length,
        );
        totalReflected += dmgResult.reflected;
        if (dmgResult.dodged) dodged = true;
      }
    } else if (aliveEnemies.length > 0) {
      const dmgResult = applyDamageToEnemy(
        aliveEnemies[0],
        result.totalDamage,
        word.length,
      );
      totalReflected = dmgResult.reflected;
      dodged = dmgResult.dodged;
    }

    // Apply reflect damage to player
    if (totalReflected > 0) {
      this.applyPlayerDamage(totalReflected);
    }

    // Update stats
    this.state.stats.totalDamage += result.totalDamage;
    this.state.stats.wordsFormed++;
    if (word.length > this.state.stats.longestWord.length) {
      this.state.stats.longestWord = word;
    }
    if (result.totalDamage > this.state.stats.highestWordDamage) {
      this.state.stats.highestWordDamage = result.totalDamage;
    }

    // Relic: Vampiric Tome heals 1 HP per word
    if (this.state.player.relics.includes("vampiric-tome")) {
      this.state.player.hp = Math.min(
        this.state.player.maxHp,
        this.state.player.hp + 1,
      );
    }

    // Relic: Healing Herb heals 2 HP for 6+ letter words
    if (this.state.player.relics.includes("healing-herb") && word.length >= 6) {
      this.state.player.hp = Math.min(
        this.state.player.maxHp,
        this.state.player.hp + 2,
      );
    }

    // Palindrome heals 3 HP
    if (result.isPalindrome) {
      this.state.player.hp = Math.min(
        this.state.player.maxHp,
        this.state.player.hp + 3,
      );
    }

    // Track word
    this.state.combat.wordsThisCombat.push(word.toUpperCase());
    this.lastWord = word;

    // Remove used tiles and generate new ones
    const usedIds = new Set(this.state.combat.selectedTileIds);
    this.state.combat.tiles = this.state.combat.tiles.filter(
      (t) => !usedIds.has(t.id),
    );

    // Generate replacement tiles — rack-aware to maintain healthy letter balance
    const needed = this.getTileCount() - this.state.combat.tiles.length;
    if (needed > 0) {
      const newTiles = generatePlayableTiles(
        this.rng,
        needed,
        this.state.floor,
        this.state.player.relics,
        this.state.combat.tiles,
      );
      this.state.combat.tiles.push(...newTiles);
    }

    this.state.combat.selectedTileIds = [];

    // Check if all enemies dead
    const allDead = this.state.combat.enemies.every((e) => e.hp <= 0);

    let enemyResults: EnemyTurnResult[] = [];

    if (allDead) {
      this.state.stats.enemiesKilled += this.state.combat.enemies.length;
      this.onCombatWin();
    } else if (!this.hastePotionActive) {
      // Enemy turn
      enemyResults = this.executeEnemyTurns();
    } else {
      this.hastePotionActive = false;
    }

    this.state.stats.score = this.calculateScore();
    this.emit();
    return { result, enemyResults, error: null, dodged };
  }

  // ── Enemy Turn ──────────────────────────────────────────────────────────

  private executeEnemyTurns(): EnemyTurnResult[] {
    if (!this.state.combat) return [];

    const results: EnemyTurnResult[] = [];
    const aliveEnemies = this.state.combat.enemies.filter((e) => e.hp > 0);

    for (const enemy of aliveEnemies) {
      const result = executeEnemyTurn(enemy, this.state.combat.turnCount);
      results.push(result);

      // Apply damage to player
      if (result.damage > 0) {
        this.applyPlayerDamage(result.damage);
      }

      // Tile effects
      if (result.tileStolen && this.state.combat.tiles.length > 1) {
        const idx = Math.floor(this.rng() * this.state.combat.tiles.length);
        this.state.combat.tiles = removeTile(
          this.state.combat.tiles,
          this.state.combat.tiles[idx].id,
        );
      }

      if (result.tileBurned && this.state.combat.tiles.length > 1) {
        const idx = Math.floor(this.rng() * this.state.combat.tiles.length);
        this.state.combat.tiles = removeTile(
          this.state.combat.tiles,
          this.state.combat.tiles[idx].id,
        );
      }

      if (result.tilesCursed > 0) {
        for (let i = 0; i < result.tilesCursed; i++) {
          this.state.combat.tiles = curseTile(this.state.combat.tiles, this.rng);
        }
      }

      if (result.tilesScrambled) {
        this.state.combat.tiles = scrambleTiles(
          this.state.combat.tiles,
          this.rng,
        );
      }

      if (result.letterBanned) {
        enemy.bannedLetter = result.letterBanned;
      }
    }

    // Advance turn
    this.state.combat.turnCount++;

    // Roll new intents for next turn
    for (const enemy of aliveEnemies) {
      if (enemy.hp > 0) {
        enemy.intent = rollEnemyIntent(
          enemy,
          this.state.combat.turnCount,
          this.rng,
        );
      }
    }

    // Check player death
    if (this.state.player.hp <= 0) {
      this.onPlayerDeath();
    }

    // Replenish tiles if needed — rack-aware
    const needed = this.getTileCount() - this.state.combat.tiles.length;
    if (needed > 0 && this.state.player.hp > 0) {
      const newTiles = generatePlayableTiles(
        this.rng,
        needed,
        this.state.floor,
        this.state.player.relics,
        this.state.combat.tiles,
      );
      this.state.combat.tiles.push(...newTiles);
    }

    return results;
  }

  private applyPlayerDamage(damage: number) {
    let reduced = damage;

    // Player defense
    reduced = Math.max(0, reduced - this.state.player.defense);

    // Thick Skin relic
    if (this.state.player.relics.includes("thick-skin")) {
      reduced = Math.max(0, reduced - 1);
    }

    // Combat shield
    if (this.state.combat && this.state.combat.playerShield > 0) {
      const absorbed = Math.min(this.state.combat.playerShield, reduced);
      this.state.combat.playerShield -= absorbed;
      reduced -= absorbed;
    }

    this.state.player.hp -= reduced;
  }

  // ── Combat End ──────────────────────────────────────────────────────────

  private onCombatWin() {
    // Gold reward
    const goldBase = 8 + this.state.floor * 3;
    const goldBonus = this.state.player.relics.includes("lucky-penny") ? 5 : 0;
    const gold = goldBase + Math.floor(this.rng() * 10) + goldBonus;
    this.state.player.gold += gold;
    this.state.stats.goldEarned += gold;

    // Sturdy Boots: heal 3 HP after combat
    if (this.state.player.relics.includes("sturdy-boots")) {
      this.state.player.hp = Math.min(
        this.state.player.maxHp,
        this.state.player.hp + 3,
      );
    }

    // Check if this was the last node (boss or treasure at end of floor)
    const currentNode = this.state.currentFloor.nodes.find(
      (n) => n.id === this.state.currentNodeId,
    );

    if (currentNode?.type === "boss") {
      // Floor complete, advance
      this.state.stats.floorsCleared++;
      const next = advanceFloor(this.state.floor);
      if (next === "victory") {
        this.state.phase = "victory";
        this.saveMeta();
        return;
      }
      // Show rewards first, then advance
      this.generateRewards(true);
      return;
    }

    // Generate rewards
    const isElite = currentNode?.type === "elite";
    this.generateRewards(isElite);
  }

  private generateRewards(isEliteOrBoss: boolean) {
    const relics = getRewardRelics(
      this.rng,
      this.state.player.relics,
      3,
      isEliteOrBoss,
    );

    const rewards: RewardChoice[] = relics.map((r) => ({
      type: "relic" as const,
      relicId: r.id,
    }));

    // Add gold option
    rewards.push({
      type: "gold",
      amount: 15 + Math.floor(this.rng() * 20),
    });

    // Add max HP option for boss
    if (isEliteOrBoss) {
      rewards.push({
        type: "maxHp",
        amount: 8,
      });
    }

    this.state.rewards = rewards;
    this.state.phase = "reward";
  }

  // ── Rewards ─────────────────────────────────────────────────────────────

  chooseReward(index: number) {
    if (!this.state.rewards || index >= this.state.rewards.length) return;

    const reward = this.state.rewards[index];
    switch (reward.type) {
      case "relic":
        if (reward.relicId) {
          this.state.player.relics.push(reward.relicId);
          this.applyPassiveRelics();
        }
        break;
      case "potion":
        if (
          reward.potionId &&
          this.state.player.potions.length < this.state.player.maxPotions
        ) {
          this.state.player.potions.push(reward.potionId);
        }
        break;
      case "gold":
        this.state.player.gold += reward.amount ?? 0;
        this.state.stats.goldEarned += reward.amount ?? 0;
        break;
      case "maxHp":
        this.state.player.maxHp += reward.amount ?? 0;
        this.state.player.hp += reward.amount ?? 0;
        break;
    }

    this.state.rewards = null;
    this.afterNodeComplete();
    this.emit();
  }

  skipReward() {
    this.state.rewards = null;
    this.afterNodeComplete();
    this.emit();
  }

  private afterNodeComplete() {
    // Check if we need to advance floor
    const currentNode = this.state.currentFloor.nodes.find(
      (n) => n.id === this.state.currentNodeId,
    );

    if (currentNode?.type === "boss") {
      const next = advanceFloor(this.state.floor);
      if (next === "victory") {
        this.state.phase = "victory";
        this.saveMeta();
        return;
      }
      this.state.floor = next.floor;
      this.state.act = next.act;
      this.state.currentFloor = generateFloor(next.floor, this.rng);
      this.state.currentNodeId = null;
      this.state.stats.floorsCleared++;
    }

    // Check if there are more nodes to visit
    const available = getAvailableNodes(
      this.state.currentFloor,
      this.state.currentNodeId,
    );

    if (available.length === 0 && !isBossFloor(this.state.floor)) {
      // Advance to next floor
      const next = advanceFloor(this.state.floor);
      if (next === "victory") {
        this.state.phase = "victory";
        this.saveMeta();
        return;
      }
      this.state.floor = next.floor;
      this.state.act = next.act;
      this.state.currentFloor = generateFloor(next.floor, this.rng);
      this.state.currentNodeId = null;
      this.state.stats.floorsCleared++;
    }

    this.state.combat = null;
    this.state.phase = "map";
  }

  // ── Shop ────────────────────────────────────────────────────────────────

  private openShop() {
    const relicOffers = getShopRelics(this.rng, this.state.player.relics, 3);
    const potionOffers = getShopPotions(this.rng, 2);

    const items: ShopItem[] = [
      ...relicOffers.map((r) => ({
        type: "relic" as const,
        id: r.relic.id,
        price: r.price,
        sold: false,
      })),
      ...potionOffers.map((p) => ({
        type: "potion" as const,
        id: p.potion.id,
        price: p.price,
        sold: false,
      })),
      {
        type: "heal" as const,
        price: 20,
        sold: false,
      },
    ];

    this.state.shop = items;
    this.state.phase = "shop";
  }

  buyShopItem(index: number): boolean {
    if (!this.state.shop || index >= this.state.shop.length) return false;

    const item = this.state.shop[index];
    if (item.sold || this.state.player.gold < item.price) return false;

    switch (item.type) {
      case "relic":
        if (item.id) this.state.player.relics.push(item.id);
        this.applyPassiveRelics();
        break;
      case "potion":
        if (
          item.id &&
          this.state.player.potions.length < this.state.player.maxPotions
        ) {
          this.state.player.potions.push(item.id);
        } else {
          return false;
        }
        break;
      case "heal":
        this.state.player.hp = Math.min(
          this.state.player.maxHp,
          this.state.player.hp + 25,
        );
        break;
    }

    this.state.player.gold -= item.price;
    item.sold = true;
    this.emit();
    return true;
  }

  leaveShop() {
    this.state.shop = null;
    this.afterNodeComplete();
    this.emit();
  }

  // ── Rest ────────────────────────────────────────────────────────────────

  rest() {
    const heal = Math.round(this.state.player.maxHp * REST_HEAL_PERCENT);
    this.state.player.hp = Math.min(
      this.state.player.maxHp,
      this.state.player.hp + heal,
    );
    this.afterNodeComplete();
    this.emit();
  }

  restUpgrade() {
    // +5 max HP
    this.state.player.maxHp += 5;
    this.state.player.hp += 5;
    this.afterNodeComplete();
    this.emit();
  }

  // ── Events ──────────────────────────────────────────────────────────────

  chooseEventOption(index: number) {
    if (!this.state.event || index >= this.state.event.options.length) return;

    const option = this.state.event.options[index];
    const effect = option.effect;

    switch (effect.type) {
      case "heal":
        this.state.player.hp = Math.min(
          this.state.player.maxHp,
          this.state.player.hp + effect.value,
        );
        break;
      case "damage":
        this.state.player.hp -= Math.abs(effect.value);
        break;
      case "gold":
        if (effect.value > 0) {
          this.state.player.gold += effect.value;
          this.state.stats.goldEarned += effect.value;
        } else if (effect.value < 0) {
          this.state.player.gold = Math.max(
            0,
            this.state.player.gold + effect.value,
          );
        }
        break;
      case "relic":
        {
          // Sacrifice HP for relic
          this.state.player.hp += effect.value; // value is negative
          const relics = getRewardRelics(
            this.rng,
            this.state.player.relics,
            1,
            false,
          );
          if (relics.length > 0) {
            this.state.player.relics.push(relics[0].id);
            this.applyPassiveRelics();
          }
        }
        break;
      case "potion":
        if (effect.value < 0) {
          this.state.player.gold = Math.max(
            0,
            this.state.player.gold + effect.value,
          );
        }
        if (
          this.state.player.potions.length < this.state.player.maxPotions
        ) {
          const potionId = effect.potionId ?? "health-potion";
          this.state.player.potions.push(potionId);
        }
        break;
      case "maxHp":
        this.state.player.maxHp += effect.value;
        this.state.player.hp += effect.value;
        break;
      case "tiles":
        // Attack multiplier boost
        this.state.player.attackMult += effect.value / 100;
        break;
    }

    if (this.state.player.hp <= 0) {
      this.onPlayerDeath();
    } else {
      this.state.event = null;
      this.afterNodeComplete();
    }
    this.emit();
  }

  // ── Treasure ────────────────────────────────────────────────────────────

  private openTreasure() {
    const gold = 20 + Math.floor(this.rng() * 30);
    this.state.player.gold += gold;
    this.state.stats.goldEarned += gold;

    // Also give a potion if room
    if (
      this.state.player.potions.length < this.state.player.maxPotions &&
      this.rng() < 0.6
    ) {
      const potions = ["health-potion", "power-potion", "shield-potion", "clarity-potion"];
      const pick = potions[Math.floor(this.rng() * potions.length)];
      this.state.player.potions.push(pick);
    }

    this.afterNodeComplete();
  }

  // ── Potions ─────────────────────────────────────────────────────────────

  usePotion(index: number): boolean {
    if (index >= this.state.player.potions.length) return false;
    if (this.state.phase !== "combat" || !this.state.combat) return false;

    const potionId = this.state.player.potions[index];
    const potion = getPotionDef(potionId);
    if (!potion) return false;

    switch (potion.id) {
      case "health-potion":
        this.state.player.hp = Math.min(
          this.state.player.maxHp,
          this.state.player.hp + 20,
        );
        break;
      case "power-potion":
        this.powerPotionActive = true;
        break;
      case "clarity-potion":
        this.state.combat.tiles = generatePlayableTiles(
          this.rng,
          this.getTileCount(),
          this.state.floor,
          this.state.player.relics,
        );
        this.state.combat.selectedTileIds = [];
        break;
      case "shield-potion":
        this.state.combat.playerShield += 15;
        break;
      case "golden-ink":
        {
          let made = 0;
          for (const tile of this.state.combat.tiles) {
            if (tile.modifier === "normal" && made < 3) {
              tile.modifier = "golden";
              made++;
            }
          }
        }
        break;
      case "wildcard-elixir":
        for (let i = 0; i < 2; i++) {
          this.state.combat.tiles.push({
            id: Date.now() + i,
            letter: "?",
            value: 0,
            modifier: "wildcard",
          });
        }
        break;
      case "haste-potion":
        this.hastePotionActive = true;
        break;
      case "antidote":
        this.state.combat.tiles = this.state.combat.tiles.map((t) =>
          t.modifier === "cursed" || t.modifier === "frozen"
            ? { ...t, modifier: "normal" as const }
            : t,
        );
        break;
    }

    // Remove used potion
    this.state.player.potions.splice(index, 1);
    this.emit();
    return true;
  }

  // ── Death ───────────────────────────────────────────────────────────────

  private onPlayerDeath() {
    // Phoenix Feather check
    if (
      this.state.player.relics.includes("phoenix-feather") &&
      !this.phoenixUsed
    ) {
      this.phoenixUsed = true;
      this.state.player.hp = Math.round(this.state.player.maxHp * 0.5);
      return;
    }

    this.state.phase = "gameover";
    this.state.stats.score = this.calculateScore();
    this.saveMeta();
  }

  // ── Passive Relics ──────────────────────────────────────────────────────

  private applyPassiveRelics() {
    const p = this.state.player;

    // Iron Ring: +8 max HP
    if (p.relics.includes("iron-ring") && p.maxHp === STARTING_HP) {
      p.maxHp += 8;
      p.hp += 8;
    }

    // Dragon Scale: +3 defense
    if (p.relics.includes("dragon-scale")) {
      p.defense = 3;
    }

    // War Drum: +10% attack
    if (p.relics.includes("war-drum")) {
      p.attackMult = Math.max(p.attackMult, 1.1);
    }
  }

  // ── Score ───────────────────────────────────────────────────────────────

  private calculateScore(): number {
    const s = this.state.stats;
    return (
      s.totalDamage +
      s.floorsCleared * 100 +
      s.enemiesKilled * 25 +
      s.wordsFormed * 5 +
      (s.longestWord.length * 20) +
      s.goldEarned
    );
  }

  // ── Share Text ──────────────────────────────────────────────────────────

  getShareText(): string {
    const s = this.state.stats;
    const won = this.state.phase === "victory";
    const header = this.state.isDailyRun
      ? `Wordslay Daily 🗡️`
      : `Wordslay 🗡️`;

    const lines = [
      header,
      won ? "🏆 VICTORY!" : `💀 Floor ${this.state.floor}`,
      `⚔️ Score: ${s.score}`,
      `📝 Words: ${s.wordsFormed} | Best: ${s.longestWord.toUpperCase() || "—"}`,
      `💥 Damage: ${s.totalDamage} | 👹 Kills: ${s.enemiesKilled}`,
      "",
      "gamesite.app/arcade/wordslay",
    ];

    return lines.join("\n");
  }

  // ── Meta Progression ────────────────────────────────────────────────────

  saveMeta() {
    try {
      const meta = this.loadMeta();
      meta.totalRuns++;
      if (this.state.floor > meta.bestFloor) meta.bestFloor = this.state.floor;
      if (this.state.stats.score > meta.bestScore)
        meta.bestScore = this.state.stats.score;
      if (
        this.state.stats.longestWord.length >
        (meta.longestWord?.length ?? 0)
      )
        meta.longestWord = this.state.stats.longestWord;
      if (this.state.stats.highestWordDamage > meta.highestDamage)
        meta.highestDamage = this.state.stats.highestWordDamage;
      meta.enemiesDefeated += this.state.stats.enemiesKilled;

      if (this.state.isDailyRun) {
        const today = new Date().toISOString().split("T")[0];
        meta.dailyHistory[today] = {
          score: this.state.stats.score,
          floor: this.state.floor,
        };
      }

      localStorage.setItem(META_KEY, JSON.stringify(meta));
    } catch { /* localStorage not available */ }
  }

  loadMeta(): MetaProgress {
    try {
      const raw = localStorage.getItem(META_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* */ }
    return {
      totalRuns: 0,
      bestFloor: 0,
      bestScore: 0,
      longestWord: "",
      highestDamage: 0,
      enemiesDefeated: 0,
      dailyHistory: {},
    };
  }

  isDailyCompleted(dateStr: string): boolean {
    const meta = this.loadMeta();
    return dateStr in meta.dailyHistory;
  }
}
