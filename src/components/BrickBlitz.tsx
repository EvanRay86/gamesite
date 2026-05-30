"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ── Constants ────────────────────────────────────────────────────────────────

const CANVAS_W = 480;
const CANVAS_H = 640;

const PADDLE_BASE_W = 92;
const PADDLE_WIDE_W = 148;
const PADDLE_H = 14;
const PADDLE_Y = CANVAS_H - 46;
const PADDLE_SPEED = 9; // keyboard

const BALL_R = 8;
const MAX_BALLS = 6;
const MAX_BOUNCE = (60 * Math.PI) / 180; // 60° off vertical

const BRICK_COLS = 9;
const BRICK_MARGIN_X = 16;
const BRICK_GAP = 6;
const BRICK_TOP = 72;
const BRICK_H = 20;
const BRICK_W =
  (CANVAS_W - BRICK_MARGIN_X * 2 - BRICK_GAP * (BRICK_COLS - 1)) / BRICK_COLS;

const START_LIVES = 3;
const POWERUP_CHANCE = 0.2;
const POWERUP_FALL = 2.2;

// Timed power-up durations (frames @ ~60fps)
const GROW_FRAMES = 660;
const SLOW_FRAMES = 360;
const LASER_FRAMES = 540;
const LASER_INTERVAL = 16;
const SLOW_FACTOR = 0.55;
const SAVE_KEY = "brick-blitz-best";

// Palette
const COL_HP1 = "#4ECDC4"; // teal
const COL_HP2 = "#45B7D1"; // sky
const COL_HP3 = "#A855F7"; // purple
const COL_STEEL = "#7b8794";
const COL_PADDLE = "#4ECDC4";

function hpColor(hp: number, steel: boolean) {
  if (steel) return COL_STEEL;
  if (hp >= 3) return COL_HP3;
  if (hp === 2) return COL_HP2;
  return COL_HP1;
}

// ── Power-ups ──────────────────────────────────────────────────────────────

type PowerType = "multi" | "grow" | "slow" | "laser" | "life";

const POWERS: Record<PowerType, { color: string; label: string }> = {
  multi: { color: "#FF6B6B", label: "✦" },
  grow: { color: "#22C55E", label: "↔" },
  slow: { color: "#45B7D1", label: "≈" },
  laser: { color: "#F7B731", label: "▲" },
  life: { color: "#FF6B9D", label: "♥" },
};

const POWER_POOL: { type: PowerType; weight: number }[] = [
  { type: "multi", weight: 22 },
  { type: "grow", weight: 22 },
  { type: "slow", weight: 18 },
  { type: "laser", weight: 20 },
  { type: "life", weight: 8 },
];

function rollPower(): PowerType {
  const total = POWER_POOL.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of POWER_POOL) {
    if (r < p.weight) return p.type;
    r -= p.weight;
  }
  return "multi";
}

// ── Types ────────────────────────────────────────────────────────────────────

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];
}

interface Brick {
  x: number;
  y: number;
  hp: number;
  steel: boolean;
  alive: boolean;
}

interface PowerUp {
  x: number;
  y: number;
  type: PowerType;
}

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

interface Laser {
  x: number;
  y: number;
}

interface Star {
  x: number;
  y: number;
  r: number;
  a: number;
}

type GameState = "idle" | "ready" | "playing" | "gameover";

// ── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function ballSpeed(level: number) {
  return Math.min(4.4 + level * 0.35, 8.6);
}

