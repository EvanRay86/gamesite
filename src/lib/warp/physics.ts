// WARP — Physics Engine
// N-body gravity with Velocity Verlet integration, logarithmic scoring

import type { Vec2, GravBody, Projectile, Target, AimState } from "@/types/warp";

// ── Constants ────────────────────────────────────────────────────────────────

export const G = 800;            // gravitational constant (tuned for gameplay)
export const EPSILON = 8;        // softening parameter (prevents singularities)
export const DT = 1 / 60;        // base timestep
export const SUB_STEPS = 3;      // substeps per frame (effective dt = 1/180)
export const MAX_POWER = 12;     // max launch velocity magnitude
export const PROJ_RADIUS = 4;    // projectile collision radius
export const TRAIL_LEN = 80;     // max trail points
export const PREDICT_STEPS = 300; // trajectory preview steps
export const OOB_MARGIN = 250;   // out-of-bounds margin (px)

// ── Vec2 Helpers ─────────────────────────────────────────────────────────────

export const v2 = {
  add:   (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y }),
  sub:   (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y }),
  scale: (v: Vec2, s: number): Vec2 => ({ x: v.x * s, y: v.y * s }),
  dot:   (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y,
  len:   (v: Vec2): number => Math.sqrt(v.x * v.x + v.y * v.y),
  norm:  (v: Vec2): Vec2 => {
    const l = Math.sqrt(v.x * v.x + v.y * v.y);
    return l > 0 ? { x: v.x / l, y: v.y / l } : { x: 0, y: 0 };
  },
  dist:  (a: Vec2, b: Vec2): number => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2),
  lerp:  (a: Vec2, b: Vec2, t: number): Vec2 => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  }),
  rotate: (v: Vec2, angle: number): Vec2 => {
    const c = Math.cos(angle), s = Math.sin(angle);
    return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
  },
  zero: (): Vec2 => ({ x: 0, y: 0 }),
};

// ── Gravity ──────────────────────────────────────────────────────────────────

/** Sum gravitational acceleration at `pos` from all bodies. */
export function computeGravAccel(pos: Vec2, bodies: GravBody[]): Vec2 {
  let ax = 0, ay = 0;
  for (const b of bodies) {
    const dx = b.pos.x - pos.x;
    const dy = b.pos.y - pos.y;
    const r2 = dx * dx + dy * dy + EPSILON * EPSILON;       // softened distance²
    const r = Math.sqrt(r2);
    const force = G * b.mass / (r2 * r);                    // G·M / r³ (includes normalisation)
    ax += force * dx;
    ay += force * dy;
  }
  return { x: ax, y: ay };
}

// ── Velocity Verlet Integration ──────────────────────────────────────────────

/** Advance projectile one Verlet step. Mutates `proj` in place. */
export function verletStep(proj: Projectile, bodies: GravBody[], dt: number): void {
  // Position update: x_new = x + v·dt + ½·a·dt²
  proj.pos.x += proj.vel.x * dt + 0.5 * proj.accPrev.x * dt * dt;
  proj.pos.y += proj.vel.y * dt + 0.5 * proj.accPrev.y * dt * dt;

  // New acceleration at updated position
  const accNew = computeGravAccel(proj.pos, bodies);

  // Velocity update: v_new = v + ½·(a_old + a_new)·dt
  proj.vel.x += 0.5 * (proj.accPrev.x + accNew.x) * dt;
  proj.vel.y += 0.5 * (proj.accPrev.y + accNew.y) * dt;

  // Store for next step
  proj.accPrev = accNew;
}

// ── Collision Detection ──────────────────────────────────────────────────────

export type CollisionResult = "none" | "body" | "target" | "oob";

export function checkCollisions(
  proj: Projectile,
  bodies: GravBody[],
  target: Target,
  bounds: { w: number; h: number },
): CollisionResult {
  // Target hit (generous radius for satisfying feel)
  if (v2.dist(proj.pos, target.pos) < target.radius + PROJ_RADIUS) return "target";

  // Body collision
  for (const b of bodies) {
    const hitRadius = b.type === "blackhole" ? b.radius * 0.5 : b.radius + PROJ_RADIUS;
    if (v2.dist(proj.pos, b.pos) < hitRadius) return "body";
  }

  // Out of bounds
  if (
    proj.pos.x < -OOB_MARGIN || proj.pos.x > bounds.w + OOB_MARGIN ||
    proj.pos.y < -OOB_MARGIN || proj.pos.y > bounds.h + OOB_MARGIN
  ) return "oob";

  return "none";
}

// ── Trajectory Prediction ────────────────────────────────────────────────────

/** Forward-simulate and return sampled positions for the dotted preview line. */
export function predictTrajectory(
  startPos: Vec2,
  startVel: Vec2,
  bodies: GravBody[],
  steps: number = PREDICT_STEPS,
  dt: number = DT / SUB_STEPS,
): Vec2[] {
  const path: Vec2[] = [];
  const sim: Projectile = {
    pos: { ...startPos },
    vel: { ...startVel },
    accPrev: computeGravAccel(startPos, bodies),
    alive: true,
    trail: [],
  };

  for (let i = 0; i < steps; i++) {
    verletStep(sim, bodies, dt);
    if (i % 3 === 0) path.push({ ...sim.pos }); // sample every 3rd step

    // Stop if it would collide with a body
    for (const b of bodies) {
      const hitR = b.type === "blackhole" ? b.radius * 0.5 : b.radius;
      if (v2.dist(sim.pos, b.pos) < hitR) return path;
    }
  }
  return path;
}

// ── Launch Velocity ──────────────────────────────────────────────────────────

/** Convert aim drag into launch velocity (slingshot: drag back → launch forward). */
export function calcLaunchVelocity(aim: AimState): Vec2 {
  return {
    x: -aim.power * Math.cos(aim.angle),
    y: -aim.power * Math.sin(aim.angle),
  };
}

// ── Scoring (logarithmic) ────────────────────────────────────────────────────

/** Logarithmic score: perfect par = 1000, degrades with ln(shots/par). */
export function calcScore(shots: number, par: number): number {
  if (shots <= 0 || par <= 0) return 0;
  return Math.max(0, Math.floor(1000 - 200 * Math.log(shots / par)));
}

/** Star rating: 3★ = at/under par, 2★ = par+1, 1★ = par+2+, 0★ = impossible (always at least 1). */
export function calcStars(shots: number, par: number): number {
  if (shots <= par) return 3;
  if (shots <= par + 1) return 2;
  return 1;
}

// ── Projectile Factory ───────────────────────────────────────────────────────

export function createProjectile(pos: Vec2, vel: Vec2, bodies: GravBody[]): Projectile {
  return {
    pos: { ...pos },
    vel: { ...vel },
    accPrev: computeGravAccel(pos, bodies),
    alive: true,
    trail: [{ ...pos }],
  };
}
