// WARP — Canvas Renderer
// Space-themed visuals with logarithmic spirals, exponential decay trails, and glow effects

import type { Vec2, GravBody, Projectile, Target, AimState, Particle, GamePhase } from "@/types/warp";

// ── Starfield (generated once per level) ─────────────────────────────────────

export interface Star { x: number; y: number; size: number; twinkleOffset: number }

export function generateStarfield(w: number, h: number, count = 120): Star[] {
  const stars: Star[] = [];
  // Seeded-ish random via simple hash so stars are stable per session
  let seed = 42;
  const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rand() * w,
      y: rand() * h,
      size: rand() * 1.8 + 0.4,
      twinkleOffset: rand() * Math.PI * 2,
    });
  }
  return stars;
}

// ── Background ───────────────────────────────────────────────────────────────

export function drawBackground(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  stars: Star[], frame: number,
) {
  // Deep space gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#06060F");
  grad.addColorStop(0.5, "#0A0A1A");
  grad.addColorStop(1, "#080818");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Twinkling stars
  for (const s of stars) {
    const alpha = 0.4 + 0.5 * Math.sin(frame * 0.015 + s.twinkleOffset);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Gravitational Bodies ─────────────────────────────────────────────────────

export function drawGravBody(
  ctx: CanvasRenderingContext2D, body: GravBody, frame: number,
) {
  const { x, y } = body.pos;
  const r = body.radius;

  if (body.type === "planet") {
    // Atmosphere ring
    ctx.strokeStyle = body.color + "40";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r + 4, 0, Math.PI * 2);
    ctx.stroke();

    // Planet body with radial gradient
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    grad.addColorStop(0, body.color);
    grad.addColorStop(1, body.color + "88");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

  } else if (body.type === "star") {
    // Outer glow (pulsing)
    const glowR = r + 8 + 4 * Math.sin(frame * 0.03);
    const glow = ctx.createRadialGradient(x, y, r * 0.5, x, y, glowR);
    glow.addColorStop(0, "#FFFDE880");
    glow.addColorStop(0.6, "#FFF5CC30");
    glow.addColorStop(1, "#FFF5CC00");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fill();

    // Star body
    const core = ctx.createRadialGradient(x, y, 0, x, y, r);
    core.addColorStop(0, "#FFFFFF");
    core.addColorStop(0.4, "#FFFDE8");
    core.addColorStop(1, "#F7B731");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Sparkle cross
    ctx.strokeStyle = "#FFFFFF60";
    ctx.lineWidth = 1;
    const sparkleR = r + 6 + 3 * Math.sin(frame * 0.05);
    ctx.beginPath();
    ctx.moveTo(x - sparkleR, y); ctx.lineTo(x + sparkleR, y);
    ctx.moveTo(x, y - sparkleR); ctx.lineTo(x, y + sparkleR);
    ctx.stroke();

  } else if (body.type === "blackhole") {
    // Logarithmic spiral accretion disk: r = a · e^(b·θ)
    const a = r * 0.6;
    const b = 0.12;
    const spiralOffset = frame * 0.02;
    for (let arm = 0; arm < 3; arm++) {
      ctx.beginPath();
      const armOffset = (arm * Math.PI * 2) / 3;
      for (let t = 0; t < 20; t += 0.3) {
        const theta = t + spiralOffset + armOffset;
        const sr = a * Math.exp(b * t);   // logarithmic spiral equation
        if (sr > r * 2.5) break;
        const sx = x + sr * Math.cos(theta);
        const sy = y + sr * Math.sin(theta);
        if (t === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      const alpha = 0.3 + 0.15 * Math.sin(frame * 0.04 + arm);
      ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Event horizon (dark core)
    const dark = ctx.createRadialGradient(x, y, 0, x, y, r * 0.7);
    dark.addColorStop(0, "#000000");
    dark.addColorStop(0.7, "#0A001A");
    dark.addColorStop(1, "#1A002880");
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Outer distortion ring
    ctx.strokeStyle = "#A855F720";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ── Gravity Field Indicators ─────────────────────────────────────────────────

export function drawGravityField(
  ctx: CanvasRenderingContext2D, bodies: GravBody[], frame: number,
) {
  ctx.save();
  ctx.setLineDash([4, 8]);
  for (const b of bodies) {
    // Logarithmic radius rings: r = base · 2^n
    for (let n = 1; n <= 3; n++) {
      const ringR = b.radius * Math.pow(2, n);
      const alpha = 0.06 / n; // fade with distance
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(b.pos.x, b.pos.y, ringR, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ── Projectile + Trail ───────────────────────────────────────────────────────

export function drawProjectile(
  ctx: CanvasRenderingContext2D, proj: Projectile, frame: number,
) {
  // Trail with exponential alpha decay: alpha = e^(-0.05·i)
  for (let i = 0; i < proj.trail.length; i++) {
    const age = proj.trail.length - 1 - i;
    const alpha = Math.exp(-0.05 * age);      // exponential decay
    const size = 3 * alpha + 0.5;
    ctx.fillStyle = `rgba(78, 205, 196, ${alpha * 0.8})`;
    ctx.beginPath();
    ctx.arc(proj.trail[i].x, proj.trail[i].y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Projectile core glow
  const glow = ctx.createRadialGradient(
    proj.pos.x, proj.pos.y, 0,
    proj.pos.x, proj.pos.y, 10,
  );
  glow.addColorStop(0, "#FFFFFF");
  glow.addColorStop(0.3, "#4ECDC4");
  glow.addColorStop(1, "#4ECDC400");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(proj.pos.x, proj.pos.y, 10, 0, Math.PI * 2);
  ctx.fill();

  // Bright center
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(proj.pos.x, proj.pos.y, 3, 0, Math.PI * 2);
  ctx.fill();
}

// ── Target ───────────────────────────────────────────────────────────────────

export function drawTarget(
  ctx: CanvasRenderingContext2D, target: Target, frame: number,
) {
  const { x, y } = target.pos;
  const r = target.radius;
  const pulse = 1 + 0.15 * Math.sin(frame * 0.04);

  // Outer glow
  const glow = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * pulse * 1.5);
  glow.addColorStop(0, "#22C55E30");
  glow.addColorStop(1, "#22C55E00");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * pulse * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Outer ring
  ctx.strokeStyle = "#22C55E80";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r * pulse, 0, Math.PI * 2);
  ctx.stroke();

  // Inner ring
  ctx.strokeStyle = "#22C55EB0";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, r * pulse * 0.6, 0, Math.PI * 2);
  ctx.stroke();

  // Center dot
  ctx.fillStyle = "#22C55E";
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();
}

// ── Aim Line + Trajectory Preview ────────────────────────────────────────────

export function drawAimLine(
  ctx: CanvasRenderingContext2D,
  launchPos: Vec2,
  aim: AimState,
  predictedPath: Vec2[],
) {
  if (!aim.dragging || aim.power < 0.3) return;

  // Direction line (opposite of drag = launch direction)
  const dirLen = aim.power * 15;
  const endX = launchPos.x - dirLen * Math.cos(aim.angle);
  const endY = launchPos.y - dirLen * Math.sin(aim.angle);

  ctx.strokeStyle = "#FFFFFF60";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(launchPos.x, launchPos.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Power indicator (small filled arc)
  const powerFrac = aim.power / 12;
  ctx.strokeStyle = powerFrac > 0.8 ? "#FF6B6B" : powerFrac > 0.5 ? "#F7B731" : "#22C55E";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(launchPos.x, launchPos.y, 18, 0, Math.PI * 2 * powerFrac);
  ctx.stroke();

  // Predicted trajectory (dotted)
  if (predictedPath.length > 1) {
    ctx.save();
    ctx.setLineDash([3, 6]);
    ctx.strokeStyle = "#4ECDC440";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(predictedPath[0].x, predictedPath[0].y);
    for (let i = 1; i < predictedPath.length; i++) {
      // Fade alpha with distance along path
      const alpha = Math.exp(-0.02 * i);
      if (alpha < 0.05) break;
      ctx.lineTo(predictedPath[i].x, predictedPath[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }
}

// ── Launch Point Indicator ───────────────────────────────────────────────────

export function drawLaunchPoint(
  ctx: CanvasRenderingContext2D, pos: Vec2, frame: number,
) {
  const pulse = 1 + 0.2 * Math.sin(frame * 0.05);
  ctx.strokeStyle = "#FFFFFF40";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 12 * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
  ctx.fill();
}

// ── Particles ────────────────────────────────────────────────────────────────

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    const size = p.size * alpha;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Success Effect ───────────────────────────────────────────────────────────

export function drawSuccessRing(
  ctx: CanvasRenderingContext2D, pos: Vec2, frame: number, startFrame: number,
) {
  const elapsed = frame - startFrame;
  const ringR = elapsed * 3;
  const alpha = Math.max(0, 1 - elapsed / 40);
  if (alpha <= 0) return;

  ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`;
  ctx.lineWidth = 3 * alpha;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, ringR, 0, Math.PI * 2);
  ctx.stroke();

  // Second ring, delayed
  if (elapsed > 8) {
    const r2 = (elapsed - 8) * 3;
    const a2 = Math.max(0, 1 - (elapsed - 8) / 40);
    ctx.strokeStyle = `rgba(78, 205, 196, ${a2})`;
    ctx.lineWidth = 2 * a2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ── HUD ──────────────────────────────────────────────────────────────────────

export function drawHUD(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  levelName: string, levelId: number,
  shots: number, par: number,
  phase: GamePhase,
) {
  ctx.save();
  ctx.font = "bold 14px 'Space Grotesk', monospace";

  // Top-left: level
  ctx.fillStyle = "#FFFFFF80";
  ctx.textAlign = "left";
  ctx.fillText(`Level ${levelId}`, 16, 28);
  ctx.font = "12px 'Space Grotesk', monospace";
  ctx.fillStyle = "#FFFFFF50";
  ctx.fillText(levelName, 16, 46);

  // Top-right: shots / par
  ctx.font = "bold 14px 'Space Grotesk', monospace";
  ctx.textAlign = "right";
  ctx.fillStyle = "#FFFFFF80";
  ctx.fillText(`Shots: ${shots}  |  Par: ${par}`, w - 16, 28);

  // Aiming hint
  if (phase === "aiming" && shots === 0) {
    ctx.font = "13px 'Space Grotesk', monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF30";
    ctx.fillText("Click & drag from the launch point to aim", w / 2, h - 20);
  }

  ctx.restore();
}