// Build a fresh level's brick layout. Higher levels = more rows, tougher
// bricks, and (from level 5) occasional unbreakable steel bricks.
function buildLevel(level: number): Brick[] {
  const rows = Math.min(4 + Math.ceil(level / 1.5), 9);
  const style = level % 5;
  const bricks: Brick[] = [];

  const present = (r: number, c: number): boolean => {
    switch (style) {
      case 1: // checkerboard
        return (r + c) % 2 === 0;
      case 2: // centered pyramid
        return c >= r && c <= BRICK_COLS - 1 - r;
      case 3: // columns with a solid cap
        return c % 2 === 0 || r < 2;
      case 4: // scattered holes
        return Math.random() < 0.82;
      default: // solid
        return true;
    }
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      if (!present(r, c)) continue;
      const x = BRICK_MARGIN_X + c * (BRICK_W + BRICK_GAP);
      const y = BRICK_TOP + r * (BRICK_H + BRICK_GAP);
      // top rows are tougher; deeper levels nudge difficulty up
      let hp = clamp(1 + Math.floor((rows - 1 - r) / 2) + (level > 3 ? 1 : 0), 1, 3);
      let steel = false;
      if (level >= 5 && r === 0 && c % 4 === 0 && Math.random() < 0.6) {
        steel = true;
        hp = Infinity;
      }
      bricks.push({ x, y, hp, steel, alive: true });
    }
  }

  // Guarantee the level is clearable.
  if (!bricks.some((b) => b.alive && !b.steel)) {
    return buildLevel(1);
  }
  return bricks;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function BrickBlitz() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const frameRef = useRef(0);

  // Game state (mutable, read inside the rAF loop)
  const stateRef = useRef<GameState>("idle");
  const scoreRef = useRef(0);
  const bestRef = useRef(0);
  const levelRef = useRef(1);
  const livesRef = useRef(START_LIVES);
  const comboRef = useRef(0);

  const ballsRef = useRef<Ball[]>([]);
  const bricksRef = useRef<Brick[]>([]);
  const powerupsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lasersRef = useRef<Laser[]>([]);
  const starsRef = useRef<Star[]>([]);

  const paddleXRef = useRef(CANVAS_W / 2);
  const keysRef = useRef({ left: false, right: false });

  const growRef = useRef(0);
  const slowRef = useRef(0);
  const laserRef = useRef(0);
  const shakeRef = useRef(0);
  const bannerRef = useRef(0);
  const flashRef = useRef(0); // ball-lost red flash

  // Display state (drives React HUD/overlays)
  const [displayState, setDisplayState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(START_LIVES);
  const [combo, setCombo] = useState(0);
  const [scale, setScale] = useState(1);

  const paddleW = () => (growRef.current > 0 ? PADDLE_WIDE_W : PADDLE_BASE_W);
  const comboMult = useCallback(
    () => Math.min(1 + Math.floor(comboRef.current / 5), 6),
    [],
  );

  // Load best score
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const n = parseInt(saved, 10);
        bestRef.current = n;
        setBest(n);
      }
    } catch {}
  }, []);

  // Responsive scaling
  useEffect(() => {
    function resize() {
      if (!wrapperRef.current) return;
      const parent = wrapperRef.current.parentElement;
      if (!parent) return;
      const maxW = Math.min(parent.clientWidth - 16, CANVAS_W);
      const maxH = window.innerHeight - 220;
      const s = Math.min(maxW / CANVAS_W, maxH / CANVAS_H, 1);
      setScale(s > 0 ? s : 1);
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Starfield background (static)
  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * CANVAS_W,
        y: Math.random() * CANVAS_H,
        r: Math.random() * 1.4 + 0.3,
        a: Math.random() * 0.5 + 0.1,
      });
    }
    starsRef.current = stars;
  }, []);

  // ── Game actions ───────────────────────────────────────────────────────────

  const makeReadyBall = useCallback((): Ball => {
    return {
      x: paddleXRef.current,
      y: PADDLE_Y - BALL_R - 1,
      vx: 0,
      vy: 0,
      trail: [],
    };
  }, []);

  const startLevel = useCallback(
    (lvl: number) => {
      bricksRef.current = buildLevel(lvl);
      ballsRef.current = [makeReadyBall()];
      powerupsRef.current = [];
      lasersRef.current = [];
      particlesRef.current = [];
      growRef.current = 0;
      slowRef.current = 0;
      laserRef.current = 0;
      comboRef.current = 0;
      bannerRef.current = 110;
      stateRef.current = "ready";
      setDisplayState("ready");
      setCombo(0);
      setLevel(lvl);
    },
    [makeReadyBall],
  );

  const resetGame = useCallback(() => {
    scoreRef.current = 0;
    levelRef.current = 1;
    livesRef.current = START_LIVES;
    paddleXRef.current = CANVAS_W / 2;
    setScore(0);
    setLives(START_LIVES);
    startLevel(1);
  }, [startLevel]);

  const setBallAngle = useCallback(
    (ball: Ball, angle: number, speed: number) => {
      // Never let the ball travel perfectly vertically — a dead-straight bounce
      // can stall into an endless ceiling↔paddle loop. Enforce a small minimum
      // horizontal angle (a center hit still reads as "straight up").
      const MIN = 0.12;
      let a = angle;
      if (Math.abs(a) < MIN) {
        a = (a === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(a)) * MIN;
      }
      ball.vx = Math.sin(a) * speed;
      ball.vy = -Math.abs(Math.cos(a) * speed);
    },
    [],
  );

  const launch = useCallback(() => {
    const state = stateRef.current;
    if (state === "idle") {
      resetGame();
      return;
    }
    if (state === "gameover") {
      resetGame();
      return;
    }
    if (state === "ready") {
      const speed = ballSpeed(levelRef.current);
      for (const b of ballsRef.current) {
        setBallAngle(b, (Math.random() - 0.5) * 0.5, speed);
      }
      stateRef.current = "playing";
      setDisplayState("playing");
    }
  }, [resetGame, setBallAngle]);

  const addParticles = useCallback(
    (x: number, y: number, color: string, count: number) => {
      const arr = particlesRef.current;
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = Math.random() * 3.5 + 0.5;
        const life = Math.random() * 24 + 16;
        arr.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 1,
          life,
          maxLife: life,
          color,
          size: Math.random() * 3 + 1.5,
        });
      }
      if (arr.length > 260) arr.splice(0, arr.length - 260);
    },
    [],
  );

  const applyPower = useCallback(
    (type: PowerType) => {
      switch (type) {
        case "multi": {
          const balls = ballsRef.current;
          const speed = ballSpeed(levelRef.current);
          const added: Ball[] = [];
          for (const b of balls) {
            if (balls.length + added.length >= MAX_BALLS) break;
            for (const rot of [-0.4, 0.4]) {
              if (balls.length + added.length >= MAX_BALLS) break;
              const ang = Math.atan2(b.vx, -b.vy) + rot;
              added.push({
                x: b.x,
                y: b.y,
                vx: Math.sin(ang) * speed,
                vy: -Math.cos(ang) * speed,
                trail: [],
              });
            }
          }
          balls.push(...added);
          break;
        }
        case "grow":
          growRef.current = GROW_FRAMES;
          break;
        case "slow":
          slowRef.current = SLOW_FRAMES;
          break;
        case "laser":
          laserRef.current = LASER_FRAMES;
          break;
        case "life":
          livesRef.current += 1;
          setLives(livesRef.current);
          break;
      }
    },
    [],
  );

  // ── Input ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        launch();
      } else if (e.code === "ArrowLeft" || e.code === "KeyA") {
        keysRef.current.left = true;
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        keysRef.current.right = true;
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "ArrowLeft" || e.code === "KeyA") keysRef.current.left = false;
      if (e.code === "ArrowRight" || e.code === "KeyD") keysRef.current.right = false;
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [launch]);

  const movePaddleTo = useCallback(
    (clientX: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left) / scale;
      paddleXRef.current = clamp(x, paddleW() / 2, CANVAS_W - paddleW() / 2);
    },
    [scale],
  );

  // ── Main loop ────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    function loseLife() {
      livesRef.current -= 1;
      setLives(livesRef.current);
      shakeRef.current = 14;
      flashRef.current = 16;
      comboRef.current = 0;
      setCombo(0);
      if (livesRef.current <= 0) {
        stateRef.current = "gameover";
        setDisplayState("gameover");
        if (scoreRef.current > bestRef.current) {
          bestRef.current = scoreRef.current;
          setBest(bestRef.current);
          try {
            localStorage.setItem(SAVE_KEY, String(bestRef.current));
          } catch {}
        }
      } else {
        growRef.current = 0;
        slowRef.current = 0;
        laserRef.current = 0;
        powerupsRef.current = [];
        lasersRef.current = [];
        ballsRef.current = [makeReadyBall()];
        stateRef.current = "ready";
        setDisplayState("ready");
      }
    }

    function breakBrick(brick: Brick, hitX: number, hitY: number) {
      const wasColor = hpColor(brick.hp, brick.steel);
      brick.hp -= 1;
      if (brick.hp <= 0) {
        brick.alive = false;
        comboRef.current += 1;
        const mult = Math.min(1 + Math.floor(comboRef.current / 5), 6);
        scoreRef.current += 10 * mult;
        setScore(scoreRef.current);
        setCombo(comboRef.current);
        addParticles(hitX, hitY, wasColor, 14);
        if (Math.random() < POWERUP_CHANCE) {
          powerupsRef.current.push({ x: hitX, y: hitY, type: rollPower() });
        }
      } else {
        scoreRef.current += 2;
        setScore(scoreRef.current);
        addParticles(hitX, hitY, wasColor, 5);
      }
    }

    function reflectBrick(ball: Ball, brick: Brick) {
      const cx = clamp(ball.x, brick.x, brick.x + BRICK_W);
      const cy = clamp(ball.y, brick.y, brick.y + BRICK_H);
      const dx = ball.x - cx;
      const dy = ball.y - cy;
      if (dx * dx + dy * dy > BALL_R * BALL_R) return false;

      const overlapL = ball.x + BALL_R - brick.x;
      const overlapR = brick.x + BRICK_W - (ball.x - BALL_R);
      const overlapT = ball.y + BALL_R - brick.y;
      const overlapB = brick.y + BRICK_H - (ball.y - BALL_R);
      const minX = Math.min(overlapL, overlapR);
      const minY = Math.min(overlapT, overlapB);
      if (minX < minY) {
        ball.vx = -ball.vx;
        ball.x += ball.vx > 0 ? minX : -minX;
      } else {
        ball.vy = -ball.vy;
        ball.y += ball.vy > 0 ? minY : -minY;
      }
      return true;
    }

    function update() {
      frameRef.current++;
      const state = stateRef.current;

      // Keyboard paddle movement
      if (keysRef.current.left) paddleXRef.current -= PADDLE_SPEED;
      if (keysRef.current.right) paddleXRef.current += PADDLE_SPEED;
      paddleXRef.current = clamp(
        paddleXRef.current,
        paddleW() / 2,
        CANVAS_W - paddleW() / 2,
      );

      // Timers
      if (growRef.current > 0) growRef.current--;
      if (slowRef.current > 0) slowRef.current--;
      if (laserRef.current > 0) laserRef.current--;
      if (shakeRef.current > 0) shakeRef.current--;
      if (bannerRef.current > 0) bannerRef.current--;
      if (flashRef.current > 0) flashRef.current--;

      if (state === "ready") {
        // ball rides the paddle
        for (const b of ballsRef.current) {
          b.x = paddleXRef.current;
          b.y = PADDLE_Y - BALL_R - 1;
          b.trail = [];
        }
        return;
      }

      if (state !== "playing") return;

      const slow = slowRef.current > 0 ? SLOW_FACTOR : 1;
      const pLeft = paddleXRef.current - paddleW() / 2;
      const pRight = paddleXRef.current + paddleW() / 2;
      const speed = ballSpeed(levelRef.current);

      // Lasers
      if (laserRef.current > 0 && frameRef.current % LASER_INTERVAL === 0) {
        lasersRef.current.push({ x: pLeft + 8, y: PADDLE_Y });
        lasersRef.current.push({ x: pRight - 8, y: PADDLE_Y });
      }
      for (let i = lasersRef.current.length - 1; i >= 0; i--) {
        const l = lasersRef.current[i];
        l.y -= 9;
        let hit = false;
        for (const brick of bricksRef.current) {
          if (!brick.alive || brick.steel) continue;
          if (
            l.x >= brick.x &&
            l.x <= brick.x + BRICK_W &&
            l.y <= brick.y + BRICK_H &&
            l.y >= brick.y
          ) {
            breakBrick(brick, l.x, l.y);
            hit = true;
            break;
          }
        }
        if (hit || l.y < 0) lasersRef.current.splice(i, 1);
      }

      // Balls
      const balls = ballsRef.current;
      for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        ball.x += ball.vx * slow;
        ball.y += ball.vy * slow;

        // trail
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 8) ball.trail.shift();

        // walls
        if (ball.x - BALL_R < 0) {
          ball.x = BALL_R;
          ball.vx = Math.abs(ball.vx);
        } else if (ball.x + BALL_R > CANVAS_W) {
          ball.x = CANVAS_W - BALL_R;
          ball.vx = -Math.abs(ball.vx);
        }
        if (ball.y - BALL_R < 0) {
          ball.y = BALL_R;
          ball.vy = Math.abs(ball.vy);
        }

        // paddle
        if (
          ball.vy > 0 &&
          ball.y + BALL_R >= PADDLE_Y &&
          ball.y - BALL_R <= PADDLE_Y + PADDLE_H &&
          ball.x >= pLeft - BALL_R &&
          ball.x <= pRight + BALL_R
        ) {
          const t = clamp((ball.x - paddleXRef.current) / (paddleW() / 2), -1, 1);
          setBallAngle(ball, t * MAX_BOUNCE, speed);
          ball.y = PADDLE_Y - BALL_R - 1;
          comboRef.current = 0;
          setCombo(0);
        }

        // bricks (one collision per ball per frame)
        for (const brick of bricksRef.current) {
          if (!brick.alive) continue;
          if (reflectBrick(ball, brick)) {
            if (!brick.steel) breakBrick(brick, ball.x, ball.y);
            break;
          }
        }

        // fell off bottom
        if (ball.y - BALL_R > CANVAS_H) balls.splice(i, 1);
      }

      // out of balls → lose a life
      if (balls.length === 0) {
        loseLife();
        return;
      }

      // Power-ups falling
      const pw = powerupsRef.current;
      for (let i = pw.length - 1; i >= 0; i--) {
        const p = pw[i];
        p.y += POWERUP_FALL;
        if (
          p.y + 10 >= PADDLE_Y &&
          p.y <= PADDLE_Y + PADDLE_H &&
          p.x >= pLeft - 10 &&
          p.x <= pRight + 10
        ) {
          applyPower(p.type);
          addParticles(p.x, p.y, POWERS[p.type].color, 12);
          pw.splice(i, 1);
        } else if (p.y > CANVAS_H + 20) {
          pw.splice(i, 1);
        }
      }

      // Particles
      const parts = particlesRef.current;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life--;
        if (p.life <= 0) parts.splice(i, 1);
      }

      // Level cleared?
      if (!bricksRef.current.some((b) => b.alive && !b.steel)) {
        scoreRef.current += 100;
        setScore(scoreRef.current);
        levelRef.current += 1;
        startLevel(levelRef.current);
      }
    }

    function roundRect(
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
    ) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    }

    function draw() {
      const shakeX = shakeRef.current > 0 ? (Math.random() - 0.5) * shakeRef.current : 0;
      const shakeY = shakeRef.current > 0 ? (Math.random() - 0.5) * shakeRef.current : 0;

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // Background
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, "#0b1020");
      grad.addColorStop(0.5, "#121633");
      grad.addColorStop(1, "#0a0f1f");
      ctx.fillStyle = grad;
      ctx.fillRect(-20, -20, CANVAS_W + 40, CANVAS_H + 40);

      // Stars
      for (const s of starsRef.current) {
        ctx.fillStyle = `rgba(255,255,255,${s.a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Level banner
      if (bannerRef.current > 0) {
        const a = Math.min(bannerRef.current / 60, 1);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = COL_HP1;
        ctx.font = "bold 40px 'Outfit', sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = COL_HP1;
        ctx.shadowBlur = 24;
        ctx.fillText(`LEVEL ${levelRef.current}`, CANVAS_W / 2, CANVAS_H / 2 - 30);
        ctx.restore();
      }

      // Bricks
      for (const brick of bricksRef.current) {
        if (!brick.alive) continue;
        const color = hpColor(brick.hp, brick.steel);
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = brick.steel ? 4 : 10;
        ctx.fillStyle = color;
        roundRect(brick.x, brick.y, BRICK_W, BRICK_H, 4);
        ctx.fill();
        // top highlight
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        roundRect(brick.x + 2, brick.y + 2, BRICK_W - 4, 4, 2);
        ctx.fill();
        ctx.restore();
      }

      // Particles
      for (const p of particlesRef.current) {
        ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.globalAlpha = 1;

      // Lasers
      for (const l of lasersRef.current) {
        ctx.save();
        ctx.shadowColor = POWERS.laser.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = POWERS.laser.color;
        ctx.fillRect(l.x - 1.5, l.y, 3, 12);
        ctx.restore();
      }

      // Power-ups
      for (const p of powerupsRef.current) {
        const cfg = POWERS[p.type];
        ctx.save();
        ctx.shadowColor = cfg.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = cfg.color;
        roundRect(p.x - 13, p.y - 9, 26, 18, 9);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#0b1020";
        ctx.font = "bold 13px 'Outfit', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(cfg.label, p.x, p.y + 1);
        ctx.restore();
      }
      ctx.textBaseline = "alphabetic";

      // Paddle
      const pw = paddleW();
      const px = paddleXRef.current - pw / 2;
      ctx.save();
      ctx.shadowColor = laserRef.current > 0 ? POWERS.laser.color : COL_PADDLE;
      ctx.shadowBlur = 16;
      const pg = ctx.createLinearGradient(px, PADDLE_Y, px, PADDLE_Y + PADDLE_H);
      const pc = laserRef.current > 0 ? POWERS.laser.color : COL_PADDLE;
      pg.addColorStop(0, "#ffffff");
      pg.addColorStop(0.35, pc);
      pg.addColorStop(1, pc);
      ctx.fillStyle = pg;
      roundRect(px, PADDLE_Y, pw, PADDLE_H, 7);
      ctx.fill();
      ctx.restore();

      // Balls + trails
      for (const ball of ballsRef.current) {
        for (let t = 0; t < ball.trail.length; t++) {
          const pt = ball.trail[t];
          ctx.globalAlpha = (t / ball.trail.length) * 0.4;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, BALL_R * (t / ball.trail.length), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.save();
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 14;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Ball-lost red flash
      if (flashRef.current > 0) {
        ctx.fillStyle = `rgba(255,80,80,${(flashRef.current / 16) * 0.25})`;
        ctx.fillRect(-20, -20, CANVAS_W + 40, CANVAS_H + 40);
      }

      ctx.restore();
    }

    function loop() {
      update();
      draw();
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [addParticles, applyPower, makeReadyBall, setBallAngle, startLevel]);

  // ── Render ───────────────────────────────────────────────────────────────

  const heart = "♥";

  return (
    <div className="flex flex-col items-center justify-center py-6 px-2 select-none">
      <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-1 font-display">
        Brick Blitz
      </h1>
      <p className="text-text-dim text-sm mb-4">
        Smash every brick. Catch the power-ups. Don&apos;t drop the ball.
      </p>

      {/* HUD */}
      <div
        className="flex items-center justify-between gap-2 mb-3 w-full"
        style={{ maxWidth: CANVAS_W * scale }}
      >
        <div className="flex flex-col items-start">
          <span className="text-[10px] uppercase tracking-wider text-text-dim">Score</span>
          <span className="text-lg font-bold text-teal tabular-nums leading-none">{score}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-wider text-text-dim">Level</span>
          <span className="text-lg font-bold text-purple tabular-nums leading-none">{level}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-wider text-text-dim">Best</span>
          <span className="text-lg font-bold text-amber tabular-nums leading-none">{best}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wider text-text-dim">Lives</span>
          <span className="text-lg font-bold text-coral leading-none">
            {lives > 5 ? `${heart}×${lives}` : heart.repeat(Math.max(lives, 0)) || "—"}
          </span>
        </div>
      </div>

      <div
        ref={wrapperRef}
        className="relative rounded-2xl overflow-hidden shadow-xl border-2 border-teal/30"
        style={{
          width: CANVAS_W * scale,
          height: CANVAS_H * scale,
          touchAction: "none",
        }}
        onPointerMove={(e) => movePaddleTo(e.clientX)}
        onPointerDown={(e) => {
          e.preventDefault();
          movePaddleTo(e.clientX);
          launch();
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ width: CANVAS_W * scale, height: CANVAS_H * scale, display: "block" }}
        />

        {/* Combo badge */}
        {displayState === "playing" && combo >= 5 && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-coral/90 text-white text-xs font-bold px-3 py-1 shadow-lg animate-fade-in"
            style={{ fontSize: 12 * scale + 4 }}
          >
            {comboMult()}× COMBO
          </div>
        )}

        {/* Idle overlay */}
        {displayState === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[2px]">
            <div className="rounded-2xl border border-teal/40 bg-[#0b1020]/80 px-8 py-7 text-center shadow-2xl">
              <p className="text-5xl mb-3">🧱</p>
              <p className="text-xl font-bold text-white mb-1">Brick Blitz</p>
              <p className="text-sm text-teal mb-4">Move with mouse or arrow keys</p>
              <button
                className="rounded-full bg-teal px-6 py-2 text-sm font-bold text-[#0b1020] shadow-lg hover:brightness-110 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  launch();
                }}
              >
                Tap to start
              </button>
              {best > 0 && (
                <p className="mt-3 text-xs text-white/60">
                  Best: <span className="font-bold text-amber">{best}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Ready hint */}
        {displayState === "ready" && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <p className="text-sm font-semibold text-white/90 animate-fade-in">
              Tap or press Space to launch ↑
            </p>
          </div>
        )}

        {/* Game over overlay */}
        {displayState === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] animate-fade-in">
            <div className="rounded-2xl border border-teal/40 bg-[#0b1020]/85 px-8 py-7 text-center shadow-2xl">
              <p className="text-lg font-bold text-white mb-3">Game Over</p>
              <div className="flex gap-6 mb-2 justify-center">
                <div>
                  <p className="text-xs text-white/50">Score</p>
                  <p className="text-2xl font-bold text-teal">{score}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Level</p>
                  <p className="text-2xl font-bold text-purple">{level}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Best</p>
                  <p className="text-2xl font-bold text-amber">{best}</p>
                </div>
              </div>
              {score >= best && score > 0 && (
                <p className="text-xs font-bold text-amber mb-3">★ New best!</p>
              )}
              <button
                className="mt-2 rounded-full bg-teal px-6 py-2 text-sm font-bold text-[#0b1020] shadow-lg hover:brightness-110 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  launch();
                }}
              >
                Play again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Power-up legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-text-dim" style={{ maxWidth: CANVAS_W * scale }}>
        <span className="font-semibold text-text-muted">Power-ups:</span>
        <span><span style={{ color: POWERS.multi.color }}>✦</span> Multiball</span>
        <span><span style={{ color: POWERS.grow.color }}>↔</span> Wide</span>
        <span><span style={{ color: POWERS.slow.color }}>≈</span> Slow</span>
        <span><span style={{ color: POWERS.laser.color }}>▲</span> Laser</span>
        <span><span style={{ color: POWERS.life.color }}>♥</span> Life</span>
      </div>
    </div>
  );
}
