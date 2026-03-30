"use client";

import { useRef, useEffect, useCallback } from "react";
import type { GameState, DungeonFloor } from "@/types/netherveil";
import { NetherveilRenderer, CANVAS_W, CANVAS_H } from "@/lib/netherveil/renderer";
import { getAvailableNodes } from "@/lib/netherveil/map-gen";
import type { NetherveilEngine } from "@/lib/netherveil/engine";

interface MapViewProps {
  state: GameState;
  engine: NetherveilEngine;
  renderer: NetherveilRenderer | null;
  onRendererReady: (r: NetherveilRenderer) => void;
}

export default function MapView({
  state,
  engine,
  renderer,
  onRendererReady,
}: MapViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current || renderer) return;
    const r = new NetherveilRenderer(canvasRef.current);
    onRendererReady(r);
  }, [renderer, onRendererReady]);

  const floor = state.currentFloor;
  const available = floor
    ? getAvailableNodes(floor, state.currentNodeId)
    : [];
  const availableIds = available.map((n) => n.id);

  // Render loop
  useEffect(() => {
    if (!renderer || !floor) return;
    renderer.startLoop((dt) => {
      renderer.renderMapScene(floor, state.currentNodeId, availableIds, dt);
    });
    return () => renderer.stopLoop();
  }, [renderer, floor, state.currentNodeId, availableIds]);

  // Click handler for node selection
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!renderer || !floor) return;
      const rect = canvasRef.current!.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const px = (e.clientX - rect.left) * scaleX;
      const py = (e.clientY - rect.top) * scaleY;

      const node = renderer.getMapNodeAt(px, py, floor);
      if (node && availableIds.includes(node.id)) {
        engine.selectMapNode(node.id);
      }
    },
    [renderer, floor, availableIds, engine],
  );

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      className="w-full max-w-[900px] rounded-xl border border-white/10 cursor-pointer"
      style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
    />
  );
}
