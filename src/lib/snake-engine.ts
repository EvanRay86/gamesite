// ── Snake Arena Engine ──────────────────────────────────────
// Pure game logic — no networking or DOM dependencies

// ── Constants ──────────────────────────────────────────────
export const GRID_W = 60;
export const GRID_H = 60;
export const TICK_RATE = 6; // ticks per second
export const TICK_MS = Math.round(1000 / TICK_RATE);
export const GAME_DURATION_TICKS = 3 * 60 * TICK_RATE; // 3 minutes
export const RESPAWN_TICKS = 5 * TICK_RATE; // 5 seconds
export const MAX_SNAKE_LENGTH = 50;
export const INITIAL_LENGTH = 3;
export const VIEWPORT_SIZE = 30; // cells visible around player

export const SNAKE_COLORS = [
  "#FF6B6B", // coral
  "#4ECDC4", // teal
  "#45B7D1", // sky
  "#F7B731", // amber
  "#A855F7", // purple
  "#22C55E", // green
  "#F472B6", // pink
  "#FB923C", // orange
  "#38BDF8", // light blue
  "#FACC15", // yellow
];

// ── Types ──────────────────────────────────────────────────
export type Direction = 0 | 1 | 2 | 3; // UP, RIGHT, DOWN, LEFT
export const DIR_UP: Direction = 0;
export const DIR_RIGHT: Direction = 1;
export const DIR_DOWN: Direction = 2;
export const DIR_LEFT: Direction = 3;

const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];

export interface Segment {
  x: number;
  y: number;
}

export interface SnakePlayer {
  id: string;
  segments: Segment[]; // head is index 0
  direction: Direction;
  nextDirection: Direction;
  score: number;
  alive: boolean;
  respawnTimer: number;
  colorIndex: number;
  name: string;
}

export interface FoodItem {
  x: number;
  y: number;
  value: number; // 1 = normal, 3 = big (player death drop)
}

export interface SnakeGameState {
  players: Record<string, SnakePlayer>;
  food: FoodItem[];
  gridW: number;
  gridH: number;
  tick: number;
  gameOver: boolean;
  timeRemaining: number;
}

// ── Create game ────────────────────────────────────────────
export function createSnakeGame(): SnakeGameState {
  return {
    players: {},
    food: [],
    gridW: GRID_W,
    gridH: GRID_H,
    tick: 0,
    gameOver: false,
    timeRemaining: GAME_DURATION_TICKS,
  };
}

// ── Player management ──────────────────────────────────────
let nextColorIndex = 0;

export function addPlayer(
  state: SnakeGameState,
  playerId: string,
  name: string
): void {
  if (state.players[playerId]) return;

  const spawn = findSafeSpawn(state);
  const segments: Segment[] = [];
  for (let i = 0; i < INITIAL_LENGTH; i++) {
    segments.push({ x: spawn.x, y: spawn.y + i }); // facing up
  }

  state.players[playerId] = {
    id: playerId,
    segments,
    direction: DIR_UP,
    nextDirection: DIR_UP,
    score: 0,
    alive: true,
    respawnTimer: 0,
    colorIndex: nextColorIndex++ % SNAKE_COLORS.length,
    name,
  };

  // Spawn initial food if this is the first player
  const targetFood = getTargetFoodCount(state);
  while (state.food.length < targetFood) {
    spawnFood(state, 1);
  }
}

export function removePlayer(state: SnakeGameState, playerId: string): void {
  delete state.players[playerId];
}

// ── Input ──────────────────────────────────────────────────
const OPPOSITE: Record<Direction, Direction> = {
  [DIR_UP]: DIR_DOWN,
  [DIR_DOWN]: DIR_UP,
  [DIR_LEFT]: DIR_RIGHT,
  [DIR_RIGHT]: DIR_LEFT,
};

export function setPlayerDirection(
  state: SnakeGameState,
  playerId: string,
  direction: Direction
): void {
  const player = state.players[playerId];
  if (!player || !player.alive) return;
  // Reject 180-degree reversals
  if (direction === OPPOSITE[player.direction]) return;
  player.nextDirection = direction;
}

