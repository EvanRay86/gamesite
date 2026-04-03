"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { LexiconQuestEngine } from "@/lib/lexicon-quest/engine";
import {
  LexiconQuestRenderer,
  CANVAS_W,
  CANVAS_H,
  playWordSubmit,
  playCritical,
  playEnemyHit,
  playDamageTaken,
  playHeal,
  playEnemyDeath,
} from "@/lib/lexicon-quest/renderer";
import { TILE_STYLES } from "@/lib/lexicon-quest/tiles";
import { getRelicDef, getPotionDef, RELIC_DEFS } from "@/lib/lexicon-quest/relics";
import { NODE_INFO, ACT_CONFIG, getAvailableNodes } from "@/lib/lexicon-quest/dungeon-gen";
import { getWordTier, TIER_COLORS } from "@/lib/lexicon-quest/word-scoring";
import { shareOrCopy } from "@/lib/share";
import XShareButton from "@/components/XShareButton";
import type {
  GamePhase,
  LetterTile,
  EnemyState,
  WordResult,
  MetaProgress,
} from "@/types/lexicon-quest";

// ── Component ───────────────────────────────────────────────────────────────

export default function LexiconQuest() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<LexiconQuestEngine | null>(null);
  const rendererRef = useRef<LexiconQuestRenderer | null>(null);

  const [phase, setPhase] = useState<GamePhase>("menu");
  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick((t: number) => t + 1), []);

  const [toast, setToast] = useState("");
  const [shake, setShake] = useState(false);
  const [copied, setCopied] = useState(false);
  const [meta, setMeta] = useState<MetaProgress | null>(null);
  const [lastWordResult, setLastWordResult] = useState<WordResult | null>(null);

  // ── Initialize engine ─────────────────────────────────────────────────

  useEffect(() => {
    const engine = new LexiconQuestEngine();
    engineRef.current = engine;
    engine.onStateChange = () => {
      setPhase(engine.state.phase);
      rerender();
    };
    setMeta(engine.loadMeta());
  }, [rerender]);

  // ── Initialize renderer when canvas mounts ─────────────────────────────

  const canvasCallbackRef = useCallback((canvas: HTMLCanvasElement | null) => {
    // Store in the regular ref for other code to access
    canvasRef.current = canvas;

    // Tear down previous renderer if any
    if (rendererRef.current) {
      rendererRef.current.stopLoop();
      rendererRef.current = null;
    }

    if (!canvas) return;

    const renderer = new LexiconQuestRenderer(canvas);
    rendererRef.current = renderer;

    renderer.startLoop((dt) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (engine.state.phase === "combat" && engine.state.combat) {
        renderer.renderCombatScene(engine.state, dt);
      } else if (engine.state.phase === "map") {
        renderer.renderMap(
          engine.state.currentFloor,
          engine.state.currentNodeId,
        );
      }
    });
  }, []);

  // ── Keyboard handler ──────────────────────────────────────────────────

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const handleKey = (e: KeyboardEvent) => {
      if (engine.state.phase !== "combat" || !engine.state.combat) return;

      const key = e.key.toUpperCase();

      if (key === "ENTER") {
        e.preventDefault();
        handleSubmitWord();
        return;
      }

      if (key === "BACKSPACE") {
        e.preventDefault();
        const ids = engine.state.combat.selectedTileIds;
        if (ids.length > 0) {
          engine.deselectTile(ids[ids.length - 1]);
        }
        return;
      }

      if (key === "ESCAPE") {
        e.preventDefault();
        engine.clearSelection();
        return;
      }

      // Type a letter to select matching tile
      if (/^[A-Z]$/.test(key)) {
        const selected = new Set(engine.state.combat.selectedTileIds);
        const tile = engine.state.combat.tiles.find(
          (t: LetterTile) =>
            !selected.has(t.id) &&
            (t.letter === key || t.modifier === "wildcard"),
        );
        if (tile) engine.selectTile(tile.id);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  // ── Actions ───────────────────────────────────────────────────────────

  const handleNewRun = useCallback(() => {
    engineRef.current?.newRun();
    setLastWordResult(null);
    setCopied(false);
  }, []);

  const handleDailyRun = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    engineRef.current?.newDailyRun(today);
    setLastWordResult(null);
    setCopied(false);
  }, []);

  const handleSubmitWord = useCallback(() => {
    const engine = engineRef.current;
    const renderer = rendererRef.current;
    if (!engine || !renderer) return;

    const { result, enemyResults, error } = engine.submitWord();

    if (error) {
      setToast(error);
      setShake(true);
      setTimeout(() => setShake(false), 300);
      setTimeout(() => setToast(""), 2000);
      return;
    }

    if (result) {
      setLastWordResult(result);

      // SFX
      if (result.tier === "critical" || result.tier === "legendary" || result.tier === "mythic") {
        playCritical();
      } else {
        playWordSubmit(result.word.length);
      }

      // Visual effects
      const positions = renderer.getEnemyPositions(
        engine.state.combat?.enemies ?? [],
      );
      if (positions.length > 0) {
        const target = positions[0];
        renderer.spawnDamageNumber(
          target.x,
          target.y - 30,
          result.totalDamage,
          result.tier,
        );
        renderer.spawnWordParticles(target.x, target.y, result.tier);

        if (result.tier !== "normal") {
          renderer.shakeScreen(
            result.tier === "mythic" ? 8 : result.tier === "legendary" ? 6 : 4,
            0.3,
          );
        }
      }

      // Heal effects
      if (result.isPalindrome) {
        renderer.spawnDamageNumber(CANVAS_W / 2, CANVAS_H - 60, 3, "normal", true);
        playHeal();
      }

      // Check enemy deaths
      const enemies = engine.state.combat?.enemies ?? [];
      for (let i = 0; i < enemies.length; i++) {
        if (enemies[i].hp <= 0 && positions[i]) {
          renderer.spawnParticles(
            positions[i].x,
            positions[i].y,
            20,
            "#f87171",
            120,
          );
          playEnemyDeath();
        }
      }

      // Enemy damage
      for (const er of enemyResults) {
        if (er.damage > 0) {
          playDamageTaken();
          renderer.shakeScreen(3, 0.15);
        }
      }

      // Clear last word result after 2s
      setTimeout(() => setLastWordResult(null), 2000);
    }
  }, []);

  const handleMapClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const engine = engineRef.current;
      const renderer = rendererRef.current;
      if (!engine || !renderer || engine.state.phase !== "map") return;

      const node = renderer.getClickedNode(
        e.clientX,
        e.clientY,
        engine.state.currentFloor,
      );
      if (!node) return;

      const available = getAvailableNodes(
        engine.state.currentFloor,
        engine.state.currentNodeId,
      );
      if (available.some((n) => n.id === node.id)) {
        engine.selectNode(node.id);
      }
    },
    [],
  );

  const getShareText = useCallback(
    () => engineRef.current?.getShareText() ?? "",
    [],
  );

  const handleShare = useCallback(async () => {
    const text = getShareText();
    if (text) {
      await shareOrCopy(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [getShareText]);

  // ── Helpers ───────────────────────────────────────────────────────────

  const engine = engineRef.current;
  const state = engine?.state;
  const combat = state?.combat;

  const selectedWord = engine?.getSelectedWord() ?? "";
  const wordTier = selectedWord.length >= 3 ? getWordTier(selectedWord.length) : "normal";

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-[960px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold text-text-primary font-display">
          Lexicon Quest
        </h1>
        <p className="text-text-dim text-sm mt-1">
          Spell words to slay monsters
        </p>
      </div>

      {/* ── Menu Screen ──────────────────────────────────────────────── */}
      {phase === "menu" && (
        <div className="text-center space-y-6 py-8">
          <div className="text-6xl mb-4">🗡️📖</div>
          <p className="text-text-muted max-w-md mx-auto">
            A word-powered roguelike dungeon crawler. Form words from letter
            tiles to deal damage to monsters. Collect relics, potions, and
            gold as you descend through procedurally generated dungeons.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <button
              onClick={handleNewRun}
              className="px-8 py-3 bg-purple text-white font-bold rounded-xl
                         hover:bg-purple/90 transition-colors shadow-lg text-lg"
            >
              New Run
            </button>
            <button
              onClick={handleDailyRun}
              className="px-8 py-3 bg-amber text-white font-bold rounded-xl
                         hover:bg-amber/90 transition-colors shadow-lg text-lg"
            >
              Daily Dungeon
            </button>
          </div>

          {/* Stats */}
          {meta && meta.totalRuns > 0 && (
            <div className="mt-8 bg-white/50 backdrop-blur rounded-2xl border border-border-light p-4 max-w-sm mx-auto">
              <h3 className="font-bold text-text-primary mb-2">Your Stats</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-text-muted">
                <div>Runs: {meta.totalRuns}</div>
                <div>Best Floor: {meta.bestFloor}</div>
                <div>Best Score: {meta.bestScore}</div>
                <div>Enemies Slain: {meta.enemiesDefeated}</div>
                <div className="col-span-2">
                  Best Word: {meta.longestWord?.toUpperCase() || "—"}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Canvas (Map + Combat) ────────────────────────────────────── */}
      {(phase === "map" || phase === "combat") && (
        <div className="relative">
          {/* HUD */}
          {state && (
            <div className="flex items-center justify-between mb-2 text-sm">
              <div className="flex items-center gap-3">
                <span className="font-bold text-red-500">
                  ❤️ {state.player.hp}/{state.player.maxHp}
                </span>
                {combat && combat.playerShield > 0 && (
                  <span className="text-blue-400">🛡️ {combat.playerShield}</span>
                )}
                <span className="text-amber-500">💰 {state.player.gold}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-dim">
                  {ACT_CONFIG[state.act].emoji} Floor {state.floor}
                </span>
                <span className="text-text-dim">
                  Score: {state.stats.score}
                </span>
              </div>
            </div>
          )}

          {/* Player HP Bar */}
          {state && (
            <div className="w-full h-2 bg-gray-200 rounded-full mb-2 overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-300"
                style={{
                  width: `${(state.player.hp / state.player.maxHp) * 100}%`,
                }}
              />
            </div>
          )}

          {/* Relics Display */}
          {state && state.player.relics.length > 0 && (
            <div className="flex gap-1 mb-2 flex-wrap">
              {state.player.relics.map((id) => {
                const relic = getRelicDef(id);
                return relic ? (
                  <span
                    key={id}
                    title={`${relic.name}: ${relic.desc}`}
                    className="text-lg cursor-help"
                  >
                    {relic.emoji}
                  </span>
                ) : null;
              })}
            </div>
          )}

          {/* Canvas */}
          <canvas
            ref={canvasCallbackRef}
            onClick={phase === "map" ? handleMapClick : undefined}
            className={`w-full rounded-xl border border-border-light ${
              phase === "map" ? "cursor-pointer" : ""
            }`}
            style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
          />

          {/* ── Combat UI Overlay ─────────────────────────────────────── */}
          {phase === "combat" && combat && (
            <div className="mt-3 space-y-3">
              {/* Word Result Flash */}
              {lastWordResult && (
                <div
                  className="text-center animate-fade-up"
                  style={{ color: TIER_COLORS[lastWordResult.tier] }}
                >
                  <span className="text-2xl font-bold">
                    {lastWordResult.word.toUpperCase()}
                  </span>
                  <span className="ml-2 text-lg">
                    -{lastWordResult.totalDamage} dmg
                  </span>
                  {lastWordResult.bonuses.map((b, i) => (
                    <span key={i} className="ml-2 text-xs opacity-80">
                      {b.label}
                    </span>
                  ))}
                </div>
              )}

              {/* Selected Word Preview */}
              <div className="text-center min-h-[40px]">
                {selectedWord.length > 0 && (
                  <div className={`inline-block ${shake ? "animate-shake" : ""}`}>
                    <span
                      className="text-2xl font-bold tracking-wider"
                      style={{
                        color:
                          selectedWord.length >= 3
                            ? TIER_COLORS[wordTier]
                            : "#9ca3af",
                      }}
                    >
                      {selectedWord}
                    </span>
                    {selectedWord.length >= 3 && (
                      <span className="ml-2 text-sm text-text-dim">
                        ({wordTier})
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Toast */}
              {toast && (
                <div className="text-center text-red-500 text-sm font-semibold animate-fade-up">
                  {toast}
                </div>
              )}

              {/* Tile Rack */}
              <div className="flex justify-center gap-1.5 flex-wrap">
                {combat.tiles.map((tile) => {
                  const selected = combat.selectedTileIds.includes(tile.id);
                  const style = TILE_STYLES[tile.modifier];
                  return (
                    <button
                      key={tile.id}
                      onClick={() =>
                        selected
                          ? engine?.deselectTile(tile.id)
                          : engine?.selectTile(tile.id)
                      }
                      className={`
                        w-11 h-14 sm:w-12 sm:h-16 rounded-lg border-2 font-bold text-lg
                        flex flex-col items-center justify-center transition-all duration-150
                        ${style.bg} ${style.border} ${style.text}
                        ${style.glow ? `shadow-lg ${style.glow}` : "shadow"}
                        ${selected ? "scale-110 -translate-y-2 ring-2 ring-purple" : "hover:scale-105"}
                        ${tile.modifier === "cursed" ? "animate-pulse" : ""}
                      `}
                    >
                      <span className="leading-none">
                        {tile.modifier === "wildcard" ? "?" : tile.letter}
                      </span>
                      <span className="text-[9px] opacity-60 leading-none mt-0.5">
                        {tile.value}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-2">
                <button
                  onClick={handleSubmitWord}
                  disabled={selectedWord.length < 3}
                  className="px-6 py-2.5 bg-purple text-white font-bold rounded-lg
                             hover:bg-purple/90 disabled:opacity-40 disabled:cursor-not-allowed
                             transition-colors shadow"
                >
                  Submit Word
                </button>
                <button
                  onClick={() => engine?.clearSelection()}
                  className="px-4 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg
                             hover:bg-gray-300 transition-colors"
                >
                  Clear
                </button>
              </div>

              {/* Potions */}
              {state && state.player.potions.length > 0 && (
                <div className="flex justify-center gap-2">
                  {state.player.potions.map((potionId, i) => {
                    const potion = getPotionDef(potionId);
                    return potion ? (
                      <button
                        key={i}
                        onClick={() => engine?.usePotion(i)}
                        title={`${potion.name}: ${potion.desc}`}
                        className="px-3 py-1.5 bg-white border border-border-light rounded-lg
                                   hover:bg-gray-50 transition-colors text-sm flex items-center gap-1"
                      >
                        <span>{potion.emoji}</span>
                        <span className="text-text-muted">{potion.name}</span>
                      </button>
                    ) : null;
                  })}
                </div>
              )}

              {/* Keyboard hint */}
              <p className="text-center text-text-dim text-xs">
                Type letters to select tiles &middot; Enter to submit &middot;
                Backspace to undo &middot; Esc to clear
              </p>
            </div>
          )}

          {/* Map instructions */}
          {phase === "map" && (
            <p className="text-center text-text-dim text-sm mt-2">
              Click a glowing node to choose your path
            </p>
          )}
        </div>
      )}

      {/* ── Reward Screen ────────────────────────────────────────────── */}
      {phase === "reward" && state?.rewards && (
        <div className="text-center py-8 space-y-4">
          <h2 className="text-2xl font-bold text-text-primary">
            Victory! Choose your reward
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {state.rewards.map((reward, i) => (
              <button
                key={i}
                onClick={() => engine?.chooseReward(i)}
                className="bg-white border-2 border-border-light rounded-xl p-4 w-48
                           hover:border-purple hover:shadow-lg transition-all text-left"
              >
                {reward.type === "relic" && reward.relicId && (
                  <>
                    <div className="text-2xl mb-1">
                      {getRelicDef(reward.relicId)?.emoji}
                    </div>
                    <div className="font-bold text-sm">
                      {getRelicDef(reward.relicId)?.name}
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      {getRelicDef(reward.relicId)?.desc}
                    </div>
                    <div className="text-[10px] text-purple mt-1">
                      {getRelicDef(reward.relicId)?.rarity}
                    </div>
                  </>
                )}
                {reward.type === "gold" && (
                  <>
                    <div className="text-2xl mb-1">💰</div>
                    <div className="font-bold text-sm">
                      +{reward.amount} Gold
                    </div>
                  </>
                )}
                {reward.type === "maxHp" && (
                  <>
                    <div className="text-2xl mb-1">❤️</div>
                    <div className="font-bold text-sm">
                      +{reward.amount} Max HP
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => engine?.skipReward()}
            className="text-text-dim text-sm hover:text-text-muted transition-colors mt-2"
          >
            Skip reward
          </button>
        </div>
      )}

      {/* ── Shop Screen ──────────────────────────────────────────────── */}
      {phase === "shop" && state?.shop && (
        <div className="text-center py-8 space-y-4">
          <h2 className="text-2xl font-bold text-text-primary">🛒 Shop</h2>
          <p className="text-amber-500 font-semibold">
            💰 {state.player.gold} Gold
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {state.shop.map((item, i) => {
              const relic = item.type === "relic" ? getRelicDef(item.id!) : null;
              const potion =
                item.type === "potion" ? getPotionDef(item.id!) : null;
              return (
                <button
                  key={i}
                  onClick={() => engine?.buyShopItem(i)}
                  disabled={item.sold || state.player.gold < item.price}
                  className={`bg-white border-2 rounded-xl p-4 w-44 text-left transition-all
                    ${item.sold ? "opacity-40 border-gray-200" : "border-border-light hover:border-amber hover:shadow-lg"}
                    disabled:cursor-not-allowed`}
                >
                  <div className="text-2xl mb-1">
                    {relic?.emoji ?? potion?.emoji ?? "❤️"}
                  </div>
                  <div className="font-bold text-sm">
                    {item.sold
                      ? "SOLD"
                      : relic?.name ??
                        potion?.name ??
                        "Heal 25 HP"}
                  </div>
                  <div className="text-xs text-text-muted mt-1">
                    {relic?.desc ?? potion?.desc ?? "Restore 25 hit points."}
                  </div>
                  {!item.sold && (
                    <div className="text-amber-600 font-bold text-sm mt-2">
                      💰 {item.price}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => engine?.leaveShop()}
            className="mt-4 px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg
                       hover:bg-gray-300 transition-colors"
          >
            Leave Shop
          </button>
        </div>
      )}

      {/* ── Rest Screen ──────────────────────────────────────────────── */}
      {phase === "rest" && state && (
        <div className="text-center py-8 space-y-4">
          <div className="text-5xl mb-2">🏕️</div>
          <h2 className="text-2xl font-bold text-text-primary">Rest Site</h2>
          <p className="text-text-muted">
            ❤️ {state.player.hp}/{state.player.maxHp} HP
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => engine?.rest()}
              className="px-6 py-3 bg-green text-white font-bold rounded-xl
                         hover:bg-green/90 transition-colors shadow-lg"
            >
              Rest (Heal {Math.round(state.player.maxHp * 0.3)} HP)
            </button>
            <button
              onClick={() => engine?.restUpgrade()}
              className="px-6 py-3 bg-purple text-white font-bold rounded-xl
                         hover:bg-purple/90 transition-colors shadow-lg"
            >
              Train (+5 Max HP)
            </button>
          </div>
        </div>
      )}

      {/* ── Event Screen ─────────────────────────────────────────────── */}
      {phase === "event" && state?.event && (
        <div className="text-center py-8 space-y-4 max-w-md mx-auto">
          <div className="text-5xl mb-2">{state.event.emoji}</div>
          <h2 className="text-2xl font-bold text-text-primary">
            {state.event.title}
          </h2>
          <p className="text-text-muted">{state.event.desc}</p>
          <div className="space-y-2">
            {state.event.options.map((option, i) => (
              <button
                key={i}
                onClick={() => engine?.chooseEventOption(i)}
                className="w-full px-4 py-3 bg-white border-2 border-border-light rounded-xl
                           hover:border-purple hover:shadow-md transition-all text-left"
              >
                <div className="font-bold text-sm">{option.label}</div>
                <div className="text-xs text-text-muted">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Game Over Screen ─────────────────────────────────────────── */}
      {(phase === "gameover" || phase === "victory") && state && (
        <div className="text-center py-8 space-y-4">
          <div className="text-5xl mb-2">
            {phase === "victory" ? "🏆" : "💀"}
          </div>
          <h2 className="text-3xl font-bold text-text-primary">
            {phase === "victory" ? "Victory!" : "Defeated"}
          </h2>
          <p className="text-text-muted">
            {phase === "victory"
              ? "You conquered the Abyss!"
              : `Fell on Floor ${state.floor}`}
          </p>

          {/* Run Summary */}
          <div className="bg-white/50 backdrop-blur rounded-2xl border border-border-light p-5 max-w-sm mx-auto">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-text-dim">Score</div>
                <div className="text-xl font-bold text-purple">
                  {state.stats.score}
                </div>
              </div>
              <div>
                <div className="text-text-dim">Floor</div>
                <div className="text-xl font-bold">{state.floor}</div>
              </div>
              <div>
                <div className="text-text-dim">Words</div>
                <div className="font-bold">{state.stats.wordsFormed}</div>
              </div>
              <div>
                <div className="text-text-dim">Enemies</div>
                <div className="font-bold">{state.stats.enemiesKilled}</div>
              </div>
              <div>
                <div className="text-text-dim">Best Word</div>
                <div className="font-bold text-purple">
                  {state.stats.longestWord?.toUpperCase() || "—"}
                </div>
              </div>
              <div>
                <div className="text-text-dim">Total Damage</div>
                <div className="font-bold">{state.stats.totalDamage}</div>
              </div>
            </div>
          </div>

          {/* Relics collected */}
          {state.player.relics.length > 0 && (
            <div className="max-w-sm mx-auto">
              <div className="text-text-dim text-sm mb-1">Relics Collected</div>
              <div className="flex justify-center gap-1 flex-wrap">
                {state.player.relics.map((id) => {
                  const relic = getRelicDef(id);
                  return relic ? (
                    <span
                      key={id}
                      title={relic.name}
                      className="text-xl"
                    >
                      {relic.emoji}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
            <button
              onClick={handleShare}
              className="px-6 py-2.5 bg-teal text-white font-bold rounded-xl
                         hover:bg-teal/90 transition-colors shadow"
            >
              {copied ? "Copied!" : "Share Results"}
            </button>
            <XShareButton getText={getShareText} />
            <button
              onClick={handleNewRun}
              className="px-6 py-2.5 bg-purple text-white font-bold rounded-xl
                         hover:bg-purple/90 transition-colors shadow"
            >
              New Run
            </button>
            <button
              onClick={() => {
                if (engine) {
                  engine.state.phase = "menu";
                  setPhase("menu");
                  setMeta(engine.loadMeta());
                }
              }}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-xl
                         hover:bg-gray-300 transition-colors"
            >
              Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
