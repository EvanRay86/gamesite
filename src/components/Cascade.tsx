"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  COLS,
  ROWS,
  PIECES,
  type PieceType,
  type Board,
  type Active,
  emptyBoard,
  cellsOf,
  collides,
  spawnX,
  tryRotate,
  dropTo,
  lockPiece,
  fullRows,
  clearRows,
  shuffledBag,
  clearScore,
  levelForLines,
  dropFrames,
} from "@/lib/cascade-core";

// ── Layout ───────────────────────────────────────────────────────────────────

const CELL = 30;
const WELL_W = COLS * CELL; // 300
const WELL_H = ROWS * CELL; // 600
const PANEL_W = 150;
const CANVAS_W = WELL_W + PANEL_W; // 450
const CANVAS_H = WELL_H; // 600

// ── Timing (frames @ ~60fps) ──────────────────────────────────────────────────

const LOCK_DELAY = 30;
const MAX_LOCK_RESETS = 15;
const CLEAR_FLASH = 16;
const SOFT_FRAMES = 2;
const DAS_DELAY = 10;
const DAS_REPEAT = 2;

const SAVE_KEY = "cascade-best";

// ── Types ──────────────────────────────────────────────────────────────────

type GameState = "idle" | "playing" | "paused" | "gameover";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Clearing {
  rows: number[];
  t: number;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Cascade() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Mutable game state (read inside the rAF loop — no re-render).
  const stateRef = useRef<GameState>("idle");
  const boardRef = useRef<Board>(emptyBoard());
  const curRef = useRef<Active | null>(null);
  const nextRef = useRef<PieceType>("I");
  const holdRef = useRef<PieceType | null>(null);
  const canHoldRef = useRef(true);
  const bagRef = useRef<PieceType[]>([]);

  const scoreRef = useRef(0);
  const linesRef = useRef(0);
  const levelRef = useRef(1);
  const comboRef = useRef(-1);
  const bestRef = useRef(0);

  const gravityRef = useRef(0);
  const lockRef = useRef(0);
  const lockResetsRef = useRef(0);
  const clearingRef = useRef<Clearing | null>(null);

  const particlesRef = useRef<Particle[]>([]);
  const shakeRef = useRef(0);

  const keysRef = useRef({ left: false, right: false });
  const softRef = useRef(false);
  const dasRef = useRef({ prev: 0, timer: 0 });

  // Display mirrors (drive HUD overlays).
  const [displayState, setDisplayState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [best, setBest] = useState(0);
  const [scale, setScale] = useState(1);

  // Load best score.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const n = parseInt(saved, 10);
        if (!Number.isNaN(n)) {
          bestRef.current = n;
          setBest(n);
        }
      }
    } catch {}
  }, []);

  // Responsive scaling.
  useEffect(() => {
    function resize() {
      if (!wrapperRef.current) return;
      const parent = wrapperRef.current.parentElement;
      if (!parent) return;
      const maxW = Math.min(parent.clientWidth - 16, CANVAS_W);
      const maxH = window.innerHeight - 240;
      const s = Math.min(maxW / CANVAS_W, maxH / CANVAS_H, 1);
      setScale(s > 0 ? s : 1);
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const gameOver = useCallback(() => {
    stateRef.current = "gameover";
    setDisplayState("gameover");
    if (scoreRef.current > bestRef.current) {
      bestRef.current = scoreRef.current;
      setBest(bestRef.current);
      try {
        localStorage.setItem(SAVE_KEY, String(bestRef.current));
      } catch {}
    }
  }, []);

  const drawPiece = useCallback((): PieceType => {
    if (bagRef.current.length === 0) bagRef.current = shuffledBag(Math.random);
    return bagRef.current.shift() as PieceType;
  }, []);

  const spawn = useCallback(() => {
    const type = nextRef.current;
    nextRef.current = drawPiece();
    const a: Active = { type, rot: 0, x: spawnX(type), y: 0 };
    curRef.current = a;
    canHoldRef.current = true;
    gravityRef.current = 0;
    lockRef.current = 0;
    lockResetsRef.current = 0;
    if (collides(boardRef.current, a.type, a.rot, a.x, a.y)) gameOver();
  }, [drawPiece, gameOver]);

  const addParticles = useCallback(
    (x: number, y: number, color: string, count: number) => {
      const arr = particlesRef.current;
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = Math.random() * 3 + 0.5;
        const life = Math.random() * 22 + 14;
        arr.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 1.2,
          life,
          maxLife: life,
          color,
          size: Math.random() * 3 + 1.5,
        });
      }
      if (arr.length > 320) arr.splice(0, arr.length - 320);
    },
    [],
  );

  const lockNow = useCallback(() => {
    const a = curRef.current;
    if (!a) return;
    boardRef.current = lockPiece(boardRef.current, a);
    const fr = fullRows(boardRef.current);
    if (fr.length > 0) {
      comboRef.current += 1;
      scoreRef.current += clearScore(fr.length, levelRef.current, comboRef.current);
      linesRef.current += fr.length;
      levelRef.current = levelForLines(linesRef.current);
      setScore(scoreRef.current);
      setLines(linesRef.current);
      setLevel(levelRef.current);
      shakeRef.current = fr.length >= 4 ? 16 : 7;
      for (const ry of fr) {
        for (let x = 0; x < COLS; x++) {
          const t = boardRef.current[ry]?.[x];
          const col = t ? PIECES[t].color : "#ffffff";
          addParticles(x * CELL + CELL / 2, ry * CELL + CELL / 2, col, 3);
        }
      }
      clearingRef.current = { rows: fr, t: CLEAR_FLASH };
      curRef.current = null;
    } else {
      comboRef.current = -1;
      spawn();
    }
  }, [addParticles, spawn]);

  const move = useCallback((dx: number) => {
    if (stateRef.current !== "playing" || clearingRef.current) return;
    const a = curRef.current;
    if (!a) return;
    if (!collides(boardRef.current, a.type, a.rot, a.x + dx, a.y)) {
      a.x += dx;
      if (
        collides(boardRef.current, a.type, a.rot, a.x, a.y + 1) &&
        lockResetsRef.current < MAX_LOCK_RESETS
      ) {
        lockRef.current = 0;
        lockResetsRef.current += 1;
      }
    }
  }, []);

  const rotate = useCallback((dir: 1 | -1) => {
    if (stateRef.current !== "playing" || clearingRef.current) return;
    const a = curRef.current;
    if (!a) return;
    const r = tryRotate(boardRef.current, a, dir);
    if (r) {
      curRef.current = r;
      if (
        collides(boardRef.current, r.type, r.rot, r.x, r.y + 1) &&
        lockResetsRef.current < MAX_LOCK_RESETS
      ) {
        lockRef.current = 0;
        lockResetsRef.current += 1;
      }
    }
  }, []);

  const hardDrop = useCallback(() => {
    if (stateRef.current !== "playing" || clearingRef.current) return;
    const a = curRef.current;
    if (!a) return;
    const ny = dropTo(boardRef.current, a);
    const dist = ny - a.y;
    if (dist > 0) {
      scoreRef.current += dist * 2;
      setScore(scoreRef.current);
    }
    a.y = ny;
    lockNow();
  }, [lockNow]);

  const hold = useCallback(() => {
    if (stateRef.current !== "playing" || clearingRef.current) return;
    if (!canHoldRef.current) return;
    const a = curRef.current;
    if (!a) return;
    if (holdRef.current === null) {
      holdRef.current = a.type;
      spawn();
    } else {
      const swap = holdRef.current;
      holdRef.current = a.type;
      const na: Active = { type: swap, rot: 0, x: spawnX(swap), y: 0 };
      curRef.current = na;
      gravityRef.current = 0;
      lockRef.current = 0;
      lockResetsRef.current = 0;
      if (collides(boardRef.current, na.type, na.rot, na.x, na.y)) gameOver();
    }
    canHoldRef.current = false;
  }, [spawn, gameOver]);

  const startGame = useCallback(() => {
    boardRef.current = emptyBoard();
    bagRef.current = [];
    nextRef.current = drawPiece();
    holdRef.current = null;
    canHoldRef.current = true;
    scoreRef.current = 0;
    linesRef.current = 0;
    levelRef.current = 1;
    comboRef.current = -1;
    particlesRef.current = [];
    clearingRef.current = null;
    shakeRef.current = 0;
    setScore(0);
    setLines(0);
    setLevel(1);
    stateRef.current = "playing";
    setDisplayState("playing");
    spawn();
  }, [drawPiece, spawn]);

  const togglePause = useCallback(() => {
    if (stateRef.current === "playing") {
      stateRef.current = "paused";
      setDisplayState("paused");
    } else if (stateRef.current === "paused") {
      stateRef.current = "playing";
      setDisplayState("playing");
    }
  }, []);

  const startOrResume = useCallback(() => {
    const s = stateRef.current;
    if (s === "idle" || s === "gameover") startGame();
    else if (s === "paused") {
      stateRef.current = "playing";
      setDisplayState("playing");
    }
  }, [startGame]);

  // ── Keyboard input ───────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const playing = stateRef.current === "playing";
      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          if (playing) { e.preventDefault(); keysRef.current.left = true; }
          break;
        case "ArrowRight":
        case "KeyD":
          if (playing) { e.preventDefault(); keysRef.current.right = true; }
          break;
        case "ArrowDown":
        case "KeyS":
          if (playing) { e.preventDefault(); softRef.current = true; }
          break;
        case "ArrowUp":
        case "KeyX":
          if (playing) { e.preventDefault(); rotate(1); }
          break;
        case "KeyZ":
          if (playing) { e.preventDefault(); rotate(-1); }
          break;
        case "Space":
          e.preventDefault();
          if (playing) hardDrop();
          else startOrResume();
          break;
        case "KeyC":
        case "ShiftLeft":
        case "ShiftRight":
          if (playing) { e.preventDefault(); hold(); }
          break;
        case "KeyP":
        case "Escape":
          if (stateRef.current === "playing" || stateRef.current === "paused") {
            e.preventDefault();
            togglePause();
          }
          break;
      }
    }
    function onUp(e: KeyboardEvent) {
      if (e.code === "ArrowLeft" || e.code === "KeyA") keysRef.current.left = false;
      if (e.code === "ArrowRight" || e.code === "KeyD") keysRef.current.right = false;
      if (e.code === "ArrowDown" || e.code === "KeyS") softRef.current = false;
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onUp);
    };
  }, [rotate, hardDrop, hold, togglePause, startOrResume]);

  // ── Main loop ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function roundRect(x: number, y: number, w: number, h: number, r: number) {
      ctx!.beginPath();
      ctx!.roundRect(x, y, w, h, r);
    }

    function neonCell(
      x: number,
      y: number,
      size: number,
      color: string,
      glow: string,
      ghost: boolean,
    ) {
      const c = ctx!;
      c.save();
      if (ghost) {
        c.globalAlpha = 0.16;
        c.fillStyle = color;
        roundRect(x + 2, y + 2, size - 4, size - 4, 5);
        c.fill();
        c.globalAlpha = 0.65;
        c.lineWidth = 2;
        c.strokeStyle = color;
        roundRect(x + 2, y + 2, size - 4, size - 4, 5);
        c.stroke();
      } else {
        c.shadowColor = glow;
        c.shadowBlur = 10;
        c.fillStyle = color;
        roundRect(x + 1, y + 1, size - 2, size - 2, 5);
        c.fill();
        c.shadowBlur = 0;
        c.fillStyle = "rgba(255,255,255,0.28)";
        roundRect(x + 3, y + 3, size - 6, (size - 6) * 0.42, 3);
        c.fill();
        c.fillStyle = "rgba(0,0,0,0.14)";
        roundRect(x + 3, y + size * 0.58, size - 6, (size - 6) * 0.34, 3);
        c.fill();
      }
      c.restore();
    }

    function drawMini(ox: number, oy: number, type: PieceType, dim: boolean) {
      const d = PIECES[type];
      const m = 22;
      const off = ((4 - d.box) / 2) * m;
      for (const [cx, cy] of d.rotations[0]) {
        if (dim) ctx!.globalAlpha = 0.4;
        neonCell(ox + off + cx * m, oy + cy * m, m, d.color, d.glow, false);
        ctx!.globalAlpha = 1;
      }
    }

    function drawPanel() {
      const c = ctx!;
      const px = WELL_W + 18;
      c.textAlign = "left";
      c.fillStyle = "rgba(255,255,255,0.5)";
      c.font = "bold 12px 'Outfit', sans-serif";
      c.fillText("NEXT", px, 24);
      drawMini(px, 32, nextRef.current, false);

      c.fillStyle = "rgba(255,255,255,0.5)";
      c.fillText("HOLD", px, 148);
      if (holdRef.current) {
        drawMini(px, 156, holdRef.current, !canHoldRef.current);
      } else {
        c.strokeStyle = "rgba(255,255,255,0.12)";
        c.lineWidth = 1;
        c.strokeRect(px, 156, 4 * 22, 3 * 22);
      }

      let sy = 296;
      const stat = (label: string, val: number, color: string) => {
        c.fillStyle = "rgba(255,255,255,0.4)";
        c.font = "bold 11px 'Outfit', sans-serif";
        c.fillText(label, px, sy);
        c.fillStyle = color;
        c.font = "bold 22px 'Outfit', sans-serif";
        c.fillText(val.toLocaleString(), px, sy + 23);
        sy += 56;
      };
      stat("SCORE", scoreRef.current, "#22d3ee");
      stat("LINES", linesRef.current, "#22c55e");
      stat("LEVEL", levelRef.current, "#a855f7");
      stat("BEST", bestRef.current, "#fbbf24");

      if (comboRef.current >= 1) {
        c.fillStyle = "#ff6b6b";
        c.font = "bold 14px 'Outfit', sans-serif";
        c.fillText(`COMBO ×${comboRef.current}`, px, sy + 2);
      }
    }

    function update() {
      if (shakeRef.current > 0) shakeRef.current--;

      const parts = particlesRef.current;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life--;
        if (p.life <= 0) parts.splice(i, 1);
      }

      if (stateRef.current !== "playing") return;

      if (clearingRef.current) {
        clearingRef.current.t--;
        if (clearingRef.current.t <= 0) {
          boardRef.current = clearRows(boardRef.current, clearingRef.current.rows);
          clearingRef.current = null;
          spawn();
        }
        return;
      }

      const a = curRef.current;
      if (!a) return;

      // Horizontal auto-repeat (DAS).
      const dir = keysRef.current.left ? -1 : keysRef.current.right ? 1 : 0;
      if (dir !== dasRef.current.prev) {
        dasRef.current.prev = dir;
        dasRef.current.timer = 0;
        if (dir !== 0) move(dir);
      } else if (dir !== 0) {
        dasRef.current.timer++;
        if (
          dasRef.current.timer >= DAS_DELAY &&
          (dasRef.current.timer - DAS_DELAY) % DAS_REPEAT === 0
        ) {
          move(dir);
        }
      }

      // Gravity / lock.
      const grounded = collides(boardRef.current, a.type, a.rot, a.x, a.y + 1);
      if (grounded) {
        lockRef.current++;
        if (lockRef.current >= LOCK_DELAY) lockNow();
      } else {
        lockRef.current = 0;
        gravityRef.current++;
        const threshold = softRef.current ? SOFT_FRAMES : dropFrames(levelRef.current);
        if (gravityRef.current >= threshold) {
          gravityRef.current = 0;
          a.y++;
          if (softRef.current) {
            scoreRef.current++;
            setScore(scoreRef.current);
          }
        }
      }
    }

    function draw() {
      const c = ctx!;
      const sx = shakeRef.current > 0 ? (Math.random() - 0.5) * shakeRef.current : 0;
      const sy = shakeRef.current > 0 ? (Math.random() - 0.5) * shakeRef.current : 0;

      c.clearRect(0, 0, CANVAS_W, CANVAS_H);
      const bg = c.createLinearGradient(0, 0, 0, CANVAS_H);
      bg.addColorStop(0, "#0b1020");
      bg.addColorStop(0.5, "#121633");
      bg.addColorStop(1, "#0a0f1f");
      c.fillStyle = bg;
      c.fillRect(0, 0, CANVAS_W, CANVAS_H);

      c.save();
      c.translate(sx, sy);

      // Well background + grid.
      c.fillStyle = "rgba(6,9,20,0.66)";
      c.fillRect(0, 0, WELL_W, WELL_H);
      c.strokeStyle = "rgba(255,255,255,0.04)";
      c.lineWidth = 1;
      for (let x = 1; x < COLS; x++) {
        c.beginPath();
        c.moveTo(x * CELL, 0);
        c.lineTo(x * CELL, WELL_H);
        c.stroke();
      }
      for (let y = 1; y < ROWS; y++) {
        c.beginPath();
        c.moveTo(0, y * CELL);
        c.lineTo(WELL_W, y * CELL);
        c.stroke();
      }

      // Locked cells.
      const board = boardRef.current;
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const t = board[y][x];
          if (t) {
            const d = PIECES[t];
            neonCell(x * CELL, y * CELL, CELL, d.color, d.glow, false);
          }
        }
      }

      // Ghost + active piece.
      const a = curRef.current;
      if (stateRef.current === "playing" && a && !clearingRef.current) {
        const d = PIECES[a.type];
        const gy = dropTo(board, a);
        if (gy !== a.y) {
          for (const [cx, cy] of cellsOf(a.type, a.rot, a.x, gy)) {
            if (cy >= 0) neonCell(cx * CELL, cy * CELL, CELL, d.color, d.glow, true);
          }
        }
        for (const [cx, cy] of cellsOf(a.type, a.rot, a.x, a.y)) {
          if (cy >= 0) neonCell(cx * CELL, cy * CELL, CELL, d.color, d.glow, false);
        }
      }

      // Line-clear flash.
      if (clearingRef.current) {
        const prog = clearingRef.current.t / CLEAR_FLASH;
        c.fillStyle = `rgba(255,255,255,${0.2 + 0.6 * prog})`;
        for (const ry of clearingRef.current.rows) {
          c.fillRect(0, ry * CELL, WELL_W, CELL);
        }
      }

      // Particles.
      for (const p of particlesRef.current) {
        c.globalAlpha = Math.max(0, p.life / p.maxLife);
        c.fillStyle = p.color;
        c.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      c.globalAlpha = 1;

      // Well border.
      c.strokeStyle = "rgba(34,211,238,0.45)";
      c.lineWidth = 2;
      c.strokeRect(1, 1, WELL_W - 2, WELL_H - 2);

      drawPanel();
      c.restore();
    }

    let raf = 0;
    function frame() {
      update();
      draw();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [move, lockNow, spawn]);

  // ── Touch / click control helpers ────────────────────────────────────────
  const holdKey = (which: "left" | "right") => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      keysRef.current[which] = true;
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      keysRef.current[which] = false;
    },
    onPointerLeave: () => {
      keysRef.current[which] = false;
    },
  });

  const softHandlers = {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      softRef.current = true;
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      softRef.current = false;
    },
    onPointerLeave: () => {
      softRef.current = false;
    },
  };

  const tap = (fn: () => void) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      fn();
    },
  });

  const btnClass =
    "select-none rounded-xl bg-white/5 border border-white/10 text-white/80 py-3 text-base font-bold active:bg-cyan-400/20 active:border-cyan-400/40 transition-colors";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center w-full py-4 select-none">
      <div ref={wrapperRef} className="relative" style={{ touchAction: "none" }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            width: CANVAS_W * scale,
            height: CANVAS_H * scale,
            display: "block",
            borderRadius: 12,
            boxShadow: "0 10px 40px rgba(34,211,238,0.12)",
          }}
        />

        {/* Idle overlay */}
        {displayState === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[2px] rounded-xl">
            <div className="rounded-2xl border border-cyan-400/40 bg-[#0b1020]/85 px-8 py-7 text-center shadow-2xl">
              <p className="text-5xl mb-3">🟦</p>
              <p className="text-xl font-bold text-white mb-1">Cascade</p>
              <p className="text-sm text-cyan-300 mb-4">
                Stack the blocks · clear the lines
              </p>
              <button
                className="rounded-full bg-cyan-400 px-6 py-2 text-sm font-bold text-[#0b1020] shadow-lg hover:brightness-110 transition"
                onClick={startGame}
              >
                Start
              </button>
              {best > 0 && (
                <p className="mt-3 text-xs text-white/60">
                  Best: <span className="font-bold text-amber-400">{best.toLocaleString()}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Paused overlay */}
        {displayState === "paused" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] rounded-xl">
            <div className="rounded-2xl border border-cyan-400/40 bg-[#0b1020]/85 px-8 py-7 text-center shadow-2xl">
              <p className="text-lg font-bold text-white mb-4">Paused</p>
              <button
                className="rounded-full bg-cyan-400 px-6 py-2 text-sm font-bold text-[#0b1020] shadow-lg hover:brightness-110 transition"
                onClick={togglePause}
              >
                Resume
              </button>
            </div>
          </div>
        )}

        {/* Game over overlay */}
        {displayState === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] rounded-xl animate-fade-in">
            <div className="rounded-2xl border border-cyan-400/40 bg-[#0b1020]/90 px-8 py-7 text-center shadow-2xl">
              <p className="text-lg font-bold text-white mb-3">Game Over</p>
              <div className="flex gap-5 mb-2 justify-center">
                <div>
                  <p className="text-xs text-white/50">Score</p>
                  <p className="text-2xl font-bold text-cyan-300">{score.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Lines</p>
                  <p className="text-2xl font-bold text-green-400">{lines}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Best</p>
                  <p className="text-2xl font-bold text-amber-400">{best.toLocaleString()}</p>
                </div>
              </div>
              {score >= best && score > 0 && (
                <p className="text-xs font-bold text-amber-400 mb-3">★ New best!</p>
              )}
              <button
                className="mt-2 rounded-full bg-cyan-400 px-6 py-2 text-sm font-bold text-[#0b1020] shadow-lg hover:brightness-110 transition"
                onClick={startGame}
              >
                Play again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Touch / click controls */}
      <div
        className="mt-4 grid grid-cols-3 gap-2"
        style={{ width: Math.min(CANVAS_W * scale, 440), maxWidth: "100%" }}
      >
        <button className={btnClass} aria-label="Move left" {...holdKey("left")}>◀</button>
        <button className={btnClass} aria-label="Rotate" {...tap(() => rotate(1))}>⟳</button>
        <button className={btnClass} aria-label="Move right" {...holdKey("right")}>▶</button>
        <button className={btnClass} aria-label="Hold piece" {...tap(hold)}>HOLD</button>
        <button className={btnClass} aria-label="Soft drop" {...softHandlers}>⤓</button>
        <button className={btnClass} aria-label="Hard drop" {...tap(hardDrop)}>⬇ DROP</button>
      </div>

      {/* Desktop hint */}
      <p className="mt-3 text-[11px] text-text-dim text-center max-w-md">
        ← → move · ↑/X rotate · Z rotate ccw · ↓ soft drop · Space hard drop · C hold · P pause
      </p>
    </div>
  );
}
