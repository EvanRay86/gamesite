// Cascade — pure, React-free game logic for the neon falling-block stacker.
//
// This lives apart from the component on purpose: a hidden preview tab pauses
// requestAnimationFrame, so gameplay logic is verified with a headless Node sim
// (scripts/_cascade_sim.mjs) that imports this module directly. Keep everything
// here free of React, the DOM, and side effects.

export const COLS = 10;
export const ROWS = 20;

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

export const PIECE_TYPES: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

export interface PieceDef {
  color: string;
  glow: string;
  box: number;
  /** rotations[r] = filled [col,row] cells within the box for rotation state r */
  rotations: Array<Array<[number, number]>>;
}

// Spawn-state cells per piece, expressed inside its bounding box.
const BASE: Record<
  PieceType,
  { box: number; color: string; glow: string; cells: Array<[number, number]> }
> = {
  I: { box: 4, color: "#22d3ee", glow: "rgba(34,211,238,0.65)", cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  O: { box: 2, color: "#fbbf24", glow: "rgba(251,191,36,0.60)", cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  T: { box: 3, color: "#a855f7", glow: "rgba(168,85,247,0.60)", cells: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  S: { box: 3, color: "#22c55e", glow: "rgba(34,197,94,0.60)", cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  Z: { box: 3, color: "#ff6b6b", glow: "rgba(255,107,107,0.60)", cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  J: { box: 3, color: "#3b82f6", glow: "rgba(59,130,246,0.60)", cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  L: { box: 3, color: "#fb923c", glow: "rgba(251,146,60,0.60)", cells: [[2, 0], [0, 1], [1, 1], [2, 1]] },
};

// Rotate cells clockwise within an N×N box: (x,y) -> (N-1-y, x).
function rotateCW(cells: Array<[number, number]>, box: number): Array<[number, number]> {
  return cells.map(([x, y]) => [box - 1 - y, x] as [number, number]);
}

function buildPiece(t: PieceType): PieceDef {
  const b = BASE[t];
  const rotations: Array<Array<[number, number]>> = [];
  let cur = b.cells;
  for (let r = 0; r < 4; r++) {
    rotations.push(cur);
    cur = rotateCW(cur, b.box);
  }
  return { color: b.color, glow: b.glow, box: b.box, rotations };
}

export const PIECES: Record<PieceType, PieceDef> = {
  I: buildPiece("I"),
  O: buildPiece("O"),
  T: buildPiece("T"),
  S: buildPiece("S"),
  Z: buildPiece("Z"),
  J: buildPiece("J"),
  L: buildPiece("L"),
};

export type Board = Array<Array<PieceType | null>>;

export interface Active {
  type: PieceType;
  rot: number; // 0..3
  x: number; // box origin column
  y: number; // box origin row
}

export function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => null as PieceType | null),
  );
}

/** Absolute [col,row] cells for a piece at the given rotation/position. */
export function cellsOf(
  type: PieceType,
  rot: number,
  x: number,
  y: number,
): Array<[number, number]> {
  const r = ((rot % 4) + 4) % 4;
  return PIECES[type].rotations[r].map(
    ([cx, cy]) => [x + cx, y + cy] as [number, number],
  );
}

/** True if the piece would overlap a wall, the floor, or a locked cell. */
export function collides(
  board: Board,
  type: PieceType,
  rot: number,
  x: number,
  y: number,
): boolean {
  for (const [cx, cy] of cellsOf(type, rot, x, y)) {
    if (cx < 0 || cx >= COLS || cy >= ROWS) return true;
    if (cy >= 0 && board[cy][cx] !== null) return true;
  }
  return false;
}

/** Centered spawn column for a piece. */
export function spawnX(type: PieceType): number {
  return Math.floor((COLS - PIECES[type].box) / 2);
}

// Basic wall-kick offsets tried (in order) after a rotation.
const KICKS: Array<[number, number]> = [
  [0, 0],
  [-1, 0],
  [1, 0],
  [-2, 0],
  [2, 0],
  [0, -1],
  [-1, -1],
  [1, -1],
];

/** Attempt a rotation with simple wall kicks. Returns the new state or null. */
export function tryRotate(board: Board, a: Active, dir: 1 | -1): Active | null {
  const rot = (((a.rot + dir) % 4) + 4) % 4;
  for (const [dx, dy] of KICKS) {
    if (!collides(board, a.type, rot, a.x + dx, a.y + dy)) {
      return { type: a.type, rot, x: a.x + dx, y: a.y + dy };
    }
  }
  return null;
}

/** Returns the lowest y the piece can occupy if dropped straight down. */
export function dropTo(board: Board, a: Active): number {
  let y = a.y;
  while (!collides(board, a.type, a.rot, a.x, y + 1)) y++;
  return y;
}

/** Returns a new board with the piece's cells written in. */
export function lockPiece(board: Board, a: Active): Board {
  const nb = board.map((row) => row.slice());
  for (const [cx, cy] of cellsOf(a.type, a.rot, a.x, a.y)) {
    if (cy >= 0 && cy < ROWS && cx >= 0 && cx < COLS) nb[cy][cx] = a.type;
  }
  return nb;
}

/** Indices of every completely-filled row. */
export function fullRows(board: Board): number[] {
  const rows: number[] = [];
  for (let y = 0; y < ROWS; y++) {
    let full = true;
    for (let x = 0; x < COLS; x++) {
      if (board[y][x] === null) {
        full = false;
        break;
      }
    }
    if (full) rows.push(y);
  }
  return rows;
}

/** Remove the given rows and drop everything above down, refilling the top. */
export function clearRows(board: Board, rows: number[]): Board {
  if (rows.length === 0) return board;
  const set = new Set(rows);
  const kept = board.filter((_, y) => !set.has(y));
  const removed = ROWS - kept.length;
  const empty: Board = Array.from({ length: removed }, () =>
    Array.from({ length: COLS }, () => null as PieceType | null),
  );
  return empty.concat(kept);
}

// 7-bag randomizer: each set of 7 pieces contains each tetromino exactly once.
export function shuffledBag(rand: () => number): PieceType[] {
  const bag = PIECE_TYPES.slice();
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = bag[i];
    bag[i] = bag[j];
    bag[j] = tmp;
  }
  return bag;
}

// Base points by number of lines cleared at once (index 1..4).
export const LINE_BASE = [0, 100, 300, 500, 800];

/**
 * Points for a single line-clearing lock.
 * `combo` is the running consecutive-clear counter (0 for the first clear in a
 * streak, 1 for the second, …); each step beyond the first adds a bonus.
 */
export function clearScore(lines: number, level: number, combo: number): number {
  const base = (LINE_BASE[lines] ?? 0) * level;
  const comboBonus = combo > 0 ? 50 * combo * level : 0;
  return base + comboBonus;
}

/** Level rises every 10 cleared lines, starting at 1. */
export function levelForLines(linesTotal: number): number {
  return Math.floor(linesTotal / 10) + 1;
}

/** Frames between gravity steps at ~60fps; faster as the level climbs. */
export function dropFrames(level: number): number {
  return Math.max(4, 50 - (level - 1) * 4);
}