// ── Tick ────────────────────────────────────────────────────
export function tickGame(state: SnakeGameState): void {
  if (state.gameOver) return;

  state.tick++;
  state.timeRemaining--;
  if (state.timeRemaining <= 0) {
    state.gameOver = true;
    return;
  }

  const alivePlayers = Object.values(state.players).filter((p) => p.alive);

  // Apply buffered directions
  for (const p of alivePlayers) {
    p.direction = p.nextDirection;
  }

  // Move heads
  for (const p of alivePlayers) {
    const head = p.segments[0];
    const nx = ((head.x + DX[p.direction]) % state.gridW + state.gridW) % state.gridW;
    const ny = ((head.y + DY[p.direction]) % state.gridH + state.gridH) % state.gridH;
    p.segments.unshift({ x: nx, y: ny });
  }

  // Build occupancy map for collision detection (body cells only, not heads)
  const bodyMap = new Map<string, string>(); // "x,y" -> playerId
  for (const p of alivePlayers) {
    // Skip head (index 0), map body segments
    for (let i = 1; i < p.segments.length; i++) {
      const s = p.segments[i];
      bodyMap.set(`${s.x},${s.y}`, p.id);
    }
  }

  // Collect deaths this tick
  const deaths = new Set<string>();

  // Head-to-body collisions
  for (const p of alivePlayers) {
    const head = p.segments[0];
    const key = `${head.x},${head.y}`;
    const hitOwner = bodyMap.get(key);
    if (hitOwner !== undefined) {
      // Snake p's head hit someone's body
      deaths.add(p.id);
    }
  }

  // Head-to-head collisions
  const headPositions = new Map<string, string[]>(); // "x,y" -> [playerIds]
  for (const p of alivePlayers) {
    const head = p.segments[0];
    const key = `${head.x},${head.y}`;
    const existing = headPositions.get(key) || [];
    existing.push(p.id);
    headPositions.set(key, existing);
  }
  for (const [, ids] of headPositions) {
    if (ids.length > 1) {
      for (const id of ids) deaths.add(id);
    }
  }

  // Process deaths
  for (const id of deaths) {
    killPlayer(state, id);
  }

  // Check food collisions (only for still-alive players)
  for (const p of Object.values(state.players)) {
    if (!p.alive) continue;
    const head = p.segments[0];
    const foodIdx = state.food.findIndex(
      (f) => f.x === head.x && f.y === head.y
    );
    if (foodIdx !== -1) {
      const food = state.food[foodIdx];
      p.score += food.value;
      state.food.splice(foodIdx, 1);

      // Grow: keep the extra segment (we already added head, just don't pop tail)
      // For value > 1, add extra growth by duplicating tail
      for (let i = 1; i < food.value; i++) {
        if (p.segments.length < MAX_SNAKE_LENGTH) {
          const tail = p.segments[p.segments.length - 1];
          p.segments.push({ x: tail.x, y: tail.y });
        }
      }

      // Cap length
      if (p.segments.length > MAX_SNAKE_LENGTH) {
        p.segments.length = MAX_SNAKE_LENGTH;
      }
    } else {
      // No food eaten — pop tail to maintain length
      p.segments.pop();
    }
  }

  // Handle respawn timers
  for (const p of Object.values(state.players)) {
    if (!p.alive && p.respawnTimer > 0) {
      p.respawnTimer--;
      if (p.respawnTimer <= 0) {
        respawnPlayer(state, p);
      }
    }
  }

  // Spawn food to maintain target count
  const targetFood = getTargetFoodCount(state);
  while (state.food.length < targetFood) {
    spawnFood(state, 1);
  }
}

// ── Kill / Respawn ─────────────────────────────────────────
function killPlayer(state: SnakeGameState, playerId: string): void {
  const player = state.players[playerId];
  if (!player || !player.alive) return;

  player.alive = false;
  player.respawnTimer = RESPAWN_TICKS;

  // Drop body as food (every 3rd segment becomes big food, others small)
  for (let i = 0; i < player.segments.length; i++) {
    const seg = player.segments[i];
    // Don't stack food on existing food
    if (!state.food.some((f) => f.x === seg.x && f.y === seg.y)) {
      state.food.push({
        x: seg.x,
        y: seg.y,
        value: i % 3 === 0 ? 3 : 1,
      });
    }
  }

  player.segments = [];
}

