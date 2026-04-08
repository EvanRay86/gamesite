"use client";

import { useRef, useEffect, useCallback } from "react";
import type { GlobleCountry } from "@/data/globle-countries";
import { proximityColor, proximityPct, haversineDistance } from "@/data/globle-countries";

// ---------------------------------------------------------------------------
// Simplified continent outlines (lon/lat paths — equirectangular coords)
// Each continent is an array of [lng, lat] coordinate pairs forming a polygon.
// Very simplified for rendering on the globe.
// ---------------------------------------------------------------------------

const CONTINENT_PATHS: [number, number][][] = [
  // North America
  [
    [-130, 50], [-125, 55], [-120, 60], [-140, 60], [-150, 62], [-165, 63],
    [-168, 66], [-165, 72], [-155, 72], [-130, 70], [-120, 70], [-100, 72],
    [-85, 72], [-75, 68], [-65, 62], [-55, 52], [-60, 47], [-65, 44],
    [-70, 43], [-75, 35], [-80, 31], [-82, 25], [-90, 30], [-95, 29],
    [-98, 26], [-105, 20], [-100, 16], [-88, 15], [-84, 16], [-82, 10],
    [-78, 8], [-80, 15], [-85, 22], [-90, 22], [-92, 19], [-105, 23],
    [-110, 30], [-117, 33], [-120, 35], [-122, 38], [-124, 42], [-125, 47],
    [-130, 50],
  ],
  // South America
  [
    [-78, 8], [-75, 11], [-70, 12], [-63, 10], [-60, 8], [-52, 4], [-50, 2],
    [-50, -1], [-45, -3], [-40, -3], [-38, -8], [-35, -10], [-35, -15],
    [-38, -18], [-40, -22], [-42, -23], [-45, -24], [-48, -27], [-50, -30],
    [-52, -33], [-55, -35], [-58, -38], [-63, -42], [-65, -45], [-68, -48],
    [-68, -54], [-72, -52], [-74, -46], [-75, -42], [-73, -37], [-72, -33],
    [-70, -28], [-70, -20], [-75, -15], [-76, -10], [-80, -3], [-80, 0],
    [-78, 8],
  ],
  // Europe
  [
    [-10, 36], [-8, 38], [-10, 40], [-8, 44], [-2, 44], [0, 46], [3, 47],
    [5, 48], [8, 48], [7, 54], [9, 55], [12, 55], [13, 55], [12, 57],
    [16, 57], [18, 60], [20, 64], [25, 65], [28, 71], [30, 70], [32, 65],
    [28, 60], [28, 56], [24, 55], [22, 55], [21, 52], [24, 52], [24, 48],
    [28, 46], [30, 46], [32, 47], [35, 46], [37, 44], [40, 42], [41, 42],
    [40, 38], [35, 37], [28, 37], [26, 38], [23, 36], [20, 40], [16, 39],
    [14, 38], [12, 37], [6, 44], [3, 43], [0, 40], [-5, 36], [-10, 36],
  ],
  // Africa
  [
    [-17, 15], [-16, 12], [-15, 11], [-8, 5], [-5, 5], [2, 5], [10, 4],
    [10, 2], [9, 1], [12, -5], [14, -5], [17, -12], [24, -18], [30, -20],
    [33, -22], [35, -26], [33, -30], [30, -34], [27, -34], [20, -34],
    [18, -30], [15, -24], [12, -18], [12, -6], [40, -2], [42, -1],
    [44, -2], [46, -5], [50, -12], [50, -16], [44, -25], [36, -22],
    [33, -16], [31, -3], [34, 2], [42, 12], [44, 12], [48, 8],
    [50, 12], [43, 12], [38, 14], [35, 12], [32, 32], [25, 32],
    [12, 32], [10, 36], [2, 36], [-1, 35], [-5, 36], [-8, 33],
    [-13, 28], [-17, 21], [-17, 15],
  ],
  // Asia (simplified)
  [
    [40, 42], [45, 40], [50, 38], [53, 37], [55, 26], [58, 22], [56, 18],
    [52, 16], [45, 13], [43, 12], [50, 12], [48, 8], [50, 28],
    [60, 24], [65, 26], [67, 27], [70, 20], [72, 15], [77, 8],
    [80, 12], [80, 16], [88, 22], [90, 22], [92, 21], [96, 16],
    [98, 10], [103, 2], [104, 1], [106, -6], [110, -8], [115, -8],
    [120, -3], [128, -3], [135, -5], [142, -8], [140, -3], [130, 2],
    [125, 8], [122, 12], [122, 18], [120, 22], [115, 25],
    [122, 30], [127, 35], [130, 33], [131, 38], [129, 35],
    [127, 37], [128, 40], [131, 42], [135, 40], [138, 35], [140, 37],
    [142, 45], [145, 50], [150, 53], [155, 57], [162, 60], [170, 62],
    [175, 65], [180, 68], [180, 72], [160, 72], [140, 72], [120, 72],
    [100, 72], [80, 72], [70, 72], [60, 72], [50, 65], [40, 55],
    [40, 42],
  ],
  // Australia
  [
    [115, -35], [117, -33], [122, -34], [130, -32], [132, -14], [136, -12],
    [138, -16], [141, -12], [142, -11], [146, -15], [146, -19], [149, -21],
    [151, -24], [153, -27], [153, -30], [151, -34], [148, -38], [145, -39],
    [140, -38], [137, -36], [135, -35], [130, -33], [124, -35], [118, -35],
    [115, -35],
  ],
];

interface GlobeGuess {
  country: GlobleCountry;
  distance: number;
}

interface GlobleGlobeProps {
  guesses: GlobeGuess[];
  target: GlobleCountry;
  won: boolean;
  className?: string;
}

