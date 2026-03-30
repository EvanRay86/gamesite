// Core game engine for Netherveil — state machine managing all game flow

import type {
  GameState,
  GamePhase,
  PlayerState,
  RunStats,
  CombatState,
  CardInstance,
  RewardSet,
  ShopItem,
  MetaProgress,
  ActId,
  ClassId,
  GameEvent,
  ActiveStatus,
} from "@/types/netherveil";
import { ACT_CONFIG } from "@/types/netherveil";
import { getClassDef } from "./classes";
import { createCardInstance, getCardDef, getEnergyCost, pickRewardCards, getEffects } from "./cards";
import {
  initCombat,
  resolveCard,
  processEnemyTurn,
  startPlayerTurn,
  drawCards,
  isCombatWon,
  isPlayerDead,
  getValidTargets,
  getAllEnemies,
  applyStatus,
  tickPlayerStatuses,
  STARTING_ENERGY,
  HAND_SIZE,
} from "./combat";
import {
  generateFloor,
  getAvailableNodes,
  getNode,
  getActForFloor,
  isBossFloor,
  advanceFloor,
  getRandomEvent,
} from "./map-gen";
import { getRelicDef, getRewardRelic, getBossRelic, getShopRelics } from "./relics";
import { seededRandom, dateToSeed, shuffle, uid } from "./seed";

// ── Constants ───────────────────────────────────────────────────────────────

const META_KEY = "netherveil-meta";
const STARTING_HP = 75;
const STARTING_GOLD = 50;
const REST_HEAL_PERCENT = 0.3;
const GOLD_PER_COMBAT = 15;
const GOLD_PER_ELITE = 30;
const GOLD_PER_BOSS = 50;
const SCORE_PER_KILL = 10;
const SCORE_PER_ELITE = 25;
const SCORE_PER_BOSS = 100;
const SCORE_PER_FLOOR = 5;

// ── Engine ──────────────────────────────────────────────────────────────────

