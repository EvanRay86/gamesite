"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { shareOrCopy } from "@/lib/share";
import XShareButton from "@/components/XShareButton";

// ── Types ─────────────────────────────────────────────────────────────────────

type Board = number[][];
type Direction = "up" | "down" | "left" | "right";

interface GameState {
  board: Board;
  score: number;
  bestScore: number;
  gameOver: boolean;
  won: boolean;
  keepPlaying: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SIZE = 4;
const SAVE_KEY = "game-2048-save";

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  0: { bg: "bg-stone-200/60", text: "" },
  2: { bg: "bg-stone-100", text: "text-stone-700" },
  4: { bg: "bg-stone-200", text: "text-stone-700" },
  8: { bg: "bg-orange-300", text: "text-white" },
  16: { bg: "bg-orange-400", text: "text-white" },
  32: { bg: "bg-orange-500", text: "text-white" },
  64: { bg: "bg-red-400", text: "text-white" },
  128: { bg: "bg-amber-300", text: "text-white" },
  256: { bg: "bg-amber-400", text: "text-white" },
  512: { bg: "bg-amber-500", text: "text-white" },
  1024: { bg: "bg-amber-500", text: "text-white" },
  2048: { bg: "bg-yellow-400", text: "text-white" },
};

function getTileStyle(value: number) {
  if (value === 0) return TILE_COLORS[0];
  if (value <= 2048) return TILE_COLORS[value] ?? { bg: "bg-purple-500", text: "text-white" };
  return { bg: "bg-purple-700", text: "text-white" };
}

function getTileFontSize(value: number) {
  if (value < 100) return "text-3xl sm:text-4xl";
  if (value < 1000) return "text-2xl sm:text-3xl";
  if (value < 10000) return "text-xl sm:text-2xl";
  return "text-lg sm:text-xl";
}

// ── Board helpers ─────────────────────────────────────────────────────────────

function createEmptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

function getEmptyCells(board: Board): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) cells.push([r, c]);
    }
  }
  return cells;
}

function addRandomTile(board: Board): Board {
  const empty = getEmptyCells(board);
  if (empty.length === 0) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const next = cloneBoard(board);
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function initBoard(): Board {
  let board = createEmptyBoard();
  board = addRandomTile(board);
  board = addRandomTile(board);
  return board;
}

/** Slide a single row to the left, merging tiles. Returns [newRow, scoreGained]. */
function slideRow(row: number[]): [number[], number] {
  // Remove zeros
  const filtered = row.filter((v) => v !== 0);
  const result: number[] = [];
  let score = 0;
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2;
      result.push(merged);
      score += merged;
      i += 2;
    } else {
      result.push(filtered[i]);
      i++;
    }
  }
  while (result.length < SIZE) result.push(0);
  return [result, score];
}

function rotateBoard(board: Board): Board {
  // Rotate 90° clockwise
  const n = createEmptyBoard();
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) n[c][SIZE - 1 - r] = board[r][c];
  return n;
}

function move(board: Board, direction: Direction): { board: Board; score: number; moved: boolean } {
  let b = cloneBoard(board);
  let rotations = 0;
  switch (direction) {
    case "left":
      rotations = 0;
      break;
    case "down":
      rotations = 1;
      break;
    case "right":
      rotations = 2;
      break;
    case "up":
      rotations = 3;
      break;
  }

  // Rotate so we always slide left
  for (let i = 0; i < rotations; i++) b = rotateBoard(b);

  let totalScore = 0;
  const newBoard = createEmptyBoard();
  for (let r = 0; r < SIZE; r++) {
    const [newRow, rowScore] = slideRow(b[r]);
    newBoard[r] = newRow;
    totalScore += rowScore;
  }

  // Rotate back
  let result = newBoard;
  for (let i = 0; i < (4 - rotations) % 4; i++) result = rotateBoard(result);

  const moved = JSON.stringify(result) !== JSON.stringify(board);
  return { board: result, score: totalScore, moved };
}

