// ── Constants ──────────────────────────────────────────────
export const CANVAS_W = 800;
export const CANVAS_H = 400;
export const GROUND_Y = 370;
export const SLIME_RADIUS = 38;
export const BALL_RADIUS = 12;
export const NET_HEIGHT = 70;
export const NET_WIDTH = 6;
export const NET_X = CANVAS_W / 2;
export const GRAVITY = 0.25;
export const JUMP_VEL = -8;
export const MOVE_SPEED = 4.5;
export const MAX_SCORE = 7;
export const BALL_DAMPING = 1.0;
export const BOUNCE_FACTOR = 0.9;
export const MAX_BALL_SPEED = 15;

// ── Types ──────────────────────────────────────────────────
export interface PlayerInput {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export interface SlimeState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface GameState {
  p1: SlimeState;
  p2: SlimeState;
  ball: BallState;
  score: [number, number];
  serving: 1 | 2;
  countdown: number; // frames until ball drops (0 = live)
  winner: 0 | 1 | 2; // 0 = no winner yet
  rallyPause: number; // brief pause after a point
}

// ── Helpers ────────────────────────────────────────────────
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

// ── Create initial state ──────────────────────────────────
export function createInitialState(): GameState {
  return {
    p1: { x: CANVAS_W * 0.25, y: GROUND_Y, vx: 0, vy: 0 },
    p2: { x: CANVAS_W * 0.75, y: GROUND_Y, vx: 0, vy: 0 },
    ball: { x: CANVAS_W * 0.25, y: 100, vx: 0, vy: 0 },
    score: [0, 0],
    serving: 1,
    countdown: 90,
    winner: 0,
    rallyPause: 0,
  };
}

function resetPositions(state: GameState): void {
  state.p1.x = CANVAS_W * 0.25;
  state.p1.y = GROUND_Y;
  state.p1.vx = 0;
  state.p1.vy = 0;
  state.p2.x = CANVAS_W * 0.75;
  state.p2.y = GROUND_Y;
  state.p2.vx = 0;
  state.p2.vy = 0;

  const serveX = state.serving === 1 ? CANVAS_W * 0.25 : CANVAS_W * 0.75;
  state.ball.x = serveX;
  state.ball.y = 100;
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.countdown = 60;
}

// ── Update one frame ──────────────────────────────────────
export function updateGame(
  state: GameState,
  p1Input: PlayerInput,
  p2Input: PlayerInput
): GameState {
  if (state.winner !== 0) return state;

  // Rally pause (brief freeze after a point)
  if (state.rallyPause > 0) {
    state.rallyPause--;
    if (state.rallyPause === 0) resetPositions(state);
    return state;
  }

  // Countdown before serve
  if (state.countdown > 0) {
    state.countdown--;
    // Position ball above server during countdown
    const serveX = state.serving === 1 ? state.p1.x : state.p2.x;
    state.ball.x = serveX;
    state.ball.y = 100;
    state.ball.vx = 0;
    state.ball.vy = 0;
    // Still allow movement during countdown
    updateSlime(state.p1, p1Input, SLIME_RADIUS, NET_X - NET_WIDTH / 2 - SLIME_RADIUS);
    updateSlime(state.p2, p2Input, NET_X + NET_WIDTH / 2 + SLIME_RADIUS, CANVAS_W - SLIME_RADIUS);
    return state;
  }

  // Update slimes
  updateSlime(state.p1, p1Input, SLIME_RADIUS, NET_X - NET_WIDTH / 2 - SLIME_RADIUS);
  updateSlime(state.p2, p2Input, NET_X + NET_WIDTH / 2 + SLIME_RADIUS, CANVAS_W - SLIME_RADIUS);

  // Update ball physics
  state.ball.vy += GRAVITY;
  state.ball.x += state.ball.vx;
  state.ball.y += state.ball.vy;

  // Clamp ball speed
  const speed = Math.sqrt(state.ball.vx ** 2 + state.ball.vy ** 2);
  if (speed > MAX_BALL_SPEED) {
    state.ball.vx = (state.ball.vx / speed) * MAX_BALL_SPEED;
    state.ball.vy = (state.ball.vy / speed) * MAX_BALL_SPEED;
  }

  // Ball-slime collisions
  collideBallSlime(state.ball, state.p1);
  collideBallSlime(state.ball, state.p2);

  // Ball-net collision
  collideBallNet(state.ball);

  // Ball-wall collisions
  if (state.ball.x - BALL_RADIUS < 0) {
    state.ball.x = BALL_RADIUS;
    state.ball.vx = Math.abs(state.ball.vx) * BOUNCE_FACTOR;
  }
  if (state.ball.x + BALL_RADIUS > CANVAS_W) {
    state.ball.x = CANVAS_W - BALL_RADIUS;
    state.ball.vx = -Math.abs(state.ball.vx) * BOUNCE_FACTOR;
  }
  // Ceiling
  if (state.ball.y - BALL_RADIUS < 0) {
    state.ball.y = BALL_RADIUS;
    state.ball.vy = Math.abs(state.ball.vy) * BOUNCE_FACTOR;
  }

  // Ball hits ground → score
  if (state.ball.y + BALL_RADIUS >= GROUND_Y) {
    if (state.ball.x < CANVAS_W / 2) {
      // Ball landed on P1's side → P2 scores
      state.score[1]++;
      state.serving = 1; // ball goes to player who lost the point
    } else {
      // Ball landed on P2's side → P1 scores
      state.score[0]++;
      state.serving = 2;
    }

    // Check for winner
    if (state.score[0] >= MAX_SCORE) {
      state.winner = 1;
    } else if (state.score[1] >= MAX_SCORE) {
      state.winner = 2;
    } else {
      state.rallyPause = 40; // brief pause
    }

    // Stop ball
    state.ball.vy = 0;
    state.ball.vx = 0;
    state.ball.y = GROUND_Y - BALL_RADIUS;
  }

  return state;
}

function updateSlime(
  slime: SlimeState,
  input: PlayerInput,
  minX: number,
  maxX: number
): void {
  // Horizontal movement
  slime.vx = 0;
  if (input.left) slime.vx = -MOVE_SPEED;
  if (input.right) slime.vx = MOVE_SPEED;
  slime.x += slime.vx;

  // Jump
  if (input.jump && slime.y >= GROUND_Y) {
    slime.vy = JUMP_VEL;
  }

  // Gravity
  slime.vy += GRAVITY;
  slime.y += slime.vy;

  // Ground constraint
  if (slime.y > GROUND_Y) {
    slime.y = GROUND_Y;
    slime.vy = 0;
  }

  // Horizontal bounds
  slime.x = clamp(slime.x, minX, maxX);
}

function collideBallSlime(ball: BallState, slime: SlimeState): void {
  const dx = ball.x - slime.x;
  const dy = ball.y - slime.y;
  const d = dist(ball.x, ball.y, slime.x, slime.y);
  const minDist = BALL_RADIUS + SLIME_RADIUS;

  if (d < minDist && d > 0 && ball.y <= slime.y) {
    // Normal vector from slime center to ball center
    const nx = dx / d;
    const ny = dy / d;

    // Push ball out of slime
    ball.x = slime.x + nx * minDist;
    ball.y = slime.y + ny * minDist;

    // Relative velocity
    const relVx = ball.vx - slime.vx;
    const relVy = ball.vy - slime.vy;
    const dot = relVx * nx + relVy * ny;

    // Only bounce if moving toward each other
    if (dot < 0) {
      ball.vx -= 2 * dot * nx;
      ball.vy -= 2 * dot * ny;

      // Add some of slime's velocity to the ball
      ball.vx += slime.vx * 0.5;
      ball.vy += slime.vy * 0.3;

      // Damping
      ball.vx *= BALL_DAMPING;
      ball.vy *= BALL_DAMPING;
    }
  }
}

function collideBallNet(ball: BallState): void {
  const netLeft = NET_X - NET_WIDTH / 2;
  const netRight = NET_X + NET_WIDTH / 2;
  const netTop = GROUND_Y - NET_HEIGHT;

  // Only check if ball is near the net
  if (
    ball.y + BALL_RADIUS > netTop &&
    ball.y - BALL_RADIUS < GROUND_Y
  ) {
    // Ball coming from left
    if (
      ball.x + BALL_RADIUS > netLeft &&
      ball.x - BALL_RADIUS < netRight
    ) {
      // Top of net collision
      if (ball.y - BALL_RADIUS < netTop + BALL_RADIUS && ball.vy > 0) {
        ball.y = netTop - BALL_RADIUS;
        ball.vy = -Math.abs(ball.vy) * BOUNCE_FACTOR;
        return;
      }

      // Side collision
      if (ball.vx > 0 && ball.x < NET_X) {
        ball.x = netLeft - BALL_RADIUS;
        ball.vx = -Math.abs(ball.vx) * BOUNCE_FACTOR;
      } else if (ball.vx < 0 && ball.x > NET_X) {
        ball.x = netRight + BALL_RADIUS;
        ball.vx = Math.abs(ball.vx) * BOUNCE_FACTOR;
      }
    }
  }
}

// ── Rendering ─────────────────────────────────────────────
const P1_COLOR = "#FF6B6B";
const P1_DARK = "#cc5555";
const P2_COLOR = "#4ECDC4";
const P2_DARK = "#3ba89f";
const BALL_COLOR = "#f0ece2";
const GROUND_COLOR = "#1e2a3a";
const NET_COLOR = "rgba(255,255,255,0.3)";

export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  localPlayer: 1 | 2
): void {
  const { p1, p2, ball, score, countdown, winner } = state;

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, "#0d0d1a");
  grad.addColorStop(1, "#1a1a2e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Ground
  ctx.fillStyle = GROUND_COLOR;
  ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);
  // Ground line
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(CANVAS_W, GROUND_Y);
  ctx.stroke();

  // Net
  ctx.fillStyle = NET_COLOR;
  ctx.fillRect(NET_X - NET_WIDTH / 2, GROUND_Y - NET_HEIGHT, NET_WIDTH, NET_HEIGHT);
  // Net top cap
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(NET_X - NET_WIDTH / 2 - 2, GROUND_Y - NET_HEIGHT - 2, NET_WIDTH + 4, 4);

  // Draw slimes
  drawSlime(ctx, p1, P1_COLOR, P1_DARK, ball);
  drawSlime(ctx, p2, P2_COLOR, P2_DARK, ball);

  // "YOU" label
  const localSlime = localPlayer === 1 ? p1 : p2;
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "bold 11px 'Outfit', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("YOU", localSlime.x, localSlime.y - SLIME_RADIUS - 14);

  // Ball shadow
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath();
  ctx.ellipse(ball.x, GROUND_Y + 2, BALL_RADIUS * 0.8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ball
  ctx.fillStyle = BALL_COLOR;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  // Ball shine
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.beginPath();
  ctx.arc(ball.x - 3, ball.y - 3, BALL_RADIUS * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Score
  ctx.font = "bold 48px 'Outfit', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,107,107,0.3)";
  ctx.fillText(String(score[0]), CANVAS_W * 0.25, 55);
  ctx.fillStyle = "rgba(78,205,196,0.3)";
  ctx.fillText(String(score[1]), CANVAS_W * 0.75, 55);

  // Countdown
  if (countdown > 0) {
    const sec = Math.ceil(countdown / 60);
    ctx.font = "bold 64px 'Outfit', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.textAlign = "center";
    ctx.fillText(String(sec), CANVAS_W / 2, CANVAS_H / 2);
  }

  // Winner overlay
  if (winner !== 0) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const isLocalWinner = winner === localPlayer;
    ctx.font = "bold 42px 'Outfit', sans-serif";
    ctx.fillStyle = isLocalWinner ? "#FF6B6B" : "#8a8a9a";
    ctx.textAlign = "center";
    ctx.fillText(
      isLocalWinner ? "You Win!" : "You Lose",
      CANVAS_W / 2,
      CANVAS_H / 2 - 10
    );
    ctx.font = "16px 'Outfit', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(
      `${score[0]} – ${score[1]}`,
      CANVAS_W / 2,
      CANVAS_H / 2 + 25
    );

    // "Back to Menu" button
    const btnW = 160, btnH = 40;
    const btnX = CANVAS_W / 2 - btnW / 2;
    const btnY = CANVAS_H / 2 + 50;
    ctx.fillStyle = "rgba(255,107,107,0.9)";
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 20);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px 'Outfit', sans-serif";
    ctx.fillText("Back to Menu", CANVAS_W / 2, btnY + 26);
  }
}