export class NetherveilEngine {
  state: GameState;
  rng: () => number;
  onStateChange?: () => void;
  private encounterType: "combat" | "elite" | "boss" = "combat";
  private firstCardThisTurn = true;

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
        classId: "voidwalker",
        deck: [],
        relics: [],
      },
      stats: {
        totalDamage: 0,
        cardsPlayed: 0,
        enemiesKilled: 0,
        elitesKilled: 0,
        bossesKilled: 0,
        floorsCleared: 0,
        goldEarned: 0,
        highestSingleHit: 0,
        score: 0,
      },
      currentFloor: null,
      act: "wastes",
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

  // ── Run Lifecycle ─────────────────────────────────────────────────────

  newRun(classId: ClassId) {
    const seed = Date.now();
    this.rng = seededRandom(seed);
    this.state = this.createInitialState(seed, false);
    this.setupClass(classId);
    this.state.phase = "map";
    this.state.currentFloor = generateFloor(1, seed);
    this.state.currentNodeId = null;
    this.emit();
  }

  newDailyRun(classId: ClassId) {
    const today = new Date().toISOString().slice(0, 10);
    const seed = dateToSeed(today);
    this.rng = seededRandom(seed);
    this.state = this.createInitialState(seed, true);
    this.setupClass(classId);
    this.state.phase = "map";
    this.state.currentFloor = generateFloor(1, seed);
    this.state.currentNodeId = null;
    this.emit();
  }

  private setupClass(classId: ClassId) {
    const classDef = getClassDef(classId);
    this.state.player.classId = classId;
    this.state.player.deck = classDef.starterDeckIds.map((id) =>
      createCardInstance(id),
    );
    this.state.player.relics = [classDef.startingRelicId];

    // Apply passive relics
    if (this.state.player.relics.includes("sturdy_boots")) {
      this.state.player.maxHp += 5;
      this.state.player.hp += 5;
    }
  }

  goToClassSelect() {
    this.state.phase = "class_select";
    this.emit();
  }

  // ── Map Navigation ────────────────────────────────────────────────────

  selectMapNode(nodeId: string) {
    if (this.state.phase !== "map" || !this.state.currentFloor) return;

    const node = getNode(this.state.currentFloor, nodeId);
    if (!node) return;

    // Validate node is reachable
    const available = getAvailableNodes(
      this.state.currentFloor,
      this.state.currentNodeId,
    );
    if (!available.find((n) => n.id === nodeId)) return;

    node.visited = true;
    this.state.currentNodeId = nodeId;

    switch (node.type) {
      case "combat":
        this.encounterType = "combat";
        this.startCombat("combat");
        break;
      case "elite":
        this.encounterType = "elite";
        this.startCombat("elite");
        break;
      case "boss":
        this.encounterType = "boss";
        this.startCombat("boss");
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
      case "echo":
        // For now, treat echo nodes as elite encounters
        this.encounterType = "elite";
        this.startCombat("elite");
        break;
    }

    this.emit();
  }

  // ── Combat ────────────────────────────────────────────────────────────

  private startCombat(type: "combat" | "elite" | "boss") {
    this.state.combat = initCombat(
      this.state.player.deck,
      this.state.act,
      this.state.floor,
      type,
      this.rng,
    );
    this.state.phase = "combat";
    this.firstCardThisTurn = true;

    // Apply combat-start relics
    this.applyCombatStartRelics();
  }

  private applyCombatStartRelics() {
    const combat = this.state.combat!;
    const relics = this.state.player.relics;

    if (relics.includes("iron_ring")) {
      applyStatus(combat.playerStatuses, "shield", 3, -1);
    }
    if (relics.includes("woven_ward")) {
      applyStatus(combat.playerStatuses, "shield", 5, -1);
    }
    if (relics.includes("shadow_cloak")) {
      applyStatus(combat.playerStatuses, "stealth", 1, 1);
    }
    if (relics.includes("void_crystal")) {
      applyStatus(combat.playerStatuses, "void_charges", 1, -1);
    }
    if (relics.includes("ember_heart")) {
      applyStatus(combat.playerStatuses, "ember_stacks", 1, -1);
    }
    if (relics.includes("thorned_armor")) {
      applyStatus(combat.playerStatuses, "thorns", 1, -1);
    }
    if (relics.includes("mana_prism")) {
      combat.energy += 1;
      combat.maxEnergy += 1;
    }
    if (relics.includes("void_crown")) {
      combat.energy += 2;
      combat.maxEnergy += 1;
    }
    if (relics.includes("quick_draw")) {
      const drawn = drawCards(combat, 1, this.rng);
      combat.hand.push(...drawn);
    }
  }

  selectCard(instanceId: string) {
    if (this.state.phase !== "combat" || !this.state.combat) return;
    const combat = this.state.combat;

    const card = combat.hand.find((c) => c.instanceId === instanceId);
    if (!card) return;

    const cost = getEnergyCost(card);
    if (cost > combat.energy) return;

    const def = getCardDef(card.defId);

    // Self-targeting and untargeted cards play immediately
    if (
      def.targetPattern === "self" ||
      def.targetPattern === "self_row" ||
      def.targetPattern === "all_enemies" ||
      def.targetPattern === "random_2" ||
      def.targetPattern === "random_3"
    ) {
      this.playCard(instanceId, null);
      return;
    }

    // Enter targeting mode
    combat.selectedCardInstanceId = instanceId;
    combat.targetingMode = true;
    combat.validTargets = getValidTargets(card, combat.enemyGrid);
    this.emit();
  }

  cancelTargeting() {
    if (!this.state.combat) return;
    this.state.combat.selectedCardInstanceId = null;
    this.state.combat.targetingMode = false;
    this.state.combat.validTargets = [];
    this.emit();
  }

  selectTarget(row: number, col: number) {
    if (!this.state.combat?.targetingMode || !this.state.combat.selectedCardInstanceId) return;
    this.playCard(this.state.combat.selectedCardInstanceId, { row, col });
  }

  private playCard(
    instanceId: string,
    target: { row: number; col: number } | null,
  ) {
    const combat = this.state.combat!;
    const cardIndex = combat.hand.findIndex((c) => c.instanceId === instanceId);
    if (cardIndex === -1) return;

    const card = combat.hand[cardIndex];
    const def = getCardDef(card.defId);
    let cost = getEnergyCost(card);

    // Spell Echo relic: first card each turn costs 1 less
    if (this.firstCardThisTurn && this.state.player.relics.includes("spell_echo")) {
      cost = Math.max(0, cost - 1);
    }

    // Veilmother's Eye relic: all cards cost 1 less
    if (this.state.player.relics.includes("veilmothers_eye")) {
      cost = Math.max(0, cost - 1);
    }

    if (cost > combat.energy) return;
    combat.energy -= cost;

    // Remove from hand
    combat.hand.splice(cardIndex, 1);

    // Resolve card effects
    const result = resolveCard(
      card,
      target,
      combat,
      this.state.player,
      this.rng,
    );

    // Apply results to player
    if (result.playerShieldGained > 0) {
      // Weave threads bonus
      const weaveThreads = combat.playerStatuses.find(
        (s) => s.type === "weave_threads",
      );
      const bonus = weaveThreads ? weaveThreads.stacks : 0;
      applyStatus(
        combat.playerStatuses,
        "shield",
        result.playerShieldGained + bonus,
        -1,
      );
    }

    if (result.playerHealed > 0) {
      let heal = result.playerHealed;
      if (this.state.player.relics.includes("soul_lantern")) heal *= 2;
      this.state.player.hp = Math.min(
        this.state.player.maxHp,
        this.state.player.hp + heal,
      );
    }

    if (result.cardsDrawn > 0) {
      const drawn = drawCards(combat, result.cardsDrawn, this.rng);
      combat.hand.push(...drawn);
    }

    if (result.energyGained > 0) {
      combat.energy += result.energyGained;
    }

    // Track stats
    this.state.stats.cardsPlayed++;
    for (const [, dmg] of result.damage) {
      this.state.stats.totalDamage += dmg;
      if (dmg > this.state.stats.highestSingleHit) {
        this.state.stats.highestSingleHit = dmg;
      }
    }

    // Track kills
    for (const killed of result.killed) {
      this.state.stats.enemiesKilled++;
      const killedDef = killed.defId;
      // Vampiric blade
      if (this.state.player.relics.includes("vampiric_blade")) {
        this.state.player.hp = Math.min(
          this.state.player.maxHp,
          this.state.player.hp + 1,
        );
      }
    }

    // Move card to discard or exhaust
    if (def.exhaust) {
      combat.exhaustPile.push(card);
    } else {
      combat.discardPile.push(card);
    }

    // Exit targeting mode
    combat.selectedCardInstanceId = null;
    combat.targetingMode = false;
    combat.validTargets = [];
    this.firstCardThisTurn = false;

    // Check if combat won
    if (isCombatWon(combat.enemyGrid)) {
      this.onCombatWin();
      this.emit();
      return;
    }

    this.emit();
  }

  endTurn() {
    if (this.state.phase !== "combat" || !this.state.combat) return;
    const combat = this.state.combat;

    // Tick player statuses (burn/poison damage, regen)
    const statusResult = tickPlayerStatuses(combat.playerStatuses);
    this.state.player.hp -= statusResult.damage;
    this.state.player.hp = Math.min(
      this.state.player.maxHp,
      this.state.player.hp + statusResult.heal,
    );

    // Check player death from status damage
    if (isPlayerDead(this.state.player)) {
      if (this.checkPhoenixFeather()) {
        this.emit();
        return;
      }
      this.onDeath();
      this.emit();
      return;
    }

    // Process enemy turn
    const enemyResult = processEnemyTurn(
      combat,
      this.state.player,
      this.rng,
    );

    // Veilmother's Eye: take 1 extra damage
    let totalDmg = enemyResult.totalDamage;
    if (this.state.player.relics.includes("veilmothers_eye") && totalDmg > 0) {
      totalDmg += 1;
    }

    this.state.player.hp -= totalDmg;

    // Berserker mask check happens during damage calc in combat.ts

    // Check player death
    if (isPlayerDead(this.state.player)) {
      if (this.checkPhoenixFeather()) {
        this.emit();
        return;
      }
      this.onDeath();
      this.emit();
      return;
    }

    // Check if all enemies died from status ticks
    if (isCombatWon(combat.enemyGrid)) {
      this.onCombatWin();
      this.emit();
      return;
    }

    // Start new player turn
    startPlayerTurn(combat, this.rng);
    this.firstCardThisTurn = true;

    // Eternity hourglass: draw 2 extra
    if (this.state.player.relics.includes("eternity_hourglass")) {
      const drawn = drawCards(combat, 2, this.rng);
      combat.hand.push(...drawn);
    }

    this.emit();
  }

  private checkPhoenixFeather(): boolean {
    const idx = this.state.player.relics.indexOf("phoenix_feather");
    if (idx !== -1) {
      this.state.player.relics.splice(idx, 1);
      this.state.player.hp = Math.round(this.state.player.maxHp * 0.25);
      return true;
    }
    return false;
  }

  private onCombatWin() {
    // Calculate rewards
    let goldReward = GOLD_PER_COMBAT;
    let scoreReward = SCORE_PER_KILL;

    if (this.encounterType === "elite") {
      goldReward = GOLD_PER_ELITE;
      scoreReward = SCORE_PER_ELITE;
      this.state.stats.elitesKilled++;
    } else if (this.encounterType === "boss") {
      goldReward = GOLD_PER_BOSS;
      scoreReward = SCORE_PER_BOSS;
      this.state.stats.bossesKilled++;
    }

    // Rusty coin bonus
    if (this.state.player.relics.includes("rusty_coin")) {
      goldReward += 10;
    }

    // Blood vial heal
    if (this.state.player.relics.includes("blood_vial")) {
      let heal = 3;
      if (this.state.player.relics.includes("soul_lantern")) heal *= 2;
      this.state.player.hp = Math.min(
        this.state.player.maxHp,
        this.state.player.hp + heal,
      );
    }

    this.state.stats.goldEarned += goldReward;
    this.state.stats.score += scoreReward;

    // Pick reward cards
    const cardChoices = pickRewardCards(
      this.state.player.classId,
      this.state.act,
      3,
      this.rng,
    );

    // Check for relic drop
    const relicDrop = this.encounterType === "boss"
      ? getBossRelic(this.state.act)
      : getRewardRelic(
          this.state.player.relics,
          this.encounterType === "elite",
          this.rng,
        );

    this.state.rewards = {
      gold: goldReward,
      cardChoices: cardChoices.map((c) => ({ defId: c.id })),
      relicId: relicDrop?.id,
    };

    this.state.phase = "reward";
    this.state.combat = null;
  }

  // ── Rewards ───────────────────────────────────────────────────────────

  collectRewardGold() {
    if (!this.state.rewards) return;
    this.state.player.gold += this.state.rewards.gold;
    this.state.rewards.gold = 0;
    this.emit();
  }

  selectRewardCard(index: number) {
    if (!this.state.rewards) return;
    const choice = this.state.rewards.cardChoices[index];
    if (!choice) return;

    this.state.player.deck.push(createCardInstance(choice.defId));
    this.state.rewards.cardChoices = [];
    this.emit();
  }

  collectRewardRelic() {
    if (!this.state.rewards?.relicId) return;
    this.state.player.relics.push(this.state.rewards.relicId);

    // Apply passive relic effects
    const relicDef = getRelicDef(this.state.rewards.relicId);
    if (this.state.rewards.relicId === "sturdy_boots") {
      this.state.player.maxHp += 5;
      this.state.player.hp += 5;
    }
    if (this.state.rewards.relicId === "hollows_heart") {
      this.state.player.maxHp -= 10;
      this.state.player.hp = Math.min(this.state.player.hp, this.state.player.maxHp);
    }

    this.state.rewards.relicId = undefined;
    this.emit();
  }

  skipRewards() {
    this.proceedFromRewards();
  }

  private proceedFromRewards() {
    // Auto-collect gold if not already
    if (this.state.rewards && this.state.rewards.gold > 0) {
      this.state.player.gold += this.state.rewards.gold;
    }

    this.state.rewards = null;

    // Check if this was a boss fight
    if (this.encounterType === "boss") {
      if (this.state.floor >= 15) {
        // Victory!
        this.onVictory();
        return;
      }
      // Advance to next act
      this.state.floor = advanceFloor(this.state.floor);
      this.state.act = getActForFloor(this.state.floor);
      this.state.currentFloor = generateFloor(this.state.floor, this.state.seed);
      this.state.currentNodeId = null;
    }

    this.state.phase = "map";
    this.state.stats.floorsCleared++;
    this.state.stats.score += SCORE_PER_FLOOR;

    // Check if we need a new floor (all nodes in last column visited)
    this.checkFloorAdvance();
    this.emit();
  }

  private checkFloorAdvance() {
    if (!this.state.currentFloor) return;
    const floor = this.state.currentFloor;
    const maxCol = Math.max(...floor.nodes.map((n) => n.col));
    const lastColNodes = floor.nodes.filter((n) => n.col === maxCol);
    const allVisited = lastColNodes.every((n) => n.visited);

    if (allVisited && !isBossFloor(this.state.floor)) {
      this.state.floor = advanceFloor(this.state.floor);
      this.state.act = getActForFloor(this.state.floor);
      this.state.currentFloor = generateFloor(this.state.floor, this.state.seed);
      this.state.currentNodeId = null;
    }
  }

  // ── Shop ──────────────────────────────────────────────────────────────

  private openShop() {
    const shopRelics = getShopRelics(this.state.player.relics, this.rng);
    const shopCards = pickRewardCards(
      this.state.player.classId,
      this.state.act,
      3,
      this.rng,
    );

    const items: ShopItem[] = [
      ...shopCards.map((c) => ({
        type: "card" as const,
        id: c.id,
        price: c.rarity === "rare" ? 75 : c.rarity === "uncommon" ? 50 : 30,
        sold: false,
      })),
      ...shopRelics.map((r) => ({
        type: "relic" as const,
        id: r.relic.id,
        price: r.price,
        sold: false,
      })),
      {
        type: "remove_card" as const,
        price: 50,
        sold: false,
      },
    ];

    this.state.shop = items;
    this.state.phase = "shop";
  }

  purchaseShopItem(index: number) {
    if (!this.state.shop) return;
    const item = this.state.shop[index];
    if (!item || item.sold || this.state.player.gold < item.price) return;

    this.state.player.gold -= item.price;
    item.sold = true;

    switch (item.type) {
      case "card":
        if (item.id) {
          this.state.player.deck.push(createCardInstance(item.id));
        }
        break;
      case "relic":
        if (item.id) {
          this.state.player.relics.push(item.id);
        }
        break;
      case "remove_card":
        // Remove a random non-starter card (in full version, player picks)
        const removable = this.state.player.deck.filter(
          (c) => getCardDef(c.defId).rarity !== "starter",
        );
        if (removable.length > 0) {
          const toRemove = removable[Math.floor(this.rng() * removable.length)];
          const idx = this.state.player.deck.findIndex(
            (c) => c.instanceId === toRemove.instanceId,
          );
          if (idx !== -1) this.state.player.deck.splice(idx, 1);
        }
        break;
    }

    this.emit();
  }

  leaveShop() {
    this.state.shop = null;
    this.state.phase = "map";
    this.emit();
  }

  // ── Rest Site ─────────────────────────────────────────────────────────

  restHeal() {
    let heal = Math.round(this.state.player.maxHp * REST_HEAL_PERCENT);
    if (this.state.player.relics.includes("soul_lantern")) heal *= 2;
    this.state.player.hp = Math.min(
      this.state.player.maxHp,
      this.state.player.hp + heal,
    );
    this.state.phase = "map";
    this.emit();
  }

  restUpgradeCard(instanceId: string) {
    const card = this.state.player.deck.find(
      (c) => c.instanceId === instanceId,
    );
    if (card && !card.upgraded) {
      card.upgraded = true;
    }
    this.state.phase = "map";
    this.emit();
  }

  // ── Events ────────────────────────────────────────────────────────────

  selectEventOption(index: number) {
    if (!this.state.event) return;
    const option = this.state.event.options[index];
    if (!option) return;

    for (const effect of option.effects) {
      switch (effect.type) {
        case "heal":
          this.state.player.hp = Math.min(
            this.state.player.maxHp,
            this.state.player.hp + effect.value,
          );
          break;
        case "damage":
          this.state.player.hp -= effect.value;
          break;
        case "gold":
          this.state.player.gold = Math.max(0, this.state.player.gold + effect.value);
          break;
        case "maxHp":
          this.state.player.maxHp += effect.value;
          this.state.player.hp += effect.value;
          break;
        case "relic": {
          const relic = getRewardRelic(this.state.player.relics, false, this.rng);
          if (relic) this.state.player.relics.push(relic.id);
          break;
        }
        case "upgrade_card": {
          const upgradable = this.state.player.deck.filter((c) => !c.upgraded);
          if (upgradable.length > 0) {
            const card = upgradable[Math.floor(this.rng() * upgradable.length)];
            card.upgraded = true;
          }
          break;
        }
      }
    }

    if (isPlayerDead(this.state.player)) {
      this.onDeath();
    } else {
      this.state.event = null;
      this.state.phase = "map";
    }
    this.emit();
  }

  // ── Treasure ──────────────────────────────────────────────────────────

  private openTreasure() {
    const gold = 20 + Math.floor(this.rng() * 30);
    const relic = getRewardRelic(this.state.player.relics, true, this.rng);

    this.state.rewards = {
      gold,
      cardChoices: [],
      relicId: relic?.id,
    };
    this.state.phase = "reward";
  }

  // ── End States ────────────────────────────────────────────────────────

  private onDeath() {
    this.state.phase = "gameover";
    this.saveMeta();
  }

  private onVictory() {
    this.state.stats.score += 200; // Victory bonus
    this.state.phase = "victory";
    this.saveMeta();
  }

  // ── Meta Progression ──────────────────────────────────────────────────

  getMeta(): MetaProgress {
    if (typeof window === "undefined") return this.defaultMeta();
    try {
      const raw = localStorage.getItem(META_KEY);
      if (!raw) return this.defaultMeta();
      return JSON.parse(raw);
    } catch {
      return this.defaultMeta();
    }
  }

  private defaultMeta(): MetaProgress {
    return {
      voidEssence: 0,
      unlockedCards: [],
      unlockedRelics: [],
      unlockedClasses: ["voidwalker", "embercaster"],
      totalRuns: 0,
      totalVictories: 0,
      bestScore: 0,
      bestFloor: 0,
      classStats: {
        voidwalker: { runs: 0, wins: 0, bestScore: 0 },
        embercaster: { runs: 0, wins: 0, bestScore: 0 },
        weavekeeper: { runs: 0, wins: 0, bestScore: 0 },
        shadowblade: { runs: 0, wins: 0, bestScore: 0 },
      },
    };
  }

  private saveMeta() {
    if (typeof window === "undefined") return;
    const meta = this.getMeta();
    const score = this.state.stats.score;
    const floor = this.state.floor;
    const classId = this.state.player.classId;

    meta.totalRuns++;
    if (this.state.phase === "victory") meta.totalVictories++;
    if (score > meta.bestScore) meta.bestScore = score;
    if (floor > meta.bestFloor) meta.bestFloor = floor;

    // Void essence: base on score
    const essenceEarned = Math.round(score * 0.1);
    meta.voidEssence += essenceEarned;

    // Class stats
    if (!meta.classStats[classId]) {
      meta.classStats[classId] = { runs: 0, wins: 0, bestScore: 0 };
    }
    meta.classStats[classId].runs++;
    if (this.state.phase === "victory") meta.classStats[classId].wins++;
    if (score > meta.classStats[classId].bestScore) {
      meta.classStats[classId].bestScore = score;
    }

    // Unlock classes at milestones
    if (meta.totalRuns >= 3 && !meta.unlockedClasses.includes("weavekeeper")) {
      meta.unlockedClasses.push("weavekeeper");
    }
    if (meta.totalVictories >= 1 && !meta.unlockedClasses.includes("shadowblade")) {
      meta.unlockedClasses.push("shadowblade");
    }

    localStorage.setItem(META_KEY, JSON.stringify(meta));
  }

  returnToMenu() {
    this.state = this.createInitialState(0, false);
    this.state.phase = "menu";
    this.emit();
  }
}