function respawnPlayer(state: SnakeGameState, player: SnakePlayer): void {
  const spawn = findSafeSpawn(state);
  player.segments = [];
  for (let i = 0; i < INITIAL_LENGTH; i++) {
    player.segments.push({ x: spawn.x, y: spawn.y + i });
  }
  player.direction = DIR_UP;
  player.nextDirection = DIR_UP;
  player.alive = true;
  player.respawnTimer = 0;
}

// ── Helpers ────────────────────────────────────────────────
function getTargetFoodCount(state: SnakeGameState): number {
  const playerCount = Object.keys(state.players).length;
  return Math.floor(playerCount * 3) + 5;
}

function spawnFood(state: SnakeGameState, value: number): void {
  const occupied = new Set<string>();
  for (const p of Object.values(state.players)) {
    for (const s of p.segments) occupied.add(`${s.x},${s.y}`);
  }
  for (const f of state.food) occupied.add(`${f.x},${f.y}`);

  // Try random positions
  for (let attempt = 0; attempt < 100; attempt++) {
    const x = Math.floor(Math.random() * state.gridW);
    const y = Math.floor(Math.random() * state.gridH);
    if (!occupied.has(`${x},${y}`)) {
      state.food.push({ x, y, value });
      return;
    }
  }
}

function findSafeSpawn(state: SnakeGameState): Segment {
  const occupied = new Set<string>();
  for (const p of Object.values(state.players)) {
    for (const s of p.segments) {
      // Add a buffer zone around existing snakes
      for (let dx = -3; dx <= 3; dx++) {
        for (let dy = -3; dy <= 3; dy++) {
          const wx = ((s.x + dx) % state.gridW + state.gridW) % state.gridW;
          const wy = ((s.y + dy) % state.gridH + state.gridH) % state.gridH;
          occupied.add(`${wx},${wy}`);
        }
      }
    }
  }

  for (let attempt = 0; attempt < 200; attempt++) {
    const x = Math.floor(Math.random() * state.gridW);
    const y = Math.floor(Math.random() * state.gridH);
    if (!occupied.has(`${x},${y}`)) {
      return { x, y };
    }
  }

  // Fallback
  return {
    x: Math.floor(Math.random() * state.gridW),
    y: Math.floor(Math.random() * state.gridH),
  };
}

// ── Serialization ──────────────────────────────────────────
export interface SerializedSnakeState {
  p: Record<
    string,
    {
      s: number[]; // flat [x,y,x,y,...] for segments
      d: Direction;
      sc: number;
      a: number; // alive 0/1
      rt: number; // respawnTimer
      ci: number; // colorIndex
      n: string; // name
    }
  >;
  f: number[]; // flat [x,y,value, x,y,value, ...]
  t: number; // tick
  tr: number; // timeRemaining
  go: number; // gameOver 0/1
}

export function serializeState(state: SnakeGameState): SerializedSnakeState {
  const p: SerializedSnakeState["p"] = {};
  for (const [id, player] of Object.entries(state.players)) {
    const s: number[] = [];
    for (const seg of player.segments) {
      s.push(seg.x, seg.y);
    }
    p[id] = {
      s,
      d: player.direction,
      sc: player.score,
      a: player.alive ? 1 : 0,
      rt: player.respawnTimer,
      ci: player.colorIndex,
      n: player.name,
    };
  }

  const f: number[] = [];
  for (const food of state.food) {
    f.push(food.x, food.y, food.value);
  }

  return {
    p,
    f,
    t: state.tick,
    tr: state.timeRemaining,
    go: state.gameOver ? 1 : 0,
  };
}