function drawSlime(
  ctx: CanvasRenderingContext2D,
  slime: SlimeState,
  color: string,
  darkColor: string,
  ball: BallState
): void {
  // Body (semicircle)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(slime.x, slime.y, SLIME_RADIUS, Math.PI, 0, false);
  ctx.closePath();
  ctx.fill();

  // Darker bottom edge
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(slime.x - SLIME_RADIUS, slime.y);
  ctx.lineTo(slime.x + SLIME_RADIUS, slime.y);
  ctx.stroke();

  // Eye (looks toward ball)
  const eyeOffsetX = 6;
  const eyeOffsetY = -12;
  const eyeX = slime.x + eyeOffsetX;
  const eyeY = slime.y + eyeOffsetY;
  const eyeRadius = 7;

  // Eye white
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Pupil (tracks ball)
  const dx = ball.x - eyeX;
  const dy = ball.y - eyeY;
  const angle = Math.atan2(dy, dx);
  const pupilDist = 3;
  ctx.fillStyle = "#1a1a2e";
  ctx.beginPath();
  ctx.arc(
    eyeX + Math.cos(angle) * pupilDist,
    eyeY + Math.sin(angle) * pupilDist,
    3.5,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

// ── Serialization (for network sync) ──────────────────────
export interface SerializedState {
  p1: SlimeState;
  p2: SlimeState;
  ball: BallState;
  score: [number, number];
  serving: 1 | 2;
  countdown: number;
  winner: 0 | 1 | 2;
  rallyPause: number;
}

export function serializeState(state: GameState): SerializedState {
  return {
    p1: { ...state.p1 },
    p2: { ...state.p2 },
    ball: { ...state.ball },
    score: [...state.score] as [number, number],
    serving: state.serving,
    countdown: state.countdown,
    winner: state.winner,
    rallyPause: state.rallyPause,
  };
}

export function deserializeState(data: SerializedState): GameState {
  return {
    p1: { ...data.p1 },
    p2: { ...data.p2 },
    ball: { ...data.ball },
    score: [...data.score] as [number, number],
    serving: data.serving,
    countdown: data.countdown,
    winner: data.winner,
    rallyPause: data.rallyPause,
  };
}
