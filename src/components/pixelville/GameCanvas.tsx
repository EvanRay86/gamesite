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
    // Use 1:1 pixel ratio for crisp pixel art — CSS handles display scaling
    canvas.width = Math.floor(rect.width);
    canvas.height = Math.floor(rect.height);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
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

  // Connect canvas to engine (registers input listeners + rendering context)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      engine.connectCanvas(canvas);
    }
  }, [engine]);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full"
      style={{ imageRendering: "pixelated", cursor: "default" }}
    />
  );
}