export function deserializeState(data: SerializedSnakeState): SnakeGameState {
  const players: Record<string, SnakePlayer> = {};
  for (const [id, pd] of Object.entries(data.p)) {
    const segments: Segment[] = [];
    for (let i = 0; i < pd.s.length; i += 2) {
      segments.push({ x: pd.s[i], y: pd.s[i + 1] });
    }
    players[id] = {
      id,
      segments,
      direction: pd.d,
      nextDirection: pd.d,
      score: pd.sc,
      alive: pd.a === 1,
      respawnTimer: pd.rt,
      colorIndex: pd.ci,
      name: pd.n,
    };
  }

  const food: FoodItem[] = [];
  for (let i = 0; i < data.f.length; i += 3) {
    food.push({ x: data.f[i], y: data.f[i + 1], value: data.f[i + 2] });
  }

  return {
    players,
    food,
    gridW: GRID_W,
    gridH: GRID_H,
    tick: data.t,
    gameOver: data.go === 1,
    timeRemaining: data.tr,
  };
}

// ── Rendering ──────────────────────────────────────────────
// renderT: 0..1 progress between ticks for smooth interpolation

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// Smoothly lerp between two world positions, handling grid wrapping
function lerpWrapped(a: number, b: number, t: number, gridSize: number): number {
  let diff = b - a;
  if (diff > gridSize / 2) diff -= gridSize;
  if (diff < -gridSize / 2) diff += gridSize;
  return a + diff * t;
}

// Smooth camera position (stored between frames)
let smoothCamX = 30;
let smoothCamY = 30;

