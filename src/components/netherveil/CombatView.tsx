"use client";

import { useRef, useEffect, useCallback } from "react";
import type { GameState } from "@/types/netherveil";
import { NetherveilRenderer, CANVAS_W, CANVAS_H } from "@/lib/netherveil/renderer";
import type { NetherveilEngine } from "@/lib/netherveil/engine";

interface CombatViewProps {
  state: GameState;
  engine: NetherveilEngine;
  renderer: NetherveilRenderer | null;
  onRendererReady: (r: NetherveilRenderer) => void;
}

export default function CombatView({
  state,
  engine,
  renderer,
  onRendererReady,
}: CombatViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current || renderer) return;
    const r = new NetherveilRenderer(canvasRef.current);
    onRendererReady(r);
  }, [renderer, onRendererReady]);

  // Render loop
  useEffect(() => {
    if (!renderer) return;
    renderer.startLoop((dt) => {
      if (state.phase === "combat" && state.combat) {
        renderer.renderCombatScene(state, dt);
      }
    });
    return () => renderer.stopLoop();
  }, [renderer, state]);

  // Click handler for grid targeting
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!renderer || !state.combat?.targetingMode) return;
      const rect = canvasRef.current!.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const px = (e.clientX - rect.left) * scaleX;
      const py = (e.clientY - rect.top) * scaleY;

      const gridPos = renderer.pixelToGrid(px, py);
      if (gridPos) {
        engine.selectTarget(gridPos.row, gridPos.col);
      }
    },
    [renderer, state.combat?.targetingMode, engine],
  );

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      className="w-full max-w-[900px] rounded-xl border border-white/10 cursor-crosshair"
      style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
    />
  );
}
