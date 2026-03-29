"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ── Constants ────────────────────────────────────────────────────────────────

const CANVAS_W = 360;
const CANVAS_H = 640;
const GRAVITY = 0.45;
const FLAP_FORCE = -7.5;
const PIPE_WIDTH = 56;
const PIPE_GAP = 150;
const PIPE_SPEED = 2.5;
const PIPE_SPAWN_INTERVAL = 100; // frames
const BIRD_RADIUS = 16;
const GROUND_H = 60;
const SAVE_KEY = "sky-hopper-best";

// Colors
const SKY_TOP = "#87CEEB";
const SKY_BOTTOM = "#E0F7FA";
const PIPE_COLOR = "#4CAF50";
const PIPE_HIGHLIGHT = "#66BB6A";
const PIPE_SHADOW = "#388E3C";
const PIPE_CAP_COLOR = "#43A047";
const GROUND_COLOR = "#8B6914";
const GROUND_STRIPE = "#A0781E";
const GROUND_GRASS = "#4CAF50";
const BIRD_BODY = "#F7B731";
const BIRD_WING = "#FF9800";
const BIRD_EYE_WHITE = "#FFFFFF";
const BIRD_EYE_PUPIL = "#333333";
const BIRD_BEAK = "#FF5722";
const CLOUD_COLOR = "rgba(255,255,255,0.8)";

// ── Types ────────────────────────────────────────────────────────────────────

interface Bird {
  x: number;
  y: number;
  vy: number;
  rotation: number;
  wingPhase: number;
}

interface Pipe {
  x: number;
  topH: number; // height of top pipe
  scored: boolean;
}

interface Cloud {
  x: number;
  y: number;
  w: number;
  speed: number;
}

type GameState = "idle" | "playing" | "dead";

// ── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SkyHopper() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const frameRef = useRef(0);

  const stateRef = useRef<GameState>("idle");
  const scoreRef = useRef(0);
  const bestRef = useRef(0);

  const birdRef = useRef<Bird>({
    x: CANVAS_W * 0.3,
    y: CANVAS_H / 2,
    vy: 0,
    rotation: 0,
    wingPhase: 0,
  });
  const pipesRef = useRef<Pipe[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const groundOffsetRef = useRef(0);

  const [displayState, setDisplayState] = useState<GameState>("idle");
  const [displayScore, setDisplayScore] = useState(0);
  const [displayBest, setDisplayBest] = useState(0);
  const [scale, setScale] = useState(1);

  // Load best score
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const n = parseInt(saved, 10);
        bestRef.current = n;
        setDisplayBest(n);
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
      const maxH = window.innerHeight - 180;
      const s = Math.min(maxW / CANVAS_W, maxH / CANVAS_H, 1);
      setScale(s);
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Init clouds
  useEffect(() => {
    const c: Cloud[] = [];
    for (let i = 0; i < 5; i++) {
      c.push({
        x: Math.random() * CANVAS_W,
        y: 30 + Math.random() * 200,
        w: 40 + Math.random() * 60,
        speed: 0.3 + Math.random() * 0.4,
      });
    }
    cloudsRef.current = c;
  }, []);

  const resetGame = useCallback(() => {
    birdRef.current = {
      x: CANVAS_W * 0.3,
      y: CANVAS_H / 2,
      vy: 0,
      rotation: 0,
      wingPhase: 0,
    };
    pipesRef.current = [];
    scoreRef.current = 0;
    frameRef.current = 0;
    groundOffsetRef.current = 0;
    setDisplayScore(0);
  }, []);

  const flap = useCallback(() => {
    const state = stateRef.current;
    if (state === "idle") {
      resetGame();
      stateRef.current = "playing";
      setDisplayState("playing");
      birdRef.current.vy = FLAP_FORCE;
    } else if (state === "playing") {
      birdRef.current.vy = FLAP_FORCE;
    } else if (state === "dead") {
      // restart after short delay handled by timeout
      resetGame();
      stateRef.current = "playing";
      setDisplayState("playing");
      birdRef.current.vy = FLAP_FORCE;
    }
  }, [resetGame]);

  // Input handlers
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        flap();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flap]);

  // Drawing functions
  const drawBird = useCallback((ctx: CanvasRenderingContext2D, bird: Bird) => {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);

    // Wing
    const wingFlap = Math.sin(bird.wingPhase) * 8;
    ctx.fillStyle = BIRD_WING;
    ctx.beginPath();
    ctx.ellipse(-2, wingFlap - 2, 12, 7, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = BIRD_BODY;
    ctx.beginPath();
    ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Eye white
    ctx.fillStyle = BIRD_EYE_WHITE;
    ctx.beginPath();
    ctx.arc(8, -5, 7, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = BIRD_EYE_PUPIL;
    ctx.beginPath();
    ctx.arc(10, -5, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = BIRD_BEAK;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(24, 2);
    ctx.lineTo(14, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }, []);

  const drawPipe = useCallback(
    (ctx: CanvasRenderingContext2D, pipe: Pipe) => {
      const playH = CANVAS_H - GROUND_H;
      const bottomY = pipe.topH + PIPE_GAP;
      const bottomH = playH - bottomY;
      const capH = 24;
      const capOverhang = 4;

      // Top pipe body
      ctx.fillStyle = PIPE_COLOR;
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topH);
      // highlight
      ctx.fillStyle = PIPE_HIGHLIGHT;
      ctx.fillRect(pipe.x + 4, 0, 8, pipe.topH);
      // shadow
      ctx.fillStyle = PIPE_SHADOW;
      ctx.fillRect(pipe.x + PIPE_WIDTH - 8, 0, 8, pipe.topH);
      // Top pipe cap
      ctx.fillStyle = PIPE_CAP_COLOR;
      ctx.fillRect(
        pipe.x - capOverhang,
        pipe.topH - capH,
        PIPE_WIDTH + capOverhang * 2,
        capH
      );
      ctx.fillStyle = PIPE_HIGHLIGHT;
      ctx.fillRect(pipe.x - capOverhang, pipe.topH - capH, 6, capH);

      // Bottom pipe body
      ctx.fillStyle = PIPE_COLOR;
      ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, bottomH);
      ctx.fillStyle = PIPE_HIGHLIGHT;
      ctx.fillRect(pipe.x + 4, bottomY, 8, bottomH);
      ctx.fillStyle = PIPE_SHADOW;
      ctx.fillRect(pipe.x + PIPE_WIDTH - 8, bottomY, 8, bottomH);
      // Bottom pipe cap
      ctx.fillStyle = PIPE_CAP_COLOR;
      ctx.fillRect(
        pipe.x - capOverhang,
        bottomY,
        PIPE_WIDTH + capOverhang * 2,
        capH
      );
      ctx.fillStyle = PIPE_HIGHLIGHT;
      ctx.fillRect(pipe.x - capOverhang, bottomY, 6, capH);
    },
    []
  );

  const drawGround = useCallback(
    (ctx: CanvasRenderingContext2D, offset: number) => {
      const y = CANVAS_H - GROUND_H;
      // Grass strip
      ctx.fillStyle = GROUND_GRASS;
      ctx.fillRect(0, y, CANVAS_W, 8);
      // Dirt
      ctx.fillStyle = GROUND_COLOR;
      ctx.fillRect(0, y + 8, CANVAS_W, GROUND_H - 8);
      // Stripes
      ctx.fillStyle = GROUND_STRIPE;
      const stripeW = 24;
      const totalStripes = Math.ceil(CANVAS_W / stripeW) + 2;
      const startX = -(offset % (stripeW * 2));
      for (let i = 0; i < totalStripes; i++) {
        if (i % 2 === 0) {
          ctx.fillRect(startX + i * stripeW, y + 8, stripeW, 4);
        }
      }
    },
    []
  );

  const drawCloud = useCallback(
    (ctx: CanvasRenderingContext2D, cloud: Cloud) => {
      ctx.fillStyle = CLOUD_COLOR;
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.w * 0.3, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.w * 0.25, cloud.y - cloud.w * 0.1, cloud.w * 0.25, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.w * 0.5, cloud.y, cloud.w * 0.3, 0, Math.PI * 2);
      ctx.fill();
    },
    []
  );

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    function loop() {
      const state = stateRef.current;
      const bird = birdRef.current;
      const pipes = pipesRef.current;
      const clouds = cloudsRef.current;

      // ── Update ──
      // Clouds always move
      for (const c of clouds) {
        c.x -= c.speed;
        if (c.x + c.w < 0) {
          c.x = CANVAS_W + c.w;
          c.y = 30 + Math.random() * 200;
        }
      }

      if (state === "idle") {
        // Gentle bob
        bird.y = CANVAS_H / 2 + Math.sin(frameRef.current * 0.05) * 12;
        bird.wingPhase += 0.15;
        bird.rotation = 0;
        frameRef.current++;
      } else if (state === "playing") {
        frameRef.current++;

        // Bird physics
        bird.vy += GRAVITY;
        bird.y += bird.vy;
        bird.wingPhase += 0.3;
        bird.rotation = clamp(bird.vy * 0.06, -0.5, Math.PI / 2);

        // Ground scroll
        groundOffsetRef.current += PIPE_SPEED;

        // Spawn pipes
        if (frameRef.current % PIPE_SPAWN_INTERVAL === 0) {
          const playH = CANVAS_H - GROUND_H;
          const minTop = 60;
          const maxTop = playH - PIPE_GAP - 60;
          const topH = minTop + Math.random() * (maxTop - minTop);
          pipes.push({ x: CANVAS_W, topH, scored: false });
        }

        // Move pipes & score
        for (let i = pipes.length - 1; i >= 0; i--) {
          const p = pipes[i];
          p.x -= PIPE_SPEED;

          // Score
          if (!p.scored && p.x + PIPE_WIDTH < bird.x) {
            p.scored = true;
            scoreRef.current++;
            setDisplayScore(scoreRef.current);
          }

          // Remove off-screen
          if (p.x + PIPE_WIDTH < -10) {
            pipes.splice(i, 1);
          }
        }

        // Collision detection
        const playH = CANVAS_H - GROUND_H;

        // Ground / ceiling
        if (bird.y + BIRD_RADIUS > playH || bird.y - BIRD_RADIUS < 0) {
          bird.y = clamp(bird.y, BIRD_RADIUS, playH - BIRD_RADIUS);
          die();
        }

        // Pipes (circle-rect collision)
        for (const p of pipes) {
          const bx = bird.x;
          const by = bird.y;
          const br = BIRD_RADIUS - 2; // slight forgiveness

          // Check top pipe
          if (
            bx + br > p.x &&
            bx - br < p.x + PIPE_WIDTH &&
            by - br < p.topH
          ) {
            die();
            break;
          }
          // Check bottom pipe
          const bottomY = p.topH + PIPE_GAP;
          if (
            bx + br > p.x &&
            bx - br < p.x + PIPE_WIDTH &&
            by + br > bottomY
          ) {
            die();
            break;
          }
        }
      } else if (state === "dead") {
        // Bird falls
        bird.vy += GRAVITY;
        bird.y += bird.vy;
        const playH = CANVAS_H - GROUND_H;
        if (bird.y + BIRD_RADIUS > playH) {
          bird.y = playH - BIRD_RADIUS;
          bird.vy = 0;
        }
        bird.rotation = Math.PI / 2;
      }

      // ── Draw ──
      // Sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, SKY_TOP);
      grad.addColorStop(1, SKY_BOTTOM);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Clouds
      for (const c of clouds) drawCloud(ctx, c);

      // Pipes
      for (const p of pipes) drawPipe(ctx, p);

      // Ground
      drawGround(ctx, groundOffsetRef.current);

      // Bird
      drawBird(ctx, bird);

      // Score (during play)
      if (state === "playing") {
        ctx.save();
        ctx.font = "bold 48px 'Outfit', sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fillText(String(scoreRef.current), CANVAS_W / 2 + 2, 72);
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.lineWidth = 3;
        ctx.strokeText(String(scoreRef.current), CANVAS_W / 2, 70);
        ctx.fillText(String(scoreRef.current), CANVAS_W / 2, 70);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    function die() {
      if (stateRef.current !== "playing") return;
      stateRef.current = "dead";
      setDisplayState("dead");
      if (scoreRef.current > bestRef.current) {
        bestRef.current = scoreRef.current;
        setDisplayBest(bestRef.current);
        try {
          localStorage.setItem(SAVE_KEY, String(bestRef.current));
        } catch {}
      }
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [drawBird, drawPipe, drawGround, drawCloud]);

  return (
    <div className="flex flex-col items-center justify-center py-6 px-2 select-none">
      <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-1 font-display">
        Sky Hopper
      </h1>
      <p className="text-text-dim text-sm mb-4">
        Tap or press Space to flap!
      </p>

      <div
        ref={wrapperRef}
        className="relative rounded-2xl overflow-hidden shadow-xl border-2 border-sky/30"
        style={{
          width: CANVAS_W * scale,
          height: CANVAS_H * scale,
          touchAction: "none",
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          flap();
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            width: CANVAS_W * scale,
            height: CANVAS_H * scale,
            display: "block",
          }}
        />

        {/* Idle overlay */}
        {displayState === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-6 text-center shadow-lg">
              <p className="text-4xl mb-2">🐦</p>
              <p className="text-lg font-bold text-text-primary mb-1">
                Ready to hop?
              </p>
              <p className="text-sm text-text-dim mb-3">
                Tap anywhere or press Space
              </p>
              {displayBest > 0 && (
                <p className="text-xs text-text-dim">
                  Best: <span className="font-bold text-sky">{displayBest}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Death overlay */}
        {displayState === "dead" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 animate-fade-in">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-6 text-center shadow-lg">
              <p className="text-lg font-bold text-text-primary mb-2">
                Game Over
              </p>
              <div className="flex gap-6 mb-3">
                <div>
                  <p className="text-xs text-text-dim">Score</p>
                  <p className="text-2xl font-bold text-sky">{displayScore}</p>
                </div>
                <div>
                  <p className="text-xs text-text-dim">Best</p>
                  <p className="text-2xl font-bold text-amber">{displayBest}</p>
                </div>
              </div>
              <p className="text-xs text-text-dim">Tap to play again</p>
            </div>
          </div>
        )}
      </div>

      {/* Score display below canvas */}
      {displayState === "playing" && (
        <div className="mt-3 text-center">
          <span className="text-sm text-text-dim mr-4">
            Score: <span className="font-bold text-sky">{displayScore}</span>
          </span>
          <span className="text-sm text-text-dim">
            Best: <span className="font-bold text-amber">{displayBest}</span>
          </span>
        </div>
      )}
    </div>
  );
}
