"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { GameState, ClassId } from "@/types/netherveil";
import { NetherveilEngine } from "@/lib/netherveil/engine";
import { NetherveilRenderer } from "@/lib/netherveil/renderer";
import MenuScreen from "./MenuScreen";
import CombatView from "./CombatView";
import MapView from "./MapView";
import HandPanel from "./HandPanel";
import RunHUD from "./RunHUD";
import RewardScreen from "./RewardScreen";
import ShopScreen from "./ShopScreen";
import EventScreen from "./EventScreen";
import RestScreen from "./RestScreen";

export default function NetherveilGame() {
  const engineRef = useRef<NetherveilEngine | null>(null);
  const [renderer, setRenderer] = useState<NetherveilRenderer | null>(null);
  const [state, setState] = useState<GameState | null>(null);

  // Initialize engine
  useEffect(() => {
    if (!engineRef.current) {
      const engine = new NetherveilEngine();
      engine.onStateChange = () => setState({ ...engine.state });
      engineRef.current = engine;
      setState({ ...engine.state });
    }
  }, []);

  const engine = engineRef.current;
  if (!engine || !state) return null;

  const meta = engine.getMeta();

  // ── Menu ──────────────────────────────────────────────────────────────
  if (state.phase === "menu" || state.phase === "class_select") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <MenuScreen
          meta={meta}
          onStartRun={(classId: ClassId) => {
            engine.newRun(classId);
          }}
          onStartDaily={(classId: ClassId) => {
            engine.newDailyRun(classId);
          }}
        />
      </div>
    );
  }

  // ── Map ───────────────────────────────────────────────────────────────
  if (state.phase === "map") {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <RunHUD
          player={state.player}
          stats={state.stats}
          act={state.act}
          floor={state.floor}
          deckSize={state.player.deck.length}
        />
        <MapView
          state={state}
          engine={engine}
          renderer={renderer}
          onRendererReady={setRenderer}
        />
        <p className="text-xs text-slate-500">
          Click a glowing node to proceed
        </p>
      </div>
    );
  }

  // ── Combat ────────────────────────────────────────────────────────────
  if (state.phase === "combat" && state.combat) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <RunHUD
          player={state.player}
          stats={state.stats}
          act={state.act}
          floor={state.floor}
          deckSize={state.player.deck.length}
          energy={state.combat.energy}
          maxEnergy={state.combat.maxEnergy}
        />
        <CombatView
          state={state}
          engine={engine}
          renderer={renderer}
          onRendererReady={setRenderer}
        />
        <HandPanel
          hand={state.combat.hand}
          energy={state.combat.energy}
          selectedCardId={state.combat.selectedCardInstanceId}
          onSelectCard={(id) => engine.selectCard(id)}
          onCancelTargeting={() => engine.cancelTargeting()}
          targetingMode={state.combat.targetingMode}
        />
        <div className="flex items-center gap-3">
          <button
            onClick={() => engine.endTurn()}
            className="px-5 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 font-semibold text-sm hover:bg-red-500/30 transition-colors"
          >
            End Turn →
          </button>
          <div className="text-xs text-slate-500">
            Draw: {state.combat.drawPile.length} | Discard:{" "}
            {state.combat.discardPile.length} | Exhaust:{" "}
            {state.combat.exhaustPile.length}
          </div>
        </div>
      </div>
    );
  }

  // ── Rewards ───────────────────────────────────────────────────────────
  if (state.phase === "reward" && state.rewards) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <RewardScreen
          rewards={state.rewards}
          player={state.player}
          onCollectGold={() => engine.collectRewardGold()}
          onSelectCard={(i) => engine.selectRewardCard(i)}
          onCollectRelic={() => engine.collectRewardRelic()}
          onSkip={() => engine.skipRewards()}
        />
      </div>
    );
  }

  // ── Shop ──────────────────────────────────────────────────────────────
  if (state.phase === "shop" && state.shop) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ShopScreen
          items={state.shop}
          player={state.player}
          onPurchase={(i) => engine.purchaseShopItem(i)}
          onLeave={() => engine.leaveShop()}
        />
      </div>
    );
  }

  // ── Event ─────────────────────────────────────────────────────────────
  if (state.phase === "event" && state.event) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <EventScreen
          event={state.event}
          onSelectOption={(i) => engine.selectEventOption(i)}
        />
      </div>
    );
  }

  // ── Rest ──────────────────────────────────────────────────────────────
  if (state.phase === "rest") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <RestScreen
          player={state.player}
          onHeal={() => engine.restHeal()}
          onUpgrade={(id) => engine.restUpgradeCard(id)}
        />
      </div>
    );
  }

  // ── Game Over ─────────────────────────────────────────────────────────
  if (state.phase === "gameover") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 py-8 px-4 max-w-md mx-auto text-center">
          <div className="text-6xl">💀</div>
          <h2
            className="text-3xl font-bold text-red-400"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            The Veil Claims You
          </h2>
          <p className="text-sm text-slate-400">
            You fell on floor {state.floor} of {state.act === "wastes" ? "The Fractured Wastes" : state.act === "depths" ? "The Abyssal Depths" : "The Core"}.
          </p>
          <div className="grid grid-cols-3 gap-4 text-center text-xs text-slate-400">
            <div>
              <div className="text-lg font-bold text-white">{state.stats.score}</div>
              Score
            </div>
            <div>
              <div className="text-lg font-bold text-white">{state.stats.enemiesKilled}</div>
              Enemies Killed
            </div>
            <div>
              <div className="text-lg font-bold text-white">{state.stats.cardsPlayed}</div>
              Cards Played
            </div>
            <div>
              <div className="text-lg font-bold text-white">{state.stats.highestSingleHit}</div>
              Highest Hit
            </div>
            <div>
              <div className="text-lg font-bold text-amber-400">{state.stats.goldEarned}</div>
              Gold Earned
            </div>
            <div>
              <div className="text-lg font-bold text-purple-400">
                +{Math.round(state.stats.score * 0.1)}
              </div>
              Void Essence
            </div>
          </div>
          <button
            onClick={() => engine.returnToMenu()}
            className="px-6 py-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-semibold hover:bg-purple-500/30 transition-colors"
          >
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  // ── Victory ───────────────────────────────────────────────────────────
  if (state.phase === "victory") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 py-8 px-4 max-w-md mx-auto text-center">
          <div className="text-6xl">👑</div>
          <h2
            className="text-3xl font-bold text-amber-400"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            The Veil Is Conquered
          </h2>
          <p className="text-sm text-slate-300">
            You have defeated The Veilmother and pierced the heart of the Netherveil.
          </p>
          <div className="grid grid-cols-3 gap-4 text-center text-xs text-slate-400">
            <div>
              <div className="text-lg font-bold text-amber-300">{state.stats.score}</div>
              Final Score
            </div>
            <div>
              <div className="text-lg font-bold text-white">{state.stats.enemiesKilled}</div>
              Enemies Slain
            </div>
            <div>
              <div className="text-lg font-bold text-white">{state.stats.cardsPlayed}</div>
              Cards Played
            </div>
            <div>
              <div className="text-lg font-bold text-white">{state.stats.highestSingleHit}</div>
              Highest Hit
            </div>
            <div>
              <div className="text-lg font-bold text-amber-400">{state.stats.goldEarned}</div>
              Gold Earned
            </div>
            <div>
              <div className="text-lg font-bold text-purple-400">
                +{Math.round(state.stats.score * 0.1)}
              </div>
              Void Essence
            </div>
          </div>
          <button
            onClick={() => engine.returnToMenu()}
            className="px-6 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold hover:bg-amber-500/30 transition-colors"
          >
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="flex items-center justify-center min-h-[50vh] text-slate-400">
      Loading...
    </div>
  );
}
