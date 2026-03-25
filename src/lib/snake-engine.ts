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
const BG_COLOR = "#0d0d1a";
const GRID_LINE_COLOR = "rgba(255,255,255,0.03)";
const FOOD_COLOR = "#22C55E";
const BIG_FOOD_COLOR = "#FACC15";

export function renderSnakeGame(
  ctx: CanvasRenderingContext2D,
  state: SnakeGameState,
  localPlayerId: string,
  canvasW: number,
  canvasH: number
): void {
  const cellSize = Math.floor(Math.min(canvasW, canvasH) / VIEWPORT_SIZE);
  const viewCells = Math.ceil(Math.max(canvasW, canvasH) / cellSize) + 2;

  // Determine camera center
  const localPlayer = state.players[localPlayerId];
  let camX = state.gridW / 2;
  let camY = state.gridH / 2;
  if (localPlayer && localPlayer.segments.length > 0) {
    camX = localPlayer.segments[0].x;
    camY = localPlayer.segments[0].y;
  }

  // Background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Calculate offset for camera centering
  const offsetX = canvasW / 2 - camX * cellSize;
  const offsetY = canvasH / 2 - camY * cellSize;

  // Helper: world to screen with wrapping
  function toScreen(wx: number, wy: number): { sx: number; sy: number } | null {
    // Handle wrapping — find the closest representation
    let dx = wx - camX;
    let dy = wy - camY;
    if (dx > state.gridW / 2) dx -= state.gridW;
    if (dx < -state.gridW / 2) dx += state.gridW;
    if (dy > state.gridH / 2) dy -= state.gridH;
    if (dy < -state.gridH / 2) dy += state.gridH;

    // Cull if outside viewport
    if (Math.abs(dx) > viewCells / 2 || Math.abs(dy) > viewCells / 2) return null;

    return {
      sx: canvasW / 2 + dx * cellSize,
      sy: canvasH / 2 + dy * cellSize,
    };
  }

  // Grid lines
  ctx.strokeStyle = GRID_LINE_COLOR;
  ctx.lineWidth = 1;
  const startGX = Math.floor(camX - viewCells / 2);
  const startGY = Math.floor(camY - viewCells / 2);
  for (let i = 0; i <= viewCells; i++) {
    const gx = ((startGX + i) % state.gridW + state.gridW) % state.gridW;
    const pos = toScreen(gx, camY);
    if (pos) {
      ctx.beginPath();
      ctx.moveTo(pos.sx, 0);
      ctx.lineTo(pos.sx, canvasH);
      ctx.stroke();
    }
    const gy = ((startGY + i) % state.gridH + state.gridH) % state.gridH;
    const pos2 = toScreen(camX, gy);
    if (pos2) {
      ctx.beginPath();
      ctx.moveTo(0, pos2.sy);
      ctx.lineTo(canvasW, pos2.sy);
      ctx.stroke();
    }
  }

  // Draw food
  for (const food of state.food) {
    const pos = toScreen(food.x, food.y);
    if (!pos) continue;

    const radius = food.value >= 3 ? cellSize * 0.4 : cellSize * 0.25;
    ctx.fillStyle = food.value >= 3 ? BIG_FOOD_COLOR : FOOD_COLOR;
    ctx.globalAlpha = food.value >= 3 ? 0.9 : 0.7;
    ctx.beginPath();
    ctx.arc(pos.sx + cellSize / 2, pos.sy + cellSize / 2, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Draw snakes
  const sortedPlayers = Object.values(state.players).sort((a, b) => {
    // Draw local player last (on top)
    if (a.id === localPlayerId) return 1;
    if (b.id === localPlayerId) return -1;
    return 0;
  });

  for (const player of sortedPlayers) {
    if (!player.alive || player.segments.length === 0) continue;

    const color = SNAKE_COLORS[player.colorIndex % SNAKE_COLORS.length];
    const isLocal = player.id === localPlayerId;

    // Draw body segments
    for (let i = player.segments.length - 1; i >= 0; i--) {
      const seg = player.segments[i];
      const pos = toScreen(seg.x, seg.y);
      if (!pos) continue;

      const isHead = i === 0;
      const padding = isHead ? 0 : 1;

      ctx.fillStyle = isHead ? color : color;
      ctx.globalAlpha = isHead ? 1 : 0.85 - (i / player.segments.length) * 0.3;
      ctx.beginPath();
      ctx.roundRect(
        pos.sx + padding,
        pos.sy + padding,
        cellSize - padding * 2,
        cellSize - padding * 2,
        isHead ? cellSize * 0.35 : cellSize * 0.2
      );
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Draw eyes on head
    const head = player.segments[0];
    const headPos = toScreen(head.x, head.y);
    if (headPos) {
      const cx = headPos.sx + cellSize / 2;
      const cy = headPos.sy + cellSize / 2;
      const eyeOff = cellSize * 0.2;
      const eyeR = cellSize * 0.12;
      const pupilR = cellSize * 0.06;

      // Position eyes based on direction
      let e1x: number, e1y: number, e2x: number, e2y: number;
      if (player.direction === DIR_UP) {
        e1x = cx - eyeOff; e1y = cy - eyeOff * 0.5;
        e2x = cx + eyeOff; e2y = cy - eyeOff * 0.5;
      } else if (player.direction === DIR_DOWN) {
        e1x = cx - eyeOff; e1y = cy + eyeOff * 0.5;
        e2x = cx + eyeOff; e2y = cy + eyeOff * 0.5;
      } else if (player.direction === DIR_LEFT) {
        e1x = cx - eyeOff * 0.5; e1y = cy - eyeOff;
        e2x = cx - eyeOff * 0.5; e2y = cy + eyeOff;
      } else {
        e1x = cx + eyeOff * 0.5; e1y = cy - eyeOff;
        e2x = cx + eyeOff * 0.5; e2y = cy + eyeOff;
      }

      // Eye whites
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(e1x, e1y, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(e2x, e2y, eyeR, 0, Math.PI * 2);
      ctx.fill();

      // Pupils — look in movement direction
      const pdx = DX[player.direction] * pupilR * 0.5;
      const pdy = DY[player.direction] * pupilR * 0.5;
      ctx.fillStyle = "#1a1a2e";
      ctx.beginPath();
      ctx.arc(e1x + pdx, e1y + pdy, pupilR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(e2x + pdx, e2y + pdy, pupilR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player name label
    if (headPos) {
      ctx.fillStyle = isLocal ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.5)";
      ctx.font = `bold ${Math.max(10, cellSize * 0.6)}px 'Outfit', sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(
        isLocal ? "YOU" : player.name,
        headPos.sx + cellSize / 2,
        headPos.sy - cellSize * 0.3
      );
    }
  }

  // Minimap
  const mmSize = Math.min(120, canvasW * 0.2);
  const mmX = canvasW - mmSize - 10;
  const mmY = canvasH - mmSize - 10;
  const mmScale = mmSize / state.gridW;

  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(mmX, mmY, mmSize, mmSize, 4);
  ctx.fill();
  ctx.stroke();

  // Minimap food
  ctx.fillStyle = "rgba(34,197,94,0.5)";
  for (const food of state.food) {
    ctx.fillRect(
      mmX + food.x * mmScale,
      mmY + food.y * mmScale,
      Math.max(1, mmScale),
      Math.max(1, mmScale)
    );
  }

  // Minimap snakes
  for (const player of Object.values(state.players)) {
    if (!player.alive || player.segments.length === 0) continue;
    const color = SNAKE_COLORS[player.colorIndex % SNAKE_COLORS.length];
    ctx.fillStyle = player.id === localPlayerId ? "#fff" : color;
    for (const seg of player.segments) {
      ctx.fillRect(
        mmX + seg.x * mmScale,
        mmY + seg.y * mmScale,
        Math.max(1, mmScale * 1.5),
        Math.max(1, mmScale * 1.5)
      );
    }
  }

  // Scoreboard (top-right)
  const sortedByScore = Object.values(state.players)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (sortedByScore.length > 0) {
    const sbW = 160;
    const sbH = 24 + sortedByScore.length * 22;
    const sbX = canvasW - sbW - 10;
    const sbY = 10;

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.roundRect(sbX, sbY, sbW, sbH, 6);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "bold 11px 'Outfit', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("LEADERBOARD", sbX + 10, sbY + 16);

    for (let i = 0; i < sortedByScore.length; i++) {
      const p = sortedByScore[i];
      const y = sbY + 36 + i * 22;
      const color = SNAKE_COLORS[p.colorIndex % SNAKE_COLORS.length];
      const isLocal = p.id === localPlayerId;

      // Color dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sbX + 16, y - 3, 4, 0, Math.PI * 2);
      ctx.fill();

      // Name
      ctx.fillStyle = isLocal ? "#fff" : "rgba(255,255,255,0.6)";
      ctx.font = `${isLocal ? "bold" : ""} 12px 'Outfit', sans-serif`;
      ctx.textAlign = "left";
      const displayName = isLocal ? "You" : p.name;
      ctx.fillText(displayName, sbX + 26, y);

      // Score
      ctx.textAlign = "right";
      ctx.fillText(String(p.score), sbX + sbW - 10, y);
    }
  }

  // Timer (top-center)
  const secsLeft = Math.ceil(state.timeRemaining / TICK_RATE);
  const mins = Math.floor(secsLeft / 60);
  const secs = secsLeft % 60;
  const timerStr = `${mins}:${secs.toString().padStart(2, "0")}`;

  ctx.font = "bold 20px 'Outfit', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle =
    secsLeft <= 30
      ? "rgba(255,107,107,0.8)"
      : "rgba(255,255,255,0.6)";
  ctx.fillText(timerStr, canvasW / 2, 28);

  // "You died" overlay
  if (localPlayer && !localPlayer.alive) {
    const respawnSecs = Math.ceil(localPlayer.respawnTimer / TICK_RATE);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(0, canvasH / 2 - 30, canvasW, 60);
    ctx.fillStyle = "rgba(255,107,107,0.9)";
    ctx.font = "bold 22px 'Outfit', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`You died! Respawning in ${respawnSecs}s...`, canvasW / 2, canvasH / 2 + 7);
  }

  // Game over overlay
  if (state.gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvasW, canvasH);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 36px 'Outfit', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Game Over!", canvasW / 2, canvasH / 2 - 80);

    // Final rankings
    const ranked = Object.values(state.players).sort(
      (a, b) => b.score - a.score
    );
    ctx.font = "18px 'Outfit', sans-serif";
    for (let i = 0; i < ranked.length; i++) {
      const p = ranked[i];
      const color = SNAKE_COLORS[p.colorIndex % SNAKE_COLORS.length];
      const isLocal = p.id === localPlayerId;
      const y = canvasH / 2 - 40 + i * 28;
      const medal = i === 0 ? "  " : i === 1 ? "  " : i === 2 ? "  " : `#${i + 1}`;
      const displayName = isLocal ? "You" : p.name;

      ctx.fillStyle = isLocal ? "#fff" : "rgba(255,255,255,0.7)";
      ctx.font = `${isLocal ? "bold " : ""}18px 'Outfit', sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(`${medal} ${displayName} — ${p.score} pts`, canvasW / 2, y);

      // Color dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(canvasW / 2 - 120, y - 5, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ── Rankings helper ────────────────────────────────────────
export function getRankings(state: SnakeGameState): Array<{ name: string; score: number; colorIndex: number; id: string }> {
  return Object.values(state.players)
    .sort((a, b) => b.score - a.score)
    .map((p) => ({ name: p.name, score: p.score, colorIndex: p.colorIndex, id: p.id }));
}
