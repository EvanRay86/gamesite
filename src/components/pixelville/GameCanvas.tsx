"use client";

import { useRef, useEffect, useCallback } from "react";
import type { PixelVilleEngine } from "@/lib/pixelville/engine";

interface GameCanvasProps {
  engine: PixelVilleEngine;
}

export default function GameCanvas({ engine }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    // Use a reasonable game resolution (scale for crisp pixels)
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.imageSmoothingEnabled = false; // Crisp pixel art
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  // Pass canvas ref to engine on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      engine.canvas = canvas;
      engine.ctx = canvas.getContext("2d")!;
      if (engine.ctx) {
        engine.ctx.imageSmoothingEnabled = false;
      }
    }
  }, [engine]);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full cursor-crosshair"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
