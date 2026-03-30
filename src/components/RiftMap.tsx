"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import type { RiftHex, Faction, HexCoord } from "@/types/rift";
import {
  hexToPixel,
  pixelToHex,
  drawHexPath,
  getHexFillColor,
  getHexBorderColor,
  getHexIcon,
  hexKey,
  buildHexMap,
  isAttackable,
} from "@/lib/rift-engine";
import { FACTION_COLORS } from "@/types/rift";

interface RiftMapProps {
  hexes: RiftHex[];
  playerFaction: Faction | null;
  selectedHex: HexCoord | null;
  onHexClick: (hex: HexCoord) => void;
  /** Hex size in pixels */
  hexSize?: number;
}

export default function RiftMap({
  hexes,
  playerFaction,
  selectedHex,
  onHexClick,
  hexSize = 28,
}: RiftMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredHex, setHoveredHex] = useState<HexCoord | null>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const cameraStart = useRef({ x: 0, y: 0 });
  const hexMapRef = useRef<Map<string, RiftHex>>(new Map());

  // Build hex lookup map
  useEffect(() => {
    hexMapRef.current = buildHexMap(hexes);
  }, [hexes]);

  // ── Render ─────────────────────────────────────────────────────────────

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = "#f8f6f0";
    ctx.fillRect(0, 0, w, h);

    // Grid pattern background
    ctx.strokeStyle = "rgba(0,0,0,0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const cx = w / 2 + camera.x;
    const cy = h / 2 + camera.y;
    const hexMap = hexMapRef.current;

    // Draw all hexes
    for (const hex of hexes) {
      const pos = hexToPixel(hex, hexSize);
      const px = cx + pos.x;
      const py = cy + pos.y;

      const isHovered = hoveredHex && hex.q === hoveredHex.q && hex.r === hoveredHex.r;
      const isSelected = selectedHex && hex.q === selectedHex.q && hex.r === selectedHex.r;
      const canAttack = playerFaction && isAttackable(hex, playerFaction, hexMap);

      // Hex fill
      drawHexPath(ctx, px, py, hexSize - 1);
      ctx.fillStyle = getHexFillColor(hex, !!isHovered);
      ctx.fill();

      // Border
      drawHexPath(ctx, px, py, hexSize - 1);
      ctx.strokeStyle = getHexBorderColor(hex);
      ctx.lineWidth = isSelected ? 3 : isHovered ? 2 : 1;
      ctx.stroke();

      // Selected hex glow
      if (isSelected) {
        drawHexPath(ctx, px, py, hexSize + 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 3;
        ctx.stroke();
        drawHexPath(ctx, px, py, hexSize + 4);
        ctx.strokeStyle = playerFaction ? FACTION_COLORS[playerFaction] : "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Attackable hex indicator
      if (canAttack && !isSelected) {
        drawHexPath(ctx, px, py, hexSize - 1);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Hex type icon
      const icon = getHexIcon(hex.hexType);
      if (icon) {
        ctx.font = `${hexSize * 0.6}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = hex.faction
          ? "rgba(255,255,255,0.8)"
          : "rgba(0,0,0,0.3)";
        ctx.fillText(icon, px, py);
      }
    }

    // Draw coordinate labels for border hexes (optional debugging removed)
  }, [hexes, hexSize, hoveredHex, selectedHex, playerFaction, camera]);

  useEffect(() => {
    render();
  }, [render]);

  // ── Mouse/touch interaction ────────────────────────────────────────────

  const getHexFromEvent = useCallback(
    (clientX: number, clientY: number): HexCoord | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left - canvas.clientWidth / 2 - camera.x;
      const y = clientY - rect.top - canvas.clientHeight / 2 - camera.y;

      const hex = pixelToHex(x, y, hexSize);
      // Verify this hex exists
      if (hexMapRef.current.has(hexKey(hex))) {
        return hex;
      }
      return null;
    },
    [hexSize, camera],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      cameraStart.current = { ...camera };
    },
    [camera],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        setCamera({
          x: cameraStart.current.x + dx,
          y: cameraStart.current.y + dy,
        });
      } else {
        const hex = getHexFromEvent(e.clientX, e.clientY);
        setHoveredHex(hex);
      }
    },
    [isDragging, getHexFromEvent],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const dx = Math.abs(e.clientX - dragStart.current.x);
      const dy = Math.abs(e.clientY - dragStart.current.y);

      // If barely moved, treat as click
      if (dx < 5 && dy < 5) {
        const hex = getHexFromEvent(e.clientX, e.clientY);
        if (hex) onHexClick(hex);
      }

      setIsDragging(false);
    },
    [getHexFromEvent, onHexClick],
  );

  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "16/10" }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          setHoveredHex(null);
          setIsDragging(false);
        }}
      />

      {/* Hex info tooltip */}
      {hoveredHex && !isDragging && (
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2
                        text-xs font-medium text-text-primary shadow-md pointer-events-none">
          {(() => {
            const hex = hexMapRef.current.get(hexKey(hoveredHex));
            if (!hex) return null;
            return (
              <>
                <span className="opacity-50">({hoveredHex.q}, {hoveredHex.r})</span>
                {" · "}
                <span className="capitalize">{hex.hexType}</span>
                {hex.faction && (
                  <>
                    {" · "}
                    <span style={{ color: FACTION_COLORS[hex.faction] }} className="font-bold capitalize">
                      {hex.faction}
                    </span>
                  </>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