function canMove(board: Board): boolean {
  // Check for empty cells
  if (getEmptyCells(board).length > 0) return true;
  // Check for adjacent equal cells
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = board[r][c];
      if (c + 1 < SIZE && board[r][c + 1] === v) return true;
      if (r + 1 < SIZE && board[r + 1][c] === v) return true;
    }
  }
  return false;
}

function hasWon(board: Board): boolean {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) if (board[r][c] >= 2048) return true;
  return false;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Game2048() {
  const [board, setBoard] = useState<Board>(createEmptyBoard);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);
  const [started, setStarted] = useState(false);

  const [copied, setCopied] = useState(false);

  // Touch handling
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Load saved state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const data = JSON.parse(saved) as Partial<GameState>;
        if (data.bestScore) setBestScore(data.bestScore);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save best score
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ bestScore }));
    } catch {
      // ignore
    }
  }, [bestScore]);

  const startGame = useCallback(() => {
    const b = initBoard();
    setBoard(b);
    setScore(0);
    setGameOver(false);
    setWon(false);
    setKeepPlaying(false);
    setStarted(true);
  }, []);

  const getShareText = useCallback(() => {
    const maxTile = Math.max(...board.flat());
    return `🎮 2048 — Score: ${score.toLocaleString()} | Best tile: ${maxTile}\nPlay at gamesite.app/arcade/2048`;
  }, [board, score]);

  const handleShare = useCallback(async () => {
    const ok = await shareOrCopy(getShareText());
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [getShareText]);

  const handleMove = useCallback(
    (direction: Direction) => {
      if (gameOver) return;
      if (won && !keepPlaying) return;

      const result = move(board, direction);
      if (!result.moved) return;

      const newBoard = addRandomTile(result.board);
      const newScore = score + result.score;
      setBoard(newBoard);
      setScore(newScore);
      if (newScore > bestScore) setBestScore(newScore);

      if (!keepPlaying && hasWon(newBoard)) {
        setWon(true);
      } else if (!canMove(newBoard)) {
        setGameOver(true);
      }
    },
    [board, score, bestScore, gameOver, won, keepPlaying],
  );

  // Keyboard input
  useEffect(() => {
    if (!started) return;
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        handleMove(dir);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [started, handleMove]);

  // Touch input — use native listeners so we can preventDefault to block page scroll
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const onTouchStart = (e: TouchEvent) => {
      if (gameOver) return;
      e.preventDefault();
      const touch = e.touches[0];
      touchStart.current = { x: touch.clientX, y: touch.clientY };
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (gameOver) return;
      e.preventDefault();
      if (!touchStart.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStart.current.x;
      const dy = touch.clientY - touchStart.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const minSwipe = 30;

      if (Math.max(absDx, absDy) < minSwipe) return;

      if (absDx > absDy) {
        handleMove(dx > 0 ? "right" : "left");
      } else {
        handleMove(dy > 0 ? "down" : "up");
      }
      touchStart.current = null;
    };

    board.addEventListener("touchstart", onTouchStart, { passive: false });
    board.addEventListener("touchend", onTouchEnd, { passive: false });
    return () => {
      board.removeEventListener("touchstart", onTouchStart);
      board.removeEventListener("touchend", onTouchEnd);
    };
  }, [handleMove, gameOver]);

  // ── Menu screen ─────────────────────────────────────────────────────────────

  if (!started) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-8 px-4">
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl font-black text-text-primary mb-3">
            2048
          </h1>
          <p className="text-text-muted text-lg">
            Slide tiles, combine numbers, reach 2048!
          </p>
        </div>

        {bestScore > 0 && (
          <div className="text-center">
            <p className="text-text-dim text-sm uppercase tracking-wider">
              Best Score
            </p>
            <p className="text-2xl font-bold text-amber-500">
              {bestScore.toLocaleString()}
            </p>
          </div>
        )}

        <button
          onClick={startGame}
          className="bg-gradient-to-br from-amber-400 to-amber-600 text-white border-none
                     px-10 py-4 rounded-full text-lg font-bold cursor-pointer w-64
                     shadow-[0_4px_24px_rgba(245,158,11,0.3)]
                     hover:scale-105 hover:shadow-[0_6px_32px_rgba(245,158,11,0.5)]
                     transition-all duration-200"
        >
          Play
        </button>

        <div className="text-text-dim text-sm text-center max-w-xs">
          <p>Use arrow keys or WASD to slide tiles.</p>
          <p>Swipe on mobile.</p>
        </div>
      </div>
    );
  }

  // ── Game screen ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 px-4 py-6 select-none">
      {/* Header */}
      <div className="w-full max-w-[420px] flex items-center justify-between">
        <h1 className="text-3xl font-black text-text-primary">2048</h1>
        <div className="flex gap-3">
          <div className="bg-stone-200 rounded-lg px-4 py-2 text-center min-w-[80px]">
            <p className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">
              Score
            </p>
            <p className="text-lg font-bold text-stone-700">
              {score.toLocaleString()}
            </p>
          </div>
          <div className="bg-stone-200 rounded-lg px-4 py-2 text-center min-w-[80px]">
            <p className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">
              Best
            </p>
            <p className="text-lg font-bold text-stone-700">
              {bestScore.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* New Game button */}
      <div className="w-full max-w-[420px] flex justify-end">
        <button
          onClick={startGame}
          className="bg-stone-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold
                     hover:bg-stone-800 transition-colors duration-150"
        >
          New Game
        </button>
      </div>

      {/* Board */}
      <div
        ref={boardRef}
        className="relative bg-stone-300 rounded-xl p-2 sm:p-3 touch-none"
      >
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {board.flatMap((row, r) =>
            row.map((value, c) => {
              const style = getTileStyle(value);
              const fontSize = getTileFontSize(value);
              return (
                <div
                  key={`${r}-${c}`}
                  className={`${style.bg} ${style.text} ${fontSize}
                    w-[72px] h-[72px] sm:w-[96px] sm:h-[96px]
                    flex items-center justify-center rounded-lg font-bold
                    transition-all duration-100`}
                >
                  {value > 0 ? value : ""}
                </div>
              );
            }),
          )}
        </div>

        {/* Win overlay */}
        {won && !keepPlaying && (
          <div className="absolute inset-0 bg-amber-400/80 rounded-xl flex flex-col items-center justify-center gap-4">
            <p className="text-4xl font-black text-white">You Win!</p>
            <div className="flex gap-3">
              <button
                onClick={handleShare}
                className="bg-white text-stone-700 px-5 py-2 rounded-lg font-bold
                           hover:bg-stone-100 transition-colors"
              >
                {copied ? "Copied!" : "Share Score"}
              </button>
              <XShareButton getText={getShareText} />
              <button
                onClick={() => setKeepPlaying(true)}
                className="bg-white text-stone-700 px-5 py-2 rounded-lg font-bold
                           hover:bg-stone-100 transition-colors"
              >
                Keep Going
              </button>
              <button
                onClick={startGame}
                className="bg-stone-700 text-white px-5 py-2 rounded-lg font-bold
                           hover:bg-stone-800 transition-colors"
              >
                New Game
              </button>
            </div>
          </div>
        )}

        {/* Game Over overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-stone-100/80 rounded-xl flex flex-col items-center justify-center gap-4">
            <p className="text-4xl font-black text-stone-700">Game Over</p>
            <p className="text-lg text-stone-500">
              Score: {score.toLocaleString()}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleShare}
                className="bg-stone-600 text-white px-5 py-2.5 rounded-lg font-bold
                           hover:bg-stone-700 transition-colors"
              >
                {copied ? "Copied!" : "Share Score"}
              </button>
              <XShareButton getText={getShareText} />
              <button
                onClick={startGame}
                className="bg-gradient-to-br from-amber-400 to-amber-600 text-white
                           px-5 py-2.5 rounded-lg font-bold
                           hover:scale-105 transition-transform"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <p className="text-text-dim text-sm mt-2">
        Arrow keys / WASD to move &bull; Swipe on mobile
      </p>
    </div>
  );
}