export function renderSnakeGame(
  ctx: CanvasRenderingContext2D,
  state: SnakeGameState,
  localPlayerId: string,
  canvasW: number,
  canvasH: number,
  renderT: number = 0
): void {
  const now = performance.now();
  const cellSize = Math.min(canvasW, canvasH) / VIEWPORT_SIZE;
  const viewCells = Math.ceil(Math.max(canvasW, canvasH) / cellSize) + 4;

  // ── Camera with smooth follow ────────────────────────────
  const localPlayer = state.players[localPlayerId];
  let targetCamX = state.gridW / 2;
  let targetCamY = state.gridH / 2;
  if (localPlayer && localPlayer.segments.length > 0) {
    const head = localPlayer.segments[0];
    // Interpolate head position toward next cell
    targetCamX = lerpWrapped(
      localPlayer.segments.length > 1 ? localPlayer.segments[1].x : head.x,
      head.x,
      Math.min(1, renderT + 0.3),
      state.gridW
    );
    targetCamY = lerpWrapped(
      localPlayer.segments.length > 1 ? localPlayer.segments[1].y : head.y,
      head.y,
      Math.min(1, renderT + 0.3),
      state.gridH
    );
  }
  // Smooth camera lerp (prevents jarring snaps)
  smoothCamX = lerpWrapped(smoothCamX, targetCamX, 0.15, state.gridW);
  smoothCamY = lerpWrapped(smoothCamY, targetCamY, 0.15, state.gridH);
  const camX = smoothCamX;
  const camY = smoothCamY;

  // ── World-to-screen helper ───────────────────────────────
  function toScreen(wx: number, wy: number): { sx: number; sy: number } | null {
    let dx = wx - camX;
    let dy = wy - camY;
    if (dx > state.gridW / 2) dx -= state.gridW;
    if (dx < -state.gridW / 2) dx += state.gridW;
    if (dy > state.gridH / 2) dy -= state.gridH;
    if (dy < -state.gridH / 2) dy += state.gridH;
    if (Math.abs(dx) > viewCells / 2 || Math.abs(dy) > viewCells / 2) return null;
    return { sx: canvasW / 2 + dx * cellSize, sy: canvasH / 2 + dy * cellSize };
  }

  // Interpolated world position to screen
  function toScreenLerp(
    prevX: number, prevY: number, curX: number, curY: number, t: number
  ): { sx: number; sy: number } | null {
    const ix = lerpWrapped(prevX, curX, t, state.gridW);
    const iy = lerpWrapped(prevY, curY, t, state.gridH);
    return toScreen(ix, iy);
  }

  // ── Background gradient ──────────────────────────────────
  const bgGrad = ctx.createRadialGradient(
    canvasW / 2, canvasH / 2, 0,
    canvasW / 2, canvasH / 2, canvasW * 0.8
  );
  bgGrad.addColorStop(0, "#111827");
  bgGrad.addColorStop(0.6, "#0a0e1a");
  bgGrad.addColorStop(1, "#050810");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // ── Grid dots (subtle, like graph paper) ─────────────────
  const dotR = Math.max(0.5, cellSize * 0.04);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  const startGX = Math.floor(camX - viewCells / 2) - 1;
  const startGY = Math.floor(camY - viewCells / 2) - 1;
  for (let gxi = 0; gxi <= viewCells + 1; gxi++) {
    for (let gyi = 0; gyi <= viewCells + 1; gyi++) {
      const gx = ((startGX + gxi) % state.gridW + state.gridW) % state.gridW;
      const gy = ((startGY + gyi) % state.gridH + state.gridH) % state.gridH;
      const pos = toScreen(gx, gy);
      if (!pos) continue;
      ctx.beginPath();
      ctx.arc(pos.sx, pos.sy, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Draw food with glow + pulse ──────────────────────────
  const pulse = Math.sin(now * 0.004) * 0.15 + 0.85; // 0.7 - 1.0
  const bigPulse = Math.sin(now * 0.006) * 0.2 + 0.8;

  for (const food of state.food) {
    const pos = toScreen(food.x, food.y);
    if (!pos) continue;

    const cx = pos.sx + cellSize / 2;
    const cy = pos.sy + cellSize / 2;
    const isBig = food.value >= 3;
    const baseR = isBig ? cellSize * 0.35 : cellSize * 0.2;
    const r = baseR * (isBig ? bigPulse : pulse);
    const color = isBig ? "#FACC15" : "#34D399";
    const rgb = hexToRgb(color);

    // Outer glow
    const glowGrad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 2.5);
    glowGrad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${isBig ? 0.25 : 0.12})`);
    glowGrad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Core
    const coreGrad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r);
    coreGrad.addColorStop(0, "#fff");
    coreGrad.addColorStop(0.3, color);
    coreGrad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0.6)`);
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Draw snakes ──────────────────────────────────────────
  const sortedPlayers = Object.values(state.players).sort((a, b) => {
    if (a.id === localPlayerId) return 1;
    if (b.id === localPlayerId) return -1;
    return 0;
  });

  for (const player of sortedPlayers) {
    if (!player.alive || player.segments.length === 0) continue;

    const color = SNAKE_COLORS[player.colorIndex % SNAKE_COLORS.length];
    const rgb = hexToRgb(color);
    const isLocal = player.id === localPlayerId;
    const segCount = player.segments.length;

    // Build interpolated screen positions for each segment
    const screenSegs: { sx: number; sy: number }[] = [];
    for (let i = 0; i < segCount; i++) {
      const cur = player.segments[i];
      // For interpolation: previous position is the next segment (body follows head)
      const prev = i === 0
        ? (segCount > 1 ? player.segments[1] : cur)
        : player.segments[Math.min(i + 1, segCount - 1)];
      // Head interpolates forward (current direction), body follows previous segment
      let pos: { sx: number; sy: number } | null;
      if (i === 0) {
        // Head: interpolate from previous position toward current
        const prevX = cur.x - DX[player.direction];
        const prevY = cur.y - DY[player.direction];
        pos = toScreenLerp(prevX, prevY, cur.x, cur.y, renderT);
      } else {
        // Body: interpolate from next-in-chain toward current
        pos = toScreenLerp(prev.x, prev.y, cur.x, cur.y, renderT);
      }
      if (pos) screenSegs.push(pos);
      else if (screenSegs.length > 0) break; // stop at first off-screen after started
    }

    if (screenSegs.length === 0) continue;

    // ── Snake body glow ───────────────────────────────────
    if (isLocal) {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = cellSize * 0.8;
      // Draw a thin line along the snake for the glow
      ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.3)`;
      ctx.lineWidth = cellSize * 0.6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(screenSegs[0].sx + cellSize / 2, screenSegs[0].sy + cellSize / 2);
      for (let i = 1; i < screenSegs.length; i++) {
        ctx.lineTo(screenSegs[i].sx + cellSize / 2, screenSegs[i].sy + cellSize / 2);
      }
      ctx.stroke();
      ctx.restore();
    }

    // ── Snake body (smooth connected circles) ─────────────
    // Draw from tail to head so head is on top
    for (let i = screenSegs.length - 1; i >= 0; i--) {
      const seg = screenSegs[i];
      const cx = seg.sx + cellSize / 2;
      const cy = seg.sy + cellSize / 2;
      const isHead = i === 0;
      const progress = i / Math.max(1, segCount - 1); // 0=head, 1=tail

      // Size tapers toward tail
      const sizeMul = isHead ? 0.48 : 0.44 - progress * 0.1;
      const r = cellSize * Math.max(0.25, sizeMul);

      // Gradient per segment
      const segGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
      const alpha = 1 - progress * 0.4;
      segGrad.addColorStop(0, `rgba(${Math.min(255, rgb.r + 60)},${Math.min(255, rgb.g + 60)},${Math.min(255, rgb.b + 60)},${alpha})`);
      segGrad.addColorStop(0.7, `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`);
      segGrad.addColorStop(1, `rgba(${Math.max(0, rgb.r - 30)},${Math.max(0, rgb.g - 30)},${Math.max(0, rgb.b - 30)},${alpha * 0.8})`);

      ctx.fillStyle = segGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Subtle highlight on top
      if (isHead || i % 3 === 0) {
        ctx.fillStyle = `rgba(255,255,255,${isHead ? 0.15 : 0.06})`;
        ctx.beginPath();
        ctx.arc(cx - r * 0.2, cy - r * 0.25, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Eyes on head ──────────────────────────────────────
    const headSeg = screenSegs[0];
    const hcx = headSeg.sx + cellSize / 2;
    const hcy = headSeg.sy + cellSize / 2;
    const eyeOff = cellSize * 0.18;
    const eyeR = cellSize * 0.1;
    const pupilR = cellSize * 0.055;

    let e1x: number, e1y: number, e2x: number, e2y: number;
    if (player.direction === DIR_UP) {
      e1x = hcx - eyeOff; e1y = hcy - eyeOff * 0.6;
      e2x = hcx + eyeOff; e2y = hcy - eyeOff * 0.6;
    } else if (player.direction === DIR_DOWN) {
      e1x = hcx - eyeOff; e1y = hcy + eyeOff * 0.6;
      e2x = hcx + eyeOff; e2y = hcy + eyeOff * 0.6;
    } else if (player.direction === DIR_LEFT) {
      e1x = hcx - eyeOff * 0.6; e1y = hcy - eyeOff;
      e2x = hcx - eyeOff * 0.6; e2y = hcy + eyeOff;
    } else {
      e1x = hcx + eyeOff * 0.6; e1y = hcy - eyeOff;
      e2x = hcx + eyeOff * 0.6; e2y = hcy + eyeOff;
    }

    // Eye whites with slight gradient
    for (const [ex, ey] of [[e1x, e1y], [e2x, e2y]]) {
      const eyeGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, eyeR);
      eyeGrad.addColorStop(0, "#fff");
      eyeGrad.addColorStop(1, "#ddd");
      ctx.fillStyle = eyeGrad;
      ctx.beginPath();
      ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pupils
    const pdx = DX[player.direction] * pupilR * 0.6;
    const pdy = DY[player.direction] * pupilR * 0.6;
    ctx.fillStyle = "#111";
    for (const [ex, ey] of [[e1x, e1y], [e2x, e2y]]) {
      ctx.beginPath();
      ctx.arc(ex + pdx, ey + pdy, pupilR, 0, Math.PI * 2);
      ctx.fill();
      // Tiny white reflection
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.arc(ex + pdx + pupilR * 0.3, ey + pdy - pupilR * 0.3, pupilR * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111";
    }

    // ── Name label with shadow ────────────────────────────
    const labelY = headSeg.sy - cellSize * 0.4;
    const labelX = headSeg.sx + cellSize / 2;
    const label = isLocal ? "YOU" : player.name;
    ctx.font = `bold ${Math.max(10, cellSize * 0.55)}px 'Outfit', sans-serif`;
    ctx.textAlign = "center";
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillText(label, labelX + 1, labelY + 1);
    // Text
    ctx.fillStyle = isLocal ? "#fff" : "rgba(255,255,255,0.65)";
    ctx.fillText(label, labelX, labelY);

    // Score badge next to name
    ctx.font = `${Math.max(8, cellSize * 0.4)}px 'Outfit', sans-serif`;
    ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.7)`;
    ctx.fillText(`${player.score}`, labelX, labelY + cellSize * 0.5 * -0.2 - cellSize * 0.55);
  }

  // ── Vignette overlay ─────────────────────────────────────
  const vigGrad = ctx.createRadialGradient(
    canvasW / 2, canvasH / 2, canvasW * 0.3,
    canvasW / 2, canvasH / 2, canvasW * 0.75
  );
  vigGrad.addColorStop(0, "rgba(0,0,0,0)");
  vigGrad.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // ── Minimap ──────────────────────────────────────────────
  const mmSize = Math.min(130, canvasW * 0.22);
  const mmX = canvasW - mmSize - 12;
  const mmY = canvasH - mmSize - 12;
  const mmScale = mmSize / state.gridW;

  // Glassmorphism background
  ctx.fillStyle = "rgba(10,15,30,0.6)";
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(mmX - 2, mmY - 2, mmSize + 4, mmSize + 4, 8);
  ctx.fill();
  ctx.stroke();

  // Food dots
  for (const food of state.food) {
    ctx.fillStyle = food.value >= 3
      ? "rgba(250,204,21,0.6)"
      : "rgba(52,211,153,0.4)";
    ctx.beginPath();
    ctx.arc(
      mmX + food.x * mmScale + mmScale / 2,
      mmY + food.y * mmScale + mmScale / 2,
      Math.max(0.8, mmScale * 0.5),
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // Snake dots
  for (const player of Object.values(state.players)) {
    if (!player.alive || player.segments.length === 0) continue;
    const c = SNAKE_COLORS[player.colorIndex % SNAKE_COLORS.length];
    const isLoc = player.id === localPlayerId;
    ctx.fillStyle = isLoc ? "#fff" : c;
    ctx.globalAlpha = isLoc ? 1 : 0.7;
    for (const seg of player.segments) {
      ctx.beginPath();
      ctx.arc(
        mmX + seg.x * mmScale + mmScale / 2,
        mmY + seg.y * mmScale + mmScale / 2,
        Math.max(1, mmScale * (isLoc ? 1 : 0.8)),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ── Scoreboard (glassmorphism panel) ─────────────────────
  const sortedByScore = Object.values(state.players)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (sortedByScore.length > 0) {
    const sbW = 170;
    const sbH = 28 + sortedByScore.length * 24;
    const sbX = canvasW - sbW - 12;
    const sbY = 12;

    ctx.fillStyle = "rgba(10,15,30,0.6)";
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(sbX, sbY, sbW, sbH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "bold 9px 'Outfit', sans-serif";
    ctx.textAlign = "left";
    ctx.letterSpacing = "1px";
    ctx.fillText("LEADERBOARD", sbX + 12, sbY + 18);
    ctx.letterSpacing = "0px";

    for (let i = 0; i < sortedByScore.length; i++) {
      const p = sortedByScore[i];
      const y = sbY + 40 + i * 24;
      const c = SNAKE_COLORS[p.colorIndex % SNAKE_COLORS.length];
      const isLoc = p.id === localPlayerId;

      // Rank number
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.font = "bold 10px 'Outfit', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${i + 1}`, sbX + 10, y);

      // Color dot
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(sbX + 26, y - 3, 4, 0, Math.PI * 2);
      ctx.fill();

      // Name
      ctx.fillStyle = isLoc ? "#fff" : "rgba(255,255,255,0.55)";
      ctx.font = `${isLoc ? "bold " : ""}11px 'Outfit', sans-serif`;
      ctx.fillText(isLoc ? "You" : p.name, sbX + 36, y);

      // Score
      ctx.fillStyle = isLoc ? c : "rgba(255,255,255,0.4)";
      ctx.font = "bold 11px 'Outfit', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(String(p.score), sbX + sbW - 12, y);
      ctx.textAlign = "left";
    }
  }

  // ── Timer (top-center, pill shape) ───────────────────────
  const secsLeft = Math.ceil(state.timeRemaining / TICK_RATE);
  const mins = Math.floor(secsLeft / 60);
  const secs = secsLeft % 60;
  const timerStr = `${mins}:${secs.toString().padStart(2, "0")}`;
  const isUrgent = secsLeft <= 30;

  const timerW = 80;
  const timerH = 30;
  const timerX = canvasW / 2 - timerW / 2;
  const timerY = 10;

  ctx.fillStyle = isUrgent ? "rgba(255,60,60,0.2)" : "rgba(10,15,30,0.5)";
  ctx.strokeStyle = isUrgent ? "rgba(255,107,107,0.4)" : "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(timerX, timerY, timerW, timerH, 15);
  ctx.fill();
  ctx.stroke();

  ctx.font = "bold 14px 'Outfit', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = isUrgent ? "#FF6B6B" : "rgba(255,255,255,0.7)";
  ctx.fillText(timerStr, canvasW / 2, timerY + 20);

  // ── "You died" overlay ───────────────────────────────────
  if (localPlayer && !localPlayer.alive) {
    const respawnSecs = Math.ceil(localPlayer.respawnTimer / TICK_RATE);

    // Full-screen darkening
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Centered pill
    const dw = 300;
    const dh = 50;
    const dx = canvasW / 2 - dw / 2;
    const dy = canvasH / 2 - dh / 2;
    ctx.fillStyle = "rgba(20,0,0,0.7)";
    ctx.strokeStyle = "rgba(255,107,107,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(dx, dy, dw, dh, 25);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FF6B6B";
    ctx.font = "bold 16px 'Outfit', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Respawning in ${respawnSecs}s...`, canvasW / 2, canvasH / 2 + 6);
  }

  // ── Game over overlay ────────────────────────────────────
  if (state.gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Title
    ctx.fillStyle = "#fff";
    ctx.font = "bold 34px 'Outfit', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvasW / 2, canvasH / 2 - 90);

    // Rankings card
    const ranked = Object.values(state.players).sort((a, b) => b.score - a.score);
    const cardW = 280;
    const cardH = 20 + ranked.length * 32;
    const cardX = canvasW / 2 - cardW / 2;
    const cardY = canvasH / 2 - 60;

    ctx.fillStyle = "rgba(15,20,35,0.8)";
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 12);
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < ranked.length; i++) {
      const p = ranked[i];
      const c = SNAKE_COLORS[p.colorIndex % SNAKE_COLORS.length];
      const isLoc = p.id === localPlayerId;
      const ry = cardY + 24 + i * 32;
      const medals = ["1st", "2nd", "3rd"];
      const medal = i < 3 ? medals[i] : `#${i + 1}`;

      // Medal / rank
      ctx.fillStyle = i === 0 ? "#FACC15" : i === 1 ? "#94A3B8" : i === 2 ? "#D97706" : "rgba(255,255,255,0.3)";
      ctx.font = "bold 12px 'Outfit', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(medal, cardX + 16, ry);

      // Color dot
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(cardX + 52, ry - 4, 5, 0, Math.PI * 2);
      ctx.fill();

      // Name
      ctx.fillStyle = isLoc ? "#fff" : "rgba(255,255,255,0.7)";
      ctx.font = `${isLoc ? "bold " : ""}14px 'Outfit', sans-serif`;
      ctx.fillText(isLoc ? "You" : p.name, cardX + 64, ry);

      // Score
      ctx.fillStyle = c;
      ctx.font = "bold 14px 'Outfit', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${p.score} pts`, cardX + cardW - 16, ry);
      ctx.textAlign = "left";
    }
  }
}

// ── Rankings helper ────────────────────────────────────────
export function getRankings(state: SnakeGameState): Array<{ name: string; score: number; colorIndex: number; id: string }> {
  return Object.values(state.players)
    .sort((a, b) => b.score - a.score)
    .map((p) => ({ name: p.name, score: p.score, colorIndex: p.colorIndex, id: p.id }));
}