const DEG = Math.PI / 180;

export default function GlobleGlobe({ guesses, target, won, className }: GlobleGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    rotLng: 0,
    rotLat: 20,
    dragging: false,
    lastX: 0,
    lastY: 0,
    animFrame: 0,
    autoRotate: true,
    lastInteraction: 0,
  });

  // Project lat/lng to canvas x/y (orthographic projection)
  const project = useCallback(
    (
      lat: number,
      lng: number,
      cx: number,
      cy: number,
      r: number,
      rLat: number,
      rLng: number,
    ): [number, number, boolean] => {
      const lambda = lng * DEG - rLng * DEG;
      const phi = lat * DEG;
      const phi0 = rLat * DEG;
      const cosC =
        Math.sin(phi0) * Math.sin(phi) +
        Math.cos(phi0) * Math.cos(phi) * Math.cos(lambda);
      if (cosC < 0) return [0, 0, false]; // behind globe
      const x =
        cx + r * Math.cos(phi) * Math.sin(lambda);
      const y =
        cy -
        r *
          (Math.cos(phi0) * Math.sin(phi) -
            Math.sin(phi0) * Math.cos(phi) * Math.cos(lambda));
      return [x, y, true];
    },
    [],
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(cx, cy) - 4;

    const { rotLat, rotLng } = stateRef.current;

    // Ocean
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#1e3a5f";
    ctx.fill();

    // Globe border glow
    const glow = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    glow.addColorStop(0, "rgba(100,180,255,0.12)");
    glow.addColorStop(1, "rgba(0,30,60,0)");
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Clip to globe circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Grid lines
    ctx.strokeStyle = "rgba(100,160,220,0.15)";
    ctx.lineWidth = 0.5;
    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      let started = false;
      for (let lng = -180; lng <= 180; lng += 3) {
        const [px, py, vis] = project(lat, lng, cx, cy, r, rotLat, rotLng);
        if (!vis) { started = false; continue; }
        if (!started) { ctx.moveTo(px, py); started = true; }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    // Longitude lines
    for (let lng = -180; lng < 180; lng += 30) {
      ctx.beginPath();
      let started = false;
      for (let lat = -90; lat <= 90; lat += 3) {
        const [px, py, vis] = project(lat, lng, cx, cy, r, rotLat, rotLng);
        if (!vis) { started = false; continue; }
        if (!started) { ctx.moveTo(px, py); started = true; }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Continents
    for (const path of CONTINENT_PATHS) {
      ctx.beginPath();
      let started = false;
      for (const [lng, lat] of path) {
        const [px, py, vis] = project(lat, lng, cx, cy, r, rotLat, rotLng);
        if (!vis) { started = false; continue; }
        if (!started) { ctx.moveTo(px, py); started = true; }
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(60, 100, 60, 0.45)";
      ctx.fill();
      ctx.strokeStyle = "rgba(80, 140, 80, 0.5)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // Guess markers
    for (const guess of guesses) {
      const { country, distance } = guess;
      const pct = proximityPct(distance);
      const [px, py, vis] = project(
        country.lat,
        country.lng,
        cx,
        cy,
        r,
        rotLat,
        rotLng,
      );
      if (!vis) continue;

      const isTarget = country.code === target.code;
      const markerR = Math.max(5, Math.min(16, r * 0.04));
      const color = isTarget && won ? "#22c55e" : proximityColor(pct);

      // Outer glow
      ctx.beginPath();
      ctx.arc(px, py, markerR + 3, 0, Math.PI * 2);
      ctx.fillStyle = isTarget && won
        ? "rgba(34,197,94,0.35)"
        : `${color}44`;
      ctx.fill();

      // Fill
      ctx.beginPath();
      ctx.arc(px, py, markerR, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Star on target
      if (isTarget && won) {
        ctx.fillStyle = "#fff";
        ctx.font = `${markerR}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("★", px, py + 1);
      }
    }

    ctx.restore();

    // Globe rim
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(100,180,255,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [guesses, target, won, project]);

  // Animation loop
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      const s = stateRef.current;
      const now = Date.now();
      // Auto-rotate if idle for 2 seconds and not dragging
      if (!s.dragging && now - s.lastInteraction > 2000) {
        s.rotLng += 0.15;
        if (s.rotLng > 180) s.rotLng -= 360;
      }
      draw();
      s.animFrame = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      running = false;
      cancelAnimationFrame(stateRef.current.animFrame);
    };
  }, [draw]);

  // Center on latest guess
  useEffect(() => {
    if (guesses.length > 0) {
      const last = guesses[guesses.length - 1].country;
      stateRef.current.rotLat = last.lat;
      stateRef.current.rotLng = last.lng;
      stateRef.current.lastInteraction = Date.now();
    }
  }, [guesses.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mouse/touch drag handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onPointerDown = (e: PointerEvent) => {
      stateRef.current.dragging = true;
      stateRef.current.lastX = e.clientX;
      stateRef.current.lastY = e.clientY;
      stateRef.current.lastInteraction = Date.now();
      canvas.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!stateRef.current.dragging) return;
      const dx = e.clientX - stateRef.current.lastX;
      const dy = e.clientY - stateRef.current.lastY;
      stateRef.current.rotLng -= dx * 0.4;
      stateRef.current.rotLat += dy * 0.4;
      stateRef.current.rotLat = Math.max(-80, Math.min(80, stateRef.current.rotLat));
      stateRef.current.lastX = e.clientX;
      stateRef.current.lastY = e.clientY;
      stateRef.current.lastInteraction = Date.now();
    };
    const onPointerUp = () => {
      stateRef.current.dragging = false;
      stateRef.current.lastInteraction = Date.now();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`touch-none cursor-grab active:cursor-grabbing ${className ?? ""}`}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
